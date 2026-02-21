/**
 * Base Service Class
 * Simplified base class for microservices
 */

class BaseService {
    constructor(config = {}) {
        this.config = {
            serviceName: config.serviceName || "base-service",
            version: config.version || "1.0.0",
            environment: config.environment || process.env.NODE_ENV || "development",
            port: config.port || process.env.PORT || 3000,
            ...config,
        };

        this.logger = {
            info: (message, meta = {}) =>
                console.log(`[INFO] ${this.config.serviceName}: ${message}`, meta),
            error: (message, meta = {}) =>
                console.error(`[ERROR] ${this.config.serviceName}: ${message}`, meta),
            warn: (message, meta = {}) =>
                console.warn(`[WARN] ${this.config.serviceName}: ${message}`, meta),
            debug: (message, meta = {}) =>
                console.debug(`[DEBUG] ${this.config.serviceName}: ${message}`, meta),
        };

        this.tracer = {
            startSpan: (name, context) => ({
                setTag: (key, value) => {},
                logEvent: event => {},
                logError: error => {},
                finish: () => {},
            }),
            getActiveSpans: () => [],
            getTracingMiddleware: () => (req, res, next) => {
                req.traceId = require("uuid").v4();
                req.traceContext = { spanId: req.traceId };
                next();
            },
        };
    }

    async executeWithTracing(operationName, fn) {
        const span = this.tracer.startSpan(operationName);
        try {
            const result = await fn();
            span.finish();
            return result;
        } catch (error) {
            span.logError(error);
            span.finish();
            throw error;
        }
    }

    async handleRequestWithTracing(req, res, operationName, options = {}) {
        const span = this.tracer.startSpan(operationName, req.traceContext);

        try {
            req.span = span;

            // Input validation if enabled
            if (options.validateInput && this.validationSchemas) {
                const schema = this.validationSchemas[operationName.split(".")[1]];
                if (schema) {
                    this.validateInput(req.body, schema);
                }
            }

            // Execute the operation
            const result = await this.executeOperation(req, {
                operationName,
                ...options,
            });

            // Output validation if enabled
            if (options.validateOutput && options.outputSchema) {
                // Simple validation placeholder
                console.log("Output validation would happen here");
            }

            res.json({
                success: true,
                data: result,
                meta: {
                    requestId: req.requestId,
                    correlationId: req.correlationId,
                    timestamp: new Date().toISOString(),
                    service: this.config.serviceName,
                },
            });
        } catch (error) {
            span.logError(error);

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
        } finally {
            span.finish();
        }
    }

    async executeOperation(request, options) {
        throw new Error("executeOperation must be implemented by subclass");
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
            database: this.db ? "connected" : "disconnected",
        };
    }

    getTracingMetrics() {
        return {
            service: this.config.serviceName,
            metrics: {
                totalRequests: 0,
                errorRate: 0,
                averageResponseTime: 0,
            },
        };
    }

    getTracingMiddleware() {
        return this.tracer.getTracingMiddleware();
    }

    validateInput(data, schema) {
        if (!data) data = {};

        // Check required fields
        if (schema.required) {
            for (const field of schema.required) {
                if (!data[field] || !schema.fields[field](data[field])) {
                    throw new Error(`Invalid ${field}`);
                }
            }
        }

        // Check optional fields
        if (schema.optional) {
            for (const field of schema.optional) {
                if (data[field] && !schema.fields[field](data[field])) {
                    throw new Error(`Invalid ${field}`);
                }
            }
        }
    }
}

module.exports = {
    BaseService,
};
