const redis = require('redis');
const winston = require('winston');
const { promisify } = require('util');

/**
 * Comprehensive Caching Service
 * Implements multi-layer caching strategy with Redis
 */
class CachingService {
    constructor(options = {}) {
        this.options = {
            redis: {
                host: options.redis?.host || process.env.REDIS_HOST || 'localhost',
                port: options.redis?.port || process.env.REDIS_PORT || 6379,
                password: options.redis?.password || process.env.REDIS_PASSWORD,
                db: options.redis?.db || 0,
                connectTimeout: 10000,
                lazyConnect: true
            },
            defaultTTL: options.defaultTTL || 3600, // 1 hour default
            maxMemory: options.maxMemory || '256mb',
            evictionPolicy: options.evictionPolicy || 'allkeys-lru',
            enableClustering: options.enableClustering || false,
            ...options
        };

        this.client = null;
        this.isConnected = false;
        this.cacheStats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0
        };

        this.setupRedisClient();
    }

    setupRedisClient() {
        try {
            this.client = redis.createClient(this.options.redis);

            this.client.on('connect', () => {
                this.isConnected = true;
                winston.info('Redis cache connected successfully');
                this.configureRedis();
            });

            this.client.on('error', (error) => {
                this.isConnected = false;
                this.cacheStats.errors++;
                winston.error('Redis cache error:', error);
            });

            this.client.on('ready', () => {
                winston.info('Redis cache ready for operations');
            });

            this.client.on('end', () => {
                this.isConnected = false;
                winston.info('Redis cache connection ended');
            });

            // Promisify Redis methods
            this.getAsync = promisify(this.client.get).bind(this.client);
            this.setAsync = promisify(this.client.set).bind(this.client);
            this.delAsync = promisify(this.client.del).bind(this.client);
            this.existsAsync = promisify(this.client.exists).bind(this.client);
            this.expireAsync = promisify(this.client.expire).bind(this.client);
            this.ttlAsync = promisify(this.client.ttl).bind(this.client);
            this.keysAsync = promisify(this.client.keys).bind(this.client);
            this.flushdbAsync = promisify(this.client.flushdb).bind(this.client);

        } catch (error) {
            winston.error('Failed to setup Redis client:', error);
        }
    }

    async configureRedis() {
        if (!this.isConnected) {return;}

        try {
            // Configure memory management
            await this.client.config('SET', 'maxmemory', this.options.maxMemory);
            await this.client.config('SET', 'maxmemory-policy', this.options.evictionPolicy);

            // Enable keyspace notifications for cache invalidation
            await this.client.config('SET', 'notify-keyspace-events', 'Exe');

            winston.info(`Redis configured with ${this.options.maxMemory} memory limit`);
        } catch (error) {
            winston.warn('Could not configure Redis settings:', error.message);
        }
    }

    async connect() {
        if (!this.client) {return false;}

        try {
            await this.client.connect();
            this.isConnected = true;
            return true;
        } catch (error) {
            winston.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            return false;
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }

    // Core caching operations
    async get(key) {
        if (!this.isConnected) {
            return null;
        }

        try {
            const value = await this.getAsync(key);
            if (value !== null) {
                this.cacheStats.hits++;
                return JSON.parse(value);
            } else {
                this.cacheStats.misses++;
                return null;
            }
        } catch (error) {
            this.cacheStats.errors++;
            winston.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = this.options.defaultTTL) {
        if (!this.isConnected) {
            return false;
        }

        try {
            const serializedValue = JSON.stringify(value);
            const result = await this.setAsync(key, serializedValue, {
                EX: ttl
            });

            this.cacheStats.sets++;
            return result === 'OK';
        } catch (error) {
            this.cacheStats.errors++;
            winston.error(`Cache SET error for key ${key}:`, error);
            return false;
        }
    }

    async delete(key) {
        if (!this.isConnected) {
            return false;
        }

        try {
            const result = await this.delAsync(key);
            this.cacheStats.deletes++;
            return result > 0;
        } catch (error) {
            this.cacheStats.errors++;
            winston.error(`Cache DELETE error for key ${key}:`, error);
            return false;
        }
    }

    async exists(key) {
        if (!this.isConnected) {
            return false;
        }

        try {
            const result = await this.existsAsync(key);
            return result === 1;
        } catch (error) {
            winston.error(`Cache EXISTS error for key ${key}:`, error);
            return false;
        }
    }

    async getTTL(key) {
        if (!this.isConnected) {
            return -1;
        }

        try {
            return await this.ttlAsync(key);
        } catch (error) {
            winston.error(`Cache TTL error for key ${key}:`, error);
            return -1;
        }
    }

    // Cache patterns
    async cacheAside(key, fetchFunction, ttl = this.options.defaultTTL) {
        // Try cache first
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch from source
        try {
            const data = await fetchFunction();
            if (data !== null && data !== undefined) {
                await this.set(key, data, ttl);
            }
            return data;
        } catch (error) {
            winston.error('Cache-aside fetch failed:', error);
            throw error;
        }
    }

    async writeThrough(key, value, persistFunction, ttl = this.options.defaultTTL) {
        try {
            // Write to cache
            await this.set(key, value, ttl);

            // Write to persistent storage
            await persistFunction(value);

            return true;
        } catch (error) {
            winston.error('Write-through operation failed:', error);
            // Invalidate cache on failure
            await this.delete(key);
            throw error;
        }
    }

    // Cache invalidation strategies
    async invalidatePattern(pattern) {
        if (!this.isConnected) {return 0;}

        try {
            const keys = await this.keysAsync(pattern);
            if (keys.length > 0) {
                const result = await this.client.del(keys);
                winston.info(`Invalidated ${result} keys matching pattern: ${pattern}`);
                return result;
            }
            return 0;
        } catch (error) {
            winston.error(`Cache invalidation error for pattern ${pattern}:`, error);
            return 0;
        }
    }

    async invalidateByTag(tag) {
        const pattern = `tag:${tag}:*`;
        return await this.invalidatePattern(pattern);
    }

    // Cache warming
    async warmCache(warmFunctions) {
        winston.info('Starting cache warming process...');

        const results = [];
        for (const [key, warmFunction] of Object.entries(warmFunctions)) {
            try {
                const data = await warmFunction();
                if (data) {
                    await this.set(key, data);
                    results.push({ key, status: 'success' });
                    winston.info(`Warmed cache for key: ${key}`);
                }
            } catch (error) {
                results.push({ key, status: 'failed', error: error.message });
                winston.error(`Failed to warm cache for key ${key}:`, error);
            }
        }

        return results;
    }

    // Cache monitoring
    async getStats() {
        if (!this.isConnected) {
            return { ...this.cacheStats, connected: false };
        }

        try {
            const info = await this.client.info();
            const lines = info.split('\n');
            const redisStats = {};

            lines.forEach(line => {
                if (line.includes(':')) {
                    const [key, value] = line.split(':');
                    redisStats[key.trim()] = value.trim();
                }
            });

            return {
                ...this.cacheStats,
                connected: true,
                redis: {
                    used_memory: redisStats.used_memory_human,
                    connected_clients: redisStats.connected_clients,
                    total_commands_processed: redisStats.total_commands_processed,
                    instantaneous_ops_per_sec: redisStats.instantaneous_ops_per_sec,
                    hit_rate: this.calculateHitRate()
                }
            };
        } catch (error) {
            winston.error('Failed to get cache stats:', error);
            return { ...this.cacheStats, connected: true, error: error.message };
        }
    }

    calculateHitRate() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        return total > 0 ? (this.cacheStats.hits / total * 100).toFixed(2) : 0;
    }

    async flush() {
        if (!this.isConnected) {return false;}

        try {
            await this.flushdbAsync();
            winston.info('Cache flushed successfully');
            return true;
        } catch (error) {
            winston.error('Cache flush failed:', error);
            return false;
        }
    }

    // Application-specific caching methods
    async cacheUser(id, userData, ttl = 7200) { // 2 hours
        const key = `user:${id}`;
        return await this.set(key, userData, ttl);
    }

    async getUser(id) {
        const key = `user:${id}`;
        return await this.get(key);
    }

    async cacheJob(id, jobData, ttl = 3600) { // 1 hour
        const key = `job:${id}`;
        return await this.set(key, jobData, ttl);
    }

    async getJob(id) {
        const key = `job:${id}`;
        return await this.get(key);
    }

    async cacheJobList(filters, jobList, ttl = 1800) { // 30 minutes
        const filterKey = Object.entries(filters)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('&');

        const key = `jobs:list:${Buffer.from(filterKey).toString('base64')}`;
        return await this.set(key, jobList, ttl);
    }

    async getJobList(filters) {
        const filterKey = Object.entries(filters)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('&');

        const key = `jobs:list:${Buffer.from(filterKey).toString('base64')}`;
        return await this.get(key);
    }

    async cacheSearchResults(query, filters, results, ttl = 900) { // 15 minutes
        const searchKey = `${query}_${JSON.stringify(filters)}`;
        const key = `search:${Buffer.from(searchKey).toString('base64')}`;
        return await this.set(key, results, ttl);
    }

    async getSearchResults(query, filters) {
        const searchKey = `${query}_${JSON.stringify(filters)}`;
        const key = `search:${Buffer.from(searchKey).toString('base64')}`;
        return await this.get(key);
    }

    async invalidateUserCache(userId) {
        return await this.invalidatePattern(`user:${userId}*`);
    }

    async invalidateJobCache(jobId) {
        return await this.invalidatePattern(`job:${jobId}*`);
    }

    async invalidateJobsList() {
        return await this.invalidatePattern('jobs:list:*');
    }

    async cleanup() {
        await this.disconnect();
        winston.info('Caching service cleaned up');
    }
}

module.exports = CachingService;