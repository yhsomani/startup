/**
 * TalentSphere Log Aggregation Service
 * Centralized log collection and processing
 */

const { createLogger } = require('./logger');
const { createErrorHandler, asyncHandler } = require('./error-handler');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class LogAggregator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            batchSize: options.batchSize || 100,
            flushInterval: options.flushInterval || 5000, // 5 seconds
            retentionDays: options.retentionDays || 30,
            enableFileStorage: options.enableFileStorage !== false,
            enableMemoryStorage: options.enableMemoryStorage !== false,
            storagePath: options.storagePath || './logs/aggregated',
            enableRealTimeProcessing: options.enableRealTimeProcessing !== false,
            ...options
        };

        // Initialize logger
        this.logger = createLogger('log-aggregator', {
            enableFile: true,
            logLevel: process.env.LOG_LEVEL || 'info'
        });

        // Storage for logs
        this.memoryLogs = [];
        this.fileBuffer = [];
        this.processingQueue = [];
        
        // Statistics
        this.stats = {
            totalLogsReceived: 0,
            totalLogsProcessed: 0,
            errorCount: 0,
            warningCount: 0,
            lastFlush: null,
            bufferSize: 0
        };

        // Internal state
        this.flushTimer = null;
        this.isProcessing = false;

        // Initialize storage
        this.initializeStorage();
        
        // Start periodic flush
        this.startPeriodicFlush();

        this.logger.info('Log aggregator initialized', {
            options: this.options
        });
    }

    /**
     * Initialize storage systems
     */
    initializeStorage() {
        if (this.options.enableFileStorage) {
            // Ensure storage directory exists
            if (!fs.existsSync(this.options.storagePath)) {
                fs.mkdirSync(this.options.storagePath, { recursive: true });
            }

            // Create subdirectories
            const subdirs = ['errors', 'warnings', 'info', 'debug', 'security'];
            subdirs.forEach(dir => {
                const fullPath = path.join(this.options.storagePath, dir);
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                }
            });

            this.logger.info('File storage initialized', {
                storagePath: this.options.storagePath
            });
        }
    }

    /**
     * Start periodic flush timer
     */
    startPeriodicFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.options.flushInterval);
    }

    /**
     * Receive log entry from services
     */
    receiveLog(logEntry) {
        try {
            // Add metadata
            logEntry.received_at = new Date().toISOString();
            logEntry.aggregator_id = uuidv4();

            // Update statistics
            this.stats.totalLogsReceived++;
            this.stats.bufferSize++;

            // Count by level
            if (logEntry.level === 'ERROR') {
                this.stats.errorCount++;
            } else if (logEntry.level === 'WARN') {
                this.stats.warningCount++;
            }

            // Store in memory if enabled
            if (this.options.enableMemoryStorage) {
                this.memoryLogs.push(logEntry);
                
                // Limit memory storage
                if (this.memoryLogs.length > this.options.batchSize * 10) {
                    this.memoryLogs = this.memoryLogs.slice(-this.options.batchSize * 10);
                }
            }

            // Store in file buffer if enabled
            if (this.options.enableFileStorage) {
                this.fileBuffer.push(logEntry);
                
                // Flush if buffer is full
                if (this.fileBuffer.length >= this.options.batchSize) {
                    this.flushToFile();
                }
            }

            // Real-time processing
            if (this.options.enableRealTimeProcessing) {
                this.processLogEntry(logEntry);
            }

            // Emit event for external processors
            this.emit('logReceived', logEntry);

        } catch (error) {
            this.logger.error('Error receiving log entry', { 
                log_entry_id: logEntry.id || 'unknown',
                error: error.message 
            });
        }
    }

    /**
     * Process individual log entry
     */
    processLogEntry(logEntry) {
        this.processingQueue.push(logEntry);

        // Process asynchronously
        setImmediate(() => {
            this.processQueue();
        });
    }

    /**
     * Process the processing queue
     */
    async processQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            const batch = this.processingQueue.splice(0, this.options.batchSize);
            
            for (const logEntry of batch) {
                await this.analyzeLogEntry(logEntry);
                this.stats.totalLogsProcessed++;
            }

            this.emit('batchProcessed', batch);

        } catch (error) {
            this.logger.error('Error processing log queue', { error: error.message });
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Analyze log entry for patterns and alerts
     */
    async analyzeLogEntry(logEntry) {
        // Error spike detection
        if (logEntry.level === 'ERROR') {
            const recentErrors = this.getRecentLogs('ERROR', 60); // Last minute
            if (recentErrors.length >= 10) {
                this.emit('alert', {
                    type: 'error_spike',
                    severity: 'high',
                    message: 'High error rate detected',
                    count: recentErrors.length,
                    timeframe: '1 minute',
                    logs: recentErrors.slice(-5)
                });
            }
        }

        // Security event detection
        if (logEntry.security_event_type) {
            this.emit('securityAlert', {
                type: 'security_event',
                severity: logEntry.severity || 'medium',
                message: `Security event: ${logEntry.security_event_type}`,
                event: logEntry
            });
        }

        // Performance monitoring
        if (logEntry.data && logEntry.data.duration_ms) {
            const recentPerformance = this.getRecentLogs('PERFORMANCE', 300); // Last 5 minutes
            const slowRequests = recentPerformance.filter(log => 
                log.data && log.data.duration_ms > 1000
            );

            if (slowRequests.length >= 5) {
                this.emit('alert', {
                    type: 'performance_degradation',
                    severity: 'medium',
                    message: 'Performance degradation detected',
                    slow_requests: slowRequests.length,
                    timeframe: '5 minutes'
                });
            }
        }

        // Database monitoring
        if (logEntry.message && logEntry.message.includes('Database query')) {
            const dbErrors = this.getRecentLogs(null, 300).filter(log => 
                log.error && log.error.name && log.error.name.includes('Database')
            );

            if (dbErrors.length >= 3) {
                this.emit('alert', {
                    type: 'database_issues',
                    severity: 'high',
                    message: 'Multiple database errors detected',
                    error_count: dbErrors.length,
                    timeframe: '5 minutes'
                });
            }
        }
    }

    /**
     * Get recent logs by level or all logs
     */
    getRecentLogs(level, timeWindowSeconds) {
        const cutoffTime = new Date(Date.now() - timeWindowSeconds * 1000);
        
        return this.memoryLogs.filter(log => {
            const logTime = new Date(log.timestamp || log.received_at);
            return logTime > cutoffTime && (!level || log.level === level);
        });
    }

    /**
     * Flush all buffers to storage
     */
    flush() {
        try {
            const flushed = {
                memoryLogs: 0,
                fileLogs: 0,
                processingQueue: this.processingQueue.length
            };

            // Flush memory logs to file if needed
            if (this.memoryLogs.length > this.options.batchSize) {
                this.flushToFile(this.memoryLogs.splice(0, this.options.batchSize));
                flushed.memoryLogs = this.options.batchSize;
            }

            // Flush file buffer
            if (this.fileBuffer.length > 0) {
                this.flushToFile(this.fileBuffer.splice(0));
                flushed.fileLogs = this.fileBuffer.length + flushed.fileLogs;
            }

            this.stats.lastFlush = new Date().toISOString();
            this.stats.bufferSize = this.memoryLogs.length + this.fileBuffer.length;

            this.emit('flushed', flushed);

            this.logger.debug('Log flush completed', {
                flushed,
                stats: this.stats
            });

        } catch (error) {
            this.logger.error('Error during flush', { error: error.message });
        }
    }

    /**
     * Flush logs to file storage
     */
    flushToFile(logs) {
        if (!this.options.enableFileStorage || !logs || logs.length === 0) {
            return;
        }

        try {
            // Group logs by level
            const logsByLevel = logs.reduce((groups, log) => {
                const level = log.level.toLowerCase();
                if (!groups[level]) {
                    groups[level] = [];
                }
                groups[level].push(log);
                return groups;
            }, {});

            // Write to level-specific files
            for (const [level, levelLogs] of Object.entries(logsByLevel)) {
                const filename = `${level}-${new Date().toISOString().split('T')[0]}.jsonl`;
                const filepath = path.join(this.options.storagePath, level, filename);
                
                const logLines = levelLogs.map(log => JSON.stringify(log)).join('\n');
                fs.appendFileSync(filepath, logLines + '\n');
            }

            this.logger.debug('Logs flushed to files', {
                count: logs.length,
                levels: Object.keys(logsByLevel)
            });

        } catch (error) {
            this.logger.error('Error flushing logs to file', { 
                error: error.message,
                logs_count: logs.length 
            });
        }
    }

    /**
     * Clean up old log files
     */
    cleanup() {
        if (!this.options.enableFileStorage) {
            return;
        }

        try {
            const cutoffDate = new Date(Date.now() - this.options.retentionDays * 24 * 60 * 60 * 1000);
            let cleanedFiles = 0;

            const cleanupDirectory = (dirPath) => {
                if (!fs.existsSync(dirPath)) {return;}

                const files = fs.readdirSync(dirPath);
                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        cleanedFiles++;
                    }
                }
            };

            // Clean each level directory
            const levels = ['errors', 'warnings', 'info', 'debug', 'security'];
            levels.forEach(level => {
                cleanupDirectory(path.join(this.options.storagePath, level));
            });

            this.logger.info('Log cleanup completed', {
                cleaned_files: cleanedFiles,
                retention_days: this.options.retentionDays,
                cutoff_date: cutoffDate.toISOString()
            });

            this.emit('cleanup', { cleanedFiles });

        } catch (error) {
            this.logger.error('Error during log cleanup', { error: error.message });
        }
    }

    /**
     * Get aggregation statistics
     */
    getStats() {
        return {
            ...this.stats,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            buffer_sizes: {
                memory_logs: this.memoryLogs.length,
                file_buffer: this.fileBuffer.length,
                processing_queue: this.processingQueue.length
            }
        };
    }

    /**
     * Search logs by criteria
     */
    searchLogs(criteria) {
        const {
            level,
            service,
            startTime,
            endTime,
            searchText,
            limit = 100
        } = criteria;

        let filteredLogs = [...this.memoryLogs];

        // Filter by level
        if (level) {
            filteredLogs = filteredLogs.filter(log => log.level === level.toUpperCase());
        }

        // Filter by service
        if (service) {
            filteredLogs = filteredLogs.filter(log => log.service === service);
        }

        // Filter by time range
        if (startTime) {
            const start = new Date(startTime);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
        }

        if (endTime) {
            const end = new Date(endTime);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
        }

        // Filter by search text
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                JSON.stringify(log).toLowerCase().includes(searchLower)
            );
        }

        // Sort by timestamp (newest first) and limit
        return filteredLogs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Get logs for a specific service
     */
    getServiceLogs(serviceName, limit = 50) {
        return this.memoryLogs
            .filter(log => log.service === serviceName)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Stop the aggregator
     */
    stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        // Final flush
        this.flush();

        // Cleanup old files
        this.cleanup();

        this.logger.info('Log aggregator stopped');
        this.emit('stopped');
    }
}

/**
 * Factory function to create log aggregator instances
 */
function createLogAggregator(options = {}) {
    return new LogAggregator(options);
}

module.exports = {
    LogAggregator,
    createLogAggregator
};