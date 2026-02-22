/**
 * PubSub for GraphQL Subscriptions
 *
 * Uses Redis for distributed pub/sub across multiple instances.
 */

const { PubSub: ApolloPubSub } = require("apollo-server-express");

class PubSub extends ApolloPubSub {
    constructor() {
        super();
        this.redisClient = null;
        this.initializeRedis();
    }

    async initializeRedis() {
        try {
            const Redis = require("ioredis");
            this.redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

            this.redisClient.on("message", (channel, message) => {
                this.publish(channel, JSON.parse(message));
            });
        } catch (error) {
            console.log("Redis not available, using in-memory pubsub");
        }
    }

    async publish(topic, payload) {
        if (this.redisClient) {
            await this.redisClient.publish(topic, JSON.stringify(payload));
        }
        return super.publish(topic, payload);
    }

    async subscribe(topic, handler) {
        if (this.redisClient) {
            await this.redisClient.subscribe(topic);
        }
        return super.subscribe(topic, handler);
    }
}

const pubsub = new PubSub();

module.exports = { PubSub, pubsub };
