/**
 * Unit Tests for Messaging Service
 */

describe('MessagingService', () => {
    let MessagingService;
    let messagingService;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should create messaging service instance', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService({ port: 9999 });
        expect(service).toBeDefined();
        expect(service.options.port).toBe(9999);
    });

    test('should initialize with default options', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        expect(service.options.port).toBeDefined();
        expect(service.options.maxPayload).toBe(1024 * 1024);
    });

    test('should have client storage', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        expect(service.clients).toBeDefined();
        expect(service.clients instanceof Map).toBe(true);
    });

    test('should have room storage', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        expect(service.rooms).toBeDefined();
        expect(service.rooms instanceof Map).toBe(true);
    });

    test('should have message storage', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        expect(service.messages).toBeDefined();
        expect(service.messages instanceof Map).toBe(true);
    });

    test('should create a room', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.createRoom('room-1', 'Test Room', ['user-1', 'user-2']);
        
        expect(service.rooms.has('room-1')).toBe(true);
        const room = service.rooms.get('room-1');
        expect(room.name).toBe('Test Room');
        expect(room.participants).toContain('user-1');
    });

    test('should add participant to room', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.createRoom('room-1', 'Test Room', ['user-1']);
        service.addParticipantToRoom('room-1', 'user-2');
        
        const room = service.rooms.get('room-1');
        expect(room.participants).toContain('user-2');
    });

    test('should remove participant from room', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.createRoom('room-1', 'Test Room', ['user-1', 'user-2']);
        service.removeParticipantFromRoom('room-1', 'user-2');
        
        const room = service.rooms.get('room-1');
        expect(room.participants).not.toContain('user-2');
    });

    test('should get room', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.createRoom('room-1', 'Test Room', ['user-1']);
        const room = service.getRoom('room-1');
        
        expect(room).toBeDefined();
        expect(room.name).toBe('Test Room');
    });

    test('should return undefined for non-existent room', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        const room = service.getRoom('non-existent');
        expect(room).toBeUndefined();
    });

    test('should add client', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.addClient('client-1', 'user-1');
        
        expect(service.clients.has('client-1')).toBe(true);
        const client = service.clients.get('client-1');
        expect(client.userId).toBe('user-1');
    });

    test('should remove client', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.addClient('client-1', 'user-1');
        service.removeClient('client-1');
        
        expect(service.clients.has('client-1')).toBe(false);
    });

    test('should get client', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.addClient('client-1', 'user-1');
        const client = service.getClient('client-1');
        
        expect(client).toBeDefined();
        expect(client.userId).toBe('user-1');
    });

    test('should send message to room', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.createRoom('room-1', 'Test Room', ['user-1', 'user-2']);
        
        const message = service.sendMessageToRoom('room-1', 'user-1', 'Hello everyone!');
        
        expect(message).toBeDefined();
        expect(message.content).toBe('Hello everyone!');
        expect(message.senderId).toBe('user-1');
    });

    test('should send direct message', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.addClient('client-1', 'user-1');
        service.addClient('client-2', 'user-2');
        
        const message = service.sendDirectMessage('client-1', 'client-2', 'Hello!');
        
        expect(message).toBeDefined();
        expect(message.content).toBe('Hello!');
    });

    test('should track conversation', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.addClient('client-1', 'user-1');
        service.addClient('client-2', 'user-2');
        
        service.sendDirectMessage('client-1', 'client-2', 'Hello!');
        service.sendDirectMessage('client-2', 'client-1', 'Hi there!');
        
        const messages = service.getConversation('user-1', 'user-2');
        expect(messages.length).toBe(2);
    });

    test('should get service status', () => {
        const { MessagingService } = require('../../services/messaging-service/messaging-service');
        const service = new MessagingService();
        
        service.addClient('client-1', 'user-1');
        service.createRoom('room-1', 'Test Room', ['user-1']);
        
        const status = service.getStatus();
        
        expect(status.clients).toBe(1);
        expect(status.rooms).toBe(1);
    });
});
