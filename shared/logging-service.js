/**
 * Centralized Logging Service Integration for TalentSphere
 * Provides unified logging across all services
 */

const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const { format } = winston;

// Custom log levels
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

// Custom colors
const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'cyan'
};

winston.addColors(customColors);

// Custom log format
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  format.json(),
  format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Service-specific logger factory
class ServiceLogger {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.logger = this.createLogger(options);
    this.metrics = {
      logsCount: 0,
      errorCount: 0,
      warnCount: 0,
      lastLogTime: null
    };
  }

  createLogger(options) {
    const transports = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_CONSOLE === 'true') {
      transports.push(
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp({ format: 'HH:mm:ss' }),
            format.printf(({ timestamp, level, message, metadata }) => {
              let log = `${timestamp} [${this.serviceName}] ${level}: ${message}`;
              if (Object.keys(metadata).length > 0) {
                log += ` ${JSON.stringify(metadata)}`;
              }
              return log;
            })
          )
        })
      );
    }

    // File transports
    if (process.env.LOG_FILE === 'true' || process.env.NODE_ENV === 'production') {
      // Error log file
      transports.push(
        new winston.transports.File({
          filename: `logs/errors/${this.serviceName}-error.log`,
          level: 'error',
          format: format.combine(
            format.timestamp(),
            format.json()
          ),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      );

      // Combined log file
      transports.push(
        new winston.transports.File({
          filename: `logs/runtime/${this.serviceName}-combined.log`,
          format: customFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      );
    }

    // Elasticsearch transport for centralized logging
    if (process.env.ELASTICSEARCH_URL && process.env.NODE_ENV === 'production') {
      transports.push(
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL,
            auth: process.env.ELASTICSEARCH_AUTH ?
              JSON.parse(process.env.ELASTICSEARCH_AUTH) : undefined
          },
          index: `talentsphere-logs-${this.serviceName}`,
          transformer: (logData) => {
            const { timestamp, level, message, metadata, stack } = logData;
            return {
              '@timestamp': new Date(timestamp),
              service: this.serviceName,
              level,
              message,
              metadata,
              stack,
              environment: process.env.NODE_ENV
            };
          }
        })
      );
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      levels: customLevels,
      format: customFormat,
      defaultMeta: {
        service: this.serviceName,
        version: process.env.SERVICE_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      transports,
      exitOnError: false
    });
  }

  // Enhanced logging methods with context
  log(level, message, metadata = {}) {
    const enrichedMetadata = {
      ...metadata,
      requestId: metadata.requestId || this.generateRequestId(),
      userId: metadata.userId || null,
      sessionId: metadata.sessionId || null,
      timestamp: new Date().toISOString(),
      service: this.serviceName
    };

    this.logger.log(level, message, enrichedMetadata);
    this.updateMetrics(level);
  }

  error(message, metadata = {}) {
    this.log('error', message, { ...metadata, type: 'error' });
  }

  warn(message, metadata = {}) {
    this.log('warn', message, { ...metadata, type: 'warning' });
  }

  info(message, metadata = {}) {
    this.log('info', message, { ...metadata, type: 'info' });
  }

  http(message, metadata = {}) {
    this.log('http', message, { ...metadata, type: 'http' });
  }

  debug(message, metadata = {}) {
    this.log('debug', message, { ...metadata, type: 'debug' });
  }

  trace(message, metadata = {}) {
    this.log('trace', message, { ...metadata, type: 'trace' });
  }

  // Request/Response logging
  logRequest(req, additionalData = {}) {
    const requestData = {
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      body: this.sanitizeBody(req.body),
      ...additionalData
    };

    this.http(`${req.method} ${req.originalUrl}`, {
      type: 'request',
      requestId: req.requestId,
      userId: req.user?.userId,
      ...requestData
    });
  }

  logResponse(req, res, responseTime, additionalData = {}) {
    const responseData = {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0,
      ...additionalData
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${req.method} ${req.originalUrl} - ${res.statusCode}`, {
      type: 'response',
      requestId: req.requestId,
      userId: req.user?.userId,
      ...responseData
    });
  }

  // Error logging with stack trace
  logError(error, additionalData = {}) {
    this.error(error.message, {
      type: 'application_error',
      stack: error.stack,
      name: error.name,
      code: error.code,
      requestId: additionalData.requestId,
      userId: additionalData.userId,
      ...additionalData
    });
  }

  // Performance logging
  logPerformance(operation, duration, additionalData = {}) {
    this.info(`Performance: ${operation} completed in ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...additionalData
    });
  }

  // Security events
  logSecurity(event, details, additionalData = {}) {
    this.warn(`Security Event: ${event}`, {
      type: 'security',
      event,
      details,
      ...additionalData
    });
  }

  // Business events
  logBusiness(event, details, additionalData = {}) {
    this.info(`Business Event: ${event}`, {
      type: 'business',
      event,
      details,
      ...additionalData
    });
  }

  // Utility methods
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  sanitizeBody(body) {
    if (!body) { return body; }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  updateMetrics(level) {
    this.metrics.logsCount++;
    this.metrics.lastLogTime = new Date();

    if (level === 'error') { this.metrics.errorCount++; }
    if (level === 'warn') { this.metrics.warnCount++; }
  }

  getMetrics() {
    return {
      ...this.metrics,
      serviceName: this.serviceName,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      pid: process.pid
    };
  }
}

