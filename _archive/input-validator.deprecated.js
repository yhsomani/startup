/**
 * TalentSphere Input Validator and Sanitizer
 * Comprehensive input validation and sanitization for all services
 */

const validator = require('validator');
const xss = require('xss');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

class InputValidator {
  constructor(options = {}) {
    this.options = {
      enableSanitization: options.enableSanitization !== false,
      enableDeepValidation: options.enableDeepValidation !== false,
      enableCustomRules: options.enableCustomRules !== false,
      sanitizeHtml: options.sanitizeHtml !== false,
      sanitizeScripts: options.sanitizeScripts !== false,
      validateEmails: options.validateEmails !== false,
      validateUrls: options.validateUrls !== false,
      validatePhoneNumbers: options.validatePhoneNumbers !== false,
      validateDates: options.validateDates !== false,
      validateFiles: options.validateFiles !== false,
      ...options
    };
  }

  /**
   * Validate and sanitize a complete request object
   */
  validateRequest(req, schema = null) {
    const result = {
      valid: true,
      errors: [],
      sanitizedData: {}
    };

    try {
      // Validate and sanitize query parameters
      if (req.query) {
        const queryResult = this.validateAndSanitizeData(req.query, schema?.query);
        Object.assign(result.sanitizedData, { query: queryResult.data });
        result.errors.push(...queryResult.errors);
      }

      // Validate and sanitize body
      if (req.body) {
        const bodyResult = this.validateAndSanitizeData(req.body, schema?.body);
        Object.assign(result.sanitizedData, { body: bodyResult.data });
        result.errors.push(...bodyResult.errors);
      }

      // Validate and sanitize params
      if (req.params) {
        const paramsResult = this.validateAndSanitizeData(req.params, schema?.params);
        Object.assign(result.sanitizedData, { params: paramsResult.data });
        result.errors.push(...paramsResult.errors);
      }

      // Validate and sanitize headers
      if (req.headers) {
        const headersResult = this.validateAndSanitizeData(req.headers, schema?.headers);
        Object.assign(result.sanitizedData, { headers: headersResult.data });
        result.errors.push(...headersResult.errors);
      }

      result.valid = result.errors.length === 0;
    } catch (error) {
      result.valid = false;
      result.errors.push({
        field: 'request',
        message: error.message,
        code: 'REQUEST_VALIDATION_ERROR'
      });
    }

    return result;
  }

  /**
   * Validate and sanitize data based on schema
   */
  validateAndSanitizeData(data, schema = null) {
    const result = {
      valid: true,
      errors: [],
      data: Array.isArray(data) ? [] : {}
    };

    if (schema) {
      // Validate against schema
      const schemaValidation = this.validateAgainstSchema(data, schema);
      if (!schemaValidation.valid) {
        result.errors.push(...schemaValidation.errors);
      }
      result.data = schemaValidation.data;
    } else {
      // Apply general validation and sanitization
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const itemResult = this.processValue(data[i]);
          result.data.push(itemResult.value);
          result.errors.push(...itemResult.errors);
        }
      } else {
        for (const [key, value] of Object.entries(data)) {
          const valueResult = this.processValue(value);
          result.data[key] = valueResult.value;
          result.errors.push(...valueResult.errors);
        }
      }
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Process individual value - validate and sanitize
   */
  processValue(value) {
    const result = {
      value,
      errors: []
    };

    if (value === null || value === undefined) {
      return result;
    }

    if (typeof value === 'string') {
      // Sanitize string
      if (this.options.enableSanitization) {
        result.value = this.sanitizeString(value);
      }

      // Validate string
      const stringValidation = this.validateString(result.value);
      if (!stringValidation.valid) {
        result.errors.push(...stringValidation.errors);
      }
      result.value = stringValidation.value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively validate object
      const objResult = this.validateAndSanitizeData(value);
      result.value = objResult.data;
      result.errors.push(...objResult.errors);
    } else if (Array.isArray(value)) {
      // Recursively validate array
      const arrResult = this.validateAndSanitizeData(value);
      result.value = arrResult.data;
      result.errors.push(...arrResult.errors);
    } else if (typeof value === 'number') {
      // Validate number
      const numValidation = this.validateNumber(value);
      if (!numValidation.valid) {
        result.errors.push(...numValidation.errors);
      }
      result.value = numValidation.value;
    }

    return result;
  }

