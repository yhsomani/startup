/**
 * TalentSphere Enhanced Security Middleware
 * Adds additional security layers beyond basic Helmet configuration
 */

const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp'); // HTTP Parameter Pollution Protection
const cors = require('cors');
const helmet = require('helmet');

class SecurityEnhancer {
    constructor(options = {}) {
        this.options = {
            enableRateLimiting: options.enableRateLimiting !== false,
            enableMongoSanitization: options.enableMongoSanitization !== false,
            enableXSSProtection: options.enableXSSProtection !== false,
            enableHPPProtection: options.enableHPPProtection !== false,
            enableCors: options.enableCors !== false,
            enableHelmet: options.enableHelmet !== false,
            enableInputValidation: options.enableInputValidation !== false,
            enableRequestBodySizeLimit: options.enableRequestBodySizeLimit !== false,
            requestBodyLimit: options.requestBodyLimit || '10mb',
            ...options
        };
    }

    /**
     * Get comprehensive security middleware stack
     */
    getSecurityStack() {
        const middleware = [];

        // Helmet for security headers (if enabled)
        if (this.options.enableHelmet) {
            middleware.push(helmet(this.getHelmetOptions()));
        }

        // CORS (if enabled)
        if (this.options.enableCors) {
            middleware.push(cors(this.getCorsOptions()));
        }

        // Rate limiting (if enabled)
        if (this.options.enableRateLimiting) {
            middleware.push(this.getRateLimitingMiddleware());
        }

        // Request body size limit (if enabled)
        if (this.options.enableRequestBodySizeLimit) {
            middleware.push(require('express').json({
                limit: this.options.requestBodyLimit,
                verify: (req, res, buf) => {
                    // Additional security checks during body parsing
                    this.validateRequestBody(buf);
                }
            }));
            middleware.push(require('express').urlencoded({
                extended: true,
                limit: this.options.requestBodyLimit
            }));
        }

        // MongoDB sanitization (if enabled)
        if (this.options.enableMongoSanitization) {
            middleware.push(mongoSanitize({
                allowDots: false,
                replaceWith: '_'
            }));
        }

        // XSS protection (if enabled)
        if (this.options.enableXSSProtection) {
            middleware.push(xss());
        }

        // HTTP Parameter Pollution protection (if enabled)
        if (this.options.enableHPPProtection) {
            middleware.push(hpp({
                whitelist: [], // List specific parameters to allow multiple values for
                blacklist: []  // List specific parameters to deny multiple values for
            }));
        }

        // Additional input validation middleware (if enabled)
        if (this.options.enableInputValidation) {
            middleware.push(this.getInputValidationMiddleware());
        }

        // Security headers middleware
        middleware.push(this.getAdditionalSecurityHeaders());

        return middleware;
    }

