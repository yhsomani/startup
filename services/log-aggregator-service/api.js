/**
 * TalentSphere Log Aggregator API
 * REST API for centralized log management
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { createLogger } = require('../shared/logger');
const { createErrorHandler, asyncHandler } = require('../shared/error-handler');
const { createLogAggregator } = require('./log-aggregator');

class LogAggregatorAPI {
    constructor(options = {}) {
        this.app = express();
        
        // Initialize logger and error handler
        this.logger = createLogger('log-aggregator-service', {
            enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
            logLevel: process.env.LOG_LEVEL || 'info'
        });
        
        this.errorHandler = createErrorHandler('log-aggregator-service', {
            enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
            enableStackTrace: process.env.NODE_ENV === 'development'
        });

        // Initialize log aggregator
        this.aggregator = createLogAggregator({
            batchSize: parseInt(process.env.LOG_BATCH_SIZE) || 100,
            flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL) || 5000,
            retentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
            enableFileStorage: process.env.ENABLE_FILE_STORAGE !== 'false',
            enableMemoryStorage: process.env.ENABLE_MEMORY_STORAGE !== 'false',
            enableRealTimeProcessing: process.env.ENABLE_REAL_TIME_PROCESSING === 'true',
            storagePath: process.env.LOG_STORAGE_PATH || './logs/aggregated'
        });

        // Setup middleware and routes
        this.setupMiddleware();
        this.setupRoutes();
        
        // Error handling (must be last)
        this.app.use(this.errorHandler.middleware());
        
        // Setup aggregator event handlers
        this.setupAggregatorEvents();

        this.logger.info('Log Aggregator API service initialized', {
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
        
        // Body parsing
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting for log ingestion
        const logLimiter = rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 1000, // allow up to 1000 log entries per minute
            message: {
                error: 'Too many log entries, please try again later.'
            },
            standardHeaders: true,
            legacyHeaders: false
        });

        this.app.use('/api/v1/logs', logLimiter);
    }

    /**
     * Setup aggregator event handlers
     */
    setupAggregatorEvents() {
        // Handle log alerts
        this.aggregator.on('alert', (alert) => {
            this.logger.securityEvent('log_aggregator_alert', alert.severity, {
                alert_type: alert.type,
                message: alert.message,
                data: alert
            });

            // Could integrate with external alerting systems here
            if (alert.severity === 'high') {
                this.sendCriticalAlert(alert);
            }
        });

        // Handle security events
        this.aggregator.on('securityAlert', (alert) => {
            this.logger.securityEvent('security_event_detected', 'high', alert);
            this.sendSecurityAlert(alert);
        });

        // Handle batch processing
        this.aggregator.on('batchProcessed', (batch) => {
            this.logger.debug('Log batch processed', {
                batch_size: batch.length,
                processing_time: Date.now()
            });
        });

        // Handle flush events
        this.aggregator.on('flushed', (flushData) => {
            this.logger.debug('Logs flushed', flushData);
        });
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', asyncHandler(async (req, res) => {
            this.logger.info('Health check requested', { endpoint: '/health' });
            
            const stats = this.aggregator.getStats();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'log-aggregator-service',
                statistics: stats
            });
        }));

        // Ingest logs
        this.app.post('/api/v1/logs', asyncHandler(async (req, res) => {
            this.logger.info('Log ingestion requested', { 
                endpoint: '/api/v1/logs',
                logs_count: Array.isArray(req.body) ? req.body.length : 1
            });

            // Validate input
            const { error, value } = this.validateLogIngestion(req.body);
            if (error) {
                throw this.errorHandler.createValidationError('log_data', error.details[0].message);
            }

            const logs = Array.isArray(value) ? value : [value];
            let ingestCount = 0;

            for (const logEntry of logs) {
                this.aggregator.receiveLog(logEntry);
                ingestCount++;
            }

            res.status(201).json({
                success: true,
                logs_ingested: ingestCount,
                timestamp: new Date().toISOString(),
                message: 'Logs ingested successfully'
            });
        }));

        // Get aggregation statistics
        this.app.get('/api/v1/logs/stats', asyncHandler(async (req, res) => {
            this.logger.info('Statistics requested', { endpoint: '/api/v1/logs/stats' });

            const stats = this.aggregator.getStats();
            
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
        }));

        // Search logs
        this.app.get('/api/v1/logs/search', asyncHandler(async (req, res) => {
            this.logger.info('Log search requested', { 
                endpoint: '/api/v1/logs/search',
                query_params: req.query
            });

            // Validate query parameters
            const { error, value } = this.validateSearchQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('search_query', error.details[0].message);
            }

            const searchResults = this.aggregator.searchLogs(value);
            
            res.json({
                success: true,
                data: searchResults,
                count: searchResults.length,
                query: value,
                timestamp: new Date().toISOString()
            });
        }));

        // Get logs for specific service
        this.app.get('/api/v1/logs/service/:serviceName', asyncHandler(async (req, res) => {
            this.logger.info('Service logs requested', { 
                endpoint: `/api/v1/logs/service/${req.params.serviceName}`,
                service_name: req.params.serviceName
            });

            const { error, value } = this.validateServiceLogQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('service_query', error.details[0].message);
            }

            const serviceLogs = this.aggregator.getServiceLogs(req.params.serviceName, value.limit);
            
            res.json({
                success: true,
                data: serviceLogs,
                service_name: req.params.serviceName,
                count: serviceLogs.length,
                timestamp: new Date().toISOString()
            });
        }));

        // Get logs by level
        this.app.get('/api/v1/logs/level/:level', asyncHandler(async (req, res) => {
            this.logger.info('Level logs requested', { 
                endpoint: `/api/v1/logs/level/${req.params.level}`,
                log_level: req.params.level
            });

            const { error, value } = this.validateSearchQuery(req.query);
            if (error) {
                throw this.errorHandler.createValidationError('level_query', error.details[0].message);
            }

            const searchResults = this.aggregator.searchLogs({
                level: req.params.level.toUpperCase(),
                ...value
            });
            
            res.json({
                success: true,
                data: searchResults,
                level: req.params.level,
                count: searchResults.length,
                timestamp: new Date().toISOString()
            });
        }));

        // Trigger manual flush
        this.app.post('/api/v1/logs/flush', asyncHandler(async (req, res) => {
            this.logger.info('Manual flush triggered', { 
                endpoint: '/api/v1/logs/flush',
                user_id: req.user?.id
            });

            this.aggregator.flush();
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: 'Logs flushed successfully'
            });
        }));

        // Trigger cleanup
        this.app.post('/api/v1/logs/cleanup', asyncHandler(async (req, res) => {
            this.logger.securityEvent('manual_cleanup_triggered', 'medium', {
                endpoint: '/api/v1/logs/cleanup',
                user_id: req.user?.id
            });

            this.aggregator.cleanup();
            
            res.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: 'Log cleanup initiated'
            });
        }));

        // Export logs
        this.app.get('/api/v1/logs/export', asyncHandler(async (req, res) => {
            this.logger.info('Log export requested', { 
                endpoint: '/api/v1/logs/export',
                query_params: req.query
            });

            const { format = 'json', ...criteria } = req.query;
            
            if (!['json', 'csv'].includes(format)) {
                throw this.errorHandler.createValidationError('format', 'Invalid export format');
            }

            const logs = this.aggregator.searchLogs(criteria);
            
            this.logger.businessEvent('logs_exported', null, {
                format,
                log_count: logs.length
            });

            // Format response
            if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="logs-export.json"');
                res.json(logs);
            } else if (format === 'csv') {
                // Simple CSV export
                const csvHeader = 'timestamp,level,service,message,trace_id\n';
                const csvData = logs.map(log => 
                    `${log.timestamp},${log.level},${log.service},"${log.message}",${log.trace_id || ''}`
                ).join('\n');
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="logs-export.csv"');
                res.send(csvHeader + csvData);
            }
        }));
    }

    /**
     * Validation schemas
     */
    validateLogIngestion(data) {
        const schema = Joi.object({
            logs: Joi.array().items(
                Joi.object({
                    timestamp: Joi.string().isoDate().required(),
                    level: Joi.string().valid('ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE').required(),
                    service: Joi.string().required(),
                    message: Joi.string().required(),
                    trace_id: Joi.string().uuid().optional(),
                    data: Joi.object().optional()
                })
            ).optional(),
            log: Joi.object({
                timestamp: Joi.string().isoDate().required(),
                level: Joi.string().valid('ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE').required(),
                service: Joi.string().required(),
                message: Joi.string().required(),
                trace_id: Joi.string().uuid().optional(),
                data: Joi.object().optional()
            }).optional()
        }).xor('logs', 'log');

        // Handle both single log and array of logs
        const validatedData = Array.isArray(data) ? { logs: data } : { log: data };
        return schema.validate(validatedData);
    }

    validateSearchQuery(query) {
        const schema = Joi.object({
            level: Joi.string().valid('ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE').optional(),
            service: Joi.string().optional(),
            startTime: Joi.date().optional(),
            endTime: Joi.date().optional(),
            searchText: Joi.string().max(500).optional(),
            limit: Joi.number().positive().max(1000).default(100)
        });

        return schema.validate(query);
    }

    validateServiceLogQuery(query) {
        const schema = Joi.object({
            limit: Joi.number().positive().max(500).default(100),
            startTime: Joi.date().optional(),
            endTime: Joi.date().optional()
        });

        return schema.validate(query);
    }

    /**
     * Send critical alert (placeholder for external integration)
     */
    sendCriticalAlert(alert) {
        // In production, this would integrate with systems like:
        // - PagerDuty
        // - Slack notifications
        // - Email alerts
        // - SMS notifications
        // - Monitoring systems (DataDog, New Relic)
        
        this.logger.error('CRITICAL ALERT:', alert);
    }

    /**
     * Send security alert
     */
    sendSecurityAlert(alert) {
        // In production, this would integrate with:
        // - Security operations team
        // - SIEM systems
        // - Incident response systems
        // - Compliance reporting
        
        this.logger.error('SECURITY ALERT:', alert);
    }

    /**
     * Start API server
     */
    async start(port) {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(port, () => {
                    this.logger.info('Log Aggregator API server started', {
                        port,
                        environment: process.env.NODE_ENV,
                        service: 'log-aggregator-service'
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
     * Stop API server
     */
    async stop() {
        // Stop the log aggregator
        this.aggregator.stop();

        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    this.logger.info('Log Aggregator API server stopped');
                    resolve();
                });
            });
        }
    }
}

module.exports = LogAggregatorAPI;