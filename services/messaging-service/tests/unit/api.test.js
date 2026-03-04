const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-1234')
}));

const request = require('supertest');
const express = require('express');
const MessagingAPI = require('../../api');

// Create mock messaging service
const createMockMessagingService = () => ({
    messages: new Map(),
    conversationHistory: new Map(),
    userConversations: new Map(),
    getUserConversations: jest.fn((userId) => []),
    getStats: jest.fn(() => ({ totalMessages: 0, totalConversations: 0 }))
});

// Initialize API with mock service
const messagingService = createMockMessagingService();
const messagingAPI = new MessagingAPI(messagingService);
const app = messagingAPI.getApp();

describe('Messaging API - Message Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear mock service state
        messagingService.messages.clear();
        messagingService.conversationHistory.clear();
        messagingService.userConversations.clear();
    });

    it('should reject a message with missing required fields', async () => {
        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                conversationId: '',
                content: 'This is a valid length message body',
                senderId: 'recruiter-1'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/conversationId, content, and senderId are required/);
    });

    it('should reject a message with invalid conversationId', async () => {
        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                conversationId: null,
                content: 'This is a valid length message body',
                senderId: 'recruiter-1'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/conversationId, content, and senderId are required/);
    });

    it('should accept a valid message', async () => {
        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                conversationId: 'conv-123',
                content: 'This is a valid length message body for testing',
                senderId: 'recruiter-1'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.conversationId).toBe('conv-123');
        expect(res.body.data.content).toBe('This is a valid length message body for testing');
    });

    it('should allow message with messageType and attachments', async () => {
        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                conversationId: 'conv-456',
                content: 'Message with attachments',
                senderId: 'recruiter-1',
                messageType: 'text',
                attachments: ['file1.pdf', 'file2.pdf']
            });

        expect(res.status).toBe(200);
        expect(res.body.data.messageType).toBe('text');
        expect(res.body.data.attachments).toHaveLength(2);
    });
});