// Singleton instances for each service
const serviceLoggers = new Map();

/**
 * Get or create logger for a service
 */
function getLogger(serviceName, options = {}) {
  if (!serviceLoggers.has(serviceName)) {
    serviceLoggers.set(serviceName, new ServiceLogger(serviceName, options));
  }
  return serviceLoggers.get(serviceName);
}

/**
 * Express middleware for automatic request/response logging
 */
function requestLogger(serviceName, options = {}) {
  const logger = getLogger(serviceName);

  return (req, res, next) => {
    const startTime = Date.now();

    // Generate request ID if not present
    req.requestId = req.requestId || logger.generateRequestId();

    // Log request
    logger.logRequest(req, options.requestData);

    // Log response when finished
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logger.logResponse(req, res, responseTime, options.responseData);
    });

    next();
  };
}

/**
 * Error logging middleware
 */
function errorLogger(serviceName, options = {}) {
  const logger = getLogger(serviceName);

  return (err, req, res, next) => {
    logger.logError(err, {
      requestId: req.requestId,
      userId: req.user?.userId,
      method: req.method,
      url: req.originalUrl,
      headers: logger.sanitizeHeaders(req.headers),
      body: logger.sanitizeBody(req.body),
      ...options.errorData
    });

    next(err);
  };
}

/**
 * Performance monitoring decorator
 */
function performanceLogger(serviceName, operation) {
  const logger = getLogger(serviceName);

  return function (target, propertyName, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger.logPerformance(operation, duration, {
          success: true,
          args: args.length
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.logPerformance(operation, duration, {
          success: false,
          error: error.message,
          args: args.length
        });

        throw error;
      }
    };

    return descriptor;
  };
}

// Aggregate metrics from all services
function getAllMetrics() {
  const metrics = {};

  serviceLoggers.forEach((logger, serviceName) => {
    metrics[serviceName] = logger.getMetrics();
  });

  return metrics;
}

// Health check for logging system
async function checkHealth() {
  try {
    // Test logging functionality
    const testLogger = getLogger('health-check');
    await new Promise((resolve) => {
      testLogger.info('Health check test log');
      setTimeout(resolve, 100);
    });

    return {
      status: 'healthy',
      serviceCount: serviceLoggers.size,
      services: Array.from(serviceLoggers.keys()),
      metrics: getAllMetrics()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

module.exports = {
  ServiceLogger,
  getLogger,
  requestLogger,
  errorLogger,
  performanceLogger,
  getAllMetrics,
  checkHealth
};