/**
 * Generic Service Startup Template for TalentSphere
 * This file can be used as a template for all microservices
 * to integrate with Service Discovery and common patterns
 */

const express = require("express");
const { createServiceRegistry, serviceRegistryMiddleware } = require("../shared/service-registry");
const { createLogger } = require("../../shared/enhanced-logger");
const HealthCheckFramework = require("./health-check-framework");

class BaseService {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.logger = createLogger(serviceName);
        this.app = express();
        this.server = null;
        this.serviceRegistry = null;
        this.healthCheckFramework = null;

        this.config = {
            port: options.port || process.env.PORT || 3000,
            host: options.host || process.env.SERVICE_HOST || "localhost",
            version: options.version || "1.0.0",
            description: options.description || `${serviceName} microservice`,
            tags: options.tags || [],
            metadata: options.metadata || {},
            healthCheckPath: options.healthCheckPath || "/health",

            // Service Discovery
            enableServiceDiscovery: options.enableServiceDiscovery !== false,

            // Middleware options
            enableCors: options.enableCors !== false,
            enableHelmet: options.enableHelmet !== false,
            enableLogging: options.enableLogging !== false,
            enableRateLimit: options.enableRateLimit !== false,

            ...options,
        };

        // Initialize Health Check Framework
        this.initializeHealthChecks();

