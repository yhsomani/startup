const crypto = require('crypto');

/**
 * Caching Middleware for Express Applications
 * Provides automatic caching for GET requests with flexible invalidation
 */
class CachingMiddleware {
    constructor(cacheService, options = {}) {
        this.cache = cacheService;
        this.options = {
            // Default TTL settings
            defaultTTL: options.defaultTTL || 1800, // 30 minutes
            userTTL: options.userTTL || 3600, // 1 hour
            jobTTL: options.jobTTL || 1800, // 30 minutes
            searchTTL: options.searchTTL || 900, // 15 minutes

            // Cache control headers
            enableCacheHeaders: options.enableCacheHeaders !== false,
            cacheControl: options.cacheControl || 'public, max-age=1800',

            // Route-specific caching rules
            routeRules: options.routeRules || {},

            // Bypass conditions
            bypassQueryParam: options.bypassQueryParam || 'nocache',
            bypassHeader: options.bypassHeader || 'x-cache-bypass',

            ...options
        };
    }

    /**
     * Main caching middleware
     */
    cache(ttlOrRule) {
        return async (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            // Check bypass conditions
            if (this.shouldBypassCache(req)) {
                return next();
            }

            // Generate cache key
            const cacheKey = this.generateCacheKey(req);
            const ttl = this.resolveTTL(req, ttlOrRule);

            try {
                // Try to get from cache
                const cachedResponse = await this.cache.get(cacheKey);

                if (cachedResponse) {
                    // Return cached response
                    this.sendCachedResponse(res, cachedResponse);
                    return;
                }

                // Capture response for caching
                this.captureResponseForCaching(req, res, cacheKey, ttl);

                next();
            } catch (error) {
                console.error('Cache middleware error:', error);
                next(); // Continue without caching on error
            }
        };
    }

    /**
     * Check if request should bypass cache
     */
    shouldBypassCache(req) {
        // Check query parameter
        if (req.query[this.options.bypassQueryParam]) {
            return true;
        }

        // Check header
        if (req.headers[this.options.bypassHeader]) {
            return true;
        }

        // Check authorization (don't cache authenticated requests by default)
        if (req.headers.authorization) {
            const routeRule = this.getRouteRule(req);
            if (!routeRule?.cacheAuthenticated) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate unique cache key for request
     */
    generateCacheKey(req) {
        const routeRule = this.getRouteRule(req);

        if (routeRule?.keyGenerator) {
            return routeRule.keyGenerator(req);
        }

        // Default key generation
        const method = req.method;
        const url = req.originalUrl || req.url;
        const queryParams = this.normalizeQueryParams(req.query);

        const keyString = `${method}:${url}:${JSON.stringify(queryParams)}`;
        return `http:${crypto.createHash('md5').update(keyString).digest('hex')}`;
    }

    /**
     * Normalize query parameters for consistent cache keys
     */
    normalizeQueryParams(query) {
        const normalized = {};

        // Sort query parameters for consistency
        Object.keys(query)
            .sort()
            .forEach(key => {
                const value = query[key];
                // Handle arrays and objects consistently
                if (Array.isArray(value)) {
                    normalized[key] = [...value].sort();
                } else if (typeof value === 'object' && value !== null) {
                    normalized[key] = Object.keys(value)
                        .sort()
                        .reduce((obj, k) => {
                            obj[k] = value[k];
                            return obj;
                        }, {});
                } else {
                    normalized[key] = value;
                }
            });

        return normalized;
    }

    /**
     * Resolve TTL based on route rules or provided value
     */
    resolveTTL(req, ttlOrRule) {
        const routeRule = this.getRouteRule(req);

        if (typeof ttlOrRule === 'number') {
            return ttlOrRule;
        }

        if (routeRule?.ttl) {
            return typeof routeRule.ttl === 'function'
                ? routeRule.ttl(req)
                : routeRule.ttl;
        }

        // Default TTL based on content type
        if (req.path.includes('/users/') || req.path.includes('/profile')) {
            return this.options.userTTL;
        }

        if (req.path.includes('/jobs/') || req.path.includes('/listings')) {
            return this.options.jobTTL;
        }

        if (req.path.includes('/search')) {
            return this.options.searchTTL;
        }

        return this.options.defaultTTL;
    }

    /**
     * Get route-specific caching rules
     */
    getRouteRule(req) {
        const path = req.path;

        // Exact path match
        if (this.options.routeRules[path]) {
            return this.options.routeRules[path];
        }

        // Pattern matching
        const matchingPattern = Object.keys(this.options.routeRules)
            .find(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                    return regex.test(path);
                }
                return false;
            });

        return matchingPattern ? this.options.routeRules[matchingPattern] : null;
    }