  /**
   * Sanitize string input
   */
  sanitizeString(str) {
    if (typeof str !== 'string') {return str;}

    // Remove null bytes
    str = str.replace(/\0/g, '');

    // Remove control characters except tabs and newlines
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    str = str.trim();

    // Sanitize HTML if enabled
    if (this.options.sanitizeHtml) {
      str = this.sanitizeHTML(str);
    }

    // Additional sanitization can be added here
    return str;
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHTML(html) {
    if (typeof html !== 'string') {return html;}

    // Use DOMPurify for robust HTML sanitization
    return domPurify.sanitize(html);
  }

  /**
   * Validate string input
   */
  validateString(str) {
    const result = {
      valid: true,
      errors: [],
      value: str
    };

    if (typeof str !== 'string') {
      result.valid = false;
      result.errors.push({
        field: 'value',
        message: 'Value must be a string',
        code: 'INVALID_TYPE'
      });
      return result;
    }

    // Check for excessive length
    if (str.length > 10000) { // 10KB limit for strings
      result.valid = false;
      result.errors.push({
        field: 'value',
        message: 'String is too long',
        code: 'STRING_TOO_LONG'
      });
    }

    // Check for potentially dangerous patterns
    if (this.containsDangerousPattern(str)) {
      result.valid = false;
      result.errors.push({
        field: 'value',
        message: 'String contains potentially dangerous content',
        code: 'DANGEROUS_CONTENT'
      });
    }

    return result;
  }

  /**
   * Validate number input
   */
  validateNumber(num) {
    const result = {
      valid: true,
      errors: [],
      value: num
    };

    if (typeof num !== 'number') {
      result.valid = false;
      result.errors.push({
        field: 'value',
        message: 'Value must be a number',
        code: 'INVALID_TYPE'
      });
      return result;
    }

    // Check for reasonable bounds
    if (!Number.isFinite(num)) {
      result.valid = false;
      result.errors.push({
        field: 'value',
        message: 'Number is not finite',
        code: 'INVALID_NUMBER'
      });
    }

    // Additional validation can be added here
    return result;
  }

  /**
   * Validate email
   */
  validateEmail(email) {
    if (!this.options.validateEmails) {
      return { valid: true, errors: [], value: email };
    }

    const result = {
      valid: true,
      errors: [],
      value: email
    };

    if (!validator.isEmail(email)) {
      result.valid = false;
      result.errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    return result;
  }

  /**
   * Validate URL
   */
  validateUrl(url) {
    if (!this.options.validateUrls) {
      return { valid: true, errors: [], value: url };
    }

    const result = {
      valid: true,
      errors: [],
      value: url
    };

    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: true,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false
    })) {
      result.valid = false;
      result.errors.push({
        field: 'url',
        message: 'Invalid URL format',
        code: 'INVALID_URL'
      });
    }

