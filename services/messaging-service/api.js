/**
 * TalentSphere Messaging Service API
 * REST API for messaging functionality
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const MessagingService = require('./messaging-service');

class MessagingAPI {
    constructor(messagingService) {
        this.messagingService = messagingService;
        this.app = express();

        // Middleware
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting for messaging endpoints
        const messageLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many messaging requests from this IP, please try again later.'
            }
        });

        this.app.use('/api/v1/messages', messageLimiter);
        this.app.use('/api/v1/conversations', messageLimiter);

        // API Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            const stats = this.messagingService.getStats();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'messaging-service',
                statistics: stats
            });
        });

        // Get user's conversations
        this.app.get('/api/v1/conversations', (req, res) => {
            try {
                const { userId } = req.query;

                if (!userId) {
                    return res.status(400).json({
                        success: false,
                        error: 'userId is required'
                    });
                }

                const conversations = this.messagingService.getUserConversations(userId);

                res.json({
                    success: true,
                    data: conversations,
                    count: conversations.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting conversations:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get conversations',
                    message: error.message
                });
            }
        });

        // Get messages for a conversation
        this.app.get('/api/v1/conversations/:conversationId/messages', (req, res) => {
            try {
                const { conversationId } = req.params;
                const { userId, limit, offset, since } = req.query;

                if (!userId) {
                    return res.status(400).json({
                        success: false,
                        error: 'userId is required'
                    });
                }

                const options = {
                    limit: limit ? parseInt(limit) : 50,
                    offset: offset ? parseInt(offset) : 0,
                    since: since || null
                };

                const messages = this.messagingService.getConversationMessages(conversationId, options);

                res.json({
                    success: true,
                    data: messages,
                    count: messages.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting messages:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get messages',
                    message: error.message
                });
            }
        });

        // Send a message
        this.app.post('/api/v1/messages', async (req, res) => {
            try {
                const { conversationId, content, senderId, messageType = 'text', attachments = [] } = req.body;

                if (!conversationId || !content || !senderId) {
                    return res.status(400).json({
                        success: false,
                        error: 'conversationId, content, and senderId are required'
                    });
                }

                // In a real implementation, we would authenticate the sender
                // For now, we'll proceed with the provided senderId

                // Use the messaging service to send the message
                // Since this is a REST API, we'll create a message object
                const message = {
                    id: require('uuid').v4(),
                    conversationId,
                    senderId,
                    content,
                    messageType,
                    attachments: attachments.slice(0, 5), // Limit to 5 attachments
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                };

                // Store the message in the service
                this.messagingService.messages.set(message.id, message);

                // Add to conversation history
                if (!this.messagingService.conversationHistory.has(conversationId)) {
                    this.messagingService.conversationHistory.set(conversationId, []);
                }
                this.messagingService.conversationHistory.get(conversationId).push(message.id);

                // Add conversation to sender's list
                if (!this.messagingService.userConversations.has(senderId)) {
                    this.messagingService.userConversations.set(senderId, new Set());
                }
                this.messagingService.userConversations.get(senderId).add(conversationId);

                // In a real implementation, we would broadcast to recipients via WebSocket
                // For now, we'll just return the message

                res.json({
                    success: true,
                    data: message,
                    message: 'Message sent successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to send message',
                    message: error.message
                });
            }
        });

        // Create a direct message conversation
        this.app.post('/api/v1/conversations/direct', (req, res) => {
            try {
                const { participants } = req.body;

                if (!participants || !Array.isArray(participants) || participants.length !== 2) {
                    return res.status(400).json({
                        success: false,
                        error: 'participants array with exactly 2 users is required'
                    });
                }

                // In a real implementation, we would check if a direct conversation already exists
                // For now, we'll just return a conversation object

                const conversation = {
                    id: require('uuid').v4(),
                    name: `Direct between ${participants[0]} and ${participants[1]}`,
                    type: 'direct',
                    participants,
                    createdAt: new Date().toISOString(),
                    lastMessage: null
                };

                // Add conversation to each participant's list
                participants.forEach(userId => {
                    if (!this.messagingService.userConversations.has(userId)) {
                        this.messagingService.userConversations.set(userId, new Set());
                    }
                    this.messagingService.userConversations.get(userId).add(conversation.id);
                });

                res.json({
                    success: true,
                    data: conversation,
                    message: 'Direct conversation created successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error creating direct conversation:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to create direct conversation',
                    message: error.message
                });
            }
        });

        // Create a group conversation
        this.app.post('/api/v1/conversations/group', (req, res) => {
            try {
                const { name, participants, description, avatar } = req.body;

                if (!name || !participants || !Array.isArray(participants) || participants.length < 2) {
                    return res.status(400).json({
                        success: false,
                        error: 'name and participants array with at least 2 users are required'
                    });
                }

                const conversation = this.messagingService.createGroupConversation(
                    participants[0], // First participant as creator
                    name,
                    participants,
                    { description, avatar }
                );

                res.json({
                    success: true,
                    data: conversation,
                    message: 'Group conversation created successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error creating group conversation:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to create group conversation',
                    message: error.message
                });
            }
        });

        // Get user's unread message count
        this.app.get('/api/v1/messages/unread-count/:userId', (req, res) => {
            try {
                const { userId } = req.params;

                const count = this.messagingService.getUserUnreadCount(userId);

                res.json({
                    success: true,
                    data: { userId, unreadCount: count },
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error getting unread count:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to get unread message count',
                    message: error.message
                });
            }
        });

        // Mark messages as read
        this.app.put('/api/v1/messages/mark-as-read', (req, res) => {
            try {
                const { userId, messageIds } = req.body;

                if (!userId || !messageIds || !Array.isArray(messageIds)) {
                    return res.status(400).json({
                        success: false,
                        error: 'userId and messageIds array are required'
                    });
                }

                // In a real implementation, we would update the message status
                // For now, we'll just return success

                res.json({
                    success: true,
                    data: { userId, messageIds, markedAsRead: true },
                    message: 'Messages marked as read successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to mark messages as read',
                    message: error.message
                });
            }
        });

        // Search messages
        this.app.get('/api/v1/messages/search', (req, res) => {
            try {
                const { userId, query, limit, offset } = req.query;

                if (!userId || !query) {
                    return res.status(400).json({
                        success: false,
                        error: 'userId and query are required'
                    });
                }

                const options = {
                    limit: limit ? parseInt(limit) : 20,
                    offset: offset ? parseInt(offset) : 0
                };

                const results = this.messagingService.searchMessages(userId, query, options);

                res.json({
                    success: true,
                    data: results,
                    count: results.length,
                    query,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error searching messages:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to search messages',
                    message: error.message
                });
            }
        });

        // Get WebSocket connection info
        this.app.get('/api/v1/websocket-info', (req, res) => {
            res.json({
                websocketEndpoint: `/ws/messages`,
                protocols: ['talentsphere-message-v1'],
                supportedEvents: [
                    'authenticate',
                    'joinRoom',
                    'leaveRoom',
                    'sendMessage',
                    'createConversation',
                    'markAsRead',
                    'typing'
                ],
                maxMessageLength: this.messagingService.options.maxMessageLength,
                maxAttachmentSize: this.messagingService.options.maxAttachmentSize
            });
        });

        // Add a participant to a group conversation
        this.app.post('/api/v1/conversations/:conversationId/participants', (req, res) => {
            try {
                const { conversationId } = req.params;
                const { userId } = req.body;

                if (!userId) {
                    return res.status(400).json({
                        success: false,
                        error: 'userId is required'
                    });
                }

                // In a real implementation, we would add the user to the conversation
                // For now, we'll just return success

                res.json({
                    success: true,
                    data: { conversationId, userId, action: 'added' },
                    message: 'Participant added to conversation successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error adding participant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to add participant to conversation',
                    message: error.message
                });
            }
        });

        // Remove a participant from a group conversation
        this.app.delete('/api/v1/conversations/:conversationId/participants/:userId', (req, res) => {
            try {
                const { conversationId, userId } = req.params;

                // In a real implementation, we would remove the user from the conversation
                // For now, we'll just return success

                res.json({
                    success: true,
                    data: { conversationId, userId, action: 'removed' },
                    message: 'Participant removed from conversation successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error removing participant:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to remove participant from conversation',
                    message: error.message
                });
            }
        });
    }

    /**
     * Start the API server
     */
    async start(port = 3008) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`Messaging API server running on port ${port}`);
                resolve();
            });
        });
    }

    /**
     * Get the express app instance
     */
    getApp() {
        return this.app;
    }
}

module.exports = MessagingAPI;