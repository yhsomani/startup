/**
 * TalentSphere Backend Execution Flow Standardization
 * Standardized request processing flow and sequencing for all backend services
 */

const { performance } = require('perf_hooks');
const { buildSuccessResponse, buildErrorResponse } = require('../contracts');
const config = require('../config');

// =============================================================================
// EXECUTION FLOW DEFINITIONS
// =============================================================================

/**
 * Standard execution flow stages
 */
const ExecutionStages = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  BUSINESS_LOGIC: 'business_logic',
  DATA_ACCESS: 'data_access',
  RESPONSE_BUILDING: 'response_building',
  ERROR_HANDLING: 'error_handling',
  LOGGING: 'logging',
  MONITORING: 'monitoring'
};

/**
 * Request context for flow tracking
 */
class RequestContext {
  constructor(req) {
    this.requestId = req.id || Math.random().toString(36).substr(2, 9);
    this.userId = req.user?.id || null;
    this.service = req.serviceName || 'unknown';
    this.method = req.method;
    this.url = req.originalUrl;
    this.startTime = performance.now();
    this.stages = new Map();
    this.metadata = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    this.errors = [];
    this.warnings = [];
  }

  startStage(stageName) {
    this.stages.set(stageName, {
      startTime: performance.now(),
      duration: null,
      status: 'running'
    });
  }

  endStage(stageName, status = 'completed', error = null) {
    const stage = this.stages.get(stageName);
    if (stage) {
      stage.endTime = performance.now();
      stage.duration = stage.endTime - stage.startTime;
      stage.status = status;
      if (error) {
        stage.error = error;
      }
    }
  }

  addError(error) {
    this.errors.push({
      message: error.message,
      code: error.code,
      stage: error.stage || 'unknown',
      timestamp: new Date().toISOString()
    });
  }

  addWarning(warning) {
    this.warnings.push({
      message: warning,
      timestamp: new Date().toISOString()
    });
  }

  getMetrics() {
    const totalDuration = performance.now() - this.startTime;
    
    return {
      requestId: this.requestId,
      userId: this.userId,
      service: this.service,
      method: this.method,
      url: this.url,
      totalDuration,
      stages: Array.from(this.stages.entries()).map(([name, stage]) => ({
        name,
        duration: stage.duration,
        status: stage.status,
        error: stage.error
      })),
      errors: this.errors,
      warnings: this.warnings,
      metadata: this.metadata
    };
  }
}

// =============================================================================
// FLOW MIDDLEWARE
// =============================================================================

/**
 * Request context middleware
 * Creates and attaches request context to all requests
 */
function createRequestContext(req, res, next) {
  req.context = new RequestContext(req);
  res.setHeader('X-Request-ID', req.context.requestId);
  next();
}

/**
 * Authentication flow middleware
 * Standardized authentication flow
 */
function authenticationFlow(req, res, next) {
  req.context.startStage(ExecutionStages.AUTHENTICATION);

  try {
    // Check for authentication token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      req.context.addError({
        message: 'Authentication token is required',
        code: 'TOKEN_MISSING',
        stage: ExecutionStages.AUTHENTICATION
      });
      req.context.endStage(ExecutionStages.AUTHENTICATION, 'failed');
      return res.status(401).json(buildErrorResponse(
        'UNAUTHORIZED',
        'Authentication token is required',
        req
      ));
    }

    // Verify token (implementation depends on auth service)
    // This is a placeholder for actual JWT verification
    const user = verifyToken(token);
    
    if (!user) {
      req.context.addError({
        message: 'Invalid authentication token',
        code: 'TOKEN_INVALID',
        stage: ExecutionStages.AUTHENTICATION
      });
      req.context.endStage(ExecutionStages.AUTHENTICATION, 'failed');
      return res.status(401).json(buildErrorResponse(
        'UNAUTHORIZED',
        'Invalid authentication token',
        req
      ));
    }

    req.user = user;
    req.context.userId = user.id;
    req.context.endStage(ExecutionStages.AUTHENTICATION, 'completed');
    next();

  } catch (error) {
    req.context.addError({
      message: error.message,
      code: 'AUTHENTICATION_ERROR',
      stage: ExecutionStages.AUTHENTICATION
    });
    req.context.endStage(ExecutionStages.AUTHENTICATION, 'failed', error);
    res.status(500).json(buildErrorResponse(
      'AUTHENTICATION_ERROR',
      'Authentication failed',
      req
    ));
  }
}

/**
 * Authorization flow middleware
 * Standardized authorization flow
 */
