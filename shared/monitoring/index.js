/**
 * TalentSphere Runtime Error Prevention and Monitoring System
 * Comprehensive error prevention, detection, and monitoring for zero-runtime-errors
 */

const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

/**
 * Error categories for classification
 */
const ErrorCategories = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  BUSINESS_LOGIC: 'business_logic',
  DATA_ACCESS: 'data_access',
  EXTERNAL_SERVICE: 'external_service',
  SYSTEM: 'system',
  CONTRACT: 'contract',
  PERFORMANCE: 'performance',
  SECURITY: 'security'
};

/**
 * Error severity levels
 */
const ErrorSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

/**
 * Error classification result
 */
class ErrorClassification {
  constructor(error, context = {}) {
    this.error = error;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.category = this.classifyError(error);
    this.severity = this.determineSeverity(error, this.category);
    this.preventable = this.isPreventable(error);
    this.recommendations = this.getRecommendations(error, this.category);
  }

  /**
   * Classify error by type and message
   */
  classifyError(error) {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    // Validation errors
    if (code.includes('validation') || message.includes('validation') || 
        message.includes('required') || message.includes('invalid')) {
      return ErrorCategories.VALIDATION;
    }

    // Authentication errors
    if (code.includes('auth') || message.includes('unauthorized') || 
        message.includes('not authenticated') || message.includes('token')) {
      return ErrorCategories.AUTHENTICATION;
    }

    // Authorization errors
    if (code.includes('forbidden') || message.includes('permission') || 
        message.includes('access denied')) {
      return ErrorCategories.AUTHORIZATION;
    }

    // Data access errors
    if (code.includes('database') || code.includes('sql') || 
        code.includes('connection') || message.includes('timeout') ||
        stack.includes('pg') || stack.includes('mysql')) {
      return ErrorCategories.DATA_ACCESS;
    }

    // External service errors
    if (code.includes('external') || code.includes('api') || 
        message.includes('network') || message.includes('fetch')) {
      return ErrorCategories.EXTERNAL_SERVICE;
    }

    // Contract errors
    if (code.includes('contract') || message.includes('contract') || 
        message.includes('schema') || message.includes('validation failed')) {
      return ErrorCategories.CONTRACT;
    }

    // System errors
    if (code.includes('system') || message.includes('out of memory') || 
        message.includes('file not found') || stack.includes('node_modules')) {
      return ErrorCategories.SYSTEM;
    }

    // Security errors
    if (code.includes('security') || message.includes('injection') || 
        message.includes('xss') || message.includes('csrf')) {
      return ErrorCategories.SECURITY;
    }

    // Business logic errors
    return ErrorCategories.BUSINESS_LOGIC;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, category) {
    // Critical errors
    if (category === ErrorCategories.SECURITY || 
        category === ErrorCategories.SYSTEM ||
        error.code === 'EMERGENCY') {
      return ErrorSeverity.CRITICAL;
    }

    // High severity
    if (category === ErrorCategories.DATA_ACCESS ||
        category === ErrorCategories.EXTERNAL_SERVICE ||
        error.code === 'ENOTFOUND') {
      return ErrorSeverity.HIGH;
    }

    // Medium severity
    if (category === ErrorCategories.BUSINESS_LOGIC ||
        category === ErrorCategories.AUTHENTICATION ||
        category === ErrorCategories.AUTHORIZATION) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity
    if (category === ErrorCategories.VALIDATION ||
        category === ErrorCategories.CONTRACT) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.INFO;
  }

  /**
   * Check if error was preventable
   */
  isPreventable(error) {
    const preventableCodes = [
      'VALIDATION_ERROR',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'RATE_LIMIT_EXCEEDED'
    ];

    return preventableCodes.includes(error.code) ||
           error.code === 'TypeError' ||
           error.code === 'ReferenceError' ||
           error.name === 'TypeError' ||
           error.name === 'ReferenceError';
  }

