/**
 * Standardized Error Response System
 * 
 * Provides consistent error handling and response formats across all services
 */

const { createLogger } = require('./logger');

class ErrorResponse {
  constructor() {
    this.logger = createLogger('ErrorResponse');
  }

  /**
   * Create standardized error response
   */
  static create(error, requestContext = {}) {
    const errorResponse = {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        details: error.details || null,
        timestamp: new Date().toISOString(),
        request_id: requestContext.requestId || null,
        service: requestContext.serviceName || 'unknown',
        endpoint: requestContext.endpoint || null,
        method: requestContext.method || null
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
      errorResponse.error.stack = error.stack;
    }

    return errorResponse;
  }

  /**
   * HTTP Error Types
   */
  static BAD_REQUEST(message = 'Bad request', details = null) {
    return ErrorResponse.create({
      code: 'BAD_REQUEST',
      message,
      details,
      statusCode: 400
    });
  }

  static UNAUTHORIZED(message = 'Unauthorized', details = null) {
    return ErrorResponse.create({
      code: 'UNAUTHORIZED',
      message,
      details,
      statusCode: 401
    });
  }

  static FORBIDDEN(message = 'Forbidden', details = null) {
    return ErrorResponse.create({
      code: 'FORBIDDEN',
      message,
      details,
      statusCode: 403
    });
  }

  static NOT_FOUND(message = 'Resource not found', details = null) {
    return ErrorResponse.create({
      code: 'NOT_FOUND',
      message,
      details,
      statusCode: 404
    });
  }

  static CONFLICT(message = 'Resource conflict', details = null) {
    return ErrorResponse.create({
      code: 'CONFLICT',
      message,
      details,
      statusCode: 409
    });
  }

  static UNPROCESSABLE_ENTITY(message = 'Unprocessable entity', details = null) {
    return ErrorResponse.create({
      code: 'UNPROCESSABLE_ENTITY',
      message,
      details,
      statusCode: 422
    });
  }

  static TOO_MANY_REQUESTS(message = 'Too many requests', details = null) {
    return ErrorResponse.create({
      code: 'TOO_MANY_REQUESTS',
      message,
      details,
      statusCode: 429
    });
  }

  static INTERNAL_SERVER_ERROR(message = 'Internal server error', details = null) {
    return ErrorResponse.create({
      code: 'INTERNAL_SERVER_ERROR',
      message,
      details,
      statusCode: 500
    });
  }

  static SERVICE_UNAVAILABLE(message = 'Service unavailable', details = null) {
    return ErrorResponse.create({
      code: 'SERVICE_UNAVAILABLE',
      message,
      details,
      statusCode: 503
    });
  }

  /**
   * Business Logic Errors
   */
  static USER_NOT_FOUND(userId) {
    return ErrorResponse.create({
      code: 'USER_NOT_FOUND',
      message: `User with ID ${userId} not found`,
      statusCode: 404
    });
  }

  static INVALID_CREDENTIALS() {
    return ErrorResponse.create({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      statusCode: 401
    });
  }

  static USER_ALREADY_EXISTS(email) {
    return ErrorResponse.create({
      code: 'USER_ALREADY_EXISTS',
      message: `User with email ${email} already exists`,
      statusCode: 409
    });
  }

  static INVALID_TOKEN() {
    return ErrorResponse.create({
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token',
      statusCode: 401
    });
  }

  static INSUFFICIENT_PERMISSIONS(action) {
    return ErrorResponse.create({
      code: 'INSUFFICIENT_PERMISSIONS',
      message: `Insufficient permissions to perform action: ${action}`,
      statusCode: 403
    });
  }

  static VALIDATION_ERROR(errors) {
    return ErrorResponse.create({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: { errors },
      statusCode: 422
    });
  }

  static COURSE_NOT_FOUND(courseId) {
    return ErrorResponse.create({
      code: 'COURSE_NOT_FOUND',
      message: `Course with ID ${courseId} not found`,
      statusCode: 404
    });
  }

  static ENROLLMENT_NOT_FOUND(enrollmentId) {
    return ErrorResponse.create({
      code: 'ENROLLMENT_NOT_FOUND',
      message: `Enrollment with ID ${enrollmentId} not found`,
      statusCode: 404
    });
  }

  static SUBMISSION_NOT_FOUND(submissionId) {
    return ErrorResponse.create({
      code: 'SUBMISSION_NOT_FOUND',
      message: `Submission with ID ${submissionId} not found`,
      statusCode: 404
    });
  }

  static CHALLENGE_NOT_FOUND(challengeId) {
    return ErrorResponse.create({
      code: 'CHALLENGE_NOT_FOUND',
      message: `Challenge with ID ${challengeId} not found`,
      statusCode: 404
    });
  }

