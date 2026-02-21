/**
 * TalentSphere Shared Libraries
 * Common utilities, patterns, and configurations for all services
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

class BaseService {
    constructor(options = {}) {
        this.options = {
            serviceName: options.serviceName || "unknown-service",
            version: options.version || "1.0.0",
            environment: process.env.NODE_ENV || "development",
            port: options.port || 3000,
            enableCors: options.enableCors !== false,
            enableSecurity: options.enableSecurity !== false,
            enableRateLimit: options.enableRateLimit !== false,
            ...options,
        };

        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Setup common middleware
     */
    setupMiddleware() {
        // Security headers
        if (this.options.enableSecurity) {
            this.app.use(
                helmet({
                    contentSecurityPolicy: {
                        directives: {
                            defaultSrc: ["'self'"],
                            styleSrc: ["'self'", "'unsafe-inline'"],
                            scriptSrc: ["'self'"],
                            imgSrc: ["'self'", "data:", "https:"],
                        },
                    },
                    hsts: {
                        maxAge: 31536000,
                        includeSubDomains: true,
                        preload: true,
                    },
                })
            );
        }

        // CORS configuration
        if (this.options.enableCors) {
            this.app.use(
                cors({
                    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
                    credentials: true,
                    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                    allowedHeaders: ["Content-Type", "Authorization"],
                })
            );
        }

        // Rate limiting
        if (this.options.enableRateLimit) {
            const limiter = rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // limit each IP to 100 requests per windowMs
                message: {
                    error: "Too many requests from this IP, please try again later.",
                },
                standardHeaders: true,
                legacyHeaders: false,
            });
            this.app.use("/api/", limiter);
        }

        // Body parsing
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true }));

        // Request ID for tracing
        this.app.use((req, res, next) => {
            req.requestId = req.headers["x-request-id"] || uuidv4();
            res.setHeader("X-Request-ID", req.requestId);
            next();
        });
    }

    /**
     * Setup standard routes
     */
    setupRoutes() {
        // Health check endpoints
        this.app.get("/health", this.healthCheck.bind(this));
        this.app.get("/ready", this.readinessCheck.bind(this));
        this.app.get("/metrics", this.metrics.bind(this));

        // 404 handler
        this.app.use("*", this.notFound.bind(this));

        // Error handler
        this.app.use(this.errorHandler.bind(this));
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req, res) {
        res.json({
            status: "healthy",
            service: this.options.serviceName,
            version: this.options.version,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: this.options.environment,
        });
    }

    /**
     * Readiness check endpoint
     */
    async readinessCheck(req, res) {
        // Override in child classes for service-specific checks
        res.json({
            status: "ready",
            service: this.options.serviceName,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Metrics endpoint
     */
    async metrics(req, res) {
        // Override in child classes for service-specific metrics
        res.json({
            service: this.options.serviceName,
            metrics: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * 404 handler
     */
    notFound(req, res) {
        res.status(404).json({
            error: "Not Found",
            message: `Route ${req.method} ${req.originalUrl} not found`,
            requestId: req.requestId,
        });
    }

    /**
     * Global error handler
     */
    errorHandler(err, req, res, next) {
        console.error(`[${req.requestId}] Error:`, err);

        // Don't send error details in production
        const isDevelopment = this.options.environment === "development";

        res.status(err.statusCode || 500).json({
            error: err.name || "Internal Server Error",
            message: isDevelopment ? err.message : "Something went wrong",
            requestId: req.requestId,
            ...(isDevelopment && { stack: err.stack }),
        });
    }

    /**
     * Start the service
     */
    async start() {
        const port = this.options.port;

        this.server = this.app.listen(port, () => {
            console.log(`🚀 ${this.options.serviceName} started on port ${port}`);
            console.log(`📍 Environment: ${this.options.environment}`);
            console.log(`🔗 Health check: http://localhost:${port}/health`);
        });

        // Graceful shutdown
        process.on("SIGTERM", () => this.gracefulShutdown());
        process.on("SIGINT", () => this.gracefulShutdown());
    }

    /**
     * Graceful shutdown
     */
    async gracefulShutdown() {
        console.log(`🛑 ${this.options.serviceName} shutting down gracefully...`);

        if (this.server) {
            this.server.close(() => {
                console.log(`✅ ${this.options.serviceName} stopped`);
                process.exit(0);
            });
        }
    }

    /**
     * Add service-specific routes
     */
    addRoute(method, path, handler) {
        this.app[method.toLowerCase()](path, this.wrapHandler(handler));
    }

    /**
     * Wrap handlers with error handling
     */
    wrapHandler(handler) {
        return async (req, res, next) => {
            try {
                await handler(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = BaseService;
