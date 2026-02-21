/**
 * TalentSphere Universal Error Handler
 * Provides comprehensive error handling for all backend services
 */

const winston = require('winston');
const secretsManager = require('./secrets-manager');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'talentsphere' },
  transports: [
    new winston.transports.File({
      filename: 'logs/errors/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/runtime/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Error codes and types
const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION: 'INVALID_OPERATION',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'TIMEOUT',

  // File Operations
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // Configuration
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  DEPENDENCY_MISSING: 'DEPENDENCY_MISSING'
};

// HTTP Status Codes
const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Base Error Class
class AppError extends Error {
  constructor(message, code = ErrorCodes.INTERNAL_ERROR, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, details = null) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  // Convert to JSON response
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }

  // Create error response
  toResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      },
      meta: {
        timestamp: this.timestamp,
        requestId: this.requestId || null
      }
    };
  }
}

// Specific Error Types
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, ErrorCodes.CONFLICT, HttpStatus.CONFLICT);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, ErrorCodes.RATE_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS);
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, ErrorCodes.DATABASE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, {
      originalError: originalError?.message
    });
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message, originalError = null) {
    super(`External service ${service} error: ${message}`, ErrorCodes.EXTERNAL_SERVICE_ERROR, HttpStatus.BAD_GATEWAY, {
      service,
      originalError: originalError?.message
    });
  }
}

// Error Factory
class ErrorFactory {
  // Create error from error code
  static create(code, message = null, details = null) {
    const statusCode = this.getStatusCodeFromCode(code);
    const errorMessage = message || this.getDefaultMessage(code);

    return new AppError(errorMessage, code, statusCode, details);
  }

  // Create from database error
  static fromDatabase(error) {
    logger.error('Database error:', {
      error: error.message,
      code: error.code,
      constraint: error.constraint,
      table: error.table
    });

    switch (error.code) {
      case '23505': // unique_violation
        return new ConflictError('Resource already exists');
      case '23503': // foreign_key_violation
        return new ValidationError('Referenced resource does not exist');
      case '23502': // not_null_violation
        return new ValidationError('Required field is missing');
      case '23514': // check_violation
        return new ValidationError('Invalid data provided');
      default:
        return new DatabaseError('Database operation failed', error);
    }
  }

  // Create from validation error
  static fromValidation(error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    return new ValidationError('Invalid request data', details);
  }

  // Get HTTP status code from error code
  static getStatusCodeFromCode(code) {
    const statusMap = {
      [ErrorCodes.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
      [ErrorCodes.FORBIDDEN]: HttpStatus.FORBIDDEN,
      [ErrorCodes.NOT_FOUND]: HttpStatus.NOT_FOUND,
      [ErrorCodes.CONFLICT]: HttpStatus.CONFLICT,
      [ErrorCodes.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
      [ErrorCodes.RATE_LIMIT_EXCEEDED]: HttpStatus.TOO_MANY_REQUESTS,
      [ErrorCodes.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
      [ErrorCodes.TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
      [ErrorCodes.EXTERNAL_SERVICE_ERROR]: HttpStatus.BAD_GATEWAY
    };

    return statusMap[code] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  // Get default message for error code
  static getDefaultMessage(code) {
    const messages = {
      [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
      [ErrorCodes.FORBIDDEN]: 'Access denied',
      [ErrorCodes.NOT_FOUND]: 'Resource not found',
      [ErrorCodes.CONFLICT]: 'Resource conflict',
      [ErrorCodes.VALIDATION_ERROR]: 'Invalid input data',
      [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
      [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
      [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
      [ErrorCodes.DATABASE_ERROR]: 'Database operation failed'
    };

    return messages[code] || 'An error occurred';
  }

  // Handle unexpected errors
  static handleUnexpected(error, context = {}) {
    logger.error('Unexpected error:', {
      error: error.message,
      stack: error.stack,
      context
    });

    if (error instanceof AppError) {
      return error;
    }

    return new AppError(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ErrorCodes.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        originalError: error.message,
        context
      }
    );
  }
}

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  // Add request ID to error
  if (req.requestId) {
    err.requestId = req.requestId;
  }

  let error;

  if (err instanceof AppError) {
    error = err;
  } else if (err.name === 'ValidationError') {
    error = ErrorFactory.fromValidation(err);
  } else if (err.code && err.code.startsWith('23')) {
    // PostgreSQL error codes
    error = ErrorFactory.fromDatabase(err);
  } else {
    error = ErrorFactory.handleUnexpected(err, {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
  }

  // Log error
  logger.error('Request error:', {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    requestId: req.requestId,
    userId: req.user?.userId,
    service: req.serviceName,
    method: req.method,
    url: req.url
  });

  // Send error response
  return res.status(error.statusCode).json(error.toResponse());
};

// Async Error Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Handler
const notFoundHandler = (req, res) => {
  const error = new NotFoundError(`${req.method} ${req.path}`);
  return res.status(error.statusCode).json(error.toResponse());
};

module.exports = {
  ErrorCodes,
  HttpStatus,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ErrorFactory,
  errorHandler,
  asyncHandler,
  notFoundHandler
};