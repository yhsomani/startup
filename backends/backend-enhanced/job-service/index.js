/**
 * Job Service with Distributed Tracing Integration
 * Complete job posting management with matching algorithms and analytics
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../../shared/validation');
const { contracts } = require('../../../shared/contracts');
const { applySecurityMiddleware } = require('../../../../shared/security-middleware');
const { getDatabaseManager } = require('../../../../shared/database-connection');
const jobValidationMiddleware = require('./validation-middleware');
const auth = require('../../../shared/middleware/auth');

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

    // Initialize database connection
    this.database = getDatabaseManager();
    
    // Initialize service contracts
    this.initializeContracts();
    
    // Create Express app with tracing middleware
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();
    
    // Seed demo data
    this.seedDemoData().catch(console.error);
  }

  initializeContracts() {
    // Define service contracts for validation
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
      
      if (span) {
        span.setTag('component', 'job-service');
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
    this.app.post('/jobs', 
      auth.required,
      auth.requireRole(['hr', 'admin', 'super_admin']),
      auth.requireCompanyAccess,
      jobValidationMiddleware.createJob,
      async (req, res, next) => {
        await this.handleRequestWithTracing(req, res, 'job.createJob', {
          validateInput: false, // Already validated in middleware
          validateOutput: true
        });
      }
    );

    this.app.get('/jobs', 
      auth.optional, // Allow public job search
      jobValidationMiddleware.searchJobs,
      async (req, res, next) => {
        await this.handleRequestWithTracing(req, res, 'job.searchJobs', {
          validateInput: false, // Already validated in middleware
          validateOutput: true
        });
      }
    );

    this.app.get('/jobs/:jobId', auth.optional, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getJob', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/jobs/:jobId', auth.required, auth.requireRole(['hr', 'admin', 'super_admin']), async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.updateJob', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.delete('/jobs/:jobId', auth.required, auth.requireRole(['hr', 'admin', 'super_admin']), async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.deleteJob', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Job matching
    this.app.get('/jobs/:jobId/matches', auth.required, auth.requireRole(['hr', 'admin', 'super_admin']), async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.findMatches', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Job analytics
    this.app.get('/jobs/:jobId/analytics', auth.required, auth.requireRole(['hr', 'admin', 'super_admin']), async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getAnalytics', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Application management
    this.app.post('/jobs/:jobId/apply', auth.required, auth.requireRole(['employee', 'manager', 'hr', 'admin', 'super_admin']), async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.apply', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/jobs/:jobId/applications', auth.required, auth.requireRole(['hr', 'admin', 'super_admin']), async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getApplications', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company jobs
    this.app.get('/companies/:companyId/jobs', auth.optional, async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getCompanyJobs', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Recommended jobs
    this.app.get('/users/:userId/recommended-jobs', auth.required, auth.requireOwnership('userId'), async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'job.getRecommendedJobs', {
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
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  async createJob(jobData) {
    return this.executeWithTracing('job.createJob.process', async () => {
      // Ensure database is initialized
      await this.database.initialize();

      // Validate company and posted by
      await this.validateCompanyAndUser(jobData.companyId, jobData.postedBy);

      const job = await this.database.insert('jobs', {
        title: jobData.title,
        description: jobData.description,
        company_id: jobData.companyId,
        posted_by: jobData.postedBy,
        employment_type: jobData.employmentType || 'full-time',
        experience_level: jobData.experienceLevel || 'mid',
        location: jobData.location,
        salary_min: jobData.salary?.min,
        salary_max: jobData.salary?.max,
        salary_currency: jobData.salary?.currency || 'USD',
        requirements: jobData.requirements || [],
        benefits: jobData.benefits || [],
        skills_required: jobData.skills || [],
        remote_type: jobData.remoteType || 'onsite',
        expires_at: jobData.deadline ? new Date(jobData.deadline) : null,
        is_active: jobData.isActive !== false,
        is_featured: jobData.isFeatured || false
      });

      // Initialize analytics in separate table
      await this.database.query(
        `INSERT INTO job_analytics (date, new_applications, total_applications, viewed_applications, interviewing_applications, offers_made, offers_accepted)
         VALUES (CURRENT_DATE, 0, 0, 0, 0, 0, 0)
         ON CONFLICT (date) DO UPDATE SET 
           new_applications = job_analytics.new_applications + 1`,
        []
      );
        jobId: job.id,
        views: [],
        applications: [],
        shares: [],
        saves: [],
        searches: [],
        createdAt: new Date().toISOString()
      });

      // Index job skills for matching
      if (job.skills.length > 0) {
        job.skills.forEach(skill => {
          if (!this.jobSkills.has(skill.name.toLowerCase())) {
            this.jobSkills.set(skill.name.toLowerCase(), []);
          }
          this.jobSkills.get(skill.name.toLowerCase()).push({
            jobId: job.id,
            level: skill.level,
            years: skill.years || 0
          });
        });
      }

      return {
        job: {
          id: job.id,
          title: job.title,
          description: job.description,
          companyId: job.company_id,
          postedBy: job.posted_by,
          employmentType: job.employment_type,
          experienceLevel: job.experience_level,
          location: job.location,
          salary: {
            min: job.salary_min,
            max: job.salary_max,
            currency: job.salary_currency
          },
          requirements: job.requirements,
          benefits: job.benefits,
          skills: job.skills_required,
          deadline: job.expires_at,
          status: job.is_active ? 'active' : 'inactive',
          isActive: job.is_active,
          isFeatured: job.is_featured,
          remoteType: job.remote_type,
          createdAt: job.created_at,
          updatedAt: job.updated_at
        }
      };
    });
  }

  async searchJobs(query) {
    return this.executeWithTracing('job.searchJobs.process', async () => {
      // Ensure database is initialized
      await this.database.initialize();

      const {
        q: searchTerm,
        location,
        employmentType,
        experienceLevel,
        salaryMin,
        salaryMax,
        skills,
        company,
        postedWithin,
        limit = 20,
        offset = 0,
        sortBy = 'posted'
      } = query;

      // Build WHERE clause
      const whereConditions = ['is_active = TRUE'];
      const queryParams = [];
      let paramIndex = 1;

      // Text search using full-text search
      if (searchTerm) {
        whereConditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex})`);
        queryParams.push(searchTerm);
        paramIndex++;
      }

      // Location filter
      if (location) {
        whereConditions.push(`location ILIKE $${paramIndex}`);
        queryParams.push(`%${location}%`);
        paramIndex++;
      }

      // Employment type filter
      if (employmentType) {
        whereConditions.push(`employment_type = $${paramIndex}`);
        queryParams.push(employmentType);
        paramIndex++;
      }

      // Experience level filter
      if (experienceLevel) {
        whereConditions.push(`experience_level = $${paramIndex}`);
        queryParams.push(experienceLevel);
        paramIndex++;
      }

      // Salary range filter
      if (salaryMin !== undefined) {
        whereConditions.push(`salary_min >= $${paramIndex}`);
        queryParams.push(salaryMin);
        paramIndex++;
      }

      if (salaryMax !== undefined) {
        whereConditions.push(`salary_max <= $${paramIndex}`);
        queryParams.push(salaryMax);
        paramIndex++;
      }

      // Skills filter
      if (skills && skills.length > 0) {
        const skillConditions = skills.map(() => `skills_required && $${paramIndex}`).join(' OR ');
        whereConditions.push(`(${skillConditions})`);
        skills.forEach(skill => {
          queryParams.push(skill);
          paramIndex++;
        });
      }

      // Company filter
      if (company) {
        whereConditions.push(`company_id IN (SELECT id FROM companies WHERE name ILIKE $${paramIndex})`);
        queryParams.push(`%${company}%`);
        paramIndex++;
      }

      // Posted within filter
      if (postedWithin) {
        const dateCondition = this.getDateCondition(postedWithin);
        whereConditions.push(`posted_at >= ${dateCondition}`);
      }

      // Build ORDER BY clause
      let orderBy = 'posted_at DESC';
      switch (sortBy) {
        case 'salary':
          orderBy = 'salary_max DESC NULLS LAST';
          break;
        case 'company':
          orderBy = 'company_id ASC';
          break;
        case 'relevance':
          orderBy = searchTerm 
            ? `ts_rank(search_vector, plainto_tsquery('english', $1)) DESC`
            : 'posted_at DESC';
          break;
        default:
          orderBy = 'posted_at DESC';
      }

      // Build final query
      const whereClause = whereConditions.join(' AND ');
      const searchQuery = `
        SELECT 
          id,
          title,
          description,
          company_id,
          location,
          employment_type,
          experience_level,
          salary_min,
          salary_max,
          salary_currency,
          skills_required,
          requirements,
          benefits,
          is_active,
          is_featured,
          posted_by,
          posted_at,
          expires_at,
          created_at,
          updated_at,
          CASE 
            WHEN search_vector @@ plainto_tsquery('english', $1) THEN 
              ts_rank(search_vector, plainto_tsquery('english', $1))
            ELSE 0
          END as relevance_score
        FROM jobs
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex}
        OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Execute query
      const result = await this.database.query(searchQuery, queryParams);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM jobs
        WHERE ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2); // Remove limit and offset
      const countResult = await this.database.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return {
        jobs: result.rows,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1
        }
      };
    });
  }

  // Helper method to get date condition
  getDateCondition(postedWithin) {
    const now = new Date();
    switch (postedWithin) {
      case '24h':
        return `NOW() - INTERVAL '24 hours'`;
      case '7d':
        return `NOW() - INTERVAL '7 days'`;
      case '30d':
        return `NOW() - INTERVAL '30 days'`;
      case '90d':
        return `NOW() - INTERVAL '90 days'`;
      default:
        return `NOW() - INTERVAL '30 days'`;
    }
  }
        jobs = jobs.filter(job => job.experienceLevel === experienceLevel);
      }

      // Salary range filter
      if (salaryMin) {
        jobs = jobs.filter(job => 
          job.salary && job.salary.min && job.salary.min >= salaryMin
        );
      }
      if (salaryMax) {
        jobs = jobs.filter(job => 
          job.salary && job.salary.max && job.salary.max <= salaryMax
        );
      }

      // Skills filter
      if (skills && skills.length > 0) {
        const skillList = Array.isArray(skills) ? skills : [skills];
        jobs = jobs.filter(job => {
          const jobSkills = job.skills.map(s => s.name.toLowerCase());
          return skillList.some(skill => 
            jobSkills.some(jobSkill => jobSkill.includes(skill.toLowerCase()))
          );
        });
      }

      // Company filter
      if (company) {
        jobs = jobs.filter(job => 
          job.companyId === company || // If company ID is provided
          job.companyName && job.companyName.toLowerCase().includes(company.toLowerCase()) // If company name is searched
        );
      }

      // Posted within filter
      if (postedWithin) {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (postedWithin) {
          case '24h':
            cutoffDate.setDate(now.getDate() - 1);
            break;
          case '7d':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            cutoffDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            cutoffDate.setDate(now.getDate() - 90);
            break;
        }
        
        jobs = jobs.filter(job => new Date(job.createdAt) >= cutoffDate);
      }

      // Sort results
      jobs = this.sortJobs(jobs, sortBy);

      // Pagination
      const total = jobs.length;
      const paginatedJobs = jobs.slice(offset, offset + limit);

      // Record search analytics
      this.recordSearchAnalytics(query, total);

      return {
        jobs: paginatedJobs.map(job => ({
          ...job,
          salary: job.salary ? {
            ...job.salary,
            display: this.formatSalary(job.salary)
          } : null
        })),
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < total
      };
    });
  }

  async getJob(jobId, userId = null, ipAddress = null, userAgent = null) {
    return this.executeWithTracing('job.getJob.process', async () => {
      // Ensure database is initialized
      await this.database.initialize();

      const result = await this.database.query(
        `SELECT * FROM jobs WHERE id = $1 AND is_active = TRUE`,
        [jobId]
      );

      if (result.rows.length === 0) {
        throw new Error('Job not found or no longer available');
      }

      const job = result.rows[0];

      // Record job view in database
      await this.database.query(
        `INSERT INTO job_views (job_id, user_id, ip_address, user_agent, viewed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [jobId, userId, ipAddress, userAgent]
      );

      // Update analytics
      await this.database.query(
        `INSERT INTO job_analytics (date, viewed_applications)
         VALUES (CURRENT_DATE, 1)
         ON CONFLICT (date) DO UPDATE SET 
           viewed_applications = job_analytics.viewed_applications + 1`,
        []
      );
      }

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
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Validate company and posted by
      await this.validateCompanyAndUser(job.companyId, updateData.postedBy);

      // Update job
      const updatedJob = {
        ...job,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.jobs.set(jobId, updatedJob);

      return {
        job: updatedJob
      };
    });
  }

  async deleteJob(jobId) {
    return this.executeWithTracing('job.deleteJob.process', async () => {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Soft delete - mark as inactive
      job.isActive = false;
      job.status = 'deleted';
      job.updatedAt = new Date().toISOString();

      return {
        success: true
      };
    });
  }

  async findJobMatches(jobId) {
    return this.executeWithTracing('job.findMatches.process', async () => {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // This would integrate with User Service to find matching candidates
      // For now, return a simplified matching algorithm
      const matches = await this.calculateJobMatches(job);

      return {
        matches,
        jobId,
        totalMatches: matches.length
      };
    });
  }

  async calculateJobMatches(job) {
    // This is a simplified matching algorithm
    // In a real implementation, this would:
    // 1. Query User Service for candidates with matching skills
    // 2. Apply machine learning for better matching
    // 3. Consider location preferences, experience level, etc.
    
    return [
      {
        userId: 'demo-user-1',
        matchScore: 85,
        matchReasons: ['Skills match: 80%', 'Experience level matches', 'Location compatible'],
        skillsMatched: ['JavaScript', 'React', 'Node.js'],
        profile: {
          name: 'John Doe',
          title: 'Senior Frontend Developer',
          experience: '5 years',
          location: 'San Francisco, CA'
        }
      },
      {
        userId: 'demo-user-2',
        matchScore: 75,
        matchReasons: ['Skills match: 70%', 'Experience level compatible'],
        skillsMatched: ['JavaScript', 'React'],
        profile: {
          name: 'Jane Smith',
          title: 'Frontend Developer',
          experience: '3 years',
          location: 'Remote'
        }
      }
    ];
  }

  async getJobAnalytics(jobId) {
    return this.executeWithTracing('job.getAnalytics.process', async () => {
      const analytics = this.jobAnalytics.get(jobId);
      if (!analytics) {
        throw new Error('Analytics not found for this job');
      }

      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Calculate analytics summary
      const summary = {
        totalViews: analytics.views.length,
        totalApplications: job.applicationCount || 0,
        totalShares: analytics.shares.length,
        totalSaves: analytics.saves.length,
        conversionRate: job.viewCount > 0 ? ((job.applicationCount || 0) / job.viewCount) * 100 : 0,
        viewsByDay: this.groupByDay(analytics.views),
        applicationsByDay: this.groupByDay(analytics.applications),
        topReferrers: this.getTopReferrers(analytics.views),
        skillDemand: this.analyzeSkillDemand(job.skills)
      };

      return {
        job: {
          id: job.id,
          title: job.title,
          company: job.companyId
        },
        analytics: summary,
        rawData: analytics
      };
    });
  }

  async applyForJob(jobId, applicationData) {
    return this.executeWithTracing('job.apply.process', async () => {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (!job.isActive || job.status !== 'active') {
        throw new Error('Job is no longer accepting applications');
      }

      // Check if user has already applied
      const existingApplication = Array.from(this.applications.values())
        .find(app => app.jobId === jobId && app.userId === applicationData.userId);
      
      if (existingApplication) {
        throw new Error('You have already applied for this job');
      }

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

      this.applications.set(application.id, application);

      // Update job application count
      job.applicationCount = (job.applicationCount || 0) + 1;

      // Record application in analytics
      const analytics = this.jobAnalytics.get(jobId);
      if (analytics) {
        analytics.applications.push({
          applicationId: application.id,
          userId: applicationData.userId,
          timestamp: application.appliedAt
        });
      }

      // This would trigger notification to company
      // await this.notificationService.notifyJobApplication(application);

      return {
        application: {
          id: application.id,
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
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const applications = Array.from(this.applications.values())
        .filter(app => app.jobId === jobId)
        .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

      return {
        applications,
        jobId,
        total: applications.length
      };
    });
  }

  async getCompanyJobs(companyId) {
    return this.executeWithTracing('job.getCompanyJobs.process', async () => {
      const jobs = Array.from(this.jobs.values())
        .filter(job => job.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        jobs,
        companyId,
        total: jobs.length
      };
    });
  }

  async getRecommendedJobs(userId) {
    return this.executeWithTracing('job.getRecommendedJobs.process', async () => {
      // This would integrate with User Service to get user profile
      // and with ML algorithms for personalized recommendations
      
      const activeJobs = Array.from(this.jobs.values())
        .filter(job => job.isActive && job.status === 'active')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // For demo, return recent jobs
      const recommendedJobs = activeJobs.slice(0, 10).map(job => ({
        ...job,
        recommendationScore: Math.floor(Math.random() * 30) + 70, // 70-100 score
        recommendationReasons: [
          'Matches your skills',
          'Similar to jobs you\'ve viewed',
          'Popular in your location'
        ]
      }));

      return {
        jobs: recommendedJobs,
        userId,
        total: recommendedJobs.length
      };
    });
  }

  // Helper methods
  async validateCompanyAndUser(companyId, userId) {
    // This would make calls to Company Service and User Service
    // For now, we'll assume they exist
    return true;
  }

  sortJobs(jobs, sortBy) {
    switch (sortBy) {
      case 'relevance':
        // Would use ML-based relevance scoring
        return jobs.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      case 'salary':
        return jobs.sort((a, b) => {
          const aMax = a.salary?.max || 0;
          const bMax = b.salary?.max || 0;
          return bMax - aMax;
        });
      case 'company':
        return jobs.sort((a, b) => a.companyId.localeCompare(b.companyId));
      case 'posted':
      default:
        return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
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

  recordSearchAnalytics(query, resultCount) {
    // Record search for analytics
    // This would be used to improve search algorithms
  }

  groupByDay(items) {
    const grouped = {};
    items.forEach(item => {
      const day = new Date(item.timestamp).toISOString().split('T')[0];
      grouped[day] = (grouped[day] || 0) + 1;
    });
    return grouped;
  }

  getTopReferrers(views) {
    // This would analyze referrer data from views
    return [
      { source: 'Direct', count: 45 },
      { source: 'LinkedIn', count: 23 },
      { source: 'Google', count: 18 },
      { source: 'Email', count: 12 }
    ];
  }

  analyzeSkillDemand(skills) {
    return skills.map(skill => ({
      skill: skill.name,
      level: skill.level,
      demand: Math.floor(Math.random() * 100), // This would be calculated from actual data
      trend: 'increasing' // This would be calculated from historical data
    }));
  }

  async seedDemoData() {
    // Ensure database is initialized
    await this.database.initialize();

    // Create demo companies if they don't exist
    const ensureCompanyExists = async (name) => {
      try {
        const result = await this.database.query('SELECT id FROM companies WHERE name = $1', [name]);
        return result.rows.length > 0;
      } catch (error) {
        return false;
      }
    };

    // Create demo companies
    const demoCompanies = [
      {
        name: 'TechCorp Solutions',
        description: 'Leading technology company specializing in enterprise software solutions',
        industry: 'Technology',
        size: 'Large',
        founded_year: 2010,
        website: 'https://techcorp.example.com',
        headquarters: 'San Francisco, CA'
      },
      {
        name: 'StartupHub',
        description: 'Innovative startup building the future of work',
        industry: 'Technology',
        size: 'Small',
        founded_year: 2020,
        website: 'https://startuphub.example.com',
        headquarters: 'Austin, TX'
      }
    ];

    for (const companyData of demoCompanies) {
      try {
        await this.database.insert('companies', companyData);
      } catch (error) {
        // Company might already exist
        this.logger.info('Company already exists:', companyData.name);
      }
    }

    // Create demo jobs
    const demoJobs = [
      {
        title: 'Senior Frontend Developer',
        description: 'We are looking for an experienced Frontend Developer to join our team and help build amazing user experiences.',
        company_id: (await ensureCompanyExists('TechCorp Solutions'))?.id,
        posted_by: (await this.database.query(`SELECT id FROM users WHERE email = 'demo@talentsphere.com'`)).rows[0]?.id,
        employmentType: 'full-time',
        experienceLevel: 'senior',
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          remote: true,
          coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        salary: {
          min: 120000,
          max: 180000,
          currency: 'USD',
          period: 'yearly'
        },
        requirements: [
          '5+ years of experience with React',
          'Strong JavaScript skills',
          'Experience with modern CSS frameworks',
          'Bachelor\'s degree in Computer Science or related field'
        ],
        benefits: [
          'Health insurance',
          '401(k) matching',
          'Unlimited PTO',
          'Remote work options'
        ],
        skills: [
          { name: 'React', level: 'required', years: 3 },
          { name: 'JavaScript', level: 'required', years: 5 },
          { name: 'TypeScript', level: 'preferred', years: 2 },
          { name: 'CSS', level: 'required', years: 5 }
        ]
      },
      {
        title: 'Backend Developer (Node.js)',
        description: 'Join our backend team to build scalable APIs and microservices.',
        company_id: (await ensureCompanyExists('StartupHub'))?.id,
        posted_by: (await this.database.query(`SELECT id FROM users WHERE email = 'demo@talentsphere.com'`)).rows[0]?.id,
        employmentType: 'full-time',
        experienceLevel: 'mid',
        location: {
          city: 'New York',
          state: 'NY',
          country: 'USA',
          remote: false,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        salary: {
          min: 90000,
          max: 130000,
          currency: 'USD',
          period: 'yearly'
        },
        requirements: [
          '3+ years of Node.js experience',
          'Experience with REST APIs',
          'Knowledge of databases (SQL/NoSQL)',
          'Strong problem-solving skills'
        ],
        benefits: [
          'Health and dental insurance',
          'Flexible work hours',
          'Professional development budget'
        ],
        skills: [
          { name: 'Node.js', level: 'required', years: 3 },
          { name: 'JavaScript', level: 'required', years: 4 },
          { name: 'MongoDB', level: 'preferred', years: 2 },
          { name: 'PostgreSQL', level: 'preferred', years: 2 }
        ]
      }
    ];

    for (const jobData of demoJobs) {
      try {
        await this.createJob(jobData);
      } catch (error) {
        // Job might already exist
        this.logger.info('Demo job already exists:', jobData.title);
      }
    }

    logger.info('💼 Demo jobs created for Job Service');
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('job-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`💼 Job Service running on port ${this.config.port}`);
        logger.info(`📍 Environment: ${this.config.environment}`);
        logger.info(`🔍 Tracing: ${this.config.tracing.enabled ? 'enabled' : 'disabled'}`);
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

// Create and export service instance
module.exports = {
  JobService
};

// Auto-start if this is the main module
if (require.main === module) {
  const jobService = new JobService();

  jobService.start().catch(console.error);

  // Graceful shutdown
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