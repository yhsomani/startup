/**
 * Job Service Validation Middleware
 * Integrates Joi validation with error handling
 */

const { validate } = require('../../../shared/validation');
const { AppError, ValidationError } = require('../../../shared/error-handler');

const jobValidationMiddleware = {
  // Create job validation
  createJob: validate('job', 'create', 'body'),
  
  // Update job validation
  updateJob: validate('job', 'update', 'body'),
  
  // Search jobs validation
  searchJobs: validate('job', 'search', 'query'),
  
  // Apply for job validation
  applyForJob: validate('job', 'apply', 'body'),
  
  // Get job validation
  getJob: validate('job', 'get', 'params')
};

module.exports = jobValidationMiddleware;