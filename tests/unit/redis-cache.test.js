/**
 * Redis Cache Unit Tests
 *
 * Tests for Redis caching, cache invalidation, and memory management
 */

jest.mock("ioredis", () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        ping: jest.fn().mockResolvedValue("PONG"),
        get: jest.fn(),
        set: jest.fn().mockResolvedValue("OK"),
        del: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([]),
        flushdb: jest.fn().mockResolvedValue("OK"),
        quit: jest.fn().mockResolvedValue("OK"),
    }));
});

jest.mock("../../shared/error-handler", () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

describe("RedisCache", () => {
    let RedisCache;
    let cache;
    let mockRedis;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        const redisCacheModule = require("../../shared/redis-cache");
        RedisCache = redisCacheModule.RedisCache;
        cache = new RedisCache();
        mockRedis = cache.redis;
    });

    afterEach(async () => {
        if (cache && cache.disconnect) {
            await cache.disconnect();
        }
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            expect(cache.options.host).toBe("localhost");
            expect(cache.options.port).toBe(6379);
            expect(cache.options.keyPrefix).toBe("talentsphere:");
            expect(cache.defaultTTL).toBe(300);
        });

        it("should accept custom options", () => {
            const customCache = new RedisCache({
                host: "custom-host",
                port: 6380,
                keyPrefix: "test:",
                defaultTTL: 600,
            });

            expect(customCache.options.host).toBe("custom-host");
            expect(customCache.options.port).toBe(6380);
            expect(customCache.options.keyPrefix).toBe("test:");
            expect(customCache.defaultTTL).toBe(600);
        });

        it("should initialize cache stats", () => {
            expect(cache.cacheStats).toEqual({
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0,
                errors: 0,
            });
        });
    });

    describe("generateKey", () => {
        it("should generate key with prefix", () => {
            const key = cache.generateKey("users", "123");
            expect(key).toBe("talentsphere:users:123");
        });

        it("should handle array of parts", () => {
            const key = cache.generateKey(["users", "123", "profile"]);
            expect(key).toBe("talentsphere:users:123:profile");
        });

        it("should handle empty options", () => {
            const key = cache.generateKey("test");
            expect(key).toBe("talentsphere:test");
        });
    });

    describe("get", () => {
        it("should return cached value when exists", async () => {
            const cachedData = JSON.stringify({ id: 1, name: "Test" });
            mockRedis.get.mockResolvedValueOnce(cachedData);

            const result = await cache.get("users:1");

            expect(mockRedis.get).toHaveBeenCalledWith("talentsphere:users:1");
            expect(cache.cacheStats.hits).toBe(1);
            expect(result).toEqual({ id: 1, name: "Test" });
        });

        it("should return null on cache miss", async () => {
            mockRedis.get.mockResolvedValueOnce(null);

            const result = await cache.get("nonexistent");

            expect(cache.cacheStats.misses).toBe(1);
            expect(result).toBeNull();
        });

        it("should return null on error", async () => {
            mockRedis.get.mockRejectedValueOnce(new Error("Redis error"));

            const result = await cache.get("test");

            expect(cache.cacheStats.errors).toBe(1);
            expect(result).toBeNull();
        });
    });

    describe("set", () => {
        it("should store value with TTL", async () => {
            const data = { id: 1, name: "Test" };

            await cache.set("users:1", data, 600);

            expect(mockRedis.set).toHaveBeenCalledWith(
                "talentsphere:users:1",
                JSON.stringify(data),
                "EX",
                600
            );
            expect(cache.cacheStats.sets).toBe(1);
        });

        it("should use default TTL when not specified", async () => {
            await cache.set("users:1", { id: 1 });

            expect(mockRedis.set).toHaveBeenCalledWith(
                "talentsphere:users:1",
                JSON.stringify({ id: 1 }),
                "EX",
                300
            );
        });

        it("should handle errors on set", async () => {
            mockRedis.set.mockRejectedValueOnce(new Error("Redis error"));

            await cache.set("test", { data: "test" });

            expect(cache.cacheStats.errors).toBe(1);
        });
    });

    describe("delete", () => {
        it("should delete key from cache", async () => {
            await cache.delete("users:1");

            expect(mockRedis.del).toHaveBeenCalledWith("talentsphere:users:1");
            expect(cache.cacheStats.deletes).toBe(1);
        });

        it("should handle delete errors", async () => {
            mockRedis.del.mockRejectedValueOnce(new Error("Redis error"));

            await cache.delete("test");

            expect(cache.cacheStats.errors).toBe(1);
        });
    });

    describe("invalidate", () => {
        it("should delete multiple keys matching pattern", async () => {
            mockRedis.keys.mockResolvedValueOnce([
                "talentsphere:users:1",
                "talentsphere:users:2",
                "talentsphere:posts:1",
            ]);
            mockRedis.del.mockResolvedValue(2);

            const deleted = await cache.invalidate("users:*");

            expect(mockRedis.keys).toHaveBeenCalledWith("talentsphere:users:*");
            expect(mockRedis.del).toHaveBeenCalledTimes(2);
            expect(deleted).toBe(2);
        });

        it("should return 0 when no keys match", async () => {
            mockRedis.keys.mockResolvedValueOnce([]);

            const deleted = await cache.invalidate("nonexistent:*");

            expect(deleted).toBe(0);
        });
    });

    describe("getStats", () => {
        it("should return cache statistics", () => {
            cache.cacheStats.hits = 10;
            cache.cacheStats.misses = 5;
            cache.cacheStats.sets = 8;
            cache.cacheStats.deletes = 2;

            const stats = cache.getStats();

            expect(stats).toEqual({
                hits: 10,
                misses: 5,
                sets: 8,
                deletes: 2,
                errors: 0,
                hitRate: "66.67%",
            });
        });

        it("should calculate 0% hit rate when no hits", () => {
            cache.cacheStats.hits = 0;
            cache.cacheStats.misses = 10;

            const stats = cache.getStats();

            expect(stats.hitRate).toBe("0.00%");
        });
    });

    describe("healthCheck", () => {
        it("should return healthy status when connected", async () => {
            cache.connected = true;

            const health = await cache.healthCheck();

            expect(health.status).toBe("healthy");
            expect(health.connected).toBe(true);
        });

        it("should return unhealthy status when not connected", async () => {
            cache.connected = false;

            const health = await cache.healthCheck();

            expect(health.status).toBe("unhealthy");
        });
    });

    describe("disconnect", () => {
        it("should disconnect from Redis", async () => {
            await cache.disconnect();

            expect(mockRedis.quit).toHaveBeenCalled();
            expect(cache.connected).toBe(false);
        });
    });
});
