/**
 * Job Service Validation Schemas
 * Comprehensive validation rules for job-related operations
 */

const { Joi } = require('joi');

// Job validation schemas
const jobValidationSchemas = {
  // Create job validation
  createJob: Joi.object({
    title: Joi.string()
      .min(5)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Job title is required',
        'string.min': 'Job title must be at least 5 characters',
        'string.max': 'Job title cannot exceed 255 characters'
      }),
    
    description: Joi.string()
      .min(50)
      .max(10000)
      .required()
      .messages({
        'string.empty': 'Job description is required',
        'string.min': 'Job description must be at least 50 characters',
        'string.max': 'Job description cannot exceed 10,000 characters'
      }),
    
    companyId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': 'Company ID is required',
        'string.guid': 'Company ID must be a valid UUID'
      }),
    
    location: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.empty': 'Location is required',
        'string.min': 'Location must be at least 3 characters',
        'string.max': 'Location cannot exceed 255 characters'
      }),
    
    employmentType: Joi.string()
      .valid('full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary')
      .default('full-time')
      .messages({
        'any.only': 'Employment type must be one of: full-time, part-time, contract, internship, freelance, temporary'
      }),
    
    experienceLevel: Joi.string()
      .valid('entry', 'junior', 'mid', 'senior', 'executive')
      .default('mid')
      .messages({
        'any.only': 'Experience level must be one of: entry, junior, mid, senior, executive'
      }),
    
    remoteType: Joi.string()
      .valid('onsite', 'remote', 'hybrid')
      .default('onsite')
      .messages({
        'any.only': 'Remote type must be one of: onsite, remote, hybrid'
      }),
    
    salary: Joi.object({
      min: Joi.number()
        .min(0)
        .max(10000000)
        .messages({
          'number.min': 'Minimum salary cannot be negative',
          'number.max': 'Salary cannot exceed 10,000,000'
        }),
      
      max: Joi.number()
        .min(0)
        .max(10000000)
        .messages({
          'number.min': 'Maximum salary cannot be negative', 
          'number.max': 'Salary cannot exceed 10,000,000'
        }),
      
      currency: Joi.string()
        .valid('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD')
        .default('USD')
        .messages({
          'any.only': 'Currency must be one of: USD, EUR, GBP, JPY, CAD, AUD'
        })
    }).optional(),
    
    requirements: Joi.array()
      .items(Joi.string().min(5).max(500))
      .max(20)
      .default([])
      .messages({
        'array.max': 'Cannot have more than 20 requirements'
      }),
    
    responsibilities: Joi.array()
      .items(Joi.string().min(5).max(500))
      .max(20)
      .default([])
      .messages({
        'array.max': 'Cannot have more than 20 responsibilities'
      }),
    
    benefits: Joi.array()
      .items(Joi.string().min(3).max(200))
      .max(15)
      .default([])
      .messages({
        'array.max': 'Cannot have more than 15 benefits'
      }),
    
    skills: Joi.array()
      .items(
        Joi.object({
          name: Joi.string()
            .min(2)
            .max(100)
            .required()
            .messages({
              'string.empty': 'Skill name is required',
              'string.min': 'Skill name must be at least 2 characters',
              'string.max': 'Skill name cannot exceed 100 characters'
            }),
          
          level: Joi.string()
            .valid('required', 'preferred')
            .default('required')
            .messages({
              'any.only': 'Skill level must be either required or preferred'
            }),
          
          years: Joi.number()
            .min(0)
            .max(50)
            .messages({
              'number.min': 'Years of experience cannot be negative',
              'number.max': 'Years of experience cannot exceed 50'
            })
        })
      )
      .max(15)
      .default([])
      .messages({
        'array.max': 'Cannot have more than 15 skills'
      }),
    
    deadline: Joi.date()
      .min('now')
      .max('+1y')
      .optional()
      .messages({
        'date.min': 'Deadline cannot be in the past',
        'date.max': 'Deadline cannot be more than 1 year from now'
      }),
    
    isActive: Joi.boolean()
      .default(true),
    
    isFeatured: Joi.boolean()
      .default(false)
  }),

  // Update job validation
  updateJob: Joi.object({
    title: Joi.string()
      .min(5)
      .max(255)
      .optional(),
    
    description: Joi.string()
      .min(50)
      .max(10000)
      .optional(),
    
    location: Joi.string()
      .min(3)
      .max(255)
      .optional(),
    
    employmentType: Joi.string()
      .valid('full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary')
      .optional(),
    
    experienceLevel: Joi.string()
      .valid('entry', 'junior', 'mid', 'senior', 'executive')
      .optional(),
    
    remoteType: Joi.string()
      .valid('onsite', 'remote', 'hybrid')
      .optional(),
    
    salary: Joi.object({
      min: Joi.number().min(0).max(10000000).optional(),
      max: Joi.number().min(0).max(10000000).optional(),
      currency: Joi.string().valid('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD').optional()
    }).optional(),
    
    requirements: Joi.array()
      .items(Joi.string().min(5).max(500))
      .max(20)
      .optional(),
    
    responsibilities: Joi.array()
      .items(Joi.string().min(5).max(500))
      .max(20)
      .optional(),
    
    benefits: Joi.array()
      .items(Joi.string().min(3).max(200))
      .max(15)
      .optional(),
    
    skills: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(2).max(100).required(),
          level: Joi.string().valid('required', 'preferred').default('required'),
          years: Joi.number().min(0).max(50).optional()
        })
      )
      .max(15)
      .optional(),
    
    deadline: Joi.date()
      .min('now')
      .max('+1y')
      .optional(),
    
    isActive: Joi.boolean().optional(),
    
    isFeatured: Joi.boolean().optional()
  }),

  // Job search validation
  searchJobs: Joi.object({
    q: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Search query must be at least 2 characters',
        'string.max': 'Search query cannot exceed 100 characters'
      }),
    
    location: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    
    employmentType: Joi.string()
      .valid('full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary', 'remote')
      .optional(),
    
    experienceLevel: Joi.string()
      .valid('entry', 'junior', 'mid', 'senior', 'executive')
      .optional(),
    
    salaryMin: Joi.number()
      .min(0)
      .max(10000000)
      .optional()
      .messages({
        'number.min': 'Minimum salary cannot be negative',
        'number.max': 'Salary cannot exceed 10,000,000'
      }),
    
    salaryMax: Joi.number()
      .min(0)
      .max(10000000)
      .optional()
      .when('salaryMin', {
        is: true,
        then: Joi.number().min(Joi.ref('salaryMin')),
        otherwise: Joi.number()
      })
      .messages({
        'number.min': 'Maximum salary must be greater than minimum salary'
      }),
    
    skills: Joi.array()
      .items(Joi.string().min(2).max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot filter by more than 10 skills'
      }),
    
    company: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    
    postedWithin: Joi.string()
      .valid('24h', '7d', '30d', '90d')
      .optional(),
    
    limit: Joi.number()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    
    offset: Joi.number()
      .min(0)
      .default(0)
      .messages({
        'number.min': 'Offset cannot be negative'
      }),
    
    sortBy: Joi.string()
      .valid('relevance', 'posted', 'salary', 'company')
      .default('posted')
      .optional()
  }),

  // Job application validation
  applyForJob: Joi.object({
    coverLetter: Joi.string()
      .max(5000)
      .optional()
      .messages({
        'string.max': 'Cover letter cannot exceed 5,000 characters'
      }),
    
    resumeUrl: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Resume URL must be a valid URL'
      }),
    
    portfolioUrl: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Portfolio URL must be a valid URL'
      }),
    
    linkedinUrl: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'LinkedIn URL must be a valid URL'
      }),
    
    githubUrl: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'GitHub URL must be a valid URL'
      }),
    
    expectedSalary: Joi.number()
      .min(0)
      .max(10000000)
      .optional()
      .messages({
        'number.min': 'Expected salary cannot be negative',
        'number.max': 'Expected salary cannot exceed 10,000,000'
      }),
    
    currentSalary: Joi.number()
      .min(0)
      .max(10000000)
      .optional()
      .messages({
        'number.min': 'Current salary cannot be negative',
        'number.max': 'Current salary cannot exceed 10,000,000'
      }),
    
    noticePeriod: Joi.string()
      .valid('immediate', '1_week', '2_weeks', '1_month', '2_months', '3_months')
      .optional()
      .messages({
        'any.only': 'Notice period must be one of: immediate, 1_week, 2_weeks, 1_month, 2_months, 3_months'
      }),
    
    workAuthorization: Joi.string()
      .valid('citizen', 'work_visa', 'student_visa', 'permanent_resident', 'other')
      .optional()
      .messages({
        'any.only': 'Work authorization must be one of: citizen, work_visa, student_visa, permanent_resident, other'
      })
  }),

  // Get job validation
  getJob: Joi.object({
    include: Joi.array()
      .items(
        Joi.string().valid('company', 'applications', 'analytics')
      )
      .max(3)
      .default([])
      .messages({
        'array.max': 'Cannot include more than 3 additional data types'
      })
  }),

  // Parameters validation
  jobId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.empty': 'Job ID is required',
      'string.guid': 'Job ID must be a valid UUID'
    }),

  companyId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.empty': 'Company ID is required',
      'string.guid': 'Company ID must be a valid UUID'
    }),

  userId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'User ID must be a valid UUID'
    })
};

// Validation middleware factory
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: validationErrors
        }
      });
    }

    req.validated = value;
    next();
  };
}

module.exports = {
  jobValidationSchemas,
  validate
};