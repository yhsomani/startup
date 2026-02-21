/**
 * TalentSphere Structured Logging System
 *
 * Comprehensive logging framework for all services with:
 * - Structured JSON output
 * - Trace correlation for distributed systems
 * - Performance metrics tracking
 * - Security event logging
 * - Multiple output transports (console, file, external services)
 */

const fs = require("fs");
const path = require("path");
const { format } = require("util");

class Logger {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.level = options.level || this.getLogLevel();
    this.enableFileLogging = options.enableFileLogging !== false;
    this.logDirectory = options.logDirectory || "./logs";
    this.enableConsole = options.enableConsole !== false;
    this.enableStructured = options.enableStructured !== false;
    this.metadata = options.metadata || {};

    // Enhanced structured logging features
    this.traceId = null;
    this.operationId = null;
    this.activeOperations = new Map();

    this.createLogDirectory();
    this.setColors();
  }

  /**
   * Get log level from environment
   */
  getLogLevel() {
    const envLevel = process.env.LOG_LEVEL || process.env.LOGGING_LEVEL;
    const levelMap = {
      fatal: 0,
      error: 1,
      warn: 2,
      info: 3,
      debug: 4,
    };

    return levelMap[envLevel] || 3; // Default to info
  }

  /**
   * Create log directory if it doesn't exist
   */
  createLogDirectory() {
    if (this.enableFileLogging) {
      const fullPath = path.resolve(this.logDirectory);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  /**
   * Set color scheme for console output
   */
  setColors() {
    this.colors = {
      fatal: "\x1b[31m", // Red
      error: "\x1b[31m", // Red
      warn: "\x1b[33m", // Yellow
      info: "\x1b[36m", // Cyan
      debug: "\x1b[37m", // White
    };
    this.reset = "\x1b[0m";
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    return level <= this.level;
  }

  /**
   * Format log message with metadata
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const levelNames = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
    const levelName = levelNames[level];

    const logEntry = {
      timestamp,
      level: levelName,
      service: this.serviceName,
      message: this.sanitizeMessage(message),
      metadata: { ...this.metadata, ...metadata },
      environment: process.env.NODE_ENV || 'development'
    };

    // Add trace correlation if available
    if (this.traceId) {
      logEntry.traceId = this.traceId;
    }
    if (this.operationId) {
      logEntry.operationId = this.operationId;
    }

    if (this.enableStructured) {
      return JSON.stringify(logEntry);
    }

    // Human readable format
    const metadataStr = Object.keys(logEntry.metadata).length > 0
      ? ` ${format('%o', logEntry.metadata)}`
      : '';

    const traceStr = this.traceId ? ` [trace:${this.traceId}]` : '';

    return `${this.colors[levelNames[level].toLowerCase()]}[${timestamp}] [${levelName}] [${this.serviceName}]${traceStr} ${message}${metadataStr}${this.reset}`;
  }

  /**
   * Sanitize message to prevent log injection
   */
  sanitizeMessage(message) {
    if (typeof message === 'string') {
      return message.replace(/[\r\n]/g, ' ').trim();
    }

    if (typeof message === 'object' && message !== null) {
      try {
        return JSON.stringify(message);
      } catch (error) {
        return '[Object]';
      }
    }

    return String(message);
  }



  /**
   * Write to file if enabled
   */
  writeToFile(logEntry) {
    if (this.enableFileLogging) {
      const logFile = path.join(this.logDirectory, `${this.serviceName}.log`);
      const logLine = JSON.stringify(logEntry) + "\n";

      fs.appendFile(logFile, logLine, err => {
        if (err && this.level >= 1) {
          // Only log file errors at error level or above
          console.error("Failed to write to log file:", err);
        }
      });
    }
  }

  /**
   * Log methods
   */
  fatal(message, metadata = {}) {
    if (this.shouldLog(0)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: "FATAL",
        service: this.serviceName,
        message,
        metadata: { ...this.metadata, ...metadata },
        stack: new Error().stack,
      };

      if (this.enableConsole) {
        console.error(this.formatMessage(0, message, metadata));
      }

      this.writeToFile(logEntry);
    }
  }

  error(message, metadata = {}) {
    if (this.shouldLog(1)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: "ERROR",
        service: this.serviceName,
        message,
        metadata: { ...this.metadata, ...metadata },
      };

      if (this.enableConsole) {
        console.error(this.formatMessage(1, message, metadata));
      }

      this.writeToFile(logEntry);
    }
  }

  warn(message, metadata = {}) {
    if (this.shouldLog(2)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: "WARN",
        service: this.serviceName,
        message,
        metadata: { ...this.metadata, ...metadata },
      };

      if (this.enableConsole) {
        console.warn(this.formatMessage(2, message, metadata));
      }

      this.writeToFile(logEntry);
    }
  }

  info(message, metadata = {}) {
    if (this.shouldLog(3)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        service: this.serviceName,
        message,
        metadata: { ...this.metadata, ...metadata },
      };

      if (this.enableConsole) {
        console.info(this.formatMessage(3, message, metadata));
      }

      this.writeToFile(logEntry);
    }
  }

  debug(message, metadata = {}) {
    if (this.shouldLog(4)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: "DEBUG",
        service: this.serviceName,
        message,
        metadata: { ...this.metadata, ...metadata },
      };

      if (this.enableConsole) {
        console.debug(this.formatMessage(4, message, metadata));
      }

      this.writeToFile(logEntry);
    }
  }

  /**
   * Performance logging
   */
  performance(operation, duration, metadata = {}) {
    const perfMetadata = {
      operation,
      duration,
      duration_ms: duration,
      ...metadata,
    };

    this.info(`Performance: ${operation} completed in ${duration}ms`, perfMetadata);
  }

  /**
   * HTTP Request/Response logging
   */
  http(req, res, responseTime) {
    const httpMetadata = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: responseTime,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress,
      contentLength: res.get("Content-Length"),
      requestId: req.headers["x-request-id"] || req.id,
    };

    const message = `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;

    if (res.statusCode >= 400) {
      this.warn(message, httpMetadata);
    } else {
      this.info(message, httpMetadata);
    }
  }

  /**
   * Database operation logging
   */
  database(operation, table, duration, affectedRows = 0, metadata = {}) {
    const dbMetadata = {
      operation,
      table,
      duration,
      affectedRows,
      ...metadata,
    };

    this.info(
      `Database: ${operation} on ${table} affected ${affectedRows} rows in ${duration}ms`,
      dbMetadata
    );
  }

  /**
   * Security event logging
   */
  security(event, details = {}) {
    const securityMetadata = {
      eventType: "SECURITY",
      event,
      severity: details.severity || "MEDIUM",
      ip: details.ip,
      userAgent: details.userAgent,
      userId: details.userId,
      timestamp: new Date().toISOString(),
      ...details,
    };

    this.warn(`Security Event: ${event}`, securityMetadata);
  }

  /**
   * Service communication logging
   */
  service(service, operation, duration, status, error = null) {
    const serviceMetadata = {
      targetService: service,
      operation,
      duration,
      status,
      error: error ? error.message : null,
    };

    const message = `Service Call: ${service}.${operation} - ${status} - ${duration}ms`;

    if (error || status === "ERROR") {
      this.error(message, serviceMetadata);
    } else {
      this.info(message, serviceMetadata);
    }
  }

  /**
   * Create child logger with additional metadata
   */
  child(additionalMetadata) {
    return new Logger(this.serviceName, {
      ...this.options,
      metadata: { ...this.metadata, ...additionalMetadata },
    });
  }

  /**
   * Get transport information
   */
  getTransports() {
    return {
      console: this.enableConsole,
      file: this.enableFileLogging,
      structured: this.enableStructured,
    };
  }

  /**
     * Change log level at runtime
     */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Set trace context for distributed tracing
   */
  setTraceContext(traceId, operationId = null) {
    this.traceId = traceId;
    this.operationId = operationId;
  }

  /**
   * Clear trace context
   */
  clearTraceContext() {
    this.traceId = null;
    this.operationId = null;
  }

  /**
   * Start operation tracking
   */
  startOperation(operationName, metadata = {}) {
    const { v4: uuidv4 } = require('uuid');
    const operationId = uuidv4();
    const startTime = Date.now();

    this.activeOperations.set(operationId, {
      name: operationName,
      startTime,
      metadata
    });

    this.operationId = operationId;
    this.traceId = metadata.traceId || uuidv4();

    this.debug(`Operation started: ${operationName}`, {
      operationId,
      operationName,
      ...metadata
    });

    return operationId;
  }

  /**
   * End operation tracking
   */
  endOperation(operationId, result = null, error = null) {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.warn('Operation not found', { operationId });
      return;
    }

    const duration = Date.now() - operation.startTime;
    const success = !error;

    this.info(`Operation completed: ${operation.name}`, {
      operationId,
      operationName: operation.name,
      duration: `${duration}ms`,
      success,
      result: success ? 'success' : 'failed',
      ...operation.metadata
    });

    if (error) {
      this.error('Operation failed', {
        operationId,
        operationName: operation.name,
        error: error.message,
        stack: error.stack
      });
    }

    this.activeOperations.delete(operationId);
    this.operationId = null;

    return {
      operationId,
      duration,
      success,
      result,
      error
    };
  }

  /**
   * HTTP request logging middleware
   */
  requestLogger() {
    return (req, res, next) => {
      const { v4: uuidv4 } = require('uuid');
      const traceId = req.headers['x-trace-id'] || uuidv4();
      req.traceId = traceId;
      this.setTraceContext(traceId);

      const startTime = Date.now();

      this.info('HTTP Request', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        traceId
      });

      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;

        this.info('HTTP Response', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          traceId,
          responseSize: data ? data.length : 0
        });

        originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }

  /**
   * Enhanced security event logging
   */
  securityEvent(eventType, details = {}) {
    const securityMetadata = {
      eventType: 'SECURITY',
      event: eventType,
      severity: details.severity || 'MEDIUM',
      ip: details.ip,
      userAgent: details.userAgent,
      userId: details.userId,
      timestamp: new Date().toISOString(),
      traceId: this.traceId,
      ...details
    };

    this.warn(`Security Event: ${eventType}`, securityMetadata);
  }

  /**
   * Business event logging
   */
  businessEvent(eventType, eventData = {}) {
    const businessMetadata = {
      eventType: 'BUSINESS',
      event: eventType,
      timestamp: new Date().toISOString(),
      traceId: this.traceId,
      operationId: this.operationId,
      ...eventData
    };

    this.info(`Business Event: ${eventType}`, businessMetadata);
  }
}

/**
 * Create logger with service name
 */
function createLogger(serviceName, options = {}) {
  return new Logger(serviceName, options);
}

/**
 * Default logger for backward compatibility
 */
const defaultLogger = createLogger("TalentSphere");

module.exports = {
  Logger,
  createLogger,
  defaultLogger,
};
