/**
 * TalentSphere API Gateway Configuration
 * Routes all frontend requests to appropriate backend services
 */

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getServicePort, getServiceUrl } = require("../shared/ports");
const { getServiceConfig } = require("../shared/environment");
const SecurityConfig = require("../shared/security");
const { createLogger, performanceMonitor } = require("../shared/enhanced-logger");
const { v4: uuidv4 } = require("uuid");

// Initialize structured logger
const logger = createLogger("api-gateway", {
    enableStructured: true,
    enableFileLogging: true,
    level: process.env.LOG_LEVEL || "info",
});

// Environment flags
const isDevelopment = process.env.NODE_ENV !== "production";

// Initialize security configuration
const securityConfig = new SecurityConfig();

const app = express();
const PORT = getServicePort("gateway");

// Correlation ID middleware for distributed tracing
app.use((req, res, next) => {
    const correlationId = req.headers["x-correlation-id"] || uuidv4();
    req.headers["x-correlation-id"] = correlationId;
    res.setHeader("x-correlation-id", correlationId);
    req.correlationId = correlationId;
    logger.debug(`[${correlationId}] ${req.method} ${req.url}`);
    next();
});

// Security middleware with proper configuration
app.use(helmet(securityConfig.getSecurityHeaders()));
app.use(compression());

// Rate limiting with dynamic configuration
const rateLimitConfig = securityConfig.getRateLimitConfig();
const limiter = rateLimit(rateLimitConfig);
app.use("/api/", limiter);

// Sensitive endpoints have stricter limits
Object.entries(rateLimitConfig.sensitiveEndpoints).forEach(([path, config]) => {
    app.use(
        path,
        rateLimit({
            ...rateLimitConfig,
            ...config,
        })
    );
});

// Structured logging middleware
app.use((req, res, next) => {
    const { v4: uuidv4 } = require("uuid");
    const traceId = req.headers["x-trace-id"] || uuidv4();
    req.traceId = traceId;
    req.startTime = Date.now();

    logger.info("Incoming request", {
        method: req.method,
        url: req.url,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        traceId,
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - req.startTime;

        logger.info("Request completed", {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            traceId,
        });

        originalEnd.call(this, chunk, encoding);
    };

    next();
});

// CORS with secure configuration
app.use(cors(securityConfig.getCORSConfig()));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with dependency verification
app.get("/health", async (req, res) => {
    const healthCheck = async () => {
        const serviceHealth = {};
        const services = [
            "user-auth-service",
            "user-profile-service",
            "job-listing-service",
            "company-service",
            "notification-service",
            "email-service",
            "analytics-service",
        ];

        // Check service availability (simplified check)
        for (const service of services) {
            try {
                const serviceUrl = getServiceUrl(service);
                const response = await fetch(`${serviceUrl}/health`, {
                    timeout: 5000,
                });
                serviceHealth[service] = response.ok ? "healthy" : "unhealthy";
            } catch (error) {
                serviceHealth[service] = "unreachable";
                logger.warn("Service health check failed", {
                    service,
                    error: error.message,
                    traceId: req.traceId,
                });
            }
        }

        return {
            status: Object.values(serviceHealth).every(status => status === "healthy")
                ? "healthy"
                : "degraded",
            timestamp: new Date().toISOString(),
            port: PORT,
            services: serviceHealth,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: "2.3.0",
        };
    };

    try {
        const health = await healthCheck();

        logger.info("Health check completed", {
            status: health.status,
            servicesCount: Object.keys(health.services).length,
            traceId: req.traceId,
        });

        res.status(health.status === "healthy" ? 200 : 503).json(health);
    } catch (error) {
        logger.error("Health check failed", {
            error: error.message,
            stack: error.stack,
            traceId: req.traceId,
        });

        res.status(503).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: "Health check failed",
        });
    }
});

