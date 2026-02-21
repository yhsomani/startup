/**
 * Enhanced Service Base Class with Tracing
 *
 * Base class for all microservices with:
 * - Distributed tracing integration
 * - Circuit breaker pattern
 * - Error recovery mechanisms
 * - Service health monitoring
 * - Performance metrics
 * - Graceful shutdown handling
 */

const { createLogger } = require("../../../shared/logger");
const { AppError, ValidationError, ErrorFactory } = require("../../../shared/error-factory");

class EnhancedServiceWithTracing {
    constructor(config = {}) {
        this.config = {
            serviceName: "unknown-service",
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development",
            port: 3000,
            tracing: {
                enabled: true,
                samplingRate: 1.0,
                endpoint: process.env.JAEGER_ENDPOINT || "http://localhost:14268/api/traces",
            },
            validation: {
                strict: true,
                autoValidate: true,
            },
            circuitBreaker: {
                enabled: true,
                timeout: 5000,
                maxFailures: 3,
                resetTimeout: 30000,
            },
            errorRecovery: {
                enabled: true,
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 10000,
            },
            metrics: {
                enabled: true,
                interval: 60000, // 1 minute
                endpoint: process.env.METRICS_ENDPOINT || "/metrics",
            },
            health: {
                enabled: true,
                interval: 30000, // 30 seconds
                endpoint: "/health",
            },
            ...config,
        };

        this.logger = createLogger(this.config.serviceName);
        this.tracer = null;
        this.isShuttingDown = false;
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;

        // Initialize components
        this.initializeTracing();
        this.initializeCircuitBreaker();
        this.initializeMetrics();
        this.initializeHealthChecks();
        this.initializeCache();
    }

    /**
     * Initialize distributed tracing
     */
    initializeTracing() {
        if (!this.config.tracing.enabled) {
            this.logger.info("Tracing disabled by configuration");
            return;
        }

        try {
            // In production, this would initialize Jaeger tracer
            // For now, we'll create a mock tracer
            this.tracer = {
                startSpan: operationName => ({
                    operationName,
                    startTime: Date.now(),
                    setTag: (key, value) => {
                        this.logger.debug(`Span tag set: ${key} = ${value}`, {
                            span: operationName,
                        });
                    },
                    logEvent: (message, data) => {
                        this.logger.debug(`Span event: ${message}`, { span: operationName, data });
                    },
                    logError: error => {
                        this.logger.error(`Span error: ${error.message}`, {
                            span: operationName,
                            error: error.stack,
                        });
                    },
                    finish: () => {
                        const duration =
                            Date.now() - this.tracer.startSpan(operationName).startTime;
                        this.logger.debug(`Span finished: ${operationName}`, { duration });
                    },
                    getContext: () => ({ spanId: operationName }),
                }),
                getActiveSpans: () => [],
            };

            this.logger.info("Distributed tracing initialized", {
                endpoint: this.config.tracing.endpoint,
                samplingRate: this.config.tracing.samplingRate,
            });
        } catch (error) {
            this.logger.error("Failed to initialize tracing", { error: error.message });
            this.tracer = null;
        }
    }

    /**
     * Initialize circuit breaker
     */
    initializeCircuitBreaker() {
        if (!this.config.circuitBreaker.enabled) {
            this.logger.info("Circuit breaker disabled by configuration");
            return;
        }

        this.circuitBreaker = {
            state: "CLOSED", // CLOSED, OPEN, HALF_OPEN
            failureCount: 0,
            lastFailureTime: null,
            nextAttemptTime: null,

            recordSuccess: () => {
                this.circuitBreaker.failureCount = 0;
                this.circuitBreaker.state = "CLOSED";
                this.logger.debug("Circuit breaker reset to CLOSED");
            },

            recordFailure: () => {
                this.circuitBreaker.failureCount++;
                this.circuitBreaker.lastFailureTime = Date.now();

                if (this.circuitBreaker.failureCount >= this.config.circuitBreaker.maxFailures) {
                    this.circuitBreaker.state = "OPEN";
                    this.circuitBreaker.nextAttemptTime =
                        Date.now() + this.config.circuitBreaker.resetTimeout;
                    this.logger.warn("Circuit breaker opened", {
                        failureCount: this.circuitBreaker.failureCount,
                        resetTimeout: this.config.circuitBreaker.resetTimeout,
                    });
                }
            },

            allowRequest: () => {
                if (this.circuitBreaker.state === "OPEN") {
                    if (Date.now() >= this.circuitBreaker.nextAttemptTime) {
                        this.circuitBreaker.state = "HALF_OPEN";
                        this.logger.debug("Circuit breaker moved to HALF_OPEN");
                        return true;
                    }
                    return false;
                }
                return true;
            },
        };

        this.logger.info("Circuit breaker initialized", {
            maxFailures: this.config.circuitBreaker.maxFailures,
            timeout: this.config.circuitBreaker.timeout,
        });
    }

