/**
 * Standardized Logging System for TalentSphere
 * Provides consistent logging format across all services
 */

const winston = require("winston");
const path = require("path");

// Custom log format
const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(
        ({ timestamp, level, message, service, userId, requestId, error, stack, ...meta }) => {
            const logEntry = {
                timestamp,
                level,
                message,
                service: service || "TalentSphere",
                environment: process.env.NODE_ENV || "development",
                ...(userId && { userId }),
                ...(requestId && { requestId }),
                ...(error && { error: error.message || error }),
                ...(stack && { stack }),
                ...(Object.keys(meta).length > 0 && { meta }),
            };

            return JSON.stringify(logEntry);
        }
    )
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: "HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, level, message, service, userId, requestId, ...meta }) => {
        const prefix = [
            timestamp,
            level,
            service || "TalentSphere",
            ...(userId && [`User:${userId}`]),
            ...(requestId && [`Req:${requestId}`]),
        ]
            .filter(Boolean)
            .join(" ");

        const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
        return `${prefix} ${message}${metaString}`;
    })
);

// Create logger instance
const createLogger = (options = {}) => {
    const {
        service,
        level = process.env.LOG_LEVEL || "info",
        silent = false,
        enableFileLogging = true,
    } = options;

    const transports = [];

    // Console transport for all environments
    if (!silent) {
        transports.push(
            new winston.transports.Console({
                format: process.env.NODE_ENV === "production" ? customFormat : consoleFormat,
                level,
            })
        );
    }

    // File transports for production/staging
    if (
        enableFileLogging &&
        (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging")
    ) {
        // General logs
        transports.push(
            new winston.transports.File({
                filename: path.join(
                    process.env.LOG_DIR || "./logs",
                    "runtime",
                    `${service || "talentsphere"}.log`
                ),
                format: customFormat,
                level,
                maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
                maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
                tailable: true,
            })
        );

        // Error logs
        transports.push(
            new winston.transports.File({
                filename: path.join(
                    process.env.LOG_DIR || "./logs",
                    "errors",
                    `${service || "talentsphere"}-error.log`
                ),
                format: customFormat,
                level: "error",
                maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760,
                maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
                tailable: true,
            })
        );
    }

    return winston.createLogger({
        level,
        transports,
        exitOnError: false,
        handleExceptions: true,
        handleRejections: true,
        defaultMeta: { service },
    });
};

// Main logger
const logger = createLogger();

// Service-specific loggers
const createServiceLogger = serviceName => {
    return createLogger({ service: serviceName });
};

// Express middleware for request logging
const requestLoggerMiddleware = (options = {}) => {
    const serviceLogger = createServiceLogger(options.service || "API");

    return (req, res, next) => {
        const requestId = req.headers["x-request-id"] || generateRequestId();
        const startTime = Date.now();

        // Add request context
        req.requestId = requestId;
        req.startTime = startTime;

        // Log incoming request
        serviceLogger.info("Incoming request", {
            method: req.method,
            url: req.url,
            userAgent: req.get("User-Agent"),
            ip: req.ip || req.connection.remoteAddress,
            requestId,
            userId: req.user?.id,
        });

        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const duration = Date.now() - startTime;

            serviceLogger.info("Request completed", {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                requestId,
                userId: req.user?.id,
            });

            originalEnd.call(this, chunk, encoding);
        };

        next();
    };
};

// Helper functions
const generateRequestId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const setContext = (req, context = {}) => {
    if (req.logger) {
        req.logger.defaultMeta = {
            ...req.logger.defaultMeta,
            ...context,
        };
    }
};

// Structured logging helpers
const logUserAction = (userId, action, details = {}) => {
    logger.info("User action performed", {
        userId,
        action,
        category: "user_action",
        ...details,
    });
};

const logApiError = (error, req, details = {}) => {
    logger.error("API error occurred", {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        requestId: req.requestId,
        userId: req.user?.id,
        category: "api_error",
        ...details,
    });
};

const logBusinessEvent = (event, details = {}) => {
    logger.info("Business event", {
        event,
        category: "business",
        ...details,
    });
};

const logPerformance = (operation, duration, details = {}) => {
    logger.info("Performance metric", {
        operation,
        duration: `${duration}ms`,
        category: "performance",
        ...details,
    });
};

const logSecurity = (event, details = {}) => {
    logger.warn("Security event", {
        event,
        category: "security",
        ...details,
    });
};

