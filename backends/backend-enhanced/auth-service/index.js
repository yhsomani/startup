/**
 * Auth Service with Distributed Tracing Integration
 * Enhanced authentication service with comprehensive tracing
 */

const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { getServicePort, getServiceUrl } = require("../../../shared/ports");
const { getServiceConfig } = require("../../../shared/environment");
const { createLogger } = require("../../../shared/logger");
const { validateRequest, validateResponse } = require("../../../shared/validation");
const {
    AppError,
    ValidationError,
    ErrorFactory,
    AuthenticationError,
    ConflictError,
} = require("../../../shared/error-factory");
const { contracts } = require("../../../shared/contracts");
const { EnhancedServiceWithTracing } = require("../shared/enhanced-service-with-tracing");
const { getSecret, getRateLimitConfig } = require("../../../shared/security");
const {
    applySecurityMiddleware,
    getSensitiveRateLimitMiddleware,
    securityMiddleware,
    errorHandlingMiddleware,
    notFoundMiddleware,
} = require("../../../shared/security-middleware");
const { getDatabaseManager } = require("../../../shared/database-connection");

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

        // Initialize logger
        this.logger = createLogger("AuthService");

        // Get JWT secret from secure storage
        this.jwtSecret =
            getSecret("JWT_SECRET") ||
            process.env.JWT_SECRET ||
            "fallback-secret-change-in-production";

        // Initialize database connection
        this.database = getDatabaseManager();

        // Auth-specific state
        this.sessions = new Map(); // Keep sessions in memory for now

        // Initialize service contracts
        this.initializeContracts();

        // Create Express app with tracing middleware
        this.app = express();
        this.server = null;
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();

        // Seed demo data (async)
        this.seedDemoData().catch(console.error);
    }

    initializeMiddleware() {
        // Apply security middleware (headers, CORS, rate limit, etc.)
        const securityOptions = {
            enableServiceAuth: false, // Auth service doesn't need service auth
        };

        securityMiddleware(securityOptions).forEach(middleware => {
            this.app.use(middleware);
        });

        // Body parsing (after security middleware)
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true }));

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

    initializeErrorHandling() {
        // Error handling middleware
        this.app.use(errorHandlingMiddleware());
        this.app.use(notFoundMiddleware());
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

        // Register endpoint (with stricter rate limiting)
        this.app.post(
            "/register",
            getSensitiveRateLimitMiddleware("/api/v1/auth/register"),
            (req, res) =>
                this.handleRequestWithTracing(req, res, "auth.register", {
                    inputSchema: this.serviceContract?.getOperationSchema("register")?.inputSchema,
                    outputSchema:
                        this.serviceContract?.getOperationSchema("register")?.outputSchema,
                    validateInput: true,
                    validateOutput: true,
                })
        );

        // Login endpoint (with stricter rate limiting)
        this.app.post("/login", getSensitiveRateLimitMiddleware("/api/v1/auth/login"), (req, res) =>
            this.handleRequestWithTracing(req, res, "auth.login", {
                inputSchema: this.serviceContract?.getOperationSchema("login")?.inputSchema,
                outputSchema: this.serviceContract?.getOperationSchema("login")?.outputSchema,
                validateInput: true,
                validateOutput: true,
            })
        );

        // Logout endpoint
        this.app.post("/logout", (req, res) =>
            this.handleRequestWithTracing(req, res, "auth.logout", {
                validateInput: false,
                validateOutput: false,
            })
        );

        // Verify token endpoint
        this.app.get("/verify", (req, res) =>
            this.handleRequestWithTracing(req, res, "auth.verify", {
                validateInput: false,
                validateOutput: false,
            })
        );

        // Profile endpoint
        this.app.get("/profile", (req, res) =>
            this.handleRequestWithTracing(req, res, "auth.profile", {
                validateInput: false,
                validateOutput: false,
            })
        );

        // Error handling middleware
        this.app.use((error, req, res, next) => {
            const span = this.tracer
                ? this.tracer
                      .getActiveSpans()
                      .find(s => s.getContext().spanId === req.traceContext?.spanId)
                : null;

            if (span) {
                span.logError(error);
                span.finish();
            }

            this.logger.error("Unhandled error", {
                error: error.message,
                stack: error.stack,
                requestId: req.requestId,
                correlationId: req.correlationId,
                service: this.config.serviceName,
            });

            res.status(error.statusCode || 500).json({
                success: false,
                error: {
                    code: error.code || "INTERNAL_ERROR",
                    message: error.message || "An internal error occurred",
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
                return this.registerUser(request.body);
            case "auth.login":
                return this.loginUser(request.body);
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
                throw new ConflictError("User already exists");
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user in database
            const user = await this.database.insert("users", {
                email: userData.email,
                password_hash: hashedPassword,
                name: userData.name,
                role: "user",
            });

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.created_at,
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

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                },
                this.jwtSecret,
                { expiresIn: "24h" }
            );

            // Create session (still in memory for now, could move to database)
            const sessionId = uuidv4();
            this.sessions.set(sessionId, {
                userId: user.id,
                email: user.email,
                createdAt: new Date().toISOString(),
                lastAccess: new Date().toISOString(),
            });

            return {
                success: true,
                token,
                sessionId,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            };
        });
    }

    initializeContracts() {
        try {
            // Define service contracts for validation
            this.serviceContract = {
                serviceName: "auth-service",
                operations: {},
                defineOperation: (name, schema) => {
                    this.serviceContract.operations[name] = schema;
                },
                getOperationSchema: name => {
                    const op = this.serviceContract.operations[name];
                    return op;
                },
            };

            // Register operation schemas
            // Register operation schemas
            this.serviceContract.defineOperation("register", {
                inputSchema: Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().min(8).required(),
                    name: Joi.string().min(2).max(100).required(),
                }),
                outputSchema: Joi.object({
                    success: Joi.boolean().required(),
                    user: Joi.object().required(),
                }).unknown(true),
            });

            this.serviceContract.defineOperation("login", {
                inputSchema: Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().required(),
                }),
                outputSchema: Joi.object({
                    success: Joi.boolean().required(),
                    token: Joi.string().required(),
                    sessionId: Joi.string().required(),
                    user: Joi.object().required(),
                }).unknown(true),
            });
        } catch (error) {
            console.error("CRASH in initializeContracts:", error);
            throw error;
        }
    }

    async getServiceHealth() {
        return {
            status: "healthy",
            service: this.config.serviceName,
            version: this.config.version,
            environment: this.config.environment,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: this.database ? "connected" : "disconnected",
            sessions: this.sessions.size,
        };
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
                throw new Error("Invalid token");
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
                    throw new Error("User not found");
                }

                const user = result.rows[0];

                return {
                    success: true,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        createdAt: user.created_at,
                        role: user.role,
                        emailVerified: user.email_verified,
                    },
                };
            } catch (error) {
                throw new Error("Invalid token or user not found");
            }
        });
    }

    extractToken(headers) {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("No token provided");
        }
        return authHeader.substring(7);
    }

    async initialize() {
        await this.initializeContracts();
        await this.database.initialize();
    }

    async seedDemoData() {
        try {
            // Ensure database is initialized
            await this.database.initialize();

            // Only create demo user in development/test environments
            if (process.env.NODE_ENV === "production") {
                this.logger.info("Skipping demo user creation in production");
            } else {
                // Check if demo user already exists
                const existingUser = await this.database.query(
                    "SELECT id FROM users WHERE email = $1",
                    ["demo@example.com"]
                );

                if (existingUser.rows.length === 0) {
                    // Create demo user for testing
                    const hashedPassword =
                        "$2a$10$N9qo8uLOickgx2ZMRZoMye3UoQzMECWZjI5pRqFzgP4QZ8QZ8QZ8"; // 'password123'

                    const demoUser = await this.database.insert("users", {
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

// Auto-start if this is the main module
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
