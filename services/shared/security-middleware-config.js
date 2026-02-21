/**
 * TalentSphere Security Middleware Configuration
 *
 * This module provides security middleware for all TalentSphere services
 * including CORS, rate limiting, security headers, and authentication
 */

const SecurityMiddleware = require("./shared/security-middleware");

// Default security configuration for all services
const securityConfig = {
    // Rate limiting
    rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // requests per window
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },

    // Input validation
    validation: {
        enabled: true,
        sanitize: true,
        maxJsonSize: 1024 * 1024, // 1MB
        maxUrlLength: 2048,
        allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedContentTypes: [
            "application/json",
            "application/x-www-form-urlencoded",
            "multipart/form-data",
        ],
    },

    // Request size limits
    requestSize: {
        enabled: true,
        maxUrlLength: 2048,
        maxHeaderSize: 8192, // 8KB
        maxBodySize: 10 * 1024 * 1024, // 10MB
    },

    // IP filtering
    ipFiltering: {
        enabled: false, // Disabled by default
        whitelist: [],
        blacklist: [],
    },

    // API Keys
    apiKeys: {
        enabled: false, // Disabled by default
        headerName: "X-API-Key",
        queryParam: "api_key",
        validKeys: [],
    },

    // Security headers
    securityHeaders: {
        enabled: true,
        csp: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
            },
        },
        hsts: "max-age=31536000; includeSubDomains",
        frameOptions: "DENY",
        contentTypeOptions: "nosniff",
        referrerPolicy: "strict-origin-when-cross-origin",
    },

    // CORS settings
    cors: {
        enabled: true,
    },
};

module.exports = {
    securityConfig,
    SecurityMiddleware,
};