function authorizationFlow(requiredRoles = []) {
  return (req, res, next) => {
    req.context.startStage(ExecutionStages.AUTHORIZATION);

    try {
      const user = req.user;
      
      if (!user) {
        req.context.addError({
          message: 'User not authenticated',
          code: 'NOT_AUTHENTICATED',
          stage: ExecutionStages.AUTHORIZATION
        });
        req.context.endStage(ExecutionStages.AUTHORIZATION, 'failed');
        return res.status(401).json(buildErrorResponse(
          'UNAUTHORIZED',
          'Authentication required',
          req
        ));
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        req.context.addError({
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          stage: ExecutionStages.AUTHORIZATION
        });
        req.context.endStage(ExecutionStages.AUTHORIZATION, 'failed');
        return res.status(403).json(buildErrorResponse(
          'FORBIDDEN',
          'Insufficient permissions',
          req
        ));
      }

      req.context.endStage(ExecutionStages.AUTHORIZATION, 'completed');
      next();

    } catch (error) {
      req.context.addError({
        message: error.message,
        code: 'AUTHORIZATION_ERROR',
        stage: ExecutionStages.AUTHORIZATION
      });
      req.context.endStage(ExecutionStages.AUTHORIZATION, 'failed', error);
      res.status(500).json(buildErrorResponse(
        'AUTHORIZATION_ERROR',
        'Authorization failed',
        req
      ));
    }
  };
}

/**
 * Request validation flow middleware
 * Standardized request validation flow
 */
function validationFlow(schema) {
  return (req, res, next) => {
    req.context.startStage(ExecutionStages.VALIDATION);

    try {
      // Validate request body/parameters
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          code: detail.type,
          value: detail.context?.value
        }));

        req.context.addError({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          stage: ExecutionStages.VALIDATION
        });
        req.context.endStage(ExecutionStages.VALIDATION, 'failed');
        return res.status(400).json(buildErrorResponse(
          'VALIDATION_ERROR',
          'Invalid request data',
          req,
          { details: validationErrors }
        ));
      }

      // Replace request body with validated value
      req.body = value;
      req.context.endStage(ExecutionStages.VALIDATION, 'completed');
      next();

    } catch (error) {
      req.context.addError({
        message: error.message,
        code: 'VALIDATION_SYSTEM_ERROR',
        stage: ExecutionStages.VALIDATION
      });
      req.context.endStage(ExecutionStages.VALIDATION, 'failed', error);
      res.status(500).json(buildErrorResponse(
        'VALIDATION_SYSTEM_ERROR',
        'Validation system error',
        req
      ));
    }
  };
}

/**
 * Data access flow middleware
 * Standardized data access flow with error handling
 */
function dataAccessFlow(dataAccessFunction) {
  return async (req, res, next) => {
    req.context.startStage(ExecutionStages.DATA_ACCESS);

    try {
      // Execute data access function
      const result = await dataAccessFunction(req);
      
      req.dataResult = result;
      req.context.endStage(ExecutionStages.DATA_ACCESS, 'completed');
      next();

    } catch (error) {
      req.context.addError({
        message: error.message,
        code: 'DATA_ACCESS_ERROR',
        stage: ExecutionStages.DATA_ACCESS
      });
      req.context.endStage(ExecutionStages.DATA_ACCESS, 'failed', error);

      // Handle different types of data access errors
      if (error.code === 'NOT_FOUND') {
        return res.status(404).json(buildErrorResponse(
          'NOT_FOUND',
          'Resource not found',
          req
        ));
      } else if (error.code === 'DUPLICATE_KEY') {
        return res.status(409).json(buildErrorResponse(
          'CONFLICT',
          'Resource already exists',
          req
        ));
      } else if (error.code === 'FOREIGN_KEY_VIOLATION') {
        return res.status(400).json(buildErrorResponse(
          'VALIDATION_ERROR',
          'Referenced resource does not exist',
          req
        ));
      } else {
        return res.status(500).json(buildErrorResponse(
          'DATA_ACCESS_ERROR',
          'Data access failed',
          req
        ));
      }
    }
  };
}

// =============================================================================
// BUSINESS LOGIC EXECUTOR
// =============================================================================

/**
 * Execute business logic with standardized flow
 */
async function executeBusinessLogic(req, businessLogicFunction, options = {}) {
  const {
    skipAuth = false,
    requiredRoles = [],
    validationSchema = null,
    dataAccessFunction = null
  } = options;

  try {
    // Start business logic stage
    req.context.startStage(ExecutionStages.BUSINESS_LOGIC);

    // Execute validation if schema provided
    if (validationSchema) {
      const validationMiddleware = validationFlow(validationSchema);
      await new Promise((resolve, reject) => {
        validationMiddleware(req, res, resolve);
      });
    }

    // Execute data access if function provided
    if (dataAccessFunction) {
      const dataAccessMiddleware = dataAccessFlow(dataAccessFunction);
      await new Promise((resolve, reject) => {
        dataAccessMiddleware(req, res, resolve);
      });
    }

    // Execute business logic
    const result = await businessLogicFunction(req);
    
    req.context.endStage(ExecutionStages.BUSINESS_LOGIC, 'completed');
    return result;

  } catch (error) {
    req.context.addError({
      message: error.message,
      code: 'BUSINESS_LOGIC_ERROR',
      stage: ExecutionStages.BUSINESS_LOGIC
    });
    req.context.endStage(ExecutionStages.BUSINESS_LOGIC, 'failed', error);
    throw error;
  }
}

