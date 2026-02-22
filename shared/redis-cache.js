/**
 * Advanced Redis Caching Layer for TalentSphere
 * Provides intelligent caching, cache invalidation, and performance monitoring
 */

const Redis = require("ioredis");
const crypto = require("crypto");
const { logger } = require("./error-handler");

class RedisCache {
    constructor(options = {}) {
        this.redis = null;
        this.connected = false;
        this.options = {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || "",
            db: parseInt(process.env.REDIS_DB) || 0,
            keyPrefix: "talentsphere:",
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            ...options,
        };

        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
        };

        this.cachePolicies = new Map();
        this.defaultTTL = 300; // 5 minutes
    }

    /**
     * Connect to Redis
     */
    async connect() {
        try {
            logger.info("Connecting to Redis cache...");

            this.redis = new Redis(this.options);

            this.redis.on("connect", () => {
                logger.info("Redis connected successfully");
                this.connected = true;
            });

            this.redis.on("error", error => {
                logger.error("Redis connection error:", error);
                this.connected = false;
                this.cacheStats.errors++;
            });

            this.redis.on("close", () => {
                logger.warn("Redis connection closed");
                this.connected = false;
            });

            this.redis.on("reconnecting", () => {
                logger.info("Redis reconnecting...");
            });

            // Test connection
            await this.redis.ping();

            logger.info("✅ Redis cache initialized successfully");
        } catch (error) {
            logger.error("❌ Failed to connect to Redis:", error.message);
            this.connected = false;
        }
    }

    /**
     * Generate cache key
     */
    generateKey(prefix, identifier, namespace = null) {
        const parts = [this.options.keyPrefix];

        if (namespace) {
            parts.push(namespace);
        }

        parts.push(prefix);

        if (identifier) {
            // Hash long identifiers to keep keys short
            if (typeof identifier === "string" && identifier.length > 100) {
                identifier = crypto.createHash("md5").update(identifier).digest("hex");
            } else if (typeof identifier === "object") {
                identifier = crypto
                    .createHash("md5")
                    .update(JSON.stringify(identifier))
                    .digest("hex");
            }

            parts.push(String(identifier));
        }

        return parts.join(":");
    }

    /**
     * Set cache policy
     */
    setPolicy(keyPrefix, policy) {
        this.cachePolicies.set(keyPrefix, {
            ttl: policy.ttl || this.defaultTTL,
            maxSize: policy.maxSize || 1000,
            tags: policy.tags || [],
            invalidateOn: policy.invalidateOn || [],
            ...policy,
        });
    }

    /**
     * Get cache policy for key
     */
    getPolicy(keyPrefix) {
        return (
            this.cachePolicies.get(keyPrefix) || {
                ttl: this.defaultTTL,
                maxSize: 1000,
                tags: [],
                invalidateOn: [],
            }
        );
    }

    /**
     * Get cached value
     */
    async get(key, options = {}) {
        if (!this.connected) {
            this.cacheStats.misses++;
            return null;
        }

        try {
            const value = await this.redis.get(key);

            if (value === null) {
                this.cacheStats.misses++;
                return null;
            }

            this.cacheStats.hits++;

            // Parse JSON if needed
            if (options.parseJson !== false) {
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            }

            return value;
        } catch (error) {
            logger.error("Cache get error:", error);
            this.cacheStats.errors++;
            this.cacheStats.misses++;
            return null;
        }
    }

    /**
     * Set cached value
     */
    async set(key, value, options = {}) {
        if (!this.connected) {
            return false;
        }

        try {
            // Stringify objects
            const serializedValue = typeof value === "object" ? JSON.stringify(value) : value;

            // Get TTL from policy or options
            const policy = this.getPolicy(key.split(":")[1]);
            const ttl = options.ttl || policy.ttl || this.defaultTTL;

            await this.redis.setex(key, ttl, serializedValue);

            this.cacheStats.sets++;

            // Add to tag sets if tags are specified
            if (options.tags || policy.tags.length > 0) {
                const tags = options.tags || policy.tags;
                for (const tag of tags) {
                    await this.redis.sadd(`tag:${tag}`, key);
                    await this.redis.expire(`tag:${tag}`, ttl);
                }
            }

            return true;
        } catch (error) {
            logger.error("Cache set error:", error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Delete cached value
     */
    async del(key) {
        if (!this.connected) {
            return false;
        }

        try {
            await this.redis.del(key);
            this.cacheStats.deletes++;
            return true;
        } catch (error) {
            logger.error("Cache delete error:", error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Invalidate cache by tag
     */
    async invalidateByTag(tag) {
        if (!this.connected) {
            return false;
        }

        try {
            const keys = await this.redis.smembers(`tag:${tag}`);

            if (keys.length > 0) {
                await this.redis.del(...keys, `tag:${tag}`);
            }

            logger.info(`Invalidated ${keys.length} cache entries for tag: ${tag}`);
            return true;
        } catch (error) {
            logger.error("Cache invalidation error:", error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Cache wrapper for database queries
     */
    async cachedQuery(keyPrefix, identifier, queryFunction, options = {}) {
        const cacheKey = this.generateKey(keyPrefix, identifier, options.namespace);

        // Try to get from cache first
        const cached = await this.get(cacheKey, { parseJson: true });
        if (cached !== null) {
            return cached;
        }

        // Execute query and cache result
        try {
            const result = await queryFunction();

            // Only cache if result is not null/undefined
            if (result !== null && result !== undefined) {
                await this.set(cacheKey, result, options);
            }

            return result;
        } catch (error) {
            logger.error("Cache wrapper query error:", error);
            throw error;
        }
    }

    /**
     * Multi-get operation
     */
    async mget(keys) {
        if (!this.connected || keys.length === 0) {
            return [];
        }

        try {
            const values = await this.redis.mget(...keys);

            return values.map(value => {
                if (value === null) {
                    return null;
                }

                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            });
        } catch (error) {
            logger.error("Cache mget error:", error);
            this.cacheStats.errors++;
            return keys.map(() => null);
        }
    }

    /**
     * Multi-set operation
     */
    async mset(keyValuePairs, options = {}) {
        if (!this.connected || keyValuePairs.length === 0) {
            return false;
        }

        try {
            const policy = options.policy || { ttl: this.defaultTTL };

            // Use pipeline for better performance
            const pipeline = this.redis.pipeline();

            for (const [key, value] of keyValuePairs) {
                const serializedValue = typeof value === "object" ? JSON.stringify(value) : value;
                pipeline.setex(key, policy.ttl, serializedValue);
            }

            const results = await pipeline.exec();

            // Check for individual command errors
            if (results) {
                const errors = results.filter(r => r[0] instanceof Error);
                if (errors.length > 0) {
                    logger.warn(
                        `Pipeline had ${errors.length} errors during mset:`,
                        errors.map(e => e[0].message)
                    );
                    this.cacheStats.errors += errors.length;
                }
            }

            this.cacheStats.sets += keyValuePairs.length;
            return true;
        } catch (error) {
            logger.error("Cache mset error:", error);
            this.cacheStats.errors++;
            return false;
        }
    }

    /**
     * Increment counter
     */
    async incr(key, amount = 1, options = {}) {
        if (!this.connected) {
            return null;
        }

        try {
            let result;

            if (amount === 1) {
                result = await this.redis.incr(key);
            } else {
                result = await this.redis.incrby(key, amount);
            }

            // Set expiration if specified
            if (options.ttl) {
                await this.redis.expire(key, options.ttl);
            }

            return result;
        } catch (error) {
            logger.error("Cache increment error:", error);
            this.cacheStats.errors++;
            return null;
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate =
            this.cacheStats.hits + this.cacheStats.misses > 0
                ? (
                      (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) *
                      100
                  ).toFixed(2)
                : 0;

        return {
            ...this.cacheStats,
            hitRate: `${hitRate}%`,
            connected: this.connected,
            total: this.cacheStats.hits + this.cacheStats.misses,
        };
    }

    /**
     * Clear all cache (use with caution)
     */
    async flushAll() {
        if (!this.connected) {
            return false;
        }

        try {
            await this.redis.flushdb();
            logger.warn("Cache flushed completely");
            return true;
        } catch (error) {
            logger.error("Cache flush error:", error);
            return false;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        if (!this.connected) {
            return {
                status: "unhealthy",
                message: "Not connected to Redis",
            };
        }

        try {
            const start = Date.now();
            await this.redis.ping();
            const latency = Date.now() - start;

            const info = await this.redis.info("memory");
            const memoryMatch = info.match(/used_memory:(\d+)/);
            const memoryUsed = memoryMatch ? parseInt(memoryMatch[1]) : 0;

            return {
                status: "healthy",
                latency: `${latency}ms`,
                memoryUsed: `${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
                stats: this.getStats(),
            };
        } catch (error) {
            return {
                status: "unhealthy",
                message: error.message,
            };
        }
    }

    /**
     * Close Redis connection
     */
    async disconnect() {
        if (this.redis) {
            await this.redis.quit();
            this.connected = false;
            logger.info("Redis connection closed");
        }
    }
}

/**
 * Cache Middleware Factory
 */
function cacheMiddleware(options = {}) {
    const cache = new RedisCache();

    // Connect to Redis
    cache.connect().catch(error => {
        logger.error("Failed to connect cache middleware:", error);
    });

    return (req, res, next) => {
        // Add cache instance to request
        req.cache = cache;

        // Add cache response method
        res.cache = async (keyPrefix, identifier, data, cacheOptions = {}) => {
            const cacheKey = cache.generateKey(keyPrefix, identifier, cacheOptions.namespace);
            await cache.set(cacheKey, data, cacheOptions);
        };

        // Add cache response timing
        const originalJson = res.json;
        res.json = function (data) {
            // Cache successful GET responses
            if (req.method === "GET" && res.statusCode < 400 && options.cache !== false) {
                const cacheKey = cache.generateKey(
                    options.keyPrefix || "api",
                    `${req.method}:${req.originalUrl}`,
                    options.namespace
                );

                cache
                    .set(cacheKey, data, {
                        ttl: options.ttl || 300,
                        tags: options.tags || ["api-response"],
                    })
                    .catch(error => {
                        logger.warn("Failed to cache response:", error);
                    });
            }

            return originalJson.call(this, data);
        };

        next();
    };
}

module.exports = {
    RedisCache,
    cacheMiddleware,
};