  /**
   * Get prevention recommendations
   */
  getRecommendations(error, category) {
    const recommendations = {
      [ErrorCategories.VALIDATION]: [
        'Add input validation before processing',
        'Use schema validation libraries',
        'Implement proper error handling'
      ],
      [ErrorCategories.AUTHENTICATION]: [
        'Verify authentication token format',
        'Check token expiration',
        'Implement token refresh logic'
      ],
      [ErrorCategories.AUTHORIZATION]: [
        'Verify user permissions before access',
        'Implement proper role-based access control',
        'Check resource ownership'
      ],
      [ErrorCategories.DATA_ACCESS]: [
        'Use parameterized queries',
        'Implement connection pooling',
        'Add proper error handling for database operations'
      ],
      [ErrorCategories.EXTERNAL_SERVICE]: [
        'Implement retry logic with exponential backoff',
        'Add circuit breaker pattern',
        'Implement proper timeout handling'
      ],
      [ErrorCategories.CONTRACT]: [
        'Validate request/response contracts',
        'Use automated contract testing',
        'Implement runtime contract enforcement'
      ],
      [ErrorCategories.SYSTEM]: [
        'Monitor system resources',
        'Implement graceful degradation',
        'Add system health checks'
      ],
      [ErrorCategories.SECURITY]: [
        'Implement input sanitization',
        'Add security headers',
        'Implement rate limiting and captcha'
      ]
    };

    return recommendations[category] || ['Implement general error prevention'];
  }
}

// =============================================================================
// ERROR MONITORING
// =============================================================================

/**
 * Error monitoring system
 */
class ErrorMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxStoredErrors: 1000,
      alertThreshold: 10, // alerts after 10 errors in 5 minutes
      reportInterval: 60000, // 1 minute
      logLevel: 'info',
      ...options
    };
    
    this.errors = [];
    this.errorCounts = new Map();
    this.alerts = [];
    this.stats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      preventableErrors: 0
    };
    
    this.startPeriodicReporting();
  }

  /**
   * Record an error
   */
  recordError(error, context = {}) {
    const classification = new ErrorClassification(error, context);
    const errorRecord = {
      id: this.generateErrorId(),
      classification,
      stack: error.stack,
      context,
      timestamp: classification.timestamp
    };

    // Store error
    this.errors.push(errorRecord);
    if (this.errors.length > this.options.maxStoredErrors) {
      this.errors.shift();
    }

    // Update statistics
    this.updateStats(classification);

    // Emit events
    this.emit('error', errorRecord);
    this.emit('error-category', classification.category);
    this.emit('error-severity', classification.severity);

    // Check alert conditions
    this.checkAlerts(classification);

    return errorRecord;
  }

  /**
   * Update statistics
   */
  updateStats(classification) {
    this.stats.totalErrors++;
    
    // Category statistics
    const category = classification.category;
    this.stats.errorsByCategory[category] = (this.stats.errorsByCategory[category] || 0) + 1;
    
    // Severity statistics
    const severity = classification.severity;
    this.stats.errorsBySeverity[severity] = (this.stats.errorsBySeverity[severity] || 0) + 1;
    
    // Preventable errors
    if (classification.preventable) {
      this.stats.preventableErrors++;
    }
  }

  /**
   * Check alert conditions
   */
  checkAlerts(classification) {
    // High severity alert
    if (classification.severity === ErrorSeverity.CRITICAL) {
      this.createAlert('CRITICAL_ERROR', 'Critical error detected', classification);
    }

    // Error rate alert
    const recentErrors = this.getRecentErrors(300000); // 5 minutes
    if (recentErrors.length >= this.options.alertThreshold) {
      this.createAlert('HIGH_ERROR_RATE', 'High error rate detected', {
        recentErrors: recentErrors.length,
        threshold: this.options.alertThreshold
      });
    }

    // Preventable error alert
    if (classification.preventable) {
      this.createAlert('PREVENTABLE_ERROR', 'Preventable error detected', classification);
    }
  }

  /**
   * Create alert
   */
  createAlert(type, message, data = {}) {
    const alert = {
      id: this.generateAlertId(),
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    console.error(`🚨 ALERT [${type}]: ${message}`, data);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(timeWindow = 300000) {
    const cutoff = Date.now() - timeWindow;
    return this.errors.filter(error => 
      new Date(error.timestamp).getTime() > cutoff
    );
  }

  /**
   * Generate error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    setInterval(() => {
      this.emit('periodic-report', this.getReport());
    }, this.options.reportInterval);
  }

  /**
   * Get comprehensive report
   */
  getReport() {
    return {
      timestamp: new Date().toISOString(),
      errors: this.errors.slice(-100), // Last 100 errors
      alerts: this.alerts.filter(alert => !alert.acknowledged),
      statistics: this.stats,
      recommendations: this.getSystemRecommendations()
    };
  }

  /**
   * Get system recommendations
   */
  getSystemRecommendations() {
    const recommendations = [];
    
    // High preventable error rate
    const preventableRate = this.stats.preventableErrors / this.stats.totalErrors;
    if (preventableRate > 0.5) {
      recommendations.push('High rate of preventable errors - improve error prevention');
    }

    // High critical errors
    const criticalErrors = this.stats.errorsBySeverity[ErrorSeverity.CRITICAL] || 0;
    if (criticalErrors > 0) {
      recommendations.push('Critical errors detected - immediate attention required');
    }

    // High validation errors
    const validationErrors = this.stats.errorsByCategory[ErrorCategories.VALIDATION] || 0;
    if (validationErrors > 10) {
      recommendations.push('High validation error rate - review input validation');
    }

    // High system errors
    const systemErrors = this.stats.errorsByCategory[ErrorCategories.SYSTEM] || 0;
    if (systemErrors > 5) {
      recommendations.push('System errors detected - check infrastructure');
    }

    return recommendations;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }
}

// =============================================================================
// ERROR PREVENTION UTILITIES
// =============================================================================

/**
 * Error prevention utilities
 */
class ErrorPrevention {
  constructor() {
    this.preventionRules = new Map();
    this.setupDefaultRules();
  }

  /**
   * Setup default prevention rules
   */
  setupDefaultRules() {
    // Null/undefined prevention
    this.addRule('null-check', (value, context) => {
      if (value === null || value === undefined) {
        throw new Error(`Null/undefined value detected in ${context.path || 'unknown'}`);
      }
    });

    // Type checking
    this.addRule('type-check', (value, context) => {
      if (context.expectedType && typeof value !== context.expectedType) {
        throw new Error(`Type mismatch in ${context.path || 'unknown'}: expected ${context.expectedType}, got ${typeof value}`);
      }
    });

    // Range checking
    this.addRule('range-check', (value, context) => {
      if (context.min !== undefined && value < context.min) {
        throw new Error(`Value ${value} below minimum ${context.min} in ${context.path || 'unknown'}`);
      }
      if (context.max !== undefined && value > context.max) {
        throw new Error(`Value ${value} above maximum ${context.max} in ${context.path || 'unknown'}`);
      }
    });

    // Length checking
    this.addRule('length-check', (value, context) => {
      if (typeof value === 'string') {
        if (context.minLength !== undefined && value.length < context.minLength) {
          throw new Error(`String length ${value.length} below minimum ${context.minLength} in ${context.path || 'unknown'}`);
        }
        if (context.maxLength !== undefined && value.length > context.maxLength) {
          throw new Error(`String length ${value.length} above maximum ${context.maxLength} in ${context.path || 'unknown'}`);
        }
      }
    });

    // Array checking
    this.addRule('array-check', (value, context) => {
      if (Array.isArray(value)) {
        if (context.minItems !== undefined && value.length < context.minItems) {
          throw new Error(`Array length ${value.length} below minimum ${context.minItems} in ${context.path || 'unknown'}`);
        }
        if (context.maxItems !== undefined && value.length > context.maxItems) {
          throw new Error(`Array length ${value.length} above maximum ${context.maxItems} in ${context.path || 'unknown'}`);
        }
      } else if (context.required) {
        throw new Error(`Required array is missing in ${context.path || 'unknown'}`);
      }
    });
  }

  /**
   * Add prevention rule
   */
  addRule(name, validator) {
    this.preventionRules.set(name, validator);
  }

  /**
   * Validate with all rules
   */
  validate(value, context = {}) {
    const results = [];
    
    for (const [ruleName, validator] of this.preventionRules) {
      try {
        validator(value, context);
      } catch (error) {
        results.push({
          rule: ruleName,
          error: error.message,
          path: context.path
        });
      }
    }

    return results;
  }

  /**
   * Safe property access
   */
  safeGet(obj, path, defaultValue = null) {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) || defaultValue;
    } catch (error) {
      console.warn(`Safe access failed for path: ${path}`, error);
      return defaultValue;
    }
  }

  /**
   * Safe function call
   */
  safeCall(fn, context = {}) {
    return (...args) => {
      try {
        const result = fn(...args);
        
        // Validate result if validator provided
        if (context.validator) {
          const validationResults = this.validate(result, context);
          if (validationResults.length > 0) {
            throw new Error(`Function result validation failed: ${validationResults.map(r => r.error).join(', ')}`);
          }
        }
        
        return result;
      } catch (error) {
        if (context.onError) {
          context.onError(error, context);
        } else {
          console.error(`Safe call failed for function: ${fn.name || 'anonymous'}`, error);
        }
        
        return context.defaultReturn;
      }
    };
  }

  /**
   * Safe async function call
   */
  safeAsyncCall(fn, context = {}) {
    return async (...args) => {
      try {
        const result = await fn(...args);
        
        // Validate result if validator provided
        if (context.validator) {
          const validationResults = this.validate(result, context);
          if (validationResults.length > 0) {
            throw new Error(`Async function result validation failed: ${validationResults.map(r => r.error).join(', ')}`);
          }
        }
        
        return result;
      } catch (error) {
        if (context.onError) {
          context.onError(error, context);
        } else {
          console.error(`Safe async call failed for function: ${fn.name || 'anonymous'}`, error);
        }
        
        return context.defaultReturn;
      }
    };
  }
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Performance monitoring system
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      responseTime: 1000, // 1 second
      memoryUsage: 80, // 80%
      cpuUsage: 80 // 80%
    };
  }

  /**
   * Start operation timing
   */
  startTiming(operation) {
    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    
    return {
      startTime,
      memoryBefore,
      operation,
      end: () => this.endTiming(operation, startTime, memoryBefore)
    };
  }

  /**
   * End operation timing
   */
  endTiming(operation, startTime, memoryBefore) {
    const endTime = performance.now();
    const memoryAfter = process.memoryUsage();
    const duration = endTime - startTime;
    const memoryDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;

    const metric = {
      operation,
      duration,
      memoryBefore,
      memoryAfter,
      memoryDiff,
      timestamp: new Date().toISOString()
    };

    this.metrics.set(`${operation}_${startTime}`, metric);

    // Check performance thresholds
    if (duration > this.thresholds.responseTime) {
      console.warn(`⚠️ Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }

    if (memoryDiff > 0) {
      console.warn(`⚠️ Memory leak detected in ${operation}: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
    }

    return metric;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const metrics = Array.from(this.metrics.values());
    
    return {
      operations: metrics.length,
      averageResponseTime: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
      slowestOperation: metrics.reduce((max, m) => m.duration > max.duration ? m : max, metrics[0]),
      totalMemoryUsed: metrics.reduce((sum, m) => sum + m.memoryAfter.heapUsed, 0),
      recentOperations: metrics.slice(-100)
    };
  }

  /**
   * Clear old metrics
   */
  clearMetrics(olderThan = 3600000) { // 1 hour default
    const cutoff = Date.now() - olderThan;
    
    for (const [key, metric] of this.metrics) {
      if (new Date(metric.timestamp).getTime() < cutoff) {
        this.metrics.delete(key);
      }
    }
  }
}

