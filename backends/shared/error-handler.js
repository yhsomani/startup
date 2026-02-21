/**
 * Centralized Error Handler
 * 
 * Standardized error handling across all backend services
 * with proper logging, error categorization, and response formatting
 */

const { createLogger } = require('../../shared/logger');
const { v4: uuidv4 } = require('uuid');

const logger = createLogger('ErrorHandler');

// Error categories
const ErrorCategories = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  BUSINESS_LOGIC: 'business_logic',
  INTEGRATION: 'integration',
  SYSTEM: 'system',
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout',
  NETWORK: 'network'
};

// Error severity levels
const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Standard error codes
const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Authentication errors (401)
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Not found errors (404)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  COMPANY_NOT_FOUND: 'COMPANY_NOT_FOUND',

  // Business logic errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  INVALID_STATE: 'INVALID_STATE',

  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // System errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',

  // Integration errors (502, 503, 504)
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

// Custom error class
class AppError extends Error {
  constructor(message, code = ErrorCodes.INTERNAL_ERROR, statusCode = 500, category = ErrorCategories.SYSTEM, severity = ErrorSeverity.HIGH, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.category = category;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = null;
    this.userId = null;
    this.serviceName = null;

    Error.captureStackTrace(this, this.constructor);
  }

  addContext(context = {}) {
    this.requestId = context.requestId;
    this.userId = context.userId;
    this.serviceName = context.serviceName;
    this.details = { ...this.details, ...context };
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      severity: this.severity,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      serviceName: this.serviceName,
      stack: this.stack
    };
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, ErrorCodes.VALIDATION_FAILED, 400, ErrorCategories.VALIDATION, ErrorSeverity.MEDIUM, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = {}) {
    super(message, ErrorCodes.UNAUTHORIZED, 401, ErrorCategories.AUTHENTICATION, ErrorSeverity.HIGH, details);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden', details = {}) {
    super(message, ErrorCodes.FORBIDDEN, 403, ErrorCategories.AUTHORIZATION, ErrorSeverity.MEDIUM, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', details = {}) {
    super(`${resource} not found`, ErrorCodes.RESOURCE_NOT_FOUND, 404, ErrorCategories.NOT_FOUND, ErrorSeverity.LOW, details);
  }
}

class BusinessLogicError extends AppError {
  constructor(message, code = ErrorCodes.CONFLICT, details = {}) {
    super(message, code, 409, ErrorCategories.BUSINESS_LOGIC, ErrorSeverity.MEDIUM, details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details = {}) {
    super(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429, ErrorCategories.RATE_LIMIT, ErrorSeverity.MEDIUM, details);
  }
}

class SystemError extends AppError {
  constructor(message, details = {}) {
    super(message, ErrorCodes.INTERNAL_ERROR, 500, ErrorCategories.SYSTEM, ErrorSeverity.HIGH, details);
  }
}

class IntegrationError extends AppError {
  constructor(message, service = 'unknown', details = {}) {
    super(message, ErrorCodes.EXTERNAL_SERVICE_ERROR, 502, ErrorCategories.INTEGRATION, ErrorSeverity.HIGH, { service, ...details });
  }
}

// Error factory
class ErrorFactory {
  static fromValidationError(validationErrors) {
    const details = {
      validationErrors: Array.isArray(validationErrors) ? validationErrors : [validationErrors]
    };
    return new ValidationError('Validation failed', details);
  }

  static fromDatabaseError(error, context = {}) {
    // Parse common database errors
    if (error.code === '23505') { // Unique violation
      return new BusinessLogicError('Resource already exists', ErrorCodes.DUPLICATE_RESOURCE, { ...context, originalError: error.message });
    }

    if (error.code === '23503') { // Foreign key violation
      return new ValidationError('Referenced resource does not exist', { ...context, originalError: error.message });
    }

    if (error.code === '23502') { // Not null violation
      return new ValidationError('Required field is missing', { ...context, originalError: error.message });
    }

    return new SystemError('Database operation failed', { ...context, originalError: error.message });
  }

  static fromAuthError(error, context = {}) {
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token', { ...context, originalError: error.message });
    }

    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token expired', { ...context, originalError: error.message });
    }

    return new AuthenticationError('Authentication failed', { ...context, originalError: error.message });
  }

  static fromUnknownError(error, context = {}) {
    if (error instanceof AppError) {
      return error.addContext(context);
    }

    // Determine appropriate error type based on error properties
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return new ValidationError(error.message, { ...context, originalError: error.message });
    }

    if (error.message.includes('timeout')) {
      return new SystemError('Operation timeout', { ...context, originalError: error.message });
    }

    if (error.message.includes('network') || error.code === 'ECONNREFUSED') {
      return new IntegrationError('Network error', 'network', { ...context, originalError: error.message });
    }

    // Default to system error
    return new SystemError(error.message || 'An unexpected error occurred', { ...context, originalError: error.message });
  }
}

// Error handler middleware factory
function createErrorHandler(serviceName = 'unknown') {
  return function errorHandler(error, req, res, next) {
    // Convert unknown errors to AppError
    const appError = ErrorFactory.fromUnknownError(error, {
      requestId: req.requestId || req.headers['x-request-id'],
      userId: req.user?.id,
      serviceName,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Log the error
    logError(appError, req);

    // Send error response
    sendErrorResponse(appError, res);
  };
}

// Error logging function
function logError(error, req) {
  const logData = {
    error: error.toJSON(),
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      body: sanitizeRequestBody(req.body)
    }
  };

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      logger.error('🚨 CRITICAL ERROR', logData);
      break;
    case ErrorSeverity.HIGH:
      logger.error('❌ HIGH SEVERITY ERROR', logData);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn('⚠️ MEDIUM SEVERITY ERROR', logData);
      break;
    case ErrorSeverity.LOW:
      logger.info('ℹ️ LOW SEVERITY ERROR', logData);
      break;
    default:
      logger.error('🔥 UNKNOWN ERROR', logData);
  }
}

// Response formatting
function sendErrorResponse(error, res) {
  const response = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      category: error.category,
      details: sanitizeErrorDetails(error.details),
      timestamp: error.timestamp,
      requestId: error.requestId
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    response.error.originalError = error.details.originalError;
  }

  // Include retry information for certain errors
  if (error.category === ErrorCategories.RATE_LIMIT) {
    response.error.retryAfter = error.details.retryAfter || '15m';
  }

  if (error.category === ErrorCategories.TIMEOUT) {
    response.error.retryable = true;
  }

  res.status(error.statusCode).json(response);
}

// Sanitization functions
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  return sanitized;
}

function sanitizeRequestBody(body) {
  if (!body) return body;

  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.confirmPassword;
  delete sanitized.token;
  delete sanitized.secret;
  return sanitized;
}

function sanitizeErrorDetails(details) {
  if (!details) return details;

  const sanitized = { ...details };

  // Remove sensitive information
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  delete sanitized.apiKey;

  // In production, remove internal error details
  if (process.env.NODE_ENV === 'production') {
    delete sanitized.originalError;
    delete sanitized.query;
    delete sanitized.stackTrace;
  }

  return sanitized;
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  // Main components
  createErrorHandler,
  ErrorFactory,
  asyncHandler,

  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BusinessLogicError,
  RateLimitError,
  SystemError,
  IntegrationError,

  // Constants
  ErrorCategories,
  ErrorSeverity,
  ErrorCodes,

  // Utilities
  logError,
  sendErrorResponse,
  sanitizeHeaders,
  sanitizeRequestBody,
  sanitizeErrorDetails
};