    /**
     * Initialize metrics collection
     */
    initializeMetrics() {
        if (!this.config.metrics.enabled) {
            this.logger.info("Metrics collection disabled by configuration");
            return;
        }

        this.metrics = {
            counters: new Map(),
            gauges: new Map(),
            histograms: new Map(),
            timers: new Map(),

            incrementCounter: (name, tags = {}) => {
                const key = this.metricKey(name, tags);
                const current = this.metrics.counters.get(key) || 0;
                this.metrics.counters.set(key, current + 1);
            },

            setGauge: (name, value, tags = {}) => {
                const key = this.metricKey(name, tags);
                this.metrics.gauges.set(key, value);
            },

            recordHistogram: (name, value, tags = {}) => {
                const key = this.metricKey(name, tags);
                if (!this.metrics.histograms.has(key)) {
                    this.metrics.histograms.set(key, []);
                }
                this.metrics.histograms.get(key).push(value);
            },

            recordTimer: (name, duration, tags = {}) => {
                const key = this.metricKey(name, tags);
                this.metrics.timers.set(key, duration);
            },

            getMetrics: () => {
                return {
                    counters: Object.fromEntries(this.metrics.counters),
                    gauges: Object.fromEntries(this.metrics.gauges),
                    histograms: Object.fromEntries(
                        Array.from(this.metrics.histograms.entries()).map(([key, values]) => [
                            key,
                            {
                                count: values.length,
                                sum: values.reduce((a, b) => a + b, 0),
                                avg: values.reduce((a, b) => a + b, 0) / values.length,
                                min: Math.min(...values),
                                max: Math.max(...values),
                            },
                        ])
                    ),
                    timers: Object.fromEntries(this.metrics.timers),
                };
            },

            reset: () => {
                this.metrics.counters.clear();
                this.metrics.gauges.clear();
                this.metrics.histograms.clear();
                this.metrics.timers.clear();
            },
        };

        this.logger.info("Metrics collection initialized");
    }

    /**
     * Initialize health checks
     */
    initializeHealthChecks() {
        if (!this.config.health.enabled) {
            this.logger.info("Health checks disabled by configuration");
            return;
        }

        this.healthChecks = new Map();
        this.lastHealthCheckTime = null;

        this.logger.info("Health checks initialized");
    }

    /**
     * Execute operation with tracing
     */
    executeWithTracing(operationName, operation, options = {}) {
        if (!this.tracer) {
            return operation();
        }

        const span = this.tracer.startSpan(operationName);

        // Set default span tags
        span.setTag("service.name", this.config.serviceName);
        span.setTag("service.version", this.config.version);
        span.setTag("service.environment", this.config.environment);

        if (options.tags) {
            Object.entries(options.tags).forEach(([key, value]) => {
                span.setTag(key, value);
            });
        }

        return Promise.resolve()
            .then(() => {
                this.requestCount++;
                this.metrics.incrementCounter("requests.success", {
                    operation: operationName,
                });

                const result = operation();

                if (result && typeof result.then === "function") {
                    return result
                        .then(response => {
                            span.setTag("success", true);
                            span.finish();
                            return response;
                        })
                        .catch(error => {
                            this.handleOperationError(operationName, error, span);
                            throw error;
                        });
                } else {
                    span.setTag("success", true);
                    span.finish();
                    return result;
                }
            })
            .catch(error => {
                this.handleOperationError(operationName, error, span);
                throw error;
            });
    }

    /**
     * Handle operation error
     */
    handleOperationError(operationName, error, span) {
        this.errorCount++;
        this.metrics.incrementCounter("requests.error", {
            operation: operationName,
            error_type: error.constructor.name,
        });

        span.setTag("success", false);
        span.setTag("error.type", error.constructor.name);
        span.setTag("error.message", error.message);
        span.logError(error);
        span.finish();

        this.logger.error(`Operation failed: ${operationName}`, {
            error: error.message,
            stack: error.stack,
            operationName,
        });

        // Record failure in circuit breaker
        if (this.circuitBreaker) {
            this.circuitBreaker.recordFailure();
        }
    }