  static COMPANY_NOT_FOUND(companyId) {
    return ErrorResponse.create({
      code: 'COMPANY_NOT_FOUND',
      message: `Company with ID ${companyId} not found`,
      statusCode: 404
    });
  }

  static JOB_NOT_FOUND(jobId) {
    return ErrorResponse.create({
      code: 'JOB_NOT_FOUND',
      message: `Job with ID ${jobId} not found`,
      statusCode: 404
    });
  }

  /**
   * Database Errors
   */
  static DATABASE_CONNECTION_ERROR(error) {
    return ErrorResponse.create({
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Database connection failed',
      details: { originalError: error.message },
      statusCode: 503
    });
  }

  static DATABASE_QUERY_ERROR(error, query) {
    return ErrorResponse.create({
      code: 'DATABASE_QUERY_ERROR',
      message: 'Database query failed',
      details: { 
        originalError: error.message,
        query: query?.substring(0, 100) // Limit query length in response
      },
      statusCode: 500
    });
  }

  /**
   * External Service Errors
   */
  static EXTERNAL_SERVICE_ERROR(service, error) {
    return ErrorResponse.create({
      code: 'EXTERNAL_SERVICE_ERROR',
      message: `External service ${service} error`,
      details: { 
        service,
        originalError: error.message 
      },
      statusCode: 502
    });
  }

  /**
   * Email Service Errors
   */
  static EMAIL_SEND_FAILED(error) {
    return ErrorResponse.create({
      code: 'EMAIL_SEND_FAILED',
      message: 'Failed to send email',
      details: { originalError: error.message },
      statusCode: 500
    });
  }

  static EMAIL_TEMPLATE_NOT_FOUND(templateId) {
    return ErrorResponse.create({
      code: 'EMAIL_TEMPLATE_NOT_FOUND',
      message: `Email template with ID ${templateId} not found`,
      statusCode: 404
    });
  }

  /**
   * File Upload Errors
   */
  static FILE_TOO_LARGE(maxSize) {
    return ErrorResponse.create({
      code: 'FILE_TOO_LARGE',
      message: `File size exceeds maximum allowed size of ${maxSize} bytes`,
      statusCode: 413
    });
  }

  static INVALID_FILE_TYPE(allowedTypes) {
    return ErrorResponse.create({
      code: 'INVALID_FILE_TYPE',
      message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      statusCode: 422
    });
  }

  static FILE_UPLOAD_FAILED(error) {
    return ErrorResponse.create({
      code: 'FILE_UPLOAD_FAILED',
      message: 'File upload failed',
      details: { originalError: error.message },
      statusCode: 500
    });
  }

  /**
   * Notification Errors
   */
  static NOTIFICATION_SEND_FAILED(error) {
    return ErrorResponse.create({
      code: 'NOTIFICATION_SEND_FAILED',
      message: 'Failed to send notification',
      details: { originalError: error.message },
      statusCode: 500
    });
  }

  static INVALID_NOTIFICATION_TYPE(type) {
    return ErrorResponse.create({
      code: 'INVALID_NOTIFICATION_TYPE',
      message: `Invalid notification type: ${type}`,
      statusCode: 422
    });
  }

  /**
   * Rate Limiting Errors
   */
  static RATE_LIMIT_EXCEEDED(limit, window) {
    return ErrorResponse.create({
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Maximum ${limit} requests per ${window}`,
      details: { limit, window },
      statusCode: 429
    });
  }

  /**
   * Express middleware for error handling
   */
  static expressErrorHandler() {
    return (error, req, res, next) => {
      const requestContext = {
        requestId: req.headers['x-request-id'] || req.id,
        serviceName: req.serviceName || 'unknown',
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      };

      // Log error
      const logger = createLogger('ExpressErrorHandler');
      logger.error('Express error handler triggered', {
        error: error.message,
        stack: error.stack,
        requestContext
      });

      // Create error response
      const errorResponse = ErrorResponse.create(error, requestContext);
      
      // Don't send error details if it's not a known error type
      if (!error.code) {
        errorResponse.error.details = null;
      }

      res.status(error.statusCode || 500).json(errorResponse);
    };
  }

  /**
   * Async error wrapper for Express routes
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Validation error formatter for Joi
   */
  static formatJoiError(error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
      type: detail.type
    }));

    return ErrorResponse.VALIDATION_ERROR(details);
  }

  /**
   * Success response wrapper
   */
  static success(data = null, meta = {}) {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        ...meta
      }
    };
  }

  static paginatedSuccess(data, pagination) {
    return {
      success: true,
      data,
      pagination: {
        ...pagination,
        timestamp: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    };
  }
}

module.exports = ErrorResponse;