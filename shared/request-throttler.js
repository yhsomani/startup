/**
 * Request Throttler
 *
 * Adds artificial delay to throttle requests based on
 * client IP or API key.
 */

class RequestThrottler {
    constructor(options = {}) {
        this.redisClient = options.redisClient || null;
        this.delayMs = options.delayMs || 100;
        this.windowMs = options.windowMs || 1000;
        this.maxRequests = options.maxRequests || 10;
    }

    async shouldThrottle(key) {
        if (!this.redisClient) return false;

        const now = Date.now();
        const windowStart = now - this.windowMs;

        const keyPrefix = `throttle:${key}`;

        const requests = await this.redisClient.zrangebyscore(keyPrefix, windowStart, now);

        return requests.length >= this.maxRequests;
    }

    async recordRequest(key) {
        if (!this.redisClient) return;

        const now = Date.now();
        const keyPrefix = `throttle:${key}`;

        await this.redisClient.zadd(keyPrefix, now, `${now}-${Math.random()}`);
        await this.redisClient.expire(keyPrefix, Math.ceil(this.windowMs / 1000));
    }

    async getDelay(key) {
        if (!this.redisClient) return 0;

        const now = Date.now();
        const windowStart = now - this.windowMs;
        const keyPrefix = `throttle:${key}`;

        const requests = await this.redisClient.zrangebyscore(keyPrefix, windowStart, now);

        if (requests.length < this.maxRequests) return 0;

        const oldest = await this.redisClient.zrange(keyPrefix, 0, 0);
        if (oldest.length === 0) return 0;

        const oldestTime = parseFloat(oldest[0].split("-")[0]);
        const nextAvailable = oldestTime + this.windowMs - Date.now();

        return Math.max(0, nextAvailable + this.delayMs);
    }

    middleware(options = {}) {
        const throttler = this;
        const { delayMs = this.delayMs, keyFn = req => req.ip } = options;

        return async (req, res, next) => {
            const key = keyFn(req);

            if (throttler.redisClient) {
                const delay = await throttler.getDelay(key);

                if (delay > 0) {
                    res.set("Retry-After", Math.ceil(delay / 1000));
                    return res.status(429).json({
                        error: "Too Many Requests",
                        message: "Rate limit approaching, please slow down",
                    });
                }

                await throttler.recordRequest(key);
            }

            next();
        };
    }
}

const requestThrottler = new RequestThrottler({
    delayMs: 100,
    windowMs: 1000,
    maxRequests: 10,
});

module.exports = {
    RequestThrottler,
    requestThrottler,
};
