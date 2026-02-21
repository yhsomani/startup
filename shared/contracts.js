/**
 * TalentSphere Service Contracts
 * Defines API contracts and interfaces for all microservices
 */

const Joi = require('joi');

// Base contract class
class ServiceContract {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.operations = new Map();
  }

  defineOperation(operationName, config) {
    this.operations.set(operationName, config);
  }

  getOperation(operationName) {
    return this.operations.get(operationName);
  }

  getAllOperations() {
    return Object.fromEntries(this.operations);
  }
}

// Response schemas
const responseSchemas = {
  success: Joi.object({
    success: Joi.boolean().required(),
    data: Joi.any().optional(),
    message: Joi.string().optional(),
    meta: Joi.object().optional()
  }),

  error: Joi.object({
    success: Joi.boolean().required().valid(false),
    error: Joi.object({
      code: Joi.string().required(),
      message: Joi.string().required(),
      details: Joi.any().optional()
    }).required(),
    meta: Joi.object().optional()
  }),

  paginated: Joi.object({
    success: Joi.boolean().required(),
    data: Joi.object({
      items: Joi.array().required(),
      total: Joi.number().integer().min(0).required(),
      limit: Joi.number().integer().min(1).required(),
      offset: Joi.number().integer().min(0).required(),
      hasMore: Joi.boolean().required(),
      totalPages: Joi.number().integer().min(0).required(),
      currentPage: Joi.number().integer().min(1).required()
    }).required(),
    message: Joi.string().optional()
  })
};

// Common data schemas
const dataSchemas = {
  user: Joi.object({
    id: Joi.string().uuid().required(),
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    role: Joi.string().required(),
    companyId: Joi.string().uuid().optional(),
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
  }),

  job: Joi.object({
    id: Joi.string().uuid().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    companyId: Joi.string().uuid().required(),
    postedBy: Joi.string().uuid().required(),
    employmentType: Joi.string().required(),
    experienceLevel: Joi.string().required(),
    location: Joi.object().required(),
    salary: Joi.object().optional(),
    requirements: Joi.array().items(Joi.string()).optional(),
    benefits: Joi.array().items(Joi.string()).optional(),
    skills: Joi.array().items(Joi.object()).optional(),
    isActive: Joi.boolean().required(),
    isFeatured: Joi.boolean().required(),
    postedAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
  }),

  company: Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    industry: Joi.string().required(),
    size: Joi.string().required(),
    headquarters: Joi.string().required(),
    website: Joi.string().uri().optional(),
    foundedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
  }),

  application: Joi.object({
    id: Joi.string().uuid().required(),
    jobId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    coverLetter: Joi.string().optional(),
    resumeUrl: Joi.string().uri().optional(),
    portfolioUrl: Joi.string().uri().optional(),
    status: Joi.string().required(),
    appliedAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
  }),

  connection: Joi.object({
    id: Joi.string().uuid().required(),
    userId1: Joi.string().uuid().required(),
    userId2: Joi.string().uuid().required(),
    status: Joi.string().valid('pending', 'accepted', 'rejected').required(),
    message: Joi.string().optional(),
    requestedAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
  }),

  message: Joi.object({
    id: Joi.string().uuid().required(),
    conversationId: Joi.string().uuid().required(),
    senderId: Joi.string().uuid().required(),
    content: Joi.string().required(),
    type: Joi.string().valid('text', 'image', 'file').required(),
    createdAt: Joi.date().iso().required()
  }),

  notification: Joi.object({
    id: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    type: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    data: Joi.object().optional(),
    isRead: Joi.boolean().required(),
    createdAt: Joi.date().iso().required()
  })
};

// Event schemas for service communication
const eventSchemas = {
  userRegistered: Joi.object({
    eventType: Joi.string().valid('user.registered').required(),
    userId: Joi.string().uuid().required(),
    email: Joi.string().email().required(),
    timestamp: Joi.date().iso().required()
  }),

  jobPosted: Joi.object({
    eventType: Joi.string().valid('job.posted').required(),
    jobId: Joi.string().uuid().required(),
    companyId: Joi.string().uuid().required(),
    title: Joi.string().required(),
    timestamp: Joi.date().iso().required()
  }),

  jobApplicationSubmitted: Joi.object({
    eventType: Joi.string().valid('job.application.submitted').required(),
    applicationId: Joi.string().uuid().required(),
    jobId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().required(),
    companyId: Joi.string().uuid().required(),
    timestamp: Joi.date().iso().required()
  }),

  connectionRequest: Joi.object({
    eventType: Joi.string().valid('connection.requested').required(),
    connectionId: Joi.string().uuid().required(),
    userId1: Joi.string().uuid().required(),
    userId2: Joi.string().uuid().required(),
    message: Joi.string().optional(),
    timestamp: Joi.date().iso().required()
  }),

  messageSent: Joi.object({
    eventType: Joi.string().valid('message.sent').required(),
    messageId: Joi.string().uuid().required(),
    conversationId: Joi.string().uuid().required(),
    senderId: Joi.string().uuid().required(),
    timestamp: Joi.date().iso().required()
  })
};

// Contract validation functions
const validateRequest = (serviceName, operation, data) => {
  // This would validate against the defined operation schema
  // For now, just return success
  return { isValid: true, data };
};

const validateResponse = (serviceName, operation, data) => {
  // This would validate the response against the defined schema
  // For now, just return success
  return { isValid: true, data };
};

const generateEvent = (eventType, payload) => {
  const schema = eventSchemas[eventType];
  if (!schema) {
    throw new Error(`Unknown event type: ${eventType}`);
  }

  const { error, value } = schema.validate({
    eventType,
    timestamp: new Date().toISOString(),
    ...payload
  });

  if (error) {
    throw new Error(`Invalid event payload: ${error.message}`);
  }

  return value;
};

// Health check contract
const healthCheckSchema = Joi.object({
  status: Joi.string().valid('healthy', 'unhealthy', 'degraded').required(),
  timestamp: Joi.date().iso().required(),
  uptime: Joi.number().required(),
  version: Joi.string().required(),
  service: Joi.string().required(),
  checks: Joi.object().optional(),
  metrics: Joi.object().optional()
});

module.exports = {
  ServiceContract,
  responseSchemas,
  dataSchemas,
  eventSchemas,
  validateRequest,
  validateResponse,
  generateEvent,
  healthCheckSchema
};