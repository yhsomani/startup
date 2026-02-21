/**
 * Standardized Service Template for TalentSphere Platform
 *
 * Unified Node.js/Express service template with:
 * - Consistent error handling
 * - Security integration
 * - Database connectivity
 * - Health checks
 * - Structured logging
 * - Service discovery
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

// Import shared services
const SecurityManager = require("../../shared/enhanced-security-manager");
const AuthMiddleware = require("../../shared/auth-middleware");
const { createErrorHandler, asyncHandler } = require("../../shared/error-handler");
const { getSecureDatabaseManager } = require("../../shared/secure-database-connection");
const { createLogger } = require("../../shared/enhanced-logger");
const { ServiceRegistry } = require("../../shared/service-registry");

class BaseService {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.logger = createLogger(serviceName);
        this.options = options;

        // Initialize app
        this.app = express();

        // Initialize security manager
        this.securityManager = new SecurityManager(serviceName, {
            cors: {
                origin: options.corsOrigins || this.getAllowedOrigins(),
                credentials: true,
            },
            rateLimit: options.rateLimit,
        });

        // Initialize auth middleware
        this.authMiddleware = new AuthMiddleware(this.securityManager);

        // Initialize database
        this.db = getSecureDatabaseManager({
            max: options.dbMaxConnections || 20,
            logQueries: options.logQueries !== false,
        });

        // Initialize service registry
        this.serviceRegistry = new ServiceRegistry(serviceName, {
            port: options.port,
            version: options.version || "1.0.0",
            healthCheckPath: "/health",
            metricsPath: "/metrics",
        });

        // Metrics tracking
        this.metrics = {
            requests: 0,
            errors: 0,
            startTime: Date.now(),
            lastHealthCheck: null,
        };

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Get allowed origins based on environment
     */
    getAllowedOrigins() {
        const env = process.env.NODE_ENV || "development";

        switch (env) {
            case "production":
                return ["https://talentsphere.com", "https://www.talentsphere.com"];
            case "staging":
                return [
                    "https://staging.talentsphere.com",
                    "http://localhost:3000",
                    "http://localhost:3001",
                ];
            default:
                return [
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:3001",
                ];
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Apply all security middleware
        this.app.use(this.securityManager.getSecurityMiddleware());

        // Request correlation ID
        this.app.use((req, res, next) => {
            req.requestId = req.get("X-Request-ID") || uuidv4();
            res.setHeader("X-Request-ID", req.requestId);

            // Update metrics
            this.metrics.requests++;

            // Log request
            this.logger.info("Incoming request", {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get("User-Agent"),
            });

            // Track response time
            const startTime = Date.now();
            res.on("finish", () => {
                const duration = Date.now() - startTime;
                this.logger.info("Request completed", {
                    requestId: req.requestId,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                });
            });

            next();
        });

        // Service info middleware
        this.app.use((req, res, next) => {
            req.serviceInfo = {
                name: this.serviceName,
                version: this.options.version || "1.0.0",
                startTime: this.metrics.startTime,
            };
            next();
        });
    }

    /**
     * Setup standard routes
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get(
            "/health",
            asyncHandler(async (req, res) => {
                const health = await this.performHealthCheck();
                this.metrics.lastHealthCheck = Date.now();

                res.status(health.status === "healthy" ? 200 : 503).json({
                    service: this.serviceName,
                    timestamp: new Date().toISOString(),
                    uptime: Date.now() - this.metrics.startTime,
                    requestId: req.requestId,
                    ...health,
                });
            })
        );

        // Metrics endpoint
        this.app.get(
            "/metrics",
            asyncHandler(async (req, res) => {
                const metrics = await this.getMetrics();
                res.json({
                    service: this.serviceName,
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId,
                    metrics,
                });
            })
        );

        // Service info endpoint
        this.app.get(
            "/info",
            asyncHandler(async (req, res) => {
                res.json({
                    service: this.serviceName,
                    version: this.options.version || "1.0.0",
                    description: this.options.description || `${this.serviceName} microservice`,
                    timestamp: new Date().toISOString(),
                    uptime: Date.now() - this.metrics.startTime,
                    requestId: req.requestId,
                    endpoints: this.getServiceEndpoints(),
                });
            })
        );

        // Register service routes
        this.registerServiceRoutes();
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Use centralized error handler
        this.app.use(createErrorHandler(this.serviceName));

        // 404 handler
        this.app.use("*", (req, res) => {
            res.status(404).json({
                error: "NOT_FOUND",
                message: `Endpoint ${req.method} ${req.path} not found`,
                service: this.serviceName,
                requestId: req.requestId,
                availableEndpoints: this.getServiceEndpoints(),
            });
        });
    }

    /**
     * Register service-specific routes (to be overridden by subclasses)
     */
    registerServiceRoutes() {
        // Default routes for base service
        this.app.get(
            "/",
            asyncHandler(async (req, res) => {
                res.json({
                    service: this.serviceName,
                    status: "running",
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId,
                });
            })
        );
    }

    /**
     * Get service endpoints for discovery
     */
    getServiceEndpoints() {
        const routes = [];

        this.app._router.stack.forEach(middleware => {
            if (middleware.route) {
                const path = middleware.route.path;
                const methods = Object.keys(middleware.route.methods)
                    .filter(method => middleware.route.methods[method])
                    .map(method => method.toUpperCase());

                routes.push({
                    path,
                    methods,
                    middleware: middleware.route.stack?.map(layer => layer.name).filter(Boolean),
                });
            }
        });

        return routes;
    }

    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        const checks = {
            status: "healthy",
            checks: {},
            timestamp: new Date().toISOString(),
        };

        try {
            // Database health check
            if (this.db) {
                checks.checks.database = await this.db.performHealthCheck();
            }

            // Security manager health check
            if (this.securityManager) {
                checks.checks.security = await this.securityManager.healthCheck();
            }

            // Service registry health check
            if (this.serviceRegistry) {
                checks.checks.serviceRegistry = await this.serviceRegistry.healthCheck();
            }

            // Memory usage check
            const memUsage = process.memoryUsage();
            checks.checks.memory = {
                status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? "healthy" : "warning",
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
            };

            // CPU usage check (simplified)
            checks.checks.cpu = {
                status: "healthy",
                usage: process.cpuUsage(),
            };

            // Overall status based on individual checks
            const hasFailure = Object.values(checks.checks).some(
                check => check.status === "unhealthy"
            );
            const hasWarning = Object.values(checks.checks).some(
                check => check.status === "warning"
            );

            checks.status = hasFailure ? "unhealthy" : hasWarning ? "warning" : "healthy";
        } catch (error) {
            this.logger.error("Health check failed", { error: error.message });
            checks.status = "unhealthy";
            checks.error = error.message;
        }

        return checks;
    }

    /**
     * Get service metrics
     */
    async getMetrics() {
        return {
            requests: this.metrics.requests,
            errors: this.metrics.errors,
            uptime: Date.now() - this.metrics.startTime,
            lastHealthCheck: this.metrics.lastHealthCheck,
            security: this.securityManager ? this.securityManager.getMetrics() : {},
            database: this.db ? this.db.getQueryStats() : {},
        };
    }

    /**
     * Start the service
     */
    async start(port = null) {
        const servicePort = port || this.options.port || process.env.PORT || 3000;

        try {
            // Initialize database if configured
            if (this.db) {
                await this.db.initialize();
                this.logger.info("Database initialized successfully");
            }

            // Register service with service registry
            if (this.serviceRegistry) {
                await this.serviceRegistry.register();
                this.logger.info("Service registered with service registry");
            }

            // Start the server
            this.server = this.app.listen(servicePort, () => {
                this.logger.info(`${this.serviceName} started successfully`, {
                    port: servicePort,
                    environment: process.env.NODE_ENV || "development",
                    version: this.options.version || "1.0.0",
                    healthEndpoint: `http://localhost:${servicePort}/health`,
                });
            });

            // Handle graceful shutdown
            this.setupGracefulShutdown();
        } catch (error) {
            this.logger.error(`Failed to start ${this.serviceName}`, { error: error.message });
            throw error;
        }
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown() {
        const shutdown = async signal => {
            this.logger.info(`Received ${signal}, starting graceful shutdown`);

            try {
                // Unregister from service registry
                if (this.serviceRegistry) {
                    await this.serviceRegistry.unregister();
                }

                // Close database connections
                if (this.db) {
                    await this.db.close();
                }

                // Close HTTP server
                if (this.server) {
                    this.server.close(() => {
                        this.logger.info(`${this.serviceName} stopped gracefully`);
                        process.exit(0);
                    });
                }

                // Force exit if graceful shutdown takes too long
                setTimeout(() => {
                    this.logger.error("Forced exit due to timeout");
                    process.exit(1);
                }, 30000);
            } catch (error) {
                this.logger.error("Error during shutdown", { error: error.message });
                process.exit(1);
            }
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }

    /**
     * Get Express app (for testing)
     */
    getApp() {
        return this.app;
    }

    /**
     * Helper method to create authenticated routes
     */
    authenticate(options = {}) {
        return this.authMiddleware.authenticate(options);
    }

    /**
     * Helper method to create authorization middleware
     */
    authorize(roles = [], requireAll = false) {
        return this.authMiddleware.authorize(roles, requireAll);
    }

    /**
     * Helper method for async route handlers
     */
    asyncHandler(handler) {
        return asyncHandler(handler);
    }
}

module.exports = BaseService;
