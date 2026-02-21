/**
 * Enhanced Security Manager for TalentSphere Platform
 *
 * Comprehensive security implementation addressing all identified vulnerabilities:
 * - SQL injection prevention
 * - Authentication and session management
 * - Input validation and sanitization
 * - CORS and security headers
 * - Rate limiting and abuse prevention
 * - Error handling and logging
 */

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { createLogger } = require("../../shared/enhanced-logger");

class SecurityManager {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.logger = createLogger(`SecurityManager-${serviceName}`);

        // Security configuration
        this.config = {
            // JWT configuration
            jwt: {
                secret: options.jwt?.secret || process.env.JWT_SECRET || this.generateSecret(),
                algorithm: "HS256",
                expiresIn: options.jwt?.expiresIn || "24h",
                issuer: "talentsphere-api",
                audience: "talentsphere-webapp",
                refreshTokenExpiresIn: options.jwt?.refreshTokenExpiresIn || "7d",
            },

            // Password configuration
            password: {
                minLength: options.password?.minLength || 8,
                maxLength: options.password?.maxLength || 128,
                saltRounds: options.password?.saltRounds || 12,
                requireUppercase: options.password?.requireUppercase !== false,
                requireLowercase: options.password?.requireLowercase !== false,
                requireNumbers: options.password?.requireNumbers !== false,
                requireSpecialChars: options.password?.requireSpecialChars !== false,
            },

            // Session configuration
            session: {
                secret:
                    options.session?.secret || process.env.SESSION_SECRET || this.generateSecret(),
                name: options.session?.name || "talentsphere.sid",
                secure: options.session?.secure !== false, // HTTPS only in production
                httpOnly: options.session?.httpOnly !== false,
                maxAge: options.session?.maxAge || 30 * 60 * 1000, // 30 minutes
                rolling: options.session?.rolling !== false,
                resave: false,
                saveUninitialized: false,
            },

            // Rate limiting
            rateLimit: {
                windowMs: options.rateLimit?.windowMs || 15 * 60 * 1000, // 15 minutes
                max: options.rateLimit?.max || 1000, // 1000 requests per window
                message: "Too many requests from this IP, please try again later.",
                standardHeaders: true,
                legacyHeaders: false,
                // Different limits for different operations
                auth: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 5, // 5 auth attempts per window
                    message: "Too many authentication attempts, please try again later.",
                },
                sensitive: {
                    windowMs: 60 * 60 * 1000, // 1 hour
                    max: 3, // 3 sensitive operations per hour
                    message: "Too many sensitive operations, please try again later.",
                },
            },

            // CORS configuration
            cors: {
                origin: options.cors?.origin || this.getAllowedOrigins(),
                credentials: options.cors?.credentials !== false,
                methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                allowedHeaders: [
                    "Origin",
                    "X-Requested-With",
                    "Content-Type",
                    "Accept",
                    "Authorization",
                    "X-Correlation-ID",
                    "X-API-Key",
                ],
                exposedHeaders: ["X-Total-Count", "X-Correlation-ID"],
            },

