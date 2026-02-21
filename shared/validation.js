/**
 * Shared Validation Module
 * 
 * Common validation schemas and utilities for all services
 * Provides Joi schemas and validation functions for API validation
 */

const Joi = require('joi');
const Logger = require('./logger');

// Common validation patterns (Regex)
const regexPatterns = {
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  url: /^https?:\/\/.+/,
  name: /^[a-zA-Z\s'-]{2,100}$/,
  title: /^[a-zA-Z0-9\s.'`]{2,200}$/,
  description: /^.{1,2000}$/,
  address: /^.{5,200}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  number: /^[0-9]+(\.[0-9]+)?$/,
  boolean: /^(true|false)$/i,
  array: /^(\[.*\]|\{.*\})$/,
  object: /^\{.*\}$/,
  mongoObjectId: /^[0-9a-fA-F]{24}$/,
  base64: /^[A-Za-z0-9+/]*={0,2}$/,
  coordinate: /^-?\d+\.?\d*$/,
};

// Joi Schemas wrapping regex
const patterns = {
  uuid: Joi.string().pattern(regexPatterns.uuid),
  email: Joi.string().email(), // Use Joi's built-in email validator
  password: Joi.string().pattern(regexPatterns.password).message('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'),
  phone: Joi.string().pattern(regexPatterns.phone),
  url: Joi.string().uri(), // Use Joi's built-in URI validator
  name: Joi.string().pattern(regexPatterns.name),
  title: Joi.string().pattern(regexPatterns.title),
  description: Joi.string().pattern(regexPatterns.description),
  address: Joi.string().pattern(regexPatterns.address),
  date: Joi.date().iso(), // Use Joi's date validator
  number: Joi.number(),
  boolean: Joi.boolean(),
  array: Joi.array(),
  object: Joi.object(),
  mongoObjectId: Joi.string().pattern(regexPatterns.mongoObjectId),
  base64: Joi.string().pattern(regexPatterns.base64),
  coordinate: Joi.number(), // Coordinate should be number
};

// Create validation schemas
const schemas = {
  // User validation schemas
  user: {
    register: Joi.object({
      name: patterns.name.required().min(2).max(100),
      email: patterns.email.required(),
      password: patterns.password.required().min(8),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
      role: Joi.string().valid('STUDENT', 'INSTRUCTOR', 'ADMIN', 'RECRUITER').default('STUDENT'),
      phone: patterns.phone.optional(),
      bio: patterns.description.max(500),
      skills: Joi.array().items(
        Joi.object({
          name: patterns.name.required(),
          level: Joi.string().valid('beginner', 'intermediate', 'expert', 'senior'),
          yearsOfExperience: Joi.number().min(0).max(50),
        })
      ),
      education: Joi.array().items(
        Joi.object({
          institution: patterns.name.required(),
          degree: patterns.name.required(),
          field: patterns.name.required(),
          startDate: patterns.date.required(),
          endDate: patterns.date.optional(),
          gpa: patterns.number.min(0).max(4.0),
          graduated: Joi.boolean().default(false),
        })
      ),
      experience: Joi.array().items(
        Joi.object({
          company: patterns.name.required(),
          position: patterns.name.required(),
          startDate: patterns.date.required(),
          endDate: patterns.date.optional(),
          current: Joi.boolean().default(false),
          description: patterns.description.optional(),
          achievements: Joi.array().items(
            Joi.object({
              title: patterns.name.required(),
              date: patterns.date.required(),
              description: patterns.description.required(),
              type: Joi.string().valid('certification', 'promotion', 'award', 'milestone', 'other'),
            })
          ),
        })
      ),
      socialLinks: Joi.array().items(
        Joi.object({
          platform: Joi.string().valid('linkedin', 'github', 'twitter', 'portfolio', 'website'),
          url: patterns.url.required(),
        })
      ),
      location: Joi.object({
        address: patterns.address.required(),
        city: patterns.name.required(),
        state: patterns.name.required(),
        country: patterns.name.required().length(2), // Removed .max(2) as length implies exact
        coordinates: patterns.coordinate.optional(), // coordinate is Joi.number
      }),
      preferences: Joi.object({
        language: patterns.name.required().default('en'),
        timezone: patterns.name.optional(),
        notifications: {
          email: Joi.boolean().default(true),
          push: Joi.boolean().default(true),
          sms: Joi.boolean().default(false),
          desktop: Joi.boolean().default(false),
        },
      }),
      availability: Joi.object({
        seeking: Joi.boolean().default(false),
      }),
    }),
  },

  login: {
    email: patterns.email.required(),
    password: patterns.password.required(),
    rememberMe: Joi.boolean().default(false),
  },

  profile: {
    title: patterns.name.optional(),
    summary: patterns.description.max(500),
    headline: patterns.name.max(100),
    location: patterns.object.optional(),
    website: patterns.url.optional(),
    linkedin: patterns.url.optional(),
    github: patterns.url.optional(),
    twitter: patterns.url.optional(),
    portfolio: patterns.url.optional(),
    experience: Joi.array().items(
      Joi.object({
        company: patterns.name.required(),
        position: patterns.name.required(),
        startDate: patterns.date.required(),
        endDate: patterns.date.optional(),
        description: patterns.description.optional(),
        skills: Joi.array().items(Joi.string()).optional(),
        achievements: Joi.array().items(
          Joi.object({
            title: patterns.name.required(),
            date: patterns.date.required(),
            description: patterns.description.required(),
            type: Joi.string().valid('certification', 'promotion', 'award', 'milestone', 'other'),
          })
        ),
      }),
    ),
  },

  // Job validation schemas
  job: {
    create: Joi.object({
      title: patterns.name.required().max(100),
      description: patterns.description.max(2000),
      company: Joi.object({
        name: patterns.name.required().max(100),
        industry: patterns.name.required(),
        size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise'),
        website: patterns.url.optional(),
        logo: patterns.url.optional(),
      }),
      type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship', 'freelance', 'volunteer'),
      location: Joi.object({
        address: patterns.address.required(),
        city: patterns.name.required(),
        state: patterns.name.required().length(2),
        country: patterns.name.required().length(2),
        coordinates: patterns.coordinate.optional(),
        remote: Joi.boolean().default(false),
      }),
      salary: patterns.number.min(0).max(1000000),
      currency: patterns.name.required().length(3),
      range: Joi.object({
        min: patterns.number.min(0),
        max: patterns.number.max(1000000),
      }),
      requirements: Joi.array().items(
        Joi.object({
          title: patterns.name.required(),
          description: patterns.description.required(),
          type: Joi.string().required(),
          years: Joi.number().min(0).max(50),
        }),
      ),
      skills: Joi.array().items(
        Joi.object({
          name: patterns.name.required(),
          level: Joi.string().valid('beginner', 'intermediate', 'expert', 'senior'),
          required: Joi.boolean().default(false),
        })
      ),
      benefits: Joi.array().items(
        Joi.string().required(),
      ),
      applicationDeadline: patterns.date.optional(),
    }),
  },

  // Company validation schemas
  company: {
    create: Joi.object({
      name: patterns.name.required().min(2).max(100),
      description: patterns.description.max(1000),
      website: patterns.url.required(),
      industry: patterns.name.required(),
    }),
  }
};

/**
 * Validate data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema (e.g., schemas.user.register)
 * @returns {Object} - { value, error }
 */
const validate = (data, schema) => {
  if (!schema) {
    throw new Error('Schema is required for validation');
  }

  const { value, error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorDetails = error.details.map(detail => ({
      message: detail.message,
      path: detail.path.join('.'),
      type: detail.type,
    }));

    return {
      isValid: false,
      errors: errorDetails,
    };
  }

  return {
    isValid: true,
    value,
  };
};

module.exports = {
  patterns: regexPatterns, // Export generic regex patterns as expected by other modules
  validatorPatterns: patterns, // Export Joi schemas for use in other Joi definitions
  schemas,
  validate,
};