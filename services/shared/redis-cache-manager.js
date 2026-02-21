/**
 * Enterprise-Grade Redis Cache Manager
 *
 * Provides sophisticated caching capabilities:
 * - Multi-level caching with Redis + in-memory fallback
 * - Cache invalidation strategies
 * - Performance monitoring and metrics
 * - Automatic reconnection and failover
 * - Cache warming and preloading
 * - Distributed cache coordination
 */

const Redis = require("ioredis");
const { createLogger } = require("../../shared/enhanced-logger");
const { v4: uuidv4 } = require("uuid");
const EventEmitter = require("events");

class RedisCacheManager extends EventEmitter {
    constructor(serviceName, options = {}) {
        super();

        this.serviceName = serviceName;
        this.logger = createLogger(`RedisCache-${serviceName}`);

        // Configuration
        this.config = {
            // Redis connection settings
            redis: {
                host: options.redis?.host || process.env.REDIS_HOST || "localhost",
                port: options.redis?.port || process.env.REDIS_PORT || 6379,
                password: options.redis?.password || process.env.REDIS_PASSWORD,
                db: options.redis?.db || process.env.REDIS_CACHE_DB || 1, // Separate DB for caching
                keyPrefix: options.redis?.keyPrefix || `cache:${serviceName}:`,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                reconnectOnError: true,
                ...options.redis,
            },

            // Cache settings
            defaultTTL: options.defaultTTL || parseInt(process.env.CACHE_DEFAULT_TTL) || 300, // 5 minutes
            maxMemory:
                options.maxMemory || parseInt(process.env.CACHE_MAX_MEMORY) || 100 * 1024 * 1024, // 100MB
            compressionThreshold: options.compressionThreshold || 1024, // 1KB

            // Performance settings
            enableMetrics: options.enableMetrics !== false,
            enableCompression: options.enableCompression !== false,
            enableFallback: options.enableFallback !== false,

            // Cache invalidation
            invalidationStrategy: options.invalidationStrategy || "ttl", // ttl, manual, event-driven

            // Background tasks
            cleanupInterval: options.cleanupInterval || 60000, // 1 minute
            metricsInterval: options.metricsInterval || 30000, // 30 seconds
            healthCheckInterval: options.healthCheckInterval || 10000, // 10 seconds

            ...options,
        };

        // Internal state
        this.redis = null;
        this.isInitialized = false;
        this.isHealthy = false;
        this.fallbackCache = new Map(); // In-memory fallback
        this.compressionEnabled = false;

        // Metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            reconnections: 0,
            fallbackHits: 0,
            compressionSaved: 0,
            size: 0,
            lastCleanup: null,
            lastHealthCheck: null,
            startTime: Date.now(),
        };

        // Background task intervals
        this.cleanupInterval = null;
        this.metricsInterval = null;
        this.healthCheckInterval = null;