    return result;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone) {
    if (!this.options.validatePhoneNumbers) {
      return { valid: true, errors: [], value: phone };
    }

    const result = {
      valid: true,
      errors: [],
      value: phone
    };

    // Basic phone number validation
    if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      result.valid = false;
      result.errors.push({
        field: 'phone',
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE'
      });
    }

    return result;
  }

  /**
   * Validate date
   */
  validateDate(date) {
    if (!this.options.validateDates) {
      return { valid: true, errors: [], value: date };
    }

    const result = {
      valid: true,
      errors: [],
      value: date
    };

    if (!validator.isISO8601(date.toString())) {
      result.valid = false;
      result.errors.push({
        field: 'date',
        message: 'Invalid date format',
        code: 'INVALID_DATE'
      });
    }

    return result;
  }

  /**
   * Validate file
   */
  validateFile(file) {
    if (!this.options.validateFiles) {
      return { valid: true, errors: [], value: file };
    }

    const result = {
      valid: true,
      errors: [],
      value: file
    };

    if (!file || !file.mimetype || !file.size) {
      result.valid = false;
      result.errors.push({
        field: 'file',
        message: 'Invalid file format',
        code: 'INVALID_FILE'
      });
      return result;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      result.valid = false;
      result.errors.push({
        field: 'file',
        message: 'File size exceeds limit (10MB)',
        code: 'FILE_TOO_LARGE'
      });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      result.valid = false;
      result.errors.push({
        field: 'file',
        message: 'File type not allowed',
        code: 'INVALID_FILE_TYPE'
      });
    }

    return result;
  }

  /**
   * Validate against schema
   */
  validateAgainstSchema(data, schema) {
    const result = {
      valid: true,
      errors: [],
      data: Array.isArray(data) ? [] : {}
    };

    if (schema.type === 'array' && Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const itemResult = this.validateAgainstSchema(data[i], schema.items);
        result.data.push(itemResult.data);
        result.errors.push(...itemResult.errors);
      }
    } else if (typeof schema.properties === 'object') {
      // Object schema validation
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        const value = data[key];

        // Check if required field exists
        if (schema.required && schema.required.includes(key) && (value === undefined || value === null)) {
          result.errors.push({
            field: key,
            message: `Field ${key} is required`,
            code: 'FIELD_REQUIRED'
          });
          continue;
        }

        if (value !== undefined && value !== null) {
          const valueResult = this.validateValueAgainstSchema(value, propertySchema);
          result.data[key] = valueResult.data;
          result.errors.push(...valueResult.errors);
        } else {
          result.data[key] = value;
        }
      }

      // Check for additional properties if restricted
      if (schema.additionalProperties === false) {
        const allowedKeys = new Set(Object.keys(schema.properties || {}));
        for (const key of Object.keys(data)) {
          if (!allowedKeys.has(key)) {
            result.errors.push({
              field: key,
              message: `Property ${key} is not allowed`,
              code: 'PROPERTY_NOT_ALLOWED'
            });
          }
        }
      }
    } else {
      // Direct validation against schema
      const valueResult = this.validateValueAgainstSchema(data, schema);
      result.data = valueResult.data;
      result.errors.push(...valueResult.errors);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate value against schema
   */
  validateValueAgainstSchema(value, schema) {
    const result = {
      valid: true,
      errors: [],
      data: value
    };

    // Type validation
    if (schema.type) {
      const typeValid = this.validateType(value, schema.type);
      if (!typeValid.valid) {
        result.errors.push(...typeValid.errors);
      }
    }

    // String validations
    if (schema.type === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        result.errors.push({
          field: 'value',
          message: `String is too short (min: ${schema.minLength})`,
          code: 'STRING_TOO_SHORT'
        });
      }

      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        result.errors.push({
          field: 'value',
          message: `String is too long (max: ${schema.maxLength})`,
          code: 'STRING_TOO_LONG'
        });
      }

      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        result.errors.push({
          field: 'value',
          message: 'String does not match required pattern',
          code: 'PATTERN_MISMATCH'
        });
      }

      if (schema.format) {
        const formatResult = this.validateFormat(value, schema.format);
        if (!formatResult.valid) {
          result.errors.push(...formatResult.errors);
        }
      }
    }

    // Number validations
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        result.errors.push({
          field: 'value',
          message: `Number is too small (min: ${schema.minimum})`,
          code: 'NUMBER_TOO_SMALL'
        });
      }

      if (schema.maximum !== undefined && value > schema.maximum) {
        result.errors.push({
          field: 'value',
          message: `Number is too large (max: ${schema.maximum})`,
          code: 'NUMBER_TOO_LARGE'
        });
      }

      if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
        result.errors.push({
          field: 'value',
          message: `Number must be greater than ${schema.exclusiveMinimum}`,
          code: 'NUMBER_BELOW_MINIMUM'
        });
      }

      if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
        result.errors.push({
          field: 'value',
          message: `Number must be less than ${schema.exclusiveMaximum}`,
          code: 'NUMBER_ABOVE_MAXIMUM'
        });
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      result.errors.push({
        field: 'value',
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        code: 'INVALID_ENUM_VALUE'
      });
    }

    // Process the value through sanitization
    const processedValue = this.processValue(value);
    result.data = processedValue.value;
    result.errors.push(...processedValue.errors);

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate type
   */
  validateType(value, expectedType) {
    const result = {
      valid: true,
      errors: []
    };

    let isValid = false;

    switch (expectedType) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'integer':
        isValid = Number.isInteger(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'object':
        isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
      case 'null':
        isValid = value === null;
        break;
      default:
        isValid = true; // Unknown type, pass validation
    }

    if (!isValid) {
      result.valid = false;
      result.errors.push({
        field: 'value',
        message: `Expected type ${expectedType}, got ${typeof value}`,
        code: 'TYPE_MISMATCH'
      });
    }

    return result;
  }

  /**
   * Validate format
   */
  validateFormat(value, format) {
    const result = {
      valid: true,
      errors: []
    };

    switch (format) {
      case 'email':
        return this.validateEmail(value);
      case 'uri':
      case 'url':
        return this.validateUrl(value);
      case 'date':
      case 'date-time':
        return this.validateDate(value);
      case 'phone':
        return this.validatePhoneNumber(value);
      default:
        return result;
    }
  }

  /**
   * Check if string contains dangerous patterns
   */
  containsDangerousPattern(str) {
    if (typeof str !== 'string') {return false;}

    // Patterns to detect potential attacks
    const dangerousPatterns = [
      /(<script\b|<iframe\b|<object\b|<embed\b|<link\b)/i,  // XSS
      /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i,  // SQL Injection
      /(\.\.\/|\.\.\\)/,  // Directory traversal
      /(\{\s*\w+\s*:\s*\w+\s*\})/,  // Potential prototype pollution
      /(eval\s*\(|function\s*\(|setTimeout\s*\(|setInterval\s*\()/i,  // Code execution
      /(%2e|%2f|%5c|%252e|%252f|%255c)/i,  // Encoded traversal
      /(document\.cookie|window\.location|document\.domain)/i  // Client-side attacks
    ];

    return dangerousPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Middleware for Express
   */
  middleware(schema = null) {
    return (req, res, next) => {
      const validationResult = this.validateRequest(req, schema);

      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: validationResult.errors
          }
        });
      }

      // Update request with sanitized data
      if (validationResult.sanitizedData.query) {
        req.query = validationResult.sanitizedData.query;
      }
      if (validationResult.sanitizedData.body) {
        req.body = validationResult.sanitizedData.body;
      }
      if (validationResult.sanitizedData.params) {
        req.params = validationResult.sanitizedData.params;
      }
      if (validationResult.sanitizedData.headers) {
        req.headers = validationResult.sanitizedData.headers;
      }

      next();
    };
  }
}

// Export singleton instance
const inputValidator = new InputValidator();

module.exports = {
  InputValidator,
  inputValidator,
  validateRequest: inputValidator.validateRequest.bind(inputValidator),
  validateAndSanitizeData: inputValidator.validateAndSanitizeData.bind(inputValidator),
  middleware: inputValidator.middleware.bind(inputValidator)
};