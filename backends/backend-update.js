/**
 * Service Integration Implementation for All Backend Services
 * Each backend service updated to use shared systems
 */

const { createService, serviceRegistry } = require('./shared/enhanced-service-template');
const { 
  coursesServiceConfig,
  challengesServiceConfig 
} = require('./shared/enhanced-service-template');

const { 
  executeBusinessLogic 
} = require('./shared/execution');

// =============================================================================
// UPDATE EXISTING SERVICES
// =============================================================================

/**
 * Update courses service with shared systems
 */
const updateCoursesService = () => {
  console.log('🔧 Updating courses service with shared systems...');
  
  const coursesService = createService(coursesServiceConfig);
  
  // Override service-specific methods
  coursesService.setupServiceRoutes = function() {
    // Courses endpoints
    coursesService.app.get('/api/v1/courses', ...coursesService.protectedRoute(
      validateRequest(this.schemas.courses.createCourse),
      this.handleGetCourses.bind(coursesService)
    ));
    
    coursesService.app.get('/api/v1/courses/:id', ...coursesService.protectedRoute(
      this.handleGetCourse.bind(coursesService)
    ));
    
    // Course modules
    coursesService.app.get('/api/v1/courses/:courseId/modules', ...coursesService.protectedRoute(
      this.handleGetModules.bind(coursesService)
    ));
    
    // Course enrollment
    coursesService.app.post('/api/v1/courses/:courseId/enroll', ...coursesService.protectedRoute(
      this.handleEnroll.bind(coursesService)
    ));
    
    // Progress tracking
    coursesService.app.get('/api/v1/courses/:courseId/progress', ...coursesService.protectedRoute(
      this.handleGetCourseProgress.bind(coursesService)
    ));
    
    // Course categories
    coursesService.app.get('/api/v1/categories', ...coursesService.protectedRoute(
      this.handleGetCategories.bind(coursesService)
    ));
    
    // Instructor dashboard
    coursesService.app.get('/api/v1/instructor/courses', ...coursesService.protectedRoute(
      this.handleInstructorCourses.bind(coursesService),
      { auth: ['admin', 'instructor'] }
    ));
    
    // Course analytics
    coursesService.app.get('/api/v1/analytics/courses', ...coursesService.protectedRoute(
      this.handleCourseAnalytics.bind(coursesService),
      { auth: ['admin']
    ));
  };

  // Start the updated courses service
  const server = coursesService.start();
  
  // Register service with API gateway
  serviceRegistry.set('courses', {
    name: coursesServiceConfig.name,
    url: coursesServiceConfig.url,
    port: coursesServiceConfig.port,
    status: 'unknown'
  });

  console.log('✅ Courses service updated with shared systems and started successfully!');
};

/**
 * Update challenges service with shared systems
 */
const updateChallengesService = () => {
  console.log('💻 Updating challenges service with shared systems...');
  
  const challengesService = createService(challengesServiceConfig);
  
  // Override service-specific methods
  challengesService.setupServiceRoutes = function() {
    // Challenges endpoints
    challengesService.app.get('/api/v1/challenges', ...challengesService.protectedRoute(
      this.handleGetChallenges.bind(challengesService)
    ));
    
    challengesService.app.get('/api/v1/challenges/:id', ...challengesService.protectedRoute(
      this.handleGetChallenge.bind(challengesService)
    ));
    
    challengesService.app.get('/api/v1/challenges/:id/submissions', ...challengesService.protectedRoute(
      this.handleGetSubmissions.bind(challengesService)
    ));
    
    challengesService.app.get('/api/v1/challenges/:id/solution', ...challengesService.protectedRoute(
      this.handleGetSolution.bind(challengesService)
    ));
    
    // Leaderboard
    challengesService.app.get('/api/v1/challenges/leaderboard', ...challengesService.protectedRoute(
      this.handleGetLeaderboard.bind(challengesService)
    ));
    
    // User challenges
    challengesService.app.get('/api/v1/users/:userId/challenges', ...challengesService.protectedRoute(
      this.handleUserChallenges.bind(challengesService)
      { auth: true }
    ));

    // Challenge creation
    challengesService.app.post('/api/v1/challenges', ...challengesService.protectedRoute(
      validateRequest(this.schemas.challenges.createChallenge),
      this.handleCreateChallenge.bind(challengesService)
    ));

    // Challenge evaluation
    challengesService.app.post('/api/v1/challenges/:id/evaluate', ...challengesService.protectedRoute(
      validateRequest({
        rating: {
          type: 'number',
          minimum: 1,
          maximum: 5
        },
        reviewContent: {
          type: 'text',
          minLength: 10,
          maxLength: 1000
        }
      }),
      this.handleEvaluateChallenge.bind(challengesService)
    ));

    // Challenge statistics
    challengesService.app.get('/api/v1/challenges/stats', ...challengesService.protectedRoute(
      { auth: ['admin'] }
    ));
  });

  // Start the updated challenges service
  const server = challengesService.start();
  
  // Register service with API gateway
  serviceRegistry.set('challenges', {
    name: challengesServiceConfig.name,
    url: challengesServiceConfig.url,
    port: challengesServiceConfig.port,
    status: 'unknown'
  });

  console.log('✅ Challenges service updated with shared systems and started successfully!');
};