    /**
     * Capture response for caching
     */
    captureResponseForCaching(req, res, cacheKey, ttl) {
        const originalSend = res.send;
        const originalJson = res.json;
        const originalEnd = res.end;

        let responseData = '';
        let responseStatusCode = 200;

        // Override response methods to capture data
        res.send = function (data) {
            responseData = data;
            return originalSend.call(this, data);
        };

        res.json = function (data) {
            responseData = JSON.stringify(data);
            return originalJson.call(this, data);
        };

        res.end = async function (chunk) {
            if (chunk) {
                responseData = chunk.toString();
            }

            // Cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const cacheData = {
                        statusCode: res.statusCode,
                        headers: {
                            'content-type': res.getHeader('content-type'),
                            'last-modified': res.getHeader('last-modified'),
                            ...(this.options.enableCacheHeaders && {
                                'cache-control': this.options.cacheControl
                            })
                        },
                        body: responseData,
                        timestamp: Date.now()
                    };

                    await this.cache.set(cacheKey, cacheData, ttl);

                    // Set cache headers
                    if (this.options.enableCacheHeaders) {
                        res.setHeader('Cache-Control', this.options.cacheControl);
                        res.setHeader('X-Cache', 'MISS');
                    }
                } catch (error) {
                    console.error('Failed to cache response:', error);
                }
            }

            return originalEnd.call(this, chunk);
        }.bind(this);
    }

    /**
     * Send cached response
     */
    sendCachedResponse(res, cachedData) {
        try {
            // Set headers
            Object.entries(cachedData.headers || {}).forEach(([key, value]) => {
                if (value) {
                    res.setHeader(key, value);
                }
            });

            // Add cache hit header
            if (this.options.enableCacheHeaders) {
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Age', Math.floor((Date.now() - cachedData.timestamp) / 1000));
            }

            // Send response
            res.status(cachedData.statusCode || 200);
            res.send(cachedData.body);
        } catch (error) {
            console.error('Failed to send cached response:', error);
            // Fall back to normal processing
            res.removeHeader('X-Cache');
        }
    }

    /**
     * Cache invalidation middleware
     */
    invalidate(patterns) {
        return async (req, res, next) => {
            const originalSend = res.send;
            const originalJson = res.json;

            res.send = async function (data) {
                await this.invalidateCache(patterns, req);
                return originalSend.call(this, data);
            }.bind(this);

            res.json = async function (data) {
                await this.invalidateCache(patterns, req);
                return originalJson.call(this, data);
            }.bind(this);

            next();
        };
    }

    /**
     * Invalidate cache patterns
     */
    async invalidateCache(patterns, req) {
        try {
            const resolvedPatterns = typeof patterns === 'function'
                ? patterns(req)
                : Array.isArray(patterns) ? patterns : [patterns];

            for (const pattern of resolvedPatterns) {
                if (typeof pattern === 'string') {
                    await this.cache.invalidatePattern(pattern);
                } else if (pattern instanceof RegExp) {
                    // Handle regex patterns
                    const allKeys = await this.getAllCacheKeys();
                    const matchingKeys = allKeys.filter(key => pattern.test(key));
                    for (const key of matchingKeys) {
                        await this.cache.delete(key);
                    }
                }
            }
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }

    /**
     * Get all cache keys (for regex invalidation)
     */
    async getAllCacheKeys() {
        try {
            return await this.cache.keysAsync('*');
        } catch (error) {
            console.error('Failed to get cache keys:', error);
            return [];
        }
    }

    /**
     * Predefined cache rules for common endpoints
     */
    static getDefaultRouteRules() {
        return {
            // User-related endpoints
            '/api/users/:id': {
                ttl: 3600, // 1 hour
                cacheAuthenticated: false,
                keyGenerator: (req) => `user:${req.params.id}`
            },

            '/api/profiles/:id': {
                ttl: 7200, // 2 hours
                cacheAuthenticated: false,
                keyGenerator: (req) => `profile:${req.params.id}`
            },

            // Job-related endpoints
            '/api/jobs/:id': {
                ttl: 1800, // 30 minutes
                keyGenerator: (req) => `job:${req.params.id}`
            },

            '/api/jobs*': {
                ttl: 900, // 15 minutes
                keyGenerator: (req) => {
                    const filters = req.query;
                    const filterStr = Object.entries(filters)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([k, v]) => `${k}=${v}`)
                        .join('&');
                    return `jobs:${Buffer.from(filterStr).toString('base64')}`;
                }
            },

            // Search endpoints
            '/api/search*': {
                ttl: 600, // 10 minutes
                keyGenerator: (req) => {
                    const query = req.query.q || '';
                    const filters = { ...req.query };
                    delete filters.q;
                    const keyStr = `${query}_${JSON.stringify(filters)}`;
                    return `search:${Buffer.from(keyStr).toString('base64')}`;
                }
            },

            // Static content
            '/api/static/*': {
                ttl: 86400, // 24 hours
                cacheAuthenticated: true
            }
        };
    }
}

module.exports = CachingMiddleware;