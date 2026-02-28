/**
 * TalentSphere Advanced Rate Limiter
 * Intelligent rate limiting with multiple strategies and adaptive throttling
 */

const Redis = require('ioredis');
const logger = require('./enhanced-logger');

// Lua script for atomic rate limiting operations
const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local window_size = tonumber(ARGV[1])
local max_requests = tonumber(ARGV[2])
local current_time = tonumber(ARGV[3])

-- Clean old entries
redis.call('ZREMRANGEBYSCORE', key, 0, current_time - window_size)

-- Get current count
local current_count = redis.call('ZCARD', key)

if current_count >= max_requests then
  -- Rate limit exceeded, return current count and reset time
  local oldest_request = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local reset_time = tonumber(oldest_request[2]) + window_size
  return {current_count, max_requests, reset_time}
end

-- Add current request
redis.call('ZADD', key, current_time, current_time .. '_' .. ARGV[4])
redis.call('EXPIRE', key, window_size)

-- Return nil to indicate success
return nil
`;

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
        maxRetriesPerRequest: 3,
        // Connection pool options
        lazyConnect: true,
        maxLoadingQueueSize: 1000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true
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
          },
          // Additional endpoints for job-listing-service and user-profile-service
          'POST /jobs/create': {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 10
          },
          'GET /jobs/search': {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 50
          },
          'POST /profiles/update': {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 20
          },
          'GET /profiles/view': {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100
          }
        }
      },
      // Advanced features
      adaptive: true, // Enable adaptive rate limiting
      blacklistDuration: 60 * 60 * 1000, // 1 hour blacklist
      whitelistDuration: 24 * 60 * 60 * 1000, // 24 hour whitelist
      penaltyMultiplier: 2, // Penalty multiplier for violations
      enableAnalytics: true, // Enable analytics and monitoring
      enableLogging: true, // Enable detailed logging
      ...options
    };

    // Initialize Redis
    this.redis = new Redis(this.options.redis);

    // Load Lua script for atomic operations
    this.rateLimitScriptSha = null;
    this.loadRateLimitScript();

    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      violations: new Map(),
      // Additional analytics
      byEndpoint: {},
      byIP: {},
      byUser: {},
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        totalProcessingTime: 0,
        requestCount: 0
      }
    };

    // Cache for performance
    this.cache = new Map();

    // Initialize event handlers
    this.setupRedisEvents();
  }

  // Load Lua script for atomic rate limiting
  async loadRateLimitScript() {
    try {
      this.rateLimitScriptSha = await this.redis.script('LOAD', RATE_LIMIT_SCRIPT);
    } catch (error) {
      logger.error('Failed to load rate limit script:', error);
      // Fallback to individual commands
      this.rateLimitScriptSha = null;
    }
  }

  // Setup Redis event handlers
  setupRedisEvents() {
    this.redis.on('connect', () => {
      logger.info('Rate limiter Redis connected');
    });

    this.redis.on('ready', () => {
      logger.info('Rate limiter Redis ready');
    });

    this.redis.on('error', (error) => {
      logger.error('Rate limiter Redis error:', error);
    });

    this.redis.on('close', () => {
      logger.warn('Rate limiter Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Rate limiter Redis reconnecting...');
    });
  }

  // Main rate limiting middleware
  middleware(options = {}) {
    return async (req, res, next) => {
      const startTime = Date.now();

      try {
        this.stats.totalRequests++;

        const clientKey = this.getClientKey(req);
        const userKey = this.getUserKey(req);
        const endpointKey = this.getEndpointKey(req);

        // Track analytics by endpoint, IP, and user
        if (this.options.enableAnalytics) {
          this.trackAnalytics(endpointKey, clientKey, userKey);
        }

        // Check if client is blacklisted
        if (await this.isBlacklisted(clientKey)) {
          this.incrementBlockedCounter('blacklist');
          return this.blockRequest(res, 'Client blacklisted', 429);
        }

        // Check if client is whitelisted
        if (await this.isWhitelisted(clientKey)) {
          this.incrementAllowedCounter('whitelist');
          return next();
        }

        // Check all rate limits
        const checks = await Promise.all([
          this.checkLimit('global', 'global', {}),
          this.checkLimit('ip', clientKey, this.options.defaultLimits.ip),
          this.checkLimit('user', userKey, this.options.defaultLimits.user),
          this.checkLimit('endpoint', endpointKey, this.options.defaultLimits.endpoint[endpointKey]),
          // Check specific service limits
          this.checkLimit('service', 'job-listing-service', this.options.defaultLimits.endpoint['POST /jobs/create'] || this.options.defaultLimits.ip),
          this.checkLimit('service', 'user-profile-service', this.options.defaultLimits.endpoint['POST /profiles/update'] || this.options.defaultLimits.ip)
        ]);

        const results = checks.filter(result => result !== null);

        if (results.length > 0) {
          // Rate limit exceeded
          const violation = results[0];
          await this.recordViolation(violation.key);

          this.incrementBlockedCounter('rate_limit');

          return this.blockRequest(res, violation.message, 429, {
            limitType: violation.type,
            current: violation.current,
            max: violation.max,
            resetTime: violation.resetTime,
            retryAfter: Math.ceil(violation.resetTime / 1000),
            // Add additional analytics
            endpoint: endpointKey,
            client: clientKey,
            user: userKey || 'anonymous'
          });
        }

        // Request allowed
        this.incrementAllowedCounter('success');

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': this.options.defaultLimits.ip.maxRequests,
          'X-RateLimit-Remaining': Math.max(0, this.options.defaultLimits.ip.maxRequests - (await this.getCurrentCount(clientKey))),
          'X-RateLimit-Reset': new Date(Date.now() + this.options.defaultLimits.ip.windowMs).toISOString(),
          // Add custom headers for better client experience
          'X-RateLimit-Window': this.options.defaultLimits.ip.windowMs,
          'X-RateLimit-Client': clientKey,
          'X-RateLimit-Endpoint': endpointKey
        });

        // Continue to next middleware
        const result = next();

        // Track performance after request completes
        if (this.options.enableAnalytics) {
          const duration = Date.now() - startTime;
          this.trackPerformance(duration);
        }

        return result;
      } catch (error) {
        // Log error but continue processing to avoid blocking requests
        if (this.options.enableLogging) {
          logger.error('Rate limiter error:', error);
        }

        // Track performance even if there's an error
        if (this.options.enableAnalytics) {
          const duration = Date.now() - startTime;
          this.trackPerformance(duration);
        }

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
    if (!limitConfig || !key) {return null;}

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

  // Track analytics by endpoint, IP, and user
  trackAnalytics(endpoint, client, user) {
    // Track by endpoint
    if (!this.stats.byEndpoint[endpoint]) {
      this.stats.byEndpoint[endpoint] = {
        total: 0,
        blocked: 0,
        allowed: 0
      };
    }
    this.stats.byEndpoint[endpoint].total++;

    // Track by IP/client
    if (!this.stats.byIP[client]) {
      this.stats.byIP[client] = {
        total: 0,
        blocked: 0,
        allowed: 0
      };
    }
    this.stats.byIP[client].total++;

    // Track by user if available
    if (user) {
      if (!this.stats.byUser[user]) {
        this.stats.byUser[user] = {
          total: 0,
          blocked: 0,
          allowed: 0
        };
      }
      this.stats.byUser[user].total++;
    }
  }

  // Track performance metrics
  trackPerformance(duration) {
    this.stats.performance.totalProcessingTime += duration;
    this.stats.performance.requestCount++;
    this.stats.performance.avgResponseTime =
      this.stats.performance.totalProcessingTime / this.stats.performance.requestCount;
    if (duration > this.stats.performance.maxResponseTime) {
      this.stats.performance.maxResponseTime = duration;
    }
  }

  // Increment blocked counter
  incrementBlockedCounter(type = 'general') {
    this.stats.blockedRequests++;
    if (!this.stats.blockedByType) {
      this.stats.blockedByType = {};
    }
    if (!this.stats.blockedByType[type]) {
      this.stats.blockedByType[type] = 0;
    }
    this.stats.blockedByType[type]++;
  }

  // Increment allowed counter
  incrementAllowedCounter(type = 'general') {
    this.stats.allowedRequests++;
    if (!this.stats.allowedByType) {
      this.stats.allowedByType = {};
    }
    if (!this.stats.allowedByType[type]) {
      this.stats.allowedByType[type] = 0;
    }
    this.stats.allowedByType[type]++;
  }

  // Enhanced checkLimit with atomic Lua script
  async checkLimit(type, key, limitConfig) {
    if (!limitConfig || !key) {return null;}

    const now = Date.now();
    const windowStart = now - limitConfig.windowMs;

    // Redis key for this limit
    const redisKey = `rate_limit:${type}:${key}`;

    try {
      if (this.rateLimitScriptSha) {
        // Use atomic Lua script for better performance in distributed environments
        const result = await this.redis.evalsha(
          this.rateLimitScriptSha,
          1,
          redisKey,
          limitConfig.windowMs,
          limitConfig.maxRequests,
          now,
          Math.random().toString(36).substring(2, 15)
        );

        if (Array.isArray(result)) {
          // Rate limit exceeded
          const [current, max, resetTime] = result;
          return {
            type,
            key,
            current: current,
            max: max,
            resetTime: resetTime,
            message: `Rate limit exceeded for ${type}`
          };
        }

        // Rate limit not exceeded, add current request
        return null;
      } else {
        // Fallback to individual commands
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
      }
    } catch (error) {
      logger.error('Rate limit check error:', { type, key, error: error.message });
      return null; // Fail open
    }
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