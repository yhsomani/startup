const Redis = require('ioredis');
const { createLogger } = require('../../../shared/logger');

const logger = createLogger('redis-client');

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    connect() {
        if (this.client) {
            return this.client;
        }

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        try {
            this.client = new Redis(redisUrl, {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('Redis connected successfully');
            });

            this.client.on('error', (err) => {
                this.isConnected = false;
                logger.error('Redis connection error', { error: err.message });
            });

            return this.client;
        } catch (error) {
            logger.error('Failed to initialize Redis client', { error: error.message });
            return null;
        }
    }

    async get(key) {
        if (!this.isConnected || !this.client) return null;
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Redis get error', { key, error: error.message });
            return null;
        }
    }

    async set(key, value, ttlSeconds = 300) {
        if (!this.isConnected || !this.client) return false;
        try {
            const serialized = JSON.stringify(value);
            await this.client.set(key, serialized, 'EX', ttlSeconds);
            return true;
        } catch (error) {
            logger.error('Redis set error', { key, error: error.message });
            return false;
        }
    }

    async del(key) {
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Redis del error', { key, error: error.message });
            return false;
        }
    }

    async flush() {
        if (!this.isConnected || !this.client) return false;
        try {
            await this.client.flushall();
            return true;
        } catch (error) {
            logger.error('Redis flush error', { error: error.message });
            return false;
        }
    }
}

// Singleton instance
const redisClient = new RedisClient();
redisClient.connect();

module.exports = redisClient;
