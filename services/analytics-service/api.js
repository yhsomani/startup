/**
 * TalentSphere Analytics Service API
 * REST API for analytics and reporting functionality
 * Updated with structured logging and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const AnalyticsService = require('./analytics-service');
const { createLogger } = require('../shared/logger');
const { createErrorHandler, asyncHandler } = require('../shared/error-handler');

class AnalyticsAPI {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
        this.app = express();
        
        // Initialize logger and error handler
        this.logger = createLogger('analytics-service', {
            enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
            logLevel: process.env.LOG_LEVEL || 'info'
        });
        
        this.errorHandler = createErrorHandler('analytics-service', {
            enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
            enableStackTrace: process.env.NODE_ENV === 'development'
        });

        // Setup middleware and routes
        this.setupMiddleware();
        this.setupRoutes();
        
        // Error handling (must be last)
        this.app.use(this.errorHandler.middleware());
        
        // Log service startup
        this.logger.info('Analytics API service initialized', {
            version: '1.0.0',
            node_env: process.env.NODE_ENV,
            log_level: process.env.LOG_LEVEL
        });
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Request ID middleware
        this.app.use((req, res, next) => {
            req.id = uuidv4();
            res.locals.requestId = req.id;
            this.logger.setTraceId(req.id);
            this.logger.setContext('request_id', req.id);
            
            const startTime = Date.now();
            
            // Log request on response finish
            res.on('finish', () => {
                this.logger.request(req, res, startTime);
                this.logger.clearContext();
            });
            
            next();
        });

        // Security middleware
        this.app.use(helmet());
        this.app.use(cors());
        
        // Body parsing with validation
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting for analytics endpoints
        const analyticsLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 50, // limit each IP to 50 requests per windowMs
            message: {
                error: 'Too many analytics requests from this IP, please try again later.'
            },
            standardHeaders: true,
            legacyHeaders: false
        });

        this.app.use('/api/v1/analytics', analyticsLimiter);
    }

    /**
     * Setup routes with validation
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', asyncHandler(async (req, res) => {
            this.logger.info('Health check requested', { endpoint: '/health' });
            
            const stats = this.analyticsService.getAnalyticsStats();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'analytics-service',
                statistics: stats
            });
        }));

        // Log an analytics event
        this.app.post('/api/v1/analytics/events', asyncHandler(async (req, res) => {
            this.logger.info('Analytics event received', { 
                endpoint: '/api/v1/analytics/events',
                event_type: req.body.eventType 
            });

            // Validate input
            const { error, value } = this.validateEventRequest(req.body);
            if (error) {
                throw this.errorHandler.createValidationError('event_data', error.details[0].message);
            }

            const { eventType, data, metadata } = value;
            
            const eventId = this.analyticsService.logEvent(eventType, data, metadata);
            
            this.logger.businessEvent('analytics_event_logged', null, {
                event_id: eventId,
                event_type: eventType
            });

            res.status(201).json({
                success: true,
                event_id: eventId,
                timestamp: new Date().toISOString(),
                message: 'Event logged successfully'
            });
        }));

        // Get executive dashboard data
        this.app.get('/api/v1/analytics/dashboard/executive', asyncHandler(async (req, res) => {
            this.logger.info('Executive dashboard requested', { 
                endpoint: '/api/v1/analytics/dashboard/executive' 
            });

            const dashboardData = this.analyticsService.getExecutiveDashboardData();
            
            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });
        }));

        // Get user engagement dashboard data
        this.app.get('/api/v1/analytics/dashboard/user-engagement', asyncHandler(async (req, res) => {
            this.logger.info('User engagement dashboard requested', { 
                endpoint: '/api/v1/analytics/dashboard/user-engagement',
                query_params: req.query
            });

            // Validate query parameters
            const { error, value } = this.validateDashboardQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('query', error.details[0].message);
            }

            const dashboardData = this.analyticsService.getUserEngagementDashboardData(value);
            
            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });
        }));

        // Get job posting dashboard data
        this.app.get('/api/v1/analytics/dashboard/job-posting', asyncHandler(async (req, res) => {
            this.logger.info('Job posting dashboard requested', { 
                endpoint: '/api/v1/analytics/dashboard/job-posting' 
            });

            const dashboardData = this.analyticsService.getJobPostingDashboardData();
            
            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });
        }));

        // Get revenue dashboard data
        this.app.get('/api/v1/analytics/dashboard/revenue', asyncHandler(async (req, res) => {
            this.logger.info('Revenue dashboard requested', { 
                endpoint: '/api/v1/analytics/dashboard/revenue' 
            });

            const dashboardData = this.analyticsService.getRevenueDashboardData();
            
            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });
        }));

        // Get user engagement analytics
        this.app.get('/api/v1/analytics/user-engagement', asyncHandler(async (req, res) => {
            this.logger.info('User engagement analytics requested', { 
                endpoint: '/api/v1/analytics/user-engagement',
                query_params: req.query
            });

            const { error, value } = this.validateAnalyticsQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('query', error.details[0].message);
            }

            const analyticsData = this.analyticsService.getUserEngagementAnalytics(value);
            
            res.json({
                success: true,
                data: analyticsData,
                count: analyticsData.length,
                timestamp: new Date().toISOString()
            });
        }));

        // Get job posting analytics
        this.app.get('/api/v1/analytics/job-posting', asyncHandler(async (req, res) => {
            this.logger.info('Job posting analytics requested', { 
                endpoint: '/api/v1/analytics/job-posting',
                query_params: req.query
            });

            const { error, value } = this.validateAnalyticsQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('query', error.details[0].message);
            }

            const analyticsData = this.analyticsService.getJobPostingAnalytics(value);
            
            res.json({
                success: true,
                data: analyticsData,
                count: analyticsData.length,
                timestamp: new Date().toISOString()
            });
        }));

        // Get revenue analytics
        this.app.get('/api/v1/analytics/revenue', asyncHandler(async (req, res) => {
            this.logger.info('Revenue analytics requested', { 
                endpoint: '/api/v1/analytics/revenue',
                query_params: req.query
            });

            const { error, value } = this.validateAnalyticsQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('query', error.details[0].message);
            }

            const analyticsData = this.analyticsService.getRevenueAnalytics(value);
            
            res.json({
                success: true,
                data: analyticsData,
                count: analyticsData.length,
                timestamp: new Date().toISOString()
            });
        }));

        // Get performance metrics
        this.app.get('/api/v1/analytics/performance', asyncHandler(async (req, res) => {
            this.logger.info('Performance metrics requested', { 
                endpoint: '/api/v1/analytics/performance',
                query_params: req.query
            });

            const { error, value } = this.validateAnalyticsQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('query', error.details[0].message);
            }

            const performanceData = this.analyticsService.getPerformanceMetrics(value);
            
            res.json({
                success: true,
                data: performanceData,
                count: performanceData.length,
                timestamp: new Date().toISOString()
            });
        }));

        // Generate custom report
        this.app.post('/api/v1/analytics/reports', asyncHandler(async (req, res) => {
            this.logger.info('Custom report generation requested', { 
                endpoint: '/api/v1/analytics/reports',
                report_type: req.body.reportType 
            });

            // Validate request
            const { error, value } = this.validateReportRequest(req.body);
            if (error) {
                throw this.errorHandler.createValidationError('report_request', error.details[0].message);
            }

            const { reportType, options } = value;
            
            try {
                const reportData = this.analyticsService.generateCustomReport(reportType, options);
                
                this.logger.businessEvent('report_generated', null, {
                    report_type: reportType,
                    options
                });

                res.json({
                    success: true,
                    data: reportData,
                    report_type: reportType,
                    timestamp: new Date().toISOString()
                });
            } catch (reportError) {
                throw this.errorHandler.createError('E_REPORT_GENERATION_FAILED', 
                    `Failed to generate report: ${reportError.message}`);
            }
        }));

        // Export data
        this.app.get('/api/v1/analytics/export', asyncHandler(async (req, res) => {
            this.logger.info('Data export requested', { 
                endpoint: '/api/v1/analytics/export',
                query_params: req.query
            });

            const { format = 'json', reportType = 'executive_summary', ...options } = req.query;
            
            if (!['json', 'csv', 'excel'].includes(format)) {
                throw this.errorHandler.createValidationError('format', 'Invalid export format');
            }

            try {
                const exportData = this.analyticsService.exportData(format, { reportType, ...options });
                
                this.logger.businessEvent('data_exported', null, {
                    format,
                    report_type: reportType
                });

                // Set appropriate content type
                const contentTypes = {
                    json: 'application/json',
                    csv: 'text/csv',
                    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                };

                res.setHeader('Content-Type', contentTypes[format]);
                res.setHeader('Content-Disposition', `attachment; filename="analytics-report.${format}"`);
                res.send(exportData);
            } catch (exportError) {
                throw this.errorHandler.createError('E_EXPORT_FAILED', 
                    `Failed to export data: ${exportError.message}`);
            }
        }));

        // Get analytics statistics
        this.app.get('/api/v1/analytics/stats', asyncHandler(async (req, res) => {
            this.logger.info('Analytics statistics requested', { 
                endpoint: '/api/v1/analytics/stats' 
            });

            const stats = this.analyticsService.getAnalyticsStats();
            
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
        }));

        // Clean old data
        this.app.delete('/api/v1/analytics/data/clean', asyncHandler(async (req, res) => {
            this.logger.securityEvent('data_cleanup_initiated', 'medium', {
                endpoint: '/api/v1/analytics/data/clean',
                user_id: req.user?.id
            });

            const cleaned = this.analyticsService.cleanOldData();
            
            this.logger.businessEvent('data_cleaned', null, {
                cleaned_records: cleaned
            });

            res.json({
                success: true,
                data: cleaned,
                timestamp: new Date().toISOString(),
                message: 'Old data cleaned successfully'
            });
        }));

        // Get real-time metrics
        this.app.get('/api/v1/analytics/realtime', asyncHandler(async (req, res) => {
            this.logger.info('Real-time metrics requested', { 
                endpoint: '/api/v1/analytics/realtime' 
            });

            const realTimeData = {
                timestamp: new Date().toISOString(),
                active_connections: this.analyticsService.events.size,
                recent_events: Array.from(this.analyticsService.events.values())
                    .filter(event => {
                        const eventTime = new Date(event.timestamp);
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                        return eventTime > fiveMinutesAgo;
                    })
                    .slice(-10)
            };
            
            res.json({
                success: true,
                data: realTimeData,
                timestamp: new Date().toISOString()
            });
        }));

        // Get trend analysis
        this.app.get('/api/v1/analytics/trends', asyncHandler(async (req, res) => {
            this.logger.info('Trend analysis requested', { 
                endpoint: '/api/v1/analytics/trends',
                query_params: req.query
            });

            const { timeRange = '7d', eventType } = req.query;
            
            // Calculate trends based on time range
            const trends = this.calculateTrends(timeRange, eventType);
            
            res.json({
                success: true,
                data: trends,
                time_range: timeRange,
                timestamp: new Date().toISOString()
            });
        }));
    }

    /**
     * Validation schemas
     */
    validateEventRequest(data) {
        const schema = Joi.object({
            eventType: Joi.string().required().valid(
                'user_login', 'user_registration', 'job_view', 'job_apply',
                'job_post', 'resume_upload', 'interview_schedule',
                'payment_completed', 'message_sent', 'search_performed',
                'page_view', 'api_request'
            ),
            data: Joi.object().required(),
            metadata: Joi.object().optional()
        });

        return schema.validate(data);
    }

    validateDashboardQuery(query) {
        const schema = Joi.object({
            startDate: Joi.date().optional(),
            endDate: Joi.date().optional(),
            limit: Joi.number().positive().max(100).default(50)
        });

        return schema.validate(query);
    }

    validateAnalyticsQuery(query) {
        const schema = Joi.object({
            userId: Joi.string().uuid().optional(),
            startDate: Joi.date().optional(),
            endDate: Joi.date().optional(),
            limit: Joi.number().positive().max(100).default(50)
        });

        return schema.validate(query);
    }

    validateReportRequest(body) {
        const schema = Joi.object({
            reportType: Joi.string().required().valid(
                'executive_summary', 'user_engagement', 'job_posting',
                'revenue', 'performance'
            ),
            options: Joi.object().optional()
        });

        return schema.validate(body);
    }

    /**
     * Calculate trends for different time ranges
     */
    calculateTrends(timeRange, eventType) {
        const now = new Date();
        const ranges = {
            '1d': 1,
            '7d': 7,
            '30d': 30,
            '90d': 90
        };

        const days = ranges[timeRange] || 7;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const events = Array.from(this.analyticsService.events.values())
            .filter(event => {
                const eventTime = new Date(event.timestamp);
                return eventTime > startDate && (!eventType || event.eventType === eventType);
            });

        // Group events by day
        const dailyData = {};
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            dailyData[dateKey] = 0;
        }

        events.forEach(event => {
            const dateKey = event.timestamp.split('T')[0];
            if (dailyData[dateKey] !== undefined) {
                dailyData[dateKey]++;
            }
        });

        return {
            time_range: timeRange,
            event_type: eventType || 'all',
            data: dailyData,
            total_events: events.length,
            average_per_day: events.length / days
        };
    }

    /**
     * Start the API server
     */
    async start(port) {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(port, () => {
                    this.logger.info('Analytics API server started', {
                        port,
                        environment: process.env.NODE_ENV,
                        service: 'analytics-service'
                    });
                    resolve(port);
                });

                this.server.on('error', (error) => {
                    this.logger.error('Failed to start API server', { port, error: error.message });
                    reject(error);
                });
            } catch (error) {
                this.logger.error('Error starting API server', { error: error.message });
                reject(error);
            }
        });
    }

    /**
     * Stop the API server
     */
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    this.logger.info('Analytics API server stopped');
                    resolve();
                });
            });
        }
    }
}

module.exports = AnalyticsAPI;