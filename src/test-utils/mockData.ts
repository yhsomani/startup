/**
 * Test utilities and mock data for TalentSphere
 * Provides reusable test helpers, mock responses, and fixtures
 */

// Mock user data
export const mockUsers = {
    validUser: {
        id: "1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
        profile: {
            headline: "Software Engineer",
            summary: "Experienced software engineer",
        },
    },
    adminUser: {
        id: "2",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        profile: {
            headline: "System Administrator",
            summary: "System administrator",
        },
    },
};

// Mock job data
export const mockJobs = {
    validJob: {
        id: "1",
        title: "Senior Software Engineer",
        company: "Tech Corp",
        location: "San Francisco, CA",
        type: "full-time",
        remote: true,
        description: "Senior software engineering position",
        requirements: ["5+ years experience", "React knowledge"],
        salary: "$120k-$180k",
    },
};

// Mock API responses
export const mockResponses = {
    user: {
        success: {
            status: 200,
            data: mockUsers.validUser,
        },
        notFound: {
            status: 404,
            error: "User not found",
        },
        unauthorized: {
            status: 401,
            error: "Unauthorized",
        },
    },
    auth: {
        loginSuccess: {
            status: 200,
            data: {
                token: "mock-jwt-token",
                user: mockUsers.validUser,
            },
        },
        loginFailed: {
            status: 401,
            error: "Invalid credentials",
        },
    },
};

// Common test helpers
export const testHelpers = {
    // Helper to create mock request objects
    createMockRequest: (overrides = {}) => ({
        body: {},
        params: {},
        query: {},
        headers: {},
        user: null,
        ...overrides,
    }),

    // Helper to create mock response objects
    createMockResponse: () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        };
        return res;
    },

    // Helper to wait for async operations
    waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

    // Helper to create mock JWT tokens
    createMockToken: (payload = {}) => {
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const body = btoa(
            JSON.stringify({
                sub: "1",
                iat: Date.now() / 1000,
                exp: Date.now() / 1000 + 3600,
                ...payload,
            })
        );
        const signature = "mock-signature";
        return `${header}.${body}.${signature}`;
    },
};

// Environment-specific test configs
export const testConfig = {
    mongodb: {
        uri: process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/test-talentsphere",
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    redis: {
        host: process.env.TEST_REDIS_HOST || "localhost",
        port: parseInt(process.env.TEST_REDIS_PORT || "6379"),
        db: 1, // Use test database
    },
    jwt: {
        secret: process.env.JWT_SECRET || "test-jwt-secret-key",
        expiresIn: "1h",
    },
};

// Cleanup utilities
export const cleanup = {
    // Clean up database collections
    asyncDatabase: async db => {
        const collections = await db.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
    },

    // Clean up Redis data
    redis: redis => {
        return redis.flushdb();
    },
};

// Mock services for testing
export const mockServices = {
    // Mock email service
    emailService: {
        send: jest.fn().mockResolvedValue({ messageId: "mock-message-id" }),
    },

    // Mock payment service
    paymentService: {
        createPayment: jest.fn().mockResolvedValue({
            id: "payment-123",
            status: "succeeded",
            amount: 1000,
        }),
        refund: jest.fn().mockResolvedValue({
            id: "refund-123",
            status: "succeeded",
        }),
    },

    // Mock notification service
    notificationService: {
        send: jest.fn().mockResolvedValue({ id: "notification-123" }),
        markAsRead: jest.fn().mockResolvedValue(true),
    },
};

export default {
    mockUsers,
    mockJobs,
    mockResponses,
    testHelpers,
    testConfig,
    cleanup,
    mockServices,
};
