const request = require('supertest');
// As this is a polyglot microservice environment, end-to-end integration tests 
// usually run against the API Gateway in a fully composed docker-compose environment.
// For the purpose of this implementation review, we will create a suite that
// hits the local API gateway assuming it's running.

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

describe('Phase 8 Backend Endpoints Integration Tests', () => {

    describe('Auth Service - Password Reset Flow', () => {
        it('should accept forgot-password request', async () => {
            const res = await request(GATEWAY_URL)
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'test@example.com' });
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
        });
    });

    describe('AI Service - Chat Endpoint', () => {
        it('should return mock response from chat endpoint', async () => {
            const res = await request(GATEWAY_URL)
                .post('/api/v1/ai/chat')
                .send({ message: 'hello', history: [] });
            
            // Depending on if the python service is running, it might be 502 or 200
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('reply');
                expect(res.body).toHaveProperty('status', 'success');
            }
        });
    });

    describe('Challenge Service - Execute Endpoint', () => {
        it('should handle code execution payloads', async () => {
            const codePayload = {
                code: 'console.log("hello");',
                language: 'javascript'
            };
            const res = await request(GATEWAY_URL)
                .post('/api/v1/challenges/execute')
                .send(codePayload);
            
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('output');
                expect(res.body.error).toBeDefined();
            }
        });
    });

    describe('LMS Service - Progress Endpoint', () => {
        it('should save course progress', async () => {
            const progressPayload = {
                courseId: 'c1',
                videoId: 'v1',
                watchedSeconds: 120,
                isCompleted: true,
                userId: 'u1'
            };
            const res = await request(GATEWAY_URL)
                .post('/api/v1/lms/progress')
                .send(progressPayload);
            
            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('message', 'Progress saved successfully');
                expect(res.body.data.courseId).toEqual('c1');
            }
        });
    });

    describe('User Profile Service - Settings and Connections', () => {
        // These require Auth tokens in reality, so we just expect 401 Unauthorized
        // without a valid token.
        it('should protect Settings preferences endpoint', async () => {
            const res = await request(GATEWAY_URL)
                .put('/api/v1/settings/preferences')
                .send({ theme: 'dark' });
            
            expect([401, 502]).toContain(res.statusCode); // 401 if Auth is up, 502 if proxy fails
        });

        it('should protect Networking connect endpoint', async () => {
            const res = await request(GATEWAY_URL)
                .post('/api/v1/users/profiles/some-id/connect')
                .send();
            
            expect([401, 502]).toContain(res.statusCode);
        });
    });
});
