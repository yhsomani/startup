/**
 * Validation Utility
 * 
 * Comprehensive request and response validation system
 * with Joi schemas and error handling
 */

const Joi = require('joi');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('Validation');

/**
 * Common validation schemas
 */
const schemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // Email validation
  email: Joi.string().email().required(),
  
  // Password validation
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  
  // Name validation
  name: Joi.string().min(1).max(100).required(),
  
  // Phone validation
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-()]{10,15}$/)
    .optional(),
  
  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }),
  
  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional().min(Joi.ref('startDate'))
  }),
  
  // User registration schema
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .required(),
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    phone: Joi.string().optional(),
    acceptTerms: Joi.boolean().valid(true).required()
  }),
  
  // User login schema
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().default(false)
  }),
  
  // Job posting schema
  jobPosting: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(50).max(5000).required(),
    requirements: Joi.array().items(Joi.string()).required(),
    responsibilities: Joi.array().items(Joi.string()).required(),
    salary: Joi.object({
      min: Joi.number().min(0).optional(),
      max: Joi.number().min(Joi.ref('min')).optional(),
      currency: Joi.string().default('USD'),
      type: Joi.string().valid('hourly', 'annual', 'range').default('annual')
    }).optional(),
    location: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
      postalCode: Joi.string().required(),
      remote: Joi.boolean().default(false)
    }).required(),
    type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'temporary').required(),
    experience: Joi.string().valid('entry-level', 'mid-level', 'senior', 'executive').required(),
    education: Joi.string().valid('high-school', 'bachelor', 'master', 'phd').optional(),
    skills: Joi.array().items(Joi.string()).min(1).required(),
    companyId: Joi.string().uuid().required(),
    benefits: Joi.array().items(Joi.string()).optional(),
    department: Joi.string().optional(),
    industry: Joi.string().required()
  }),
  
  // Company profile schema
  companyProfile: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000).optional(),
    industry: Joi.string().valid(
      'technology', 'healthcare', 'finance', 'education', 
      'retail', 'manufacturing', 'consulting', 'other'
    ).required(),
    size: Joi.string().valid(
      '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
    ).required(),
    website: Joi.string().uri().optional(),
    foundedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
    headquarters: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
      postalCode: Joi.string().required()
    }).required(),
    contact: Joi.object({
      phone: Joi.string().optional(),
      email: Joi.string().email().optional(),
      website: Joi.string().uri().optional()
    }).optional(),
    socialMedia: Joi.object({
      linkedin: Joi.string().uri().optional(),
      twitter: Joi.string().uri().optional(),
      facebook: Joi.string().uri().optional(),
      instagram: Joi.string().uri().optional()
    }).optional(),
    benefits: Joi.array().items(Joi.string()).optional(),
    culture: Joi.object({
      values: Joi.array().items(Joi.string()).optional(),
      description: Joi.string().max(1000).optional()
    }).optional()
  }),
  
  // Notification schema
  notification: Joi.object({
    type: Joi.string().valid(
      'email', 'sms', 'push', 'in-app', 'system'
    ).required(),
    recipients: Joi.array().items(Joi.object({
      id: Joi.string().uuid().required(),
      userId: Joi.string().uuid().optional(),
      email: Joi.string().email().optional(),
      deviceId: Joi.string().optional()
    })).min(1).required(),
    title: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(1000).required(),
    data: Joi.object().optional(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    scheduledFor: Joi.date().iso().optional(),
    expiresAt: Joi.date().iso().optional()
  }),
  
  // Email sending schema
  emailSend: Joi.object({
    to: Joi.array().items(Joi.string().email()).min(1).max(1000).required(),
    cc: Joi.array().items(Joi.string().email()).optional(),
    bcc: Joi.array().items(Joi.string().email()).optional(),
    from: Joi.string().email().optional(),
    replyTo: Joi.string().email().optional(),
    subject: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(100000).required(),
    html: Joi.string().max(200000).optional(),
    attachments: Joi.array().items(Joi.object({
      filename: Joi.string().required(),
      content: Joi.string().required(),
      contentType: Joi.string().required()
    })).optional(),
    template: Joi.object({
      id: Joi.string().required(),
      data: Joi.object().required()
    }).optional(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    tracking: Joi.object({
      enableOpenTracking: Joi.boolean().default(false),
      enableClickTracking: Joi.boolean().default(false),
      utmParams: Joi.object().optional()
    }).optional()
  }),
  
  // Analytics event schema
  analyticsEvent: Joi.object({
    eventType: Joi.string().valid(
      'page_view', 'job_view', 'job_apply', 'profile_view', 'company_view',
      'search', 'connection_request', 'message_sent', 'login', 'signup',
      'email_open', 'email_click', 'notification_click', 'download'
    ).required(),
    userId: Joi.string().uuid().required(),
    sessionId: Joi.string().optional(),
    properties: Joi.object().optional(),
    context: Joi.object({
      ip: Joi.string().ip().optional(),
      userAgent: Joi.string().optional(),
      url: Joi.string().uri().optional(),
      referrer: Joi.string().uri().optional(),
      timestamp: Joi.date().iso().optional()
    }).optional()
  })
};

/**
 * Validate request object against schema
 * @param {Object} data - Request data to validate
 * @param {Object} schema - Joi schema for validation
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateRequest(data, schema, options = {}) {
  const { abortEarly = false, allowUnknown = false, stripUnknown = false } = options;
  
  const validationOptions = {
    abortEarly,
    allowUnknown,
    stripUnknown
  };

  const { error, value } = schema.validate(data, validationOptions);
  
  if (error) {
    const errorDetails = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    logger.warn('Request validation failed', {
      error: errorDetails,
      data: typeof data === 'object' ? JSON.stringify(data) : data
    });

    return {
      isValid: false,
      errors: errorDetails,
      value: null
    };
  }

  logger.debug('Request validation successful', {
    schema: schema._flags?.label || 'unknown',
    validatedFields: Object.keys(value)
  });

  return {
    isValid: true,
    errors: null,
    value
  };
}

/**
 * Validate response object
 * @param {Object} data - Response data to validate
 * @param {Object} schema - Joi schema for validation
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateResponse(data, schema, options = {}) {
  return validateRequest(data, schema, options);
}

/**
 * Validate pagination parameters
 * @param {Object} query - Query parameters
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validatePagination(query, options = {}) {
  const paginationSchema = schemas.pagination;
  
  // Handle string to number conversion
  const data = {
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 20,
    offset: parseInt(query.offset) || 0
  };

  return validateRequest(data, paginationSchema, options);
}

/**
 * Validate UUID parameter
 * @param {string} id - UUID to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateUUID(id, options = {}) {
  return validateRequest({ id }, schemas.uuid, options);
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateEmail(email, options = {}) {
  return validateRequest({ email }, schemas.email, options);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validatePassword(password, options = {}) {
  const result = validateRequest({ password }, schemas.password, options);
  
  if (!result.isValid) {
    return {
      ...result,
      strength: 'weak'
    };
  }

  // Calculate password strength
  let strength = 'weak';
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 1;

  if (score >= 8) strength = 'very strong';
  else if (score >= 6) strength = 'strong';
  else if (score >= 4) strength = 'moderate';
  else if (score >= 2) strength = 'weak';

  return {
    ...result,
    strength,
    score
  };
}

/**
 * Sanitize and validate user input
 * @param {string} input - Input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized and validated result
 */
function sanitizeInput(input, options = {}) {
  const { 
    trim = true, 
    escape = true, 
    maxLength = 1000,
    allowHTML = false 
  } = options;

  let sanitized = input;

  if (typeof input === 'string') {
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Trim whitespace
    if (trim) {
      sanitized = sanitized.trim();
    }
    
    // Limit length
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    // HTML escaping
    if (escape && !allowHTML) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
  }

  return {
    original: input,
    sanitized,
    changed: sanitized !== input,
    truncated: maxLength && input.length > maxLength
  };
}

/**
 * Validate file upload
 * @param {Object} file - File object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateFileUpload(file, options = {}) {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxSize = 5 * 1024 * 1024, // 5MB
    maxFiles = 1
  } = options;

  const fileSchema = Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid(...allowedTypes).required(),
    size: Joi.number().integer().max(maxSize).required(),
    buffer: Joi.binary().required()
  });

  const result = validateRequest(file, fileSchema);
  
  if (!result.isValid) {
    return {
      ...result,
      uploadError: 'validation_failed'
    };
  }

  // Additional validations
  const errors = [];

  if (file.size > maxSize) {
    errors.push({
      field: 'size',
      message: `File size exceeds maximum allowed size of ${maxSize} bytes`
    });
  }

  if (!allowedTypes.includes(file.mimetype)) {
    errors.push({
      field: 'mimetype',
      message: `File type ${file.mimetype} is not allowed`
    });
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null,
    file: result.value
  };
}

/**
 * Create custom validation schema
 * @param {Object} definition - Schema definition
 * @returns {Object} Joi schema
 */
function createSchema(definition) {
  return Joi.object(definition);
}

/**
 * Middleware for request validation
 * @param {Object} schema - Joi schema for validation
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function createValidationMiddleware(schema, options = {}) {
  return (req, res, next) => {
    const result = validateRequest(req.body, schema, options);
    
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors
      });
    }
    
    req.validatedBody = result.value;
    next();
  };
}

/**
 * Middleware for query parameter validation
 * @param {Object} schema - Joi schema for validation
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function createQueryValidationMiddleware(schema, options = {}) {
  return (req, res, next) => {
    const result = validateRequest(req.query, schema, options);
    
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: result.errors
      });
    }
    
    req.validatedQuery = result.value;
    next();
  };
}

module.exports = {
  schemas,
  validateRequest,
  validateResponse,
  validatePagination,
  validateUUID,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateFileUpload,
  createSchema,
  createValidationMiddleware,
  createQueryValidationMiddleware
};