const logExternalService = (service, operation, duration, success, details = {}) => {
    const level = success ? "info" : "error";
    logger[level](`External service call: ${service}`, {
        service,
        operation,
        duration: `${duration}ms`,
        success,
        category: "external_service",
        ...details,
    });
};

// Database logging
const logDatabaseQuery = (operation, collection, duration, details = {}) => {
    logger.debug("Database query", {
        operation,
        collection,
        duration: `${duration}ms`,
        category: "database",
        ...details,
    });
};

const logDatabaseError = (error, operation, collection, details = {}) => {
    logger.error("Database error", {
        error: error.message,
        stack: error.stack,
        operation,
        collection,
        category: "database",
        ...details,
    });
};

// Background job logging
const logJobStart = (jobId, jobType, details = {}) => {
    logger.info("Job started", {
        jobId,
        jobType,
        category: "job",
        status: "started",
        ...details,
    });
};

const logJobComplete = (jobId, jobType, duration, details = {}) => {
    logger.info("Job completed", {
        jobId,
        jobType,
        duration: `${duration}ms`,
        category: "job",
        status: "completed",
        ...details,
    });
};

const logJobFailure = (jobId, jobType, error, details = {}) => {
    logger.error("Job failed", {
        jobId,
        jobType,
        error: error.message,
        stack: error.stack,
        category: "job",
        status: "failed",
        ...details,
    });
};

// Metrics and analytics logging
const logMetric = (name, value, unit = "count", details = {}) => {
    logger.info("Metric recorded", {
        metricName: name,
        metricValue: value,
        metricUnit: unit,
        category: "metrics",
        ...details,
    });
};

// Health check logging
const logHealthCheck = (service, status, responseTime, details = {}) => {
    const level = status === "healthy" ? "info" : "warn";
    logger[level](`Health check: ${service}`, {
        service,
        status,
        responseTime: `${responseTime}ms`,
        category: "health",
        ...details,
    });
};

// Audit logging for compliance
const logAuditEvent = (action, userId, resource, details = {}) => {
    logger.info("Audit event", {
        action,
        userId,
        resource,
        category: "audit",
        timestamp: new Date().toISOString(),
        ...details,
    });
};

// Error tracking with context
const logErrorWithContext = (error, context = {}) => {
    logger.error("Application error", {
        error: error.message,
        stack: error.stack,
        category: "application_error",
        ...context,
    });
};

// Streaming logger for high-volume logging
class StreamingLogger {
    constructor(options = {}) {
        this.buffer = [];
        this.bufferSize = options.bufferSize || 100;
        this.flushInterval = options.flushInterval || 5000;
        this.logger = createServiceLogger(options.service || "Stream");

        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    log(level, message, meta = {}) {
        this.buffer.push({ level, message, meta, timestamp: Date.now() });

        if (this.buffer.length >= this.bufferSize) {
            this.flush();
        }
    }

    flush() {
        if (this.buffer.length === 0) { return; }

        const logs = this.buffer.splice(0);
        this.logger.info("Batch log flush", {
            count: logs.length,
            logs: logs,
        });
    }

    destroy() {
        clearInterval(this.flushTimer);
        this.flush();
    }
}

// Legacy compatibility
const createLegacyLogger = serviceName => {
    return {
        info: (message, meta) => logger.info(message, { service: serviceName, ...meta }),
        warn: (message, meta) => logger.warn(message, { service: serviceName, ...meta }),
        error: (message, meta) => logger.error(message, { service: serviceName, ...meta }),
        debug: (message, meta) => logger.debug(message, { service: serviceName, ...meta }),
    };
};

module.exports = {
    // Main exports
    logger,
    createLogger,
    createServiceLogger,
    createLegacyLogger,

    // Middleware
    requestLoggerMiddleware,

    // Helpers
    generateRequestId,
    setContext,

    // Structured logging
    logUserAction,
    logApiError,
    logBusinessEvent,
    logPerformance,
    logSecurity,
    logExternalService,

    // Database logging
    logDatabaseQuery,
    logDatabaseError,

    // Job logging
    logJobStart,
    logJobComplete,
    logJobFailure,

    // Metrics and health
    logMetric,
    logHealthCheck,

    // Audit and error tracking
    logAuditEvent,
    logErrorWithContext,

    // Streaming
    StreamingLogger,

    // Constants
    LOG_LEVELS: ["error", "warn", "info", "debug"],
    LOG_CATEGORIES: [
        "user_action",
        "api_error",
        "business",
        "performance",
        "security",
        "external_service",
        "database",
        "job",
        "metrics",
        "health",
        "audit",
        "application_error",
    ],
};
