/**
 * TalentSphere Error Handling Middleware
 * Centralized error handling for all services
 */

const { createLogger } = require('./logger');
const crypto = require('crypto');

class ErrorHandler {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.logger = createLogger(serviceName, {
            ...options,
            logLevel: process.env.LOG_LEVEL || 'info'
        });
        
        this.enableErrorTracking = options.enableErrorTracking !== false;
        this.enableErrorReporting = options.enableErrorReporting !== false;
        this.enableStackTrace = options.enableStackTrace !== false;
        this.environment = options.environment || process.env.NODE_ENV || 'development';
        
        // Error code taxonomy
        this.errorCodes = {
            // Client errors (4xx)
            BAD_REQUEST: { code: 'E_BAD_REQUEST', status: 400, message: 'Bad Request' },
            UNAUTHORIZED: { code: 'E_UNAUTHORIZED', status: 401, message: 'Unauthorized' },
            FORBIDDEN: { code: 'E_FORBIDDEN', status: 403, message: 'Forbidden' },
            NOT_FOUND: { code: 'E_NOT_FOUND', status: 404, message: 'Not Found' },
            METHOD_NOT_ALLOWED: { code: 'E_METHOD_NOT_ALLOWED', status: 405, message: 'Method Not Allowed' },
            CONFLICT: { code: 'E_CONFLICT', status: 409, message: 'Conflict' },
            VALIDATION_ERROR: { code: 'E_VALIDATION_ERROR', status: 422, message: 'Validation Error' },
            RATE_LIMIT_EXCEEDED: { code: 'E_RATE_LIMIT_EXCEEDED', status: 429, message: 'Rate Limit Exceeded' },
            
            // Server errors (5xx)
            INTERNAL_ERROR: { code: 'E_INTERNAL_ERROR', status: 500, message: 'Internal Server Error' },
            SERVICE_UNAVAILABLE: { code: 'E_SERVICE_UNAVAILABLE', status: 503, message: 'Service Unavailable' },
            DATABASE_ERROR: { code: 'E_DATABASE_ERROR', status: 500, message: 'Database Error' },
            EXTERNAL_SERVICE_ERROR: { code: 'E_EXTERNAL_SERVICE_ERROR', status: 502, message: 'External Service Error' },
            TIMEOUT_ERROR: { code: 'E_TIMEOUT_ERROR', status: 504, message: 'Timeout Error' },
            
            // Business logic errors
            BUSINESS_RULE_VIOLATION: { code: 'E_BUSINESS_RULE_VIOLATION', status: 400, message: 'Business Rule Violation' },
            RESOURCE_NOT_FOUND: { code: 'E_RESOURCE_NOT_FOUND', status: 404, message: 'Resource Not Found' },
            DUPLICATE_RESOURCE: { code: 'E_DUPLICATE_RESOURCE', status: 409, message: 'Duplicate Resource' }
        };
    }

    /**
     * Express.js error handling middleware
     */
    middleware() {
        return (error, req, res, next) => {
            // Generate unique error ID
            const errorId = crypto.randomUUID();
            
            // Set error context in logger
            this.logger.setContext('error_id', errorId);
            this.logger.setContext('request_id', req.id || 'unknown');
            this.logger.setContext('method', req.method);
            this.logger.setContext('url', req.url);
            this.logger.setContext('user_agent', req.get('User-Agent'));
            this.logger.setContext('ip', req.ip || req.connection.remoteAddress);
            
            // Handle different types of errors
            const handledError = this.handleError(error, req);
            
            // Log the error
            this.logError(handledError, req, error);
            
            // Send error response
            this.sendErrorResponse(res, handledError, errorId);
            
            // Clear context
            this.logger.clearContext();
        };
    }

    /**
     * Handle and classify different types of errors
     */
    handleError(error, req) {
        // Validation errors (Joi, express-validator)
        if (error.isJoi || error.errors) {
            return this.createValidationError(error);
        }
        
        // JWT errors
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return this.createAuthError(error);
        }
        
        // Database errors
        if (this.isDatabaseError(error)) {
            return this.createDatabaseError(error);
        }
        
        // Network/timeout errors
        if (this.isNetworkError(error)) {
            return this.createNetworkError(error);
        }
        
        // Rate limiting errors
        if (error.status === 429 || error.code === 'E_RATE_LIMIT_EXCEEDED') {
            return this.errorCodes.RATE_LIMIT_EXCEEDED;
        }
        
        // Application errors with known codes
        if (error.code && this.errorCodes[error.code]) {
            return this.errorCodes[error.code];
        }
        
        // Default to internal server error
        return this.createInternalError(error);
    }

    /**
     * Create validation error
     */
    createValidationError(error) {
        const details = error.isJoi ? 
            error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            })) : 
            error.errors || [];
        
        return {
            ...this.errorCodes.VALIDATION_ERROR,
            details
        };
    }

    /**
     * Create authentication error
     */
    createAuthError(error) {
        if (error.name === 'TokenExpiredError') {
            return {
                ...this.errorCodes.UNAUTHORIZED,
                message: 'Token has expired',
                code: 'E_TOKEN_EXPIRED'
            };
        }
        
        return {
            ...this.errorCodes.UNAUTHORIZED,
            message: 'Invalid authentication token',
            code: 'E_INVALID_TOKEN'
        };
    }

    /**
     * Create database error
     */
    createDatabaseError(error) {
        // Handle common database error codes
        if (error.code === '23505') { // Unique violation
            return {
                ...this.errorCodes.DUPLICATE_RESOURCE,
                message: 'Resource already exists'
            };
        }
        
        if (error.code === '23503') { // Foreign key violation
            return {
                ...this.errorCodes.VALIDATION_ERROR,
                message: 'Referenced resource does not exist'
            };
        }
        
        return {
            ...this.errorCodes.DATABASE_ERROR,
            message: this.environment === 'development' ? error.message : 'Database operation failed'
        };
    }

    /**
     * Create network error
     */
    createNetworkError(error) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return this.errorCodes.TIMEOUT_ERROR;
        }
        
        if (error.code === 'ECONNREFUSED') {
            return this.errorCodes.SERVICE_UNAVAILABLE;
        }
        
        return {
            ...this.errorCodes.EXTERNAL_SERVICE_ERROR,
            message: 'External service communication failed'
        };
    }

    /**
     * Create internal server error
     */
    createInternalError(error) {
        return {
            ...this.errorCodes.INTERNAL_ERROR,
            message: this.environment === 'development' ? error.message : 'An unexpected error occurred'
        };
    }

    /**
     * Check if error is database-related
     */
    isDatabaseError(error) {
        return error.code && (
            typeof error.code === 'string' && 
            error.code.match(/^(23|25|28|40|42|53)/) || // PostgreSQL error codes
            error.code.match(/^ER_/) || // MySQL error codes
            error.name === 'QueryError'
        );
    }

    /**
     * Check if error is network-related
     */
    isNetworkError(error) {
        return error.code && (
            error.code.match(/^ECONN/) || // Connection errors
            error.code.match(/^ETIME/) || // Timeout errors
            error.name === 'NetworkError'
        );
    }

    /**
     * Log error with context
     */
    logError(handledError, req, originalError) {
        const logData = {
            error_code: handledError.code,
            http_status: handledError.status,
            request_method: req.method,
            request_url: req.url,
            user_id: req.user?.id || 'anonymous'
        };

        // Add request body for non-sensitive endpoints
        if (req.body && !this.isSensitiveEndpoint(req.path)) {
            logData.request_body = this.sanitizeRequestBody(req.body);
        }

        // Add stack trace in development
        if (this.environment === 'development' && originalError.stack) {
            logData.stack_trace = originalError.stack;
        }

        this.logger.error(handledError.message, logData, originalError);
        
        // Track error metrics if enabled
        if (this.enableErrorTracking) {
            this.trackError(handledError);
        }
    }

    /**
     * Send error response
     */
    sendErrorResponse(res, handledError, errorId) {
        const response = {
            error: {
                id: errorId,
                code: handledError.code,
                message: handledError.message,
                status: handledError.status,
                timestamp: new Date().toISOString()
            }
        };

        // Add validation details if available
        if (handledError.details) {
            response.error.details = handledError.details;
        }

        // Add request ID if available
        if (res.locals.requestId) {
            response.error.request_id = res.locals.requestId;
        }

        res.status(handledError.status).json(response);
    }

    /**
     * Track error metrics
     */
    trackError(error) {
        // In a real implementation, this would send to metrics system
        // For now, just log that we're tracking
        this.logger.debug('Error tracked for metrics', {
            error_code: error.code,
            status: error.status
        });
    }

    /**
     * Check if endpoint is sensitive (should not log request body)
     */
    isSensitiveEndpoint(path) {
        const sensitivePaths = [
            '/auth/login',
            '/auth/register',
            '/api/tokens',
            '/api/payments'
        ];
        
        return sensitivePaths.some(sensitivePath => 
            path.startsWith(sensitivePath)
        );
    }

    /**
     * Sanitize request body for logging
     */
    sanitizeRequestBody(body) {
        if (!body || typeof body !== 'object') {
            return body;
        }

        const sensitiveFields = [
            'password', 'token', 'secret', 'key', 'authorization',
            'credit_card', 'ssn', 'bank_account', 'api_key'
        ];

        const sanitized = Array.isArray(body) ? [] : {};
        const sanitizeRecursive = (obj, target) => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const lowerKey = key.toLowerCase();
                    
                    if (sensitiveFields.some(field => lowerKey.includes(field))) {
                        target[key] = '***REDACTED***';
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        target[key] = Array.isArray(obj[key]) ? [] : {};
                        sanitizeRecursive(obj[key], target[key]);
                    } else {
                        target[key] = obj[key];
                    }
                }
            }
        };

        sanitizeRecursive(body, sanitized);
        return sanitized;
    }

    /**
     * Create custom application error
     */
    createError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }

    /**
     * Create validation error
     */
    createValidationError(field, message, value = null) {
        return this.createError('E_VALIDATION_ERROR', message, [{ field, message, value }]);
    }

    /**
     * Create not found error
     */
    createNotFoundError(resource, id = null) {
        const message = id ? 
            `${resource} with ID '${id}' not found` : 
            `${resource} not found`;
        return this.createError('E_RESOURCE_NOT_FOUND', message);
    }

    /**
     * Create unauthorized error
     */
    createUnauthorizedError(message = 'Unauthorized access') {
        return this.createError('E_UNAUTHORIZED', message);
    }

    /**
     * Create forbidden error
     */
    createForbiddenError(message = 'Access forbidden') {
        return this.createError('E_FORBIDDEN', message);
    }

    /**
     * Create business rule violation error
     */
    createBusinessRuleError(rule, message) {
        return this.createError('E_BUSINESS_RULE_VIOLATION', message, { rule });
    }
}

/**
 * Factory function to create error handler instances
 */
function createErrorHandler(serviceName, options = {}) {
    return new ErrorHandler(serviceName, options);
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    ErrorHandler,
    createErrorHandler,
    asyncHandler
};