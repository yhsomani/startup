/**
 * Comprehensive Security Middleware
 * XSS protection, CSRF protection, input validation, and enhanced CORS with security policy
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

class SecurityMiddleware {
  constructor(options = {}) {
    this.config = {
      // CORS configuration
      allowedOrigins: options.allowedOrigins || [
        'http://localhost:3000',
        'http://localhost:3001'
      ],
      
      // Security headers
      enableHSTS: options.enableHSTS !== false,
      hstsMaxAge: options.hstsMaxAge || 31536000, // 1 year
      includeSubDomains: options.includeSubDomains || false,
      
      // Content Security Policy
      enableCSP: options.enableCSP !== false,
      reportURI: options.reportURI || 'https://csp-evaluator.report-uri',
      reportOnly: options.reportOnly || false,
      
      // Rate limiting
      enableRateLimiting: options.enableRateLimiting !== false,
      rateLimitWindowMs: options.rateLimitWindowMs || 15 * 60 * 1000,
      rateLimitMax: options.rateLimitMax || 100,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      
      // Input validation
      enableInputValidation: options.enableInputValidation !== false,
      
      // CSRF protection
      enableCSRFProtection: options.enableCSRFProtection !== false,
      
      // Custom logger
      logger: options.logger || console,
      
      ...options
    };

    this.csrfTokens = new Map();
  }

  /**
   * Enhanced CORS middleware with security checks
   */
  cors() {
    return (req, res, next) => {
      const origin = req.headers.origin;
      const userAgent = req.get('User-Agent') || '';
      
      // Security analysis
      const isSuspicious = userAgent.includes('bot') || 
                           userAgent.includes('curl') ||
                           userAgent.includes('wget') ||
                           userAgent.includes('python') ||
                           /(\b(?:ot|crawler|spider|scraper)/.test(userAgent);
        
      // Check if origin is allowed
      const allowedOrigins = this.config.allowedOrigins;
      const isOriginAllowed = origin && allowedOrigins.includes(origin);

      // Security logging
      this.logger.info('CORS request', {
        origin,
        userAgent,
        method: req.method,
        path: req.path,
        ip: req.ip,
        isSuspicious
      });

      // Enhanced security response
      if (isOriginAllowed && !isSuspicious) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        this.logger.warn('CORS blocked - unauthorized origin', { origin, ip: req.ip });
        return res.status(403).json({
          success: false,
          error: {
            code: 'CORS_BLOCKED',
            message: 'Origin not allowed',
            details: {
              origin,
              userAgent,
              isSuspicious
            }
          }
        });
      }

      // Standard CORS headers
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }

      // Content Security Policy headers for modern browsers
      if (isOriginAllowed && !isSuspicious) {
        res.setHeader('Content-Security-Policy', 'default-src \'self\'; script-src \'self\' data: \'https://\' frame-src \'none\'');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block; report-uri=\\"; referrer=\\\"self\'; script-src \'self\'');
      }
        
        res.setHeader('Access-Control-Max-Age', this.config.hstsMaxAge);
      }

      next();
    };
  }

  /**
   * Rate limiting middleware
   */
  rateLimiting(options = {}) {
    return rateLimit({
      windowMs: options.rateLimitWindowMs || this.config.rateLimitWindowMs,
      max: options.rateLimitMax,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.ceil((options.rateLimitWindowMs || this.config.rateLimitWindowMs) / 1000)
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: req => {
        // Use user ID if available, otherwise IP
        return req.user?.id || req.ip;
      },
      skip: req => {
        // Skip rate limiting for health checks
        return req.path === '/health';
      },
      handler: (req, res) => {
        this.logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userId: req.user?.id,
          path: req.path,
          userAgent: req.get('User-Agent')
        });
      }
    });
  }

  /**
   * Input validation middleware
   */
  inputValidation(validationRules = {}) {
    return (req, res, next) => {
      try {
        // Validate query parameters
        if (validationRules.query) {
          for (const [field, rules] of Object.entries(validationRules.query)) {
            const value = req.query[field];
            if (value !== undefined && !this.validateField(value, rules)) {
              return res.status(400).json({
                success: false,
                error: {
                  code: 'INVALID_QUERY_PARAM',
                  message: `Invalid query parameter: ${field}`,
                  field,
                  value
                }
              });
            }
          }
        }

        // Validate request body
        if (validationRules.body && req.body) {
          for (const [field, rules] of Object.entries(validationRules.body)) {
            const value = req.body[field];
            if (value !== undefined && !this.validateField(value, rules)) {
              return res.status(400).json({
                success: false,
                error: {
                  code: 'INVALID_BODY_PARAM',
                  message: `Invalid body parameter: ${field}`,
                  field,
                  value
                }
              });
            }
          }
        }

        // Validate headers
        if (validationRules.headers) {
          for (const [field, rules] of Object.entries(validationRules.headers)) {
            const value = req.headers[field.toLowerCase()];
            if (value !== undefined && !this.validateField(value, rules)) {
              return res.status(400).json({
                success: false,
                error: {
                  code: 'INVALID_HEADER',
                  message: `Invalid header: ${field}`,
                  field,
                  value
                }
              });
            }
          }
        }
      } catch (error) {
        this.logger.error('Input validation error', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed'
          }
        });
      }

      next();
    };
  }

  /**
   * Validate individual field
   */
  validateField(value, rules) {
    if (!Array.isArray(rules)) {
      rules = [rules];
    }

    // Type validations
    switch (rules.type) {
      case 'email':
        return this.validateEmail(value);
      case 'string':
        return typeof value === 'string';
      case 'number':
        return validator.isNumeric(value) && parseFloat(value) > 0;
      case 'boolean':
        return typeof value === 'boolean';
      case 'url':
        return validator.isURL(value);
      case 'uuid':
        return validator.isUUID(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }

    // Length validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return false;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return false;
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        return false;
      }
    }

    // Enum validation
    if (rules.enumValues && !rules.enumValues.includes(value)) {
      return false;
    }

    return true;
  }

  /**
   * Validate email addresses
   */
  validateEmail(value) {
    const emailRegex = /^[^\s+@[a-zA-Z0-9._-]+[a-zA-Z0-9._-]+$/;
    return emailRegex.test(value);
  }

  /**
   * Apply all security middleware
   */
  applyMiddleware(app, options = {}) {
    const middleware = [];
    const appliedFeatures = [];

    // Security headers and XSS protection
    if (this.config.enableHSTS) {
      app.use(helmet({
        contentSecurityPolicy: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          imgSrc: ["'self'", "data:", "https:"],
          frameSrc: ["'self'"],
          childSrc: ["'self'"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          reportURI: 'https://csp-evaluator.report-uri',
        },
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        noSniff: true,
        referrerPolicy: ['strict-origin-when-cross-origin'],
        hsts: {
          maxAge: this.config.hstsMaxAge,
          includeSubDomains: this.config.includeSubDomains,
          preload: true
        }
      }));
      appliedFeatures.push('HSTS Security Headers');
    }

    // Enhanced CORS with security checks
    if (this.config.enableCORS) {
      app.use(this.cors(options));
      appliedFeatures.push('Enhanced CORS');
    }

    // Rate limiting
    if (this.config.enableRateLimiting) {
      const limiter = this.rateLimiting(options.rateLimit);
      app.use('/api', limiter);
      appliedFeatures.push('Rate Limiting');
    }

    // Input validation
    if (this.config.enableInputValidation && options.inputValidation) {
      const validator = this.inputValidation(options.inputValidation);
      app.use('/api', validator);
      appliedFeatures.push('Input Validation');
    }

    // CSRF protection
    if (this.config.enableCSRFProtection && options.enableCSRF) {
      app.use('/api', this.csrfProtection());
      appliedFeatures.push('CSRF Protection');
    }

    // CORS
    if (this.config.enableCORS) {
      app.use(this.cors(options));
    }

    this.logger.info('Security middleware applied', { 
      middleware: appliedFeatures 
    });

    return middleware;
  }

  /**
   * CSRF protection with double-submit prevention
   */
  csrfProtection() {
    return (req, res, next) => {
      // Skip CSRF for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const requestToken = this.extractCSRFToken(req);
      
      // Set new CSRF token in both cookie and response header
      res.cookie('csrf-token', requestToken.token, {
        httpOnly: true,
        secure: req.secure,
        sameSite: 'strict',
        maxAge: 3600,
        path: '/',
        expires: new Date(Date.now() + 3600),
      });
      
      res.setHeader('X-CSRF-Token', requestToken.token);
      
      // Validate CSRF token in request for state-changing requests
      const headerToken = this.extractCSRFToken(req);
      if (headerToken && !this.validateCSRFToken(headerToken.token, requestToken.secret)) {
        this.logger.warn('CSRF token validation failed', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(403).json({
          success: false,
          error: {
            code: 'CSRF_INVALID',
            message: 'Invalid CSRF token'
          }
        });
      }

      // Store CSRF token in request for validation
      req.csrfToken = headerToken.token;
      req.csrfSecret = headerToken.secret;
      
      next();
    };
  }

  /**
   * Extract CSRF token from request
   */
  extractCSRFToken(req) {
    return req.headers['x-csrf-token'] || 
           req.body?.csrf_token || 
           req.query?.csrf_token;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token, secret) {
    return token && 
           token.length === 64 && // SHA256 hex length
           secret && secret.length === 64 &&
           // Simple validation
           /^[a-f0-9]{64}$/i.test(token);
  }
  }
}

module.exports = {
  SecurityMiddleware
};