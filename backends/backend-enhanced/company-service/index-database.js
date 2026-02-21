/**
 * Company Service with Production Database Integration
 * 
 * Complete company management system with:
 * - PostgreSQL database persistence
 * - Company profiles and management
 * - Employee management
 * - Company verification and validation
 * - Integration with other services
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { EnhancedServiceWithTracing } = require('../../../../shared/enhanced-service-with-tracing');
const { validateRequest, validateResponse } = require('../../../../shared/validation');
const { ServiceContract } = require('../../../../shared/contracts');
const { getServiceClient } = require('../../../../shared/production-service-client');
const BaseRepository = require('../../../../shared/base-repository');
const DatabaseConnectionPool = require('../../../../shared/database-connection-pool');
const { createLogger } = require('../../../../shared/logger');

class CompanyService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'company-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.COMPANY_PORT || 3006,
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

    // Initialize database
    this.dbPool = new DatabaseConnectionPool('company-service');
    this.companyRepository = new BaseRepository('companies', 'company-service');
    this.companyLocationsRepository = new BaseRepository('company_locations', 'company-service');
    this.employeeRepository = new BaseRepository('employees', 'company-service');
    this.companyVerificationRepository = new BaseRepository('company_verifications', 'company-service');
    
    // Initialize service clients
    this.initializeServiceClients();
    
    // In-memory cache for frequently accessed data
    this.companyCache = new Map();
    this.verificationCache = new Map();
    
    this.logger = createLogger('CompanyService');
    
    // Initialize service contracts
    this.initializeContracts();
    
    // Create Express app
    this.app = express();
    this.server = null;
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  /**
   * Initialize service clients for inter-service communication
   */
  initializeServiceClients() {
    this.userServiceClient = getServiceClient('company-service');
    this.userProfileClient = getServiceClient('company-service');
    this.jobServiceClient = getServiceClient('company-service');
    this.notificationServiceClient = getServiceClient('company-service');
    this.analyticsServiceClient = getServiceClient('company-service');
    this.emailServiceClient = getServiceClient('company-service');
  }

  /**
   * Initialize service contracts
   */
  initializeContracts() {
    this.serviceContract = new ServiceContract('company-service');
    
    // Company creation schema
    this.serviceContract.defineOperation('createCompany', {
      inputSchema: {
        type: 'object',
        required: ['name', 'industry', 'size', 'createdBy'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string', maxLength: 2000 },
          industry: { type: 'string', enum: ['technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'consulting', 'other'] },
          size: { type: 'string', enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
          website: { type: 'string' },
          foundedYear: { type: 'number', minimum: 1800, maximum: new Date().getFullYear() },
          headquarters: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              postalCode: { type: 'string' }
            }
          },
          contact: {
            type: 'object',
            properties: {
              phone: { type: 'string' },
              email: { type: 'string' },
              website: { type: 'string' }
            }
          },
          socialMedia: {
            type: 'object',
            properties: {
              linkedin: { type: 'string' },
              twitter: { type: 'string' },
              facebook: { type: 'string' },
              instagram: { type: 'string' }
            }
          },
          benefits: {
            type: 'array',
            items: { type: 'string' }
          },
          culture: {
            type: 'object',
            properties: {
              values: { type: 'array', items: { type: 'string' } },
              description: { type: 'string', maxLength: 1000 }
            }
          },
          createdBy: { type: 'string' } // User ID of the creator
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          company: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' }
            }
          }
        }
      }
    });

    // Employee management schema
    this.serviceContract.defineOperation('addEmployee', {
      inputSchema: {
        type: 'object',
        required: ['companyId', 'userId', 'role'],
        properties: {
          companyId: { type: 'string' },
          userId: { type: 'string' },
          role: {
            type: 'string',
            enum: ['owner', 'admin', 'recruiter', 'hiring_manager', 'employee']
          },
          department: { type: 'string' },
          title: { type: 'string' },
          startDate: { type: 'string' },
          permissions: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          employee: { type: 'object' }
        }
      }
    });

    // Company verification schema
    this.serviceContract.defineOperation('verifyCompany', {
      inputSchema: {
        type: 'object',
        required: ['companyId', 'verificationType'],
        properties: {
          companyId: { type: 'string' },
          verificationType: {
            type: 'string',
            enum: ['email', 'phone', 'business_license', 'tax_id', 'domain']
          },
          verificationData: { type: 'object' },
          documents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                url: { type: 'string' },
                filename: { type: 'string' }
              }
            }
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          verification: { type: 'object' }
        }
      }
    });

    // Company search schema
    this.serviceContract.defineOperation('searchCompanies', {
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          industry: { type: 'string' },
          size: { type: 'string' },
          location: { type: 'string' },
          verified: { type: 'boolean' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', default: 0 }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          companies: { type: 'array' },
          pagination: { type: 'object' }
        }
      }
    });
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:", "https:"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization',
        'X-Request-ID', 'X-Correlation-ID', 'X-Service-Token'
      ]
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute per user
      keyGenerator: (req) => {
        return req.ip || req.connection?.remoteAddress || 'unknown';
      },
      message: {
        error: 'Too many requests from this IP',
        retryAfter: 60
      }
    }));

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Distributed tracing middleware
    this.app.use(this.getTracingMiddleware());

    // Request context middleware
    this.app.use((req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      req.correlationId = req.headers['x-correlation-id'] || uuidv4();
      
      res.setHeader('x-request-id', req.requestId);
      res.setHeader('x-correlation-id', req.correlationId);
      res.setHeader('x-service', this.config.serviceName);
      
      next();
    });
  }

  initializeRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getServiceHealth();
        res.json(health);
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error.message
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.getServiceMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({
          error: error.message
        });
      }
    });

    // Company CRUD operations
    this.app.post('/companies', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.createCompany', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.get('/companies/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getCompany', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/companies/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.updateCompany', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.delete('/companies/:id', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.deleteCompany', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company search
    this.app.get('/companies/search', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.searchCompanies', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Employee management
    this.app.get('/companies/:companyId/employees', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getEmployees', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/companies/:companyId/employees', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.addEmployee', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.put('/companies/:companyId/employees/:employeeId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.updateEmployee', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.delete('/companies/:companyId/employees/:employeeId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.removeEmployee', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company verification
    this.app.get('/companies/:id/verification', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getVerification', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/companies/:id/verification', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.verifyCompany', {
        validateInput: true,
        validateOutput: true
      });
    });

    // Company locations
    this.app.get('/companies/:companyId/locations', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getLocations', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.post('/companies/:companyId/locations', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.addLocation', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.put('/companies/:companyId/locations/:locationId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.updateLocation', {
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.delete('/companies/:companyId/locations/:locationId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.removeLocation', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Company statistics
    this.app.get('/companies/:id/stats', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'company.getCompanyStats', {
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
      case 'company.createCompany':
        return this.createCompany(request.body);
        
      case 'company.getCompany':
        return this.getCompany(request.params.id);
        
      case 'company.updateCompany':
        return this.updateCompany(request.params.id, request.body);
        
      case 'company.deleteCompany':
        return this.deleteCompany(request.params.id);
        
      case 'company.searchCompanies':
        return this.searchCompanies(request.query);
        
      case 'company.getEmployees':
        return this.getEmployees(request.params.companyId);
        
      case 'company.addEmployee':
        return this.addEmployee(request.params.companyId, request.body);
        
      case 'company.updateEmployee':
        return this.updateEmployee(request.params.companyId, request.params.employeeId, request.body);
        
      case 'company.removeEmployee':
        return this.removeEmployee(request.params.companyId, request.params.employeeId);
        
      case 'company.getVerification':
        return this.getVerification(request.params.id);
        
      case 'company.verifyCompany':
        return this.verifyCompany(request.params.id, request.body);
        
      case 'company.getLocations':
        return this.getLocations(request.params.companyId);
        
      case 'company.addLocation':
        return this.addLocation(request.params.companyId, request.body);
        
      case 'company.updateLocation':
        return this.updateLocation(request.params.companyId, request.params.locationId, request.body);
        
      case 'company.removeLocation':
        return this.removeLocation(request.params.companyId, request.params.locationId);
        
      case 'company.getCompanyStats':
        return this.getCompanyStats(request.params.id);
        
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  /**
   * Create company
   */
  async createCompany(companyData) {
    return this.executeWithTracing('company.createCompany.process', async () => {
      // Check if company name already exists
      const existingCompany = await this.companyRepository.findBy('name', companyData.name);
      if (existingCompany) {
        throw new Error('Company with this name already exists');
      }

      const company = await this.companyRepository.create({
        id: uuidv4(),
        name: companyData.name,
        description: companyData.description,
        industry: companyData.industry,
        size: companyData.size,
        website: companyData.website,
        foundedYear: companyData.foundedYear,
        headquarters: companyData.headquarters,
        contact: companyData.contact,
        socialMedia: companyData.socialMedia,
        benefits: companyData.benefits,
        culture: companyData.culture,
        status: 'pending_verification',
        verificationLevel: 'none',
        createdBy: companyData.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Add creator as owner
      await this.employeeRepository.create({
        id: uuidv4(),
        companyId: company.id,
        userId: companyData.createdBy,
        role: 'owner',
        status: 'active',
        permissions: ['full_access'],
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Cache the new company
      this.companyCache.set(company.id, company);

      // Send notification to user
      try {
        await this.notificationServiceClient.post('notification-service', {
          recipients: [{ userId: companyData.createdBy }],
          type: 'email',
          title: 'Company Created Successfully',
          message: `Your company "${companyData.name}" has been created and is pending verification.`,
          template: 'company_created',
          data: { companyName: companyData.name, companyId: company.id }
        }, '/notifications');
      } catch (error) {
        this.logger.warn('Failed to send company creation notification', {
          companyId: company.id,
          error: error.message
        });
      }

      return {
        success: true,
        company: {
          id: company.id,
          name: company.name,
          status: company.status,
          createdAt: company.createdAt
        }
      };
    });
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId) {
    return this.executeWithTracing('company.getCompany.process', async () => {
      // Check cache first
      let company = this.companyCache.get(companyId);
      
      if (!company) {
        company = await this.companyRepository.findById(companyId);
        if (!company) {
          throw new Error('Company not found');
        }
        
        // Cache for 5 minutes
        this.companyCache.set(companyId, company);
        setTimeout(() => this.companyCache.delete(companyId), 5 * 60 * 1000);
      }

      // Get employees count
      const employeeCount = await this.employeeRepository.count({ companyId, status: 'active' });
      
      // Get locations count
      const locationCount = await this.companyLocationsRepository.count({ companyId });
      
      // Get latest verification status
      const verification = await this.companyVerificationRepository.findFirst(
        { companyId },
        { orderBy: 'createdAt DESC' }
      );

      return {
        success: true,
        company: {
          ...company,
          stats: {
            employeeCount,
            locationCount,
            verification: verification ? {
              status: verification.status,
              level: verification.verificationType
            } : null
          }
        }
      };
    });
  }

  /**
   * Update company
   */
  async updateCompany(companyId, updateData) {
    return this.executeWithTracing('company.updateCompany.process', async () => {
      const existingCompany = await this.companyRepository.findById(companyId);
      if (!existingCompany) {
        throw new Error('Company not found');
      }

      const updatedCompany = await this.companyRepository.update(companyId, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      // Update cache
      this.companyCache.set(companyId, updatedCompany);

      return {
        success: true,
        company: updatedCompany
      };
    });
  }

  /**
   * Delete company
   */
  async deleteCompany(companyId) {
    return this.executeWithTracing('company.deleteCompany.process', async () => {
      const existingCompany = await this.companyRepository.findById(companyId);
      if (!existingCompany) {
        throw new Error('Company not found');
      }

      // Check if company has active employees
      const activeEmployees = await this.employeeRepository.count({ 
        companyId, 
        status: 'active' 
      });
      
      if (activeEmployees > 0) {
        throw new Error('Cannot delete company with active employees');
      }

      // Check if company has active job postings
      try {
        const jobCount = await this.jobServiceClient.get('job-service', `/companies/${companyId}/jobs/count`);
        if (jobCount.data.count > 0) {
          throw new Error('Cannot delete company with active job postings');
        }
      } catch (error) {
        this.logger.warn('Failed to check job postings for company deletion', {
          companyId,
          error: error.message
        });
      }

      await this.companyRepository.delete(companyId);
      
      // Remove from cache
      this.companyCache.delete(companyId);

      return {
        success: true
      };
    });
  }

  /**
   * Search companies
   */
  async searchCompanies(searchParams) {
    return this.executeWithTracing('company.searchCompanies.process', async () => {
      const { 
        query, 
        industry, 
        size, 
        location, 
        verified = false,
        limit = 20, 
        offset = 0 
      } = searchParams;

      const where = {};
      
      if (industry) where.industry = industry;
      if (size) where.size = size;
      if (verified) where.verificationLevel = { $ne: 'none' };

      // Full-text search for company name/description
      if (query) {
        where.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }

      const companies = await this.companyRepository.find(where, {
        orderBy: 'name ASC',
        limit,
        offset
      });

      // Get additional stats for each company
      const companiesWithStats = await Promise.all(
        companies.map(async (company) => {
          const employeeCount = await this.employeeRepository.count({ 
            companyId: company.id, 
            status: 'active' 
          });
          
          const locationCount = await this.companyLocationsRepository.count({ 
            companyId: company.id 
          });
          
          return {
            ...company,
            stats: {
              employeeCount,
              locationCount
            }
          };
        })
      );

      const total = await this.companyRepository.count(where);

      return {
        success: true,
        companies: companiesWithStats,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + companies.length < total
        }
      };
    });
  }

  /**
   * Get company employees
   */
  async getEmployees(companyId) {
    return this.executeWithTracing('company.getEmployees.process', async () => {
      // Verify company exists
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const employees = await this.employeeRepository.find({ 
        companyId, 
        status: 'active' 
      }, {
        orderBy: 'joinedAt DESC'
      });

      // Get user profiles for each employee
      const employeesWithProfiles = await Promise.all(
        employees.map(async (employee) => {
          try {
            const userProfile = await this.userProfileClient.get('user-profile-service', `/profiles/${employee.userId}`);
            return {
              ...employee,
              profile: userProfile.data
            };
          } catch (error) {
            this.logger.warn('Failed to get user profile for employee', {
              userId: employee.userId,
              error: error.message
            });
            return employee;
          }
        })
      );

      return {
        success: true,
        employees: employeesWithProfiles
      };
    });
  }

  /**
   * Add employee to company
   */
  async addEmployee(companyId, employeeData) {
    return this.executeWithTracing('company.addEmployee.process', async () => {
      // Verify company exists
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Check if user already exists as employee
      const existingEmployee = await this.employeeRepository.findFirst({
        companyId,
        userId: employeeData.userId,
        status: 'active'
      });

      if (existingEmployee) {
        throw new Error('User is already an employee of this company');
      }

      // Get user profile to verify user exists
      try {
        await this.userProfileClient.get('user-profile-service', `/profiles/${employeeData.userId}`);
      } catch (error) {
        throw new Error('User not found');
      }

      const employee = await this.employeeRepository.create({
        id: uuidv4(),
        companyId,
        userId: employeeData.userId,
        role: employeeData.role,
        department: employeeData.department,
        title: employeeData.title,
        startDate: employeeData.startDate,
        permissions: employeeData.permissions || this.getDefaultPermissions(employeeData.role),
        status: 'active',
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Send notification to new employee
      try {
        await this.notificationServiceClient.post('notification-service', {
          recipients: [{ userId: employeeData.userId }],
          type: 'email',
          title: 'Welcome to the Company',
          message: `You have been added as ${employeeData.role} at ${company.name}`,
          template: 'employee_added',
          data: { 
            companyName: company.name, 
            role: employeeData.role,
            companyId: companyId 
          }
        }, '/notifications');
      } catch (error) {
        this.logger.warn('Failed to send employee addition notification', {
          employeeId: employee.id,
          error: error.message
        });
      }

      return {
        success: true,
        employee
      };
    });
  }

  /**
   * Update employee
   */
  async updateEmployee(companyId, employeeId, updateData) {
    return this.executeWithTracing('company.updateEmployee.process', async () => {
      const existingEmployee = await this.employeeRepository.findFirst({
        companyId,
        id: employeeId
      });

      if (!existingEmployee) {
        throw new Error('Employee not found');
      }

      const updatedEmployee = await this.employeeRepository.update(employeeId, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        employee: updatedEmployee
      };
    });
  }

  /**
   * Remove employee from company
   */
  async removeEmployee(companyId, employeeId) {
    return this.executeWithTracing('company.removeEmployee.process', async () => {
      const existingEmployee = await this.employeeRepository.findFirst({
        companyId,
        id: employeeId
      });

      if (!existingEmployee) {
        throw new Error('Employee not found');
      }

      // Cannot remove the owner
      if (existingEmployee.role === 'owner') {
        throw new Error('Cannot remove company owner');
      }

      await this.employeeRepository.update(employeeId, {
        status: 'inactive',
        leftAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true
      };
    });
  }

  /**
   * Get company verification status
   */
  async getVerification(companyId) {
    return this.executeWithTracing('company.getVerification.process', async () => {
      const verification = await this.companyVerificationRepository.findFirst(
        { companyId },
        { orderBy: 'createdAt DESC' }
      );

      if (!verification) {
        return {
          success: true,
          verification: null
        };
      }

      return {
        success: true,
        verification
      };
    });
  }

  /**
   * Verify company
   */
  async verifyCompany(companyId, verificationData) {
    return this.executeWithTracing('company.verifyCompany.process', async () => {
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Create verification record
      const verification = await this.companyVerificationRepository.create({
        id: uuidv4(),
        companyId,
        verificationType: verificationData.verificationType,
        verificationData: verificationData.verificationData,
        documents: verificationData.documents,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update company verification level
      await this.companyRepository.update(companyId, {
        verificationLevel: verificationData.verificationType,
        updatedAt: new Date().toISOString()
      });

      // Update cache
      const updatedCompany = await this.companyRepository.findById(companyId);
      this.companyCache.set(companyId, updatedCompany);

      // Send notification for admin review
      try {
        await this.notificationServiceClient.post('notification-service', {
          recipients: [{ userId: company.createdBy }],
          type: 'email',
          title: 'Company Verification Submitted',
          message: `Your verification for ${company.name} has been submitted and is under review.`,
          template: 'verification_submitted',
          data: { 
            companyName: company.name,
            verificationType: verificationData.verificationType,
            verificationId: verification.id
          }
        }, '/notifications');
      } catch (error) {
        this.logger.warn('Failed to send verification notification', {
          verificationId: verification.id,
          error: error.message
        });
      }

      return {
        success: true,
        verification
      };
    });
  }

  /**
   * Get company locations
   */
  async getLocations(companyId) {
    return this.executeWithTracing('company.getLocations.process', async () => {
      const locations = await this.companyLocationsRepository.find(
        { companyId },
        { orderBy: 'name ASC' }
      );

      return {
        success: true,
        locations
      };
    });
  }

  /**
   * Add company location
   */
  async addLocation(companyId, locationData) {
    return this.executeWithTracing('company.addLocation.process', async () => {
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const location = await this.companyLocationsRepository.create({
        id: uuidv4(),
        companyId,
        name: locationData.name,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        postalCode: locationData.postalCode,
        coordinates: locationData.coordinates,
        isHeadquarters: locationData.isHeadquarters || false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        location
      };
    });
  }

  /**
   * Update company location
   */
  async updateLocation(companyId, locationId, updateData) {
    return this.executeWithTracing('company.updateLocation.process', async () => {
      const existingLocation = await this.companyLocationsRepository.findFirst({
        companyId,
        id: locationId
      });

      if (!existingLocation) {
        throw new Error('Location not found');
      }

      const updatedLocation = await this.companyLocationsRepository.update(locationId, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        location: updatedLocation
      };
    });
  }

  /**
   * Remove company location
   */
  async removeLocation(companyId, locationId) {
    return this.executeWithTracing('company.removeLocation.process', async () => {
      const existingLocation = await this.companyLocationsRepository.findFirst({
        companyId,
        id: locationId
      });

      if (!existingLocation) {
        throw new Error('Location not found');
      }

      // Cannot delete headquarters
      if (existingLocation.isHeadquarters) {
        throw new Error('Cannot delete headquarters location');
      }

      await this.companyLocationsRepository.delete(locationId);

      return {
        success: true
      };
    });
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId) {
    return this.executeWithTracing('company.getCompanyStats.process', async () => {
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const [employeeCount, locationCount, verification] = await Promise.all([
        this.employeeRepository.count({ companyId, status: 'active' }),
        this.companyLocationsRepository.count({ companyId }),
        this.companyVerificationRepository.findFirst(
          { companyId },
          { orderBy: 'createdAt DESC' }
        )
      ]);

      // Get job statistics
      let jobStats = {};
      try {
        const jobResponse = await this.jobServiceClient.get('job-service', `/companies/${companyId}/stats`);
        jobStats = jobResponse.data || {};
      } catch (error) {
        this.logger.warn('Failed to get job statistics', {
          companyId,
          error: error.message
        });
      }

      return {
        success: true,
        stats: {
          company: {
            name: company.name,
            industry: company.industry,
            size: company.size,
            status: company.status,
            verificationLevel: company.verificationLevel,
            createdAt: company.createdAt
          },
          employees: {
            total: employeeCount,
            active: employeeCount
          },
          locations: {
            total: locationCount
          },
          verification: verification ? {
            status: verification.status,
            type: verification.verificationType,
            submittedAt: verification.submittedAt
          } : null,
          jobs: jobStats
        }
      };
    });
  }

  /**
   * Get default permissions for a role
   */
  getDefaultPermissions(role) {
    const permissionMap = {
      owner: ['full_access'],
      admin: ['manage_employees', 'manage_jobs', 'view_analytics'],
      recruiter: ['manage_jobs', 'view_applications'],
      hiring_manager: ['view_applications', 'manage_interviews'],
      employee: ['view_company_info']
    };

    return permissionMap[role] || [];
  }

  /**
   * Get service health
   */
  async getServiceHealth() {
    const dbHealth = await this.dbPool.checkHealth();
    
    return {
      service: 'company-service',
      status: 'healthy',
      database: dbHealth,
      cache: {
        companyCache: this.companyCache.size,
        verificationCache: this.verificationCache.size
      },
      timestamp: new Date().toISOString()
    };
  }

  async getServiceMetrics() {
    const dbMetrics = this.dbPool.getPoolStats();
    const companyCount = await this.companyRepository.count();
    const employeeCount = await this.employeeRepository.count();

    return {
      service: 'company-service',
      metrics: {
        database: dbMetrics,
        companies: {
          total: companyCount,
          cached: this.companyCache.size
        },
        employees: {
          total: employeeCount
        }
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
    }

    await this.dbPool.shutdown();
    
    this.logger.info('Company service shutdown complete');
  }

  /**
   * Graceful startup
   */
  async start() {
    await this.dbPool.initialize();
    
    this.server = this.app.listen(this.config.port, () => {
      logger.info(`🏢 Company Service running on port ${this.config.port}`);
      logger.info(`📍 Database: PostgreSQL connected`);
      logger.info(`👥 Employee management: enabled`);
      logger.info(`✅ Company verification: enabled`);
      logger.info(`🏭 Location management: enabled`);
    });

    const startupSpan = this.tracer ? this.tracer.startSpan('company-service.startup') : null;
    
    try {
      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('Company service started successfully');
      }

      this.server.on('error', (error) => {
        if (startupSpan) {
          startupSpan.logError(error);
          startupSpan.finish();
        }
      });

      if (startupSpan) {
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
}

module.exports = {
  CompanyService
};

// Auto-start if this is main module
if (require.main === module) {
  const companyService = new CompanyService();
  
  companyService.start().catch(console.error);

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await companyService.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await companyService.shutdown();
    process.exit(0);
  });
}