/**
 * TalentSphere Advanced Rate Limiter
 * Intelligent rate limiting with multiple strategies and adaptive throttling
 */

const Redis = require('ioredis');
const logger = require('../../../../shared/enhanced-logger');

class RateLimiter {
  constructor(options = {}) {
    this.options = {
      // Redis configuration
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      },
      // Default rate limits
      defaultLimits: {
        // General API limits
        global: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 1000
        },
        // Per IP limits
        ip: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100
        },
        // Per user limits
        user: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 500
        },
        // Per endpoint limits
        endpoint: {
          'POST /auth/login': {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 10
          },
          'POST /auth/register': {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 5
          },
          'POST /jobs': {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 20
          },
          'POST /applications': {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 50
          },
          'POST /messages': {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 30
          },
          'GET /search': {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100
          },
          'POST /notifications/broadcast': {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 5
          }
        }
      },
      // Advanced features
      adaptive: true, // Enable adaptive rate limiting
      blacklistDuration: 60 * 60 * 1000, // 1 hour blacklist
      whitelistDuration: 24 * 60 * 60 * 1000, // 24 hour whitelist
      penaltyMultiplier: 2, // Penalty multiplier for violations
      ...options
    };

    // Initialize Redis
    this.redis = new Redis(this.options.redis);

    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      violations: new Map()
    };

    // Cache for performance
    this.cache = new Map();
  }

  // Main rate limiting middleware
  middleware(options = {}) {
    return async (req, res, next) => {
      try {
        this.stats.totalRequests++;

        const startTime = Date.now();
        const clientKey = this.getClientKey(req);
        const userKey = this.getUserKey(req);
        const endpointKey = this.getEndpointKey(req);

        // Check if client is blacklisted
        if (await this.isBlacklisted(clientKey)) {
          return this.blockRequest(res, 'Client blacklisted', 429);
        }

        // Check if client is whitelisted
        if (await this.isWhitelisted(clientKey)) {
          return next();
        }

        // Check all rate limits
        const checks = await Promise.all([
          this.checkLimit('global', 'global', {}),
          this.checkLimit('ip', clientKey, this.options.defaultLimits.ip),
          this.checkLimit('user', userKey, this.options.defaultLimits.user),
          this.checkLimit('endpoint', endpointKey, this.options.defaultLimits.endpoint[endpointKey])
        ]);

        const results = checks.filter(result => result !== null);

        if (results.length > 0) {
          // Rate limit exceeded
          const violation = results[0];
          await this.recordViolation(violation.key);

          this.stats.blockedRequests++;

          return this.blockRequest(res, violation.message, 429, {
            limitType: violation.type,
            current: violation.current,
            max: violation.max,
            resetTime: violation.resetTime,
            retryAfter: Math.ceil(violation.resetTime / 1000)
          });
        }

        // Request allowed
        this.stats.allowedRequests++;

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.options.defaultLimits.ip.maxRequests,
          'X-RateLimit-Remaining': Math.max(0, this.options.defaultLimits.ip.maxRequests - (await this.getCurrentCount(clientKey))),
          'X-RateLimit-Reset': new Date(Date.now() + this.options.defaultLimits.ip.windowMs).toISOString()
        });

        return next();
      } catch (error) {
        logger.error('Rate limiter error:', error);
        // Fail open - allow request if rate limiter fails
        return next();
      }
    };
  }

  // Get client key (IP based)
  getClientKey(req) {
    const ip = req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      'unknown';

    return `ip:${ip}`;
  }

  // Get user key
  getUserKey(req) {
    if (req.user && req.user.userId) {
      return `user:${req.user.userId}`;
    }
    return null;
  }

  // Get endpoint key
  getEndpointKey(req) {
    return `${req.method} ${req.route?.path || req.path}`;
  }

  // Check specific rate limit
  async checkLimit(type, key, limitConfig) {
    if (!limitConfig || !key) return null;

    const now = Date.now();
    const windowStart = now - limitConfig.windowMs;

    // Redis key for this limit
    const redisKey = `rate_limit:${type}:${key}`;

    try {
      // Clean old entries and get current count
      const pipeline = this.redis.pipeline();
      pipeline.zremrangebyscore(redisKey, 0, windowStart);
      pipeline.zcard(redisKey);
      const results = await pipeline.exec();

      const currentCount = results[1][1];

      // Check if limit exceeded
      if (currentCount >= limitConfig.maxRequests) {
        // Get oldest request time for reset calculation
        const oldest = await this.redis.zrange(redisKey, 0, 0, 'WITHSCORES');
        const resetTime = oldest[1] ? parseInt(oldest[1]) + limitConfig.windowMs : now + limitConfig.windowMs;

        return {
          type,
          key,
          current: currentCount,
          max: limitConfig.maxRequests,
          resetTime,
          message: `Rate limit exceeded for ${type}`
        };
      }

      // Add current request to Redis
      await this.redis.zadd(redisKey, now, `${now}_${Math.random()}`);
      await this.redis.expire(redisKey, Math.ceil(limitConfig.windowMs / 1000));

      return null; // No limit exceeded
    } catch (error) {
      logger.error('Rate limit check error:', { type, key, error: error.message });
      return null; // Fail open
    }
  }

  // Record violation
  async recordViolation(key) {
    const violationKey = `violation:${key}`;
    const now = Date.now();

    try {
      await this.redis.zadd(violationKey, now, `${now}_${Math.random()}`);
      await this.redis.expire(violationKey, Math.ceil(this.options.blacklistDuration / 1000));

      // Update violation count
      const violations = await this.redis.zcard(violationKey);

      if (this.options.adaptive && violations >= 3) {
        // Blacklist after 3 violations
        await this.blacklist(key);
      }

      this.stats.violations.set(key, (this.stats.violations.get(key) || 0) + 1);

    } catch (error) {
      logger.error('Violation recording error:', error);
    }
  }

  // Blacklist management
  async blacklist(key) {
    const blacklistKey = `blacklist:${key}`;
    const expiresAt = Date.now() + this.options.blacklistDuration;

    try {
      await this.redis.setex(blacklistKey, Math.ceil(this.options.blacklistDuration / 1000), '1');

      logger.logSecurityEvent('client_blacklisted', {
        key,
        duration: this.options.blacklistDuration,
        expiresAt: new Date(expiresAt).toISOString()
      });
    } catch (error) {
      logger.error('Blacklist error:', error);
    }
  }

  async isBlacklisted(key) {
    try {
      const blacklistKey = `blacklist:${key}`;
      const result = await this.redis.get(blacklistKey);
      return result === '1';
    } catch (error) {
      logger.error('Blacklist check error:', error);
      return false;
    }
  }

  // Whitelist management
  async whitelist(key, duration = null) {
    const whitelistKey = `whitelist:${key}`;
    const whitelistDuration = duration || this.options.whitelistDuration;

    try {
      await this.redis.setex(whitelistKey, Math.ceil(whitelistDuration / 1000), '1');

      logger.logSecurityEvent('client_whitelisted', {
        key,
        duration: whitelistDuration
      });
    } catch (error) {
      logger.error('Whitelist error:', error);
    }
  }

  async isWhitelisted(key) {
    try {
      const whitelistKey = `whitelist:${key}`;
      const result = await this.redis.get(whitelistKey);
      return result === '1';
    } catch (error) {
      logger.error('Whitelist check error:', error);
      return false;
    }
  }

  // Get current count for rate limit headers
  async getCurrentCount(key) {
    try {
      const redisKey = `rate_limit:ip:${key}`;
      return await this.redis.zcard(redisKey);
    } catch (error) {
      return 0;
    }
  }

  // Block request with appropriate response
  blockRequest(res, message, statusCode = 429, additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-RateLimit-Exceeded': 'true',
      ...additionalHeaders
    };

    Object.entries(headers).forEach(([key, value]) => {
      res.set(key, value);
    });

    return res.status(statusCode).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: additionalHeaders.retryAfter || 60
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // Get rate limit statistics
  async getStats() {
    const redisInfo = await this.redis.info();
    const poolStats = this.getPoolStats();

    return {
      requests: {
        total: this.stats.totalRequests,
        blocked: this.stats.blockedRequests,
        allowed: this.stats.allowedRequests,
        blockRate: this.stats.totalRequests > 0 ? (this.stats.blockedRequests / this.stats.totalRequests) : 0
      },
      violations: Object.fromEntries(this.stats.violations),
      redis: {
        connected: this.redis.status === 'ready',
        memory: redisInfo.used_memory,
        keys: redisInfo.db0?.keys || 0
      },
      pool: poolStats,
      timestamp: new Date().toISOString()
    };
  }

  // Get Redis pool stats
  getPoolStats() {
    return {
      status: this.redis.status,
      options: this.redis.options
    };
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      violations: new Map()
    };
  }

  // Manual rate limit check (for internal use)
  async checkLimitByKey(key, limitConfig, identifier = '') {
    const fullKey = `${key}:${identifier}`;
    return this.checkLimit(key, fullKey, limitConfig);
  }

  // Cleanup expired entries
  async cleanup() {
    try {
      const pattern = 'rate_limit:*';
      const keys = await this.redis.keys(pattern);

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set
          await this.redis.expire(key, 3600); // Set 1 hour expiration
        }
      }

      logger.info('Rate limiter cleanup completed', { keysCleaned: keys.length });
    } catch (error) {
      logger.error('Rate limiter cleanup error:', error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.redis.ping();

      return {
        status: 'healthy',
        redis: {
          connected: this.redis.status === 'ready',
          responseTime: Date.now()
        },
        stats: await this.getStats(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Close Redis connection
  async close() {
    await this.redis.quit();
    logger.info('Rate limiter Redis connection closed');
  }
}

// Express middleware factory
const createRateLimitMiddleware = (options = {}) => {
  const rateLimiter = new RateLimiter(options);
  return rateLimiter.middleware();
};

// Specific rate limiters for common use cases
const createAuthRateLimit = () => createRateLimitMiddleware({
  defaultLimits: {
    endpoint: {
      'POST /auth/login': {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5
      },
      'POST /auth/register': {
        windowMs: 60 * 60 * 1000,
        maxRequests: 3
      },
      'POST /auth/forgot-password': {
        windowMs: 60 * 60 * 1000,
        maxRequests: 3
      }
    }
  }
});

const createApiRateLimit = () => createRateLimitMiddleware({
  defaultLimits: {
    ip: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100
    },
    user: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 500
    }
  }
});

const createUploadRateLimit = () => createRateLimitMiddleware({
  defaultLimits: {
    user: {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10
    }
  }
});

module.exports = {
  RateLimiter,
  createRateLimitMiddleware,
  createAuthRateLimit,
  createApiRateLimit,
  createUploadRateLimit
};