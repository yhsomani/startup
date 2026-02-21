/**
 * TalentSphere Shared Validation System
 * Centralized validation and error handling for all services
 */

const Joi = require('joi');

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Email validation schema
 */
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

/**
 * Password validation schema
 */
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required'
  });

/**
 * UUID validation schema
 */
const uuidSchema = Joi.string()
  .uuid({ version: 'uuidv4' })
  .required()
  .messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required'
  });

/**
 * Pagination schema
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

/**
 * User registration schema
 */
const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'Last name is required'
    }),
  role: Joi.string()
    .valid('student', 'instructor', 'admin')
    .default('student'),
  agreeToTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must agree to the terms of service',
      'any.required': 'Terms agreement is required'
    }),
  newsletterOptIn: Joi.boolean().default(false)
});

/**
 * User login schema
 */
const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  }),
  rememberMe: Joi.boolean().default(false)
});

/**
 * Password reset schema
 */
const passwordResetSchema = Joi.object({
  email: emailSchema,
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  newPassword: passwordSchema,
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
    'any.only': 'Passwords must match',
    'any.required': 'Password confirmation is required'
    })
});

/**
 * Refresh token schema
 */
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

// =============================================================================
// COURSE SCHEMAS
// =============================================================================

/**
 * Course creation schema
 */
const createCourseSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Course title cannot be empty',
      'string.max': 'Course title cannot exceed 255 characters',
      'any.required': 'Course title is required'
    }),
  description: Joi.string()
    .min(10)
    .max(10000)
    .required()
    .messages({
      'string.min': 'Course description must be at least 10 characters',
      'string.max': 'Course description cannot exceed 10,000 characters',
      'any.required': 'Course description is required'
    }),
  shortDescription: Joi.string()
    .max(500)
    .optional(),
  categoryId: uuidSchema,
  difficulty: Joi.string()
    .valid('beginner', 'intermediate', 'advanced', 'expert')
    .required()
    .messages({
      'any.required': 'Difficulty level is required'
    }),
  duration: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .required()
    .messages({
      'number.min': 'Duration must be at least 1 minute',
      'number.max': 'Duration cannot exceed 100,000 minutes',
      'any.required': 'Duration is required'
    }),
  price: Joi.number()
    .min(0)
    .max(10000)
    .required()
    .messages({
      'number.min': 'Price cannot be negative',
      'number.max': 'Price cannot exceed $10,000',
      'any.required': 'Price is required'
    }),
  currency: Joi.string()
    .valid('USD', 'EUR', 'GBP', 'JPY')
    .default('USD'),
  tags: Joi.array()
    .items(Joi.string().min(1).max(50))
    .max(20)
    .default([]),
  learningObjectives: Joi.array()
    .items(Joi.string().min(1).max(500))
    .max(100)
    .default([]),
  prerequisites: Joi.array()
    .items(Joi.string().min(1).max(500))
    .max(50)
    .default([])
});

/**
 * Course update schema
 */
const updateCourseSchema = createCourseSchema.fork(
  ['title', 'description', 'categoryId', 'difficulty', 'duration', 'price'],
  (schema) => schema.optional()
);

/**
 * Module creation schema
 */
const createModuleSchema = Joi.object({
  courseId: uuidSchema,
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Module title cannot be empty',
      'string.max': 'Module title cannot exceed 255 characters',
      'any.required': 'Module title is required'
    }),
  description: Joi.string()
    .max(2000)
    .optional(),
  orderIndex: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.min': 'Order index must be non-negative',
      'any.required': 'Order index is required'
    }),
  duration: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'number.min': 'Duration must be at least 1 minute',
      'number.max': 'Duration cannot exceed 10,000 minutes',
      'any.required': 'Duration is required'
    }),
  type: Joi.string()
    .valid('video', 'reading', 'quiz', 'assignment', 'discussion')
    .required()
    .messages({
      'any.required': 'Module type is required'
    }),
  contentUrl: Joi.string()
    .uri()
    .optional(),
  isRequired: Joi.boolean().default(true),
  isPublished: Joi.boolean().default(false)
});

// =============================================================================
// CHALLENGE SCHEMAS
// =============================================================================

/**
 * Challenge creation schema
 */
const createChallengeSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Challenge title cannot be empty',
      'string.max': 'Challenge title cannot exceed 255 characters',
      'any.required': 'Challenge title is required'
    }),
  description: Joi.string()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 5,000 characters',
      'any.required': 'Description is required'
    }),
  difficulty: Joi.string()
    .valid('easy', 'medium', 'hard', 'expert')
    .required()
    .messages({
      'any.required': 'Difficulty level is required'
    }),
  type: Joi.string()
    .valid('algorithm', 'data_structure', 'system_design', 'frontend', 'backend', 'full_stack')
    .required()
    .messages({
      'any.required': 'Challenge type is required'
    }),
  categoryId: uuidSchema,
  tags: Joi.array()
    .items(Joi.string().min(1).max(50))
    .max(10)
    .default([]),
  timeLimit: Joi.number()
    .integer()
    .min(1)
    .max(480) // 8 hours max
    .required()
    .messages({
      'number.min': 'Time limit must be at least 1 minute',
      'number.max': 'Time limit cannot exceed 480 minutes',
      'any.required': 'Time limit is required'
    }),
  memoryLimit: Joi.number()
    .integer()
    .min(64)
    .max(1024) // 1GB max
    .required()
    .messages({
      'number.min': 'Memory limit must be at least 64MB',
      'number.max': 'Memory limit cannot exceed 1024MB',
      'any.required': 'Memory limit is required'
    }),
  points: Joi.number()
    .integer()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'number.min': 'Points must be at least 10',
      'number.max': 'Points cannot exceed 1000',
      'any.required': 'Points are required'
    }),
  starterCode: Joi.object()
    .pattern(/^[\w-]+$/, Joi.string().min(1).max(1000))
    .max(10)
    .default({}),
  testCases: Joi.array()
    .items(
      Joi.object({
        input: Joi.string().required(),
        expectedOutput: Joi.string().required(),
        isHidden: Joi.boolean().default(true),
        description: Joi.string().max(500).optional()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one test case is required',
      'any.required': 'Test cases are required'
    })
});

