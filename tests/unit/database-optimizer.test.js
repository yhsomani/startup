/**
 * Database Optimizer Unit Tests
 *
 * Tests for database connection pooling, query caching, and optimization
 */

const { Pool } = require("pg");

jest.mock("pg", () => {
    const mPool = {
        connect: jest.fn().mockResolvedValue({
            query: jest.fn(),
            release: jest.fn(),
        }),
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        end: jest.fn(),
        on: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

jest.mock("../../shared/config", () => ({
    database: {
        host: "localhost",
        port: 5432,
        user: "test",
        password: "test",
        name: "test_db",
        ssl: false,
    },
}));

jest.mock("../../shared/enhanced-logger", () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        logDatabase: jest.fn(),
    },
}));

describe("DatabaseOptimizer", () => {
    let DatabaseOptimizer;
    let optimizer;

    beforeEach(() => {
        jest.clearAllMocks();
        DatabaseOptimizer = require("../../shared/database-optimizer");
        optimizer = new DatabaseOptimizer();
    });

    afterEach(async () => {
        if (optimizer && optimizer.pool) {
            await optimizer.pool.end();
        }
    });

    describe("constructor", () => {
        it("should create a connection pool with default settings", () => {
            expect(Pool).toHaveBeenCalledWith(
                expect.objectContaining({
                    max: 20,
                    min: 5,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 10000,
                })
            );
        });

        it("should initialize cache stats", () => {
            expect(optimizer.cacheStats).toEqual({
                hits: 0,
                misses: 0,
                sets: 0,
            });
        });

        it("should initialize query cache", () => {
            expect(optimizer.queryCache).toBeInstanceOf(Map);
        });
    });

    describe("query", () => {
        it("should execute a basic query without caching", async () => {
            const result = await optimizer.query("SELECT * FROM users");

            expect(optimizer.pool.query).toHaveBeenCalled();
            expect(result).toEqual({ rows: [], rowCount: 0 });
        });

        it("should cache query results when useCache is true", async () => {
            const mockResult = { rows: [{ id: 1, name: "Test" }], rowCount: 1 };
            optimizer.pool.query.mockResolvedValueOnce(mockResult);

            const result = await optimizer.query("SELECT * FROM users WHERE id = $1", [1], {
                useCache: true,
                cacheKey: "user:1",
                cacheTTL: 60000,
            });

            expect(optimizer.cacheStats.sets).toBe(1);
            expect(optimizer.queryCache.has("user:1")).toBe(true);
        });

        it("should return cached results on cache hit", async () => {
            const cachedData = { rows: [{ id: 1, name: "Cached" }], rowCount: 1 };
            optimizer.queryCache.set("user:1", cachedData);

            const result = await optimizer.query("SELECT * FROM users WHERE id = $1", [1], {
                useCache: true,
                cacheKey: "user:1",
            });

            expect(optimizer.pool.query).not.toHaveBeenCalled();
            expect(optimizer.cacheStats.hits).toBe(1);
            expect(result).toEqual(cachedData);
        });

        it("should track cache misses", async () => {
            optimizer.pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            await optimizer.query("SELECT * FROM users", [], {
                useCache: true,
                cacheKey: "users:all",
            });

            expect(optimizer.cacheStats.misses).toBe(1);
        });
    });

    describe("getFromCache", () => {
        it("should return cached data if not expired", () => {
            const futureExpiry = Date.now() + 60000;
            optimizer.queryCache.set("test:key", { data: "test", expiry: futureExpiry });

            const result = optimizer.getFromCache("test:key");
            expect(result).toEqual({ data: "test", expiry: futureExpiry });
        });

        it("should return null and remove expired cache entry", () => {
            const pastExpiry = Date.now() - 60000;
            optimizer.queryCache.set("test:key", { data: "test", expiry: pastExpiry });

            const result = optimizer.getFromCache("test:key");
            expect(result).toBeNull();
            expect(optimizer.queryCache.has("test:key")).toBe(false);
        });

        it("should return null for non-existent key", () => {
            const result = optimizer.getFromCache("nonexistent");
            expect(result).toBeNull();
        });
    });

    describe("setCache", () => {
        it("should store data with expiry in cache", () => {
            const data = { rows: [{ id: 1 }], rowCount: 1 };
            const ttl = 300000;

            optimizer.setCache("test:key", data, ttl);

            const cached = optimizer.queryCache.get("test:key");
            expect(cached).toBeDefined();
            expect(cached.rows).toEqual(data.rows);
            expect(cached.expiry).toBeGreaterThan(Date.now());
        });
    });

    describe("optimizeQuery", () => {
        it("should add EXPLAIN to query when not present", () => {
            const query = "SELECT * FROM users";
            const optimized = optimizer.optimizeQuery(query);
            expect(optimized).toContain("EXPLAIN");
        });

        it("should not add EXPLAIN if already present", () => {
            const query = "EXPLAIN SELECT * FROM users";
            const optimized = optimizer.optimizeQuery(query);
            expect(optimized).toBe(query);
        });

        it("should convert SELECT * to specific columns", () => {
            const query = "SELECT * FROM users WHERE id = 1";
            const optimized = optimizer.optimizeQuery(query);
            expect(optimized).not.toMatch(/SELECT\s+\*/i);
        });
    });

    describe("getStats", () => {
        it("should return connection pool and cache stats", () => {
            optimizer.cacheStats.hits = 5;
            optimizer.cacheStats.misses = 10;
            optimizer.cacheStats.sets = 8;

            const stats = optimizer.getStats();

            expect(stats.cache).toEqual({
                hits: 5,
                misses: 10,
                sets: 8,
                hitRate: "33.33%",
            });
            expect(stats.pool).toBeDefined();
        });
    });

    describe("error handling", () => {
        it("should handle query errors", async () => {
            const error = new Error("Database error");
            optimizer.pool.query.mockRejectedValueOnce(error);

            await expect(optimizer.query("SELECT * FROM users")).rejects.toThrow("Database error");
        });
    });
});
