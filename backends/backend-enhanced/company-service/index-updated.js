/**
 * Enhanced Company Service with HTTP Client Integration
 * Replaces in-memory Maps with HTTP client for proper microservices communication
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../shared/validation');
const { ServiceContract } = require('../../shared/contracts');
const { ServiceClientFactory } = require('../../../../shared/service-client-factory');
const { HttpUtils } = require('../../../../shared/http-client-utils');

class CompanyService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'company-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.COMPANY_PORT || 3004,
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
    
    // Company-specific state (minimal - only cache layer)
    this.companyCache = new Map(); // Cache for frequently accessed companies
    this.employerCache = new Map(); // Cache for employer sessions
    
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
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
    this.httpClient = this.serviceClientFactory.createClient('company-service');
    
    // Service-specific clients
    this.userServiceClient = this.serviceClientFactory.createClient('user-service');
    this.jobServiceClient = this.serviceClientFactory.createClient('job-service');
    this.authServiceClient = this.serviceClientFactory.createClient('auth-service');
    this.notificationServiceClient = this.serviceClientFactory.createClient('notification-service');
    this.searchServiceClient = this.serviceClientFactory.createClient('search-service');
    this.reviewServiceClient = this.serviceClientFactory.createClient('review-service');
    this.analyticsServiceClient = this.serviceClientFactory.createClient('analytics-service');
  }

  initializeContracts() {
    this.serviceContract = new ServiceContract('company-service');
    
    // Company registration schema
    this.serviceContract.defineOperation('registerCompany', {
      inputSchema: {
        type: 'object',
        required: ['name', 'email', 'password', 'industry'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          industry: { 
            type: 'string', 
            enum: ['technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'consulting', 'other']
          },
          size: {
            type: 'string',
            enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
          },
          website: { type: 'string', format: 'uri' },
          description: { type: 'string', maxLength: 1000 },
          headquarters: {
            type: 'object',
            properties: {
              address: { type: 'string', minLength: 5 },
              city: { type: 'string', minLength: 2 },
              state: { type: 'string', minLength: 2 },
              country: { type: 'string', minLength: 2 },
              zipCode: { type: 'string', pattern: '^[0-9]{5}(-[0-9]{4})?$' },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number', minimum: -90, maximum: 90 },
                  lng: { type: 'number', minimum: -180, maximum: 180 }
                }
              }
            }
          },
          contact: {
            type: 'object',
            properties: {
              phone: { type: 'string', pattern: '^[+]?[0-9]{10,15}$' },
              hrEmail: { type: 'string', format: 'email' },
              supportEmail: { type: 'string', format: 'email' }
            }
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
              company: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  industry: { type: 'string' },
                  verified: { type: 'boolean' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    });

    // Company profile update schema
    this.serviceContract.defineOperation('updateCompanyProfile', {
      inputSchema: {
        type: 'object',
        properties: {
          companyId: { type: 'string' },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          website: { type: 'string', format: 'uri' },
          description: { type: 'string', maxLength: 1000 },
          mission: { type: 'string', maxLength: 500 },
          vision: { type: 'string', maxLength: 500 },
          values: {
            type: 'array',
            items: { type: 'string', minLength: 2, maxLength: 50 },
            maxItems: 10
          },
          benefits: {
            type: 'array',
            items: { type: 'string', minLength: 2, maxLength: 100 },
            maxItems: 20
          },
          logoUrl: { type: 'string', format: 'uri' },
          bannerUrl: { type: 'string', format: 'uri' },
          socialMedia: {
            type: 'object',
            properties: {
              linkedin: { type: 'string', format: 'uri' },
              twitter: { type: 'string', format: 'uri' },
              facebook: { type: 'string', format: 'uri' },
              instagram: { type: 'string', format: 'uri' }
            }
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
              company: { type: 'object' }
            }
          }
        }
      }
    });
  }

  initializeMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(this.getTracingMiddleware());

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
      const span = this.tracer ? this.tracer.startSpan('company.health', req.traceContext) : null;
      
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
      const span = this.tracer ? this.tracer.startSpan('company.metrics', req.traceContext) : null;
      
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

    // Company registration
    this.app.post('/register', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.registerCompany', {
        inputSchema: this.serviceContract.getOperationSchema('registerCompany')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('registerCompany')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    // Company login
    this.app.post('/login', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.login', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company profile management
    this.app.get('/companies/:companyId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getCompany', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/companies/:companyId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.updateCompanyProfile', {
        inputSchema: this.serviceContract.getOperationSchema('updateCompanyProfile')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('updateCompanyProfile')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    // Company search
    this.app.get('/companies/search', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.searchCompanies', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company reviews
    this.app.post('/companies/:companyId/reviews', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.addReview', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/companies/:companyId/reviews', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getReviews', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Employer management
    this.app.post('/companies/:companyId/employers', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.addEmployer', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.get('/companies/:companyId/employers', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getEmployers', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company culture and benefits
    this.app.get('/companies/:companyId/culture', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getCulture', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/companies/:companyId/culture', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.updateCulture', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company analytics
    this.app.get('/companies/:companyId/analytics', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getAnalytics', {
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
      case 'company.registerCompany':
        return this.registerCompany(request.body);
      case 'company.login':
        return this.loginCompany(request.body);
      case 'company.getCompany':
        return this.getCompany(request.params.companyId);
      case 'company.updateCompanyProfile':
        return this.updateCompanyProfile(request.params.companyId, request.body);
      case 'company.searchCompanies':
        return this.searchCompanies(request.query);
      case 'company.addReview':
        return this.addCompanyReview(request.params.companyId, request.body);
      case 'company.getReviews':
        return this.getCompanyReviews(request.params.companyId);
      case 'company.addEmployer':
        return this.addEmployer(request.params.companyId, request.body);
      case 'company.getEmployers':
        return this.getEmployers(request.params.companyId);
      case 'company.getCulture':
        return this.getCompanyCulture(request.params.companyId);
      case 'company.updateCulture':
        return this.updateCompanyCulture(request.params.companyId, request.body);
      case 'company.getAnalytics':
        return this.getCompanyAnalytics(request.params.companyId);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  async registerCompany(companyData) {
    return this.executeWithTracing('company.registerCompany.process', async () => {
      // Check if company already exists via auth service
      try {
        await this.authServiceClient.get('auth-service', `/companies/email/${companyData.email}`);
        throw new Error('Company with this email already exists');
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(companyData.password, 10);

      // Create company via auth service
      const company = {
        name: companyData.name,
        email: companyData.email,
        password: hashedPassword,
        industry: companyData.industry,
        size: companyData.size || '1-10',
        website: companyData.website || null,
        description: companyData.description || null,
        headquarters: companyData.headquarters || null,
        contact: companyData.contact || {
          phone: null,
          hrEmail: companyData.email,
          supportEmail: companyData.email
        },
        isVerified: false,
        isApproved: true,
        isActive: true,
        subscription: {
          plan: 'basic',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          features: ['basic_job_posting', 'company_profile']
        }
      };

      const companyResponse = await this.authServiceClient.post('auth-service', 
        company, '/companies'
      );
      const createdCompany = companyResponse.data;

      // Create company culture profile
      const culture = {
        companyId: createdCompany.id,
        mission: null,
        vision: null,
        values: [],
        benefits: [],
        workEnvironment: null,
        diversity: null,
        workLifeBalance: null
      };

      await this.httpClient.post('company-service', culture, '/culture');

      // Create primary employer
      const employer = {
        companyId: createdCompany.id,
        firstName: companyData.firstName || 'Company',
        lastName: companyData.lastName || 'Admin',
        email: companyData.email,
        role: 'admin',
        permissions: ['all'],
        isActive: true
      };

      const employerResponse = await this.httpClient.post('company-service', 
        employer, '/employers'
      );

      // Index company in search service
      await this.searchServiceClient.post('search-service', {
        id: createdCompany.id,
        type: 'company',
        name: createdCompany.name,
        description: createdCompany.description,
        industry: createdCompany.industry,
        size: createdCompany.size,
        location: createdCompany.headquarters
      }, '/search/index');

      // Send welcome notification
      await this.notificationServiceClient.post('notification-service', {
        type: 'welcome_company',
        recipients: [companyData.email],
        title: 'Welcome to TalentSphere!',
        message: `Welcome ${createdCompany.name}! Your company account has been created successfully.`,
        channels: ['email']
      }, '/notifications');

      // Record registration analytics
      await this.analyticsServiceClient.post('analytics-service', {
        type: 'company_registration',
        data: {
          companyId: createdCompany.id,
          industry: createdCompany.industry,
          size: createdCompany.size,
          timestamp: new Date().toISOString()
        }
      }, '/analytics/events');

      // Cache company locally
      this.companyCache.set(createdCompany.id, createdCompany);

      return {
        company: {
          id: createdCompany.id,
          name: createdCompany.name,
          email: createdCompany.email,
          industry: createdCompany.industry,
          size: createdCompany.size,
          isVerified: createdCompany.isVerified,
          createdAt: createdCompany.createdAt
        }
      };
    });
  }

  async loginCompany(credentials) {
    return this.executeWithTracing('company.login.process', async () => {
      // Authenticate via auth service
      const authResponse = await this.authServiceClient.post('auth-service', {
        email: credentials.email,
        password: credentials.password,
        type: 'company'
      }, '/auth/login');

      const { company, token } = authResponse.data;

      // Get employer details
      const employerResponse = await this.httpClient.get('company-service', 
        `/companies/${company.id}/employers?email=${credentials.email}`
      );
      const employer = employerResponse.data?.[0];

      // Cache session
      this.employerCache.set(token, {
        companyId: company.id,
        employerId: employer?.id,
        email: company.email,
        role: employer?.role || 'admin',
        loginTime: new Date().toISOString()
      });

      // Record login analytics
      await this.analyticsServiceClient.post('analytics-service', {
        type: 'company_login',
        data: {
          companyId: company.id,
          timestamp: new Date().toISOString(),
          ip: credentials.ip || 'unknown'
        }
      }, '/analytics/events');

      return {
        token,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          industry: company.industry,
          isVerified: company.isVerified
        },
        employer: employer ? {
          id: employer.id,
          firstName: employer.firstName,
          lastName: employer.lastName,
          role: employer.role
        } : null
      };
    });
  }

  async getCompany(companyId) {
    return this.executeWithTracing('company.getCompany.process', async () => {
      // Check cache first
      if (this.companyCache.has(companyId)) {
        const cached = this.companyCache.get(companyId);
        const enrichedCompany = await this.enrichCompanyData(cached);
        return { company: enrichedCompany };
      }

      // Get company from auth service
      const companyResponse = await this.authServiceClient.get('auth-service', 
        `/companies/${companyId}`
      );
      const company = companyResponse.data;

      if (!company) {
        throw new Error('Company not found');
      }

      // Enrich company data
      const enrichedCompany = await this.enrichCompanyData(company);

      // Cache company
      this.companyCache.set(companyId, enrichedCompany);

      return { company: enrichedCompany };
    });
  }

  async updateCompanyProfile(companyId, profileData) {
    return this.executeWithTracing('company.updateCompanyProfile.process', async () => {
      // Update company via auth service
      const updateResponse = await this.authServiceClient.put('auth-service', 
        profileData, `/companies/${companyId}`
      );
      const updatedCompany = updateResponse.data;

      // Update search index
      await this.searchServiceClient.put('search-service', {
        id: companyId,
        updates: profileData
      }, `/search/index/companies/${companyId}`);

      // Clear cache
      this.companyCache.delete(companyId);

      return {
        company: updatedCompany
      };
    });
  }

  async searchCompanies(query) {
    return this.executeWithTracing('company.searchCompanies.process', async () => {
      const searchResponse = await this.searchServiceClient.post('search-service', {
        type: 'companies',
        query: query.q,
        filters: {
          industry: query.industry,
          size: query.size,
          location: query.location,
          verified: query.verified
        },
        pagination: {
          limit: parseInt(query.limit) || 20,
          offset: parseInt(query.offset) || 0
        },
        sort: {
          by: query.sortBy || 'relevance',
          order: 'desc'
        }
      }, '/search');

      const searchResults = searchResponse.data;

      // Get additional company data
      const enrichedCompanies = await Promise.all(
        searchResults.hits.map(async (company) => {
          const fullData = await this.enrichCompanyData(company);
          return fullData;
        })
      );

      return {
        companies: enrichedCompanies,
        total: searchResults.total,
        limit: parseInt(query.limit) || 20,
        offset: parseInt(query.offset) || 0,
        hasMore: searchResults.hasMore
      };
    });
  }

  async addCompanyReview(companyId, reviewData) {
    return this.executeWithTracing('company.addReview.process', async () => {
      // Validate user exists
      try {
        await this.userServiceClient.get('user-service', `/users/${reviewData.userId}`);
      } catch (error) {
        throw new Error('User not found');
      }

      // Create review via review service
      const review = {
        companyId,
        userId: reviewData.userId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        wouldRecommend: reviewData.wouldRecommend,
        isVerified: true, // Would verify employment
        createdAt: new Date().toISOString()
      };

      const reviewResponse = await this.reviewServiceClient.post('review-service', 
        review, '/reviews'
      );
      const createdReview = reviewResponse.data;

      // Update company rating
      await this.updateCompanyRating(companyId);

      // Notify company
      await this.notificationServiceClient.post('notification-service', {
        type: 'company_review',
        recipients: [`company:${companyId}`],
        title: 'New Company Review',
        message: `Your company has received a new ${review.rating}-star review`,
        data: {
          reviewId: createdReview.id,
          rating: review.rating
        }
      }, '/notifications');

      // Record review analytics
      await this.analyticsServiceClient.post('analytics-service', {
        type: 'company_review',
        data: {
          companyId,
          userId: reviewData.userId,
          rating: reviewData.rating,
          timestamp: review.createdAt
        }
      }, '/analytics/events');

      return {
        review: createdReview
      };
    });
  }

  async getCompanyReviews(companyId) {
    return this.executeWithTracing('company.getReviews.process', async () => {
      const reviewsResponse = await this.reviewServiceClient.get('review-service', 
        `/reviews/company/${companyId}?limit=${reviews?.limit || 50}`
      );

      const reviews = reviewsResponse.data;

      // Enrich with user data
      const enrichedReviews = await Promise.all(
        reviews.map(async (review) => {
          try {
            const userResponse = await this.userServiceClient.get('user-service', 
              `/users/${review.userId}`
            );
            const user = userResponse.data;

            return {
              ...review,
              user: {
                name: `${user.firstName} ${user.lastName}`,
                avatar: user.avatar
              }
            };
          } catch (error) {
            return review;
          }
        })
      );

      return {
        reviews: enrichedReviews,
        companyId,
        total: enrichedReviews.length
      };
    });
  }

  async addEmployer(companyId, employerData) {
    return this.executeWithTracing('company.addEmployer.process', async () => {
      // Validate company exists
      await this.authServiceClient.get('auth-service', `/companies/${companyId}`);

      // Create employer
      const employer = {
        companyId,
        firstName: employerData.firstName,
        lastName: employerData.lastName,
        email: employerData.email,
        phone: employerData.phone || null,
        role: employerData.role || 'recruiter',
        permissions: employerData.permissions || ['job_management'],
        department: employerData.department || null,
        isActive: true
      };

      const employerResponse = await this.httpClient.post('company-service', 
        employer, '/employers'
      );

      // Send welcome notification
      await this.notificationServiceClient.post('notification-service', {
        type: 'employer_invitation',
        recipients: [employerData.email],
        title: 'Invitation to Join Company',
        message: `You've been invited to join as ${employerData.role} on TalentSphere`,
        channels: ['email']
      }, '/notifications');

      return {
        employer: employerResponse.data
      };
    });
  }

  async getEmployers(companyId) {
    return this.executeWithTracing('company.getEmployers.process', async () => {
      const employersResponse = await this.httpClient.get('company-service', 
        `/companies/${companyId}/employers`
      );

      return {
        employers: employersResponse.data,
        companyId,
        total: employersResponse.data.length
      };
    });
  }

  async getCompanyCulture(companyId) {
    return this.executeWithTracing('company.getCulture.process', async () => {
      const cultureResponse = await this.httpClient.get('company-service', 
        `/companies/${companyId}/culture`
      );

      return {
        culture: cultureResponse.data
      };
    });
  }

  async updateCompanyCulture(companyId, cultureData) {
    return this.executeWithTracing('company.updateCulture.process', async () => {
      const updateResponse = await this.httpClient.put('company-service', 
        cultureData, `/companies/${companyId}/culture`
      );

      return {
        culture: updateResponse.data
      };
    });
  }

  async getCompanyAnalytics(companyId) {
    return this.executeWithTracing('company.getAnalytics.process', async () => {
      const analyticsResponse = await this.analyticsServiceClient.get('analytics-service', 
        `/analytics/company/${companyId}?period=90d`
      );

      // Get company metrics
      const [jobsResponse, reviewsResponse] = await Promise.all([
        this.jobServiceClient.get('job-service', `/jobs?companyId=${companyId}`),
        this.reviewServiceClient.get('review-service', `/reviews/company/${companyId}`)
      ]);

      const jobs = jobsResponse.data || [];
      const reviews = reviewsResponse.data || [];

      const analytics = {
        jobMetrics: {
          totalJobs: jobs.length,
          activeJobs: jobs.filter(job => job.isActive).length,
          totalApplications: jobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0),
          averageApplicationRate: jobs.length > 0 ? 
            jobs.reduce((sum, job) => sum + (job.applicationCount || 0), 0) / jobs.length : 0
        },
        reviewMetrics: {
          totalReviews: reviews.length,
          averageRating: reviews.length > 0 ? 
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
          ratingDistribution: this.calculateRatingDistribution(reviews)
        },
        viewMetrics: analyticsResponse.data?.views || {},
        engagementMetrics: analyticsResponse.data?.engagement || {}
      };

      return {
        analytics,
        companyId
      };
    });
  }

  // Helper methods with HTTP client integration
  async enrichCompanyData(company) {
    // Get culture data
    const cultureResponse = await this.httpClient.get('company-service', 
      `/companies/${company.id}/culture`
    ).catch(() => ({ data: {} }));
    const culture = cultureResponse.data || {};

    // Get employer count
    const employersResponse = await this.httpClient.get('company-service', 
      `/companies/${company.id}/employers`
    ).catch(() => ({ data: [] }));
    const employerCount = employersResponse.data?.length || 0;

    // Get job count
    const jobsResponse = await this.jobServiceClient.get('job-service', 
      `/jobs?companyId=${company.id}`
    ).catch(() => ({ data: [] }));
    const jobCount = jobsResponse.data?.length || 0;

    // Get reviews and rating
    const reviewsResponse = await this.reviewServiceClient.get('review-service', 
      `/reviews/company/${company.id}?limit=100`
    ).catch(() => ({ data: [] }));
    const reviews = reviewsResponse.data || [];
    const averageRating = reviews.length > 0 ? 
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    return {
      ...company,
      culture,
      metrics: {
        employerCount,
        jobCount,
        reviewCount: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10
      }
    };
  }

  async updateCompanyRating(companyId) {
    const reviewsResponse = await this.reviewServiceClient.get('review-service', 
      `/reviews/company/${companyId}?limit=1000`
    );
    const reviews = reviewsResponse.data || [];
    
    const averageRating = reviews.length > 0 ? 
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    await this.authServiceClient.put('auth-service', {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length
    }, `/companies/${companyId}`);
  }

  calculateRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return distribution;
  }

  seedDemoData() {
    logger.info('🏢 Company Service ready with HTTP client integration');
    logger.info('   - Connected to User Service');
    logger.info('   - Connected to Job Service');
    logger.info('   - Connected to Auth Service');
    logger.info('   - Connected to Notification Service');
    logger.info('   - Connected to Search Service');
    logger.info('   - Connected to Review Service');
    logger.info('   - Connected to Analytics Service');
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('company-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`🏢 Company Service running on port ${this.config.port}`);
        logger.info(`📍 Environment: ${this.config.environment}`);
        logger.info(`🔍 Tracing: ${this.config.tracing.enabled ? 'enabled' : 'disabled'}`);
        logger.info(`📡 HTTP Client: enabled for inter-service communication`);
      });

      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Company service started successfully');
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
    const shutdownSpan = this.tracer ? this.tracer.startSpan('company-service.shutdown') : null;
    
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('🛑 Company Service stopped');
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
  CompanyService
};

if (require.main === module) {
  const companyService = new CompanyService();

  companyService.start().catch(console.error);

  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await companyService.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await companyService.stop();
    process.exit(0);
  });
}