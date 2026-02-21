/**
 * TalentSphere Comprehensive Security Middleware
 * Integrates all security features: encryption, authentication, authorization, 
 * input validation, rate limiting, and security headers
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');

// Import additional security modules
const SecurityEnhancer = require('./security-enhancer');
const InputValidator = require('./input-validator');
const AuthorizationService = require('./authorization-service');
const { encryptionMiddleware } = require('./encryption-middleware');
const { securityAuditor } = require('./security-auditor');

const securityEnhancer = new SecurityEnhancer();
const inputValidator = new InputValidator();
const authorizationService = new AuthorizationService();

module.exports = {
    // Helmet security headers configuration
    helmetConfig: helmet({
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
        crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? 'require-corp' : false,
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'same-origin',
        hsts: process.env.NODE_ENV === 'production' ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        } : false,
        noSniff: true,
        xssFilter: true,
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        permittedCrossDomainPolicies: 'none',
        hidePoweredBy: true,
        ieNoOpen: true,
        dnsPrefetchControl: { allow: false },
        hpkp: false  // Deprecated, not recommended
    }),

    // CORS Configuration
    corsConfig: cors({
        origin: process.env.CORS_ORIGIN ||
            (process.env.NODE_ENV === 'production' ? false : [
                'http://localhost:3000', 'http://localhost:3100',
                'http://127.0.0.1:3000', 'http://127.0.0.1:3100'
            ]),
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
    }),

    // Rate limiting configuration
    rateLimit: rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),

    // Additional rate limiters for sensitive endpoints
    sensitiveEndpointRateLimits: {
        loginLimiter: rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 requests per windowMs
            message: {
                error: 'Too many login attempts from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        }),
        registerLimiter: rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // limit each IP to 3 registration attempts per hour
            message: {
                error: 'Too many registration attempts from this IP, please try again later.',
                retryAfter: '1 hour'
            },
            standardHeaders: true,
            legacyHeaders: false
        })
    },

    // Data sanitization middleware
    mongoSanitize: mongoSanitize(),

    // XSS protection middleware
    xss: xss(),

    // Parameter pollution protection
    hpp: hpp(),

    // Compression middleware
    compression: compression({ level: 6 }),

    // Security enhancer middleware
    securityEnhancer: securityEnhancer.middleware,

    // Input validation middleware
    inputValidator: inputValidator.validate,

    // Authorization middleware
    authorization: authorizationService.middleware,

    // Encryption middleware
    encryption: {
        requestEncryption: encryptionMiddleware.encryptRequestBody(),
        responseEncryption: encryptionMiddleware.encryptResponseBody(),
        communicationSecurity: encryptionMiddleware.communicationSecurity(),
        fullStack: encryptionMiddleware.fullEncryptionStack()
    },

    // Security audit middleware
    securityAudit: securityAuditor.middleware(),

    // Full security middleware stack
    fullSecurityStack: [
        compression({ level: 6 }), // Apply compression first
        securityAuditor.middleware(), // Log incoming requests
        helmet({
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
            crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? 'require-corp' : false,
            crossOriginOpenerPolicy: 'same-origin',
            crossOriginResourcePolicy: 'same-origin',
            hsts: process.env.NODE_ENV === 'production' ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            } : false,
            noSniff: true,
            xssFilter: true,
            frameguard: { action: 'deny' },
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            permittedCrossDomainPolicies: 'none',
            hidePoweredBy: true,
            ieNoOpen: true,
            dnsPrefetchControl: { allow: false },
            hpkp: false  // Deprecated, not recommended
        }),
        cors({
            origin: process.env.CORS_ORIGIN ||
                (process.env.NODE_ENV === 'production' ? false : [
                    'http://localhost:3000', 'http://localhost:3100',
                    'http://127.0.0.1:3000', 'http://127.0.0.1:3100'
                ]),
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
        }),
        rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        }),
        mongoSanitize(),
        xss(),
        hpp(),
        encryptionMiddleware.communicationSecurity(), // Enforce HTTPS and security headers
        encryptionMiddleware.decryptRequestBody(), // Decrypt incoming data
        inputValidator.validate, // Validate input
        authorizationService.middleware // Check authorization
    ],

    // Get security status
    getSecurityStatus: () => {
        return {
            enabledFeatures: [
                'Helmet security headers',
                'CORS protection',
                'Rate limiting',
                'MongoDB sanitization',
                'XSS protection',
                'HTTP parameter pollution protection',
                'Request/response compression',
                'Input validation',
                'Authorization checks',
                'Data encryption',
                'Security auditing'
            ],
            environment: process.env.NODE_ENV,
            encryptionStatus: encryptionMiddleware.getEncryptionStatus(),
            auditStatus: securityAuditor.getSecurityStats()
        };
    }
};