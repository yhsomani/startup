/**
 * Job Listing Service with Production Database Integration
 * Complete job listing management with search and filtering capabilities
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
const auth = require('../../../shared/middleware/auth');
// const redisClient = require('../shared/redis-client'); // Removed in favor of in-memory cache

class JobListingService extends EnhancedServiceWithTracing {
    constructor() {
        super({
            serviceName: 'job-listing-service',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            port: process.env.JOB_LISTING_PORT || 3008,
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

        // Setup middleware
        this.setupMiddleware();

        // Setup routes
        this.setupRoutes();
    }

    initializeContracts() {
        this.serviceContracts = {
            ...contracts.base,
            jobListing: {
                create: {
                    request: {
                        type: 'object',
                        required: ['title', 'description', 'companyId', 'location', 'employmentType'],
                        properties: {
                            title: { type: 'string', minLength: 5, maxLength: 200 },
                            description: { type: 'string', minLength: 20, maxLength: 5000 },
                            companyId: { type: 'string', format: 'uuid' },
                            location: { type: 'string', minLength: 2, maxLength: 100 },
                            employmentType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'] },
                            salaryMin: { type: 'number', minimum: 0 },
                            salaryMax: { type: 'number', minimum: 0 },
                            experienceLevel: { type: 'string', enum: ['entry', 'mid', 'senior', 'executive'] },
                            skills: { type: 'array', items: { type: 'string' } },
                            remote: { type: 'boolean' },
                            benefits: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    response: {
                        type: 'object',
                        required: ['id', 'title', 'companyId', 'createdAt'],
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            title: { type: 'string' },
                            companyId: { type: 'string', format: 'uuid' },
                            createdAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                get: {
                    request: {
                        type: 'object',
                        required: ['id'],
                        properties: {
                            id: { type: 'string', format: 'uuid' }
                        }
                    },
                    response: {
                        type: 'object',
                        required: ['id', 'title', 'description', 'companyId', 'location', 'employmentType'],
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            title: { type: 'string' },
                            description: { type: 'string' },
                            companyId: { type: 'string', format: 'uuid' },
                            location: { type: 'string' },
                            employmentType: { type: 'string' },
                            salaryMin: { type: 'number' },
                            salaryMax: { type: 'number' },
                            experienceLevel: { type: 'string' },
                            skills: { type: 'array', items: { type: 'string' } },
                            remote: { type: 'boolean' },
                            benefits: { type: 'array', items: { type: 'string' } },
                            status: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                search: {
                    request: {
                        type: 'object',
                        properties: {
                            query: { type: 'string' },
                            location: { type: 'string' },
                            employmentType: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'] },
                            experienceLevel: { type: 'string', enum: ['entry', 'mid', 'senior', 'executive'] },
                            salaryMin: { type: 'number', minimum: 0 },
                            salaryMax: { type: 'number', minimum: 0 },
                            remote: { type: 'boolean' },
                            page: { type: 'integer', minimum: 1, default: 1 },
                            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                        }
                    },
                    response: {
                        type: 'object',
                        required: ['jobs', 'total', 'page', 'limit'],
                        properties: {
                            jobs: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string', format: 'uuid' },
                                        title: { type: 'string' },
                                        companyId: { type: 'string', format: 'uuid' },
                                        location: { type: 'string' },
                                        employmentType: { type: 'string' },
                                        salaryMin: { type: 'number' },
                                        salaryMax: { type: 'number' },
                                        experienceLevel: { type: 'string' },
                                        remote: { type: 'boolean' },
                                        status: { type: 'string' },
                                        createdAt: { type: 'string', format: 'date-time' }
                                    }
                                }
                            },
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            totalPages: { type: 'integer' }
                        }
                    }
                }
            }
        };
    }

    setupMiddleware() {
        // Apply security middleware
        applySecurityMiddleware(this.app, {
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                credentials: true
            },
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100 // limit each IP to 100 requests per windowMs
            }
        });

        // Authentication middleware
        this.app.use('/api/v1/jobs', auth.authenticateToken);
        this.app.use('/api/v1/jobs/:id/apply', auth.authenticateToken);
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                service: this.serviceName,
                version: this.version,
                timestamp: new Date().toISOString()
            });
        });

        // Performance metrics endpoint
        this.app.get('/metrics', (req, res) => {
            const mem = process.memoryUsage();
            const formatBytes = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;
            const uptime = process.uptime() * 1000; // ms

            // Gather cache stats from in-memory cache if available
            let cacheStats = null;
            if (this.cache) {
                const keys = this.cache.size || 0;
                const hits = this.cacheHits || 0;
                const misses = this.cacheMisses || 0;
                const total = hits + misses;
                cacheStats = {
                    hits,
                    misses,
                    keys,
                    hitRate: total > 0 ? `${((hits / total) * 100).toFixed(1)}%` : '0%'
                };
            }

            res.status(200).json({
                service: this.serviceName,
                version: this.version,
                health: {
                    status: 'healthy',
                    uptime
                },
                performance: {
                    uptime,
                    requestCount: this.requestCount || 0,
                    errorCount: this.errorCount || 0,
                    errorRate: this.requestCount
                        ? ((this.errorCount / this.requestCount) * 100).toFixed(2)
                        : '0.00',
                    memory: {
                        rss: formatBytes(mem.rss),
                        heapUsed: formatBytes(mem.heapUsed),
                        heapTotal: formatBytes(mem.heapTotal)
                    }
                },
                cache: cacheStats,
                timestamp: new Date().toISOString()
            });
        });

        // API routes
        this.app.use('/api/v1', this.router);

        // Job listing endpoints
        this.router.post('/jobs', this.createJob.bind(this));
        this.router.get('/jobs', this.searchJobs.bind(this));
        this.router.get('/jobs/:id', this.getJob.bind(this));
        this.router.put('/jobs/:id', this.updateJob.bind(this));
        this.router.delete('/jobs/:id', this.deleteJob.bind(this));
        this.router.post('/jobs/:id/apply', this.applyForJob.bind(this));
        this.router.get('/jobs/:id/applications', this.getJobApplications.bind(this));
    }

    async createJob(req, res) {
        try {
            const { title, description, companyId, location, employmentType, salaryMin, salaryMax, experienceLevel, skills, remote, benefits } = req.body;
            const userId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.jobListing.create.request, req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: validation.errors
                });
            }

            // Create job listing
            const jobId = uuidv4();
            const createdAt = new Date().toISOString();

            const query = `
        INSERT INTO job_listings (
          id, title, description, company_id, location, employment_type, 
          salary_min, salary_max, experience_level, skills, remote, benefits, 
          status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
        RETURNING id, title, company_id, created_at
      `;

            const values = [
                jobId, title, description, companyId, location, employmentType,
                salaryMin, salaryMax, experienceLevel, JSON.stringify(skills || []),
                remote || false, JSON.stringify(benefits || []), 'active', userId, createdAt
            ];

            const result = await this.database.query(query, values);

            // Validate response
            const responseValidation = validateResponse(this.serviceContracts.jobListing.create.response, result.rows[0]);
            if (!responseValidation.valid) {
                this.logger.warn('Response validation failed', { errors: responseValidation.errors });
            }

            // Invalidate search cache
            this.invalidateCache('jobs:search:*');

            res.status(201).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error creating job listing', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to create job listing'
            });
        }
    }

    async getJob(req, res) {
        try {
            const { id } = req.params;
            const cacheKey = `job:${id}`;

            const job = await this.withCache(cacheKey, 60, async () => {
                // Validate request
                const validation = validateRequest(this.serviceContracts.jobListing.get.request, { id });
                if (!validation.valid) {
                    throw new ValidationError('Invalid job ID', { details: validation.errors });
                }

                const query = `
                SELECT 
                  id, title, description, company_id, location, employment_type,
                  salary_min, salary_max, experience_level, skills, remote, benefits,
                  status, created_at, updated_at
                FROM job_listings 
                WHERE id = $1 AND status = 'active'
                `;

                const result = await this.traceDatabaseQuery('getJob', () =>
                    this.database.query(query, [id])
                );

                if (result.rows.length === 0) {
                    return null;
                }

                // Validate response
                const responseValidation = validateResponse(this.serviceContracts.jobListing.get.response, result.rows[0]);
                if (!responseValidation.valid) {
                    this.logger.warn('Response validation failed', { errors: responseValidation.errors });
                }

                return result.rows[0];
            });

            if (!job) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Job listing not found'
                });
            }

            res.status(200).json(job);
        } catch (error) {
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: error.message,
                    details: error.details
                });
            }
            this.logger.error('Error fetching job listing', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to fetch job listing'
            });
        }
    }

    async searchJobs(req, res) {
        try {
            const cacheKey = `jobs:search:${JSON.stringify(req.query)}`;

            const response = await this.withCache(cacheKey, 30, async () => { // Cache for 30s
                const {
                    query = '',
                    location = '',
                    employmentType = '',
                    experienceLevel = '',
                    salaryMin = 0,
                    salaryMax = 0,
                    remote = null,
                    page = 1,
                    limit = 20
                } = req.query;

                // Validate request
                const validation = validateRequest(this.serviceContracts.jobListing.search.request, req.query);
                if (!validation.valid) {
                    throw new ValidationError('Invalid search parameters', { details: validation.errors });
                }

                const offset = (page - 1) * limit;

                let searchQuery = `
            SELECT 
            id, title, company_id, location, employment_type,
            salary_min, salary_max, experience_level, remote, status, created_at
            FROM job_listings 
            WHERE status = 'active'
        `;

                const conditions = [];
                const values = [];

                if (query) {
                    conditions.push(`search_vector @@ plainto_tsquery('english', $${values.length + 1})`);
                    values.push(query);
                }

                if (location) {
                    conditions.push(`location ILIKE $${values.length + 1}`);
                    values.push(`%${location}%`);
                }

                if (employmentType) {
                    conditions.push(`employment_type = $${values.length + 1}`);
                    values.push(employmentType);
                }

                if (experienceLevel) {
                    conditions.push(`experience_level = $${values.length + 1}`);
                    values.push(experienceLevel);
                }

                if (salaryMin > 0) {
                    conditions.push(`salary_min >= $${values.length + 1}`);
                    values.push(salaryMin);
                }

                if (salaryMax > 0) {
                    conditions.push(`salary_max <= $${values.length + 1}`);
                    values.push(salaryMax);
                }

                if (remote !== null) {
                    conditions.push(`remote = $${values.length + 1}`);
                    values.push(remote === 'true' || remote === true);
                }

                if (conditions.length > 0) {
                    searchQuery += ` AND ${conditions.join(' AND ')}`;
                }

                searchQuery += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
                values.push(limit, offset);

                const result = await this.traceDatabaseQuery('searchJobs', () =>
                    this.database.query(searchQuery, values)
                );

                // Get total count for pagination
                let countQuery = `
            SELECT COUNT(*) as total
            FROM job_listings 
            WHERE status = 'active'
        `;

                if (conditions.length > 0) {
                    countQuery += ` AND ${conditions.join(' AND ')}`;
                }

                const countResult = await this.database.query(countQuery, values.slice(0, -2));
                const total = parseInt(countResult.rows[0].total);
                const totalPages = Math.ceil(total / limit);

                const responseData = {
                    jobs: result.rows,
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages
                };

                // Validate response
                const responseValidation = validateResponse(this.serviceContracts.jobListing.search.response, responseData);
                if (!responseValidation.valid) {
                    this.logger.warn('Response validation failed', { errors: responseValidation.errors });
                }

                return responseData;
            });

            res.status(200).json(response);
        } catch (error) {
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: error.message,
                    details: error.details
                });
            }
            this.logger.error('Error searching job listings', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to search job listings'
            });
        }
    }

    async updateJob(req, res) {
        try {
            const { id } = req.params;
            const { title, description, location, employmentType, salaryMin, salaryMax, experienceLevel, skills, remote, benefits } = req.body;
            const userId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.jobListing.get.request, { id });
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid job ID',
                    details: validation.errors
                });
            }

            const updatedAt = new Date().toISOString();

            const query = `
        UPDATE job_listings 
        SET title = $1, description = $2, location = $3, employment_type = $4,
            salary_min = $5, salary_max = $6, experience_level = $7, skills = $8,
            remote = $9, benefits = $10, updated_at = $11
        WHERE id = $12 AND status = 'active'
        RETURNING id, title, company_id, location, employment_type, created_at, updated_at
      `;

            const values = [
                title, description, location, employmentType,
                salaryMin, salaryMax, experienceLevel, JSON.stringify(skills || []),
                remote, JSON.stringify(benefits || []), updatedAt, id
            ];

            const result = await this.database.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Job listing not found'
                });
            }

            // Invalidate cache
            // Invalidate cache
            this.invalidateCache(`job:${id}`);
            this.invalidateCache('jobs:search:*');

            res.status(200).json(result.rows[0]);
        } catch (error) {
            this.logger.error('Error updating job listing', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to update job listing'
            });
        }
    }

    async deleteJob(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.jobListing.get.request, { id });
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid job ID',
                    details: validation.errors
                });
            }

            const query = `
        UPDATE job_listings 
        SET status = 'deleted', updated_at = $1
        WHERE id = $2
        RETURNING id
      `;

            const result = await this.database.query(query, [new Date().toISOString(), id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Job listing not found'
                });
            }

            // Invalidate cache
            // Invalidate cache
            this.invalidateCache(`job:${id}`);
            this.invalidateCache('jobs:search:*');

            res.status(200).json({ message: 'Job listing deleted successfully' });
        } catch (error) {
            this.logger.error('Error deleting job listing', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to delete job listing'
            });
        }
    }

    async applyForJob(req, res) {
        try {
            const { id } = req.params;
            const { coverLetter, resume } = req.body;
            const userId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.jobListing.get.request, { id });
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid job ID',
                    details: validation.errors
                });
            }

            // Check if job exists and is active
            const jobQuery = `
        SELECT id, company_id 
        FROM job_listings 
        WHERE id = $1 AND status = 'active'
      `;
            const jobResult = await this.database.query(jobQuery, [id]);

            if (jobResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Job listing not found'
                });
            }

            // Create job application
            const applicationId = uuidv4();
            const createdAt = new Date().toISOString();

            const applicationQuery = `
        INSERT INTO job_applications (
          id, job_id, user_id, cover_letter, resume, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, job_id, user_id, status, created_at
      `;

            const applicationValues = [
                applicationId, id, userId, coverLetter, resume, 'pending', createdAt
            ];

            const applicationResult = await this.database.query(applicationQuery, applicationValues);

            res.status(201).json(applicationResult.rows[0]);
        } catch (error) {
            this.logger.error('Error applying for job', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to apply for job'
            });
        }
    }

    async getJobApplications(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Validate request
            const validation = validateRequest(this.serviceContracts.jobListing.get.request, { id });
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid job ID',
                    details: validation.errors
                });
            }

            // Check if user is authorized to view applications (job owner or admin)
            const jobQuery = `
        SELECT id, company_id, created_by
        FROM job_listings 
        WHERE id = $1 AND status = 'active'
      `;
            const jobResult = await this.database.query(jobQuery, [id]);

            if (jobResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'NOT_FOUND',
                    message: 'Job listing not found'
                });
            }

            const job = jobResult.rows[0];

            // Verify that the user owns the job or is an admin
            if (job.created_by !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    error: 'FORBIDDEN',
                    message: 'You can only view applications for your own job listings'
                });
            }

            const applicationsQuery = `
        SELECT 
          id, user_id, cover_letter, resume, status, created_at, updated_at
        FROM job_applications 
        WHERE job_id = $1
        ORDER BY created_at DESC
      `;

            const applicationsResult = await this.database.query(applicationsQuery, [id]);

            res.status(200).json({
                applications: applicationsResult.rows
            });
        } catch (error) {
            this.logger.error('Error fetching job applications', { error: error.message, stack: error.stack });
            res.status(500).json({
                error: 'INTERNAL_ERROR',
                message: 'Failed to fetch job applications'
            });
        }
    }
}

// Start the service
const service = new JobListingService();
service.start();

module.exports = JobListingService;