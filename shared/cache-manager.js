/**
 * TalentSphere Redis Caching Strategy
 * Comprehensive caching for frequently accessed data
 */

const { createClient } = require("redis");
const crypto = require("crypto");
const config = require("../../../shared/config-manager");

class CacheManager {
    constructor() {
        this.client = null;
        this.defaultTTL = 3600; // 1 hour
        this.keyPrefix = config.getNestedConfig("redis.keyPrefix", "talentsphere:");

        this.initializeRedis();
        this.setupCacheStrategies();
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        try {
            const redisConfig = config.getRedisConfig();

            this.client = createClient({
                socket: {
                    host: redisConfig.host,
                    port: redisConfig.port,
                },
                password: redisConfig.password,
                database: redisConfig.db,
                keyPrefix: this.keyPrefix,
                retryDelayOnFailover: redisConfig.retryDelayOnFailover || 100,
                maxRetriesPerRequest: redisConfig.maxRetriesPerRequest || 3,
            });

            this.client.on("error", err => {
                console.error("Redis cache error:", err);
            });

            this.client.on("connect", () => {
                console.log("Connected to Redis cache");
            });

            this.client.on("ready", () => {
                console.log("Redis cache ready");
            });

            await this.client.connect();
        } catch (error) {
            console.error("Failed to initialize Redis cache:", error);
            this.client = null; // Fallback to no caching
        }
    }

    /**
     * Setup different cache strategies
     */
    setupCacheStrategies() {
        this.strategies = {
            // User session caching
            userSession: {
                ttl: 7200, // 2 hours
                keyPrefix: "session:",
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            },

            // User profile caching
            userProfile: {
                ttl: 1800, // 30 minutes
                keyPrefix: "profile:",
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            },

            // Job listings caching
            jobListings: {
                ttl: 600, // 10 minutes
                keyPrefix: "jobs:",
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            },

            // Company data caching
            companyData: {
                ttl: 3600, // 1 hour
                keyPrefix: "company:",
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            },

            // Search results caching
            searchResults: {
                ttl: 300, // 5 minutes
                keyPrefix: "search:",
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            },

            // API response caching
            apiResponse: {
                ttl: 60, // 1 minute
                keyPrefix: "api:",
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            },

            // Permission caching
            permissions: {
                ttl: 900, // 15 minutes
                keyPrefix: "permissions:",
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            },
        };
    }

    /**
     * Generate cache key
     */
    generateKey(strategy, identifier, suffix = "") {
        const config = this.strategies[strategy];
        if (!config) {
            throw new Error(`Unknown cache strategy: ${strategy}`);
        }

        const baseKey = config.keyPrefix + identifier;
        const suffixKey = suffix ? `:${suffix}` : "";

        return baseKey + suffixKey;
    }

    /**
     * Set cache value
     */
    async set(strategy, identifier, value, ttl = null, metadata = {}) {
        if (!this.client) {return false;}

        try {
            const config = this.strategies[strategy];
            const key = this.generateKey(strategy, identifier);
            const cacheTTL = ttl || config.ttl;
            const serializedValue = config.serialize(value);

            // Create cache entry with metadata
            const cacheEntry = {
                data: serializedValue,
                metadata: {
                    ...metadata,
                    createdAt: new Date().toISOString(),
                    strategy,
                    ttl: cacheTTL,
                },
            };

            await this.client.setEx(key, cacheTTL, JSON.stringify(cacheEntry));

            // Add to strategy tracking
            const trackingKey = `tracking:${strategy}:${identifier}`;
            await this.client.setEx(
                trackingKey,
                cacheTTL,
                JSON.stringify({
                    key,
                    createdAt: new Date().toISOString(),
                })
            );

            return true;
        } catch (error) {
            console.error("Cache set error:", error);
            return false;
        }
    }

