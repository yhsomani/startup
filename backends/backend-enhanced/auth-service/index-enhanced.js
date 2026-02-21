/**
 * Enhanced Authentication Service
 * Updated with comprehensive validation and error handling
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const { getServicePort, getServiceUrl } = require("../../shared/ports");
const { getServiceConfig } = require("../../shared/environment");
const { createLogger } = require("../../shared/logger");
const { validateRequest, validateResponse } = require("../../shared/validation");
const { contracts } = require("../../shared/contracts");
const { EnhancedServiceWithTracing } = require("../shared/enhanced-service-with-tracing");
const { getSecret, getRateLimitConfig } = require("../../shared/security");
const {
    applySecurityMiddleware,
    getSensitiveRateLimitMiddleware,
} = require("../../shared/security-middleware");
const { getDatabaseManager } = require("../../shared/database-connection");
const {
    AppError,
    AuthenticationError,
    ValidationError,
    ErrorFactory,
} = require("../../shared/error-handler");

class AuthService extends EnhancedServiceWithTracing {
    constructor() {
        super({
            serviceName: "auth-service",
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development",
            port: getServicePort("USER_AUTH_SERVICE"),
            tracing: {
                enabled: true,
                samplingRate: 1.0,
            },
            validation: {
                strict: true,
                autoValidate: true,
            },
            circuitBreaker: {
                timeout: 5000,
                maxFailures: 3,
                resetTimeout: 30000,
            },
            errorRecovery: {
                maxRetries: 3,
                baseDelay: 1000,
            },
        });

        // Get JWT secret from secure storage
        this.jwtSecret =
            getSecret("JWT_SECRET") ||
            process.env.JWT_SECRET ||
            "fallback-secret-change-in-production";

        // Initialize database connection
        this.database = getDatabaseManager();

        // Initialize services
        this.logger = createLogger("AuthService");
        this.refreshTokenService = new RefreshTokenService();

        // Auth-specific state
        this.sessions = new Map(); // Keep sessions in memory for now

        // Initialize service contracts
        this.initializeContracts();

        // Create Express app with tracing middleware
        this.app = express();
        this.server = null;
        this.initializeMiddleware();
        this.initializeRoutes();

        // Seed demo data
        this.seedDemoData().catch(console.error);
    }

    initializeContracts() {
        // Define service contracts for validation
        this.serviceContract = {
            serviceName: "auth-service",
            operations: {},
            defineOperation: (name, schema) => {
                this.serviceContract.operations[name] = schema;
            },
            getOperationSchema: name => {
                return this.serviceContract.operations[name];
            },
        };

        // Register operation schemas
        this.serviceContract.defineOperation("register", {
            inputSchema: Joi.object({
                email: Joi.string().email().min(5).max(255).required(),
                password: Joi.string().min(8).max(128).required(),
                name: Joi.string().min(2).max(100).required(),
            }),
            outputSchema: {
                type: "object",
                properties: {
                    success: { type: "boolean" },
                    data: {
                        type: "object",
                        properties: {
                            user: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    email: { type: "string" },
                                    name: { type: "string" },
                                    createdAt: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        });

        this.serviceContract.defineOperation("login", {
            inputSchema: Joi.object({
                email: Joi.string().email().min(5).max(255).required(),
                password: Joi.string().min(1).max(128).required(),
            }),
            outputSchema: {
                type: "object",
                properties: {
                    success: { type: "boolean" },
                    data: {
                        type: "object",
                        properties: {
                            token: { type: "string" },
                            sessionId: { type: "string" },
                            user: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    email: { type: "string" },
                                    name: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    initializeMiddleware() {
        // Apply comprehensive security middleware
        applySecurityMiddleware(this.app, {
            enableServiceAuth: false, // Auth service doesn't need service auth
        });

        // Body parsing (after security middleware)
        this.app.use(
            express.json({
                limit: "10mb",
                verify: (req, res, buf) => {
                    try {
                        JSON.parse(buf);
                    } catch (e) {
                        res.status(400).json({
                            success: false,
                            error: {
                                code: "INVALID_JSON",
                                message: "Invalid JSON in request body",
                            },
                        });
                        return;
                    }
                },
            })
        );
        this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

        // Distributed tracing middleware
        this.app.use(this.getTracingMiddleware());

        // Request context middleware
        this.app.use((req, res, next) => {
            req.correlationId = req.headers["x-correlation-id"] || req.traceId || uuidv4();
            res.setHeader("x-correlation-id", req.correlationId);
            res.setHeader("x-service", this.config.serviceName);
            next();
        });
    }

    initializeRoutes() {
        // Health check
        this.app.get("/health", async (req, res) => {
            const span = this.tracer
                ? this.tracer.startSpan("auth.health", req.traceContext)
                : null;

            if (span) {
                span.setTag("component", "auth-service");
                span.setTag("health.check.type", "service");
            }

            try {
                const health = await this.getServiceHealth();

                if (span) {
                    span.setTag("health.status", "healthy");
                    span.finish();
                }

                res.json(health);
            } catch (error) {
                if (span) {
                    span.logError(error);
                    span.finish();
                }

                res.status(503).json({
                    status: "unhealthy",
                    error: error.message,
                });
            }
        });

        // Metrics endpoint
        this.app.get("/metrics", async (req, res) => {
            const span = this.tracer
                ? this.tracer.startSpan("auth.metrics", req.traceContext)
                : null;

            try {
                const metrics = this.getTracingMetrics();

                if (span) {
                    span.finish();
                }

                res.json(metrics);
            } catch (error) {
                if (span) {
                    span.logError(error);
                    span.finish();
                }

                res.status(500).json({ error: error.message });
            }
        });

        // Register endpoint
        this.app.post(
            "/register",
            getSensitiveRateLimitMiddleware("/api/v1/auth/register"),
            async (req, res, next) => {
                try {
                    const registerSchema = this.serviceContract.getOperationSchema("register");
                    if (!registerSchema?.inputSchema) {
                        return next(new Error("Missing registration schema"));
                    }

                    // Defensive check: ensure inputSchema is a Joi schema
                    if (typeof registerSchema.inputSchema.validate !== "function") {
                        this.logger.warn(
                            "Register inputSchema is not a Joi schema - skipping validation"
                        );
                        req.validated = req.body;
                    } else {
                        const { error, value } = registerSchema.inputSchema.validate(req.body);
                        if (error) {
                            throw new ValidationError("Registration validation failed", {
                                validationErrors: error.details.map(detail => ({
                                    field: detail.path.join("."),
                                    message: detail.message,
                                    value: detail.context?.value,
                                })),
                            });
                        }
                        req.validated = value;
                    }

                    await this.handleRequestWithTracing(req, res, "auth.register", {
                        inputSchema: registerSchema?.inputSchema,
                        outputSchema: registerSchema?.outputSchema,
                        validateInput: true,
                        validateOutput: true,
                    });
                } catch (error) {
                    next(error);
                }
            }
        );

        // Login endpoint
        this.app.post(
            "/login",
            getSensitiveRateLimitMiddleware("/api/v1/auth/login"),
            async (req, res, next) => {
                try {
                    const loginSchema = this.serviceContract.getOperationSchema("login");
                    if (!loginSchema?.inputSchema) {
                        return next(new Error("Missing login schema"));
                    }

                    let reqvalidated;
                    // Defensive check: ensure inputSchema is a Joi schema
                    if (typeof loginSchema.inputSchema.validate !== "function") {
                        this.logger.warn(
                            "Login inputSchema is not a Joi schema - skipping validation"
                        );
                        reqvalidated = req.body;
                    } else {
                        const { error, value } = loginSchema.inputSchema.validate(req.body);
                        if (error) {
                            throw new ValidationError("Login validation failed", {
                                validationErrors: error.details.map(detail => ({
                                    field: detail.path.join("."),
                                    message: detail.message,
                                    value: detail.context?.value,
                                })),
                            });
                        }
                        reqvalidated = value;
                    }

                    req.validated = reqvalidated;
                    await this.handleRequestWithTracing(req, res, "auth.login", {
                        inputSchema: loginSchema?.inputSchema,
                        outputSchema: loginSchema?.outputSchema,
                        validateInput: true,
                        validateOutput: true,
                    });
                } catch (error) {
                    next(error);
                }
            }
        );

        // Logout endpoint
        this.app.post("/logout", async (req, res, next) => {
            await this.handleRequestWithTracing(req, res, "auth.logout", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Verify token endpoint
        this.app.get("/verify", async (req, res, next) => {
            await this.handleRequestWithTracing(req, res, "auth.verify", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Profile endpoint
        this.app.get("/profile", async (req, res, next) => {
            await this.handleRequestWithTracing(req, res, "auth.profile", {
                validateInput: false,
                validateOutput: false,
            });
        });

        // Refresh token endpoint
        this.app.post(
            "/refresh-token",
            this.refreshTokenService.createRefreshTokenMiddleware(),
            async (req, res, next) => {
                await this.handleRequestWithTracing(req, res, "auth.refreshToken", {
                    validateInput: false,
                    validateOutput: false,
                });
            }
        );

        // Error handling middleware
        this.app.use((error, req, res, next) => {
            // Convert to AppError if needed
            const appError = ErrorFactory.fromUnknownError(error, {
                requestId: req.requestId,
                correlationId: req.correlationId,
                serviceName: this.config.serviceName,
                url: req.url,
                method: req.method,
            });

            // Log error
            this.logger.error("Unhandled error", {
                error: appError.message,
                stack: appError.stack,
                requestId: req.requestId,
                correlationId: req.correlationId,
                service: this.config.serviceName,
            });

            // Send error response
            res.status(appError.statusCode).json({
                success: false,
                error: {
                    code: appError.code,
                    message: appError.message,
                    ...(process.env.NODE_ENV === "development" && { details: appError.details }),
                },
                meta: {
                    requestId: req.requestId,
                    correlationId: req.correlationId,
                    timestamp: new Date().toISOString(),
                    service: this.config.serviceName,
                },
            });
        });
    }

    // Operation implementations
    async executeOperation(request, options) {
        const operationName = options.operationName || "unknown";

        switch (operationName) {
            case "auth.register":
                return this.registerUser(request.validated);
            case "auth.login":
                return this.loginUser(request.validated);
            case "auth.logout":
                return this.logoutUser(request.headers);
            case "auth.verify":
                return this.verifyToken(request.headers);
            case "auth.profile":
                return this.getUserProfile(request.headers);
            default:
                throw new Error(`Unknown operation: ${operationName}`);
        }
    }

    async registerUser(userData) {
        return this.executeWithTracing("auth.register.process", async () => {
            // Ensure database is initialized
            await this.database.initialize();

            // Check if user already exists
            const existingUser = await this.database.query(
                "SELECT id FROM users WHERE email = $1",
                [userData.email]
            );

            if (existingUser.rows.length > 0) {
                throw new ValidationError("User with this email already exists", {
                    field: "email",
                    value: userData.email,
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);

            // Create user in database
            const user = await this.database.insert("users", {
                email: userData.email,
                password_hash: hashedPassword,
                name: userData.name,
                role: "user",
                email_verified: false,
            });

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.created_at,
                    emailVerified: user.email_verified,
                },
            };
        });
    }

    async loginUser(credentials) {
        return this.executeWithTracing("auth.login.process", async () => {
            // Ensure database is initialized
            await this.database.initialize();

            // Find user in database
            const result = await this.database.query(
                "SELECT id, email, password_hash, name FROM users WHERE email = $1 AND is_active = TRUE",
                [credentials.email]
            );

            if (result.rows.length === 0) {
                throw new AuthenticationError("Invalid credentials");
            }

            const user = result.rows[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
            if (!isValidPassword) {
                throw new AuthenticationError("Invalid credentials");
            }

            // Update last login
            await this.database.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
                user.id,
            ]);

            // Generate JWT token pair
            const tokens = await this.refreshTokenService.generateTokenPair(user.id, {
                includeRefreshToken: true,
            });

            // Create session (in memory for now)
            const sessionId = uuidv4();
            this.sessions.set(sessionId, {
                userId: user.id,
                email: user.email,
                createdAt: new Date().toISOString(),
                lastAccess: new Date().toISOString(),
            });

            return {
                token: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                sessionId,
                expiresIn: tokens.expiresIn,
                tokenType: tokens.tokenType,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            };
        });
    }

    async logoutUser(headers) {
        return this.executeWithTracing("auth.logout.process", async () => {
            const token = this.extractToken(headers);
            const sessionId = headers["x-session-id"];

            if (sessionId) {
                this.sessions.delete(sessionId);
            }

            return { success: true, message: "Logged out successfully" };
        });
    }

    async verifyToken(headers) {
        return this.executeWithTracing("auth.verify.process", async () => {
            const token = this.extractToken(headers);

            try {
                const decoded = jwt.verify(token, this.jwtSecret);
                return {
                    valid: true,
                    user: {
                        id: decoded.userId,
                        email: decoded.email,
                        name: decoded.name,
                    },
                };
            } catch (error) {
                throw new AuthenticationError("Invalid token");
            }
        });
    }

    async getUserProfile(headers) {
        return this.executeWithTracing("auth.profile.process", async () => {
            const token = this.extractToken(headers);

            try {
                const decoded = jwt.verify(token, this.jwtSecret);

                // Ensure database is initialized
                await this.database.initialize();

                // Get user from database
                const result = await this.database.query(
                    "SELECT id, email, name, created_at, role, email_verified FROM users WHERE id = $1 AND is_active = TRUE",
                    [decoded.userId]
                );

                if (result.rows.length === 0) {
                    throw new AuthenticationError("User not found");
                }

                const user = result.rows[0];

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.created_at,
                    role: user.role,
                    emailVerified: user.email_verified,
                };
            } catch (error) {
                throw new AuthenticationError("Invalid token or user not found");
            }
        });
    }

    extractToken(headers) {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AuthenticationError("No token provided");
        }
        return authHeader.substring(7);
    }

    async seedDemoData() {
        try {
            // Ensure database is initialized
            await this.database.initialize();

            // Check if demo user already exists
            const existingUser = await this.database.query(
                "SELECT id FROM users WHERE email = $1",
                ["demo@example.com"]
            );

            if (existingUser.rows.length === 0) {
                // Create demo user for testing
                const hashedPassword = await bcrypt.hash("password123", 12);

                await this.database.insert("users", {
                    email: "demo@example.com",
                    password_hash: hashedPassword,
                    name: "Demo User",
                    role: "user",
                    email_verified: true,
                });

                this.logger.info("🔐 Demo user created: demo@example.com / password123");
            } else {
                this.logger.info("🔐 Demo user already exists: demo@example.com / password123");
            }
        } catch (error) {
            this.logger.error("Failed to seed demo data:", error);
        }
    }

    async start() {
        const startupSpan = this.tracer ? this.tracer.startSpan("auth-service.startup") : null;

        try {
            this.server = this.app.listen(this.config.port, () => {
                this.logger.info(`🔐 Auth Service running on port ${this.config.port}`);
                this.logger.info(`📍 Environment: ${this.config.environment}`);
                this.logger.info(
                    `🔍 Tracing: ${this.config.tracing.enabled ? "enabled" : "disabled"}`
                );
            });

            if (startupSpan) {
                startupSpan.setTag("port", this.config.port);
                startupSpan.logEvent("Auth service started successfully");
                startupSpan.finish();
            }
        } catch (error) {
            if (startupSpan) {
                startupSpan.logError(error);
                startupSpan.finish();
            }
            throw error;
        }
    }

    async stop() {
        const shutdownSpan = this.tracer ? this.tracer.startSpan("auth-service.shutdown") : null;

        try {
            if (this.server) {
                await new Promise(resolve => {
                    this.server.close(resolve);
                });
                this.logger.info("🛑 Auth Service stopped");
            }

            if (shutdownSpan) {
                shutdownSpan.finish();
            }
        } catch (error) {
            if (shutdownSpan) {
                shutdownSpan.logError(error);
                shutdownSpan.finish();
            }
            throw error;
        }
    }
}

// Create and export service instance
module.exports = {
    AuthService,
};

// Auto-start if this is main module
if (require.main === module) {
    const authService = new AuthService();

    authService.start().catch(console.error);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
        authService.logger.info("🛑 SIGTERM received, shutting down gracefully...");
        await authService.stop();
        process.exit(0);
    });

    process.on("SIGINT", async () => {
        authService.logger.info("🛑 SIGINT received, shutting down gracefully...");
        await authService.stop();
        process.exit(0);
    });
}
