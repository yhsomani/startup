/**
 * Company Service with Distributed Tracing Integration
 * Complete employer and company management service
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getServicePort, getServiceUrl } = require('../../../../shared/ports');
const { getServiceConfig } = require('../../../../shared/environment');
const { EnhancedServiceWithTracing } = require('../../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../shared/validation');
const { ServiceContract } = require('../../shared/contracts');
const { getDatabaseManager } = require('../../shared/database-connection');

class CompanyService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'company-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: getServicePort('company-service'),
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

  initializeContracts() {
    // Define service contracts for validation
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
      const span = this.tracer ? this.tracer.startSpan('company.health', req.traceContext) : null;
      
      if (span) {
        span.setTag('component', 'company-service');
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

  // Operation implementations
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
      // Check if company already exists
      if (this.companies.has(companyData.email)) {
        throw new Error('Company with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(companyData.password, 10);

      // Create company
      const company = {
        id: uuidv4(),
        name: companyData.name,
        email: companyData.email,
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
        password: hashedPassword,
        isVerified: false,
        isApproved: true,
        isActive: true,
        subscription: {
          plan: 'basic',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          features: ['basic_job_posting', 'company_profile']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.companies.set(companyData.email, company);

      // Create initial company culture
      const culture = {
        companyId: company.id,
        mission: null,
        vision: null,
        values: [],
        benefits: [],
        workEnvironment: null,
        diversity: null,
        workLifeBalance: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.companyCulture.set(company.id, culture);

      // Create primary employer
      const employer = {
        id: uuidv4(),
        companyId: company.id,
        firstName: companyData.firstName || 'Company',
        lastName: companyData.lastName || 'Admin',
        email: companyData.email,
        role: 'admin',
        permissions: ['all'],
        isActive: true,
        createdAt: new Date().toISOString()
      };

      this.employers.set(employer.id, employer);

      return {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          industry: company.industry,
          size: company.size,
          isVerified: company.isVerified,
          createdAt: company.createdAt
        }
      };
    });
  }

  async loginCompany(credentials) {
    return this.executeWithTracing('company.login.process', async () => {
      // Find company
      const company = this.companies.get(credentials.email);
      if (!company) {
        throw new Error('Invalid credentials');
      }

      // Check if company is active
      if (!company.isActive) {
        throw new Error('Company account is deactivated');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, company.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Get employer
      const employer = Array.from(this.employers.values()).find(e => e.email === company.email);
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          companyId: company.id, 
          employerId: employer?.id,
          email: company.email,
          role: employer?.role || 'admin'
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

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
      // Find company
      const company = Array.from(this.companies.values()).find(c => c.id === companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Get company culture
      const culture = this.companyCulture.get(companyId) || {};
      
      // Get employer count
      const employers = Array.from(this.employers.values()).filter(e => e.companyId === companyId);
      
      // Get job count
      const jobs = this.companyJobs.get(companyId) || [];
      
      // Get reviews
      const reviews = Array.from(this.companyReviews.values()).filter(r => r.companyId === companyId);
      const averageRating = reviews.length > 0 ? 
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

      return {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          industry: company.industry,
          size: company.size,
          website: company.website,
          description: company.description,
          headquarters: company.headquarters,
          contact: company.contact,
          logoUrl: company.logoUrl,
          bannerUrl: company.bannerUrl,
          socialMedia: company.socialMedia,
          isVerified: company.isVerified,
          isApproved: company.isApproved,
          subscription: company.subscription,
          createdAt: company.createdAt
        },
        culture,
        stats: {
          employerCount: employers.length,
          jobCount: jobs.length,
          reviewCount: reviews.length,
          averageRating: Math.round(averageRating * 10) / 10
        }
      };
    });
  }

  async updateCompanyProfile(companyId, profileData) {
    return this.executeWithTracing('company.updateCompanyProfile.process', async () => {
      // Find company
      const company = Array.from(this.companies.values()).find(c => c.id === companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Update company
      const updatedCompany = {
        ...company,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      this.companies.set(company.email, updatedCompany);

      return {
        company: {
          id: updatedCompany.id,
          name: updatedCompany.name,
          email: updatedCompany.email,
          industry: updatedCompany.industry,
          size: updatedCompany.size,
          website: updatedCompany.website,
          description: updatedCompany.description,
          logoUrl: updatedCompany.logoUrl,
          bannerUrl: updatedCompany.bannerUrl,
          socialMedia: updatedCompany.socialMedia,
          updatedAt: updatedCompany.updatedAt
        }
      };
    });
  }

  async searchCompanies(query) {
    return this.executeWithTracing('company.searchCompanies.process', async () => {
      const { 
        q: searchTerm, 
        industry, 
        size, 
        location, 
        verified = false,
        limit = 20, 
        offset = 0 
      } = query;
      
      let companies = Array.from(this.companies.values());

      // Filter verified companies
      if (verified === 'true') {
        companies = companies.filter(c => c.isVerified);
      }

      // Filter by industry
      if (industry) {
        companies = companies.filter(c => c.industry === industry);
      }

      // Filter by size
      if (size) {
        companies = companies.filter(c => c.size === size);
      }

      // Filter by location
      if (location) {
        const locationTerm = location.toLowerCase();
        companies = companies.filter(c => 
          (c.headquarters?.city && c.headquarters.city.toLowerCase().includes(locationTerm)) ||
          (c.headquarters?.state && c.headquarters.state.toLowerCase().includes(locationTerm)) ||
          (c.headquarters?.country && c.headquarters.country.toLowerCase().includes(locationTerm))
        );
      }

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        companies = companies.filter(c => 
          c.name.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term) ||
          c.industry.toLowerCase().includes(term)
        );
      }

      // Get full profiles for results
      const results = companies.slice(offset, offset + limit).map(company => {
        const culture = this.companyCulture.get(company.id) || {};
        const employers = Array.from(this.employers.values()).filter(e => e.companyId === company.id);
        const jobs = this.companyJobs.get(company.id) || [];
        const reviews = Array.from(this.companyReviews.values()).filter(r => r.companyId === company.id);
        const averageRating = reviews.length > 0 ? 
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

        return {
          id: company.id,
          name: company.name,
          industry: company.industry,
          size: company.size,
          website: company.website,
          description: company.description,
          headquarters: company.headquarters,
          logoUrl: company.logoUrl,
          isVerified: company.isVerified,
          stats: {
            employerCount: employers.length,
            jobCount: jobs.length,
            reviewCount: reviews.length,
            averageRating: Math.round(averageRating * 10) / 10
          },
          createdAt: company.createdAt
        };
      });

      return {
        companies: results,
        total: companies.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    });
  }

  async addCompanyReview(companyId, reviewData) {
    return this.executeWithTracing('company.addReview.process', async () => {
      // Verify company exists
      const company = Array.from(this.companies.values()).find(c => c.id === companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Check if user has already reviewed
      const existingReview = Array.from(this.companyReviews.values())
        .find(r => r.companyId === companyId && r.userId === reviewData.userId);
      
      if (existingReview) {
        throw new Error('You have already reviewed this company');
      }

      const review = {
        id: uuidv4(),
        companyId,
        userId: reviewData.userId,
        rating: reviewData.rating, // 1-5
        title: reviewData.title,
        comment: reviewData.comment,
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        wouldRecommend: reviewData.wouldRecommend || false,
        isVerified: false, // Would be verified by checking if user actually worked there
        helpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.companyReviews.set(review.id, review);

      return {
        review: {
          id: review.id,
          companyId,
          userId: review.userId,
          rating: review.rating,
          title: review.title,
          createdAt: review.createdAt
        }
      };
    });
  }

  async getCompanyReviews(companyId) {
    return this.executeWithTracing('company.getReviews.process', async () => {
      const reviews = Array.from(this.companyReviews.values())
        .filter(r => r.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        reviews,
        companyId,
        total: reviews.length
      };
    });
  }

  async addEmployer(companyId, employerData) {
    return this.executeWithTracing('company.addEmployer.process', async () => {
      // Verify company exists
      const company = Array.from(this.companies.values()).find(c => c.id === companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Check if email already exists
      const existingEmployer = Array.from(this.employers.values())
        .find(e => e.email === employerData.email);
      
      if (existingEmployer) {
        throw new Error('Employer with this email already exists');
      }

      const employer = {
        id: uuidv4(),
        companyId,
        firstName: employerData.firstName,
        lastName: employerData.lastName,
        email: employerData.email,
        phone: employerData.phone || null,
        title: employerData.title || null,
        department: employerData.department || null,
        role: employerData.role || 'recruiter',
        permissions: employerData.permissions || ['view_applications'],
        isActive: true,
        createdAt: new Date().toISOString()
      };

      this.employers.set(employer.id, employer);

      return {
        employer: {
          id: employer.id,
          companyId,
          firstName: employer.firstName,
          lastName: employer.lastName,
          email: employer.email,
          role: employer.role,
          createdAt: employer.createdAt
        }
      };
    });
  }

  async getEmployers(companyId) {
    return this.executeWithTracing('company.getEmployers.process', async () => {
      const employers = Array.from(this.employers.values())
        .filter(e => e.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        employers: employers.map(e => ({
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          title: e.title,
          department: e.department,
          role: e.role,
          isActive: e.isActive,
          createdAt: e.createdAt
        })),
        companyId,
        total: employers.length
      };
    });
  }

  async getCompanyCulture(companyId) {
    return this.executeWithTracing('company.getCulture.process', async () => {
      const culture = this.companyCulture.get(companyId);
      
      if (!culture) {
        throw new Error('Company culture information not found');
      }

      return { culture };
    });
  }

  async updateCompanyCulture(companyId, cultureData) {
    return this.executeWithTracing('company.updateCulture.process', async () => {
      // Verify company exists
      const company = Array.from(this.companies.values()).find(c => c.id === companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Get existing culture
      const culture = this.companyCulture.get(companyId) || {
        companyId,
        mission: null,
        vision: null,
        values: [],
        benefits: [],
        workEnvironment: null,
        diversity: null,
        workLifeBalance: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update culture
      const updatedCulture = {
        ...culture,
        ...cultureData,
        updatedAt: new Date().toISOString()
      };

      this.companyCulture.set(companyId, updatedCulture);

      return {
        culture: updatedCulture
      };
    });
  }

  async getCompanyAnalytics(companyId) {
    return this.executeWithTracing('company.getAnalytics.process', async () => {
      // Verify company exists
      const company = Array.from(this.companies.values()).find(c => c.id === companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Get data for analytics
      const employers = Array.from(this.employers.values()).filter(e => e.companyId === companyId);
      const jobs = this.companyJobs.get(companyId) || [];
      const reviews = Array.from(this.companyReviews.values()).filter(r => r.companyId === companyId);
      
      // Calculate analytics
      const analytics = {
        overview: {
          totalEmployers: employers.length,
          totalJobs: jobs.length,
          totalReviews: reviews.length,
          averageRating: reviews.length > 0 ? 
            Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0,
          accountAge: Math.floor((Date.now() - new Date(company.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        },
        engagement: {
          profileViews: Math.floor(Math.random() * 1000) + 100, // Demo data
          jobViews: Math.floor(Math.random() * 5000) + 500,
          applicationsReceived: Math.floor(Math.random() * 200) + 20
        },
        performance: {
          responseRate: Math.floor(Math.random() * 30) + 70, // 70-100%
          averageTimeToHire: Math.floor(Math.random() * 20) + 10, // 10-30 days
          offerAcceptanceRate: Math.floor(Math.random() * 20) + 80 // 80-100%
        },
        trends: {
          jobPostingGrowth: Math.floor(Math.random() * 20) - 10, // -10% to +10%
          applicationGrowth: Math.floor(Math.random() * 25) - 5, // -5% to +20%
          reviewTrend: 'positive' // Demo data
        }
      };

      return {
        company: {
          id: company.id,
          name: company.name
        },
        analytics,
        generatedAt: new Date().toISOString()
      };
    });
  }

  seedDemoData() {
    // Create demo companies
    const demoCompanies = [
      {
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        password: 'password123',
        industry: 'technology',
        size: '201-500',
        website: 'https://techcorp.com',
        description: 'Leading technology company specializing in innovative software solutions and digital transformation.',
        headquarters: {
          address: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          zipCode: '94105',
          coordinates: { lat: 37.7749, lng: -122.4194 }
        },
        firstName: 'John',
        lastName: 'Manager'
      },
      {
        name: 'HealthCare Plus',
        email: 'careers@healthcareplus.com',
        password: 'password123',
        industry: 'healthcare',
        size: '1000+',
        website: 'https://healthcareplus.com',
        description: 'Comprehensive healthcare provider dedicated to patient care and medical innovation.',
        headquarters: {
          address: '456 Medical Ave',
          city: 'Boston',
          state: 'MA',
          country: 'USA',
          zipCode: '02108',
          coordinates: { lat: 42.3601, lng: -71.0589 }
        },
        firstName: 'Sarah',
        lastName: 'Director'
      }
    ];

    demoCompanies.forEach(companyData => {
      try {
        this.registerCompany(companyData);
      } catch (error) {
        // Company might already exist
      }
    });

    logger.info('🏢 Demo companies created for Company Service');
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('company-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`🏢 Company Service running on port ${this.config.port}`);
        logger.info(`📍 Environment: ${this.config.environment}`);
        logger.info(`🔍 Tracing: ${this.config.tracing.enabled ? 'enabled' : 'disabled'}`);
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

// Create and export service instance
module.exports = {
  CompanyService
};

// Auto-start if this is the main module
if (require.main === module) {
  const companyService = new CompanyService();

  companyService.start().catch(console.error);

  // Graceful shutdown
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