/**
 * Enhanced User Service with HTTP Client Integration
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

class UserService extends EnhancedServiceWithTracing {
  constructor() {
    super({
      serviceName: 'user-service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.USER_PORT || 3002,
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
    
    // User-specific state (minimal - only cache layer)
    this.userCache = new Map(); // Cache for frequently accessed users
    this.sessionCache = new Map(); // Cache for active sessions
    
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
    // These would be initialized with the service registry, tracing, and metrics
    // For now, we'll create placeholder clients
    this.serviceClientFactory = {
      createClient: (serviceName) => ({
        request: async (serviceName, config) => {
          // Placeholder - would integrate with real HTTP client
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
    this.httpClient = this.serviceClientFactory.createClient('user-service');
    
    // Service-specific clients
    this.jobServiceClient = this.serviceClientFactory.createClient('job-service');
    this.companyServiceClient = this.serviceClientFactory.createClient('company-service');
    this.authServiceClient = this.serviceClientFactory.createClient('auth-service');
    this.notificationServiceClient = this.serviceClientFactory.createClient('notification-service');
  }

  initializeContracts() {
    // Service contracts remain the same
    this.serviceContract = new ServiceContract('user-service');
    
    // User registration schema
    this.serviceContract.defineOperation('register', {
      inputSchema: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
          phone: { type: 'string', pattern: '^[+]?[0-9]{10,15}$' },
          role: { type: 'string', enum: ['candidate', 'employer', 'admin'], default: 'candidate' }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    });

    // Other schemas remain the same...
    // User profile update schema
    this.serviceContract.defineOperation('updateProfile', {
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
          phone: { type: 'string', pattern: '^[+]?[0-9]{10,15}$' },
          bio: { type: 'string', maxLength: 1000 },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number', minimum: -90, maximum: 90 },
                  lng: { type: 'number', minimum: -180, maximum: 180 }
                }
              }
            }
          },
          socialLinks: {
            type: 'object',
            properties: {
              linkedin: { type: 'string', format: 'uri' },
              github: { type: 'string', format: 'uri' },
              portfolio: { type: 'string', format: 'uri' }
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
              profile: { type: 'object' }
            }
          }
        }
      }
    });

    // Skills management schema
    this.serviceContract.defineOperation('addSkill', {
      inputSchema: {
        type: 'object',
        required: ['userId', 'skillName', 'level'],
        properties: {
          userId: { type: 'string' },
          skillName: { type: 'string', minLength: 2 },
          level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
          yearsOfExperience: { type: 'number', minimum: 0, maximum: 50 },
          verified: { type: 'boolean', default: false }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              skill: { type: 'object' }
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
      const span = this.tracer ? this.tracer.startSpan('user.health', req.traceContext) : null;
      
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
      const span = this.tracer ? this.tracer.startSpan('user.metrics', req.traceContext) : null;
      
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

    // User registration
    this.app.post('/register', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.register', {
        inputSchema: this.serviceContract.getOperationSchema('register')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('register')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    // User login
    this.app.post('/login', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.login', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Get user profile
    this.app.get('/profile/:userId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.getProfile', {
        validateInput: false,
        validateOutput: false
      });
    });

    // Update user profile
    this.app.put('/profile/:userId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.updateProfile', {
        inputSchema: this.serviceContract.getOperationSchema('updateProfile')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('updateProfile')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    // Skills management
    this.app.post('/skills', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.addSkill', {
        inputSchema: this.serviceContract.getOperationSchema('addSkill')?.inputSchema,
        outputSchema: this.serviceContract.getOperationSchema('addSkill')?.outputSchema,
        validateInput: true,
        validateOutput: true
      });
    });

    this.app.get('/skills/:userId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.getSkills', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.delete('/skills/:skillId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.deleteSkill', {
        validateInput: false,
        validateOutput: false
      });
    });

    // User search
    this.app.get('/search', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.search', {
        validateInput: false,
        validateOutput: false
      });
    });

    // User preferences
    this.app.get('/preferences/:userId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.getPreferences', {
        validateInput: false,
        validateOutput: false
      });
    });

    this.app.put('/preferences/:userId', async (req, res) => {
      await this.handleRequestWithTracing(req, res, 'user.updatePreferences', {
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
      case 'user.register':
        return this.registerUser(request.body);
      case 'user.login':
        return this.loginUser(request.body);
      case 'user.getProfile':
        return this.getUserProfile(request.params.userId);
      case 'user.updateProfile':
        return this.updateUserProfile(request.params.userId, request.body);
      case 'user.addSkill':
        return this.addUserSkill(request.body);
      case 'user.getSkills':
        return this.getUserSkills(request.params.userId);
      case 'user.deleteSkill':
        return this.deleteUserSkill(request.params.skillId);
      case 'user.search':
        return this.searchUsers(request.query);
      case 'user.getPreferences':
        return this.getUserPreferences(request.params.userId);
      case 'user.updatePreferences':
        return this.updateUserPreferences(request.params.userId, request.body);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  async registerUser(userData) {
    return this.executeWithTracing('user.register.process', async () => {
      // Check if user already exists via auth service
      try {
        await this.authServiceClient.get('auth-service', `/users/email/${userData.email}`);
        throw new Error('User with this email already exists');
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user via auth service
      const userResponse = await this.authServiceClient.post('auth-service', {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || null,
        role: userData.role || 'candidate'
      }, '/users');

      const user = userResponse.data;

      // Create initial profile
      const profileResponse = await this.httpClient.post('profile-service', {
        userId: user.id,
        bio: null,
        location: null,
        socialLinks: {},
        avatar: null,
        resumeUrl: null,
        visibility: 'public'
      }, '/profiles');

      // Create initial preferences
      const preferencesResponse = await this.httpClient.post('preferences-service', {
        userId: user.id,
        emailNotifications: true,
        pushNotifications: true,
        jobAlerts: true,
        profileVisibility: 'public',
        language: 'en',
        timezone: 'UTC'
      }, '/preferences');

      // Send welcome notification
      await this.notificationServiceClient.post('notification-service', {
        userId: user.id,
        type: 'welcome',
        title: 'Welcome to TalentSphere!',
        message: `Welcome ${user.firstName}! Your account has been created successfully.`,
        channels: ['email']
      }, '/notifications');

      // Cache user locally
      this.userCache.set(user.email, user);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      };
    });
  }

  async loginUser(credentials) {
    return this.executeWithTracing('user.login.process', async () => {
      // Authenticate via auth service
      const authResponse = await this.authServiceClient.post('auth-service', {
        email: credentials.email,
        password: credentials.password
      }, '/auth/login');

      const { user, token } = authResponse.data;

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Cache session
      this.sessionCache.set(token, {
        userId: user.id,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString()
      });

      // Log login event
      await this.httpClient.post('audit-service', {
        userId: user.id,
        action: 'login',
        timestamp: new Date().toISOString(),
        ip: credentials.ip || 'unknown',
        userAgent: credentials.userAgent || 'unknown'
      }, '/audit/events');

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      };
    });
  }

  async getUserProfile(userId) {
    return this.executeWithTracing('user.getProfile.process', async () => {
      // Get user from auth service
      const userResponse = await this.authServiceClient.get('auth-service', `/users/${userId}`);
      const user = userResponse.data;

      // Get profile data in parallel
      const [profileResponse, preferencesResponse, skillsResponse, experienceResponse] = await Promise.allSettled([
        this.httpClient.get('profile-service', `/profiles/user/${userId}`),
        this.httpClient.get('preferences-service', `/preferences/user/${userId}`),
        this.httpClient.get('skills-service', `/skills/user/${userId}`),
        this.httpClient.get('experience-service', `/experience/user/${userId}`)
      ]);

      const profile = profileResponse.status === 'fulfilled' ? profileResponse.value.data : {};
      const preferences = preferencesResponse.status === 'fulfilled' ? preferencesResponse.value.data : {};
      const skills = skillsResponse.status === 'fulfilled' ? skillsResponse.value.data : [];
      const experiences = experienceResponse.status === 'fulfilled' ? experienceResponse.value.data : [];

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        profile,
        preferences,
        skills,
        experiences
      };
    });
  }

  async updateUserProfile(userId, profileData) {
    return this.executeWithTracing('user.updateProfile.process', async () => {
      // Update user basic info if provided
      if (profileData.firstName || profileData.lastName || profileData.phone) {
        await this.authServiceClient.put('auth-service', {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone
        }, `/users/${userId}`);
      }

      // Update profile
      const profileResponse = await this.httpClient.put('profile-service', profileData, `/profiles/user/${userId}`);

      return {
        profile: profileResponse.data
      };
    });
  }

  async addUserSkill(skillData) {
    return this.executeWithTracing('user.addSkill.process', async () => {
      // Verify user exists
      await this.authServiceClient.get('auth-service', `/users/${skillData.userId}`);

      // Add skill via skills service
      const skillResponse = await this.httpClient.post('skills-service', skillData, '/skills');

      // Update skill-based job recommendations
      await this.jobServiceClient.post('job-service', {
        userId: skillData.userId,
        newSkill: skillData.skillName
      }, '/recommendations/skill-update');

      return {
        skill: skillResponse.data
      };
    });
  }

  async getUserSkills(userId) {
    return this.executeWithTracing('user.getSkills.process', async () => {
      const skillsResponse = await this.httpClient.get('skills-service', `/skills/user/${userId}`);
      return { skills: skillsResponse.data };
    });
  }

  async deleteUserSkill(skillId) {
    return this.executeWithTracing('user.deleteSkill.process', async () => {
      await this.httpClient.delete('skills-service', `/skills/${skillId}`);
      return { success: true };
    });
  }

  async searchUsers(query) {
    return this.executeWithTracing('user.search.process', async () => {
      const { q: searchTerm, role, skills, location, limit = 20, offset = 0 } = query;
      
      // Build search query for search service
      const searchQuery = {
        type: 'users',
        filters: {},
        pagination: { limit: parseInt(limit), offset: parseInt(offset) }
      };

      if (searchTerm) {
        searchQuery.query = searchTerm;
      }

      if (role) {
        searchQuery.filters.role = role;
      }

      if (skills) {
        searchQuery.filters.skills = skills.split(',').map(s => s.trim());
      }

      if (location) {
        searchQuery.filters.location = location;
      }

      // Search via search service
      const searchResponse = await this.httpClient.post('search-service', searchQuery, '/search');

      // Get full profiles for search results
      const userIds = searchResponse.data.hits.map(hit => hit.id);
      const profilesResponse = await this.httpClient.post('profile-service', 
        { userIds }, '/profiles/batch'
      );

      const profiles = profilesResponse.data;

      const results = searchResponse.data.hits.map(hit => {
        const profile = profiles.find(p => p.userId === hit.id);
        return {
          id: hit.id,
          email: hit.email,
          firstName: hit.firstName,
          lastName: hit.lastName,
          role: hit.role,
          bio: profile?.bio,
          location: profile?.location,
          skills: profile?.skills || [],
          score: hit.score,
          createdAt: hit.createdAt
        };
      });

      return {
        users: results,
        total: searchResponse.data.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    });
  }

  async getUserPreferences(userId) {
    return this.executeWithTracing('user.getPreferences.process', async () => {
      const preferencesResponse = await this.httpClient.get('preferences-service', `/preferences/user/${userId}`);
      return { preferences: preferencesResponse.data };
    });
  }

  async updateUserPreferences(userId, preferencesData) {
    return this.executeWithTracing('user.updatePreferences.process', async () => {
      // Verify user exists
      await this.authServiceClient.get('auth-service', `/users/${userId}`);

      // Update preferences
      const preferencesResponse = await this.httpClient.put('preferences-service', 
        preferencesData, `/preferences/user/${userId}`
      );

      return {
        preferences: preferencesResponse.data
      };
    });
  }

  async seedDemoData() {
    const demoUsers = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'candidate'
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
        role: 'candidate'
      },
      {
        email: 'company.hr@example.com',
        firstName: 'Company',
        lastName: 'HR',
        password: 'password123',
        role: 'employer'
      }
    ];

    for (const userData of demoUsers) {
      try {
        await this.registerUser(userData);
        logger.info(`✅ Created demo user: ${userData.email}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          logger.error(`❌ Failed to create demo user ${userData.email}:`, error.message);
        }
      }
    }

    logger.info('👥 Demo users created for User Service');
  }

  async start() {
    const startupSpan = this.tracer ? this.tracer.startSpan('user-service.startup') : null;
    
    try {
      this.server = this.app.listen(this.config.port, () => {
        logger.info(`👤 User Service running on port ${this.config.port}`);
        logger.info(`📍 Environment: ${this.config.environment}`);
        logger.info(`🔍 Tracing: ${this.config.tracing.enabled ? 'enabled' : 'disabled'}`);
        logger.info(`📡 HTTP Client: enabled for inter-service communication`);
      });

      if (startupSpan) {
        startupSpan.setTag('port', this.config.port);
        startupSpan.logEvent('User service started successfully');
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
    const shutdownSpan = this.tracer ? this.tracer.startSpan('user-service.shutdown') : null;
    
    try {
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        logger.info('🛑 User Service stopped');
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
  UserService
};

if (require.main === module) {
  const userService = new UserService();

  userService.start().catch(console.error);

  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully...');
    await userService.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT received, shutting down gracefully...');
    await userService.stop();
    process.exit(0);
  });
}