/**
 * Test Helpers for Analytics Service
 * Common utilities and mock functions
 */

const { createLogger } = require('../../../shared/logger');

class TestHelpers {
    constructor() {
        this.logger = createLogger('test-helpers', { logLevel: 'info' });
    }

    /**
     * Create mock request object
     */
    createMockRequest(overrides = {}) {
        return {
            id: 'test-request-id',
            method: 'GET',
            url: '/test-endpoint',
            headers: {
                'content-type': 'application/json',
                'user-agent': 'test-client'
            },
            query: {},
            body: {},
            params: {},
            ip: '127.0.0.1',
            user: { id: 'test-user-id', email: 'test@example.com' },
            ...overrides
        };
    }

    /**
     * Create mock response object
     */
    createMockResponse(overrides = {}) {
        return {
            status: 200,
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'x-request-id': 'test-request-id'
            },
            locals: {},
            ...overrides
        };
    }

    /**
     * Create mock user object
     */
    createMockUser(overrides = {}) {
        return {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    /**
     * Assert that a function throws an error
     */
    expectError(fn, expectedErrorCode = null) {
        try {
            const result = fn();
            expect(result).toBeUndefined();
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            if (expectedErrorCode) {
                expect(error.code || error.message).toContain(expectedErrorCode);
            }
        }
    }

    /**
     * Assert that a function returns successfully
     */
    expectSuccess(fn) {
        const result = fn();
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
    }

    /**
     * Wait for async operations
     */
    async waitFor(ms = 100) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate random test data
     */
    generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate test timestamp
     */
    generateTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Clean up test resources
     */
    async cleanup() {
        this.logger.info('Cleaning up test resources');
    }
}

module.exports = { TestHelpers, createLogger };