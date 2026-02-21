/**
 * TalentSphere API Gateway - Enhanced with Service Discovery
 * Central entry point for all microservices.
 * Handles routing, rate limiting, security, and dynamic service discovery.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const proxy = require("express-http-proxy");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");

// Import service discovery and logging
const ServiceDiscovery = require("../../../services/shared/service-discovery");
const { createLogger } = require("../../../shared/enhanced-logger");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize logger
const logger = createLogger("API-Gateway");

// Security & Middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

// Configure CORS with secure settings
const corsOptions = {
    origin: function (origin, callback) {
        // Allow origins with proper validation
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",")
            : ["http://localhost:3000", "http://localhost:3001"];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.use(morgan("combined", { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enhanced Rate Limiting with user-based limits
const createRateLimiter = (windowMs, max, skipSuccessfulRequests = false) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        keyGenerator: req => {
            // Use user ID if available, otherwise IP
            return req.user?.id || req.ip;
        },
        handler: (req, res) => {
            logger.warn("Rate limit exceeded", {
                ip: req.ip,
                userId: req.user?.id,
                path: req.path,
                userAgent: req.get("User-Agent"),
            });
            res.status(429).json({
                error: "Too Many Requests",
                message: "Rate limit exceeded. Please try again later.",
                retryAfter: Math.ceil(windowMs / 1000),
            });
        },
    });

// Apply different rate limits for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes general
const uploadLimiter = createRateLimiter(60 * 60 * 1000, 20); // 20 uploads per hour

app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/upload", uploadLimiter);
app.use("/api", generalLimiter);

// Initialize Service Discovery
let serviceDiscovery;

async function initializeServiceDiscovery() {
    try {
        serviceDiscovery = new ServiceDiscovery({
            redis: {
                host: process.env.REDIS_HOST || "localhost",
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                db: process.env.REDIS_DB || 0,
            },
            consul: {
                host: process.env.CONSUL_HOST || "localhost",
                port: process.env.CONSUL_PORT || 8500,
                enabled: process.env.CONSUL_ENABLED === "true",
            },
            loadBalancing: {
                strategy: process.env.LOAD_BALANCING_STRATEGY || "round-robin",
                healthCheckInterval: 10000,
            },
        });

        await serviceDiscovery.initialize();
        logger.info("Service Discovery initialized successfully");

        // Register API Gateway with service discovery
        if (process.env.REGISTER_WITH_DISCOVERY === "true") {
            await serviceDiscovery.registerService("api-gateway", {
                host: process.env.GATEWAY_HOST || "localhost",
                port: PORT,
                path: "",
                metadata: {
                    version: "2.0.0",
                    type: "gateway",
                    features: ["service-discovery", "rate-limiting", "security"],
                },
                tags: ["gateway", "talentsphere", "v2"],
            });
        }
    } catch (error) {
        logger.error("Failed to initialize Service Discovery", { error: error.message });
        // Continue without service discovery for backward compatibility
        serviceDiscovery = null;
    }
}

// Service configuration with fallback to hardcoded URLs
const serviceConfig = {
    auth: {
        port: 3001,
        path: "/api/v1/auth",
        serviceName: "auth-service",
        healthPath: "/health",
    },
    user: {
        port: 3002,
        path: "/api/v1/users",
        serviceName: "user-service",
        healthPath: "/health",
    },
    job: {
        port: 3003,
        path: "/api/v1/jobs",
        serviceName: "job-service",
        healthPath: "/health",
    },
    network: {
        port: 3004,
        path: "/api/v1/network",
        serviceName: "network-service",
        healthPath: "/health",
    },
    analytics: {
        port: 3006,
        path: "/api/v1/analytics",
        serviceName: "analytics-service",
        healthPath: "/health",
    },
    company: {
        port: 3007,
        path: "/api/v1/companies",
        serviceName: "company-service",
        healthPath: "/health",
    },
    search: {
        port: 3008,
        path: "/api/v1/search",
        serviceName: "search-service",
        healthPath: "/health",
    },
    file: {
        port: 3009,
        path: "/api/v1/upload",
        serviceName: "file-service",
        healthPath: "/health",
    },
    assistant: {
        port: 5005,
        path: "/api/v1/assistant",
        serviceName: "assistant-service",
        healthPath: "/health",
    },
    collaboration: {
        port: 1234,
        path: "/api/v1/collaboration",
        serviceName: "collaboration-service",
        healthPath: "/health",
    },
};

// Get service URL with fallback
async function getServiceUrl(serviceName, options = {}) {
    try {
        // Try service discovery first
        if (serviceDiscovery) {
            return await serviceDiscovery.getServiceUrl(serviceName, options);
        }

        // Fallback to hardcoded configuration
        const service = Object.values(serviceConfig).find(s => s.serviceName === serviceName);
        if (!service) {
            throw new Error(`Unknown service: ${serviceName}`);
        }

        const url = `http://localhost:${service.port}`;
        logger.debug("Using fallback service URL", { serviceName, url });
        return url;
    } catch (error) {
        logger.error("Failed to get service URL", { serviceName, error: error.message });
        throw error;
    }
}

// Enhanced proxy middleware with error handling and retry logic
function createProxyMiddleware(serviceKey) {
    const config = serviceConfig[serviceKey];

    return proxy(
        async req => {
            try {
                const url = await getServiceUrl(config.serviceName);
                logger.debug("Proxying request", {
                    service: config.serviceName,
                    url,
                    path: req.path,
                    method: req.method,
                });
                return url;
            } catch (error) {
                logger.error("Failed to get service URL for proxy", {
                    service: config.serviceName,
                    error: error.message,
                });
                throw error;
            }
        },
        {
            proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
                // Add correlation ID for tracing
                proxyReqOpts.headers["X-Correlation-ID"] =
                    srcReq.correlationId || require("crypto").randomUUID();

                // Add gateway info
                proxyReqOpts.headers["X-Gateway-Version"] = "2.0.0";
                proxyReqOpts.headers["X-Forwarded-For"] = srcReq.ip;
                proxyReqOpts.headers["X-Forwarded-Proto"] = srcReq.protocol;
                proxyReqOpts.headers["X-Forwarded-Host"] = srcReq.get("host");

                return proxyReqOpts;
            },
            proxyReqPathResolver: req => {
                if (serviceKey === "file") {
                    // Special handling for file service
                    return `/upload${req.url}`;
                }
                return req.url;
            },
            userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
                // Log response status
                logger.info("Service response", {
                    service: config.serviceName,
                    status: proxyRes.statusCode,
                    path: userReq.path,
                    method: userReq.method,
                    responseTime: Date.now() - userReq.startTime,
                });

                return proxyResData;
            },
            errHandler: (err, res, next, req, target) => {
                logger.error("Proxy error", {
                    service: config.serviceName,
                    error: err.message,
                    target,
                    path: req.path,
                    method: req.method,
                });

                if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
                    res.status(503).json({
                        error: "Service Unavailable",
                        message: `The ${config.serviceName} is temporarily unavailable. Please try again later.`,
                        service: config.serviceName,
                        timestamp: new Date().toISOString(),
                    });
                } else {
                    res.status(502).json({
                        error: "Bad Gateway",
                        message: "An error occurred while processing your request.",
                        timestamp: new Date().toISOString(),
                    });
                }
            },
            retry: 3,
            timeout: 30000,
        }
    );
}

// Add request timing middleware
app.use((req, res, next) => {
    req.startTime = Date.now();
    req.correlationId = req.get("X-Correlation-ID") || require("crypto").randomUUID();
    res.setHeader("X-Correlation-ID", req.correlationId);
    next();
});

// Dynamic Routes Configuration using Service Discovery
Object.entries(serviceConfig).forEach(([serviceKey, config]) => {
    try {
        const middleware = createProxyMiddleware(serviceKey);
        app.use(config.path, middleware);

        logger.info("Route configured", {
            service: config.serviceName,
            path: config.path,
            port: config.port,
            key: serviceKey,
        });
    } catch (error) {
        logger.error("Failed to configure route", {
            serviceKey,
            error: error.message,
        });
    }
});

// Enhanced Health Check with service discovery status
app.get("/health", async (req, res) => {
    const health = {
        status: "healthy",
        gateway: "TalentSphere API Gateway v2.0.0",
        timestamp: new Date(),
        uptime: process.uptime(),
        version: "2.0.0",
        serviceDiscovery: {
            enabled: !!serviceDiscovery,
            status: serviceDiscovery ? "connected" : "disabled",
        },
        services: {},
        memory: process.memoryUsage(),
        pid: process.pid,
    };

    try {
        if (serviceDiscovery) {
            // Get service discovery stats
            const stats = await serviceDiscovery.getStats();
            if (stats) {
                health.serviceDiscovery.services = stats.services;
                health.serviceDiscovery.redis = stats.redis ? "connected" : "disconnected";
                health.serviceDiscovery.consul = stats.config?.consul?.enabled
                    ? stats.consul?.connected
                        ? "connected"
                        : "disconnected"
                    : "disabled";
            }

            // Check status of all configured services
            for (const [serviceKey, config] of Object.entries(serviceConfig)) {
                try {
                    const instances = await serviceDiscovery.getHealthyServiceInstances(
                        config.serviceName
                    );
                    health.services[config.serviceName] = {
                        status: instances.length > 0 ? "healthy" : "unhealthy",
                        instances: instances.length,
                        healthyInstances: instances.filter(i => i.status === "healthy").length,
                    };
                } catch (error) {
                    health.services[config.serviceName] = {
                        status: "error",
                        error: error.message,
                    };
                }
            }
        } else {
            // Fallback health check without service discovery
            for (const [serviceKey, config] of Object.entries(serviceConfig)) {
                health.services[config.serviceName] = {
                    status: "unknown",
                    note: "Service discovery disabled",
                };
            }
        }
    } catch (error) {
        logger.error("Health check failed", { error: error.message });
        health.status = "degraded";
        health.error = error.message;
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
});

// Service Discovery Management Endpoints
app.get("/admin/services", async (req, res) => {
    try {
        if (!serviceDiscovery) {
            return res.status(503).json({
                error: "Service Discovery Unavailable",
                message: "Service discovery is not enabled",
            });
        }

        const services = await serviceDiscovery.getAllServices();
        const stats = await serviceDiscovery.getStats();

        res.json({
            services,
            stats,
            config: {
                loadBalancing: stats?.config?.loadBalancing,
                cache: stats?.config?.cache,
                monitoring: stats?.config?.monitoring,
            },
        });
    } catch (error) {
        logger.error("Failed to get services", { error: error.message });
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to retrieve service information",
        });
    }
});

// Metrics endpoint
app.get("/admin/metrics", async (req, res) => {
    try {
        const metrics = {
            gateway: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                pid: process.pid,
                version: "2.0.0",
            },
            timestamp: new Date().toISOString(),
        };

        if (serviceDiscovery) {
            const stats = await serviceDiscovery.getStats();
            if (stats) {
                metrics.serviceDiscovery = stats;
            }
        }

        res.json(metrics);
    } catch (error) {
        logger.error("Failed to get metrics", { error: error.message });
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to retrieve metrics",
        });
    }
});

// Admin endpoint to force service cache refresh
app.post("/admin/refresh-cache", async (req, res) => {
    try {
        if (!serviceDiscovery) {
            return res.status(503).json({
                error: "Service Discovery Unavailable",
            });
        }

        for (const [serviceKey, config] of Object.entries(serviceConfig)) {
            await serviceDiscovery.updateServiceCache(config.serviceName);
        }

        res.json({
            message: "Service cache refreshed successfully",
            timestamp: new Date(),
        });
    } catch (error) {
        logger.error("Failed to refresh cache", { error: error.message });
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to refresh service cache",
        });
    }
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        name: "TalentSphere API Gateway",
        version: "2.0.0",
        status: "running",
        endpoints: {
            health: "/health",
            services: "/admin/services",
            metrics: "/admin/metrics",
            refresh: "/admin/refresh-cache",
        },
        documentation: "https://docs.talentsphere.com/api-gateway",
        timestamp: new Date(),
    });
});

// 404 handler
app.use("*", (req, res) => {
    logger.warn("Route not found", {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });

    res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: Object.values(serviceConfig).map(config => config.path),
        timestamp: new Date(),
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error("Unhandled error", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        timestamp: new Date(),
        correlationId: req.correlationId,
    });
});

// Start Server with proper initialization
async function startServer() {
    try {
        // Initialize service discovery first
        await initializeServiceDiscovery();

        // Start the server
        const server = app.listen(PORT, () => {
            logger.info("API Gateway started successfully", {
                port: PORT,
                version: "2.0.0",
                serviceDiscovery: !!serviceDiscovery,
                nodeVersion: process.version,
                platform: process.platform,
            });

            // Log configured routes
            Object.entries(serviceConfig).forEach(([serviceKey, config]) => {
                logger.info("Route configured", {
                    service: config.serviceName,
                    path: config.path,
                    fallbackPort: config.port,
                });
            });
        });

        // Graceful shutdown handling
        const gracefulShutdown = async signal => {
            logger.info(`Received ${signal}, starting graceful shutdown...`);

            server.close(async () => {
                logger.info("HTTP server closed");

                if (serviceDiscovery) {
                    try {
                        await serviceDiscovery.shutdown();
                        logger.info("Service discovery shut down");
                    } catch (error) {
                        logger.error("Error shutting down service discovery", {
                            error: error.message,
                        });
                    }
                }

                process.exit(0);
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error("Graceful shutdown timeout, forcing exit");
                process.exit(1);
            }, 30000);
        };

        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));

        return server;
    } catch (error) {
        logger.error("Failed to start server", {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
}

// Start the server
startServer().catch(error => {
    console.error("Fatal error starting server:", error);
    process.exit(1);
});
