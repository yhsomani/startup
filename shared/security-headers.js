/**
 * TalentSphere CORS and Security Headers Configuration
 * Comprehensive security headers and CORS management
 */

const helmet = require("helmet");
const cors = require("cors");

class SecurityHeaders {
    constructor(environment = process.env.NODE_ENV || "development") {
        this.isDevelopment = environment === "development";
        this.isProduction = environment === "production";
        this.isTest = environment === "test";
    }

    /**
     * Get helmet configuration based on environment
     */
    getHelmetConfig() {
        const baseConfig = {
            // Content Security Policy
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "https://fonts.googleapis.com",
                        "https://cdnjs.cloudflare.com",
                    ],
                    scriptSrc: [
                        "'self'",
                        "'unsafe-eval'", // Required for some frameworks
                        "https://www.google-analytics.com",
                        "https://www.googletagmanager.com",
                    ],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "https:",
                        "https://*.gravatar.com",
                        "https://cdn.talentsphere.com",
                    ],
                    connectSrc: [
                        "'self'",
                        "https://api.talentsphere.com",
                        "https://api.openai.com",
                        "wss://ws.talentsphere.com",
                    ],
                    fontSrc: [
                        "'self'",
                        "https://fonts.gstatic.com",
                        "https://cdnjs.cloudflare.com",
                    ],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                    workerSrc: ["'self'"],
                    manifestSrc: ["'self'"],
                    upgradeInsecureRequests: this.isProduction ? [] : null,
                },
            },

            // HTTP Strict Transport Security
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true,
            },

            // Additional security headers
            crossOriginEmbedderPolicy: { policy: "require-corp" },
            crossOriginOpenerPolicy: { policy: "same-origin" },
            crossOriginResourcePolicy: { policy: "cross-origin" },
            dnsPrefetchControl: { allow: false },
            frameguard: { action: "deny" },
            hidePoweredBy: true,
            ieNoOpen: true,
            noSniff: true,
            originAgentCluster: true,
            permittedCrossDomainPolicies: false,
            referrerPolicy: { policy: "strict-origin-when-cross-origin" },
            xssFilter: true,
        };

        // Development-specific overrides
        if (this.isDevelopment) {
            baseConfig.contentSecurityPolicy.directives.scriptSrc.push("'unsafe-inline'");
            baseConfig.contentSecurityPolicy.directives.styleSrc.push("'unsafe-inline'");
            baseConfig.contentSecurityPolicy.directives.connectSrc.push("ws://localhost:*");
        }

        return baseConfig;
    }

    /**
     * Get CORS configuration
     */
    getCorsConfig() {
        const allowedOrigins = this.getAllowedOrigins();

        return {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, curl, etc.)
                if (!origin) {return callback(null, true);}

                if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
                    callback(null, true);
                } else {
                    callback(new Error("Origin not allowed by CORS"));
                }
            },

            credentials: true,

            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],

            allowedHeaders: [
                "Origin",
                "X-Requested-With",
                "Content-Type",
                "Accept",
                "Authorization",
                "X-Request-ID",
                "X-API-Key",
                "Cache-Control",
            ],

            exposedHeaders: [
                "X-Request-ID",
                "X-Total-Count",
                "X-Rate-Limit-Remaining",
                "X-Rate-Limit-Reset",
            ],

            maxAge: 86400, // 24 hours

            preflightContinue: false,
            optionsSuccessStatus: 204,
        };
    }

    /**
     * Get allowed origins based on environment
     */
    getAllowedOrigins() {
        if (this.isDevelopment) {
            return [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:3002",
                "http://localhost:3100",
                "http://localhost:3101",
                "http://localhost:3102",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3100",
                "http://0.0.0.0:3000",
            ];
        }

        if (this.isTest) {
            return ["http://localhost:3000"];
        }

        // Production origins
        const productionOrigins = [
            "https://talentsphere.com",
            "https://www.talentsphere.com",
            "https://app.talentsphere.com",
            "https://api.talentsphere.com",
        ];

        // Add environment-specific origins
        const envOrigins = process.env.CORS_ORIGIN?.split(",") || [];
        return [...productionOrigins, ...envOrigins];
    }

    /**
     * Create security middleware function
     */
    createSecurityMiddleware() {
        const helmetConfig = this.getHelmetConfig();
        const corsConfig = this.getCorsConfig();

        return [
            helmet(helmetConfig),
            cors(corsConfig),
            this.addSecurityHeaders,
            this.sanitizeMiddleware,
        ];
    }

    /**
     * Additional security headers middleware
     */
    addSecurityHeaders(req, res, next) {
        // Additional security headers
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        res.setHeader(
            "Permissions-Policy",
            "geolocation=(), " +
                "microphone=(), " +
                "camera=(), " +
                "magnetometer=(), " +
                "gyroscope=(), " +
                "speaker=(), " +
                "midi=(), " +
                "vibrate=(), " +
                "fullscreen=self, " +
                "payment=(), " +
                "usb=()"
        );

        // API-specific headers
        res.setHeader("X-API-Version", "1.0.0");
        res.setHeader("X-Environment", process.env.NODE_ENV || "development");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        // Server info hiding
        res.removeHeader("X-Powered-By");
        res.setHeader("Server", "TalentSphere");

        next();
    }

    /**
     * Basic input sanitization middleware
     */
    sanitizeMiddleware(req, res, next) {
        // Sanitize query parameters
        req.query = this.sanitizeObject(req.query);

        // Sanitize path parameters
        req.params = this.sanitizeObject(req.params);

        next();
    }

    /**
     * Simple object sanitization
     */
    sanitizeObject(obj) {
        if (!obj || typeof obj !== "object") {
            return obj;
        }

        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === "string") {
                // Basic XSS prevention
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                    .replace(/on\w+\s*=/gi, "")
                    .trim();
            } else if (Array.isArray(value)) {
                sanitized[key] = value.map(item => this.sanitizeValue(item));
            } else if (typeof value === "object" && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    sanitizeValue(value) {
        if (typeof value === "string") {
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                .replace(/on\w+\s*=/gi, "")
                .trim();
        }
        return value;
    }
}

module.exports = SecurityHeaders;
