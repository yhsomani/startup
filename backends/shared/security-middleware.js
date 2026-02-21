/**
 * Security Middleware
 * 
 * Comprehensive security middleware for all backend services
 * including CORS, rate limiting, authentication, and security headers
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const express = require('express');
const { createLogger } = require('../../shared/logger');

const logger = createLogger('SecurityMiddleware');

// Rate limit configurations
const rateLimitConfigs = {
  // General API rate limit
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Sensitive operations (auth, password reset)
  sensitive: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many sensitive operations from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // File upload operations
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 uploads per hour
    message: 'Too many uploads from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Search operations
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 searches per minute
    message: 'Too many search requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }
};

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In production, you would check against allowed domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://talentsphere.com',
      'https://www.talentsphere.com'
    ];

    // For now, allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Correlation-ID', 'X-Session-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Apply comprehensive security middleware to Express app
 */
function applySecurityMiddleware(app, options = {}) {
  const {
    enableServiceAuth = true,
    customRateLimit = null,
    customCors = null
  } = options;

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS
  app.use(cors(customCors || corsOptions));

  // Rate limiting
  if (customRateLimit) {
    app.use(rateLimit(customRateLimit));
  } else {
    app.use(rateLimit(rateLimitConfigs.general));
  }

  // Request logging middleware
  app.use((req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      origin: req.get('Origin'),
      contentType: req.get('Content-Type')
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    });

    next();
  });

  // Request ID middleware
  app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });

  // JSON parsing with size limit
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({
          error: 'Invalid JSON',
          message: 'Request body contains invalid JSON'
        });
        throw new Error('Invalid JSON');
      }
    }
  }));

  // URL-encoded data parsing
  app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
  }));

  logger.info('Security middleware applied successfully');
}

/**
 * Get rate limit middleware for specific endpoints
 */
function getSensitiveRateLimitMiddleware(endpoint) {
  const config = rateLimitConfigs.sensitive;

  // Add custom message for specific endpoints
  const customConfig = {
    ...config,
    keyGenerator: (req) => {
      // Rate limit by IP and user ID if authenticated
      const userId = req.headers['x-user-id'];
      return userId ? `user_${userId}` : req.ip;
    }
  };

  return rateLimit(customConfig);
}

/**
 * Get rate limit configuration
 */
function getRateLimitConfig(type = 'general') {
  return rateLimitConfigs[type] || rateLimitConfigs.general;
}

/**
 * Service authentication middleware
 */
function serviceAuthMiddleware(req, res, next) {
  const serviceToken = req.headers['x-service-token'];

  if (!serviceToken) {
    return res.status(401).json({
      error: 'Service authentication required',
      message: 'X-Service-Token header is required'
    });
  }

  // In a real implementation, you would validate the token against a secret
  const validServiceTokens = [
    process.env.API_GATEWAY_TOKEN,
    process.env.INTERNAL_SERVICE_TOKEN
  ].filter(Boolean);

  if (!validServiceTokens.includes(serviceToken)) {
    return res.status(401).json({
      error: 'Invalid service token',
      message: 'The provided service token is invalid or expired'
    });
  }

  // Add service info to request
  req.service = {
    authenticated: true,
    token: serviceToken
  };

  next();
}

module.exports = {
  applySecurityMiddleware,
  getSensitiveRateLimitMiddleware,
  getRateLimitConfig,
  serviceAuthMiddleware,
  rateLimitConfigs,
  corsOptions
};