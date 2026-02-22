/**
 * Redis Caching Middleware
 *
 * Provides automatic API response caching with:
 * - Configurable TTL
 * - Cache invalidation
 * - Stale-while-revalidate
 * - Cache tags
 */

const crypto = require("crypto");

class CacheMiddleware {
    constructor(options = {}) {
        this.redisClient = options.redisClient || null;
        this.defaultTTL = options.defaultTTL || 300;
        this.enabled = options.enabled !== false;
        this.keyPrefix = options.keyPrefix || "api:cache:";
        this.staleWhileRevalidate = options.staleWhileRevalidate || false;
    }

    setRedisClient(client) {
        this.redisClient = client;
    }

    generateCacheKey(req) {
        const parts = [
            req.method,
            req.path,
            JSON.stringify(req.query),
            req.headers["authorization"] ? "auth" : "anon",
        ];

        const hash = crypto.createHash("md5").update(parts.join(":")).digest("hex");

        return `${this.keyPrefix}${req.path}:${hash}`;
    }

    middleware() {
        const cache = this;

        return async (req, res, next) => {
            if (!cache.enabled || !cache.redisClient) {
                return next();
            }

            if (req.method !== "GET") {
                return next();
            }

            const cacheKey = cache.generateCacheKey(req);

            try {
                const cached = await cache.redisClient.get(cacheKey);

                if (cached) {
                    const { data, timestamp, ttl } = JSON.parse(cached);

                    const age = Math.floor((Date.now() - timestamp) / 1000);

                    if (cache.staleWhileRevalidate && age > ttl) {
                        res.set("X-Cache", "STALE");
                        res.set("X-Cache-Age", age);
                    } else {
                        res.set("X-Cache", "HIT");
                        res.set("Cache-Control", `public, max-age=${ttl - age}`);
                        return res.json(data);
                    }
                } else {
                    res.set("X-Cache", "MISS");
                }

                const originalJson = res.json.bind(res);

                res.json = function (body) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const ttl = res.get("X-Cache-TTL") || cache.defaultTTL;

                        cache.redisClient
                            .setex(
                                cacheKey,
                                ttl,
                                JSON.stringify({
                                    data: body,
                                    timestamp: Date.now(),
                                    ttl,
                                })
                            )
                            .catch(err => console.error("Cache write error:", err));
                    }

                    return originalJson(body);
                };

                next();
            } catch (error) {
                console.error("Cache middleware error:", error);
                next();
            }
        };
    }

    async invalidate(pattern) {
        if (!this.redisClient) return;

        const keys = await this.redisClient.keys(`${this.keyPrefix}${pattern}`);

        if (keys.length > 0) {
            await this.redisClient.del(...keys);
        }

        return keys.length;
    }

    async invalidateByTag(tag) {
        if (!this.redisClient) return;

        const tagKey = `${this.keyPrefix}tag:${tag}`;
        const keys = await this.redisClient.smembers(tagKey);

        if (keys.length > 0) {
            await this.redisClient.del(...keys);
            await this.redisClient.del(tagKey);
        }

        return keys.length;
    }

    async cacheTag(tag, key) {
        if (!this.redisClient) return;

        const tagKey = `${this.keyPrefix}tag:${tag}`;
        await this.redisClient.sadd(tagKey, key);
        await this.redisClient.expire(tagKey, this.defaultTTL * 2);
    }

    async getStats() {
        if (!this.redisClient) return {};

        const keys = await this.redisClient.keys(`${this.keyPrefix}*`);

        let totalSize = 0;
        for (const key of keys.slice(0, 100)) {
            const size = await this.redisClient.memory("USAGE", key);
            totalSize += size || 0;
        }

        return {
            cachedKeys: keys.length,
            estimatedSize: totalSize * (keys.length / 100),
        };
    }
}

const cacheMiddleware = new CacheMiddleware({
    defaultTTL: 300,
    staleWhileRevalidate: true,
});

module.exports = {
    CacheMiddleware,
    cacheMiddleware,
};