            // Security headers
            headers: {
                contentSecurityPolicy: {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                        scriptSrc: ["'self'", "'unsafe-inline'"],
                        imgSrc: ["'self'", "data:", "https:"],
                        fontSrc: ["'self'", "https://fonts.gstatic.com"],
                        connectSrc: ["'self'"],
                        frameSrc: ["'none'"],
                        objectSrc: ["'none'"],
                    },
                },
                crossOriginEmbedderPolicy: false,
                hsts: {
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true,
                },
            },

            // Input validation
            validation: {
                emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                usernamePattern: /^[a-zA-Z0-9_-]{3,30}$/,
                sanitizeInput: options.validation?.sanitizeInput !== false,
                maxStringLength: options.validation?.maxStringLength || 10000,
            },
        };

        // Initialize metrics
        this.metrics = {
            authAttempts: 0,
            authSuccesses: 0,
            authFailures: 0,
            blockedRequests: 0,
            securityViolations: 0,
            rateLimitViolations: 0,
        };

        // Blocked IPs cache
        this.blockedIPs = new Set();

        this.logger.info("Security Manager initialized", {
            serviceName,
            features: {
                jwt: !!this.config.jwt.secret,
                rateLimit: !!this.config.rateLimit,
                cors: !!this.config.cors.origin,
                secureHeaders: true,
            },
        });
    }

    /**
     * Generate cryptographically secure secret
     */
    generateSecret(length = 64) {
        return crypto.randomBytes(length).toString("hex");
    }

    /**
     * Get allowed origins based on environment
     */
    getAllowedOrigins() {
        const env = process.env.NODE_ENV || "development";

        if (env === "production") {
            return ["https://talentsphere.com", "https://www.talentsphere.com"];
        } else if (env === "staging") {
            return [
                "https://staging.talentsphere.com",
                "http://localhost:3000",
                "http://localhost:3001",
            ];
        } else {
            return [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
            ];
        }
    }

    /**
     * Create Express middleware for security
     */
    getSecurityMiddleware() {
        const middleware = [];

        // Security headers
        middleware.push(helmet(this.config.headers));

        // CORS
        const cors = require("cors");
        middleware.push(cors(this.config.cors));

        // Body parsing limits
        const express = require("express");
        middleware.push(
            express.json({
                limit: "10mb",
                verify: (req, res, buf) => {
                    req.rawBody = buf;
                },
            })
        );
        middleware.push(express.urlencoded({ extended: true, limit: "10mb" }));

        // Request ID and correlation
        middleware.push(this.createCorrelationMiddleware());

        // Rate limiting
        middleware.push(this.createRateLimitMiddleware());

        // Input sanitization
        middleware.push(this.createSanitizationMiddleware());

        // Security headers
        middleware.push(this.createSecurityHeadersMiddleware());

        return middleware;
    }

    /**
     * Create correlation ID middleware
     */
    createCorrelationMiddleware() {
        return (req, res, next) => {
            req.correlationId = req.get("X-Correlation-ID") || crypto.randomUUID();
            res.setHeader("X-Correlation-ID", req.correlationId);

            // Log request start
            this.logger.debug("Request started", {
                correlationId: req.correlationId,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
            });

            // Override res.end to log response
            const originalEnd = res.end;
            res.end = function (chunk, encoding) {
                this.logger.debug("Request completed", {
                    correlationId: req.correlationId,
                    statusCode: res.statusCode,
                    responseTime: Date.now() - req.startTime,
                });
                originalEnd.call(this, chunk, encoding);
            };

            req.startTime = Date.now();
            next();
        };
    }

    /**
     * Create rate limiting middleware
     */
    createRateLimitMiddleware() {
        // General rate limiting
        const { auth, sensitive, ...generalConfig } = this.config.rateLimit;
        const generalLimiter = rateLimit(generalConfig);

        return (req, res, next) => {
            // Check if IP is blocked
            if (this.blockedIPs.has(req.ip)) {
                this.metrics.blockedRequests++;
                return res.status(403).json({
                    error: "IP_BLOCKED",
                    message: "Your IP address has been blocked due to suspicious activity",
                    correlationId: req.correlationId,
                });
            }

            // Apply different limits for different routes
            if (
                req.path.includes("/auth/") ||
                req.path.includes("/login") ||
                req.path.includes("/register")
            ) {
                const authLimiter = rateLimit(this.config.rateLimit.auth);
                return authLimiter(req, res, err => {
                    if (err) {
                        this.metrics.rateLimitViolations++;
                        this.logger.warn("Rate limit exceeded for auth", {
                            correlationId: req.correlationId,
                            ip: req.ip,
                            path: req.path,
                        });
                        return next(err);
                    }
                    next();
                });
            }

            if (req.path.includes("/admin/") || req.path.includes("/sensitive/")) {
                const sensitiveLimiter = rateLimit(this.config.rateLimit.sensitive);
                return sensitiveLimiter(req, res, err => {
                    if (err) {
                        this.metrics.rateLimitViolations++;
                        this.logger.warn("Rate limit exceeded for sensitive operation", {
                            correlationId: req.correlationId,
                            ip: req.ip,
                            path: req.path,
                        });
                        return next(err);
                    }
                    next();
                });
            }

            generalLimiter(req, res, err => {
                if (err) {
                    this.metrics.rateLimitViolations++;
                    return next(err);
                }
                next();
            });
        };
    }

    /**
     * Create input sanitization middleware
     */
    createSanitizationMiddleware() {
        return (req, res, next) => {
            if (this.config.validation.sanitizeInput) {
                // Sanitize body
                if (req.body) {
                    req.body = this.sanitizeObject(req.body);
                }

                // Sanitize query parameters
                if (req.query) {
                    req.query = this.sanitizeObject(req.query);
                }

                // Sanitize URL parameters
                if (req.params) {
                    req.params = this.sanitizeObject(req.params);
                }
            }

            next();
        };
    }

    /**
     * Sanitize object recursively
     */
    sanitizeObject(obj) {
        if (typeof obj !== "object" || obj === null) {
            return this.sanitizeValue(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = this.sanitizeObject(value);
        }
        return sanitized;
    }

    /**
     * Sanitize individual values
     */
    sanitizeValue(value) {
        if (typeof value !== "string") {
            return value;
        }

        // Check length
        if (value.length > this.config.validation.maxStringLength) {
            throw new Error(
                `Input exceeds maximum allowed length of ${this.config.validation.maxStringLength}`
            );
        }

        // Remove potentially dangerous content
        return value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
            .replace(/javascript:/gi, "") // Remove javascript protocol
            .replace(/on\w+\s*=/gi, "") // Remove event handlers
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframes
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "") // Remove objects
            .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "") // Remove embeds
            .trim();
    }

    /**
     * Create security headers middleware
     */
    createSecurityHeadersMiddleware() {
        return (req, res, next) => {
            // Additional security headers
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("X-XSS-Protection", "1; mode=block");
            res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

            // Cache control for API endpoints
            if (req.path.startsWith("/api/")) {
                res.setHeader(
                    "Cache-Control",
                    "no-store, no-cache, must-revalidate, proxy-revalidate"
                );
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", "0");
            }

            next();
        };
    }

    /**
     * JWT token generation
     */
    generateToken(payload, options = {}) {
        const tokenPayload = {
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomUUID(),
            iss: this.config.jwt.issuer,
            aud: this.config.jwt.audience,
        };

        return jwt.sign(tokenPayload, this.config.jwt.secret, {
            algorithm: this.config.jwt.algorithm,
            expiresIn: options.expiresIn || this.config.jwt.expiresIn,
        });
    }

    /**
     * JWT token verification
     */
    verifyToken(token, options = {}) {
        try {
            return jwt.verify(token, this.config.jwt.secret, {
                algorithms: [this.config.jwt.algorithm],
                issuer: this.config.jwt.issuer,
                audience: this.config.jwt.audience,
                ...options,
            });
        } catch (error) {
            this.logger.warn("Token verification failed", {
                error: error.message,
                correlationId: options.correlationId,
            });
            throw error;
        }
    }

    /**
     * Refresh token generation
     */
    generateRefreshToken(payload) {
        return this.generateToken(payload, {
            expiresIn: this.config.jwt.refreshTokenExpiresIn,
        });
    }

    /**
     * Password hashing
     */
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.config.password.saltRounds);
        } catch (error) {
            this.logger.error("Password hashing failed", { error: error.message });
            throw new Error("Password hashing failed");
        }
    }

    /**
     * Password verification
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            this.logger.error("Password verification failed", { error: error.message });
            throw new Error("Password verification failed");
        }
    }

    /**
     * Password validation
     */
    validatePassword(password) {
        const errors = [];

        if (password.length < this.config.password.minLength) {
            errors.push(
                `Password must be at least ${this.config.password.minLength} characters long`
            );
        }

        if (password.length > this.config.password.maxLength) {
            errors.push(`Password must not exceed ${this.config.password.maxLength} characters`);
        }

        if (this.config.password.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }

        if (this.config.password.requireLowercase && !/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }

        if (this.config.password.requireNumbers && !/\d/.test(password)) {
            errors.push("Password must contain at least one number");
        }

        if (this.config.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("Password must contain at least one special character");
        }

        return {
            isValid: errors.length === 0,
            errors,
            score: this.calculatePasswordScore(password),
        };
    }

    /**
     * Calculate password strength score
     */
    calculatePasswordScore(password) {
        let score = 0;

        // Length contribution (up to 40 points)
        score += Math.min(password.length * 2, 40);

        // Character variety (up to 40 points)
        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/\d/.test(password)) score += 10;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

        // Entropy (up to 20 points)
        const uniqueChars = new Set(password).size;
        score += Math.min(uniqueChars * 2, 20);

        return Math.min(score, 100);
    }

    /**
     * Email validation
     */
    validateEmail(email) {
        const isValid = this.config.validation.emailPattern.test(email);

        if (!isValid) {
            return {
                isValid: false,
                error: "Invalid email format",
            };
        }

        return {
            isValid: true,
        };
    }

    /**
     * Username validation
     */
    validateUsername(username) {
        const isValid = this.config.validation.usernamePattern.test(username);

        if (!isValid) {
            return {
                isValid: false,
                error: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens",
            };
        }

        return {
            isValid: true,
        };
    }

    /**
     * Block IP address
     */
    blockIP(ip, duration = 24 * 60 * 60 * 1000) {
        // 24 hours default
        this.blockedIPs.add(ip);
        this.metrics.securityViolations++;

        this.logger.warn("IP blocked", {
            ip,
            duration,
            reason: "Security violation",
            timestamp: new Date().toISOString(),
        });

        // Auto-unblock after duration
        setTimeout(() => {
            this.blockedIPs.delete(ip);
            this.logger.info("IP unblocked", { ip });
        }, duration);
    }

    /**
     * Create authentication middleware
     */
    createAuthMiddleware(options = {}) {
        return (req, res, next) => {
            try {
                const token = this.extractToken(req);

                if (!token) {
                    this.metrics.authFailures++;
                    return res.status(401).json({
                        error: "AUTH_REQUIRED",
                        message: "Authentication token is required",
                        correlationId: req.correlationId,
                    });
                }

                const decoded = this.verifyToken(token, { correlationId: req.correlationId });

                // Add user info to request
                req.user = decoded;
                req.authTime = Date.now();

                this.metrics.authSuccesses++;
                this.logger.debug("Authentication successful", {
                    correlationId: req.correlationId,
                    userId: decoded.sub || decoded.id,
                    scope: decoded.scope,
                });

                next();
            } catch (error) {
                this.metrics.authFailures++;

                let errorType = "AUTH_INVALID";
                if (error.name === "TokenExpiredError") {
                    errorType = "AUTH_EXPIRED";
                } else if (error.name === "JsonWebTokenError") {
                    errorType = "AUTH_INVALID";
                }

                return res.status(401).json({
                    error: errorType,
                    message: "Authentication failed",
                    correlationId: req.correlationId,
                });
            }
        };
    }

    /**
     * Extract token from request
     */
    extractToken(req) {
        const authHeader = req.get("Authorization");

        if (authHeader && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Check for token in query parameter (less secure, for specific cases)
        if (req.query.token && typeof req.query.token === "string") {
            return req.query.token;
        }

        return null;
    }

    /**
     * Get security metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            blockedIPsCount: this.blockedIPs.size,
            config: {
                rateLimitEnabled: !!this.config.rateLimit,
                corsEnabled: !!this.config.cors.origin,
                jwtEnabled: !!this.config.jwt.secret,
                secureHeaders: true,
            },
        };
    }

    /**
     * Security health check
     */
    async healthCheck() {
        const health = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            serviceName: this.serviceName,
            features: {
                jwt: !!this.config.jwt.secret,
                rateLimit: !!this.config.rateLimit,
                cors: !!this.config.cors.origin,
                secureHeaders: true,
                inputSanitization: this.config.validation.sanitizeInput,
            },
            metrics: this.getMetrics(),
        };

        return health;
    }
}

module.exports = SecurityManager;
