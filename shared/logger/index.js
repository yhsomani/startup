/**
 * Centralized Logging System for TalentSphere
 * Provides structured, leveled logging with correlation tracking
 */

const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const { format } = require('winston');
const fs = require('fs');
const path = require('path');

// Ensure log subdirectories exist
const LOG_ROOT = path.resolve(process.env.LOG_DIR || './logs');
['runtime', 'errors'].forEach(dir => {
  const dirPath = path.join(LOG_ROOT, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// Custom format for structured logging
const customFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, service, correlationId, userId, ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      message,
      service,
      correlationId,
      userId,
      ...meta
    };

    // Clean sensitive data from logs
    if (logEntry.password || logEntry.token || logEntry.apiKey) {
      logEntry.sensitive = true;
      delete logEntry.password;
      delete logEntry.token;
      delete logEntry.apiKey;
    }

    return JSON.stringify(logEntry);
  })
);

class CentralizedLogger {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.correlationId = options.correlationId || null;

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      defaultMeta: {
        service: serviceName,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(({ timestamp, level, message, service, correlationId }) => {
              const correlation = correlationId ? ` [${correlationId}]` : '';
              return `${timestamp} [${level}]${correlation} [${service}]: ${message}`;
            })
          )
        }),

        // File transport for production
        new winston.transports.File({
          filename: path.join(LOG_ROOT, 'runtime', `${serviceName}-${process.env.NODE_ENV || 'development'}.log`),
          maxSize: '20m',
          maxFiles: '14d',
          tailable: true
        }),

        // Elasticsearch for centralized logging (if configured)
        ...(process.env.ELASTICSEARCH_URL ? [
          new ElasticsearchTransport({
            level: 'info',
            clientOpts: {
              node: process.env.ELASTICSEARCH_URL,
              auth: {
                username: process.env.ELASTICSEARCH_USER,
                password: process.env.ELASTICSEARCH_PASS
              }
            },
            index: `talentsphere-logs-${process.env.NODE_ENV || 'development'}-${new Date().toISOString().split('T')[0]}`,
            transformer: (logEntry) => ({
              '@timestamp': new Date(logEntry.timestamp).toISOString(),
              level: logEntry.level,
              service: logEntry.service,
              message: logEntry.message,
              correlation_id: logEntry.correlationId,
              user_id: logEntry.userId,
              environment: logEntry.environment,
              ...logEntry
            })
          })
        ] : [])
      ],

      // Exception handling
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(LOG_ROOT, 'errors', `${serviceName}-exceptions.log`),
          maxSize: '20m',
          maxFiles: '30d'
        })
      ],

      // Rejection handling
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(LOG_ROOT, 'errors', `${serviceName}-rejections.log`),
          maxSize: '20m',
          maxFiles: '30d'
        })
      ],

      // Exit handling
      exitOnError: false
    });

    // Handle uncaught exceptions
    this.logger.exceptions.handle(
      new Error('Uncaught Exception')
    );

    // Handle unhandled promise rejections
    this.logger.rejections.handle(
      new Error('Unhandled Rejection')
    );
  }

  // Set correlation ID for request tracing
  setCorrelationId(correlationId) {
    this.correlationId = correlationId;
    this.logger.defaultMeta = {
      ...this.logger.defaultMeta,
      correlationId
    };
  }

  // Log levels with structured data
  debug(message, meta = {}) {
    this.logger.debug(message, { ...meta, correlationId: this.correlationId });
  }

  info(message, meta = {}) {
    this.logger.info(message, { ...meta, correlationId: this.correlationId });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { ...meta, correlationId: this.correlationId });
  }

  error(message, error = null, meta = {}) {
    this.logger.error(message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      ...meta,
      correlationId: this.correlationId
    });
  }

  // Specialized logging methods
  request(req, res, next) {
    const startTime = Date.now();

    // Log request start
    this.info('Request started', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });

    // Capture response
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      this.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    });

    next();
  }

  database(query, params, duration, error = null) {
    const logData = {
      query: this.sanitizeQuery(query),
      params: this.sanitizeParams(params),
      duration,
      error: error ? {
        name: error.name,
        message: error.message
      } : null
    };

    if (error) {
      this.error('Database query failed', error, logData);
    } else {
      this.info('Database query executed', logData);
    }
  }

  security(event, details = {}) {
    this.warn('Security event detected', {
      event,
      ...details,
      security: true
    });
  }

  performance(operation, duration, metadata = {}) {
    this.info('Performance metric', {
      operation,
      duration,
      ...metadata,
      performance: true
    });
  }

  // Business event logging
  business(event, userId, properties = {}) {
    this.info('Business event', {
      event,
      userId,
      properties,
      business: true
    });
  }

  // Helper methods to sanitize sensitive data
  sanitizeQuery(query) {
    if (!query) return null;

    return query.toString()
      .replace(/password\s*=\s*['"][^'"]*['"]/, 'password=***')
      .replace(/token\s*=\s*['"][^'"]*['"]/, 'token=***')
      .substring(0, 1000); // Limit query length in logs
  }

  sanitizeParams(params) {
    if (!params) return null;

    const sanitized = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        sanitized[key] = value.substring(0, 100); // Limit param values in logs
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Health check for logger
  health() {
    return {
      status: 'healthy',
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      transports: this.logger.transports.map(t => ({
        type: t.name,
        status: 'active'
      }))
    };
  }
}

// Factory function for creating logger instances
const createLogger = (serviceName, options) => {
  return new CentralizedLogger(serviceName, options);
};

// Default logger export
module.exports = {
  CentralizedLogger,
  createLogger
};