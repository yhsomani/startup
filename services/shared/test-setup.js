/**
 * Global Jest Setup for TalentSphere Testing
 * Configures test environment for all services
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error"; // Reduce noise during tests
process.env.DATABASE_URL = "postgresql://postgres:test@localhost:5432/talentsphere_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";

// Add TextEncoder/TextDecoder for Node.js 18
if (typeof global.TextEncoder === "undefined") {
    const { TextEncoder, TextDecoder } = require("util");
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// Global test timeout
jest.setTimeout(30000);

// Mock pg pool to avoid live database connections in unit tests
jest.mock("pg", () => {
    const mPool = {
        connect: jest.fn().mockResolvedValue({
            query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
            release: jest.fn(),
        }),
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        end: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

// Mock Redis to avoid live connections
jest.mock("ioredis", () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        ping: jest.fn().mockResolvedValue("PONG"),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([]),
        flushdb: jest.fn().mockResolvedValue("OK"),
        quit: jest.fn().mockResolvedValue("OK"),
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
    }));
});

// Database polling function for integration tests
const waitForDatabase = async (maxAttempts = 30, interval = 1000) => {
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await pool.query("SELECT 1");
            await pool.end();
            console.log(`✅ Database ready after ${attempt} attempt(s)`);
            return true;
        } catch (error) {
            if (attempt === maxAttempts) {
                await pool.end();
                console.warn(
                    `⚠️ Database not available after ${maxAttempts} attempts, tests may fail`
                );
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    return false;
};

// Setup hook - wait for database before running tests
beforeAll(async () => {
    // For unit tests, we don't need the database (pg is mocked)
    // For integration tests, uncomment the line below:
    // await waitForDatabase();
}, 60000);

// Mock console methods to reduce noise in tests
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

// Global test utilities
global.testUtils = {
    // Wait for async operations
    waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

    // Generate random test data
    randomString: (length = 10) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Generate test timestamp
    timestamp: () => new Date().toISOString(),

    // Create mock user data
    createTestUser: (overrides = {}) => ({
        id: `user-${global.testUtils.randomString(8)}`,
        email: `test-${global.testUtils.randomString(5)}@example.com`,
        name: "Test User",
        role: "user",
        isActive: true,
        createdAt: global.testUtils.timestamp(),
        updatedAt: global.testUtils.timestamp(),
        ...overrides,
    }),

    // Create mock service data
    createTestService: (serviceName, overrides = {}) => ({
        id: `service-${global.testUtils.randomString(8)}`,
        name: serviceName,
        status: "active",
        port: 3000 + Math.floor(Math.random() * 1000),
        createdAt: global.testUtils.timestamp(),
        ...overrides,
    }),
};

// Mock problematic modules for all services
jest.mock("uuid", () => ({
    v4: jest.fn(() => `test-uuid-${global.testUtils.randomString(8)}`),
}));

jest.mock("moment", () => {
    const mockMoment = date => ({
        isBefore: jest.fn(() => false),
        isAfter: jest.fn(() => false),
        isBetween: jest.fn(() => true),
        format: jest.fn(() => (date ? date : "2024-01-01T00:00:00Z")),
        toDate: jest.fn(() => new Date()),
        valueOf: jest.fn(() => Date.now()),
        clone: jest.fn(() => mockMoment(date)),
        subtract: jest.fn(() => mockMoment(date)),
    });
    mockMoment.utc = jest.fn(() => mockMoment());
    return mockMoment;
});

// Error handling for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Error handling for uncaught exceptions
process.on("uncaughtException", error => {
    console.error("Uncaught Exception:", error);
});

// Cleanup after tests
afterEach(() => {
    // Clear any pending timers
    jest.clearAllTimers();

    // Reset all mocks
    jest.clearAllMocks();
});

console.log("🧪 Global Jest test environment configured for TalentSphere");
