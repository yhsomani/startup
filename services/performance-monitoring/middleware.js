const axios = require('axios');

/**
 * Performance Monitoring Middleware
 * Integrates with the central performance monitoring service
 */
class PerformanceMonitorMiddleware {
    constructor(options = {}) {
        this.options = {
            monitoringServiceUrl: options.monitoringServiceUrl || 'http://localhost:3008',
            serviceName: options.serviceName || 'unknown-service',
            enabled: options.enabled !== false,
            logLevel: options.logLevel || 'info',
            ...options
        };

        this.metricsBuffer = [];
        this.batchSize = 50;
        this.flushInterval = 5000; // 5 seconds

        if (this.options.enabled) {
            this.startBatchProcessing();
        }
    }

    /**
     * Express middleware to monitor request performance
     */
    monitorRequests() {
        return (req, res, next) => {
            if (!this.options.enabled) {
                return next();
            }

            const startTime = process.hrtime.bigint();
            const requestId = this.generateRequestId();

            // Store request context
            req.performanceContext = {
                id: requestId,
                startTime,
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent')
            };

            // Capture response finish
            const originalSend = res.send;
            res.send = (body) => {
                this.recordRequestMetrics(req, res, body);
                return originalSend.call(res, body);
            };

            next();
        };
    }

    /**
     * Record request metrics
     */
    recordRequestMetrics(req, res, responseBody) {
        if (!req.performanceContext) {return;}

        const endTime = process.hrtime.bigint();
        const durationNs = endTime - req.performanceContext.startTime;
        const durationMs = Number(durationNs) / 1000000;

        const metrics = {
            requestId: req.performanceContext.id,
            service: this.options.serviceName,
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: durationMs,
            userAgent: req.performanceContext.userAgent,
            contentLength: Buffer.byteLength(JSON.stringify(responseBody || '')),
            ip: req.ip || req.connection.remoteAddress
        };

        this.bufferMetric(metrics);

        // Log slow requests
        if (durationMs > 1000) { // 1 second threshold
            console.warn(`Slow request detected: ${req.method} ${req.url} - ${durationMs.toFixed(2)}ms`);
        }
    }

    /**
     * Buffer metrics for batch processing
     */
    bufferMetric(metric) {
        this.metricsBuffer.push(metric);

        // Flush if buffer is full
        if (this.metricsBuffer.length >= this.batchSize) {
            this.flushMetrics();
        }
    }

    /**
     * Start batch processing interval
     */
    startBatchProcessing() {
        setInterval(() => {
            if (this.metricsBuffer.length > 0) {
                this.flushMetrics();
            }
        }, this.flushInterval);
    }

    /**
     * Flush buffered metrics to monitoring service
     */
    async flushMetrics() {
        if (this.metricsBuffer.length === 0) {return;}

        const metricsToSend = [...this.metricsBuffer];
        this.metricsBuffer = [];

        try {
            await axios.post(`${this.options.monitoringServiceUrl}/api/v1/performance/batch`, {
                metrics: metricsToSend,
                service: this.options.serviceName
            }, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Failed to send metrics to monitoring service:', error.message);
            // Re-buffer failed metrics (optional - depends on requirements)
        }
    }

    /**
     * Manual metric recording for custom events
     */
    recordCustomMetric(name, value, labels = {}) {
        if (!this.options.enabled) {return;}

        const metric = {
            name,
            value,
            labels,
            service: this.options.serviceName,
            timestamp: new Date().toISOString()
        };

        this.bufferMetric({
            type: 'custom',
            metric,
            service: this.options.serviceName,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Record database query performance
     */
    recordDatabaseQuery(query, durationMs, success = true, error = null) {
        if (!this.options.enabled) {return;}

        const metric = {
            type: 'database-query',
            query: query.substring(0, 200), // Limit query length
            duration: durationMs,
            success,
            error: error ? error.message : null,
            service: this.options.serviceName,
            timestamp: new Date().toISOString()
        };

        this.bufferMetric(metric);
    }

    /**
     * Record external API call performance
     */
    recordExternalCall(url, durationMs, statusCode, success = true) {
        if (!this.options.enabled) {return;}

        const metric = {
            type: 'external-call',
            url: url.substring(0, 200), // Limit URL length
            duration: durationMs,
            statusCode,
            success,
            service: this.options.serviceName,
            timestamp: new Date().toISOString()
        };

        this.bufferMetric(metric);
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Graceful shutdown - flush remaining metrics
     */
    async shutdown() {
        if (this.metricsBuffer.length > 0) {
            await this.flushMetrics();
        }
    }
}

/**
 * Factory function to create middleware instances
 */
function createPerformanceMonitor(options = {}) {
    return new PerformanceMonitorMiddleware(options);
}

module.exports = {
    PerformanceMonitorMiddleware,
    createPerformanceMonitor
};