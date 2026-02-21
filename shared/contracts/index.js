/**
 * TalentSphere Contract Enforcement System
 * Runtime validation and enforcement of API contracts
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const config = require('../config');

// Initialize AJV with formats
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
});

addFormats(ajv);

// =============================================================================
// CONTRACT DEFINITIONS
// =============================================================================

/**
 * Standard response contract
 */
const standardResponseContract = {
  type: 'object',
  required: ['success', 'timestamp', 'requestId'],
  properties: {
    success: { type: 'boolean' },
    data: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' },
        field: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        requestId: { type: 'string' }
      },
      required: ['code', 'message']
    },
    message: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    requestId: { type: 'string' },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'number', minimum: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100 },
        total: { type: 'number', minimum: 0 },
        totalPages: { type: 'number', minimum: 0 },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' }
      }
    }
  }
};

/**
 * User contract
 */
const userContract = {
  type: 'object',
  required: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string', minLength: 1, maxLength: 50 },
    lastName: { type: 'string', minLength: 1, maxLength: 50 },
    avatar: { type: 'string', format: 'uri' },
    role: { type: 'string', enum: ['student', 'instructor', 'admin', 'super_admin'] },
    isActive: { type: 'boolean' },
    isVerified: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    lastLoginAt: { type: 'string', format: 'date-time' },
    preferences: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
        language: { type: 'string' },
        timezone: { type: 'string' },
        notifications: {
          type: 'object',
          properties: {
            email: { type: 'boolean' },
            push: { type: 'boolean' },
            inApp: { type: 'boolean' },
            marketing: { type: 'boolean' }
          }
        }
      }
    }
  }
};

/**
 * Course contract
 */
