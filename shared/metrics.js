/**
 * Prometheus Metrics Middleware for Node.js Services
 *
 * Provides HTTP request metrics, custom business metrics,
 * and system metrics for observability.
 */

const client = require("prom-client");

class MetricsService {
    constructor(serviceName = "node-service") {
        this.serviceName = serviceName;
        this.register = new client.Registry();

        client.collectDefaultMetrics({ register: this.register, prefix: `${serviceName}_` });

        this.setupHttpMetrics();
        this.setupBusinessMetrics();
    }

    setupHttpMetrics() {
        this.httpRequestDuration = new client.Histogram({
            name: "http_request_duration_seconds",
            help: "Duration of HTTP requests in seconds",
            labelNames: ["method", "route", "status_code"],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
        });

        this.httpRequestTotal = new client.Counter({
            name: "http_requests_total",
            help: "Total number of HTTP requests",
            labelNames: ["method", "route", "status_code"],
        });

        this.httpRequestInFlight = new client.Gauge({
            name: "http_requests_in_flight",
            help: "Number of HTTP requests currently being processed",
            labelNames: ["method", "route"],
        });
    }

    setupBusinessMetrics() {
        this.dbQueryDuration = new client.Histogram({
            name: "db_query_duration_seconds",
            help: "Duration of database queries in seconds",
            labelNames: ["query_type", "table"],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
        });

        this.dbQueryErrors = new client.Counter({
            name: "db_query_errors_total",
            help: "Total number of database query errors",
            labelNames: ["query_type", "table", "error_code"],
        });

        this.queueMessagesProcessed = new client.Counter({
            name: "queue_messages_processed_total",
            help: "Total number of queue messages processed",
            labelNames: ["queue", "status"],
        });

        this.queueProcessingDuration = new client.Histogram({
            name: "queue_processing_duration_seconds",
            help: "Duration of queue message processing in seconds",
            labelNames: ["queue"],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10],
        });

        this.cacheHits = new client.Counter({
            name: "cache_hits_total",
            help: "Total number of cache hits",
            labelNames: ["cache_name"],
        });

        this.cacheMisses = new client.Counter({
            name: "cache_misses_total",
            help: "Total number of cache misses",
            labelNames: ["cache_name"],
        });

        this.activeUsers = new client.Gauge({
            name: "active_users",
            help: "Number of currently active users",
            labelNames: ["service"],
        });

        this.jobsProcessed = new client.Counter({
            name: "jobs_processed_total",
            help: "Total number of background jobs processed",
            labelNames: ["job_type", "status"],
        });
    }

    middleware() {
        return (req, res, next) => {
            const start = process.hrtime();
            const route = req.route?.path || req.path || "unknown";

            this.httpRequestInFlight.inc({ method: req.method, route });

            res.on("finish", () => {
                const duration = process.hrtime(start);
                const durationSeconds = duration[0] + duration[1] / 1e9;

                this.httpRequestInFlight.dec({ method: req.method, route });
                this.httpRequestDuration.observe({
                    method: req.method,
                    route,
                    status_code: res.statusCode,
                });
                this.httpRequestTotal.inc({
                    method: req.method,
                    route,
                    status_code: res.statusCode,
                });
            });

            next();
        };
    }

    trackDbQuery(queryType, table) {
        const start = process.hrtime();

        return {
            end: error => {
                const duration = process.hrtime(start);
                const durationSeconds = duration[0] + duration[1] / 1e9;

                this.dbQueryDuration.observe({ query_type: queryType, table });

                if (error) {
                    this.dbQueryErrors.inc({
                        query_type: queryType,
                        table,
                        error_code: error.code || "UNKNOWN",
                    });
                }
            },
        };
    }

    trackCache(cacheName) {
        return {
            hit: () => this.cacheHits.inc({ cache_name: cacheName }),
            miss: () => this.cacheMisses.inc({ cache_name: cacheName }),
        };
    }

    trackQueue(queueName) {
        const start = process.hrtime();

        return {
            processed: status => {
                const duration = process.hrtime(start);
                const durationSeconds = duration[0] + duration[1] / 1e9;

                this.queueMessagesProcessed.inc({ queue: queueName, status });
                this.queueProcessingDuration.observe({ queue: queueName });
            },
        };
    }

    trackJob(jobType) {
        return {
            processed: status => this.jobsProcessed.inc({ job_type: jobType, status }),
        };
    }

    setActiveUsers(count) {
        this.activeUsers.set({ service: this.serviceName }, count);
    }

    getMetrics() {
        return this.register.metrics();
    }

    getContentType() {
        return this.register.contentType;
    }
}

const metricsInstances = new Map();

const getMetrics = serviceName => {
    if (!metricsInstances.has(serviceName)) {
        metricsInstances.set(serviceName, new MetricsService(serviceName));
    }
    return metricsInstances.get(serviceName);
};

module.exports = {
    MetricsService,
    getMetrics,
};
