/**
 * ETag Cache Middleware
 *
 * Implements HTTP caching with ETags for conditional requests.
 */

const crypto = require("crypto");

class ETagCache {
    constructor(options = {}) {
        this.redisClient = options.redisClient || null;
        this.ttl = options.ttl || 3600;
        this.keyPrefix = options.keyPrefix || "etag:";
    }

    generateETag(data) {
        if (typeof data === "object") {
            data = JSON.stringify(data);
        }
        return crypto.createHash("md5").update(data).digest("hex");
    }

    middleware() {
        const cache = this;

        return async (req, res, next) => {
            if (req.method !== "GET" && req.method !== "HEAD") {
                return next();
            }

            const cacheKey = `${cache.keyPrefix}${req.path}:${JSON.stringify(req.query)}`;

            const ifNoneMatch = req.headers["if-none-match"];
            const ifModifiedSince = req.headers["if-modified-since"];

            if (cache.redisClient) {
                try {
                    const cached = await cache.redisClient.get(cacheKey);

                    if (cached) {
                        const { etag, lastModified, data } = JSON.parse(cached);

                        if (ifNoneMatch && ifNoneMatch === etag) {
                            res.status(304).end();
                            return;
                        }

                        if (
                            ifModifiedSince &&
                            new Date(ifModifiedSince) >= new Date(lastModified)
                        ) {
                            res.status(304).end();
                            return;
                        }

                        res.set({
                            ETag: etag,
                            "Last-Modified": lastModified,
                            "Cache-Control": `public, max-age=${cache.ttl}`,
                        });

                        res.json(data);
                        return;
                    }
                } catch (error) {}
            }

            const originalJson = res.json.bind(res);

            res.json = async function (data) {
                const etag = cache.generateETag(data);
                const lastModified = new Date().toISOString();

                res.set({
                    ETag: etag,
                    "Last-Modified": lastModified,
                    "Cache-Control": `public, max-age=${cache.ttl}`,
                });

                if (cache.redisClient) {
                    try {
                        await cache.redisClient.setex(
                            cacheKey,
                            cache.ttl,
                            JSON.stringify({ etag, lastModified, data })
                        );
                    } catch (error) {}
                }

                return originalJson(data);
            };

            next();
        };
    }

    invalidate(pathPattern) {
        if (!this.redisClient) return;

        return this.redisClient.keys(`${this.keyPrefix}${pathPattern}*`);
    }
}

const etagCache = new ETagCache({
    ttl: 3600,
});

module.exports = {
    ETagCache,
    etagCache,
};
