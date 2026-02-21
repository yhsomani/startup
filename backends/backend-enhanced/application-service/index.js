/**
 * Application Service with Distributed Tracing Integration
 * Complete job application management service with workflow and analytics
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../../shared/validation');
const { ServiceContract } = require('../../../shared/contracts');
const { createLogger } = require('../../../shared/logger');
const { ErrorFactory } = require('../../../shared/error-factory');
const jwt = require('jsonwebtoken');

class ApplicationService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'application-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.APPLICATION_PORT || 3005,
      tracing: {
        enabled: true,
        samplingRate: 1.0
      },
      validation: {
        strict: true,
        autoValidate: true
      },
      circuitBreaker: {
        timeout: 5000,
        maxFailures: 3,
        resetTimeout: 30000
      },
      errorRecovery: {
        maxRetries: 3,
        baseDelay: 1000
      }
    });

    // Initialize logger
    this.logger = createLogger('ApplicationService');
    
    // Get JWT secret from secure storage
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    // Application-specific state
    this.applications = new Map(); // In-memory storage for demo
    this.applicationWorkflows = new Map();
    this.interviewSchedules = new Map();
    this.applicationAnalytics = new Map();
    this.emailTemplates = new Map();
    
    // Initialize service contracts
    this.initializeContracts();
    
    // Create Express app with tracing middleware
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();
    
    // Seed demo data
    this.seedDemoData();
  }

  initializeContracts() {
    // Define service contracts for validation
    this.serviceContract = new ServiceContract('application-service');
    
    // Job application schema
    this.serviceContract.defineOperation('submitApplication', {
      inputSchema: {
        type: 'object',
        required: ['jobId', 'userId', 'resumeUrl'],
        properties: {
          jobId: { type: 'string' },
          userId: { type: 'string' },
          coverLetter: { type: 'string', maxLength: 2000 },
          resumeUrl: { type: 'string', format: 'uri' },
          portfolioUrl: { type: 'string', format: 'uri' },
          githubUrl: { type: 'string', format: 'uri' },
          linkedinUrl: { type: 'string', format: 'uri' },
          salaryExpectation: {
            type: 'object',
            properties: {
              min: { type: 'number', minimum: 0 },
              max: { type: 'number', minimum: 0 },
              currency: { type: 'string', default: 'USD' },
              period: { 
                type: 'string', 
                enum: ['hourly', 'monthly', 'yearly'],
                default: 'yearly'
              }
            }
          },
          availability: {
            type: 'string',
            enum: ['immediately', '2-weeks', '1-month', '2-months', 'negotiable']
          },
          relocation: {
            type: 'string',
            enum: ['willing', 'not-willing', 'negotiable']
          },
          customQuestions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                question: { type: 'string' },
                answer: { type: 'string' }
              }
            }
          },
          source: {
            type: 'string',
            enum: ['job-board', 'company-website', 'referral', 'linkedin', 'indeed', 'other'],
            default: 'job-board'
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              application: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  jobId: { type: 'string' },
                  userId: { type: 'string' },
                  status: { type: 'string' },
                  submittedAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    });

    // Application update schema
    this.serviceContract.defineOperation('updateApplicationStatus', {
      inputSchema: {
        type: 'object',
        required: ['applicationId', 'status', 'updatedBy'],
        properties: {
          applicationId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['submitted', 'under-review', 'screening', 'interview', 'technical', 'final-interview', 'offered', 'accepted', 'rejected', 'withdrawn']
          },
          updatedBy: { type: 'string' },
          notes: { type: 'string', maxLength: 1000 },
          nextSteps: { type: 'string', maxLength: 500 },
          rejectionReason: {
            type: 'string',
            enum: ['not-qualified', 'overqualified', 'culture-fit', 'salary', 'position-filled', 'other']
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              application: { type: 'object' }
            }
          }
        }
      }
    });
  }

  // JWT Authentication middleware
  authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization header required'
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token format should be: Bearer <token>'
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    }

    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired'
          },
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          }
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token'
          },
          meta: {
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_VALIDATION_ERROR',
          message: 'Token validation failed'
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Distributed tracing middleware
    this.app.use(this.getTracingMiddleware());

    // Request context middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.correlationId = req.headers['x-correlation-id'] || req.traceId || uuidv4();
      
      res.setHeader('x-request-id', req.requestId);
      res.setHeader('x-correlation-id', req.correlationId);
      res.setHeader('x-service', this.config.serviceName);
      
      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('application.health', req.traceContext) : null;
      
      if (span) {
        span.setTag('component', 'application-service');
        span.setTag('health.check.type', 'service');
      }

      try {
        const health = await this.getServiceHealth();
        
        if (span) {
          span.setTag('health.status', 'healthy');
          span.finish();
        }

        res.json(health);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      const span = this.tracer ? this.tracer.startSpan('application.metrics', req.traceContext) : null;
      
      try {
        const metrics = this.getTracingMetrics();
        
        if (span) {
          span.finish();
        }

        res.json(metrics);
      } catch (error) {
        if (span) {
          span.logError(error);
          span.finish();
        }
        
        res.status(500).json({ error: error.message });
      }
    });

    // Application management (all protected)
    this.app.post('/applications', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.submitApplication', {
        inputSchema: this.serviceContract.getOperationSchema('submitApplication')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('submitApplication')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.get('/applications/:applicationId', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getApplication', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/applications/:applicationId/status', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.updateApplicationStatus', {
        inputSchema: this.serviceContract.getOperationSchema('updateApplicationStatus')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('updateApplicationStatus')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.get('/applications', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getApplications', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Job applications
    this.app.get('/jobs/:jobId/applications', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getJobApplications', {
        validateInput: false,
        validateOutput: false
      });
    });

    // User applications
    this.app.get('/users/:userId/applications', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getUserApplications', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Interview management
    this.app.post('/applications/:applicationId/interviews', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.scheduleInterview', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/applications/:applicationId/interviews', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getInterviews', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/interviews/:interviewId', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.updateInterview', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Workflow management
    this.app.get('/applications/:applicationId/workflow', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getWorkflow', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Application analytics
    this.app.get('/analytics/applications', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getApplicationAnalytics', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/jobs/:jobId/analytics', this.authenticateJWT, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'application.getJobAnalytics', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      const span = this.tracer ? this.tracer.getActiveSpans().find(s => s.getContext().spanId === req.traceContext?.spanId) : null;
      
      if (span) {
        span.logError(error);
        span.finish();
      }

      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        correlationId: req.correlationId,
        service: this.config.serviceName
      });

      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An internal error occurred'
        },
        meta: {
          requestId: req.requestId,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          service: this.config.serviceName
        }
      });
    });
  }

  // Operation implementations
  async executeOperation(request, options) {
    const operationName = options.operationName || 'unknown';
    
    try {
      switch (operationName) {
        case 'application.createJob':
          return await this.createApplication(request.validated);
        case 'application.updateStatus':
          return await this.updateApplicationStatus(request.validated);
        case 'application.submitApplication':
          return await this.submitApplication(request.validated);
        case 'application.getApplications':
          return await this.getUserApplications(request.validated);
        default:
          throw new Error(`Unknown operation: ${operationName}`);
      }
    } catch (error) {
      // Convert to AppError and log
      const appError = ErrorFactory.fromUnknownError(error, {
        requestId: request.requestId,
        correlationId: request.correlationId,
        serviceName: this.config.serviceName,
        url: request.url,
        method: request.method
      });

      this.logger.error('Operation failed', {
        error: appError.message,
        operation: operationName,
        stack: appError.stack
      });

      throw appError;
    }
  }
  }

  async submitApplication(applicationData) {
    return this.executeWithTracing('application.submitApplication.process', async () => {
      // Validate job and user exist
      await this.validateJobAndUser(applicationData.jobId, applicationData.userId);

      // Check if user has already applied
      const existingApplication = Array.from(this.applications.values())
        .find(app => app.jobId === applicationData.jobId && app.userId === applicationData.userId);
      
      if (existingApplication) {
        throw new Error('You have already applied for this job');
      }

      const application = {
        id: uuidv4(),
        jobId: applicationData.jobId,
        userId: applicationData.userId,
        coverLetter: applicationData.coverLetter || null,
        resumeUrl: applicationData.resumeUrl,
        portfolioUrl: applicationData.portfolioUrl || null,
        githubUrl: applicationData.githubUrl || null,
        linkedinUrl: applicationData.linkedinUrl || null,
        salaryExpectation: applicationData.salaryExpectation || null,
        availability: applicationData.availability || 'immediately',
        relocation: applicationData.relocation || 'negotiable',
        customQuestions: applicationData.customQuestions || [],
        source: applicationData.source || 'job-board',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
        nextStep: 'screening',
        isArchived: false
      };

      this.applications.set(application.id, application);

      // Initialize workflow
      const workflow = {
        applicationId: application.id,
        currentStage: 'submitted',
        stages: [
          {
            name: 'submitted',
            status: 'completed',
            completedAt: application.submittedAt,
            notes: 'Application submitted successfully'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.applicationWorkflows.set(application.id, workflow);

      // Initialize analytics
      const analytics = {
        applicationId: application.id,
        jobId: applicationData.jobId,
        userId: applicationData.userId,
        source: applicationData.source,
        submissionTime: application.submittedAt,
        statusChanges: [
          {
            from: null,
            to: 'submitted',
            timestamp: application.submittedAt,
            changedBy: 'system'
          }
        ],
        views: [],
        emails: [],
        interviews: [],
        createdAt: new Date().toISOString()
      };

      this.applicationAnalytics.set(application.id, analytics);

      // This would trigger notifications to the company
      // await this.notificationService.notifyNewApplication(application);

      return {
        application: {
          id: application.id,
          jobId: application.jobId,
          userId: application.userId,
          status: application.status,
          submittedAt: application.submittedAt
        }
      };
    });
  }

  async getApplication(applicationId) {
    return this.executeWithTracing('application.getApplication.process', async () => {
      const application = this.applications.get(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const workflow = this.applicationWorkflows.get(applicationId);
      const analytics = this.applicationAnalytics.get(applicationId);
      const interviews = Array.from(this.interviewSchedules.values())
        .filter(i => i.applicationId === applicationId);

      return {
        application,
        workflow,
        analytics,
        interviews
      };
    });
  }

  async updateApplicationStatus(applicationId, statusUpdate) {
    return this.executeWithTracing('application.updateApplicationStatus.process', async () => {
      const application = this.applications.get(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Validate status transition
      this.validateStatusTransition(application.status, statusUpdate.status);

      // Update application
      const previousStatus = application.status;
      application.status = statusUpdate.status;
      application.lastUpdated = new Date().toISOString();
      
      if (statusUpdate.notes) {
        application.notes = statusUpdate.notes;
      }
      
      if (statusUpdate.nextSteps) {
        application.nextStep = statusUpdate.nextSteps;
      }
      
      if (statusUpdate.rejectionReason && statusUpdate.status === 'rejected') {
        application.rejectionReason = statusUpdate.rejectionReason;
      }

      this.applications.set(applicationId, application);

      // Update workflow
      const workflow = this.applicationWorkflows.get(applicationId) || {
        applicationId,
        currentStage: statusUpdate.status,
        stages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      workflow.stages.push({
        name: statusUpdate.status,
        status: 'completed',
        completedAt: new Date().toISOString(),
        notes: statusUpdate.notes || `Status changed from ${previousStatus} to ${statusUpdate.status}`,
        completedBy: statusUpdate.updatedBy
      });

      workflow.currentStage = statusUpdate.status;
      workflow.updatedAt = new Date().toISOString();
      this.applicationWorkflows.set(applicationId, workflow);

      // Update analytics
      const analytics = this.applicationAnalytics.get(applicationId);
      if (analytics) {
        analytics.statusChanges.push({
          from: previousStatus,
          to: statusUpdate.status,
          timestamp: new Date().toISOString(),
          changedBy: statusUpdate.updatedBy,
          notes: statusUpdate.notes
        });
        analytics.updatedAt = new Date().toISOString();
      }

      // This would trigger notifications to the user
      // await this.notificationService.notifyStatusChange(application, previousStatus, statusUpdate.status);

      return {
        application: {
          ...application,
          workflow,
          analytics
        }
      };
    });
  }

  async getApplications(query) {
    return this.executeWithTracing('application.getApplications.process', async () => {
      const { 
        status, 
        jobId, 
        userId, 
        companyId,
        dateFrom, 
        dateTo, 
        limit = 20, 
        offset = 0,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
      } = query;

      let applications = Array.from(this.applications.values());

      // Filter by status
      if (status) {
        const statusList = Array.isArray(status) ? status : [status];
        applications = applications.filter(app => statusList.includes(app.status));
      }

      // Filter by job
      if (jobId) {
        applications = applications.filter(app => app.jobId === jobId);
      }

      // Filter by user
      if (userId) {
        applications = applications.filter(app => app.userId === userId);
      }

      // Filter by date range
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        applications = applications.filter(app => new Date(app.submittedAt) >= fromDate);
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        applications = applications.filter(app => new Date(app.submittedAt) <= toDate);
      }

      // Sort applications
      applications.sort((a, b) => {
        const aValue = a[sortBy] || a.submittedAt;
        const bValue = b[sortBy] || b.submittedAt;
        const comparison = new Date(aValue) - new Date(bValue);
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Pagination
      const total = applications.length;
      const paginatedApplications = applications.slice(offset, offset + limit);

      // Include workflow and analytics
      const results = paginatedApplications.map(app => ({
        ...app,
        workflow: this.applicationWorkflows.get(app.id),
        analytics: this.applicationAnalytics.get(app.id)
      }));

      return {
        applications: results,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < total
      };
    });
  }

  async getJobApplications(jobId, query) {
    return this.executeWithTracing('application.getJobApplications.process', async () => {
      const { status, limit = 20, offset = 0 } = query;
      
      let applications = Array.from(this.applications.values())
        .filter(app => app.jobId === jobId);

      // Filter by status
      if (status) {
        const statusList = Array.isArray(status) ? status : [status];
        applications = applications.filter(app => statusList.includes(app.status));
      }

      // Sort by submission date
      applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      // Pagination
      const total = applications.length;
      const paginatedApplications = applications.slice(offset, offset + limit);

      // Include workflow and analytics
      const results = paginatedApplications.map(app => ({
        ...app,
        workflow: this.applicationWorkflows.get(app.id),
        analytics: this.applicationAnalytics.get(app.id)
      }));

      return {
        applications: results,
        jobId,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    });
  }

  async getUserApplications(userId, query) {
    return this.executeWithTracing('application.getUserApplications.process', async () => {
      const { status, limit = 20, offset = 0 } = query;
      
      let applications = Array.from(this.applications.values())
        .filter(app => app.userId === userId);

      // Filter by status
      if (status) {
        const statusList = Array.isArray(status) ? status : [status];
        applications = applications.filter(app => statusList.includes(app.status));
      }

      // Sort by submission date
      applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

      // Pagination
      const total = applications.length;
      const paginatedApplications = applications.slice(offset, offset + limit);

      // Include workflow and analytics
      const results = paginatedApplications.map(app => ({
        ...app,
        workflow: this.applicationWorkflows.get(app.id),
        analytics: this.applicationAnalytics.get(app.id)
      }));

      return {
        applications: results,
        userId,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    });
  }

  async scheduleInterview(applicationId, interviewData) {
    return this.executeWithTracing('application.scheduleInterview.process', async () => {
      const application = this.applications.get(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const interview = {
        id: uuidv4(),
        applicationId,
        type: interviewData.type || 'screening', // screening, technical, behavioral, final
        scheduledBy: interviewData.scheduledBy,
        scheduledFor: interviewData.scheduledFor, // userId
        interviewers: interviewData.interviewers || [], // Array of employer IDs
        startTime: interviewData.startTime,
        endTime: interviewData.endTime,
        location: {
          type: interviewData.location?.type || 'virtual', // virtual, in-person, phone
          url: interviewData.location?.url || null,
          address: interviewData.location?.address || null,
          phone: interviewData.location?.phone || null
        },
        status: 'scheduled',
        notes: interviewData.notes || null,
        preparation: interviewData.preparation || [],
        feedback: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.interviewSchedules.set(interview.id, interview);

      // Update application status if needed
      if (application.status === 'submitted' || application.status === 'under-review') {
        await this.updateApplicationStatus(applicationId, {
          status: 'interview',
          updatedBy: interviewData.scheduledBy,
          notes: `Interview scheduled for ${new Date(interview.startTime).toLocaleDateString()}`
        });
      }

      // Update analytics
      const analytics = this.applicationAnalytics.get(applicationId);
      if (analytics) {
        analytics.interviews.push({
          interviewId: interview.id,
          type: interview.type,
          scheduledAt: interview.createdAt,
          startTime: interview.startTime
        });
      }

      // This would trigger notifications to both parties
      // await this.notificationService.notifyInterviewScheduled(interview);

      return {
        interview: {
          id: interview.id,
          applicationId,
          type: interview.type,
          startTime: interview.startTime,
          endTime: interview.endTime,
          location: interview.location,
          status: interview.status
        }
      };
    });
  }

  async getInterviews(applicationId) {
    return this.executeWithTracing('application.getInterviews.process', async () => {
      const interviews = Array.from(this.interviewSchedules.values())
        .filter(i => i.applicationId === applicationId)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      return {
        interviews,
        applicationId,
        total: interviews.length
      };
    });
  }

  async updateInterview(interviewId, interviewUpdate) {
    return this.executeWithTracing('application.updateInterview.process', async () => {
      const interview = this.interviewSchedules.get(interviewId);
      if (!interview) {
        throw new Error('Interview not found');
      }

      const updatedInterview = {
        ...interview,
        ...interviewUpdate,
        updatedAt: new Date().toISOString()
      };

      this.interviewSchedules.set(interviewId, updatedInterview);

      return {
        interview: updatedInterview
      };
    });
  }

  async getApplicationWorkflow(applicationId) {
    return this.executeWithTracing('application.getWorkflow.process', async () => {
      const workflow = this.applicationWorkflows.get(applicationId);
      if (!workflow) {
        throw new Error('Application workflow not found');
      }

      return { workflow };
    });
  }

  async getApplicationAnalytics(query) {
    return this.executeWithTracing('application.getApplicationAnalytics.process', async () => {
      const { dateFrom, dateTo, jobId, userId, companyId } = query;
      
      let applications = Array.from(this.applications.values());

      // Apply filters
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        applications = applications.filter(app => new Date(app.submittedAt) >= fromDate);
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        applications = applications.filter(app => new Date(app.submittedAt) <= toDate);
      }

      if (jobId) {
        applications = applications.filter(app => app.jobId === jobId);
      }

      if (userId) {
        applications = applications.filter(app => app.userId === userId);
      }

      // Calculate analytics
      const totalApplications = applications.length;
      const statusBreakdown = {};
      const sourceBreakdown = {};
      const timeToHire = [];
      const applicationsByDay = {};

      applications.forEach(app => {
        // Status breakdown
        statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
        
        // Source breakdown
        sourceBreakdown[app.source] = (sourceBreakdown[app.source] || 0) + 1;
        
        // Applications by day
        const day = new Date(app.submittedAt).toISOString().split('T')[0];
        applicationsByDay[day] = (applicationsByDay[day] || 0) + 1;
        
        // Time to hire (for accepted applications)
        if (app.status === 'accepted' && app.submittedAt) {
          const analytics = this.applicationAnalytics.get(app.id);
          if (analytics && analytics.statusChanges.length > 0) {
            const submittedTime = new Date(app.submittedAt);
            const acceptedTime = new Date(
              analytics.statusChanges.find(c => c.to === 'accepted')?.timestamp || Date.now()
            );
            const daysToHire = Math.ceil((acceptedTime - submittedTime) / (1000 * 60 * 60 * 24));
            timeToHire.push(daysToHire);
          }
        }
      });

      const analytics = {
        overview: {
          totalApplications,
          averageTimeToHire: timeToHire.length > 0 ? 
            Math.round(timeToHire.reduce((a, b) => a + b, 0) / timeToHire.length) : 0,
          acceptanceRate: totalApplications > 0 ? 
            Math.round((statusBreakdown.accepted || 0) / totalApplications * 100) : 0
        },
        statusBreakdown,
        sourceBreakdown,
        applicationsByDay,
        topPerformingJobs: this.getTopPerformingJobs(applications),
        recentTrends: this.calculateRecentTrends(applications)
      };

      return {
        analytics,
        filters: {
          dateFrom,
          dateTo,
          jobId,
          userId,
          companyId
        },
        generatedAt: new Date().toISOString()
      };
    });
  }

  async getJobAnalytics(jobId) {
    return this.executeWithTracing('application.getJobAnalytics.process', async () => {
      const applications = Array.from(this.applications.values())
        .filter(app => app.jobId === jobId);

      if (applications.length === 0) {
        return {
          jobId,
          analytics: {
            totalApplications: 0,
            message: 'No applications found for this job'
          }
        };
      }

      const statusBreakdown = {};
      const sourceBreakdown = {};
      const applicationsByDay = {};
      let totalViews = 0;

      applications.forEach(app => {
        statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
        sourceBreakdown[app.source] = (sourceBreakdown[app.source] || 0) + 1;
        
        const day = new Date(app.submittedAt).toISOString().split('T')[0];
        applicationsByDay[day] = (applicationsByDay[day] || 0) + 1;
        
        // Count views from analytics
        const analytics = this.applicationAnalytics.get(app.id);
        if (analytics) {
          totalViews += analytics.views.length;
        }
      });

      const analytics = {
        overview: {
          totalApplications: applications.length,
          totalViews,
          conversionRate: totalViews > 0 ? Math.round((applications.length / totalViews) * 100) : 0,
          statusBreakdown,
          sourceBreakdown
        },
        timeline: applicationsByDay,
        performance: {
          averageTimeToFirstResponse: this.calculateAverageResponseTime(applications),
          screeningPassRate: this.calculateScreeningPassRate(applications),
          interviewRate: this.calculateInterviewRate(applications)
        }
      };

      return {
        jobId,
        analytics,
        generatedAt: new Date().toISOString()
      };
    });
  }

  // Helper methods
  async validateJobAndUser(jobId, userId) {
    // This would make calls to Job Service and User Service
    // For now, we'll assume they exist
    return true;
  }

  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'submitted': ['under-review', 'withdrawn'],
      'under-review': ['screening', 'rejected'],
      'screening': ['interview', 'rejected'],
      'interview': ['technical', 'final-interview', 'rejected'],
      'technical': ['final-interview', 'rejected'],
      'final-interview': ['offered', 'rejected'],
      'offered': ['accepted', 'rejected'],
      'accepted': [],
      'rejected': [],
      'withdrawn': []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  getTopPerformingJobs(applications) {
    const jobCounts = {};
    applications.forEach(app => {
      jobCounts[app.jobId] = (jobCounts[app.jobId] || 0) + 1;
    });

    return Object.entries(jobCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([jobId, count]) => ({ jobId, applicationCount: count }));
  }

  calculateRecentTrends(applications) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentApplications = applications.filter(app => new Date(app.submittedAt) >= thirtyDaysAgo);
    const previousApplications = applications.filter(app => 
      new Date(app.submittedAt) >= sixtyDaysAgo && new Date(app.submittedAt) < thirtyDaysAgo
    );

    const recentCount = recentApplications.length;
    const previousCount = previousApplications.length;
    const growthPercent = previousCount > 0 ? 
      Math.round(((recentCount - previousCount) / previousCount) * 100) : 0;

    return {
      recent: recentCount,
      previous: previousCount,
      growthPercent,
      trend: growthPercent >= 0 ? 'increasing' : 'decreasing'
    };
  }

  calculateAverageResponseTime(applications) {
    const responseTimes = applications
      .filter(app => {
        const analytics = this.applicationAnalytics.get(app.id);
        return analytics && analytics.statusChanges.some(c => c.to === 'under-review');
      })
      .map(app => {
        const analytics = this.applicationAnalytics.get(app.id);
        const submittedTime = new Date(app.submittedAt);
        const reviewTime = new Date(
          analytics.statusChanges.find(c => c.to === 'under-review')?.timestamp
        );
        return Math.ceil((reviewTime - submittedTime) / (1000 * 60 * 60)); // hours
      });

    return responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
  }

  calculateScreeningPassRate(applications) {
    const screenedApplications = applications.filter(app => 
      app.status === 'screening' || app.status === 'interview' || app.status === 'accepted'
    );
    const totalReviewed = applications.filter(app => 
      app.status !== 'submitted' && app.status !== 'under-review'
    );

    return totalReviewed.length > 0 ? 
      Math.round((screenedApplications.length / totalReviewed.length) * 100) : 0;
  }

  calculateInterviewRate(applications) {
    const interviewApplications = applications.filter(app => 
      app.status === 'interview' || app.status === 'technical' || app.status === 'final-interview' || app.status === 'offered' || app.status === 'accepted'
    );

    return applications.length > 0 ? 
      Math.round((interviewApplications.length / applications.length) * 100) : 0;
  }

  seedDemoData() {
    // Create demo applications
    const demoApplications = [
      {
        jobId: 'demo-job-1',
        userId: 'demo-user-1',
        coverLetter: 'I am very interested in this position and believe my skills align well with your requirements.',
        resumeUrl: 'https://example.com/resume1.pdf',
        portfolioUrl: 'https://example.com/portfolio1',
        githubUrl: 'https://github.com/user1',
        linkedinUrl: 'https://linkedin.com/in/user1',
        salaryExpectation: {
          min: 80000,
          max: 120000,
          currency: 'USD',
          period: 'yearly'
        },
        availability: '2-weeks',
        relocation: 'willing',
        source: 'job-board'
      },
      {
        jobId: 'demo-job-2',
        userId: 'demo-user-2',
        coverLetter: 'I am excited about this opportunity and would love to contribute to your team.',
        resumeUrl: 'https://example.com/resume2.pdf',
        portfolioUrl: 'https://example.com/portfolio2',
        githubUrl: 'https://github.com/user2',
        linkedinUrl: 'https://linkedin.com/in/user2',
        salaryExpectation: {
          min: 90000,
          max: 130000,
          currency: 'USD',
          period: 'yearly'
        },
        availability: 'immediately',
        relocation: 'negotiable',
        source: 'linkedin'
      }
    ];

    demoApplications.forEach(appData => {
      try {
        this.submitApplication(appData);
      } catch (error) {
        // Application might already exist
      }
    });

    this.logger.info('📋 Demo applications created for Application Service');
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('application-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        this.logger.info(`📋 Application Service running on port ${this.config.port}`);
        this.logger.info(`📍 Environment: ${this.config.environment}`);
        this.logger.info(`🔍 Tracing: ${this.config.tracing.enabled ? 'enabled' : 'disabled'}`);
      });

      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Application service started successfully');
        startupSpan.finish();
      }

    } catch (error) {
      if (startupSpan) {
        startupSpan.logError(error);
        startupSpan.finish();
      }
      throw error;
    }
  }

  async stop() {
    const shutdownSpan = this.tracer ? this.tracer.startSpan('application-service.shutdown') : null;
    
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        this.logger.info('🛑 Application Service stopped');
      }

      if (shutdownSpan) {
        shutdownSpan.finish();
      }

    } catch (error) {
      if (shutdownSpan) {
        shutdownSpan.logError(error);
        shutdownSpan.finish();
      }
      throw error;
    }
  }
}

// Create and export service instance
module.exports = {
  ApplicationService
};

// Auto-start if this is the main module
if (require.main === module) {
  const applicationService = new ApplicationService();

  applicationService.start().catch(console.error);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await applicationService.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await applicationService.stop();
    process.exit(0);
  });
}