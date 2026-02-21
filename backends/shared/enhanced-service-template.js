/**
 * Enhanced Backend Service Template with Shared Systems Integration
 * All backend services updated to use shared validation, execution, and monitoring
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { buildSuccessResponse, buildErrorResponse, enforceContracts, ContractMonitor } = require('../shared/contracts');
const { 
  createRequestContext, 
  authenticationFlow, 
  authorizationFlow, 
  validationFlow, 
  dataAccessFlow, 
  executeBusinessLogic, 
  errorHandler,
  performanceMonitor,
  sequenceValidator 
} = require('../shared/execution');
const { validateRequest } = require('../shared/validation');
const { errorMonitor, errorPrevention } = require('../shared/monitoring');
const config = require('../shared/config');

/**
 * Create enhanced service with all shared systems
 */
class EnhancedService {
  constructor(serviceConfig) {
    this.config = serviceConfig;
    this.app = express();
    this.serviceName = serviceConfig.name || 'unknown';
    this.version = serviceConfig.version || '2.3.0';
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware stack
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        }
      }
    }));

    // CORS middleware with shared configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy violation'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    }));

    // Compression
    this.app.use(compression());

    // Contract enforcement
    this.app.use(enforceContracts({
      validateResponses: true,
      strictMode: config.isDevelopment,
      logViolations: true
    }));

    // Shared middleware stack
    this.app.use(createRequestContext);
    this.app.use(performanceMonitor);
  }

  /**
   * Setup routes with enhanced error handling
   */
  setupRoutes() {
    // Health check with service details
    this.app.get('/health', this.createHealthCheckHandler());
    
    // API info with contract details
    this.app.get('/api/info', this.createInfoHandler());
    
    // Service-specific routes (to be overridden)
    this.setupServiceRoutes();
    
    // Contract testing endpoint
    if (config.isDevelopment) {
      this.app.get('/api/test/contracts', this.createContractTestHandler());
    }
  }

  /**
   * Enhanced error handling
   */
  setupErrorHandling() {
    this.app.use(errorHandler);
    
    // 404 handler
    this.app.use('*', (req, res) => {
      const response = buildErrorResponse(
        'NOT_FOUND',
        `${req.method} ${req.originalUrl} not found`,
        req,
        {
          availableEndpoints: this.getAvailableEndpoints()
        }
      );
      res.status(404).json(response);
    });
  }

  /**
   * Create health check handler
   */
  createHealthCheckHandler() {
    return async (req, res) => {
      const healthChecks = await this.performHealthChecks();
      
      const response = buildSuccessResponse({
        status: healthChecks.overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.version,
        environment: config.environment,
        service: this.serviceName,
        ...healthChecks
      }, req, {
        message: `${this.serviceName} is ${healthChecks.overallStatus}`
      });

      res.json(response);
    };
  }

  /**
   * Create info handler
   */
  createInfoHandler() {
    return (req, res) => {
      const response = buildSuccessResponse({
        service: this.serviceName,
        version: this.version,
        description: this.config.description || `TalentSphere ${this.serviceName} microservice`,
        endpoints: this.getAvailableEndpoints(),
        contracts: this.getImplementedContracts(),
        features: this.getServiceFeatures(),
        dependencies: this.config.dependencies || [],
        documentation: `${config.apiUrls.gateway}/docs/${this.serviceName}`,
        health: `${config.apiUrls.gateway}/health/${this.serviceName}`
      }, req);

      res.json(response);
    };
  }

  /**
   * Perform comprehensive health checks
   */
  async performHealthChecks() {
    const checks = {};
    
    // Database connection check
    if (this.config.database) {
      try {
        await this.checkDatabaseHealth();
        checks.database = { status: 'healthy', message: 'Database connection successful' };
      } catch (error) {
        checks.database = { status: 'unhealthy', error: error.message };
      }
    }

    // Redis connection check
    if (this.config.redis) {
      try {
        await this.checkRedisHealth();
        checks.redis = { status: 'healthy', message: 'Redis connection successful' };
      } catch (error) {
        checks.redis = { status: 'unhealthy', error: error.message };
      }
    }

    // External service check
    if (this.config.externalServices) {
      checks.externalServices = await this.checkExternalServices();
    }

    // Contract compliance check
    checks.contracts = this.validateContracts();

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    checks.memory = {
      status: memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external
      rss: memoryUsage.rss
    };

    // Calculate overall status
    const allChecks = Object.values(checks).filter(check => 
      typeof check === 'object' ? check.status !== 'unhealthy' : check !== 'unhealthy'
    );
    const overallStatus = allChecks.length > 0 && allChecks.every(status => status) ? 'healthy' : 'degraded';

    return {
      overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    // This would be implemented based on the service's database configuration
    // For now, return a mock implementation
    return { status: 'healthy' };
  }

  /**
   * Check Redis health
   */
  async checkRedisHealth() {
    // This would be implemented based on Redis configuration
    return { status: 'healthy' };
  }

  /**
   * Check external services
   */
  async checkExternalServices() {
    const results = {};
    
    if (this.config.externalServices) {
      for (const [serviceName, config] of Object.entries(this.config.externalServices)) {
        try {
          const startTime = Date.now();
          const response = await fetch(config.healthCheck, { timeout: 5000 });
          const responseTime = Date.now() - startTime;
          
          results[serviceName] = {
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime,
            lastCheck: new Date().toISOString()
          };
        } catch (error) {
          results[serviceName] = {
            status: 'unhealthy',
            error: error.message,
            lastCheck: new Date().toISOString()
          };
        }
      }
    }
    
    return results;
  }

  /**
   * Validate service contracts
   */
  validateContracts() {
    const contracts = this.getImplementedContracts();
    const results = {};
    
    for (const [contractName, contract] of contracts) {
      // Mock validation - in real implementation, this would validate against shared contracts
      results[contractName] = {
        status: 'valid',
        validatedAt: new Date().toISOString()
      };
    }
    
    return results;
  }

  /**
   * Get available endpoints
   */
  getAvailableEndpoints() {
    // Get all registered routes
    const routes = [];
    
    this.app._router.stack.forEach(layer => {
      if (layer.route) {
        routes.push({
          method: Object.keys(layer.route.methods)[0].toUpperCase(),
          path: layer.route.path
        });
      }
    });

    return routes;
  }

  /**
   * Get implemented contracts
   */
  getImplementedContracts() {
    // Mock implementation - would return actual contracts
    return {
      standardResponse: { implemented: true },
      userSchema: { implemented: true },
      businessLogic: { implemented: true }
    };
  }

  /**
   * Get service features
   */
  getServiceFeatures() {
    return {
      authentication: this.config.features?.authentication || false,
      validation: true,
      monitoring: true,
      contractEnforcement: true,
      errorPrevention: true,
      performanceMonitoring: true,
      circuitBreaker: false,
      healthChecks: true
    };
  }

  /**
   * Setup service-specific routes (to be overridden)
   */
  setupServiceRoutes() {
    // This method should be overridden by each service
    // Example implementation:
    // this.app.get('/api/v1/resource', this.getResourceHandler());
  }

  /**
   * Get enhanced response builder with contract validation
   */
  buildResponse(data, options = {}) {
    return buildSuccessResponse(data, this.app.request, options);
  }

  /**
   * Get enhanced error response with validation
   */
  buildErrorResponse(code, message, options = {}) {
    return buildErrorResponse(code, message, this.app.request, options);
  }

  /**
   * Create protected route with all middleware
   */
  protectedRoute(validator, handler, options = {}) {
    const middlewares = [];
    
    if (options.auth) {
      middlewares.push(authenticationFlow);
    }
    
    if (options.roles) {
      middlewares.push(authorizationFlow(options.roles));
    }
    
    if (validator) {
      middlewares.push(validationFlow(validator));
    }
    
    if (options.sequence) {
      middlewares.push(sequenceValidator(options.sequence));
    }
    
    middlewares.push(dataAccessFlow(options.dataAccess));
    
    return [...middlewares, executeBusinessLogic(this.config.businessLogic)];
  }

  /**
   * Create service with proper error handling
   */
  createServer() {
    this.app.use(errorHandler);
    return this.app;
  }

  /**
   * Start the service with monitoring
   */
  async start() {
    const port = this.config.port || config.ports[this.serviceName.toLowerCase()];
    
    console.log(`\n🚀 Starting ${this.serviceName} Service...`);
    console.log(`📡 Port: ${port}`);
    console.log(`🔗 Version: ${this.version}`);
    console.log(`🌍 Environment: ${config.environment}`);
    
    const server = this.createServer();
    
    server.listen(port, () => {
      console.log(`\n✅ ${this.serviceName} Service Started Successfully!`);
      console.log(`📡 Server: http://localhost:${port}`);
      console.log(`🏥 Health: http://localhost:${port}/health`);
      
      if (config.isDevelopment) {
        console.log(`🔧 Development Mode: Enabled`);
        console.log(`📊 Contract Testing: http://localhost:${port}/api/test/contracts`);
      }
      
      // Start service monitoring
      this.startMonitoring();
    });
    
    return server;
  }

  /**
   * Start service monitoring
   */
  startMonitoring() {
    // Health check every 30 seconds
    setInterval(async () => {
      try {
        const health = await this.performHealthChecks();
        
        if (health.overallStatus === 'unhealthy') {
          console.error(`\n🚨 ${this.serviceName} Service Health Alert!`);
          console.error(`Status: ${health.overallStatus}`);
          Object.entries(health.checks).forEach(([name, check]) => {
            if (check.status === 'unhealthy') {
              console.error(`  ❌ ${name}: ${check.error || 'Unknown error'}`);
            }
          });
        }
      }
      } catch (error) {
        console.error(`Health check failed for ${this.serviceName}:`, error.message);
      }
    }, 30000);

    // Log performance metrics every minute
    setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      
      // Alert on slow operations
      if (metrics.averageResponseTime > 1000) {
        console.warn(`⚠️ Slow Operation Alert in ${this.serviceName}: ${metrics.averageResponseTime}ms average response time`);
      }
    }, 60000);
  }
}

