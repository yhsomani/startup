/**
 * TalentSphere Input Sanitization and Security Module
 * Provides comprehensive input sanitization and security measures
 */

const validator = require('validator');
const xss = require('xss');
const he = require('he');

class InputSanitizer {
  constructor() {
    this XSSOptions = {
      whiteList: {
        a: ['href', 'title', 'target'],
        b: [],
        i: [],
        em: [],
        strong: [],
        p: ['style'],
        br: [],
        span: ['style'],
        div: ['style', 'class'],
        ul: [],
        ol: [],
        li: [],
        h1: ['style'],
        h2: ['style'],
        h3: ['style'],
        h4: ['style'],
        h5: ['style'],
        h6: ['style'],
        blockquote: [],
        code: [],
        pre: ['class']
      },
      stripIgnoreTag: false,
      stripIgnoreTagBody: false
    };

    this.maxLengths = {
      name: 100,
      title: 200,
      description: 5000,
      headline: 200,
      email: 255,
      phone: 20,
      url: 2048,
      companyName: 255,
      industry: 100,
      bio: 1000,
      message: 2000,
      searchQuery: 200
    };
  }

  // Main sanitization method
  sanitize(input, type = 'string', options = {}) {
    if (input === null || input === undefined) {
      return '';
    }

    // Convert to string
    let sanitized = String(input).trim();

    // Apply type-specific sanitization
    switch (type) {
      case 'string':
        sanitized = this.sanitizeString(sanitized, options);
        break;
      case 'email':
        sanitized = this.sanitizeEmail(sanitized);
        break;
      case 'url':
        sanitized = this.sanitizeUrl(sanitized);
        break;
      case 'html':
        sanitized = this.sanitizeHtml(sanitized, options);
        break;
      case 'number':
        sanitized = this.sanitizeNumber(sanitized);
        break;
      case 'phone':
        sanitized = this.sanitizePhone(sanitized);
        break;
      case 'date':
        sanitized = this.sanitizeDate(sanitized);
        break;
      case 'uuid':
        sanitized = this.sanitizeUuid(sanitized);
        break;
      case 'json':
        sanitized = this.sanitizeJson(sanitized);
        break;
      case 'array':
        sanitized = this.sanitizeArray(sanitized, options);
        break;
      case 'object':
        sanitized = this.sanitizeObject(sanitized, options);
        break;
      default:
        sanitized = this.sanitizeString(sanitized, options);
    }

    return sanitized;
  }

  // String sanitization
  sanitizeString(input, options = {}) {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize Unicode
    sanitized = sanitized.normalize('NFKC');

    // Check length limit
    const maxLength = options.maxLength || this.maxLengths.name;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Escape HTML entities
    sanitized = he.encode(sanitized, {
      useNamedReferences: true,
      decimal: false
    });

    return sanitized;
  }

  // Email sanitization
  sanitizeEmail(input) {
    // Basic string sanitization
    let sanitized = this.sanitizeString(input, { maxLength: this.maxLengths.email });

    // Validate email format
    if (!validator.isEmail(sanitized)) {
      throw new Error('Invalid email format');
    }

    // Convert to lowercase
    sanitized = sanitized.toLowerCase();

    return sanitized;
  }

  // URL sanitization
  sanitizeUrl(input) {
    let sanitized = this.sanitizeString(input, { maxLength: this.maxLengths.url });

    // Basic URL validation
    if (sanitized && !validator.isURL(sanitized, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      throw new Error('Invalid URL format');
    }

    return sanitized;
  }

  // HTML sanitization (XSS protection)
  sanitizeHtml(input, options = {}) {
    const sanitizeOptions = {
      ...this.XSSOptions,
      ...options
    };

    return xss(input, sanitizeOptions);
  }

  // Number sanitization
  sanitizeNumber(input) {
    // Remove non-numeric characters
    const sanitized = input.replace(/[^\d.-]/g, '');

    // Validate it's a number
    if (sanitized && isNaN(parseFloat(sanitized))) {
      throw new Error('Invalid number format');
    }

    return sanitized;
  }

  // Phone sanitization
  sanitizePhone(input) {
    let sanitized = this.sanitizeString(input, { maxLength: this.maxLengths.phone });

    // Remove non-phone characters
    sanitized = sanitized.replace(/[^\d+\-\s\(\)]/g, '');

    // Basic phone validation
    if (sanitized && !validator.isMobilePhone(sanitized, 'any')) {
      throw new Error('Invalid phone number format');
    }

    return sanitized;
  }

  // Date sanitization
  sanitizeDate(input) {
    if (!input) return input;

    // Try to parse as date
    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }

    return date.toISOString();
  }

