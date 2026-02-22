/**
 * Distributed Lock Manager
 *
 * Provides Redis-based distributed locking for:
 * - Preventing race conditions
 * - Task coordination
 * - Resource locking
 */

class DistributedLock {
    constructor(options = {}) {
        this.redisClient = options.redisClient || null;
        this.defaultTTL = options.defaultTTL || 30000;
        this.lockPrefix = options.lockPrefix || "lock:";
    }

    async acquire(key, options = {}) {
        const { ttl = this.defaultTTL, retryCount = 3, retryDelay = 100 } = options;
        const lockKey = `${this.lockPrefix}${key}`;

        for (let i = 0; i < retryCount; i++) {
            const lockValue = `${process.env.HOSTNAME || "node"}-${Date.now()}-${Math.random()}`;

            const acquired = await this.redisClient.set(lockKey, lockValue, "PX", ttl, "NX");

            if (acquired === "OK") {
                return {
                    key,
                    value: lockValue,
                    release: async () => await this.release(key, lockValue),
                };
            }

            if (i < retryCount - 1) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        return null;
    }

    async release(key, value) {
        const lockKey = `${this.lockPrefix}${key}`;

        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;

        const result = await this.redisClient.eval(script, 1, lockKey, value);
        return result === 1;
    }

    async extend(key, value, ttl) {
        const lockKey = `${this.lockPrefix}${key}`;

        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("pexpire", KEYS[1], ARGV[2])
            else
                return 0
            end
        `;

        const result = await this.redisClient.eval(script, 1, lockKey, value, ttl);
        return result === 1;
    }

    async withLock(key, fn, options = {}) {
        const lock = await this.acquire(key, options);

        if (!lock) {
            throw new Error(`Failed to acquire lock: ${key}`);
        }

        try {
            return await fn(lock);
        } finally {
            await lock.release();
        }
    }

    middleware(options = {}) {
        const lock = this;

        return async (req, res, next) => {
            const lockKey = options.keyFn ? options.keyFn(req) : `${req.method}:${req.path}`;

            try {
                const acquired = await lock.acquire(lockKey, { ttl: options.ttl || 5000 });

                if (!acquired) {
                    return res.status(423).json({
                        error: "Locked",
                        message: "Resource is being processed by another request",
                    });
                }

                req.lock = acquired;

                const originalEnd = res.end;
                res.end = function (...args) {
                    acquired.release();
                    originalEnd.apply(this, args);
                };

                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

const distributedLock = new DistributedLock();

module.exports = {
    DistributedLock,
    distributedLock,
};
