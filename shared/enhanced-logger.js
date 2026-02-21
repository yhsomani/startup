/**
 * TalentSphere Enhanced Logger
 * Comprehensive logging system with structured logging and monitoring
 */

const winston = require('winston');
const path = require('path');

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Custom colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Custom format for logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, service, userId, requestId, correlationId, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    
    if (service) {log += ` [${service}]`;}
    if (requestId) {log += ` [req:${requestId}]`;}
    if (correlationId) {log += ` [corr:${correlationId}]`;}
    if (userId) {log += ` [user:${userId}]`;}
    
    log += `: ${message}`;
    
    // Add metadata
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create logger instance
const createLogger = (service = 'TalentSphere') => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    },
    transports: [
      // Console transport for development
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'development' ? customFormat : winston.format.json(),
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
      }),
      
      // File transport for all logs
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'app.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.json()
      }),
      
      // Error file transport
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: winston.format.json()
      })
    ],
    
    // Exception handling
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
        maxsize: 5242880,
        maxFiles: 5
      })
    ],
    
    // Rejection handling
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'rejections.log'),
        maxsize: 5242880,
        maxFiles: 5
      })
    ]
  });

  // Add request context methods
  logger.setRequestContext = (req) => {
    logger.defaultMeta = {
      ...logger.defaultMeta,
      requestId: req.requestId,
      correlationId: req.correlationId,
      userId: req.user?.userId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
  };

  // Clear request context
  logger.clearRequestContext = () => {
    const { requestId, correlationId, userId, method, url, userAgent, ip, ...rest } = logger.defaultMeta;
    logger.defaultMeta = rest;
  };

  // Log user action
  logger.logUserAction = (action, userId, details = {}) => {
    logger.info(`User action: ${action}`, {
      eventType: 'user_action',
      action,
      userId,
      ...details
    });
  };

  // Log security event
  logger.logSecurityEvent = (event, details = {}) => {
    logger.warn(`Security event: ${event}`, {
      eventType: 'security',
      securityEvent: event,
      ...details
    });
  };

  // Log performance metric
  logger.logPerformance = (operation, duration, details = {}) => {
    logger.info(`Performance: ${operation}`, {
      eventType: 'performance',
      operation,
      duration,
      ...details
    });
  };

  // Log API request
  logger.logApiRequest = (req, res, duration) => {
    const logData = {
      eventType: 'api_request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      responseSize: res.get('content-length') || 0,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.userId
    };

    if (res.statusCode >= 400) {
      logger.warn('API request failed', logData);
    } else {
      logger.info('API request completed', logData);
    }
  };

  // Log database operation
  logger.logDatabase = (operation, table, duration, details = {}) => {
    logger.info(`Database: ${operation}`, {
      eventType: 'database',
      operation,
      table,
      duration,
      ...details
    });
  };

  // Log external service call
  logger.logExternalService = (service, operation, duration, success, details = {}) => {
    const logData = {
      eventType: 'external_service',
      service,
      operation,
      duration,
      success,
      ...details
    };

    if (success) {
      logger.info(`External service call: ${service}.${operation}`, logData);
    } else {
      logger.warn(`External service call failed: ${service}.${operation}`, logData);
    }
  };

  return logger;
};

// Create default logger
const logger = createLogger();

// Performance monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
  }

  // Start timing an operation
  startTimer(operation, context = {}) {
    const timerId = `${operation}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, {
      operation,
      startTime: Date.now(),
      context
    });
    return timerId;
  }

  // End timing an operation
  endTimer(timerId, details = {}) {
    const timer = this.timers.get(timerId);
    if (!timer) {
      logger.warn('Timer not found', { timerId });
      return null;
    }

    const duration = Date.now() - timer.startTime;
    const result = {
      operation: timer.operation,
      duration,
      context: { ...timer.context, ...details }
    };

    // Log performance
    logger.logPerformance(timer.operation, duration, result);

    // Update metrics
    this.updateMetric(timer.operation, duration);

    // Clean up timer
    this.timers.delete(timerId);

    return result;
  }

  // Update operation metrics
  updateMetric(operation, duration) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0
      });
    }

    const metric = this.metrics.get(operation);
    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.avgDuration = metric.totalDuration / metric.count;
  }

  // Get all metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Get specific metric
  getMetric(operation) {
    return this.metrics.get(operation);
  }

  // Reset all metrics
  resetMetrics() {
    this.metrics.clear();
  }
}

// Create performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Middleware for automatic request logging
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Set request context in logger
  logger.setRequestContext(req);

  // Log request start
  logger.http(`${req.method} ${req.url}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logApiRequest(req, res, duration);
    logger.clearRequestContext();
  });

  next();
};

// Health check for logger
const healthCheck = () => {
  return {
    status: 'healthy',
    logger: {
      level: logger.level,
      transports: logger.transports.length,
      metrics: performanceMonitor.getMetrics()
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  logger,
  createLogger,
  performanceMonitor,
  requestLogger,
  healthCheck,
  levels,
  colors
};