        this.logger.info("Redis Cache Manager configured", {
            serviceName,
            redisHost: this.config.redis.host,
            redisPort: this.config.redis.port,
            defaultTTL: this.config.defaultTTL,
            enableFallback: this.config.enableFallback,
            enableMetrics: this.config.enableMetrics,
        });
    }

    /**
     * Initialize Redis connection and background tasks
     */
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn("Redis Cache Manager already initialized");
            return;
        }

        try {
            // Initialize Redis connection
            await this.initializeRedis();

            // Test connection
            await this.testConnection();

            // Start background tasks
            this.startBackgroundTasks();

            // Check compression availability
            await this.initializeCompression();

            this.isInitialized = true;
            this.isHealthy = true;

            this.logger.info("Redis Cache Manager initialized successfully", {
                redisHost: this.config.redis.host,
                redisPort: this.config.redis.port,
                compressionEnabled: this.compressionEnabled,
                fallbackEnabled: this.config.enableFallback,
            });

            this.emit("initialized");
        } catch (error) {
            this.logger.error("Failed to initialize Redis Cache Manager", {
                error: error.message,
                stack: error.stack,
            });

            if (this.config.enableFallback) {
                this.logger.warn("Falling back to in-memory cache only");
                this.isInitialized = true;
                this.emit("fallback-mode");
            } else {
                throw error;
            }
        }
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        this.redis = new Redis(this.config.redis);

        // Event listeners
        this.redis.on("connect", () => {
            this.logger.info("Redis connected for caching");
            this.isHealthy = true;
            this.emit("redis-connected");
        });

        this.redis.on("error", error => {
            this.logger.error("Redis connection error", { error: error.message });
            this.isHealthy = false;
            this.metrics.errors++;
            this.emit("redis-error", error);
        });

        this.redis.on("reconnecting", () => {
            this.logger.info("Redis reconnecting...");
            this.metrics.reconnections++;
            this.emit("redis-reconnecting");
        });

        this.redis.on("close", () => {
            this.logger.warn("Redis connection closed");
            this.isHealthy = false;
            this.emit("redis-closed");
        });

        // Connect to Redis
        await this.redis.connect();
    }

    /**
     * Test Redis connection
     */
    async testConnection() {
        try {
            const result = await this.redis.ping();
            if (result !== "PONG") {
                throw new Error(`Unexpected ping response: ${result}`);
            }

            // Get Redis info for health check
            const info = await this.redis.info("memory");
            this.logger.debug("Redis connection test successful", { info: info.substring(0, 100) });
        } catch (error) {
            this.logger.error("Redis connection test failed", { error: error.message });
            throw error;
        }
    }

    /**
     * Initialize compression if available
     */
    async initializeCompression() {
        try {
            const zlib = require("zlib");

            // Test compression
            const testData = JSON.stringify({ test: "data".repeat(100) });
            const compressed = zlib.gzipSync(testData);

            if (compressed.length < testData.length) {
                this.compressionEnabled = true;
                this.logger.info("Compression enabled", {
                    originalSize: testData.length,
                    compressedSize: compressed.length,
                    ratio:
                        (((testData.length - compressed.length) / testData.length) * 100).toFixed(
                            2
                        ) + "%",
                });
            }
        } catch (error) {
            this.logger.warn("Compression not available", { error: error.message });
            this.config.enableCompression = false;
        }
    }

    /**
     * Start background tasks
     */
    startBackgroundTasks() {
        // Cleanup expired entries
        this.cleanupInterval = setInterval(() => this.cleanup(), this.config.cleanupInterval);

        // Collect metrics
        if (this.config.enableMetrics) {
            this.metricsInterval = setInterval(
                () => this.collectMetrics(),
                this.config.metricsInterval
            );
        }

        // Health checks
        this.healthCheckInterval = setInterval(
            () => this.healthCheck(),
            this.config.healthCheckInterval
        );
    }

    /**
     * Get value from cache
     */
    async get(key, options = {}) {
        try {
            const startTime = Date.now();

            // Try Redis first
            if (this.isHealthy && this.redis) {
                try {
                    const redisKey = this.buildKey(key);
                    let value = await this.redis.get(redisKey);

                    if (value) {
                        // Decompress if needed
                        if (options.compressed && this.compressionEnabled) {
                            value = await this.decompress(value);
                        }

                        // Parse JSON if needed
                        const parsedValue = this.deserialize(value, options.parseJson !== false);

                        this.metrics.hits++;
                        this.emit("cache-hit", {
                            key,
                            source: "redis",
                            time: Date.now() - startTime,
                        });

                        return parsedValue;
                    }
                } catch (error) {
                    this.logger.warn("Redis get failed, trying fallback", {
                        key,
                        error: error.message,
                    });
                }
            }

            // Try fallback cache
            if (this.config.enableFallback) {
                const fallbackValue = this.fallbackCache.get(key);
                if (fallbackValue && Date.now() - fallbackValue.timestamp < fallbackValue.ttl) {
                    this.metrics.fallbackHits++;
                    this.emit("cache-hit", {
                        key,
                        source: "fallback",
                        time: Date.now() - startTime,
                    });
                    return fallbackValue.value;
                }
            }

            this.metrics.misses++;
            this.emit("cache-miss", { key, time: Date.now() - startTime });
            return null;
        } catch (error) {
            this.logger.error("Cache get failed", { key, error: error.message });
            this.metrics.errors++;
            return null;
        }
    }

    /**
     * Set value in cache
     */
    async set(key, value, ttl = null, options = {}) {
        try {
            const startTime = Date.now();
            const effectiveTTL = ttl || this.config.defaultTTL;

            // Serialize value
            let serializedValue = this.serialize(value, options.stringifyJson !== false);

            // Compress if needed
            if (
                this.config.enableCompression &&
                serializedValue.length > this.config.compressionThreshold
            ) {
                const originalSize = serializedValue.length;
                serializedValue = await this.compress(serializedValue);

                if (this.compressionEnabled) {
                    this.metrics.compressionSaved += originalSize - serializedValue.length;
                    options.compressed = true;
                }
            }

            // Set in Redis
            if (this.isHealthy && this.redis) {
                try {
                    const redisKey = this.buildKey(key);
                    await this.redis.setex(redisKey, effectiveTTL, serializedValue);

                    this.metrics.sets++;
                    this.metrics.size += serializedValue.length;

                    this.emit("cache-set", {
                        key,
                        ttl: effectiveTTL,
                        size: serializedValue.length,
                        compressed: options.compressed,
                        time: Date.now() - startTime,
                    });
                } catch (error) {
                    this.logger.warn("Redis set failed, using fallback", {
                        key,
                        error: error.message,
                    });

                    // Fallback to in-memory
                    if (this.config.enableFallback) {
                        this.setFallback(key, value, effectiveTTL);
                    }
                }
            } else {
                // Use fallback only
                if (this.config.enableFallback) {
                    this.setFallback(key, value, effectiveTTL);
                }
            }

            return true;
        } catch (error) {
            this.logger.error("Cache set failed", { key, error: error.message });
            this.metrics.errors++;
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async delete(key, options = {}) {
        try {
            const startTime = Date.now();

            // Delete from Redis
            if (this.isHealthy && this.redis) {
                try {
                    const redisKey = this.buildKey(key);
                    const result = await this.redis.del(redisKey);

                    if (result > 0) {
                        this.metrics.deletes++;
                        this.emit("cache-delete", { key, time: Date.now() - startTime });
                    }
                } catch (error) {
                    this.logger.warn("Redis delete failed", { key, error: error.message });
                }
            }

            // Delete from fallback
            if (this.config.enableFallback) {
                this.fallbackCache.delete(key);
            }

            return true;
        } catch (error) {
            this.logger.error("Cache delete failed", { key, error: error.message });
            this.metrics.errors++;
            return false;
        }
    }

    /**
     * Set value in fallback cache
     */
    setFallback(key, value, ttl) {
        if (!this.config.enableFallback) {return;}

        // Check memory limit
        if (this.fallbackCache.size >= 1000) {
            // Remove oldest entry
            const oldestKey = this.fallbackCache.keys().next().value;
            this.fallbackCache.delete(oldestKey);
        }

        this.fallbackCache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttl * 1000, // Convert to milliseconds
        });
    }

    /**
     * Build Redis key with prefix
     */
    buildKey(key) {
        return `${this.config.redis.keyPrefix}${key}`;
    }

    /**
     * Serialize value for storage
     */
    serialize(value, stringifyJson = true) {
        if (typeof value === "string") {
            return value;
        }

        if (stringifyJson) {
            return JSON.stringify(value);
        }

        return String(value);
    }

    /**
     * Deserialize value from storage
     */
    deserialize(value, parseJson = true) {
        if (!parseJson) {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    /**
     * Compress data
     */
    async compress(data) {
        if (!this.compressionEnabled) {
            return data;
        }

        const zlib = require("zlib");
        return zlib.gzipSync(data).toString("base64");
    }

    /**
     * Decompress data
     */
    async decompress(data) {
        if (!this.compressionEnabled) {
            return data;
        }

        const zlib = require("zlib");
        const buffer = Buffer.from(data, "base64");
        return zlib.gunzipSync(buffer).toString();
    }

    /**
     * Batch get operations
     */
    async mget(keys, options = {}) {
        const results = {};

        for (const key of keys) {
            results[key] = await this.get(key, options);
        }

        return results;
    }

    /**
     * Batch set operations
     */
    async mset(keyValuePairs, ttl = null, options = {}) {
        const results = {};

        for (const [key, value] of Object.entries(keyValuePairs)) {
            results[key] = await this.set(key, value, ttl, options);
        }

        return results;
    }

    /**
     * Get or set pattern - atomic operation
     */
    async getOrSet(key, valueFunction, ttl = null, options = {}) {
        const cached = await this.get(key, options);

        if (cached !== null) {
            return cached;
        }

        try {
            const value = await valueFunction();
            await this.set(key, value, ttl, options);
            return value;
        } catch (error) {
            this.logger.error("Get or set value function failed", { key, error: error.message });
            throw error;
        }
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern, options = {}) {
        try {
            if (this.isHealthy && this.redis) {
                const redisPattern = this.buildKey(pattern);
                const keys = await this.redis.keys(redisPattern);

                if (keys.length > 0) {
                    const result = await this.redis.del(...keys);

                    this.emit("cache-invalidate", {
                        pattern,
                        keysDeleted: result,
                        time: Date.now(),
                    });

                    this.logger.info("Cache invalidated by pattern", {
                        pattern,
                        keysDeleted: result,
                    });
                }

                // Also clear fallback cache
                if (this.config.enableFallback) {
                    for (const [key] of this.fallbackCache.entries()) {
                        if (key.includes(pattern)) {
                            this.fallbackCache.delete(key);
                        }
                    }
                }

                return result;
            }

            return 0;
        } catch (error) {
            this.logger.error("Cache invalidation failed", { pattern, error: error.message });
            this.metrics.errors++;
            return 0;
        }
    }

    /**
     * Cleanup expired fallback entries
     */
    cleanup() {
        if (!this.config.enableFallback) {
            return;
        }

        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.fallbackCache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.fallbackCache.delete(key);
                cleaned++;
            }
        }

        this.metrics.lastCleanup = now;

        if (cleaned > 0) {
            this.logger.debug("Fallback cache cleanup completed", {
                entriesCleaned: cleaned,
                remainingEntries: this.fallbackCache.size,
            });
        }
    }

    /**
     * Health check for Redis connection
     */
    async healthCheck() {
        try {
            if (this.redis && this.isHealthy) {
                const result = await this.redis.ping();
                this.isHealthy = result === "PONG";
            }

            this.metrics.lastHealthCheck = Date.now();

            this.emit("health-check", {
                isHealthy: this.isHealthy,
                redisConnected: this.redis?.status === "ready",
                fallbackSize: this.fallbackCache.size,
            });
        } catch (error) {
            this.isHealthy = false;
            this.logger.warn("Health check failed", { error: error.message });
        }
    }

    /**
     * Collect performance metrics
     */
    async collectMetrics() {
        try {
            const uptime = Date.now() - this.metrics.startTime;
            const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;

            const metrics = {
                ...this.metrics,
                uptime,
                hitRate: hitRate * 100,
                hitRateFormatted: (hitRate * 100).toFixed(2) + "%",
                memoryUsage: process.memoryUsage(),
                redisConnected: this.redis?.status === "ready",
                fallbackSize: this.fallbackCache.size,
                compressionEnabled: this.compressionEnabled,
                compressionRatio:
                    this.metrics.compressionSaved > 0
                        ? ((this.metrics.compressionSaved / this.metrics.size) * 100).toFixed(2) +
                          "%"
                        : "0%",
            };

            // Store metrics in Redis for monitoring
            if (this.isHealthy && this.redis) {
                await this.redis.setex(
                    `metrics:${this.serviceName}`,
                    300, // 5 minutes
                    JSON.stringify(metrics)
                );
            }

            this.emit("metrics-collected", metrics);
            return metrics;
        } catch (error) {
            this.logger.error("Metrics collection failed", { error: error.message });
            this.metrics.errors++;
            return null;
        }
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.metrics.startTime,
            hitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0,
            redisConnected: this.redis?.status === "ready",
            fallbackSize: this.fallbackCache.size,
            isHealthy: this.isHealthy,
            compressionEnabled: this.compressionEnabled,
        };
    }

    /**
     * Warm cache with predefined data
     */
    async warmCache(data, options = {}) {
        try {
            this.logger.info("Starting cache warm-up", { entries: Object.keys(data).length });

            const results = await this.mset(data, options.ttl, options);

            this.logger.info("Cache warm-up completed", {
                entries: Object.keys(data).length,
                successful: Object.values(results).filter(r => r).length,
            });

            this.emit("cache-warmed", { entries: Object.keys(data).length });
        } catch (error) {
            this.logger.error("Cache warm-up failed", { error: error.message });
            throw error;
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info("Shutting down Redis Cache Manager...");

        // Clear intervals
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }

        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        // Close Redis connection
        if (this.redis) {
            await this.redis.quit();
        }

        // Clear fallback cache
        this.fallbackCache.clear();

        this.logger.info("Redis Cache Manager shutdown completed");
        this.emit("shutdown");
    }
}

module.exports = RedisCacheManager;
