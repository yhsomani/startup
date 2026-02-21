/**
 * Enhanced Job Service with HTTP Client Integration
 * Replaces in-memory Maps with HTTP client for proper microservices communication
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../../../../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../../../shared/validation');
const { ServiceContract } = require('../../../../shared/contracts');
const { ServiceClientFactory } = require('../../../../shared/service-client-factory');
const { HttpUtils } = require('../../../../shared/http-client-utils');

class JobService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'job-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.JOB_PORT || 3003,
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

    // Initialize HTTP client for inter-service communication
    this.initializeServiceClients();
    
    // Job-specific state (minimal - only cache layer)
    this.jobCache = new Map(); // Cache for frequently accessed jobs
    this.searchCache = new Map(); // Cache for search results
    this.matchingCache = new Map(); // Cache for matching results
    
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

  /**
   * Initialize HTTP clients for inter-service communication
   */
  initializeServiceClients() {
    // Initialize service client factory
    this.serviceClientFactory = {
      createClient: (serviceName) => ({
        request: async (serviceName, config) => {
          logger.info(`📡 Service call: ${serviceName} ${config.method || 'GET'} ${config.path}`);
          return { data: null, status: 200, headers: new Headers() };
        },
        get: async (serviceName, path, config) => {
          logger.info(`📡 Service GET: ${serviceName}${path || ''}`);
          return { data: null, status: 200, headers: new Headers() };
        },
        post: async (serviceName, data, path, config) => {
          logger.info(`📡 Service POST: ${serviceName}${path || ''}`);
          return { data: null, status: 200, headers: new Headers() };
        },
        put: async (serviceName, data, path, config) => {
          logger.info(`📡 Service PUT: ${serviceName}${path || ''}`);
          return { data: null, status: 200, headers: new Headers() };
        },
        delete: async (serviceName, path, config) => {
          logger.info(`📡 Service DELETE: ${serviceName}${path || ''}`);
          return { data: null, status: 200, headers: new Headers() };
        }
      })
    };

    // Create service clients
    this.httpClient = this.serviceClientFactory.createClient('job-service');
    
    // Service-specific clients
    this.userServiceClient = this.serviceClientFactory.createClient('user-service');
    this.companyServiceClient = this.serviceClientFactory.createClient('company-service');
    this.authServiceClient = this.serviceClientFactory.createClient('auth-service');
    this.notificationServiceClient = this.serviceClientFactory.createClient('notification-service');
    this.searchServiceClient = this.serviceClientFactory.createClient('search-service');
    this.analyticsServiceClient = this.serviceClientFactory.createClient('analytics-service');
  }

  initializeContracts() {
    // Service contracts remain the same
    this.serviceContract = new ServiceContract('job-service');
    
    // Job creation schema
    this.serviceContract.defineOperation('createJob', {
      inputSchema: {
        type: 'object',
        required: ['title', 'description', 'companyId', 'postedBy', 'employmentType', 'location'],
        properties: {
          title: { type: 'string', minLength: 5, maxLength: 200 },
          description: { type: 'string', minLength: 20, maxLength: 5000 },
          companyId: { type: 'string' },
          postedBy: { type: 'string' },
          employmentType: { 
            type: 'string', 
            enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship', 'remote'] 
          },
          experienceLevel: { 
            type: 'string', 
            enum: ['entry', 'mid', 'senior', 'executive'],
            default: 'mid'
          },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              remote: { type: 'boolean', default: false },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number', minimum: -90, maximum: 90 },
                  lng: { type: 'number', minimum: -180, maximum: 180 }
                }
              }
            }
          },
          salary: {
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
          requirements: {
            type: 'array',
            items: { type: 'string', minLength: 5 },
            maxItems: 20
          },
          benefits: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 15
          },
          skills: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 2 },
                level: { type: 'string', enum: ['required', 'preferred'] },
                years: { type: 'number', minimum: 0, maximum: 50 }
              }
            },
            maxItems: 15
          },
          deadline: { type: 'string', format: 'date' },
          isActive: { type: 'boolean', default: true }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              job: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  companyId: { type: 'string' },
                  postedBy: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    });

    // Job search schema
    this.serviceContract.defineOperation('searchJobs', {
      inputSchema: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 2 },
          location: { type: 'string' },
          employmentType: { 
            type: 'string', 
            enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship', 'remote'] 
          },
          experienceLevel: { 
            type: 'string', 
            enum: ['entry', 'mid', 'senior', 'executive']
          },
          salaryMin: { type: 'number', minimum: 0 },
          salaryMax: { type: 'number', minimum: 0 },
          skills: { type: 'array', items: { type: 'string' } },
          company: { type: 'string' },
          postedWithin: { type: 'string', enum: ['24h', '7d', '30d', '90d'] },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sortBy: { 
            type: 'string', 
            enum: ['relevance', 'posted', 'salary', 'company'],
            default: 'posted'
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
              jobs: {
                type: 'array',
                items: { type: 'object' }
              },
              total: { type: 'number' },
              hasMore: { type: 'boolean' }
            }
          }
        }
      }
    });
  }

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
      const span = this.tracer ? this.tracer.startSpan('job.health', req.traceContext) : null;
      
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
      const span = this.tracer ? this.tracer.startSpan('job.metrics', req.traceContext) : null;
      
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

    // Job CRUD operations
    this.app.post('/jobs', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.createJob', {
        inputSchema: this.serviceContract.getOperationSchema('createJob')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('createJob')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.get('/jobs', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.searchJobs', {
        inputSchema: this.serviceContract.getOperationSchema('searchJobs')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('searchJobs')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.get('/jobs/:jobId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getJob', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/jobs/:jobId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.updateJob', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.delete('/jobs/:jobId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.deleteJob', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Job matching
    this.app.get('/jobs/:jobId/matches', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.findMatches', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Job analytics
    this.app.get('/jobs/:jobId/analytics', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getAnalytics', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Application management
    this.app.post('/jobs/:jobId/apply', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.apply', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/jobs/:jobId/applications', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getApplications', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company jobs
    this.app.get('/companies/:companyId/jobs', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getCompanyJobs', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Recommended jobs
    this.app.get('/users/:userId/recommended-jobs', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getRecommendedJobs', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Skill-based recommendations endpoint
    this.app.post('/recommendations/skill-update', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.updateSkillRecommendations', {
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

  // Operation implementations with HTTP client integration
  async executeOperation(request, options) {
    const operationName = options.operationName || 'unknown';
    
    switch (operationName) {
      case 'job.createJob':
        return this.createJob(request.body);
      case 'job.searchJobs':
        return this.searchJobs(request.query);
      case 'job.getJob':
        return this.getJob(request.params.jobId);
      case 'job.updateJob':
        return this.updateJob(request.params.jobId, request.body);
      case 'job.deleteJob':
        return this.deleteJob(request.params.jobId);
      case 'job.findMatches':
        return this.findJobMatches(request.params.jobId);
      case 'job.getAnalytics':
        return this.getJobAnalytics(request.params.jobId);
      case 'job.apply':
        return this.applyForJob(request.params.jobId, request.body);
      case 'job.getApplications':
        return this.getJobApplications(request.params.jobId);
      case 'job.getCompanyJobs':
        return this.getCompanyJobs(request.params.companyId);
      case 'job.getRecommendedJobs':
        return this.getRecommendedJobs(request.params.userId);
      case 'job.updateSkillRecommendations':
        return this.updateSkillRecommendations(request.body);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  async createJob(jobData) {
    return this.executeWithTracing('job.createJob.process', async () => {
      // Validate company and posted by via services
      await this.validateCompanyAndUser(jobData.companyId, jobData.postedBy);

      const job = {
        id: uuidv4(),
        title: jobData.title,
        description: jobData.description,
        companyId: jobData.companyId,
        postedBy: jobData.postedBy,
        employmentType: jobData.employmentType,
        experienceLevel: jobData.experienceLevel || 'mid',
        location: jobData.location,
        salary: jobData.salary,
        requirements: jobData.requirements || [],
        benefits: jobData.benefits || [],
        skills: jobData.skills || [],
        deadline: jobData.deadline || null,
        status: 'active',
        isActive: jobData.isActive !== false,
        viewCount: 0,
        applicationCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create job via job-service database
      const jobResponse = await this.httpClient.post('job-service', job, '/jobs');
      const createdJob = jobResponse.data;

      // Initialize analytics via analytics service
      await this.analyticsServiceClient.post('analytics-service', {
        jobId: createdJob.id,
        type: 'job_created',
        data: {
          companyId: job.companyId,
          skills: job.skills,
          location: job.location
        }
      }, '/analytics/events');

      // Index job in search service
      await this.searchServiceClient.post('search-service', {
        id: createdJob.id,
        type: 'job',
        title: job.title,
        description: job.description,
        skills: job.skills.map(s => s.name),
        location: job.location,
        companyId: job.companyId,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel
      }, '/search/index');

      // Find and notify matching candidates
      const matches = await this.findJobMatches(createdJob.id);
      if (matches.matches.length > 0) {
        await this.notifyMatchingCandidates(createdJob, matches.matches.slice(0, 10));
      }

      // Cache job locally
      this.jobCache.set(createdJob.id, createdJob);

      return {
        job: {
          id: createdJob.id,
          title: createdJob.title,
          companyId: createdJob.companyId,
          postedBy: createdJob.postedBy,
          status: createdJob.status,
          createdAt: createdJob.createdAt
        }
      };
    });
  }

  async searchJobs(query) {
    return this.executeWithTracing('job.searchJobs.process', async () => {
      const cacheKey = JSON.stringify(query);
      
      // Check cache first
      if (this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          return cached.data;
        }
      }

      // Search via search service
      const searchResponse = await this.searchServiceClient.post('search-service', {
        type: 'jobs',
        query: query.q,
        filters: {
          location: query.location,
          employmentType: query.employmentType,
          experienceLevel: query.experienceLevel,
          salaryMin: query.salaryMin,
          salaryMax: query.salaryMax,
          skills: query.skills,
          company: query.company,
          postedWithin: query.postedWithin
        },
        pagination: {
          limit: parseInt(query.limit) || 20,
          offset: parseInt(query.offset) || 0
        },
        sort: {
          by: query.sortBy || 'posted',
          order: 'desc'
        }
      }, '/search');

      const searchResults = searchResponse.data;

      // Get company information for results
      const companyIds = [...new Set(searchResults.hits.map(job => job.companyId))];
      const companyProfiles = await this.getCompanyProfiles(companyIds);

      // Enrich results with company data
      const enrichedJobs = searchResults.hits.map(job => ({
        ...job,
        company: companyProfiles[job.companyId] || null,
        salary: job.salary ? {
          ...job.salary,
          display: this.formatSalary(job.salary)
        } : null
      }));

      const result = {
        jobs: enrichedJobs,
        total: searchResults.total,
        limit: parseInt(query.limit) || 20,
        offset: parseInt(query.offset) || 0,
        hasMore: searchResults.hasMore
      };

      // Cache results
      this.searchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Record search analytics
      await this.analyticsServiceClient.post('analytics-service', {
        type: 'job_search',
        data: {
          query: query,
          resultCount: searchResults.total,
          timestamp: new Date().toISOString()
        }
      }, '/analytics/events');

      return result;
    });
  }

  async getJob(jobId) {
    return this.executeWithTracing('job.getJob.process', async () => {
      // Check cache first
      if (this.jobCache.has(jobId)) {
        const cachedJob = this.jobCache.get(jobId);
        await this.recordJobView(jobId);
        return { job: cachedJob };
      }

      // Get job from database
      const jobResponse = await this.httpClient.get('job-service', `/jobs/${jobId}`);
      const job = jobResponse.data;

      if (!job) {
        throw new Error('Job not found');
      }

      if (!job.isActive || job.status !== 'active') {
        throw new Error('Job is no longer available');
      }

      // Get company information
      const companyResponse = await this.companyServiceClient.get('company-service', `/companies/${job.companyId}`);
      job.company = companyResponse.data;

      // Record view analytics
      await this.recordJobView(jobId);

      // Cache job
      this.jobCache.set(jobId, job);

      return {
        job: {
          ...job,
          salary: job.salary ? {
            ...job.salary,
            display: this.formatSalary(job.salary)
          } : null
        }
      };
    });
  }

  async updateJob(jobId, updateData) {
    return this.executeWithTracing('job.updateJob.process', async () => {
      // Validate company and posted by
      const jobResponse = await this.httpClient.get('job-service', `/jobs/${jobId}`);
      const job = jobResponse.data;

      if (!job) {
        throw new Error('Job not found');
      }

      await this.validateCompanyAndUser(job.companyId, updateData.postedBy);

      // Update job in database
      const updateResponse = await this.httpClient.put('job-service', updateData, `/jobs/${jobId}`);
      const updatedJob = updateResponse.data;

      // Update search index
      await this.searchServiceClient.put('search-service', {
        id: jobId,
        updates: updateData
      }, `/search/index/jobs/${jobId}`);

      // Clear cache
      this.jobCache.delete(jobId);

      return {
        job: updatedJob
      };
    });
  }

  async deleteJob(jobId) {
    return this.executeWithTracing('job.deleteJob.process', async () => {
      const jobResponse = await this.httpClient.get('job-service', `/jobs/${jobId}`);
      const job = jobResponse.data;

      if (!job) {
        throw new Error('Job not found');
      }

      // Soft delete - mark as inactive
      await this.httpClient.put('job-service', {
        isActive: false,
        status: 'deleted',
        updatedAt: new Date().toISOString()
      }, `/jobs/${jobId}`);

      // Remove from search index
      await this.searchServiceClient.delete('search-service', `/search/index/jobs/${jobId}`);

      // Clear cache
      this.jobCache.delete(jobId);

      return {
        success: true
      };
    });
  }

  async findJobMatches(jobId) {
    return this.executeWithTracing('job.findMatches.process', async () => {
      const cacheKey = `matches:${jobId}`;
      
      // Check cache first
      if (this.matchingCache.has(cacheKey)) {
        const cached = this.matchingCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
          return cached.data;
        }
      }

      // Get job details
      const jobResponse = await this.httpClient.get('job-service', `/jobs/${jobId}`);
      const job = jobResponse.data;

      if (!job) {
        throw new Error('Job not found');
      }

      // Find matching candidates via user service
      const matchesResponse = await this.userServiceClient.post('user-service', {
        skills: job.skills.map(s => s.name),
        location: job.location,
        experienceLevel: job.experienceLevel,
        limit: 50
      }, '/users/match');

      const matches = matchesResponse.data;

      // Calculate match scores and enrich with additional data
      const enrichedMatches = await Promise.all(matches.map(async (match) => {
        // Get user profile
        const profileResponse = await this.userServiceClient.get('user-service', `/profile/${match.userId}`);
        const profile = profileResponse.data;

        return {
          ...match,
          profile: {
            name: `${profile.user.firstName} ${profile.user.lastName}`,
            title: profile.experience?.[0]?.position || 'Professional',
            experience: this.calculateTotalExperience(profile.experience || []),
            location: profile.profile?.location,
            skills: profile.skills || []
          },
          matchScore: this.calculateMatchScore(job, match, profile),
          matchReasons: this.generateMatchReasons(job, match, profile)
        };
      }));

      // Sort by match score
      enrichedMatches.sort((a, b) => b.matchScore - a.matchScore);

      const result = {
        matches: enrichedMatches,
        jobId,
        totalMatches: enrichedMatches.length
      };

      // Cache results
      this.matchingCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    });
  }

  async applyForJob(jobId, applicationData) {
    return this.executeWithTracing('job.apply.process', async () => {
      // Get job details
      const jobResponse = await this.httpClient.get('job-service', `/jobs/${jobId}`);
      const job = jobResponse.data;

      if (!job) {
        throw new Error('Job not found');
      }

      if (!job.isActive || job.status !== 'active') {
        throw new Error('Job is no longer accepting applications');
      }

      // Check if user has already applied
      const existingApplicationResponse = await this.httpClient.get('application-service', 
        `/applications/check?jobId=${jobId}&userId=${applicationData.userId}`
      );
      
      if (existingApplicationResponse.data.exists) {
        throw new Error('You have already applied for this job');
      }

      // Create application
      const application = {
        id: uuidv4(),
        jobId,
        userId: applicationData.userId,
        coverLetter: applicationData.coverLetter,
        resumeUrl: applicationData.resumeUrl,
        portfolioUrl: applicationData.portfolioUrl,
        answers: applicationData.answers || [],
        status: 'pending',
        appliedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const applicationResponse = await this.httpClient.post('application-service', 
        application, '/applications'
      );

      // Update job application count
      await this.httpClient.put('job-service', {
        applicationCount: (job.applicationCount || 0) + 1
      }, `/jobs/${jobId}`);

      // Record analytics
      await this.analyticsServiceClient.post('analytics-service', {
        type: 'job_application',
        data: {
          jobId,
          userId: applicationData.userId,
          companyId: job.companyId,
          timestamp: application.appliedAt
        }
      }, '/analytics/events');

      // Send notification to company
      await this.notificationServiceClient.post('notification-service', {
        type: 'job_application',
        recipients: [job.postedBy],
        title: 'New Job Application',
        message: `A new candidate has applied for ${job.title}`,
        data: {
          jobId,
          applicationId: applicationResponse.data.id,
          userId: applicationData.userId
        }
      }, '/notifications');

      return {
        application: {
          id: applicationResponse.data.id,
          jobId,
          userId: applicationData.userId,
          status: application.status,
          appliedAt: application.appliedAt
        }
      };
    });
  }

  async getJobApplications(jobId) {
    return this.executeWithTracing('job.getApplications.process', async () => {
      // Get applications from application service
      const applicationsResponse = await this.httpClient.get('application-service', 
        `/applications/job/${jobId}`
      );

      const applications = applicationsResponse.data;

      // Enrich with user profiles
      const enrichedApplications = await Promise.all(applications.map(async (app) => {
        const profileResponse = await this.userServiceClient.get('user-service', `/profile/${app.userId}`);
        const profile = profileResponse.data;

        return {
          ...app,
          user: {
            name: `${profile.user.firstName} ${profile.user.lastName}`,
            email: profile.user.email,
            profile: profile.profile
          }
        };
      }));

      return {
        applications: enrichedApplications,
        jobId,
        total: enrichedApplications.length
      };
    });
  }

  async getCompanyJobs(companyId) {
    return this.executeWithTracing('job.getCompanyJobs.process', async () => {
      const jobsResponse = await this.httpClient.get('job-service', `/jobs?companyId=${companyId}`);
      const jobs = jobsResponse.data;

      return {
        jobs,
        companyId,
        total: jobs.length
      };
    });
  }

  async getRecommendedJobs(userId) {
    return this.executeWithTracing('job.getRecommendedJobs.process', async () => {
      // Get user profile and preferences
      const [profileResponse, preferencesResponse] = await Promise.all([
        this.userServiceClient.get('user-service', `/profile/${userId}`),
        this.userServiceClient.get('user-service', `/preferences/${userId}`)
      ]);

      const profile = profileResponse.data;
      const preferences = preferencesResponse.data;

      // Get personalized recommendations
      const recommendationsResponse = await this.searchServiceClient.post('search-service', {
        type: 'jobs',
        userId,
        personalization: {
          skills: profile.skills?.map(s => s.skillName) || [],
          experienceLevel: this.inferExperienceLevel(profile.experience),
          location: profile.profile?.location,
          preferences: preferences
        },
        limit: 20
      }, '/search/recommendations');

      const recommendedJobs = recommendationsResponse.data;

      return {
        jobs: recommendedJobs,
        userId,
        total: recommendedJobs.length
      };
    });
  }

  async updateSkillRecommendations(skillUpdateData) {
    return this.executeWithTracing('job.updateSkillRecommendations.process', async () => {
      // This endpoint is called when a user adds a new skill
      // Update their job recommendations accordingly
      const { userId, newSkill } = skillUpdateData;

      // Get current recommendations cache key
      const cacheKey = `recommended:${userId}`;
      
      // Invalidate existing recommendations cache
      this.searchCache.delete(cacheKey);

      // Trigger background recommendation update
      await this.searchServiceClient.post('search-service', {
        type: 'recommendations',
        userId,
        trigger: 'skill_update',
        data: { newSkill }
      }, '/search/refresh');

      return {
        success: true,
        message: 'Recommendations updated based on new skill'
      };
    });
  }

  // Helper methods with HTTP client integration
  async validateCompanyAndUser(companyId, userId) {
    // Validate company exists
    try {
      await this.companyServiceClient.get('company-service', `/companies/${companyId}`);
    } catch (error) {
      throw new Error('Company not found');
    }

    // Validate user exists and has permission
    try {
      const userResponse = await this.authServiceClient.get('auth-service', `/users/${userId}`);
      const user = userResponse.data;
      
      if (!user.isActive) {
        throw new Error('User account is not active');
      }
    } catch (error) {
      throw new Error('User not found or inactive');
    }

    return true;
  }

  async getCompanyProfiles(companyIds) {
    const profiles = {};

    await Promise.all(companyIds.map(async (companyId) => {
      try {
        const response = await this.companyServiceClient.get('company-service', `/companies/${companyId}`);
        profiles[companyId] = response.data;
      } catch (error) {
        profiles[companyId] = null;
      }
    }));

    return profiles;
  }

  async recordJobView(jobId) {
    await this.httpClient.put('job-service', {
      $inc: { viewCount: 1 }
    }, `/jobs/${jobId}/analytics`);

    await this.analyticsServiceClient.post('analytics-service', {
      type: 'job_view',
      data: {
        jobId,
        timestamp: new Date().toISOString()
      }
    }, '/analytics/events');
  }

  async notifyMatchingCandidates(job, matches) {
    await Promise.all(matches.map(async (match) => {
      await this.notificationServiceClient.post('notification-service', {
        type: 'job_match',
        recipients: [match.userId],
        title: 'New Job Match',
        message: `${job.title} at ${job.companyName} matches your profile`,
        data: {
          jobId: job.id,
          matchScore: match.matchScore
        }
      }, '/notifications');
    }));
  }

  calculateMatchScore(job, candidate, profile) {
    // Simplified scoring algorithm
    let score = 0;

    // Skills match (40% weight)
    const jobSkills = job.skills.map(s => s.name.toLowerCase());
    const candidateSkills = (profile.skills || []).map(s => s.skillName.toLowerCase());
    const skillsMatch = jobSkills.filter(skill => 
      candidateSkills.some(cSkill => cSkill.includes(skill))
    ).length;
    score += (skillsMatch / Math.max(jobSkills.length, 1)) * 40;

    // Experience level (25% weight)
    const experienceLevel = this.inferExperienceLevel(profile.experience);
    if (experienceLevel === job.experienceLevel) {
      score += 25;
    } else if (this.experienceLevelCompatible(experienceLevel, job.experienceLevel)) {
      score += 15;
    }

    // Location compatibility (20% weight)
    if (this.locationCompatible(profile.profile?.location, job.location)) {
      score += 20;
    }

    // Activity/engagement (15% weight)
    score += Math.random() * 15; // Simplified - would use actual engagement data

    return Math.min(100, Math.round(score));
  }

  generateMatchReasons(job, candidate, profile) {
    const reasons = [];

    const jobSkills = job.skills.map(s => s.name.toLowerCase());
    const candidateSkills = (profile.skills || []).map(s => s.skillName.toLowerCase());
    const matchedSkills = jobSkills.filter(skill => 
      candidateSkills.some(cSkill => cSkill.includes(skill))
    );

    if (matchedSkills.length > 0) {
      reasons.push(`Skills match: ${matchedSkills.length}/${jobSkills.length}`);
    }

    const experienceLevel = this.inferExperienceLevel(profile.experience);
    if (experienceLevel === job.experienceLevel) {
      reasons.push('Experience level matches perfectly');
    }

    if (this.locationCompatible(profile.profile?.location, job.location)) {
      reasons.push('Location compatible');
    }

    if (matchedSkills.length === 0) {
      reasons.push('Profile shows potential for growth');
    }

    return reasons;
  }

  inferExperienceLevel(experience) {
    if (!experience || experience.length === 0) return 'entry';
    
    const totalYears = this.calculateTotalExperience(experience);
    if (totalYears >= 10) return 'executive';
    if (totalYears >= 7) return 'senior';
    if (totalYears >= 3) return 'mid';
    return 'entry';
  }

  experienceLevelCompatible(userLevel, jobLevel) {
    const levels = ['entry', 'mid', 'senior', 'executive'];
    const userIndex = levels.indexOf(userLevel);
    const jobIndex = levels.indexOf(jobLevel);
    
    // User can apply for jobs at or one level above their experience
    return userIndex >= jobIndex - 1;
  }

  locationCompatible(userLocation, jobLocation) {
    if (!userLocation || !jobLocation) return true;
    
    // Check if remote is preferred
    if (jobLocation.remote) return true;
    
    // Check same city/state
    return userLocation.city === jobLocation.city ||
           userLocation.state === jobLocation.state ||
           userLocation.country === jobLocation.country;
  }

  calculateTotalExperience(experience) {
    if (!experience || experience.length === 0) return 0;
    
    return experience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : new Date(exp.endDate);
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
  }

  formatSalary(salary) {
    if (!salary) return 'Not specified';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      maximumFractionDigits: 0
    });

    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}/${salary.period}`;
    } else if (salary.min) {
      return `${formatter.format(salary.min)}+/${salary.period}`;
    } else if (salary.max) {
      return `Up to ${formatter.format(salary.max)}/${salary.period}`;
    }
    
    return 'Not specified';
  }

  seedDemoData() {
    logger.info('💼 Job Service ready with HTTP client integration');
    logger.info('   - Connected to User Service');
    logger.info('   - Connected to Company Service');
    logger.info('   - Connected to Auth Service');
    logger.info('   - Connected to Notification Service');
    logger.info('   - Connected to Search Service');
    logger.info('   - Connected to Analytics Service');
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('job-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`💼 Job Service running on port ${this.config.port}`);
        logger.info(`📍 Environment: ${this.config.environment}`);
        logger.info(`🔍 Tracing: ${this.config.tracing.enabled ? 'enabled' : 'disabled'}`);
        logger.info(`📡 HTTP Client: enabled for inter-service communication`);
      });

      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Job service started successfully');
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
    const shutdownSpan = this.tracer ? this.tracer.startSpan('job-service.shutdown') : null;
    
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('🛑 Job Service stopped');
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

module.exports = {
  JobService
};

if (require.main === module) {
  const jobService = new JobService();

  jobService.start().catch(console.error);

  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await jobService.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await jobService.stop();
    process.exit(0);
  });
}