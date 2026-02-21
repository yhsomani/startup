/**
 * TalentSphere Security Middleware Configuration
 * 
 * This module provides security middleware for all TalentSphere services
 * including CORS, rate limiting, security headers, and authentication
 */

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { getCORSConfig, getSecurityHeaders, getRateLimitConfig } = require('../shared/security');

/**
 * Get CORS middleware configuration
 */
function getCORSMiddleware() {
  try {
    const corsConfig = getCORSConfig();
    return cors(corsConfig);
  } catch (error) {
    console.error('CORS configuration error:', error.message);
    
    // Fallback to development CORS
    return cors({
      origin: ['http://localhost:3000', 'http://localhost:3100'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    });
  }
}

/**
 * Get security headers middleware
 */
function getSecurityHeadersMiddleware() {
  try {
    const securityConfig = getSecurityHeaders();
    return helmet(securityConfig);
  } catch (error) {
    console.error('Security headers configuration error:', error.message);
    
    // Fallback to basic security headers
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    });
  }
}

/**
 * Get rate limiting middleware
 */
function getRateLimitMiddleware(options = {}) {
  try {
    const rateLimitConfig = getRateLimitConfig();
    const config = { ...rateLimitConfig, ...options };
    
    return rateLimit(config);
  } catch (error) {
    console.error('Rate limit configuration error:', error.message);
    
    // Fallback to basic rate limiting
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
  }
}

/**
 * Get stricter rate limiting for sensitive endpoints
 */
function getSensitiveRateLimitMiddleware(endpoint) {
  const rateLimitConfig = getRateLimitConfig();
  const sensitiveConfig = rateLimitConfig.sensitiveEndpoints[endpoint];
  
  if (sensitiveConfig) {
    return rateLimit(sensitiveConfig);
  }
  
  // Default sensitive endpoint limits
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // very strict for sensitive operations
    message: 'Too many attempts from this IP, please try again later.',
    skipSuccessfulRequests: true
  });
}

/**
 * Request ID middleware for tracing
 */
function requestIdMiddleware() {
  return (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || 
                   require('crypto').randomBytes(16).toString('hex');
    
    res.setHeader('x-request-id', req.requestId);
    next();
  };
}

/**
 * Service authentication middleware
 */
function serviceAuthMiddleware() {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const serviceKey = req.headers['x-service-key'];
    
    // Skip for health checks and public endpoints
    if (req.path === '/health' || req.path === '/metrics') {
      return next();
    }
    
    // Check for service-to-service authentication
    if (serviceKey && serviceKey === process.env.API_SECRET) {
      req.serviceAuthenticated = true;
      return next();
    }
    
    // Regular JWT authentication will be handled by auth middleware
    next();
  };
}

/**
 * API versioning middleware
 */
function apiVersionMiddleware() {
  return (req, res, next) => {
    const version = req.headers['api-version'] || 'v1';
    req.apiVersion = version;
    res.setHeader('api-version', version);
    next();
  };
}

/**
 * Request logging middleware
 */
function requestLoggingMiddleware() {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        apiVersion: req.apiVersion
      };
      
      // Log in development, structured format in production
      if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify(logData));
      } else {
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.requestId}`);
      }
    });
    
    next();
  };
}

/**
 * Error handling middleware
 */
function errorHandlingMiddleware() {
  return (error, req, res, next) => {
    // Log error with request context
    console.error('Request error:', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress
    });
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    const response = {
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: isDevelopment ? error.message : 'An internal error occurred',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    };
    
    if (isDevelopment) {
      response.error.details = {
        stack: error.stack,
        url: req.originalUrl,
        method: req.method
      };
    }
    
    res.status(error.statusCode || 500).json(response);
  };
}

/**
 * 404 handling middleware
 */
function notFoundMiddleware() {
  return (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  };
}

/**
 * Complete security middleware stack
 */
function securityMiddleware(options = {}) {
  const {
    enableCORS = true,
    enableSecurityHeaders = true,
    enableRateLimit = true,
    enableRequestLogging = true,
    enableServiceAuth = false,
    customRateLimit = null
  } = options;
  
  const middlewares = [];
  
  // Request ID should be first
  middlewares.push(requestIdMiddleware());
  
  // API versioning
  middlewares.push(apiVersionMiddleware());
  
  // Security headers
  if (enableSecurityHeaders) {
    middlewares.push(getSecurityHeadersMiddleware());
  }
  
  // CORS
  if (enableCORS) {
    middlewares.push(getCORSMiddleware());
  }
  
  // Service authentication
  if (enableServiceAuth) {
    middlewares.push(serviceAuthMiddleware());
  }
  
  // Rate limiting
  if (enableRateLimit) {
    if (customRateLimit) {
      middlewares.push(customRateLimit);
    } else {
      middlewares.push(getRateLimitMiddleware());
    }
  }
  
  // Request logging
  if (enableRequestLogging) {
    middlewares.push(requestLoggingMiddleware());
  }
  
  return middlewares;
}

/**
 * Apply security middleware to Express app
 */
function applySecurityMiddleware(app, options = {}) {
  // Apply security middleware stack
  securityMiddleware(options).forEach(middleware => {
    app.use(middleware);
  });
  
  // Error handling should be last
  app.use(errorHandlingMiddleware());
  app.use(notFoundMiddleware());
}

module.exports = {
  getCORSMiddleware,
  getSecurityHeadersMiddleware,
  getRateLimitMiddleware,
  getSensitiveRateLimitMiddleware,
  requestIdMiddleware,
  serviceAuthMiddleware,
  apiVersionMiddleware,
  requestLoggingMiddleware,
  errorHandlingMiddleware,
  notFoundMiddleware,
  securityMiddleware,
  applySecurityMiddleware
};