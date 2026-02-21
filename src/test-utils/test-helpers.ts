/**
 * Common test patterns and helpers for TalentSphere
 * Provides reusable test setup, teardown, and validation functions
 */

import { jest } from "@jest/globals";

// Test database setup helpers
export const setupDatabase = {
    // Connect to test database
    async connect() {
        // Mock database connection for testing
        const mockDb = {
            collections: jest.fn(),
            collection: jest.fn(() => ({
                insertOne: jest.fn(),
                find: jest.fn(() => ({
                    toArray: jest.fn(),
                    limit: jest.fn(() => ({ toArray: jest.fn() })),
                    skip: jest.fn(() => ({ toArray: jest.fn() })),
                })),
                findOne: jest.fn(),
                updateOne: jest.fn(),
                deleteOne: jest.fn(),
                deleteMany: jest.fn(),
                countDocuments: jest.fn(),
            })),
            close: jest.fn(),
        };
        return mockDb;
    },

    // Clean up test data
    async cleanup(db) {
        if (db && db.collections) {
            const collections = await db.collections();
            for (const collection of collections) {
                await collection.deleteMany({});
            }
        }
    },
};

// HTTP request/response testing helpers
export const httpHelpers = {
    // Create mock Express request
    createRequest(overrides: Record<string, unknown> = {}) {
        return {
            body: {},
            params: {},
            query: {},
            headers: {},
            method: "GET",
            url: "/",
            user: null,
            session: {},
            cookies: {},
            signedCookies: {},
            ip: "127.0.0.1",
            protocol: "http",
            secure: false,
            xhr: false,
            ...overrides,
        };
    },

    // Create mock Express response
    createResponse() {
        const res = {
            statusCode: 200,
            headers: {},
            locals: {},

            status: jest.fn().mockImplementation(function (code) {
                this.statusCode = code;
                return this;
            }),

            json: jest.fn().mockImplementation(function (data) {
                this.data = data;
                return this;
            }),

            send: jest.fn().mockImplementation(function (data) {
                this.data = data;
                return this;
            }),

            cookie: jest.fn().mockImplementation(function (...args: unknown[]) {
                const [name, value, options = {}] = args as [string, string, Record<string, any>];
                this.cookies[name] = { value, ...options };
                return this;
            }),

            clearCookie: jest.fn().mockImplementation(function (...args: unknown[]) {
                const [name] = args as [string];
                delete this.cookies[name];
                return this;
            }),

            redirect: jest.fn().mockImplementation(function (url) {
                this.redirectUrl = url;
                return this;
            }),

            end: jest.fn().mockImplementation(function () {
                return this;
            }),
        };

        return res;
    },

    // Helper to test middleware
    async testMiddleware(middleware, req, res, next = jest.fn()) {
        await middleware(req, res, next);
        return { req, res, next };
    },
};

// Authentication testing helpers
export const authHelpers = {
    // Create mock JWT token
    createMockToken(payload = {}) {
        const defaultPayload = {
            sub: "test-user-id",
            email: "test@example.com",
            role: "user",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        };

        const finalPayload = { ...defaultPayload, ...payload };
        return `mock-jwt-token-${btoa(JSON.stringify(finalPayload))}`;
    },

    // Mock authenticated request
    createAuthenticatedRequest(userOverrides = {}, reqOverrides = {}) {
        const mockUser = {
            id: "test-user-id",
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            role: "user",
            ...userOverrides,
        };

        return httpHelpers.createRequest({
            user: mockUser,
            headers: {
                authorization: `Bearer ${authHelpers.createMockToken({ sub: mockUser.id })}`,
            },
            ...reqOverrides,
        });
    },
};

// Validation helpers for testing
export const validationHelpers = {
    // Validate response structure
    expectSuccessResponse(response, expectedData = null) {
        expect(response.statusCode).toBe(200);
        expect(response.data).toBeDefined();

        if (expectedData) {
            expect(response.data).toMatchObject(expectedData);
        }
    },

    // Validate error response
    expectErrorResponse(response, expectedStatus, expectedMessage) {
        expect(response.statusCode).toBe(expectedStatus);
        expect(response.data).toBeDefined();
        expect(response.data.error).toBeDefined();

        if (expectedMessage) {
            expect(response.data.error).toContain(expectedMessage);
        }
    },

    // Validate pagination
    expectPaginationStructure(data) {
        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("pagination");
        expect(data.pagination).toHaveProperty("page");
        expect(data.pagination).toHaveProperty("limit");
        expect(data.pagination).toHaveProperty("total");
        expect(data.pagination).toHaveProperty("pages");
    },
};

// Async testing helpers
export const asyncHelpers = {
    // Wait for promises to resolve
    async waitFor(ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Helper to test async functions with timeout
    async withTimeout(promise, timeoutMs = 5000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Test timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]);
    },

    // Retry helper for flaky tests
    async retry(fn, maxAttempts = 3, delay = 100) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt < maxAttempts) {
                    await asyncHelpers.waitFor(delay);
                }
            }
        }

        throw lastError;
    },
};

// Mock data generators
export const dataGenerators = {
    // Generate mock user
    generateUser(overrides = {}) {
        const timestamp = Date.now();
        return {
            id: `user-${timestamp}`,
            email: `user${timestamp}@example.com`,
            firstName: "Test",
            lastName: "User",
            role: "user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...overrides,
        };
    },

    // Generate mock job
    generateJob(overrides = {}) {
        const timestamp = Date.now();
        return {
            id: `job-${timestamp}`,
            title: "Software Engineer",
            company: "Tech Corp",
            location: "San Francisco, CA",
            type: "full-time",
            remote: true,
            description: "Software engineering position",
            requirements: ["JavaScript", "React"],
            salary: "$100k-$150k",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...overrides,
        };
    },

    // Generate array of items
    generateArray(generator, count = 3, overrides = {}) {
        return Array.from({ length: count }, (_, i) => generator({ ...overrides, index: i }));
    },
};

// File system testing helpers
export const fsHelpers = {
    // Create mock file
    createMockFile(name = "test.txt", content = "test content") {
        return {
            name,
            content,
            size: content.length,
            type: "text/plain",
            lastModified: Date.now(),
        };
    },

    // Mock multer file object
    createMockMulterFile(overrides = {}) {
        return {
            fieldname: "file",
            originalname: "test.jpg",
            encoding: "7bit",
            mimetype: "image/jpeg",
            size: 1024,
            buffer: Buffer.from("mock image data"),
            destination: "/tmp/uploads",
            filename: "test-123.jpg",
            path: "/tmp/uploads/test-123.jpg",
            ...overrides,
        };
    },
};

export default {
    setupDatabase,
    httpHelpers,
    authHelpers,
    validationHelpers,
    asyncHelpers,
    dataGenerators,
    fsHelpers,
};
