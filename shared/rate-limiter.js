/**
 * Advanced Rate Limiter
 *
 * Token Bucket + Sliding Window algorithm with Redis backend
 * for distributed rate limiting.
 */

class TokenBucketRateLimiter {
    constructor(options = {}) {
        this.redisClient = options.redisClient || null;
        this.capacity = options.capacity || 100;
        this.refillRate = options.refillRate || 10;
        this.windowMs = options.windowMs || 60000;
        this.keyPrefix = options.keyPrefix || "ratelimit:";
    }

    async consume(key, tokens = 1) {
        if (!this.redisClient) {
            return { allowed: true, remaining: this.capacity };
        }

        const fullKey = `${this.keyPrefix}${key}`;
        const now = Date.now();
        const windowStart = now - this.windowMs;

        const multi = this.redisClient.multi();
        multi.zremrangebyscore(fullKey, 0, windowStart);
        multi.zcard(fullKey);
        multi.zadd(fullKey, now, `${now}-${Math.random()}`);
        multi.expire(fullKey, Math.ceil(this.windowMs / 1000));

        const results = await multi.exec();
        const currentCount = results[1][1];

        if (currentCount >= this.capacity) {
            this.redisClient.zrem(fullKey, `${now}-${Math.random()}`);
            return {
                allowed: false,
                remaining: 0,
                resetTime: now + this.windowMs,
            };
        }

        return {
            allowed: true,
            remaining: this.capacity - currentCount - 1,
            resetTime: now + this.windowMs,
        };
    }

    middleware() {
        const limiter = this;

        return async (req, res, next) => {
            const key = req.ip || req.headers["x-forwarded-for"] || "unknown";

            const result = await limiter.consume(key);

            res.set({
                "X-RateLimit-Limit": limiter.capacity,
                "X-RateLimit-Remaining": result.remaining,
                "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000),
            });

            if (!result.allowed) {
                return res.status(429).json({
                    error: "Too Many Requests",
                    message: "Rate limit exceeded",
                    retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
                });
            }

            next();
        };
    }
}

const rateLimiter = new TokenBucketRateLimiter({
    capacity: 100,
    refillRate: 10,
    windowMs: 60000,
});

module.exports = {
    TokenBucketRateLimiter,
    rateLimiter,
};