    /**
     * Get cache value
     */
    async get(strategy, identifier) {
        if (!this.client) {return null;}

        try {
            const config = this.strategies[strategy];
            const key = this.generateKey(strategy, identifier);

            const cachedData = await this.client.get(key);
            if (!cachedData) {return null;}

            const cacheEntry = JSON.parse(cachedData);

            // Check if cache is still valid
            if (cacheEntry.metadata && cacheEntry.metadata.expiresAt) {
                const expiresAt = new Date(cacheEntry.metadata.expiresAt);
                if (expiresAt < new Date()) {
                    await this.invalidate(strategy, identifier);
                    return null;
                }
            }

            return config.deserialize(cacheEntry.data);
        } catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    }

    /**
     * Invalidate cache entry
     */
    async invalidate(strategy, identifier) {
        if (!this.client) {return false;}

        try {
            const key = this.generateKey(strategy, identifier);
            const trackingKey = `tracking:${strategy}:${identifier}`;

            await Promise.all([this.client.del(key), this.client.del(trackingKey)]);

            return true;
        } catch (error) {
            console.error("Cache invalidate error:", error);
            return false;
        }
    }

    /**
     * Invalidate all entries for a strategy
     */
    async invalidateStrategy(strategy) {
        if (!this.client) {return false;}

        try {
            const config = this.strategies[strategy];
            const pattern = this.keyPrefix + config.keyPrefix + "*";

            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }

            return true;
        } catch (error) {
            console.error("Strategy invalidate error:", error);
            return false;
        }
    }

    /**
     * Get or set cache (memoization pattern)
     */
    async getOrSet(strategy, identifier, fetchFunction, ttl = null, metadata = {}) {
        // Try to get from cache first
        let value = await this.get(strategy, identifier);

        if (value !== null) {
            return value;
        }

        // Cache miss - fetch and store
        try {
            value = await fetchFunction();
            await this.set(strategy, identifier, value, ttl, metadata);
            return value;
        } catch (error) {
            console.error("GetOrSet fetch error:", error);
            throw error;
        }
    }

    /**
     * Cache middleware for Express
     */
    middleware(strategy, options = {}) {
        return async (req, res, next) => {
            if (!this.client) {
                return next();
            }

            try {
                // Generate cache key from request
                const cacheKey = this.generateRequestKey(req, strategy);

                // Check cache first
                const cachedResponse = await this.get(strategy, cacheKey);

                if (cachedResponse && cachedResponse.statusCode && cachedResponse.body) {
                    // Return cached response
                    res.status(cachedResponse.statusCode);

                    // Copy headers
                    if (cachedResponse.headers) {
                        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
                            res.setHeader(key, value);
                        });
                    }

                    res.setHeader("X-Cache", "HIT");
                    return res.json(cachedResponse.body);
                }

                // Cache miss - intercept response
                const originalJson = res.json;
                const originalStatus = res.status;

                let statusCode = 200;
                let responseBody = null;
                let responseHeaders = {};

                res.status = function (code) {
                    statusCode = code;
                    return originalStatus.call(this, code);
                };

                res.json = function (body) {
                    responseBody = body;

                    // Cache the response if it's successful
                    if (statusCode >= 200 && statusCode < 300) {
                        const cacheTTL = options.getTTL ? options.getTTL(req, res) : null;

                        // Cache asynchronously (don't block response)
                        setTimeout(async () => {
                            await this.set(
                                strategy,
                                cacheKey,
                                {
                                    statusCode,
                                    body,
                                    headers: responseHeaders,
                                },
                                cacheTTL,
                                {
                                    url: req.url,
                                    method: req.method,
                                    cachedAt: new Date().toISOString(),
                                }
                            );
                        }, 0);
                    }

                    res.setHeader("X-Cache", "MISS");
                    return originalJson.call(this, body);
                };

                // Intercept headers
                const originalSetHeader = res.setHeader;
                res.setHeader = function (name, value) {
                    responseHeaders[name] = value;
                    return originalSetHeader.call(this, name, value);
                };

                next();
            } catch (error) {
                console.error("Cache middleware error:", error);
                next();
            }
        };
    }

    /**
     * Generate cache key from request
     */
    generateRequestKey(req, strategy) {
        const keyParts = [
            req.method,
            req.url,
            req.ip || req.connection.remoteAddress,
            req.get("User-Agent") || "",
        ];

        const keyData = keyParts.join("|");
        const hash = crypto.createHash("sha256").update(keyData).digest("hex");

        return `req:${hash}`;
    }

    /**
     * User session caching
     */
    async setUserSession(userId, sessionData, ttl = null) {
        return await this.set("userSession", userId, sessionData, ttl, {
            type: "session",
        });
    }

    async getUserSession(userId) {
        return await this.get("userSession", userId);
    }

    async invalidateUserSession(userId) {
        return await this.invalidate("userSession", userId);
    }

    /**
     * User profile caching
     */
    async setUserProfile(userId, profileData, ttl = null) {
        return await this.set("userProfile", userId, profileData, ttl, {
            type: "profile",
        });
    }

    async getUserProfile(userId) {
        return await this.get("userProfile", userId);
    }

    async invalidateUserProfile(userId) {
        return await this.invalidate("userProfile", userId);
    }

    /**
     * Job listings caching
     */
    async setJobListings(queryHash, jobsData, ttl = null) {
        return await this.set("jobListings", queryHash, jobsData, ttl, {
            type: "jobs",
        });
    }

    async getJobListings(queryHash) {
        return await this.get("jobListings", queryHash);
    }

    async invalidateJobListings(queryHash = null) {
        if (queryHash) {
            return await this.invalidate("jobListings", queryHash);
        } else {
            return await this.invalidateStrategy("jobListings");
        }
    }

    /**
     * Search results caching
     */
    async setSearchResults(searchHash, resultsData, ttl = null) {
        return await this.set("searchResults", searchHash, resultsData, ttl, {
            type: "search",
        });
    }

    async getSearchResults(searchHash) {
        return await this.get("searchResults", searchHash);
    }

    /**
     * Cache warming
     */
    async warmCache() {
        console.log("Starting cache warmup...");

        try {
            // Warm frequently accessed data
            await this.warmUserProfiles();
            await this.warmJobListings();
            await this.warmCompanyData();

            console.log("Cache warmup completed");
        } catch (error) {
            console.error("Cache warmup error:", error);
        }
    }

    async warmUserProfiles() {
        // Example: Warm active user profiles
        const activeUsers = await this.database?.query(`
            SELECT id FROM users 
            WHERE is_active = true AND last_login > NOW() - INTERVAL '7 days'
            LIMIT 100
        `);

        if (activeUsers?.rows) {
            for (const user of activeUsers.rows) {
                // This would call the user service to get profile
                // await this.setUserProfile(user.id, userProfileData);
            }
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.client) {
            return { status: "disconnected" };
        }

        try {
            const info = await this.client.info();
            const keyspace = await this.client.dbSize();

            return {
                status: "connected",
                keyspace,
                strategies: Object.keys(this.strategies),
                redis: {
                    version: info.redis_version,
                    usedMemory: info.used_memory_human,
                    connectedClients: info.connected_clients,
                    uptime: info.uptime_in_seconds,
                },
            };
        } catch (error) {
            return { status: "error", error: error.message };
        }
    }

    /**
     * Clear all cache
     */
    async clear() {
        if (!this.client) {return false;}

        try {
            const pattern = this.keyPrefix + "*";
            const keys = await this.client.keys(pattern);

            if (keys.length > 0) {
                await this.client.del(keys);
            }

            return true;
        } catch (error) {
            console.error("Cache clear error:", error);
            return false;
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.client) {
            await this.client.quit();
            console.log("Cache manager shutdown complete");
        }
    }
}

// Singleton instance
const cacheManager = new CacheManager();

module.exports = {
    CacheManager,
    cacheManager,
};