const courseContract = {
  type: 'object',
  required: ['id', 'title', 'description', 'instructorId', 'categoryId', 'difficulty', 'duration', 'price', 'status', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', minLength: 10, maxLength: 10000 },
    shortDescription: { type: 'string', maxLength: 500 },
    instructorId: { type: 'string', format: 'uuid' },
    categoryId: { type: 'string', format: 'uuid' },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    duration: { type: 'number', minimum: 1, maximum: 100000 },
    price: { type: 'number', minimum: 0, maximum: 10000 },
    currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY'] },
    status: { type: 'string', enum: ['draft', 'published', 'archived', 'under_review'] },
    thumbnail: { type: 'string', format: 'uri' },
    previewVideo: { type: 'string', format: 'uri' },
    tags: { type: 'array', items: { type: 'string' }, maxItems: 20 },
    learningObjectives: { type: 'array', items: { type: 'string' }, maxItems: 100 },
    prerequisites: { type: 'array', items: { type: 'string' }, maxItems: 50 },
    enrollmentCount: { type: 'number', minimum: 0 },
    rating: { type: 'number', minimum: 0, maximum: 5 },
    reviewCount: { type: 'number', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    publishedAt: { type: 'string', format: 'date-time' }
  }
};

/**
 * Challenge contract
 */
const challengeContract = {
  type: 'object',
  required: ['id', 'title', 'description', 'difficulty', 'type', 'timeLimit', 'memoryLimit', 'points', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', minLength: 10, maxLength: 5000 },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] },
    type: { type: 'string', enum: ['algorithm', 'data_structure', 'system_design', 'frontend', 'backend', 'full_stack'] },
    categoryId: { type: 'string', format: 'uuid' },
    creatorId: { type: 'string', format: 'uuid' },
    tags: { type: 'array', items: { type: 'string' }, maxItems: 10 },
    timeLimit: { type: 'number', minimum: 1, maximum: 480 },
    memoryLimit: { type: 'number', minimum: 64, maximum: 1024 },
    points: { type: 'number', minimum: 10, maximum: 1000 },
    submissionCount: { type: 'number', minimum: 0 },
    successRate: { type: 'number', minimum: 0, maximum: 1 },
    isPublished: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

// =============================================================================
// CONTRACT VALIDATION
// =============================================================================

/**
 * Validate response against contract
 * @param {Object} response - Response object to validate
 * @param {Object} contract - Validation contract
 * @returns {Object} Validation result
 */
function validateResponse(response, contract) {
  const validate = ajv.compile(contract);
  const isValid = validate(response);
  
  return {
    isValid,
    errors: validate.errors || [],
    errorsText: validate.errors?.map(err => `${err.instancePath || 'root'}: ${err.message}`).join(', ') || ''
  };
}

/**
 * Validate standard response format
 * @param {Object} response - Response object
 * @returns {Object} Validation result
 */
function validateStandardResponse(response) {
  return validateResponse(response, standardResponseContract);
}

/**
 * Validate user data
 * @param {Object} user - User object
 * @returns {Object} Validation result
 */
function validateUser(user) {
  return validateResponse(user, userContract);
}

/**
 * Validate course data
 * @param {Object} course - Course object
 * @returns {Object} Validation result
 */
function validateCourse(course) {
  return validateResponse(course, courseContract);
}

/**
 * Validate challenge data
 * @param {Object} challenge - Challenge object
 * @returns {Object} Validation result
 */
function validateChallenge(challenge) {
  return validateResponse(challenge, challengeContract);
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Response validation middleware
 * @param {Object} contract - Validation contract
 * @returns {Function} Express middleware
 */
function validateResponseContract(contract) {
  return (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to validate response
    res.json = function(data) {
      const validation = validateResponse(data, contract);
      
      if (!validation.isValid && config.isDevelopment) {
        console.error('Contract validation failed:', {
          url: req.originalUrl,
          method: req.method,
          errors: validation.errors,
          errorsText: validation.errorsText,
          response: data
        });
        
        // Still send the response, but log the error in development
        return originalJson.call(this, {
          ...data,
          _contractValidation: {
            isValid: false,
            errors: validation.errors
          }
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Standard response validation middleware
 */
function validateStandardResponseFormat() {
  return validateResponseContract(standardResponseContract);
}

// =============================================================================
// RESPONSE BUILDERS
// =============================================================================

/**
 * Build standardized success response
 * @param {*} data - Response data
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options
 * @returns {Object} Standardized response
 */
function buildSuccessResponse(data, req, options = {}) {
  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: req.id
  };

  if (options.message) {
    response.message = options.message;
  }

  if (options.pagination) {
    response.pagination = options.pagination;
  }

  return response;
}

/**
 * Build standardized error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} req - Express request object
 * @param {Object} options - Additional options
 * @returns {Object} Standardized error response
 */
function buildErrorResponse(code, message, req, options = {}) {
  const response = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  };

  if (options.details) {
    response.error.details = options.details;
  }

  if (options.field) {
    response.error.field = options.field;
  }

  return response;
}

// =============================================================================
// CONTRACT ENFORCEMENT
// =============================================================================

/**
 * Contract enforcement middleware
 * @param {Object} options - Enforcement options
 * @returns {Function} Express middleware
 */
function enforceContracts(options = {}) {
  const {
    validateResponses = true,
    validateRequests = true,
    strictMode = false,
    logViolations = true
  } = options;

  return (req, res, next) => {
    // Add request ID for tracking
    req.id = req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9);
    res.setHeader('X-Request-ID', req.id);

    if (validateResponses) {
      // Store original methods
      const originalJson = res.json;
      const originalStatus = res.status;

      // Override res.status to capture status code
      res.status = function(code) {
        res.statusCode = code;
        return originalStatus.call(this, code);
      };

      // Override res.json to validate
      res.json = function(data) {
        const validation = validateStandardResponse(data);
        
        if (!validation.isValid) {
          const errorInfo = {
            url: req.originalUrl,
            method: req.method,
            statusCode: res.statusCode,
            requestId: req.id,
            errors: validation.errors,
            errorsText: validation.errorsText,
            response: data
          };

          if (logViolations) {
            console.error('Contract violation detected:', errorInfo);
          }

          if (strictMode && config.isDevelopment) {
            // In strict mode, throw error in development
            return res.status(500).json(buildErrorResponse(
              'CONTRACT_VIOLATION',
              'Response does not conform to contract',
              req,
              { details: errorInfo }
            ));
          }
        }

        return originalJson.call(this, data);
      };
    }

    next();
  };
}

// =============================================================================
// SEQUENCE VALIDATION
// =============================================================================

/**
 * Validate request sequence dependencies
 * @param {Array} sequence - Required sequence of operations
 * @returns {Function} Express middleware
 */
function validateSequence(sequence) {
  return (req, res, next) => {
    const userState = req.user; // Assuming user is attached by auth middleware
    
    if (!userState) {
      return res.status(401).json(buildErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        req
      ));
    }

    const currentOperation = req.route?.path;
    const userProgress = userState.progress || {};

    // Check if user has completed prerequisites
    for (const prerequisite of sequence) {
      if (!userProgress[prerequisite]) {
        return res.status(403).json(buildErrorResponse(
          'PREREQUISITE_NOT_MET',
          `Must complete ${prerequisite} before accessing ${currentOperation}`,
          req,
          { details: { prerequisite, currentOperation } }
        ));
      }
    }

    next();
  };
}

// =============================================================================
// MONITORING AND REPORTING
// =============================================================================

/**
 * Contract compliance monitor
 */
class ContractMonitor {
  constructor() {
    this.violations = [];
    this.requests = 0;
    this.compliantRequests = 0;
  }

  recordViolation(violation) {
    this.violations.push({
      ...violation,
      timestamp: new Date().toISOString()
    });
  }

  recordRequest() {
    this.requests++;
  }

  recordCompliance() {
    this.compliantRequests++;
  }

  getComplianceRate() {
    return this.requests > 0 ? (this.compliantRequests / this.requests) * 100 : 100;
  }

  getReport() {
    return {
      totalRequests: this.requests,
      compliantRequests: this.compliantRequests,
      violations: this.violations.length,
      complianceRate: this.getComplianceRate(),
      violationRate: this.requests > 0 ? (this.violations.length / this.requests) * 100 : 0,
      recentViolations: this.violations.slice(-10)
    };
  }

  reset() {
    this.violations = [];
    this.requests = 0;
    this.compliantRequests = 0;
  }
}

// Global monitor instance
const contractMonitor = new ContractMonitor();

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Contracts
  contracts: {
    standardResponse: standardResponseContract,
    user: userContract,
    course: courseContract,
    challenge: challengeContract
  },
  
  // Validation functions
  validateResponse,
  validateStandardResponse,
  validateUser,
  validateCourse,
  validateChallenge,
  
  // Middleware
  validateResponseContract,
  validateStandardResponseFormat,
  enforceContracts,
  validateSequence,
  
  // Response builders
  buildSuccessResponse,
  buildErrorResponse,
  
  // Monitoring
  ContractMonitor,
  contractMonitor
};