// API Gateway routes using new port configuration
const serviceRoutes = {
    // Authentication routes
    "/api/v1/auth": getServiceUrl("user-auth-service"),
    "/auth": getServiceUrl("user-auth-service"), // Legacy support

    // User Profile routes
    "/api/v1/users": getServiceUrl("user-profile-service"),
    "/users": getServiceUrl("user-profile-service"), // Legacy support

    // Job Listing routes
    "/api/v1/jobs": getServiceUrl("job-listing-service"),
    "/jobs": getServiceUrl("job-listing-service"), // Legacy support

    // Company routes
    "/api/v1/companies": getServiceUrl("company-service"),
    "/companies": getServiceUrl("company-service"), // Legacy support

    // Notification routes
    "/api/v1/notifications": getServiceUrl("notification-service"),
    "/notifications": getServiceUrl("notification-service"), // Legacy support

    // Email routes
    "/api/v1/email": getServiceUrl("email-service"),
    "/email": getServiceUrl("email-service"), // Legacy support

    // Analytics routes
    "/api/v1/analytics": getServiceUrl("analytics-service"),
    "/analytics": getServiceUrl("analytics-service"), // Legacy support

    // Search routes
    "/api/v1/search": getServiceUrl("search-service"),
    "/search": getServiceUrl("search-service"),

    // File Upload routes
    "/api/v1/upload": getServiceUrl("file-service"),
    "/upload": getServiceUrl("file-service"),

    // Video Streaming routes
    "/api/v1/video": getServiceUrl("video-service"),
    "/video": getServiceUrl("video-service"),
};

// Create proxy middleware for each service
Object.entries(serviceRoutes).forEach(([route, targetUrl]) => {
    // console.log(`🔗 Route ${route} -> ${targetUrl}`); // Production logging handled by morgan

    app.use(
        route,
        createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                // Remove the /api/v1 prefix when proxying to services
                return path.replace(/^\/api\/v1\/[^/]+/, "");
            },
            onError: (err, req, res) => {
                console.error(`Proxy error for ${req.url}:`, err.message);
                res.status(502).json({
                    error: {
                        code: "SERVICE_UNAVAILABLE",
                        message: `Backend service is currently unavailable for ${route}`,
                    },
                });
            },
            onProxyReq: (proxyReq, req, res) => {
                // Add custom headers if needed
                proxyReq.setHeader(
                    "X-Gateway-Request-Id",
                    req.id || Math.random().toString(36).substr(2, 9)
                );
                proxyReq.setHeader("X-Forwarded-For", req.ip);
                proxyReq.setHeader("X-Forwarded-Proto", req.protocol);
                proxyReq.setHeader("X-Forwarded-Host", req.get("host"));
            },
            logLevel: isDevelopment ? "debug" : "warn",
        })
    );
});

// WebSocket proxy for collaboration service
const collaborationUrl = process.env.COLLABORATION_SERVICE_URL || "http://localhost:3030";
app.use(
    "/collaboration",
    createProxyMiddleware({
        target: collaborationUrl,
        ws: true,
        changeOrigin: true,
        logLevel: isDevelopment ? "debug" : "warn",
    })
);

// Static file serving for uploads
app.use("/uploads", express.static("uploads"));

// API documentation endpoint
app.get("/api/docs", (req, res) => {
    res.json({
        title: "TalentSphere API Gateway",
        version: "2.3.0",
        endpoints: Object.keys(serviceRoutes),
        services: {
            auth: "Authentication and authorization",
            courses: "Course management and content",
            challenges: "Coding challenges and submissions",
            video: "Video streaming and processing",
            progress: "Progress tracking and analytics",
            notifications: "Real-time notifications",
            ai: "AI assistant and recommendations",
            gamification: "Gamification features",
            recruitment: "Recruitment and job matching",
        },
        documentation: "/api/docs/swagger",
        health: "/health",
    });
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
    res.status(404).json({
        error: {
            code: "ROUTE_NOT_FOUND",
            message: `Route ${req.originalUrl} not found. Available routes: ${Object.keys(serviceRoutes).join(", ")}`,
            availableEndpoints: Object.keys(serviceRoutes),
        },
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Gateway error:", err);

    if (err.code === "ECONNREFUSED") {
        res.status(503).json({
            error: {
                code: "SERVICE_UNAVAILABLE",
                message: "Backend service is not running",
            },
        });
    } else {
        res.status(500).json({
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An unexpected error occurred in the API gateway",
            },
        });
    }
});

// Start gateway
app.listen(PORT, () => {
    if (process.env.NODE_ENV !== "production") {
        console.log(`🚀 TalentSphere API Gateway running on port ${PORT}`);
        console.log(`📡 API Gateway: http://localhost:${PORT}`);
        console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
        console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
    }
    if (process.env.NODE_ENV !== "production") {
        console.log(`\n🔗 Service Routes:`);
        Object.entries(serviceRoutes).forEach(([route, target]) => {
            console.log(`  ${route} -> ${target}`);
        });
        console.log(`\n🌐 CORS Origins: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
    }
});

module.exports = app;
