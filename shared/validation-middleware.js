/**
 * TalentSphere Input Validation & Sanitization Library
 * Comprehensive validation for all services
 */

const validator = require("validator");
const xss = require("xss");
const crypto = require("crypto");

class ValidationMiddleware {
    constructor() {
        this.sanitizers = {
            string: this.sanitizeString,
            email: this.sanitizeEmail,
            html: this.sanitizeHtml,
            number: this.sanitizeNumber,
            boolean: this.sanitizeBoolean,
            url: this.sanitizeUrl,
            array: this.sanitizeArray,
            object: this.sanitizeObject,
        };
    }

    /**
     * Validate and sanitize request body
     */
    validateBody(schema, options = {}) {
        return (req, res, next) => {
            try {
                const validatedData = this.validate(req.body, schema, options);
                req.validatedBody = validatedData;
                next();
            } catch (error) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: error.message,
                    details: error.details || [],
                    requestId: req.requestId,
                });
            }
        };
    }

    /**
     * Validate and sanitize query parameters
     */
    validateQuery(schema, options = {}) {
        return (req, res, next) => {
            try {
                const validatedData = this.validate(req.query, schema, options);
                req.validatedQuery = validatedData;
                next();
            } catch (error) {
                return res.status(400).json({
                    error: "Query validation failed",
                    message: error.message,
                    details: error.details || [],
                    requestId: req.requestId,
                });
            }
        };
    }

    /**
     * Validate and sanitize path parameters
     */
    validateParams(schema, options = {}) {
        return (req, res, next) => {
            try {
                const validatedData = this.validate(req.params, schema, options);
                req.validatedParams = validatedData;
                next();
            } catch (error) {
                return res.status(400).json({
                    error: "Parameter validation failed",
                    message: error.message,
                    details: error.details || [],
                    requestId: req.requestId,
                });
            }
        };
    }

    /**
     * Main validation function
     */
    validate(data, schema, options = {}) {
        const errors = [];
        const validatedData = {};
        const { strict = true, sanitize = true } = options;

        // Validate each field
        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];

            try {
                if (value === undefined || value === null) {
                    if (rules.required) {
                        errors.push({
                            field,
                            message: `${field} is required`,
                        });
                    }
                    continue;
                }

                // Apply validation rules
                let validatedValue = value;

                for (const rule of rules.validators || []) {
                    const result = this.applyRule(field, value, rule, rules);
                    if (result.error) {
                        errors.push({
                            field,
                            message: result.error,
                        });
                        break;
                    }
                    validatedValue = result.value;
                }

                // Apply sanitization
                if (sanitize && rules.type && this.sanitizers[rules.type]) {
                    validatedValue = this.sanitizers[rules.type](validatedValue, rules);
                }

                validatedData[field] = validatedValue;
            } catch (error) {
                errors.push({
                    field,
                    message: error.message,
                });
            }
        }

        // Check for unknown fields in strict mode
        if (strict) {
            for (const field of Object.keys(data)) {
                if (!schema[field]) {
                    errors.push({
                        field,
                        message: `Unknown field: ${field}`,
                    });
                }
            }
        }

        if (errors.length > 0) {
            const error = new Error("Validation failed");
            error.message = "Input validation failed";
            error.details = errors;
            throw error;
        }

        return validatedData;
    }

    /**
     * Apply individual validation rule
     */
    applyRule(field, value, rule, fieldConfig) {
        switch (rule.type) {
            case "string":
                return this.validateString(field, value, rule, fieldConfig);
            case "email":
                return this.validateEmail(field, value, rule, fieldConfig);
            case "number":
                return this.validateNumber(field, value, rule, fieldConfig);
            case "boolean":
                return this.validateBoolean(field, value, rule, fieldConfig);
            case "array":
                return this.validateArray(field, value, rule, fieldConfig);
            case "object":
                return this.validateObject(field, value, rule, fieldConfig);
            case "url":
                return this.validateUrl(field, value, rule, fieldConfig);
            case "uuid":
                return this.validateUUID(field, value, rule, fieldConfig);
            case "password":
                return this.validatePassword(field, value, rule, fieldConfig);
            case "enum":
                return this.validateEnum(field, value, rule, fieldConfig);
            default:
                return { value, error: null };
        }
    }

    validateString(field, value, rule, fieldConfig) {
        if (typeof value !== "string") {
            return { value: String(value), error: `${field} must be a string` };
        }

        // Length validation
        if (rule.minLength && value.length < rule.minLength) {
            return { value, error: `${field} must be at least ${rule.minLength} characters long` };
        }

        if (rule.maxLength && value.length > rule.maxLength) {
            return { value, error: `${field} must be at most ${rule.maxLength} characters long` };
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            return { value, error: `${field} format is invalid` };
        }

        // Custom validator
        if (rule.validate) {
            const result = rule.validate(value);
            if (result !== true) {
                return { value, error: `${field}: ${result}` };
            }
        }

        return { value, error: null };
    }

    validateEmail(field, value, rule, fieldConfig) {
        if (typeof value !== "string") {
            return { value, error: `${field} must be a string` };
        }

        const normalizedValue = value.toLowerCase().trim();

        if (!validator.isEmail(normalizedValue)) {
            return { value, error: `${field} must be a valid email address` };
        }

        // Additional validation against common disposable email domains
        if (rule.disallowDisposable && this.isDisposableEmail(normalizedValue)) {
            return { value, error: `${field} cannot be a disposable email address` };
        }

        return { value: normalizedValue, error: null };
    }

    validateNumber(field, value, rule, fieldConfig) {
        const numValue = Number(value);

        if (isNaN(numValue)) {
            return { value, error: `${field} must be a valid number` };
        }

        if (rule.min !== undefined && numValue < rule.min) {
            return { value, error: `${field} must be at least ${rule.min}` };
        }

        if (rule.max !== undefined && numValue > rule.max) {
            return { value, error: `${field} must be at most ${rule.max}` };
        }

        if (rule.integer && !Number.isInteger(numValue)) {
            return { value, error: `${field} must be an integer` };
        }

        return { value: numValue, error: null };
    }

    validateUUID(field, value, rule, fieldConfig) {
        if (typeof value !== "string") {
            return { value, error: `${field} must be a string` };
        }

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(value)) {
            return { value, error: `${field} must be a valid UUID` };
        }

        return { value, error: null };
    }

    validatePassword(field, value, rule, fieldConfig) {
        if (typeof value !== "string") {
            return { value, error: `${field} must be a string` };
        }

        const errors = [];

        // Length validation
        if (value.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }

        // Complexity validation
        if (!/[A-Z]/.test(value)) {
            errors.push("Password must contain at least one uppercase letter");
        }

        if (!/[a-z]/.test(value)) {
            errors.push("Password must contain at least one lowercase letter");
        }

        if (!/\d/.test(value)) {
            errors.push("Password must contain at least one number");
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            errors.push("Password must contain at least one special character");
        }

        // Common password check
        if (this.isCommonPassword(value)) {
            errors.push("Password is too common. Please choose a more secure password");
        }

        if (errors.length > 0) {
            return { value, error: errors.join(". ") };
        }

        return { value, error: null };
    }

    validateEnum(field, value, rule, fieldConfig) {
        if (!rule.options.includes(value)) {
            return {
                value,
                error: `${field} must be one of: ${rule.options.join(", ")}`,
            };
        }

        return { value, error: null };
    }

    /**
     * Sanitization functions
     */
    sanitizeString(value, config = {}) {
        if (typeof value !== "string") {return value;}

        let sanitized = value.trim();

        if (config.removeWhitespace) {
            sanitized = sanitized.replace(/\s+/g, " ");
        }

        return sanitized;
    }

    sanitizeEmail(value, config = {}) {
        if (typeof value !== "string") {return value;}

        return value.toLowerCase().trim();
    }

    sanitizeHtml(value, config = {}) {
        if (typeof value !== "string") {return value;}

        const xssOptions = {
            whiteList: config.allowedTags || {},
            stripIgnoreTag: config.stripIgnoreTag || false,
            stripIgnoreTagBody: config.stripIgnoreTagBody || false,
        };

        return xss(value, xssOptions);
    }

    sanitizeNumber(value, config = {}) {
        const num = Number(value);
        return isNaN(num) ? config.default || 0 : num;
    }

    sanitizeBoolean(value, config = {}) {
        if (typeof value === "boolean") {return value;}
        if (typeof value === "string") {
            return value.toLowerCase() === "true";
        }
        return Boolean(value);
    }

    sanitizeUrl(value, config = {}) {
        if (typeof value !== "string") {return value;}

        // Basic URL validation and normalization
        let sanitized = validator.normalizeEmail(value);

        if (config.requireHttps && !sanitized.startsWith("https://")) {
            sanitized = "https://" + sanitized;
        }

        return sanitized;
    }

    sanitizeArray(value, config = {}) {
        if (!Array.isArray(value)) {
            return Array.isArray(value) ? value : [];
        }

        if (config.maxItems) {
            return value.slice(0, config.maxItems);
        }

        return value;
    }

    sanitizeObject(value, config = {}) {
        if (typeof value !== "object" || value === null) {
            return {};
        }

        const sanitized = { ...value };

        // Remove null/undefined values if specified
        if (config.removeNullish) {
            Object.keys(sanitized).forEach(key => {
                if (sanitized[key] === null || sanitized[key] === undefined) {
                    delete sanitized[key];
                }
            });
        }

        return sanitized;
    }

    /**
     * Utility functions
     */
    isDisposableEmail(email) {
        const disposableDomains = [
            "10minutemail.com",
            "tempmail.org",
            "guerrillamail.com",
            "mailinator.com",
            "throwaway.email",
            "sharklasers.com",
        ];

        const domain = email.split("@")[1];
        return disposableDomains.includes(domain);
    }

    isCommonPassword(password) {
        const commonPasswords = [
            "password",
            "123456",
            "password123",
            "admin",
            "qwerty",
            "letmein",
            "welcome",
            "monkey",
            "dragon",
        ];

        return commonPasswords.includes(password.toLowerCase());
    }

    /**
     * Predefined validation schemas
     */
    static schemas = {
        user: {
            firstName: {
                type: "string",
                required: true,
                validators: [{ minLength: 2, maxLength: 50 }, { pattern: /^[a-zA-Z\s'-]+$/ }],
            },
            lastName: {
                type: "string",
                required: true,
                validators: [{ minLength: 2, maxLength: 50 }, { pattern: /^[a-zA-Z\s'-]+$/ }],
            },
            email: {
                type: "email",
                required: true,
                disallowDisposable: true,
            },
            password: {
                type: "password",
                required: true,
            },
            role: {
                type: "enum",
                required: false,
                options: ["user", "hr", "manager", "admin"],
            },
        },

        job: {
            title: {
                type: "string",
                required: true,
                validators: [{ minLength: 5, maxLength: 100 }],
            },
            description: {
                type: "string",
                required: true,
                validators: [{ minLength: 50, maxLength: 5000 }],
            },
            salaryMin: {
                type: "number",
                required: true,
                validators: [{ min: 0, integer: true }],
            },
            salaryMax: {
                type: "number",
                required: true,
                validators: [{ min: 0, integer: true }],
            },
            location: {
                type: "string",
                required: true,
                validators: [{ minLength: 2, maxLength: 100 }],
            },
            employmentType: {
                type: "enum",
                required: true,
                options: ["full-time", "part-time", "contract", "internship"],
            },
        },
    };
}

module.exports = ValidationMiddleware;