        this.initializeMiddleware();
    }

    /**
     * Initialize common middleware
     */
    initializeMiddleware() {
        // Security middleware
        if (this.config.enableHelmet) {
            const helmet = require("helmet");
            this.app.use(helmet());
        }

        // Enhanced CORS middleware with security
        if (this.config.enableCors) {
            const cors = require("cors");

            // Parse allowed origins with environment variable support
            const allowedOrigins = this.getAllowedOrigins();

            this.app.use(
                cors({
                    origin: (origin, callback) => {
                        // Allow requests with no origin (mobile apps, Postman, etc.)
                        if (!origin) {return callback(null, true);}

                        // Check against allowed origins
                        if (allowedOrigins.includes(origin)) {
                            callback(null, true);
                        } else {
                            this.logger.warn("CORS: Origin not allowed", {
                                origin,
                                allowedOrigins,
                            });
                            callback(new Error("Not allowed by CORS"));
                        }
                    },

                    // Security headers
                    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                    allowedHeaders: [
                        "Origin",
                        "X-Requested-With",
                        "Content-Type",
                        "Accept",
                        "Authorization",
                        "X-Correlation-ID",
                        "X-API-Key",
                        "X-Client-Version",
                    ],
                    exposedHeaders: [
                        "X-Correlation-ID",
                        "X-Total-Count",
                        "X-Page-Count",
                        "X-Rate-Limit-Remaining",
                        "X-Rate-Limit-Reset",
                    ],
                    credentials: true, // Allow cookies/auth headers

                    // Preflight configuration
                    maxAge: 86400, // 24 hours for preflight cache
                    preflightContinue: false,

                    // Additional security options
                    optionsSuccessStatus: 204, // No content for successful preflight
                })
            );
        }

        // JSON parsing
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

        // Request logging
        if (this.config.enableLogging) {
            const morgan = require("morgan");
            this.app.use(
                morgan("combined", {
                    stream: { write: message => this.logger.info(message.trim()) },
                })
            );
        }

        // Rate limiting
        if (this.config.enableRateLimit) {
            const rateLimit = require("express-rate-limit");
            this.app.use(
                rateLimit({
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100, // limit each IP to 100 requests per windowMs
                    standardHeaders: true,
                    legacyHeaders: false,
                })
            );
        }

        // Service registry middleware
        if (this.config.enableServiceDiscovery) {
            this.app.use((req, res, next) => {
                req.serviceRegistry = this.serviceRegistry;
                req.serviceName = this.serviceName;
                next();
            });
        }

        // Request correlation ID
        this.app.use((req, res, next) => {
            req.correlationId = req.get("X-Correlation-ID") || require("crypto").randomUUID();
            res.setHeader("X-Correlation-ID", req.correlationId);
            next();
        });
    }

    /**
     * Initialize health checks
     */
    initializeHealthChecks() {
        try {
            this.healthCheckFramework = new HealthCheckFramework(this.serviceName, {
                basicInterval: 30000, // 30 seconds
                deepInterval: 300000, // 5 minutes
                memoryThreshold: 85,
                cpuThreshold: 80,
            });

            // Add service-specific health checks
            this.addServiceHealthChecks();

            this.logger.debug("Health check framework initialized", {
                serviceName: this.serviceName,
            });
        } catch (error) {
            this.logger.error("Failed to initialize health checks", {
                error: error.message,
            });
        }
    }

    /**
     * Add service-specific health checks (override in subclasses)
     */
    addServiceHealthChecks() {
        // Override in service-specific implementations
        this.logger.debug("No service-specific health checks configured");
    }

    /**
     * Initialize the service
     */
    async initialize() {
        try {
            this.logger.info("Initializing service...", {
                serviceName: this.serviceName,
                version: this.config.version,
                port: this.config.port,
            });

            // Initialize Service Registry
            if (this.config.enableServiceDiscovery) {
                this.serviceRegistry = require("../shared/service-registry").createServiceRegistry(
                    this.serviceName,
                    {
                        port: this.config.port,
                        host: this.config.host,
                        version: this.config.version,
                        tags: this.config.tags,
                        metadata: {
                            description: this.config.description,
                            ...this.config.metadata,
                        },
                        healthCheckPath: this.config.healthCheckPath,
                    }
                );

                await this.serviceRegistry.initialize();
                this.logger.info("Service Registry initialized");
            }

            // Setup default routes
            this.setupDefaultRoutes();

            // Allow services to add custom routes
            if (this.setupRoutes) {
                await this.setupRoutes();
            }

            // Start the server
            await this.startServer();

            this.logger.info("Service initialized successfully", {
                port: this.config.port,
                serviceDiscovery: !!this.serviceRegistry,
                instanceId: this.serviceRegistry?.getInstanceInfo()?.instanceId,
            });
        } catch (error) {
            this.logger.error("Failed to initialize service", {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Setup default routes
     */
    setupDefaultRoutes() {
        // Enhanced health check endpoints
        this.app.get(this.config.healthCheckPath, (req, res) => {
            try {
                // Use HealthCheckFramework if available, otherwise fallback
                if (this.healthCheckFramework) {
                    const status = this.healthCheckFramework.getStatus();
                    res.json(status);
                } else {
                    // Fallback health check
                    const health = {
                        status: "healthy",
                        service: this.serviceName,
                        version: this.config.version,
                        timestamp: new Date(),
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        pid: process.pid,
                        instanceId: this.serviceRegistry?.getInstanceInfo()?.instanceId,
                        serviceDiscovery:
                            this.serviceRegistry?.getInstanceInfo()?.isRegistered || false,
                        framework: "fallback",
                    };
                    res.json(health);
                }
            } catch (error) {
                this.logger.error("Health check failed", { error: error.message });
                res.status(500).json({
                    status: "unhealthy",
                    error: error.message,
                    service: this.serviceName,
                    timestamp: new Date(),
                });
            }
        });

        // Detailed health check endpoint
        this.app.get(`${this.config.healthCheckPath}/detailed`, async (req, res) => {
            try {
                if (this.healthCheckFramework) {
                    const summary = this.healthCheckFramework.getSummary();
                    res.json(summary);
                } else {
                    res.status(501).json({
                        error: "Detailed health checks not available",
                        message: "HealthCheckFramework not initialized",
                    });
                }
            } catch (error) {
                this.logger.error("Detailed health check failed", { error: error.message });
                res.status(500).json({
                    error: error.message,
                    timestamp: new Date(),
                });
            }
        });

        // Health check metrics endpoint
        this.app.get(`${this.config.healthCheckPath}/metrics`, (req, res) => {
            try {
                if (this.healthCheckFramework) {
                    const metrics = this.healthCheckFramework.getStatus();
                    res.json({
                        service: this.serviceName,
                        timestamp: new Date(),
                        ...metrics,
                    });
                } else {
                    res.status(501).json({
                        error: "Health metrics not available",
                        message: "HealthCheckFramework not initialized",
                    });
                }
            } catch (error) {
                res.status(500).json({
                    error: error.message,
                    timestamp: new Date(),
                });
            }
        });

        // Service info endpoint
        this.app.get("/info", (req, res) => {
            const info = {
                name: this.serviceName,
                version: this.config.version,
                description: this.config.description,
                tags: this.config.tags,
                metadata: this.config.metadata,
                timestamp: new Date(),
                uptime: process.uptime(),
            };

            res.json(info);
        });

        // Root endpoint
        this.app.get("/", (req, res) => {
            res.json({
                service: this.serviceName,
                status: "running",
                version: this.config.version,
                endpoints: {
                    health: this.config.healthCheckPath,
                    info: "/info",
                },
                timestamp: new Date(),
            });
        });
    }

    /**
     * Start HTTP server
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.config.port, this.config.host, () => {
                this.logger.info(`Server started on ${this.config.host}:${this.config.port}`);

                // Start health check monitoring
                if (this.healthCheckFramework) {
                    this.healthCheckFramework.start();
                    this.logger.info("Health check monitoring started");
                }

                resolve(this.server);
            });

            this.server.on("error", error => {
                this.logger.error("Server error", { error: error.message });
                reject(error);
            });
        });
    }

    /**
     * Update service metadata
     */
    async updateMetadata(metadata) {
        if (this.serviceRegistry) {
            await this.serviceRegistry.updateMetadata(metadata);
        }
    }

    /**
     * Get service registry instance
     */
    getServiceRegistry() {
        return this.serviceRegistry;
    }

    /**
     * Get allowed origins with environment-based configuration
     */
    getAllowedOrigins() {
        // Default secure origins for development
        const defaultOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
        ];

        // Environment-specific origins
        let envOrigins = [];

        if (process.env.ALLOWED_ORIGINS) {
            envOrigins = process.env.ALLOWED_ORIGINS.split(",")
                .map(origin => origin.trim())
                .filter(origin => origin.length > 0);
        }

        // Environment-based additional origins
        if (process.env.NODE_ENV === "development") {
            envOrigins.push(
                "http://localhost:8080",
                "http://localhost:8081",
                "http://localhost:8082"
            );
        } else if (process.env.NODE_ENV === "staging") {
            envOrigins.push(
                "https://staging.talentsphere.com",
                "https://staging-api.talentsphere.com"
            );
        } else if (process.env.NODE_ENV === "production") {
            envOrigins.push(
                "https://talentsphere.com",
                "https://api.talentsphere.com",
                "https://www.talentsphere.com"
            );
        }

        // Combine and deduplicate
        const allOrigins = [...defaultOrigins, ...envOrigins];
        const uniqueOrigins = [...new Set(allOrigins)];

        this.logger.debug("CORS origins configured", {
            defaultOrigins,
            envOrigins,
            uniqueOrigins,
            count: uniqueOrigins.length,
        });

        return uniqueOrigins;
    }

    /**
     * Get Express app instance
     */
    getApp() {
        return this.app;
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info("Shutting down service...");

        // Stop health check monitoring
        if (this.healthCheckFramework) {
            this.healthCheckFramework.stop();
            this.logger.info("Health check monitoring stopped");
        }

        if (this.server) {
            await new Promise(resolve => {
                this.server.close(resolve);
            });
            this.logger.info("HTTP server closed");
        }

        if (this.serviceRegistry) {
            await this.serviceRegistry.shutdown();
            this.logger.info("Service Registry shutdown");
        }

        this.logger.info("Service shutdown completed");
    }
}

module.exports = BaseService;