/**
 * Update progress service with shared systems
 */
const updateProgressService = () => {
  console.log('📈 Updating progress service with shared systems...');
  
  const progressService = createService(config.ports.progress);
  
  // Override service-specific methods
  progressService.setupServiceRoutes = function() {
    // Progress endpoints
    progressService.app.get('/api/v1/progress/users/:userId', ...progressService.protectedRoute(
      this.handleGetUserProgress.bind(progressService),
      { auth: true }
    ));
    
    progressService.app.get('/api/v1/progress/users/:userId/achievements', ...progressService.protectedRoute(
      this.handleGetUserAchievements.bind(progressService),
      { auth: true }
    ));
    
    progressService.app.get('/api/v1/progress/users/:userId/courses/:courseId', ...progressService.protectedRoute(
      this.handleGetCourseProgress.bind(progressService),
      { auth: true }
    ));
    
    // Learning analytics
    progressService.app.get('/api/v1/analytics/learning/:userId', ...progressService.protectedRoute(
      this.handleLearningAnalytics.bind(progressService),
      { auth: true }
    ));
    
    // Statistics
    progressService.app.get('/api/v1/stats', ...progressService.protectedRoute(
      { auth: ['admin'] }
    ));
    
    // Daily activity
    progressService.app.get('/api/v1/activity/daily', ...progressService.protectedRoute(
      { auth: ['admin'] }
    ));
  });

  // Start the updated progress service
  const server = progressService.start();
  
  // Register service with API gateway
  serviceRegistry.set('progress', {
    name: progressServiceConfig.name,
    url: progressService.url,
    port: progressService.port,
    status: 'unknown'
  });

  console.log('✅ Progress service updated with shared systems and started successfully!');
};

// =============================================================================
// UPDATE PACKAGE.JSON FILES
// =============================================================================

/**
 * Update package.json files for all services to include new dependencies
 */
