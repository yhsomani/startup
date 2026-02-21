const client = require('prom-client');
const winston = require('winston');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class PerformanceMonitoringService {
    constructor(options = {}) {
        this.options = {
            // Collection intervals
            metricsCollectionInterval: options.metricsCollectionInterval || 10000, // 10 seconds
            healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds

            // Alerting thresholds
            responseTimeThreshold: options.responseTimeThreshold || 1000, // 1 second
            errorRateThreshold: options.errorRateThreshold || 5, // 5%
            cpuUsageThreshold: options.cpuUsageThreshold || 80, // 80%
            memoryUsageThreshold: options.memoryUsageThreshold || 85, // 85%

            // Service discovery
            monitoredServices: options.monitoredServices || [
                { name: 'api-gateway', url: 'http://localhost:3000/health', port: 3000 },
                { name: 'auth-service', url: 'http://localhost:3001/health', port: 3001 },
                { name: 'user-service', url: 'http://localhost:3002/health', port: 3002 },
                { name: 'company-service', url: 'http://localhost:3003/health', port: 3003 },
                { name: 'job-service', url: 'http://localhost:3004/health', port: 3004 },
                { name: 'application-service', url: 'http://localhost:3005/health', port: 3005 },
                { name: 'notification-service', url: 'http://localhost:3006/health', port: 3006 },
                { name: 'search-service', url: 'http://localhost:3007/health', port: 3007 },
                { name: 'analytics-service', url: 'http://localhost:3009/health', port: 3009 },
                { name: 'network-service', url: 'http://localhost:3010/health', port: 3010 },
                { name: 'file-service', url: 'http://localhost:3011/health', port: 3011 },
                { name: 'email-service', url: 'http://localhost:3012/health', port: 3012 },
                { name: 'video-service', url: 'http://localhost:3013/health', port: 3013 },
                { name: 'job-listing-service', url: 'http://localhost:3014/health', port: 3014 },
                { name: 'user-profile-service', url: 'http://localhost:3015/health', port: 3015 }
            ],

            // Storage
            metricsRetentionHours: options.metricsRetentionHours || 24,

            ...options
        };

        // Prometheus metrics registry
        this.register = new client.Registry();
        this.setupPrometheusMetrics();

        // Internal data structures
        this.requestMetrics = new Map();
        this.serviceHealth = new Map();
        this.alerts = [];
        this.performanceBaselines = new Map();

        // Initialize collections
        this.initializeCollections();
    }

    setupPrometheusMetrics() {
        // HTTP request metrics
        this.httpRequestsTotal = new client.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.register]
        });

        this.httpRequestDuration = new client.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.register]
        });

        this.serviceResponseTime = new client.Gauge({
            name: 'service_response_time_seconds',
            help: 'Response time of services in seconds',
            labelNames: ['service'],
            registers: [this.register]
        });

        this.serviceAvailability = new client.Gauge({
            name: 'service_availability',
            help: 'Availability percentage of services',
            labelNames: ['service'],
            registers: [this.register]
        });

        this.activeConnections = new client.Gauge({
            name: 'active_connections',
            help: 'Number of active connections',
            registers: [this.register]
        });

        this.memoryUsage = new client.Gauge({
            name: 'process_memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type'],
            registers: [this.register]
        });

        this.cpuUsage = new client.Gauge({
            name: 'process_cpu_usage_percent',
            help: 'CPU usage percentage',
            registers: [this.register]
        });

        this.errorRate = new client.Gauge({
            name: 'error_rate_percent',
            help: 'Error rate percentage',
            registers: [this.register]
        });
    }

    initializeCollections() {
        // Initialize service health tracking
        this.options.monitoredServices.forEach(service => {
            this.serviceHealth.set(service.name, {
                name: service.name,
                status: 'unknown',
                lastCheck: null,
                uptime: 0,
                responseTime: 0,
                errorCount: 0,
                totalRequests: 0
            });
        });

        // Start collection intervals
        this.startMetricsCollection();
        this.startHealthChecks();
    }

    startMetricsCollection() {
        setInterval(() => {
            this.collectSystemMetrics();
            this.checkAlerts();
        }, this.options.metricsCollectionInterval);
    }

    startHealthChecks() {
        setInterval(async () => {
            await this.performHealthChecks();
        }, this.options.healthCheckInterval);
    }

    async initialize() {
        winston.info('Initializing Performance Monitoring Service...');

        // Perform initial health checks
        await this.performHealthChecks();

        // Collect initial baselines
        await this.collectPerformanceBaselines();

        winston.info('Performance Monitoring Service initialized');
    }

    recordRequest(method, route, statusCode, duration) {
        // Record to Prometheus metrics
        this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
        this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration / 1000);

        // Store for internal tracking
        const key = `${method}:${route}`;
        if (!this.requestMetrics.has(key)) {
            this.requestMetrics.set(key, {
                total: 0,
                successful: 0,
                failed: 0,
                totalTime: 0,
                avgTime: 0,
                errors: []
            });
        }

        const metrics = this.requestMetrics.get(key);
        metrics.total++;
        metrics.totalTime += duration;
        metrics.avgTime = metrics.totalTime / metrics.total;

        if (statusCode >= 200 && statusCode < 400) {
            metrics.successful++;
        } else {
            metrics.failed++;
            metrics.errors.push({
                timestamp: new Date().toISOString(),
                statusCode,
                duration
            });

            // Keep only last 100 errors
            if (metrics.errors.length > 100) {
                metrics.errors = metrics.errors.slice(-100);
            }
        }

        // Check for alerts
        this.checkRequestAlerts(method, route, statusCode, duration);
    }

    checkRequestAlerts(method, route, statusCode, duration) {
        // Response time alert
        if (duration > this.options.responseTimeThreshold) {
            this.createAlert('HIGH_RESPONSE_TIME', {
                method,
                route,
                duration,
                threshold: this.options.responseTimeThreshold
            });
        }

        // Error rate alert
        const key = `${method}:${route}`;
        if (this.requestMetrics.has(key)) {
            const metrics = this.requestMetrics.get(key);
            const errorRate = (metrics.failed / metrics.total) * 100;
            if (errorRate > this.options.errorRateThreshold) {
                this.createAlert('HIGH_ERROR_RATE', {
                    method,
                    route,
                    errorRate,
                    threshold: this.options.errorRateThreshold
                });
            }
        }
    }

    async performHealthChecks() {
        const promises = this.options.monitoredServices.map(async (service) => {
            try {
                const startTime = Date.now();
                const response = await axios.get(service.url, { timeout: 5000 });
                const responseTime = Date.now() - startTime;

                const healthData = {
                    name: service.name,
                    status: response.status === 200 ? 'healthy' : 'degraded',
                    lastCheck: new Date().toISOString(),
                    uptime: this.calculateUptime(service.name),
                    responseTime,
                    errorCount: 0,
                    totalRequests: this.getTotalRequestsForService(service.name)
                };

                this.serviceHealth.set(service.name, healthData);
                this.serviceResponseTime.set({ service: service.name }, responseTime / 1000);
                this.serviceAvailability.set({ service: service.name }, 100);

            } catch (error) {
                const healthData = {
                    name: service.name,
                    status: 'unhealthy',
                    lastCheck: new Date().toISOString(),
                    uptime: this.calculateUptime(service.name),
                    responseTime: 0,
                    errorCount: 1,
                    totalRequests: this.getTotalRequestsForService(service.name)
                };

                this.serviceHealth.set(service.name, healthData);
                this.serviceResponseTime.set({ service: service.name }, 0);
                this.serviceAvailability.set({ service: service.name }, 0);

                this.createAlert('SERVICE_UNHEALTHY', {
                    service: service.name,
                    error: error.message
                });
            }
        });

        await Promise.all(promises);
    }

    calculateUptime(serviceName) {
        // Simple uptime calculation - in production, use proper uptime tracking
        const health = this.serviceHealth.get(serviceName);
        if (!health || health.status === 'unknown') {return 0;}
        return health.status === 'healthy' ? 100 : 95; // Simplified
    }

    getTotalRequestsForService(serviceName) {
        // Estimate requests based on health check frequency and success rate
        const health = this.serviceHealth.get(serviceName);
        if (!health) {return 0;}
        return health.totalRequests || Math.floor(Math.random() * 1000) + 100; // Mock data
    }

    collectSystemMetrics() {
        const memory = process.memoryUsage();
        const cpu = process.cpuUsage();

        // Update Prometheus metrics
        this.memoryUsage.set({ type: 'heap_used' }, memory.heapUsed);
        this.memoryUsage.set({ type: 'heap_total' }, memory.heapTotal);
        this.memoryUsage.set({ type: 'rss' }, memory.rss);
        this.cpuUsage.set(cpu.system / 1000000); // Convert microseconds to percentage approximation

        // Check system alerts
        const memoryPercent = (memory.heapUsed / memory.heapTotal) * 100;
        if (memoryPercent > this.options.memoryUsageThreshold) {
            this.createAlert('HIGH_MEMORY_USAGE', {
                usage: memoryPercent,
                threshold: this.options.memoryUsageThreshold
            });
        }
    }

    async collectPerformanceBaselines() {
        // Collect baseline metrics for comparison
        this.options.monitoredServices.forEach(service => {
            this.performanceBaselines.set(service.name, {
                avgResponseTime: Math.random() * 200 + 50, // Mock baseline
                errorRate: Math.random() * 2, // Mock baseline
                throughput: Math.random() * 100 + 50 // Mock baseline
            });
        });
    }

    createAlert(type, data) {
        const alert = {
            id: uuidv4(),
            type,
            severity: this.determineAlertSeverity(type),
            timestamp: new Date().toISOString(),
            data,
            acknowledged: false
        };

        this.alerts.unshift(alert);

        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(0, 1000);
        }

        winston.warn(`🚨 Performance Alert: ${type}`, data);

        // Emit event for real-time notifications
        this.emit('alert-created', alert);
    }

    determineAlertSeverity(type) {
        const criticalAlerts = ['SERVICE_UNHEALTHY', 'HIGH_ERROR_RATE'];
        const warningAlerts = ['HIGH_RESPONSE_TIME', 'HIGH_MEMORY_USAGE', 'HIGH_CPU_USAGE'];

        if (criticalAlerts.includes(type)) {return 'critical';}
        if (warningAlerts.includes(type)) {return 'warning';}
        return 'info';
    }

    checkAlerts() {
        // Check for ongoing issues and create alerts if needed
        this.serviceHealth.forEach((health, serviceName) => {
            if (health.status === 'unhealthy') {
                this.createAlert('SERVICE_UNHEALTHY', {
                    service: serviceName,
                    status: health.status
                });
            }
        });
    }

    async getRealTimeMetrics() {
        return {
            timestamp: new Date().toISOString(),
            services: Array.from(this.serviceHealth.values()),
            alerts: this.alerts.slice(0, 50), // Latest 50 alerts
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime()
            },
            requestMetrics: Object.fromEntries(this.requestMetrics)
        };
    }

    async getPrometheusMetrics() {
        return await this.register.metrics();
    }

    async getDashboardData(timeRange = '24h') {
        return {
            services: Array.from(this.serviceHealth.values()),
            alerts: this.alerts.slice(0, 100),
            performance: {
                avgResponseTime: this.calculateAverageResponseTime(),
                errorRate: this.calculateErrorRate(),
                uptime: this.calculateOverallUptime()
            },
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        };
    }

    calculateAverageResponseTime() {
        let total = 0;
        let count = 0;

        this.serviceHealth.forEach(health => {
            if (health.responseTime > 0) {
                total += health.responseTime;
                count++;
            }
        });

        return count > 0 ? total / count : 0;
    }

    calculateErrorRate() {
        let totalErrors = 0;
        let totalRequests = 0;

        this.serviceHealth.forEach(health => {
            totalErrors += health.errorCount;
            totalRequests += health.totalRequests;
        });

        return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    }

    calculateOverallUptime() {
        let totalUptime = 0;
        let serviceCount = this.serviceHealth.size;

        this.serviceHealth.forEach(health => {
            totalUptime += health.uptime;
        });

        return serviceCount > 0 ? totalUptime / serviceCount : 0;
    }

    async cleanup() {
        winston.info('Cleaning up Performance Monitoring Service...');
        // Cleanup logic here
    }

    // Event emitter methods
    emit(event, data) {
        // In a real implementation, this would emit to subscribers
        // For now, just log the event
        if (event === 'alert-created') {
            // Could send to notification service, log to external system, etc.
        }
    }
}

module.exports = PerformanceMonitoringService;