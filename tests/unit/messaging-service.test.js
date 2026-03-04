/**
 * Unit Tests for Messaging Service
 * Comprehensive test suite covering all messaging functionality
 */

const MessagingService = require('../../services/messaging-service/messaging-service');

describe('MessagingService', () => {
    let messagingService;

    beforeEach(() => {
        messagingService = new MessagingService({
            port: 8081,
            path: '/ws/messages'
        });
    });

    afterEach(() => {
        if (messagingService) {
            messagingService.shutdown();
        }
    });

    describe('Constructor', () => {
        test('should create messaging service with default options', () => {
            const service = new MessagingService();
            expect(service).toBeDefined();
            expect(service.options.port).toBe(8081);
            expect(service.options.messageRetentionDays).toBe(30);
            expect(service.options.maxMessageLength).toBe(10000);
        });

        test('should create messaging service with custom options', () => {
            const service = new MessagingService({
                port: 9000,
                messageRetentionDays: 60,
                maxMessageLength: 5000
            });
            expect(service.options.port).toBe(9000);
            expect(service.options.messageRetentionDays).toBe(60);
            expect(service.options.maxMessageLength).toBe(5000);
        });

        test('should initialize empty data structures', () => {
            expect(messagingService.clients).toBeDefined();
            expect(messagingService.clients.size).toBe(0);
            expect(messagingService.rooms).toBeDefined();
            expect(messagingService.messages).toBeDefined();
            expect(messagingService.conversationHistory).toBeDefined();
        });
    });

    describe('Client Management', () => {
        test('should add client', () => {
            const mockWs = { readyState: 1, send: jest.fn(), close: jest.fn() };
            messagingService.addClient('client-1', mockWs, 'user-1');
            expect(messagingService.clients.size).toBe(1);
        });

        test('should remove client', () => {
            const mockWs = { readyState: 1, send: jest.fn(), close: jest.fn() };
            messagingService.addClient('client-1', mockWs);
            messagingService.removeClient('client-1');
            expect(messagingService.clients.size).toBe(0);
        });

        test('should get client', () => {
            const mockWs = { readyState: 1, send: jest.fn() };
            messagingService.addClient('client-1', mockWs);
            const client = messagingService.getClient('client-1');
            expect(client).toBeDefined();
        });
    });

    describe('Room Management', () => {
        test('should create room', () => {
            const room = messagingService.createRoom('room-1', 'Test Room', 'direct');
            expect(room).toBeDefined();
            expect(room.id).toBe('room-1');
            expect(room.name).toBe('Test Room');
        });

        test('should add participant to room', () => {
            messagingService.createRoom('room-1', 'Test Room');
            messagingService.addParticipantToRoom('room-1', 'user-1');
            const room = messagingService.rooms.get('room-1');
            expect(room.participants.has('user-1')).toBe(true);
        });

        test('should remove participant from room', () => {
            messagingService.createRoom('room-1', 'Test Room');
            messagingService.addParticipantToRoom('room-1', 'user-1');
            messagingService.removeParticipantFromRoom('room-1', 'user-1');
            const room = messagingService.rooms.get('room-1');
            expect(room.participants.has('user-1')).toBe(false);
        });

        test('should get room', () => {
            messagingService.createRoom('room-1', 'Test Room');
            const room = messagingService.getRoom('room-1');
            expect(room).toBeDefined();
        });
    });

    describe('Messaging', () => {
        test('should create message', () => {
            const message = messagingService.createMessage('user-1', 'Hello!', 'room-1');
            expect(message).toBeDefined();
            expect(message.content).toBe('Hello!');
            expect(message.senderId).toBe('user-1');
            expect(message.timestamp).toBeDefined();
        });

        test('should store message', () => {
            const msg = messagingService.createMessage('user-1', 'Test', 'room-1');
            messagingService.storeMessage(msg);
            expect(messagingService.messages.size).toBe(1);
        });

        test('should get message by ID', () => {
            const msg = messagingService.createMessage('user-1', 'Test', 'room-1');
            messagingService.storeMessage(msg);
            const retrieved = messagingService.getMessage(msg.id);
            expect(retrieved).toBeDefined();
            expect(retrieved.content).toBe('Test');
        });

        test('should add message to conversation', () => {
            const msg = messagingService.createMessage('user-1', 'Test', 'conv-1');
            messagingService.addToConversationHistory('conv-1', msg.id);
            expect(messagingService.conversationHistory.get('conv-1').length).toBe(1);
        });
    });

    describe('Message Delivery', () => {
        test('should send message to room', () => {
            const mockWs = { readyState: 1, send: jest.fn() };
            messagingService.addClient('client-1', mockWs, 'user-1');
            messagingService.createRoom('room-1', 'Test');
            messagingService.addParticipantToRoom('room-1', 'user-1');
            
            const msg = messagingService.createMessage('user-1', 'Hello Room', 'room-1');
            messagingService.sendToRoom('room-1', msg);
            
            expect(mockWs.send).toHaveBeenCalled();
        });

        test('should send message to user', () => {
            const mockWs = { readyState: 1, send: jest.fn() };
            messagingService.addClient('client-1', mockWs, 'user-1');
            
            messagingService.sendToUser('user-1', { type: 'message', content: 'Hi' });
            
            expect(mockWs.send).toHaveBeenCalled();
        });

        test('should not send to disconnected clients', () => {
            const mockWs = { readyState: 0, send: jest.fn() };
            messagingService.addClient('client-1', mockWs, 'user-1');
            
            messagingService.sendToUser('user-1', { type: 'test' });
            
            expect(mockWs.send).not.toHaveBeenCalled();
        });
    });

    describe('Typing Indicators', () => {
        test('should start typing', () => {
            messagingService.startTyping('user-1', 'room-1');
            // Should not throw
            expect(true).toBe(true);
        });

        test('should stop typing', () => {
            messagingService.startTyping('user-1', 'room-1');
            messagingService.stopTyping('user-1', 'room-1');
            expect(true).toBe(true);
        });
    });

    describe('Message Read Status', () => {
        test('should mark message as read', () => {
            const msg = messagingService.createMessage('user-1', 'Test', 'room-1');
            messagingService.storeMessage(msg);
            messagingService.markAsRead(msg.id, 'user-2');
            
            const retrieved = messagingService.getMessage(msg.id);
            expect(retrieved.readBy).toContain('user-2');
        });

        test('should track read receipts', () => {
            const msg = messagingService.createMessage('user-1', 'Test', 'room-1');
            messagingService.storeMessage(msg);
            
            const receipts = messagingService.getReadReceipts(msg.id);
            expect(receipts).toBeDefined();
        });
    });

    describe('User Conversations', () => {
        test('should track user conversations', () => {
            messagingService.addUserConversation('user-1', 'conv-1');
            const convs = messagingService.getUserConversations('user-1');
            expect(convs).toContain('conv-1');
        });

        test('should get conversation messages', () => {
            const msg1 = messagingService.createMessage('user-1', 'Hello', 'conv-1');
            const msg2 = messagingService.createMessage('user-2', 'Hi there', 'conv-1');
            messagingService.addToConversationHistory('conv-1', msg1.id);
            messagingService.addToConversationHistory('conv-1', msg2.id);
            
            const messages = messagingService.getConversationMessages('conv-1');
            expect(messages.length).toBe(2);
        });
    });

    describe('Service Control', () => {
        test('should have shutdown method', () => {
            expect(typeof messagingService.shutdown).toBe('function');
        });

        test('should have getStatus method', () => {
            expect(typeof messagingService.getStatus).toBe('function');
        });

        test('should return status', () => {
            const status = messagingService.getStatus();
            expect(status).toBeDefined();
            expect(status.clients).toBe(0);
            expect(status.rooms).toBe(0);
        });
    });

    describe('Event Emitter', () => {
        test('should extend EventEmitter', () => {
            expect(messagingService.on).toBeDefined();
            expect(messagingService.emit).toBeDefined();
        });

        test('should emit message event', () => {
            const callback = jest.fn();
            messagingService.on('message', callback);
            messagingService.emit('message', { content: 'test' });
            expect(callback).toHaveBeenCalled();
        });
    });
});