const updatePackageJson = (serviceName) => {
  const packageJsonPath = `./${serviceName}/package.json`;
  
  try {
    const packageJsonContent = require(packageJsonPath);
    if (!packageJsonContent.dependencies) {
      packageJsonContent.dependencies = {};
    }
    
    // Add shared systems dependencies
    packageJsonContent.dependencies = {
      ...packageJsonContent.dependencies,
      '@talentsphere/shared': 'file:../shared'
    };
    
    // Add error prevention and monitoring dependencies
    packageJsonContent.dependencies = {
      ...packageJsonContent.dependencies,
      'joi': '^17.9.2',
      'ajv': '^8.12.0',
      'helmet': '^7.2.0',
      'compression': '^1.19.4',
      'cors': '^2.8.5',
      'axios': '^1.6.2'
    };
    
    // Add development dependencies
    if (config.isDevelopment) {
      packageJsonContent.dependencies = {
        ...packageJsonContent.dependencies,
        'nodemon': '^3.0.2',
        'concurrently': '^7.0.2',
        'vitest': '^1.6.0',
        '@vitest/ui': '^1.6.0',
        'jest': '^29.7.0',
        '@testing-library/jest': '^29.7.0',
        '@testing-library/jest-dom': '^29.7.0',
        '@testing-library/user-event': '^14.5.1',
        '@testing-library/jest-mock': '^14.5.1'
      };
    }
    
    // Update package.json
    const updatedContent = JSON.stringify(packageJsonContent, null, 2);
    require('fs').writeFileSync(packageJsonPath, updatedContent);
    
    console.log(`✅ Updated ${serviceName}/package.json with shared systems dependencies`);
  } catch (error) {
    console.error(`❌ Error updating ${serviceName}/package.json:`, error.message);
  }
};

// =============================================================================
// UPDATE STARTUP SCRIPTS
// =============================================================================

/**
 * Update startup scripts to use enhanced services
 */
const updateStartupScript = (serviceName) => {
  const scriptPath = `./${serviceName}/start.js`;
  
  const currentContent = fs.existsSync(scriptPath) 
    ? fs.readFileSync(scriptPath, 'utf8')
    : '';
    
  const enhancedStartupScript = `/**
 * Enhanced ${serviceName} Service Startup Script
 * Uses shared systems and enhanced error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { enforceContracts } = require('../shared/contracts');
const { 
  createRequestContext, 
  authenticationFlow, 
  authorizationFlow, 
  validationFlow, 
  dataAccessFlow, 
  errorHandler 
} = require('../shared/execution');

const ${serviceName}Config = config[serviceName.toLowerCase()];
const { authServiceConfig } = require('./auth-service-config');

const app = express();
const PORT = ${serviceNameConfig.port};

// Setup middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(enforceContracts({
  validateResponses: true,
  strictMode: config.isDevelopment,
  logViolations: true
}));

// Request context and monitoring
app.use(createRequestContext);
app.use(performanceMonitor);

// Auth middleware for routes that need authentication
const authMiddleware = authenticationFlow();

// Routes
require('./${serviceName}-routes')(app, authMiddleware);

// Error handling
app.use(errorHandler);

// Health check
app.get('/health', async (req, res) => {
  const healthChecks = await performHealthChecks();
  
  const response = buildSuccessResponse({
    status: healthChecks.overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.3.0',
    environment: config.environment,
    service: serviceName,
    ...healthChecks
  }, req, {
    message: `${serviceName} is ${healthChecks.overallStatus}`
  });

  res.json(response);
});

// Start service
const server = app.listen(PORT, () => {
  console.log(`\n🚀 ${serviceName} service enhanced with shared systems started!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`🎯 Features: Contract Enforcement, Error Prevention, Performance Monitoring`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔍 API Gateway: http://localhost:8000`);
  console.log(`\n🛑 Enhanced Features:`);
  });
  console.log(`  ✅ Contract Enforcement`  );
  console.log(`  ✅ Error Prevention` );
  console.log(`  ✅ Performance Monitoring` );
  console.log(`  ✅ Circuit Breakers` );
  console.log(`  ✅ Graceful Degradation` );
  console.log(`  ✅ Request Tracing` );
  });

  return server;
};

// Start the enhanced service
const server = startEnhancedService();

// Export the server
module.exports = {
  enhancedService,
  startEnhancedService,
  updateServices,
  updatePackageJson
  serviceRegistry,
  updateStartupScript
  startServer
};