// =============================================================================
// RESPONSE BUILDING
// =============================================================================

/**
 * Build standardized response
 */
function buildStandardResponse(req, data, options = {}) {
  req.context.startStage(ExecutionStages.RESPONSE_BUILDING);

  try {
    const response = buildSuccessResponse(data, req, options);
    
    req.context.endStage(ExecutionStages.RESPONSE_BUILDING, 'completed');
    return response;

  } catch (error) {
    req.context.addError({
      message: error.message,
      code: 'RESPONSE_BUILDING_ERROR',
      stage: ExecutionStages.RESPONSE_BUILDING
    });
    req.context.endStage(ExecutionStages.RESPONSE_BUILDING, 'failed', error);
    throw error;
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Standardized error handling middleware
 */
function errorHandler(req, res, next) {
  req.context.startStage(ExecutionStages.ERROR_HANDLING);

  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  const error = err || new Error('Unknown error');
  
  req.context.addError({
    message: error.message,
    code: error.code || 'INTERNAL_SERVER_ERROR',
    stage: 'error_handling'
  });

  // Log the error with full context
  console.error('Error in request execution:', {
    error: error.message,
    stack: error.stack,
    context: req.context.getMetrics()
  });

  // Determine appropriate status code
  const statusCode = error.statusCode || error.status || 500;
  
  // Build error response
  const errorResponse = buildErrorResponse(
    error.code || 'INTERNAL_SERVER_ERROR',
    error.message || 'Internal server error',
    req,
    { details: error.details }
  );

  req.context.endStage(ExecutionStages.ERROR_HANDLING, 'completed');
  
  res.status(statusCode).json(errorResponse);
}

// =============================================================================
// MONITORING AND LOGGING
// =============================================================================

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const startTime = performance.now();
  
  // Log request start
  console.log('Request started:', {
    requestId: req.context?.requestId,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });

  // Override res.end to log request completion
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = performance.now() - startTime;
    
    // Log request completion with full context
    console.log('Request completed:', {
      requestId: req.context?.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      context: req.context?.getMetrics(),
      timestamp: new Date().toISOString()
    });

    originalEnd.apply(this, args);
  };

  next();
}

/**
 * Performance monitoring middleware
 */
function performanceMonitor(req, res, next) {
  const startTime = performance.now();
  
  // Collect performance metrics
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn('Slow request detected:', {
        requestId: req.context?.requestId,
        method: req.method,
        url: req.originalUrl,
        duration,
        context: req.context?.getMetrics()
      });
    }

    // Store performance metrics (could be sent to monitoring service)
    storePerformanceMetrics({
      requestId: req.context?.requestId,
      service: req.context?.service,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  });

  next();
}

// =============================================================================
// SEQUENCE DEPENDENCY VALIDATION
// =============================================================================

/**
 * Validate sequence dependencies
 */
function validateSequenceDependencies(req, requiredSequences) {
  if (!req.user || !req.user.progress) {
    throw new Error('User progress not available for sequence validation');
  }

  const userProgress = req.user.progress;
  const missingSequences = [];

  for (const sequence of requiredSequences) {
    if (!userProgress[sequence]) {
      missingSequences.push(sequence);
    }
  }

  if (missingSequences.length > 0) {
    throw new Error(`Missing required sequences: ${missingSequences.join(', ')}`);
  }

  return true;
}

/**
 * Sequence validation middleware
 */
function sequenceValidator(requiredSequences) {
  return (req, res, next) => {
    try {
      validateSequenceDependencies(req, requiredSequences);
      next();
    } catch (error) {
      req.context.addError({
        message: error.message,
        code: 'SEQUENCE_VIOLATION',
        stage: 'sequence_validation'
      });
      res.status(403).json(buildErrorResponse(
        'SEQUENCE_VIOLATION',
        error.message,
        req
      ));
    }
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Mock token verification (replace with actual implementation)
 */
function verifyToken(token) {
  // This is a placeholder for actual JWT verification
  // In a real implementation, this would verify the JWT signature and expiration
  
  if (token === 'valid-test-token') {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'student',
      progress: {
        'course-intro': true,
        'course-basics': false
      }
    };
  }
  
  return null;
}

/**
 * Store performance metrics (placeholder)
 */
function storePerformanceMetrics(metrics) {
  // In a real implementation, this would send metrics to a monitoring service
  // For now, just log them
  console.log('Performance metrics:', metrics);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Stages and Context
  ExecutionStages,
  RequestContext,
  
  // Middleware
  createRequestContext,
  authenticationFlow,
  authorizationFlow,
  validationFlow,
  dataAccessFlow,
  errorHandler,
  requestLogger,
  performanceMonitor,
  sequenceValidator,
  
  // Execution
  executeBusinessLogic,
  buildStandardResponse,
  validateSequenceDependencies,
  
  // Utilities
  verifyToken,
  storePerformanceMetrics
};