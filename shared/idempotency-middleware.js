/**
 * Idempotency Middleware
 *
 * Prevents duplicate request processing using Redis.
 * Essential for payment processing and critical operations.
 */

class IdempotencyMiddleware {
    constructor(options = {}) {
        this.redisClient = options.redisClient || null;
        this.ttl = options.ttl || 86400;
        this.keyPrefix = options.keyPrefix || "idempotency:";
    }

    setRedisClient(client) {
        this.redisClient = client;
    }

    generateKey(req) {
        const parts = [
            req.method,
            req.path,
            JSON.stringify(req.query),
            req.headers["authorization"] || "anon",
            req.headers["idempotency-key"] || req.body?.idempotencyKey,
        ];

        const crypto = require("crypto");
        const hash = crypto.createHash("sha256").update(parts.join(":")).digest("hex");

        return `${this.keyPrefix}${hash}`;
    }

    middleware(options = {}) {
        const idempotency = this;
        const { ttl = this.ttl, methods = ["POST", "PUT", "PATCH", "DELETE"] } = options;

        return async (req, res, next) => {
            if (!methods.includes(req.method)) {
                return next();
            }

            const idempotencyKey = req.headers["idempotency-key"] || req.body?.idempotencyKey;

            if (!idempotencyKey) {
                return res.status(400).json({
                    error: "Idempotency-Key header required",
                });
            }

            const key = idempotency.generateKey(req);

            if (!idempotency.redisClient) {
                req.idempotencyKey = idempotencyKey;
                return next();
            }

            try {
                const existing = await idempotency.redisClient.get(key);

                if (existing) {
                    const result = JSON.parse(existing);

                    if (result.status >= 200 && result.status < 300) {
                        res.status(result.status);
                        return res.json({
                            ...result.body,
                            _idempotent: true,
                            originalRequestId: result.requestId,
                        });
                    }

                    return res.status(result.status).json(result.body);
                }

                const requestId = require("uuid").v4();

                await idempotency.redisClient.setex(
                    key,
                    ttl,
                    JSON.stringify({
                        requestId,
                        status: 102,
                        body: { status: "processing" },
                        timestamp: Date.now(),
                    })
                );

                req.idempotencyKey = idempotencyKey;
                req.idempotencyRequestId = requestId;
                req.idempotencyKeyStorage = key;

                const originalJson = res.json.bind(res);

                res.json = function (body) {
                    const status = res.statusCode;

                    idempotency.redisClient
                        .setex(
                            key,
                            ttl,
                            JSON.stringify({
                                requestId,
                                status,
                                body,
                                timestamp: Date.now(),
                            })
                        )
                        .catch(() => {});

                    return originalJson({
                        ...body,
                        _idempotent: true,
                        requestId,
                    });
                };

                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

const idempotencyMiddleware = new IdempotencyMiddleware();

module.exports = {
    IdempotencyMiddleware,
    idempotencyMiddleware,
};
