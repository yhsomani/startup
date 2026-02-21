const express = require('express');
const router = express.Router();

// In-memory storage for metrics (in production, use Redis or database)
const metricsStorage = {
    responseTimes: [],
    errorRates: [],
    throughput: [],
    resourceUsage: []
};

// Middleware to record metrics for all requests
router.use((req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Store metrics
        metricsStorage.responseTimes.push({
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            statusCode,
            duration
        });

        // Keep only last 1000 entries
        if (metricsStorage.responseTimes.length > 1000) {
            metricsStorage.responseTimes = metricsStorage.responseTimes.slice(-1000);
        }

        // Track errors
        if (statusCode >= 400) {
            metricsStorage.errorRates.push({
                timestamp: new Date().toISOString(),
                method: req.method,
                path: req.path,
                statusCode
            });

            if (metricsStorage.errorRates.length > 1000) {
                metricsStorage.errorRates = metricsStorage.errorRates.slice(-1000);
            }
        }
    });

    next();
});

/**
 * @swagger
 * /api/v1/performance/dashboard:
 *   get:
 *     summary: Get performance dashboard data
 *     description: Retrieve comprehensive performance metrics for the dashboard
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 12h, 24h, 7d]
 *         description: Time range for metrics
 *     responses:
 *       200:
 *         description: Performance dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 performance:
 *                   type: object
 */
router.get('/dashboard', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '24h';

        // This would call the performance monitoring service
        const dashboardData = {
            services: [
                { name: 'api-gateway', status: 'healthy', responseTime: 45, uptime: 99.9 },
                { name: 'auth-service', status: 'healthy', responseTime: 32, uptime: 99.8 },
                { name: 'user-service', status: 'healthy', responseTime: 28, uptime: 99.9 },
                { name: 'job-service', status: 'healthy', responseTime: 35, uptime: 99.7 },
                { name: 'application-service', status: 'degraded', responseTime: 1200, uptime: 98.5 }
            ],
            alerts: [
                {
                    id: 'alert-001',
                    type: 'HIGH_RESPONSE_TIME',
                    severity: 'warning',
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    data: { service: 'application-service', responseTime: 1200 }
                }
            ],
            performance: {
                avgResponseTime: 234,
                errorRate: 1.2,
                uptime: 99.2
            },
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        };

        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/v1/performance/metrics:
 *   get:
 *     summary: Get detailed performance metrics
 *     description: Retrieve detailed metrics for specific time ranges
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [response-time, error-rate, throughput, resource-usage]
 *         description: Type of metric to retrieve
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 12h, 24h, 7d]
 *         description: Time range for metrics
 *     responses:
 *       200:
 *         description: Performance metrics data
 */
router.get('/metrics', (req, res) => {
    try {
        const { metric, timeRange } = req.query;

        let metrics = [];

        switch (metric) {
            case 'response-time':
                metrics = metricsStorage.responseTimes.slice(-100);
                break;
            case 'error-rate':
                metrics = metricsStorage.errorRates.slice(-100);
                break;
            default:
                metrics = {
                    responseTimes: metricsStorage.responseTimes.slice(-50),
                    errorRates: metricsStorage.errorRates.slice(-50)
                };
        }

        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/v1/performance/alerts:
 *   get:
 *     summary: Get performance alerts
 *     description: Retrieve current and historical performance alerts
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, warning, info]
 *         description: Filter alerts by severity
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of alerts to return
 *     responses:
 *       200:
 *         description: Performance alerts
 */
router.get('/alerts', (req, res) => {
    try {
        const { severity, limit = 50 } = req.query;

        // Mock alerts data
        let alerts = [
            {
                id: 'alert-001',
                type: 'HIGH_RESPONSE_TIME',
                severity: 'warning',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                data: { service: 'application-service', responseTime: 1200, threshold: 1000 }
            },
            {
                id: 'alert-002',
                type: 'SERVICE_DEGRADED',
                severity: 'critical',
                timestamp: new Date(Date.now() - 600000).toISOString(),
                data: { service: 'notification-service', status: 'degraded' }
            }
        ];

        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }

        res.json(alerts.slice(0, parseInt(limit)));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/v1/performance/services:
 *   get:
 *     summary: Get service health status
 *     description: Retrieve health status for all monitored services
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Service health status
 */
router.get('/services', (req, res) => {
    try {
        const services = [
            { name: 'api-gateway', status: 'healthy', responseTime: 45, uptime: 99.9, lastCheck: new Date().toISOString() },
            { name: 'auth-service', status: 'healthy', responseTime: 32, uptime: 99.8, lastCheck: new Date().toISOString() },
            { name: 'user-service', status: 'healthy', responseTime: 28, uptime: 99.9, lastCheck: new Date().toISOString() },
            { name: 'company-service', status: 'healthy', responseTime: 38, uptime: 99.7, lastCheck: new Date().toISOString() },
            { name: 'job-service', status: 'healthy', responseTime: 35, uptime: 99.7, lastCheck: new Date().toISOString() },
            { name: 'application-service', status: 'degraded', responseTime: 1200, uptime: 98.5, lastCheck: new Date().toISOString() },
            { name: 'notification-service', status: 'healthy', responseTime: 42, uptime: 99.6, lastCheck: new Date().toISOString() },
            { name: 'search-service', status: 'healthy', responseTime: 55, uptime: 99.4, lastCheck: new Date().toISOString() },
            { name: 'analytics-service', status: 'healthy', responseTime: 65, uptime: 99.3, lastCheck: new Date().toISOString() },
            { name: 'network-service', status: 'healthy', responseTime: 48, uptime: 99.7, lastCheck: new Date().toISOString() }
        ];

        res.json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/v1/performance/system:
 *   get:
 *     summary: Get system resource metrics
 *     description: Retrieve current system resource usage metrics
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: System resource metrics
 */
router.get('/system', (req, res) => {
    try {
        const memory = process.memoryUsage();
        const cpu = process.cpuUsage();

        res.json({
            memory: {
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                rss: memory.rss,
                external: memory.external,
                usagePercentage: ((memory.heapUsed / memory.heapTotal) * 100).toFixed(2)
            },
            cpu: {
                user: cpu.user,
                system: cpu.system
            },
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;