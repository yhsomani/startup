/**
 * Frontend Logger Service
 * Browser-compatible logging utility for TalentSphere frontend
 */

class Logger {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.level = options.level || this.getLogLevel();
    this.enableConsole = options.enableConsole !== false;
    this.enableStorage = options.enableStorage || false;
    this.metadata = options.metadata || {};
  }

  getLogLevel() {
    // Return 'debug' in development, 'info' in production
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  shouldLog(level) {
    const levels = {
      'error': 0,
      'warn': 1,
      'info': 2,
      'debug': 3
    };
    
    return levels[level] <= levels[this.level];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metadata = { ...this.metadata, ...meta };
    
    return {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      message,
      metadata,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatMessage(level, message, meta);

    // Console logging
    if (this.enableConsole && window.console) {
      const logMethod = console[level] || console.log;
      logMethod.call(console, `[${logEntry.service}] ${message}`, logEntry);
    }

    // Local storage logging for production
    if (this.enableStorage && level === 'error') {
      this.logToStorage(logEntry);
    }
  }

  logToStorage(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('talentsphere_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('talentsphere_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to log to storage:', error);
    }
  }

  // Log methods
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Specialized methods
  userAction(action, details = {}) {
    this.info(`User action: ${action}`, {
      type: 'user_action',
      action,
      ...details
    });
  }

  apiCall(method, url, status, duration, error = null) {
    const level = status >= 400 ? 'warn' : 'debug';
    this.log(level, `API ${method} ${url} - ${status}`, {
      type: 'api_call',
      method,
      url,
      status,
      duration,
      error: error?.message
    });
  }

  performance(metric, value, unit = 'ms') {
    this.debug(`Performance: ${metric} = ${value}${unit}`, {
      type: 'performance',
      metric,
      value,
      unit
    });
  }

  // Get logs from storage
  getStoredLogs() {
    try {
      return JSON.parse(localStorage.getItem('talentsphere_logs') || '[]');
    } catch (error) {
      console.warn('Failed to get logs from storage:', error);
      return [];
    }
  }

  // Clear logs from storage
  clearStoredLogs() {
    try {
      localStorage.removeItem('talentsphere_logs');
    } catch (error) {
      console.warn('Failed to clear logs from storage:', error);
    }
  }
}

// Create logger function
const createLogger = (serviceName, options = {}) => {
  return new Logger(serviceName, options);
};

// Export singleton instance for backward compatibility
const logger = new Logger('FrontendApp');

export {
  Logger,
  createLogger,
  logger
};

export default createLogger;