/**
 * Challenge submission schema
 */
const submitChallengeSchema = Joi.object({
  code: Joi.string()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.min': 'Code cannot be empty',
      'string.max': 'Code cannot exceed 10,000 characters',
      'any.required': 'Code is required'
    }),
  language: Joi.string()
    .valid('javascript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust')
    .required()
    .messages({
      'any.required': 'Programming language is required'
    })
});

// =============================================================================
// NOTIFICATION SCHEMAS
// =============================================================================

/**
 * Create notification schema
 */
const createNotificationSchema = Joi.object({
  userId: uuidSchema,
  type: Joi.string()
    .valid('course_enrollment', 'course_completion', 'challenge_solved', 'achievement_unlocked', 
           'system_announcement', 'friend_request', 'message_received', 'assignment_due')
    .required()
    .messages({
      'any.required': 'Notification type is required'
    }),
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required'
    }),
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 1,000 characters',
      'any.required': 'Message is required'
    }),
  data: Joi.object().optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium'),
  expiresAt: Joi.date()
    .iso()
    .min('now')
    .optional()
});

/**
 * Notification preferences schema
 */
const updateNotificationPreferencesSchema = Joi.object({
  email: Joi.boolean().required(),
  push: Joi.boolean().required(),
  inApp: Joi.boolean().required(),
  marketing: Joi.boolean().required(),
  courseUpdates: Joi.boolean().required(),
  challengeUpdates: Joi.boolean().required()
});

// =============================================================================
// AI ASSISTANT SCHEMAS
// =============================================================================

/**
 * AI chat request schema
 */
const aiChatRequestSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2,000 characters',
      'any.required': 'Message is required'
    }),
  context: Joi.object({
    courseId: uuidSchema.optional(),
    challengeId: uuidSchema.optional(),
    code: Joi.string().max(5000).optional(),
    error: Joi.string().max(1000).optional(),
    learningPath: Joi.string().max(500).optional()
  }).optional(),
  userId: uuidSchema.optional(),
  sessionId: Joi.string().max(100).optional(),
  language: Joi.string().max(10).optional()
});

/**
 * Code review request schema
 */
const codeReviewSchema = Joi.object({
  code: Joi.string()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'string.min': 'Code cannot be empty',
      'string.max': 'Code cannot exceed 10,000 characters',
      'any.required': 'Code is required'
    }),
  language: Joi.string()
    .valid('javascript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust')
    .required()
    .messages({
      'any.required': 'Programming language is required'
    }),
  context: Joi.string().max(1000).optional()
});

// =============================================================================
// VALIDATION MIDDLEWARE
// =============================================================================

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
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

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validationErrors,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    // Replace the original request property with validated value
    req[source] = value;
    next();
  };
}

/**
 * Pagination validation middleware
 */
function validatePagination(req, res, next) {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type,
      value: detail.context?.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid pagination parameters',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        requestId: req.id
      }
    });
  }

  // Merge pagination parameters with existing query
  req.query = { ...req.query, ...value };
  next();
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Standardized error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @param {Object} req - Express request object
 * @returns {Object} Standardized error response
 */
function createErrorResponse(code, message, details = {}, req) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: req?.id || 'unknown'
    }
  };
}

/**
 * Handle validation errors
 * @param {Object} error - Joi validation error
 * @param {Object} req - Express request object
 * @returns {Object} Standardized validation error response
 */
function handleValidationError(error, req) {
  const validationErrors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    code: detail.type,
    value: detail.context?.value
  }));

  return createErrorResponse('VALIDATION_ERROR', 'Invalid request data', validationErrors, req);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Schemas
  schemas: {
    // Auth
    register: registerSchema,
    login: loginSchema,
    passwordReset: passwordResetSchema,
    refreshToken: refreshTokenSchema,
    
    // Course
    createCourse: createCourseSchema,
    updateCourse: updateCourseSchema,
    createModule: createModuleSchema,
    
    // Challenge
    createChallenge: createChallengeSchema,
    submitChallenge: submitChallengeSchema,
    
    // Notification
    createNotification: createNotificationSchema,
    updateNotificationPreferences: updateNotificationPreferencesSchema,
    
    // AI Assistant
    aiChatRequest: aiChatRequestSchema,
    codeReview: codeReviewSchema,
    
    // Common
    pagination: paginationSchema,
    email: emailSchema,
    password: passwordSchema,
    uuid: uuidSchema
  },
  
  // Middleware
  validate,
  validatePagination,
  
  // Error handling
  createErrorResponse,
  handleValidationError,
  
  // Error codes
  errorCodes: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
  }
};