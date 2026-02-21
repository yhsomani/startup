/**
 * TalentSphere API Gateway Server
 * Main entry point for the API Gateway service
 */

console.log("DEBUG: Starting server.js...");
const express = require("express");
console.log("DEBUG: Required express");
const { createProxyMiddleware } = require("http-proxy-middleware");
console.log("DEBUG: Required http-proxy-middleware");
const { logger: enhancedLogger } = require("../shared/enhanced-logger");
console.log("DEBUG: Required enhanced-logger");
const { getServiceUrl } = require("../shared/ports");
console.log("DEBUG: Required ports");
const SecurityManager = require("../backends/shared/enhanced-security-manager");
console.log("DEBUG: Required enhanced-security-manager");
const { createErrorHandler, asyncHandler } = require("../backends/shared/error-handler");
console.log("DEBUG: Required error-handler");

// Create Express app with enhanced security
const app = express();

// Initialize Security Manager
const securityManager = new SecurityManager("api-gateway", {
    cors: {
        origin: process.env.CORS_ORIGIN || undefined,
        credentials: true,
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        auth: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // 10 auth attempts per window
        },
    },
});

// Apply all security middleware
try {
    console.log("DEBUG: Applying security middleware...");
    app.use(securityManager.getSecurityMiddleware());
    console.log("DEBUG: Security middleware applied successfully");
} catch (error) {
    console.error("DEBUG: Failed to apply security middleware:", error);
    process.exit(1);
}

// Request logging is now handled by Security Manager's correlation middleware

// API Gateway routes using new port configuration
console.log("DEBUG: Defining service routes...");
let serviceRoutes = {};
try {
    serviceRoutes = {
        // Authentication routes
        "/api/v1/auth": getServiceUrl("user-auth-service"),
        "/auth": getServiceUrl("user-auth-service"), // Legacy support

        // User Profile routes
        "/api/v1/users": getServiceUrl("user-profile-service"),
        "/users": getServiceUrl("user-profile-service"), // Legacy support

        // Job Listing routes
        "/api/v1/jobs": getServiceUrl("job-listing-service"),
        "/jobs": getServiceUrl("job-listing-service"), // Legacy support

        // Learning Management System routes
        "/api/v1/lms": getServiceUrl("lms-service"),
        "/lms": getServiceUrl("lms-service"), // Legacy support

        // Challenge Service routes
        "/api/v1/challenges": getServiceUrl("challenge-service"),
        "/challenges": getServiceUrl("challenge-service"), // Legacy support

        // Analytics Service routes
        "/api/v1/analytics": getServiceUrl("analytics-service"),
        "/analytics": getServiceUrl("analytics-service"), // Legacy support

        // Dashboard Service routes
        "/api/v1/dashboard": getServiceUrl("dashboard-service"),
        "/dashboard": getServiceUrl("dashboard-service"), // Legacy support

        // Recruitment Service routes
        "/api/v1/recruitment": getServiceUrl("recruitment-service"),
        "/recruitment": getServiceUrl("recruitment-service"), // Legacy support
    };
    console.log("DEBUG: Service routes defined successfully");
} catch (error) {
    console.error("DEBUG: Failed to define service routes:", error);
    process.exit(1);
}

// Create proxy middleware for each service
console.log("DEBUG: Configuring proxy middleware...");
try {
    Object.entries(serviceRoutes).forEach(([route, targetUrl]) => {
        console.log(`DEBUG: Configuring route: ${route} -> ${targetUrl}`);
        const proxy = createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: {
                [`^${route}`]: "",
            },
            onProxyReq: (proxyReq, req, res) => {
                enhancedLogger.debug(`Proxying ${req.method} ${req.path} to ${targetUrl}`);
            },
            onProxyRes: (proxyRes, req, res) => {
                enhancedLogger.debug(`Response from ${targetUrl}: ${proxyRes.statusCode}`);
            },
            onError: asyncHandler(async (err, req, res) => {
                enhancedLogger.error(`Proxy error for ${req.path}`, {
                    error: err.message,
                    target: targetUrl,
                    correlationId: req.correlationId,
                });

                // Check for security violations
                if (err.message.includes("blocked") || err.message.includes("forbidden")) {
                    return res.status(403).json({
                        error: "ACCESS_DENIED",
                        message: "Request blocked by security policy",
                        correlationId: req.correlationId,
                    });
                }

                res.status(502).json({
                    error: "SERVICE_UNAVAILABLE",
                    message: `Unable to reach ${route} service`,
                    correlationId: req.correlationId,
                });
            }),
        });

        app.use(route, proxy);
    });
    console.log("DEBUG: Proxy middleware configured successfully");
} catch (error) {
    console.error("DEBUG: Failed to configure proxy middleware:", error);
    process.exit(1);
}

// Enhanced health check endpoint
app.get(
    "/health",
    asyncHandler(async (req, res) => {
        const securityHealth = await securityManager.healthCheck();

        res.status(200).json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: Object.keys(serviceRoutes),
            security: securityHealth,
            metrics: securityManager.getMetrics(),
        });
    })
);

// Enhanced API version endpoint
app.get(
    "/api/version",
    asyncHandler(async (req, res) => {
        res.json({
            version: process.env.npm_package_version || "1.0.0",
            name: "TalentSphere API Gateway",
            description: "Secure Microservices API Gateway for TalentSphere Platform",
            security: {
                enabled: true,
                features: ["authentication", "rate-limiting", "cors", "input-sanitization"],
            },
            correlationId: req.correlationId,
        });
    })
);

// Enhanced 404 handler
app.use(
    "*",
    asyncHandler(async (req, res) => {
        res.status(404).json({
            error: "NOT_FOUND",
            message: `Endpoint ${req.method} ${req.path} not found`,
            availableServices: Object.keys(serviceRoutes),
            correlationId: req.correlationId,
        });
    })
);

// Body-parser error handling middleware for malformed JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        enhancedLogger.warn("Malformed JSON received", {
            path: req.path,
            method: req.method,
            correlationId: req.correlationId,
        });
        return res.status(400).json({
            error: "INVALID_JSON",
            message: "Malformed JSON in request body",
            correlationId: req.correlationId,
        });
    }
    next(err);
});

// Enhanced error handler
app.use(createErrorHandler("api-gateway"));

// Start server
const PORT = process.env.PORT || 8000;

try {
    const server = app.listen(PORT, () => {
        console.log(`DEBUG: Server listening on port ${PORT}`);
        enhancedLogger.info(`API Gateway started on port ${PORT}`, {
            services: Object.keys(serviceRoutes),
            environment: process.env.NODE_ENV || "development",
            nodeVersion: process.version,
        });
    });

    server.on("error", err => {
        console.error("DEBUG: Server listener error:", err);
    });
} catch (error) {
    console.error("DEBUG: Failed to start server listener:", error);
}

// Graceful shutdown
process.on("SIGTERM", () => {
    enhancedLogger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});

process.on("SIGINT", () => {
    enhancedLogger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});

module.exports = {
    app,
    securityManager,
};