// =============================================================================
// GLOBAL INSTANCES
// =============================================================================

const errorMonitor = new ErrorMonitor();
const errorPrevention = new ErrorPrevention();
const performanceMonitor = new PerformanceMonitor();

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Wrap function with error prevention and monitoring
 */
function wrapFunction(fn, options = {}) {
  const {
    operation = fn.name || 'anonymous',
    category = null,
    context = {},
    validator = null
  } = options;

  return errorPrevention.safeCall(fn, {
    operation,
    validator,
    onError: (error, ctx) => {
      errorMonitor.recordError(error, {
        operation,
        category,
        context: { ...context, ...ctx }
      });
    }
  });
}

/**
 * Wrap async function with error prevention and monitoring
 */
function wrapAsyncFunction(fn, options = {}) {
  const {
    operation = fn.name || 'anonymous',
    category = null,
    context = {},
    validator = null
  } = options;

  return errorPrevention.safeAsyncCall(fn, {
    operation,
    validator,
    onError: (error, ctx) => {
      errorMonitor.recordError(error, {
        operation,
        category,
        context: { ...context, ...ctx }
      });
    }
  });
}

/**
 * Middleware factory for Express
 */
function createErrorMiddleware(options = {}) {
  return (req, res, next) => {
    // Add error monitoring to request
    req.errorMonitor = errorMonitor;
    req.errorPrevention = errorPrevention;
    req.performanceMonitor = performanceMonitor;

    // Start performance monitoring
    const perfTiming = performanceMonitor.startTiming(`${req.method} ${req.originalUrl}`);
    req.perfTiming = perfTiming;

    // Override res.end to capture timing
    const originalEnd = res.end;
    res.end = function(...args) {
      perfTiming.end();
      originalEnd.apply(this, args);
    };

    next();
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Classes
  ErrorClassification,
  ErrorMonitor,
  ErrorPrevention,
  PerformanceMonitor,
  
  // Constants
  ErrorCategories,
  ErrorSeverity,
  
  // Global instances
  errorMonitor,
  errorPrevention,
  performanceMonitor,
  
  // Utilities
  wrapFunction,
  wrapAsyncFunction,
  createErrorMiddleware
};