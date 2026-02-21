/**
 * Jest Setup Configuration
 * Global test configuration and helpers
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'warn'; // Reduce noise during tests

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
    // Suppress console.log in tests unless explicitly needed
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    // Restore console methods
    Object.assign(console, originalConsole);
});

// Global test helpers
global.testUtils = {
    // Wait for async operations
    waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Generate random test data
    randomString: (length = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    // Generate test timestamp
    timestamp: () => new Date().toISOString(),
    
    // Create test user data
    createTestUser: (overrides = {}) => ({
        id: `test-user-${global.testUtils.randomString(8)}`,
        email: `test-${global.testUtils.randomString(5)}@example.com`,
        name: 'Test User',
        role: 'user',
        isActive: true,
        createdAt: global.testUtils.timestamp(),
        updatedAt: global.testUtils.timestamp(),
        ...overrides
    })
};

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js']
};