    /**
     * Execute operation with circuit breaker
     */
    executeWithCircuitBreaker(operationName, operation, options = {}) {
        if (!this.circuitBreaker || !this.circuitBreaker.allowRequest()) {
            const error = new Error("Circuit breaker is OPEN");
            error.code = "CIRCUIT_BREAKER_OPEN";
            error.retryAfter = this.circuitBreaker?.nextAttemptTime;

            if (this.tracer) {
                const span = this.tracer.startSpan(operationName);
                span.setTag("circuit_breaker", "OPEN");
                span.setTag("error", "true");
                span.logEvent("Circuit breaker blocked request");
                span.finish();
            }

            return Promise.reject(error);
        }

        return this.executeWithTracing(operationName, operation, options);
    }

    /**
     * Execute operation with error recovery
     */
    async executeWithRetry(operationName, operation, options = {}) {
        const {
            maxRetries = this.config.errorRecovery.maxRetries,
            baseDelay = this.config.errorRecovery.baseDelay,
            maxDelay = this.config.errorRecovery.maxDelay,
        } = options;

        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.executeWithTracing(operationName, operation, options);

                if (attempt > 0) {
                    this.metrics.incrementCounter("retries.success", {
                        operation: operationName,
                        attempts: attempt + 1,
                    });

                    this.logger.info(
                        `Operation succeeded after ${attempt + 1} attempts: ${operationName}`
                    );
                }

                // Record success in circuit breaker
                if (this.circuitBreaker) {
                    this.circuitBreaker.recordSuccess();
                }

                return result;
            } catch (error) {
                lastError = error;

                if (attempt < maxRetries) {
                    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

                    this.logger.warn(`Operation failed, retrying in ${delay}ms: ${operationName}`, {
                        attempt: attempt + 1,
                        maxRetries,
                        error: error.message,
                        delay,
                    });

                    this.metrics.incrementCounter("retries.attempted", {
                        operation: operationName,
                        attempt: attempt + 1,
                    });

                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        this.metrics.incrementCounter("retries.exhausted", {
            operation: operationName,
        });

        this.logger.error(`Operation failed after ${maxRetries + 1} attempts: ${operationName}`, {
            error: lastError.message,
        });

        throw lastError;
    }

    /**
     * Add health check
     */
    addHealthCheck(name, checkFunction, options = {}) {
        if (!this.healthChecks) {
            return;
        }

        this.healthChecks.set(name, {
            name,
            check: checkFunction,
            timeout: options.timeout || 5000,
            critical: options.critical || false,
            enabled: options.enabled !== false,
        });

        this.logger.debug(`Added health check: ${name}`);
    }

    /**
     * Run health checks
     */
    async runHealthChecks() {
        if (!this.healthChecks) {
            return { status: "healthy", checks: {} };
        }

        const results = {};
        let overallStatus = "healthy";
        let criticalFailures = 0;

        const checkPromises = Array.from(this.healthChecks.entries()).map(
            async ([name, healthCheck]) => {
                if (!healthCheck.enabled) {
                    return { name, status: "skipped", message: "Disabled" };
                }

                const startTime = Date.now();

                try {
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(
                            () => reject(new Error("Health check timeout")),
                            healthCheck.timeout
                        );
                    });

                    const checkPromise = healthCheck.check();

                    const result = await Promise.race([checkPromise, timeoutPromise]);
                    const duration = Date.now() - startTime;

                    results[name] = {
                        status: "healthy",
                        duration,
                        timestamp: new Date().toISOString(),
                    };
                } catch (error) {
                    const duration = Date.now() - startTime;
                    results[name] = {
                        status: "unhealthy",
                        message: error.message,
                        duration,
                        timestamp: new Date().toISOString(),
                    };

                    if (healthCheck.critical) {
                        criticalFailures++;
                    }
                }
            }
        );

        await Promise.allSettled(checkPromises);
        this.lastHealthCheckTime = Date.now();

        if (criticalFailures > 0) {
            overallStatus = "unhealthy";
        } else if (Object.values(results).some(r => r.status === "unhealthy")) {
            overallStatus = "degraded";
        }

