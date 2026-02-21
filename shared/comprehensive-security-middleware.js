/**
 * Comprehensive Security Middleware
 * XSS protection, CSRF protection, input validation, and security headers
 */

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const crypto = require("crypto");

class SecurityMiddleware {
    constructor(options = {}) {
        this.config = {
            enableXSSProtection: options.enableXSSProtection !== false,
            enableCSRFProtection: options.enableCSRFProtection !== false,
            enableInputValidation: options.enableInputValidation !== false,
            enableRateLimiting: options.enableRateLimiting !== false,
            rateLimitWindowMs: options.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
            rateLimitMax: options.rateLimitMax || 100,
            enableCORS: options.enableCORS !== false,
            allowedOrigins: options.allowedOrigins || [
                "http://localhost:3000",
                "http://localhost:3001",
            ],
            ...options,
        };

        this.csrfTokens = new Map();
        this.logger = options.logger || console;
    }

    /**
     * XSS Protection Middleware
     */
    xssProtection() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: false,
            crossOriginResourcePolicy: false,
            noSniff: true,
            referrerPolicy: ["strict-origin-when-cross-origin"],
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        });
    }

    /**
     * CSRF Protection Middleware
     */
    csrfProtection() {
        return (req, res, next) => {
            // Skip CSRF for GET, HEAD, OPTIONS
            if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
                return next();
            }

            const csrfToken = this.generateCSRFToken(req);

            // Set CSRF token in cookie and response header
            res.cookie("csrf-token", csrfToken.token, {
                httpOnly: true,
                secure: req.secure,
                sameSite: "strict",
                maxAge: 3600000, // 1 hour
            });

            res.set("X-CSRF-Token", csrfToken.token);

            // Validate CSRF token for state-changing requests
            const requestToken = this.extractCSRFToken(req);
            if (requestToken && !this.validateCSRFToken(requestToken, csrfToken.secret)) {
                this.logger.warn("CSRF token validation failed", {
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                    path: req.path,
                });
                return res.status(403).json({
                    success: false,
                    error: {
                        code: "CSRF_INVALID",
                        message: "Invalid CSRF token",
                    },
                });
            }

            req.csrfToken = csrfToken.token;
            req.csrfSecret = csrfToken.secret;
            next();
        };
    }

    /**
     * Rate Limiting Middleware
     */
    rateLimiting(customOptions = {}) {
        const limiter = rateLimit({
            windowMs: customOptions.windowMs || this.config.rateLimitWindowMs,
            max: customOptions.max || this.config.rateLimitMax,
            message: {
                success: false,
                error: {
                    code: "RATE_LIMIT_EXCEEDED",
                    message: "Too many requests from this IP, please try again later.",
                    retryAfter: Math.ceil(
                        (customOptions.windowMs || this.config.rateLimitWindowMs) / 1000
                    ),
                },
            },
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: req => {
                // Use user ID if available, otherwise IP
                return req.user?.id || req.ip;
            },
            skip: req => {
                // Skip rate limiting for health checks
                return req.path === "/health" || req.path === "/metrics";
            },
            handler: (req, res) => {
                this.logger.warn("Rate limit exceeded", {
                    ip: req.ip,
                    userId: req.user?.id,
                    path: req.path,
                    userAgent: req.get("User-Agent"),
                });
            },
        });

        return limiter;
    }

    /**
     * Input Validation Middleware
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
                                    code: "INVALID_QUERY_PARAM",
                                    message: `Invalid query parameter: ${field}`,
                                    field,
                                    value,
                                },
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
                                    code: "INVALID_BODY_PARAM",
                                    message: `Invalid body parameter: ${field}`,
                                    field,
                                    value,
                                },
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
                                    code: "INVALID_HEADER",
                                    message: `Invalid header: ${field}`,
                                    field,
                                    value,
                                },
                            });
                        }
                    }
                }
            } catch (error) {
                this.logger.error("Input validation error", error);
                return res.status(500).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Input validation failed",
                    },
                });
            }

            next();
        };
    }

    /**
     * CORS Middleware
     */
    cors() {
        return (req, res, next) => {
            const origin = req.headers.origin;
            const allowedOrigins = this.config.allowedOrigins;

            // Check if origin is allowed
            if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
                this.logger.warn("CORS blocked", { origin, ip: req.ip });
                return res.status(403).json({
                    success: false,
                    error: {
                        code: "CORS_BLOCKED",
                        message: "Origin not allowed",
                    },
                });
            }

            // Set CORS headers
            if (origin && allowedOrigins.includes(origin)) {
                res.setHeader("Access-Control-Allow-Origin", origin);
            }

            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With, X-CSRF-Token"
            );
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

            // Handle preflight requests
            if (req.method === "OPTIONS") {
                return res.status(204).end();
            }

            next();
        };
    }

    /**
     * Generate CSRF Token
     */
    generateCSRFToken(req) {
        const secret = crypto.randomBytes(32).toString("hex");
        const token = crypto
            .createHash("sha256")
            .update(`${secret}${req.ip}${req.get("User-Agent") || ""}`)
            .digest("hex");

        return { token, secret };
    }

    /**
     * Extract CSRF Token from Request
     */
    extractCSRFToken(req) {
        return req.headers["x-csrf-token"] || req.body?.csrf_token || req.query?.csrf_token;
    }

    /**
     * Validate CSRF Token
     */
    validateCSRFToken(token, secret) {
        return token && secret && token.length === 64; // SHA256 hex length
    }

    /**
     * Validate Individual Field
     */
    validateField(value, rules) {
        if (!Array.isArray(rules)) {
            rules = [rules];
        }

        for (const rule of rules) {
            if (!this.applyValidationRule(value, rule)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Apply Individual Validation Rule
     */
    applyValidationRule(value, rule) {
        const { type, required, minLength, maxLength, pattern, enum: enumValues } = rule;

        // Check required
        if (required && (value === undefined || value === null || value === "")) {
            return false;
        }

        // Skip validation if value is optional and empty
        if (!required && (value === undefined || value === null || value === "")) {
            return true;
        }

        // Type validations
        switch (type) {
            case "email":
                return validator.isEmail(value);
            case "string":
                return typeof value === "string";
            case "number":
                return validator.isNumeric(value) && parseFloat(value) > 0;
            case "boolean":
                return typeof value === "boolean";
            case "url":
                return validator.isURL(value);
            case "uuid":
                return validator.isUUID(value);
            case "object":
                return typeof value === "object" && value !== null && !Array.isArray(value);
            case "array":
                return Array.isArray(value);
            default:
                return true;
        }

        // Length validations
        if (typeof value === "string") {
            if (minLength && value.length < minLength) {
                return false;
            }
            if (maxLength && value.length > maxLength) {
                return false;
            }
        }

        // Pattern validation
        if (pattern && typeof value === "string") {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                return false;
            }
        }

        // Enum validation
        if (enumValues && !enumValues.includes(value)) {
            return false;
        }

        return true;
    }

    /**
     * Apply All Security Middleware
     */
    applyMiddleware(app, options = {}) {
        const middleware = [];

        // Security headers and XSS protection
        if (this.config.enableXSSProtection) {
            app.use(this.xssProtection());
            middleware.push("XSS Protection");
        }

        // CSRF protection
        if (this.config.enableCSRFProtection && options.enableCSRF) {
            app.use("/api", this.csrfProtection());
            middleware.push("CSRF Protection");
        }

        // Rate limiting
        if (this.config.enableRateLimiting) {
            const limiter = this.rateLimiting(options.rateLimit);
            app.use("/api", limiter);
            middleware.push("Rate Limiting");
        }

        // Input validation
        if (this.config.enableInputValidation && options.inputValidation) {
            const validator = this.inputValidation(options.inputValidation);
            app.use("/api", validator);
            middleware.push("Input Validation");
        }

    // CORS with improved security
    cors() {
    return (req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = this.config.allowedOrigins;

      // Strict CORS checking for security
      if (!origin) {
        return next();
      }

      // Check if origin is explicitly allowed
      const isAllowed = allowedOrigins.includes(origin);
      if (!isAllowed) {
        this.logger.warn('CORS blocked - unauthorized origin', { origin, ip: req.ip, userAgent: req.get('User-Agent') });
        return res.status(403).json({
          success: false,
          error: {
            code: 'CORS_NOT_ALLOWED',
            message: 'Origin not in allowed list',
            origin
          }
        });
      }

      // Set CORS headers for allowed origins
      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, ETag');
        
        // Add security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Content Security Policy for clickjacking protection
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data: 'https:;';");

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Methods', 'GET, sto, POST, PUT, DELETE, OPTIONS');
          return res.status(200).end();
        }

        next();
      };
    }

        this.logger.info("Security middleware applied", { middleware });
        return middleware;
    }
}

module.exports = {
    SecurityMiddleware,
};
