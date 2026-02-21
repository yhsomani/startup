/**
 * TalentSphere Structured Logging System
 * Centralized logging for all microservices
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Logger Class for Structured Logging
 */
class Logger {
    constructor(options = {}) {
        this.serviceName = options.serviceName || 'unknown-service';
        this.version = options.version || '1.0.0';
        this.environment = options.environment || process.env.NODE_ENV || 'development';
        this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile || false;
        this.logFile = options.logFile || `./logs/runtime/${this.serviceName}.log`;
        this.enableStructuredLogging = options.enableStructuredLogging !== false;
        this.enableTrace = options.enableTrace !== false;
        this.sensitiveFields = options.sensitiveFields || [
            'password', 'token', 'secret', 'key', 'authorization',
            'credit_card', 'ssn', 'social_security', 'bank_account',
            'api_key', 'private_key', 'session_id'
        ];

        // Log levels in order of severity
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };

        // Map string levels to numeric
        this.currentLevel = this.levels[this.logLevel] || this.levels.info;

        // Request context storage
        this.context = new Map();
        this.traceId = null;

        // Initialize file logging if enabled
        if (this.enableFile) {
            this.initializeFileLogging();
        }
    }

    /**
     * Initialize file logging
     */
    initializeFileLogging() {
        const fs = require('fs');
        const path = require('path');

        // Ensure log directory exists
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    /**
     * Set request context
     */
    setContext(key, value) {
        this.context.set(key, value);
    }

    /**
     * Clear request context
     */
    clearContext() {
        this.context.clear();
    }

    /**
     * Generate trace ID
     */
    generateTraceId() {
        this.traceId = uuidv4();
        return this.traceId;
    }

    /**
     * Set trace ID
     */
    setTraceId(traceId) {
        this.traceId = traceId;
    }

    /**
     * Check if log level should be output
     */
    shouldLog(level) {
        return this.levels[level] <= this.currentLevel;
    }

    /**
     * Mask sensitive data in log objects
     */
    maskSensitiveData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const masked = Array.isArray(data) ? [] : {};
        const maskRecursive = (obj, target) => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const lowerKey = key.toLowerCase();

                    if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
                        target[key] = '***MASKED***';
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        target[key] = Array.isArray(obj[key]) ? [] : {};
                        maskRecursive(obj[key], target[key]);
                    } else {
                        target[key] = obj[key];
                    }
                }
            }
        };

        maskRecursive(data, masked);
        return masked;
    }

    /**
     * Create structured log entry
     */
    createLogEntry(level, message, data = {}, error = null) {
        if (!this.shouldLog(level)) {
            return null;
        }

        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            level: level.toUpperCase(),
            service: this.serviceName,
            version: this.version,
            environment: this.environment,
            message,
            trace_id: this.traceId,
            thread_id: process.pid,
            // Add context data
            ...Object.fromEntries(this.context)
        };

        // Add data if provided
        if (Object.keys(data).length > 0) {
            entry.data = this.maskSensitiveData(data);
        }

        // Add error details if provided
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            };
        }

        return entry;
    }

    /**
     * Write log entry to outputs
     */
    writeLog(entry) {
        if (!entry) { return; }

        if (this.enableConsole) {
            this.writeToConsole(entry);
        }

        if (this.enableFile) {
            this.writeToFile(entry);
        }
    }

    /**
     * Write to console with color coding
     */
    writeToConsole(entry) {
        const colors = {
            ERROR: '\x1b[31m', // red
            WARN: '\x1b[33m',  // yellow
            INFO: '\x1b[36m',  // cyan
            DEBUG: '\x1b[35m', // magenta
            TRACE: '\x1b[37m'  // white
        };
        const reset = '\x1b[0m';

        const color = colors[entry.level] || '';

        if (this.enableStructuredLogging) {
            console.log(`${color}${JSON.stringify(entry)}${reset}`);
        } else {
            // Human readable format
            const time = entry.timestamp;
            const level = entry.level.padEnd(5);
            const service = entry.service.padEnd(20);
            const trace = entry.trace_id ? `[${entry.trace_id.substring(0, 8)}]` : '';
            console.log(`${color}${time} ${level} ${service} ${trace} ${entry.message}${reset}`);

            if (entry.data) {
                console.log('Data:', JSON.stringify(entry.data, null, 2));
            }

            if (entry.error) {
                console.log('Error:', entry.error.message);
                if (this.environment === 'development') {
                    console.log('Stack:', entry.error.stack);
                }
            }
        }
    }

    /**
     * Write to file
     */
    writeToFile(entry) {
        const fs = require('fs');
        const logLine = JSON.stringify(entry) + '\n';

        try {
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Log error
     */
    error(message, data = {}, error = null) {
        const entry = this.createLogEntry('error', message, data, error);
        this.writeLog(entry);
    }

    /**
     * Log warning
     */
    warn(message, data = {}, error = null) {
        const entry = this.createLogEntry('warn', message, data, error);
        this.writeLog(entry);
    }

    /**
     * Log info
     */
    info(message, data = {}) {
        const entry = this.createLogEntry('info', message, data);
        this.writeLog(entry);
    }

    /**
     * Log debug
     */
    debug(message, data = {}) {
        const entry = this.createLogEntry('debug', message, data);
        this.writeLog(entry);
    }

    /**
     * Log trace
     */
    trace(message, data = {}) {
        if (!this.enableTrace) { return; }

        const entry = this.createLogEntry('trace', message, data);
        this.writeLog(entry);
    }

    /**
     * Log HTTP request
     */
    request(req, res, startTime) {
        const duration = Date.now() - startTime;
        const data = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration_ms: duration,
            user_agent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            content_length: req.get('Content-Length'),
            referer: req.get('Referer')
        };

        const level = res.statusCode >= 400 ? 'warn' : 'info';
        const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;

        this[level](message, data);
    }

    /**
     * Log database query
     */
    query(sql, params, duration, error = null) {
        const data = {
            query: sql,
            params: params ? this.maskSensitiveData(params) : null,
            duration_ms: duration,
            affected_rows: error ? null : 'N/A'
        };

        const message = `Database query executed in ${duration}ms`;
        const level = error ? 'error' : 'debug';

        this[level](message, data, error);
    }

    /**
     * Log external API call
     */
    externalCall(method, url, statusCode, duration, error = null) {
        const data = {
            external_service: this.extractServiceFromUrl(url),
            method,
            url: this.maskUrl(url),
            status: statusCode,
            duration_ms: duration
        };

        const message = `External API call: ${method} ${url} - ${statusCode} (${duration}ms)`;
        const level = statusCode >= 400 || error ? 'warn' : 'debug';

        this[level](message, data, error);
    }

    /**
     * Log business event
     */
    businessEvent(eventType, userId, data = {}) {
        const logData = {
            event_type: eventType,
            user_id: userId,
            ...data
        };

        const message = `Business event: ${eventType}`;
        this.info(message, logData);
    }

    /**
     * Log security event
     */
    securityEvent(eventType, severity, data = {}) {
        const logData = {
            security_event_type: eventType,
            severity,
            ...data
        };

        const message = `Security event: ${eventType} (${severity})`;
        this.warn(message, logData);
    }

    /**
     * Extract service name from URL
     */
    extractServiceFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch {
            return 'unknown';
        }
    }

    /**
     * Mask URL parameters
     */
    maskUrl(url) {
        try {
            const urlObj = new URL(url);
            const params = new URLSearchParams(urlObj.search);

            // Mask sensitive parameters
            for (const [key] of params) {
                const lowerKey = key.toLowerCase();
                if (this.sensitiveFields.some(field => lowerKey.includes(field))) {
                    params.set(key, '***MASKED***');
                }
            }

            urlObj.search = params.toString();
            return urlObj.toString();
        } catch {
            return url;
        }
    }

    /**
     * Create child logger with additional context
     */
    child(context = {}) {
        const childLogger = new Logger({
            serviceName: this.serviceName,
            version: this.version,
            environment: this.environment,
            logLevel: this.logLevel,
            enableConsole: this.enableConsole,
            enableFile: this.enableFile,
            logFile: this.logFile,
            enableStructuredLogging: this.enableStructuredLogging,
            enableTrace: this.enableTrace,
            sensitiveFields: this.sensitiveFields
        });

        // Copy current context
        for (const [key, value] of this.context) {
            childLogger.context.set(key, value);
        }

        // Add child context
        for (const [key, value] of Object.entries(context)) {
            childLogger.context.set(key, value);
        }

        childLogger.setTraceId(this.traceId);
        return childLogger;
    }
}

/**
 * Factory function to create logger instances
 */
function createLogger(serviceName, options = {}) {
    const defaults = {
        serviceName,
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
        enableStructuredLogging: process.env.ENABLE_STRUCTURED_LOGGING !== 'false',
        enableTrace: process.env.ENABLE_TRACE_LOGGING === 'true'
    };

    return new Logger({ ...defaults, ...options });
}

/**
 * Global logger instance for fallback
 */
const globalLogger = createLogger('talentsphere-global');

module.exports = {
    Logger,
    createLogger,
    globalLogger
};