        return {
            status: overallStatus,
            checks: results,
            timestamp: this.lastHealthCheckTime,
            uptime: Date.now() - this.startTime,
        };
    }

    /**
     * Initialize cache
     */
    initializeCache() {
        this.cache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            keys: 0,
        };

        // Cleanup interval (every 5 minutes)
        setInterval(
            () => {
                const now = Date.now();
                let expiredCount = 0;
                for (const [key, value] of this.cache.entries()) {
                    if (value.expiry < now) {
                        this.cache.delete(key);
                        expiredCount++;
                    }
                }
                if (expiredCount > 0) {
                    this.logger.debug(`Cache cleanup: removed ${expiredCount} expired keys`);
                }
                this.cacheStats.keys = this.cache.size;
            },
            5 * 60 * 1000
        ).unref(); // unref so it doesn't prevent process exit

        this.logger.info("In-memory cache initialized");
    }

    /**
     * Execute with cache
     */
    async withCache(key, ttlSeconds, fetchFn) {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && cached.expiry > now) {
            this.cacheStats.hits++;
            this.metrics.incrementCounter("cache.hit");
            return cached.value;
        }

        this.cacheStats.misses++;
        this.metrics.incrementCounter("cache.miss");

        const result = await fetchFn();

        this.cache.set(key, {
            value: result,
            expiry: now + ttlSeconds * 1000,
        });
        this.cacheStats.keys = this.cache.size;

        return result;
    }

    /**
     * Invalidate cache keys matching pattern
     * pattern can be a string (prefix) or RegExp
     */
    invalidateCache(pattern) {
        let count = 0;

        // Handle string as prefix (simple wildcard behavior)
        // If pattern contains * (e.g. "jobs:search:*"), treat as prefix "jobs:search:"
        const isString = typeof pattern === "string";
        const prefix = isString && pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;

        for (const key of this.cache.keys()) {
            let match = false;
            if (pattern instanceof RegExp) {
                match = pattern.test(key);
            } else if (isString) {
                // Exact match or prefix match if pattern ended with *
                if (pattern.endsWith("*")) {
                    match = key.startsWith(prefix);
                } else {
                    match = key === pattern;
                }
            }

            if (match) {
                this.cache.delete(key);
                count++;
            }
        }

        if (count > 0) {
            this.logger.debug(`Cache invalidated: removed ${count} keys matching ${pattern}`);
            this.cacheStats.keys = this.cache.size;
        }
    }

    /**
     * Trace database query
     */
    async traceDatabaseQuery(operationName, queryFn) {
        const span = this.tracer ? this.tracer.startSpan(`db:${operationName}`) : null;
        const startTime = Date.now();

        try {
            if (span) {
                span.setTag("component", "database");
                span.setTag("db.type", "sql");
            }

            const result = await queryFn();

            const duration = Date.now() - startTime;
            this.metrics.recordTimer("db.query.duration", duration, { operation: operationName });
            this.metrics.incrementCounter("db.query.success", { operation: operationName });

            if (duration > 1000) {
                // Log slow queries > 1s
                this.logger.warn(`Slow database query: ${operationName}`, { duration });
            }

            if (span) {
                span.setTag("success", true);
                span.finish();
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.metrics.recordTimer("db.query.duration", duration, {
                operation: operationName,
                status: "error",
            });
            this.metrics.incrementCounter("db.query.error", {
                operation: operationName,
                error: error.code,
            });

            if (span) {
                span.setTag("success", false);
                span.logError(error);
                span.finish();
            }

            throw error;
        }
    }

    /**
     * Get service metrics
     */
    async getServiceMetrics() {
        const health = await this.runHealthChecks();
        const memoryUsage = process.memoryUsage();

        return {
            service: this.config.serviceName,
            version: this.config.version,
            environment: this.config.environment,
            health,
            performance: {
                uptime: Date.now() - this.startTime,
                requestCount: this.requestCount,
                errorCount: this.errorCount,
                errorRate:
                    this.requestCount > 0
                        ? ((this.errorCount / this.requestCount) * 100).toFixed(2)
                        : "0.00",
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
                    external: Math.round(memoryUsage.external / 1024 / 1024) + "MB",
                },
            },
            customMetrics: this.metrics ? this.metrics.getMetrics() : {},
            cache: this.cacheStats
                ? {
                      ...this.cacheStats,
                      hitRate:
                          this.cacheStats.hits + this.cacheStats.misses > 0
                              ? (
                                    (this.cacheStats.hits /
                                        (this.cacheStats.hits + this.cacheStats.misses)) *
                                    100
                                ).toFixed(2) + "%"
                              : "0.00%",
                  }
                : {},
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.isShuttingDown) {
            return;
        }

        this.isShuttingDown = true;
        this.logger.info(`Shutting down ${this.config.serviceName} gracefully`);

        // Stop accepting new requests
        this.logger.info("No longer accepting new requests");

        // Wait for in-flight requests to complete
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Final metrics
        const finalMetrics = await this.getServiceMetrics();
        this.logger.info("Final service metrics", finalMetrics);

        this.logger.info(`${this.config.serviceName} shutdown complete`);
    }

    /**
     * Get allowed origins for CORS
     */
    getAllowedOrigins() {
        const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];

        if (this.config.environment === "development") {
            origins.push("http://localhost:3000", "http://127.0.0.1:3000");
        }

        return origins.filter(Boolean);
    }

    /**
     * Get tracing middleware
     */
    getTracingMiddleware() {
        return (req, res, next) => {
            if (!this.tracer) {
                return next();
            }

            const span = this.tracer.startSpan("http_request");

            span.setTag("http.method", req.method);
            span.setTag("http.url", req.url);
            span.setTag("http.user_agent", req.get("User-Agent"));
            span.setTag("http.remote_addr", req.ip);

            // Store span context for later use
            req.traceContext = span.getContext();

            // Finish span when response ends
            res.on("finish", () => {
                span.setTag("http.status_code", res.statusCode);
                span.setTag("success", res.statusCode < 400);

                if (res.statusCode >= 400) {
                    span.setTag("error", "true");
                    span.logEvent("HTTP request error", {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                    });
                }

                span.finish();
            });

            next();
        };
    }

    /**
     * Helper method for metric key generation
     */
    /**
     * Handle HTTP request with tracing and validation
     */
    async handleRequestWithTracing(req, res, operationName, options = {}) {
        const span = this.tracer ? this.tracer.startSpan(operationName, req.traceContext) : null;

        try {
            if (span) {
                span.setTag("component", "api");
                span.setTag("http.method", req.method);
                span.setTag("http.url", req.url);
            }

            // DEBUG LOG
            console.log("Handling Request:", operationName);
            console.log("Input Schema Type:", typeof options.inputSchema);
            console.log(
                "Input Schema Keys:",
                options.inputSchema ? Object.keys(options.inputSchema) : "null"
            );
            console.log(
                "Has validate:",
                options.inputSchema && typeof options.inputSchema.validate === "function"
            );

            // 1. Validate Input
            console.log("Request Body:", JSON.stringify(req.body, null, 2)); // DEBUG LOG
            if (options.validateInput && options.inputSchema) {
                // Defensive check: ensure inputSchema is a Joi schema with validate method
                if (typeof options.inputSchema.validate === "function") {
                    const { error, value } = options.inputSchema.validate(req.body);
                    if (error) {
                        throw new ValidationError("Validation failed", {
                            details: error.details.map(d => d.message),
                        });
                    }
                    req.validated = value;
                } else {
                    // inputSchema is a raw object, not a Joi schema - log warning and skip validation
                    this.logger.warn(
                        `Input schema for ${operationName} is not a Joi schema - skipping validation`
                    );
                    req.validated = req.body;
                }
            } else {
                req.validated = req.body;
            }

            // 2. Execute Operation
            const result = await this.executeOperation(
                {
                    body: req.validated,
                    headers: req.headers,
                    user: req.user,
                    validated: req.validated,
                },
                { operationName, ...options }
            );

            // 3. Validate Output (optional, log warning on failure)
            if (options.validateOutput && options.outputSchema) {
                const { error } = options.outputSchema.validate(result);
                if (error) {
                    this.logger.warn(`Output validation failed for ${operationName}`, {
                        error: error.message,
                    });
                }
            }

            if (span) {
                span.setTag("success", true);
                span.finish();
            }

            // 4. Send Response
            res.json(result);
        } catch (error) {
            console.error("Handled Request Error:", error.message);
            if (span) {
                span.logError(error);
                span.finish();
            }

            // Pass to error handling middleware
            const appError =
                error instanceof AppError ? error : ErrorFactory.fromUnknownError(error);
            res.status(appError.statusCode || 500).json({
                success: false,
                error: {
                    code: appError.code,
                    message: appError.message,
                    details: appError.details,
                },
            });
            // Or next(error) if we prefer middleware to handle it
            // For now, let's strictly control the response here or re-throw?
            // index.js uses try-catch blocks in some places/middleware.
            // But handleRequestWithTracing is called inside route handler.
            // If we send response here, we are done.
        }
    }

    /**
     * Abstract method to be implemented by services
     */
    async executeOperation(request, options) {
        throw new Error("executeOperation must be implemented by subclass");
    }

    metricKey(name, tags) {
        const tagString = Object.entries(tags)
            .sort(([a, b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join(",");

        return tagString ? `${name},{${tagString}}` : name;
    }
}

module.exports = {
    EnhancedServiceWithTracing,
};