/**
 * Create a service with enhanced features
 */
function createService(serviceConfig) {
  return new EnhancedService(serviceConfig);
}

/**
 * Example authentication service configuration
 */
const authServiceConfig = {
  name: 'auth',
  version: '2.3.0',
  description: 'Authentication and authorization service',
  port: config.ports.auth,
  database: {
    type: 'postgresql',
    connection: config.database.url
  },
  redis: {
    type: 'redis',
    host: config.redis.host,
    port: config.redis.port
  },
  externalServices: {
    apiGateway: {
      healthCheck: `${config.apiUrls.gateway}/health/auth`
    }
  },
  features: {
    authentication: true,
    validation: true
  },
  businessLogic: async (req) => {
    // Business logic implementation
    return { data: { message: 'Success' } };
  }
};

/**
 * Example courses service configuration
 */
const coursesServiceConfig = {
  name: 'courses',
  version: 'requiredSequences: ['course-intro', 'course-basics'],
    description: 'Course management and content delivery service',
  port: config.ports.courses,
  database: config.database,
  redis: config.redis,
  businessLogic: async (req) => {
    // Business logic with sequence validation
    if (req.user && req.user.progress) {
      await validateSequenceDependencies(req, ['course-intro', 'course-basics']);
    }
    return { data: { message: 'Success' } };
  }
};

/**
 * Example challenges service configuration
 */
const challengesServiceConfig = {
  name: 'challenges',
  version: '2.3.0',
  description: 'Coding challenges and submission service',
  port: config.ports.challenges,
  database: config.database,
  features: {
    validation: true,
    contractEnforcement: true
  },
  businessLogic: async (req) => {
    // Business logic implementation
    return { data: { message: 'Success' } };
  }
};

module.exports = {
  EnhancedService,
  createService,
  authServiceConfig,
  coursesServiceConfig,
  challengesServiceConfig,
  serviceRegistry
};