    /**
     * Get Helmet options
     */
    getHelmetOptions() {
        return {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
                    connectSrc: ["'self'", "https://api.talentsphere.com", "ws:", "wss:"],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    manifestSrc: ["'self'"],
                    workerSrc: ["'self'"],
                    childSrc: ["'self'"],
                    formAction: ["'self'"],
                    baseUri: ["'self'"],
                    sandbox: ['allow-downloads', 'allow-forms', 'allow-same-origin', 'allow-scripts', 'allow-popups'],
                    reportUri: ['/api/security/csp-report']
                }
            },
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: 'same-origin',
            crossOriginResourcePolicy: 'same-origin',
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            noSniff: true,
            xssFilter: true,
            frameguard: { action: 'deny' },
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            permittedCrossDomainPolicies: 'none',
            hidePoweredBy: true,
            ieNoOpen: true,
            dnsPrefetchControl: { allow: false }
        };
    }

    /**
     * Get CORS options
     */
    getCorsOptions() {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            const origins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
            return {
                origin: origins,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
                allowedHeaders: [
                    'Content-Type', 'Authorization', 'X-Requested-With',
                    'Accept', 'X-CSRF-Token', 'X-HTTP-Method-Override',
                    'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP',
                    'X-Client-Version', 'X-Client-ID', 'X-Device-ID',
                    'X-Platform', 'X-Timezone', 'X-Language',
                    'X-App-Version', 'X-Device-Type', 'X-OS', 'X-OS-Version'
                ],
                exposedHeaders: [
                    'X-Total-Count', 'X-Page-Count', 'X-Request-ID',
                    'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset',
                    'X-Response-Time', 'X-Server', 'X-Timestamp',
                    'Link', 'Location', 'Retry-After', 'ETag', 'Last-Modified'
                ],
                preflightContinue: false,
                optionsSuccessStatus: 204,
                maxAge: 86400 // 24 hours
            };
        } else {
            return {
                origin: ['http://localhost:3000', 'http://localhost:3100', 'http://127.0.0.1:3000', 'http://127.0.0.1:3100'],
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
                allowedHeaders: [
                    'Content-Type', 'Authorization', 'X-Requested-With',
                    'Accept', 'X-CSRF-Token', 'X-HTTP-Method-Override',
                    'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP',
                    'X-Client-Version', 'X-Client-ID', 'X-Device-ID',
                    'X-Platform', 'X-Timezone', 'X-Language',
                    'X-App-Version', 'X-Device-Type', 'X-OS', 'X-OS-Version'
                ],
                exposedHeaders: [
                    'X-Total-Count', 'X-Page-Count', 'X-Request-ID',
                    'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset',
                    'X-Response-Time', 'X-Server', 'X-Timestamp',
                    'Link', 'Location', 'Retry-After', 'ETag', 'Last-Modified'
                ],
                preflightContinue: false,
                optionsSuccessStatus: 204,
                maxAge: 86400 // 24 hours
            };
        }
    }

    /**
     * Get rate limiting middleware
     */
    getRateLimitingMiddleware() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false,
            // Skip successful requests to only rate limit failed attempts
            skipSuccessfulRequests: false,
            // Store to use for rate limit data
            store: this.getRateLimitStore()
        });
    }

    /**
     * Get rate limit store (could be customized for Redis, etc.)
     */
    getRateLimitStore() {
        // Using default memory store, in production consider Redis store
        return undefined;
    }

    /**
     * Input validation middleware
     */
    getInputValidationMiddleware() {
        return (req, res, next) => {
            try {
                // Validate request path for malicious patterns
                if (req.path && this.containsMaliciousPattern(req.path)) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_PATH',
                            message: 'Request path contains invalid characters or patterns'
                        }
                    });
                }

                // Validate query parameters
                if (req.query) {
                    for (const [key, value] of Object.entries(req.query)) {
                        if (this.containsMaliciousPattern(String(value))) {
                            return res.status(400).json({
                                success: false,
                                error: {
                                    code: 'INVALID_QUERY_PARAM',
                                    message: `Query parameter '${key}' contains invalid characters or patterns`
                                }
                            });
                        }
                    }
                }

                // Validate headers
                if (req.headers) {
                    for (const [key, value] of Object.entries(req.headers)) {
                        if (typeof value === 'string' && this.containsMaliciousPattern(value)) {
                            return res.status(400).json({
                                success: false,
                                error: {
                                    code: 'INVALID_HEADER',
                                    message: `Header '${key}' contains invalid characters or patterns`
                                }
                            });
                        }
                    }
                }

                next();
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Input validation error'
                    }
                });
            }
        };
    }

    /**
     * Additional security headers
     */
    getAdditionalSecurityHeaders() {
        return (req, res, next) => {
            // Set additional security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Download-Options', 'noopen');
            res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
            res.setHeader('X-XSS-Protection', '1; mode=block');

            // Set custom security headers
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

            // Add security timestamp
            res.setHeader('X-Security-Timestamp', new Date().toISOString());

            // Add security version
            res.setHeader('X-Security-Version', '1.0.0');

            next();
        };
    }

    /**
     * Validate request body
     */
    validateRequestBody(body) {
        // Check for excessively large payloads
        if (body.length > 10 * 1024 * 1024) { // 10MB
            throw new Error('Request body too large');
        }

        // Additional validation can be added here
    }

    /**
     * Check if string contains malicious patterns
     */
    containsMaliciousPattern(str) {
        if (typeof str !== 'string') {return false;}

        // Patterns to detect potential attacks
        const maliciousPatterns = [
            /(<script\b|<iframe\b|<object\b|<embed\b|<link\b)/i,  // XSS
            /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i,  // SQL Injection
            /(\.\.\/|\.\.\\)/,  // Directory traversal
            /(\{\s*\w+\s*:\s*\w+\s*\})/,  // Potential prototype pollution
            /(eval\s*\(|function\s*\(|setTimeout\s*\(|setInterval\s*\()/i,  // Code execution
            /(%2e|%2f|%5c|%252e|%252f|%255c)/i,  // Encoded traversal
            /(document\.cookie|window\.location|document\.domain)/i  // Client-side attacks
        ];

        return maliciousPatterns.some(pattern => pattern.test(str));
    }
}

// Export singleton instance
const securityEnhancer = new SecurityEnhancer();

module.exports = {
    SecurityEnhancer,
    securityEnhancer,
    getSecurityStack: securityEnhancer.getSecurityStack.bind(securityEnhancer),
    getHelmetOptions: securityEnhancer.getHelmetOptions.bind(securityEnhancer),
    getCorsOptions: securityEnhancer.getCorsOptions.bind(securityEnhancer),
    getRateLimitingMiddleware: securityEnhancer.getRateLimitingMiddleware.bind(securityEnhancer),
    getInputValidationMiddleware: securityEnhancer.getInputValidationMiddleware.bind(securityEnhancer)
};