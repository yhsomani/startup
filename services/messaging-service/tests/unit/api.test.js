const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const request = require('supertest');
const express = require('express');
const MessagingAPI = require('../../api');
const db = require('../../db');

// Mock the database
jest.mock('../../db', () => ({
    query: jest.fn()
}));

// Initialize API
const messagingAPI = new MessagingAPI(null); // Pass null for io as we don't need real WebSockets
const app = messagingAPI.getApp();

describe('Messaging API - Anti-Spam Constraints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject a message that is too short', async () => {
        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                from_recruiter_id: 'recruiter-1',
                to_developer_id: 'dev-1',
                body: 'Too short', // 9 chars < 20
                subject: 'Hello'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/between 20 and 500 characters/);
        expect(db.query).not.toHaveBeenCalled();
    });

    it('should reject a message if recruiter has exceeded daily limit of 50', async () => {
        // Mock the first query to return exactly 50 messages sent today
        db.query.mockResolvedValueOnce({ rows: [{ count: '50' }] });

        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                from_recruiter_id: 'recruiter-1',
                to_developer_id: 'dev-1',
                body: 'This is a valid length message body',
                subject: 'Hello'
            });

        expect(res.status).toBe(429);
        expect(res.body.error).toMatch(/Daily message limit/i);
        // Only the first query (daily limit check) should be called
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should reject a message if recruiter already messaged this developer this week', async () => {
        // Daily limit check passes (e.g. 5 today)
        db.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });
        // Weekly developer check fails (already sent 1)
        db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                from_recruiter_id: 'recruiter-1',
                to_developer_id: 'dev-1',
                body: 'This is a valid length message body',
                subject: 'Hello'
            });

        expect(res.status).toBe(429);
        expect(res.body.error).toMatch(/once per week/i);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should allow message if all constraints pass', async () => {
        // Daily limit check: 5
        db.query.mockResolvedValueOnce({ rows: [{ count: '5' }] });
        // Weekly dev limit check: 0
        db.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
        // Insert message query: success
        db.query.mockResolvedValueOnce({
            rows: [{
                id: 'new-msg-id',
                from_recruiter_id: 'recruiter-1',
                to_developer_id: 'dev-1',
                body: 'This is a valid length message body',
                subject: 'Hello',
                status: 'sent',
                sent_at: new Date().toISOString()
            }]
        });

        const res = await request(app)
            .post('/api/v1/messages')
            .send({
                from_recruiter_id: 'recruiter-1',
                to_developer_id: 'dev-1',
                body: 'This is a valid length message body',
                subject: 'Hello'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.id).toBeDefined();
        expect(db.query).toHaveBeenCalledTimes(3);
    });
});
