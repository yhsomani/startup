/**
 * Error Factory
 * 
 * Factory for creating standardized errors across all services
 * with proper categorization and metadata
 */

const { v4: uuidv4 } = require('uuid');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', category = 'SYSTEM', metadata = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.category = category;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    this.errorId = uuidv4();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, metadata = {}) {
    super(message, 400, 'VALIDATION_FAILED', 'VALIDATION', metadata);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', metadata = {}) {
    super(message, 401, 'UNAUTHORIZED', 'AUTHENTICATION', metadata);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied', metadata = {}) {
    super(message, 403, 'FORBIDDEN', 'AUTHORIZATION', metadata);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', metadata = {}) {
    super(`${resource} not found`, 404, 'NOT_FOUND', 'NOT_FOUND', { ...metadata, resource });
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message, metadata = {}) {
    super(message, 409, 'CONFLICT', 'BUSINESS_LOGIC', metadata);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', metadata = {}) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', 'RATE_LIMIT', metadata);
    this.name = 'RateLimitError';
  }
}

class IntegrationError extends AppError {
  constructor(service, message, metadata = {}) {
    super(`${service} integration error: ${message}`, 502, 'INTEGRATION_ERROR', 'INTEGRATION', { ...metadata, service });
    this.name = 'IntegrationError';
  }
}

class ErrorFactory {
  static fromUnknownError(error, context = {}) {
    if (error instanceof AppError) {
      return error;
    }

    // Handle common Node.js errors
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, { originalError: error });
    }

    if (error.name === 'CastError') {
      return new ValidationError('Invalid data format', { originalError: error });
    }

    if (error.code === '23505') { // PostgreSQL unique violation
      return new ConflictError('Resource already exists', { originalError: error });
    }

    if (error.code === '23503') { // PostgreSQL foreign key violation
      return new ValidationError('Referenced resource does not exist', { originalError: error });
    }

    if (error.code === 'ECONNREFUSED') {
      return new IntegrationError('Database', 'Connection refused', { originalError: error });
    }

    if (error.code === 'ETIMEDOUT') {
      return new AppError('Request timeout', 408, 'TIMEOUT', 'TIMEOUT', { originalError: error });
    }

    // Default fallback
    return new AppError(
      error.message || 'An unexpected error occurred',
      error.statusCode || 500,
      error.code || 'INTERNAL_ERROR',
      'SYSTEM',
      {
        originalError: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        ...context
      }
    );
  }

  static ValidationError(message, metadata = {}) {
    return new ValidationError(message, metadata);
  }

  static AuthenticationError(message, metadata = {}) {
    return new AuthenticationError(message, metadata);
  }

  static AuthorizationError(message, metadata = {}) {
    return new AuthorizationError(message, metadata);
  }

  static NotFoundError(resource, metadata = {}) {
    return new NotFoundError(resource, metadata);
  }

  static ConflictError(message, metadata = {}) {
    return new ConflictError(message, metadata);
  }

  static RateLimitError(message, metadata = {}) {
    return new RateLimitError(message, metadata);
  }

  static IntegrationError(service, message, metadata = {}) {
    return new IntegrationError(service, message, metadata);
  }
}

module.exports = {
  ErrorFactory,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  IntegrationError
};