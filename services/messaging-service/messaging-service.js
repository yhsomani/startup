/**
 * TalentSphere Messaging System
 * Real-time messaging backend with WebSockets, message storage, and group messaging
 */

const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class MessagingService extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            port: options.port || process.env.MESSAGING_PORT || 8081,
            path: options.path || '/ws/messages',
            maxPayload: options.maxPayload || 1024 * 1024, // 1MB
            messageRetentionDays: options.messageRetentionDays || 30,
            maxMessageLength: options.maxMessageLength || 10000, // 10KB
            enableAttachments: options.enableAttachments !== false,
            maxAttachmentSize: options.maxAttachmentSize || 10 * 1024 * 1024, // 10MB
            ...options
        };

        this.clients = new Map(); // clientId -> {ws, userId, connectedAt, rooms}
        this.rooms = new Map(); // roomId -> {id, name, participants, type}
        this.messages = new Map(); // messageId -> message object
        this.userConversations = new Map(); // userId -> [conversationIds]
        this.conversationHistory = new Map(); // conversationId -> [messageIds]

        this.server = null;
        this.wss = null;
    }

    /**
     * Initialize the WebSocket server
     */
    async initialize() {
        const server = http.createServer();
        this.wss = new WebSocket.Server({
            server,
            path: this.options.path,
            maxPayload: this.options.maxPayload
        });

        this.wss.on('connection', (ws, request) => {
            const clientId = uuidv4();
            this.clients.set(clientId, {
                ws,
                userId: null,
                connectedAt: new Date(),
                rooms: new Set()
            });

            // Handle incoming messages
            ws.on('message', (data) => {
                this.handleMessage(clientId, data);
            });

            // Handle client disconnect
            ws.on('close', () => {
                this.handleDisconnect(clientId);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error);
                this.emit('error', { clientId, error });
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                timestamp: new Date().toISOString()
            }));

            this.emit('clientConnected', { clientId, request });
        });

        this.server = server;
        await new Promise((resolve) => {
            this.server.listen(this.options.port, () => {
                console.log(`Messaging server listening on port ${this.options.port}`);
                resolve();
            });
        });
    }

    /**
     * Handle incoming messages from clients
     */
    handleMessage(clientId, data) {
        try {
            const message = JSON.parse(data);
            const client = this.clients.get(clientId);

            if (!client) {return;}

            switch (message.type) {
                case 'authenticate':
                    this.handleAuthentication(clientId, message.payload);
                    break;
                case 'joinRoom':
                    this.handleJoinRoom(clientId, message.roomId);
                    break;
                case 'leaveRoom':
                    this.handleLeaveRoom(clientId, message.roomId);
                    break;
                case 'sendMessage':
                    this.handleSendMessage(clientId, message.payload);
                    break;
                case 'createConversation':
                    this.handleCreateConversation(clientId, message.payload);
                    break;
                case 'markAsRead':
                    this.handleMarkAsRead(clientId, message.messageId);
                    break;
                case 'typing':
                    this.handleTypingIndicator(clientId, message.payload);
                    break;
                case 'ping':
                    client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;
                default:
                    this.emit('message', { clientId, message });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format',
                    timestamp: new Date().toISOString()
                }));
            }
        }
    }

    /**
     * Handle client authentication
     */
    handleAuthentication(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client) {return;}

        const { userId, token } = payload;

        if (userId) {
            client.userId = userId;

            // Update user conversations
            if (!this.userConversations.has(userId)) {
                this.userConversations.set(userId, new Set());
            }

            client.ws.send(JSON.stringify({
                type: 'authenticated',
                userId,
                timestamp: new Date().toISOString()
            }));
        } else {
            client.ws.send(JSON.stringify({
                type: 'authFailed',
                message: 'Authentication failed',
                timestamp: new Date().toISOString()
            }));
        }
    }

    /**
     * Handle joining a room
     */
    handleJoinRoom(clientId, roomId) {
        const client = this.clients.get(clientId);
        if (!client || !client.userId) {
            return;
        }

        // Check if user has access to the room
        if (this.userHasAccessToRoom(client.userId, roomId)) {
            client.rooms.add(roomId);

            // Add client to room
            if (!this.rooms.has(roomId)) {
                this.rooms.set(roomId, {
                    id: roomId,
                    participants: new Set([client.userId]),
                    createdAt: new Date(),
                    type: 'direct' // or 'group'
                });
            } else {
                const room = this.rooms.get(roomId);
                room.participants.add(client.userId);
            }

            client.ws.send(JSON.stringify({
                type: 'roomJoined',
                roomId,
                timestamp: new Date().toISOString()
            }));

            // Send recent messages for the room
            this.sendRecentMessages(client.ws, roomId);
        } else {
            client.ws.send(JSON.stringify({
                type: 'error',
                message: 'Access denied to room',
                timestamp: new Date().toISOString()
            }));
        }
    }

    /**
     * Handle leaving a room
     */
    handleLeaveRoom(clientId, roomId) {
        const client = this.clients.get(clientId);
        if (!client) {return;}

        client.rooms.delete(roomId);

        // Remove user from room participants
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.participants.delete(client.userId);

            if (room.participants.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        client.ws.send(JSON.stringify({
            type: 'roomLeft',
            roomId,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Check if user has access to a room
     */
    userHasAccessToRoom(userId, roomId) {
        // In a real implementation, this would check permissions
        // For now, we'll assume the user can access any room they request
        return true;
    }

    /**
     * Handle sending a message
     */
    handleSendMessage(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client || !client.userId) {
            return;
        }

        const { conversationId, content, messageType = 'text', attachments = [] } = payload;

        if (!conversationId || !content) {
            client.ws.send(JSON.stringify({
                type: 'error',
                message: 'conversationId and content are required',
                timestamp: new Date().toISOString()
            }));
            return;
        }

        // Validate message length
        if (content.length > this.options.maxMessageLength) {
            client.ws.send(JSON.stringify({
                type: 'error',
                message: `Message exceeds maximum length of ${this.options.maxMessageLength} characters`,
                timestamp: new Date().toISOString()
            }));
            return;
        }

        // Create message object
        const message = {
            id: uuidv4(),
            conversationId,
            senderId: client.userId,
            content,
            messageType,
            attachments: attachments.slice(0, 5), // Limit to 5 attachments
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        // Store message
        this.messages.set(message.id, message);

        // Add to conversation history
        if (!this.conversationHistory.has(conversationId)) {
            this.conversationHistory.set(conversationId, []);
        }
        this.conversationHistory.get(conversationId).push(message.id);

        // Add conversation to user's list
        if (!this.userConversations.has(client.userId)) {
            this.userConversations.set(client.userId, new Set());
        }
        this.userConversations.get(client.userId).add(conversationId);

        // Broadcast message to all participants in the conversation
        this.broadcastMessageToConversation(conversationId, {
            type: 'newMessage',
            message,
            timestamp: new Date().toISOString()
        });

        // Send confirmation to sender
        client.ws.send(JSON.stringify({
            type: 'messageSent',
            messageId: message.id,
            conversationId,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Handle creating a conversation
     */
    handleCreateConversation(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client || !client.userId) {
            return;
        }

        const { participants, type = 'direct', name } = payload;

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            client.ws.send(JSON.stringify({
                type: 'error',
                message: 'Participants array is required',
                timestamp: new Date().toISOString()
            }));
            return;
        }

        // Ensure the creator is in the participants list
        if (!participants.includes(client.userId)) {
            participants.push(client.userId);
        }

        const conversationId = uuidv4();

        // Create conversation object
        const conversation = {
            id: conversationId,
            name: name || `Conversation ${conversationId.substring(0, 8)}`,
            type, // 'direct' or 'group'
            participants,
            createdAt: new Date().toISOString(),
            createdBy: client.userId,
            lastMessage: null,
            unreadCounts: {}
        };

        // Initialize unread counts
        participants.forEach(userId => {
            conversation.unreadCounts[userId] = 0;
        });

        // Store conversation
        // In a real implementation, this would be stored in a database

        // Add conversation to each participant's list
        participants.forEach(userId => {
            if (!this.userConversations.has(userId)) {
                this.userConversations.set(userId, new Set());
            }
            this.userConversations.get(userId).add(conversationId);
        });

        // Notify all participants about the new conversation
        this.broadcastToUsers(participants, {
            type: 'conversationCreated',
            conversation,
            timestamp: new Date().toISOString()
        });

        client.ws.send(JSON.stringify({
            type: 'conversationCreated',
            conversation,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Handle marking messages as read
     */
    handleMarkAsRead(clientId, messageId) {
        const client = this.clients.get(clientId);
        if (!client || !client.userId) {
            return;
        }

        const message = this.messages.get(messageId);
        if (!message) {
            client.ws.send(JSON.stringify({
                type: 'error',
                message: 'Message not found',
                timestamp: new Date().toISOString()
            }));
            return;
        }

        // Update message status to read
        message.status = 'read';

        // In a real implementation, we would update unread counts
        // For now, we'll just send a confirmation
        client.ws.send(JSON.stringify({
            type: 'messageRead',
            messageId,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Handle typing indicator
     */
    handleTypingIndicator(clientId, payload) {
        const client = this.clients.get(clientId);
        if (!client || !client.userId) {
            return;
        }

        const { conversationId, isTyping } = payload;

        // Broadcast typing indicator to other participants
        this.broadcastToConversationExceptSender(conversationId, client.userId, {
            type: 'typingIndicator',
            senderId: client.userId,
            isTyping,
            conversationId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Broadcast message to all participants in a conversation
     */
    broadcastMessageToConversation(conversationId, message) {
        // Find all clients in this conversation
        for (const [clientId, client] of this.clients) {
            if (client.userId && this.userConversations.has(client.userId)) {
                const userConversations = this.userConversations.get(client.userId);
                if (userConversations.has(conversationId)) {
                    if (client.ws.readyState === WebSocket.OPEN) {
                        client.ws.send(JSON.stringify(message));
                    }
                }
            }
        }
    }

    /**
     * Broadcast to specific users
     */
    broadcastToUsers(userIds, message) {
        for (const [clientId, client] of this.clients) {
            if (client.userId && userIds.includes(client.userId)) {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.send(JSON.stringify(message));
                }
            }
        }
    }

    /**
     * Broadcast to conversation except sender
     */
    broadcastToConversationExceptSender(conversationId, senderId, message) {
        for (const [clientId, client] of this.clients) {
            if (client.userId && client.userId !== senderId && this.userConversations.has(client.userId)) {
                const userConversations = this.userConversations.get(client.userId);
                if (userConversations.has(conversationId)) {
                    if (client.ws.readyState === WebSocket.OPEN) {
                        client.ws.send(JSON.stringify(message));
                    }
                }
            }
        }
    }

    /**
     * Send recent messages to a WebSocket connection
     */
    sendRecentMessages(ws, roomId, limit = 50) {
        // In a real implementation, this would fetch recent messages for the room
        // For now, we'll send an empty message history
        const recentMessages = [];

        ws.send(JSON.stringify({
            type: 'recentMessages',
            roomId,
            messages: recentMessages,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Handle client disconnection
     */
    handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (!client) {return;}

        // Remove from all rooms
        for (const roomId of client.rooms) {
            if (this.rooms.has(roomId)) {
                const room = this.rooms.get(roomId);
                room.participants.delete(client.userId);

                if (room.participants.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        }

        // Remove client
        this.clients.delete(clientId);

        this.emit('clientDisconnected', { clientId });
    }

    /**
     * Get user's conversations
     */
    getUserConversations(userId) {
        if (!this.userConversations.has(userId)) {
            return [];
        }

        const conversationIds = Array.from(this.userConversations.get(userId));

        // In a real implementation, we would fetch conversation details from a database
        // For now, we'll return just the IDs
        return conversationIds.map(id => ({ id }));
    }

    /**
     * Get messages for a conversation
     */
    getConversationMessages(conversationId, options = {}) {
        const { limit = 50, offset = 0, since } = options;

        if (!this.conversationHistory.has(conversationId)) {
            return [];
        }

        const messageIds = this.conversationHistory.get(conversationId);
        const messages = [];

        for (let i = messageIds.length - 1 - offset; i >= 0 && messages.length < limit; i--) {
            const messageId = messageIds[i];
            const message = this.messages.get(messageId);

            if (message) {
                if (!since || new Date(message.timestamp) > new Date(since)) {
                    messages.push(message);
                }
            }
        }

        return messages.reverse(); // Return in chronological order
    }

    /**
     * Search messages
     */
    searchMessages(userId, query, options = {}) {
        const { limit = 20, offset = 0 } = options;
        const results = [];

        // Only search messages from conversations the user is part of
        const userConversations = this.userConversations.get(userId) || new Set();

        for (const [messageId, message] of this.messages) {
            if (userConversations.has(message.conversationId)) {
                if (message.content.toLowerCase().includes(query.toLowerCase())) {
                    if (results.length >= offset && results.length < offset + limit) {
                        results.push(message);
                    } else if (results.length >= offset + limit) {
                        break;
                    }
                }
            }
        }

        return results;
    }

    /**
     * Get user's unread message count
     */
    getUserUnreadCount(userId) {
        let count = 0;

        const userConversations = this.userConversations.get(userId) || new Set();

        for (const conversationId of userConversations) {
            // In a real implementation, we would check unread counts per conversation
            // For now, we'll just count all messages sent to this user
            if (this.conversationHistory.has(conversationId)) {
                const messageIds = this.conversationHistory.get(conversationId);
                for (const messageId of messageIds) {
                    const message = this.messages.get(messageId);
                    if (message && message.senderId !== userId) { // Messages from others
                        count++;
                    }
                }
            }
        }

        return count;
    }

    /**
     * Get connection statistics
     */
    getStats() {
        return {
            totalConnections: this.clients.size,
            totalConversations: this.userConversations.size,
            totalMessages: this.messages.size,
            activeRooms: this.rooms.size
        };
    }

    /**
     * Close the messaging service
     */
    async close() {
        if (this.wss) {
            this.wss.close();
        }

        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => resolve());
            });
        }
    }

    /**
     * Send a direct message between users
     */
    sendDirectMessage(senderId, recipientId, content, attachments = []) {
        // Create a conversation if one doesn't exist
        // In a real implementation, we would look up or create a direct conversation
        const conversationId = `direct_${senderId}_${recipientId}`;

        const message = {
            id: uuidv4(),
            conversationId,
            senderId,
            recipientId,
            content,
            messageType: 'text',
            attachments,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        // Store message
        this.messages.set(message.id, message);

        if (!this.conversationHistory.has(conversationId)) {
            this.conversationHistory.set(conversationId, []);
        }
        this.conversationHistory.get(conversationId).push(message.id);

        // Add conversation to both users' lists
        [senderId, recipientId].forEach(userId => {
            if (!this.userConversations.has(userId)) {
                this.userConversations.set(userId, new Set());
            }
            this.userConversations.get(userId).add(conversationId);
        });

        // Broadcast to recipient if online
        for (const [clientId, client] of this.clients) {
            if (client.userId === recipientId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                    type: 'newMessage',
                    message,
                    timestamp: new Date().toISOString()
                }));
            }
        }

        return message;
    }

    /**
     * Create a group conversation
     */
    createGroupConversation(creatorId, name, participants, options = {}) {
        const { description, avatar } = options;

        if (!participants.includes(creatorId)) {
            participants.push(creatorId);
        }

        const conversationId = uuidv4();

        const conversation = {
            id: conversationId,
            name,
            description: description || '',
            avatar: avatar || null,
            type: 'group',
            participants,
            createdAt: new Date().toISOString(),
            createdBy: creatorId,
            lastMessage: null,
            unreadCounts: {}
        };

        // Initialize unread counts
        participants.forEach(userId => {
            conversation.unreadCounts[userId] = 0;
        });

        // Add conversation to each participant's list
        participants.forEach(userId => {
            if (!this.userConversations.has(userId)) {
                this.userConversations.set(userId, new Set());
            }
            this.userConversations.get(userId).add(conversationId);
        });

        // In a real implementation, this would be stored in a database
        // For now, we'll just return the conversation object

        return conversation;
    }
}

module.exports = MessagingService;