  // UUID sanitization
  sanitizeUuid(input) {
    if (!input) return input;

    // Remove non-hex characters and hyphens
    const sanitized = input.replace(/[^0-9a-fA-F-]/g, '');

    // Validate UUID format
    if (!validator.isUUID(sanitized)) {
      throw new Error('Invalid UUID format');
    }

    return sanitized.toLowerCase();
  }

  // JSON sanitization
  sanitizeJson(input) {
    if (typeof input === 'object') {
      return this.sanitizeObject(input);
    }

    try {
      const parsed = JSON.parse(input);
      return this.sanitizeObject(parsed);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  // Array sanitization
  sanitizeArray(input, options = {}) {
    if (!Array.isArray(input)) {
      if (typeof input === 'string') {
        // Try to parse comma-separated values
        input = input.split(',').map(item => item.trim());
      } else {
        throw new Error('Input is not an array');
      }
    }

    const { maxItems = 100, itemType = 'string' } = options;

    // Limit array size
    if (input.length > maxItems) {
      input = input.slice(0, maxItems);
    }

    // Sanitize each item
    return input.map(item => this.sanitize(item, itemType, options));
  }

  // Object sanitization
  sanitizeObject(input, options = {}) {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Input is not an object');
    }

    const { maxDepth = 5, currentDepth = 0 } = options;

    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
      throw new Error('Object nesting too deep');
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(input)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeString(key, { maxLength: 100 });

      // Sanitize value based on type
      if (value === null || value === undefined) {
        sanitized[sanitizedKey] = value;
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = this.sanitizeArray(value, { ...options, currentDepth: currentDepth + 1 });
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = this.sanitizeObject(value, { ...options, currentDepth: currentDepth + 1 });
      } else if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else {
        sanitized[sanitizedKey] = this.sanitize(String(value));
      }
    }

    return sanitized;
  }

  // File upload sanitization
  sanitizeFile(file, options = {}) {
    const {
      allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      maxFileSize = 10 * 1024 * 1024, // 10MB
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt']
    } = options;

    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (file.size > maxFileSize) {
      throw new Error('File size exceeds maximum allowed size');
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('File type not allowed');
    }

    // Check file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('File extension not allowed');
    }

    // Sanitize filename
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-_]/g, '_') // Replace special chars
      .replace(/_{2,}/g, '_') // Reduce multiple underscores
      .toLowerCase();

    return {
      ...file,
      originalName: file.name,
      name: sanitizedName,
      extension: fileExtension,
      mimetype: file.mimetype,
      size: file.size
    };
  }

  // Search query sanitization
  sanitizeSearchQuery(input) {
    let sanitized = this.sanitizeString(input, { maxLength: this.maxLengths.searchQuery });

    // Remove potentially dangerous search operators
    sanitized = sanitized.replace(/[<>'"&]/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  // SQL injection prevention
  preventSqlInjection(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Common SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\*|;|\/\*|\*\/|;|\b(OR|AND)\b)/i,
      /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        throw new Error('Potentially malicious input detected');
      }
    }

    return input;
  }

  // Batch sanitization for API requests
  sanitizeRequestBody(req, schema = {}) {
    const sanitized = {};

    for (const [key, value] of Object.entries(req.body)) {
      const fieldSchema = schema[key] || {};
      const { type = 'string', required = false, maxLength, sanitize = true } = fieldSchema;

      // Check required fields
      if (required && (value === null || value === undefined || value === '')) {
        throw new Error(`Required field '${key}' is missing`);
      }

      // Skip sanitization if disabled
      if (!sanitize) {
        sanitized[key] = value;
        continue;
      }

      // Sanitize based on type
      if (value !== null && value !== undefined) {
        sanitized[key] = this.sanitize(value, type, { maxLength });
      }
    }

    // Add query parameters and route params
    sanitized.query = this.sanitizeObject(req.query || {});
    sanitized.params = this.sanitizeObject(req.params || {});

    return sanitized;
  }
}

// Middleware for Express
const createSanitizationMiddleware = (schema = {}) => {
  return (req, res, next) => {
    try {
      const sanitizer = new InputSanitizer();
      req.sanitized = sanitizer.sanitizeRequestBody(req, schema);
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SANITIZATION_ERROR',
          message: error.message
        }
      });
    }
  };
};

module.exports = {
  InputSanitizer,
  createSanitizationMiddleware
};