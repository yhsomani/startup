/**
 * TalentSphere Backend Service Template
 * Standardized service configuration with proper CORS and API structure
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('../shared/config');
const corsMiddleware = require('../shared/middleware/cors');

// Service configuration
const serviceName = process.env.SERVICE_NAME || 'unknown';
const serviceConfig = config.getServiceConfig(serviceName);

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(corsMiddleware);

// Rate limiting
if (config.rateLimit.enabled) {
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.3.0',
    environment: config.environment
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: serviceName,
    version: '2.3.0',
    description: `TalentSphere ${serviceName} microservice`,
    endpoints: getEndpoints(),
    documentation: `${config.apiUrls.gateway}/api/docs`
  });
});

// Standard API routes
app.get('/api/v1', (req, res) => {
  res.json({
    service: serviceName,
    version: '2.3.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Helper function to get service endpoints
function getEndpoints() {
  const baseEndpoints = [
    'GET /health',
    'GET /api/info',
    'GET /api/v1'
  ];

  switch (serviceName) {
    case 'auth':
      return [
        ...baseEndpoints,
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/logout',
        'POST /api/v1/auth/refresh',
        'GET /api/v1/auth/profile',
        'PUT /api/v1/auth/profile',
        'POST /api/v1/auth/reset-password'
      ];
    
    case 'courses':
      return [
        ...baseEndpoints,
        'GET /api/v1/courses',
        'POST /api/v1/courses',
        'GET /api/v1/courses/:id',
        'PUT /api/v1/courses/:id',
        'DELETE /api/v1/courses/:id',
        'POST /api/v1/courses/:id/enroll',
        'GET /api/v1/courses/:id/modules'
      ];
    
    case 'challenges':
      return [
        ...baseEndpoints,
        'GET /api/v1/challenges',
        'POST /api/v1/challenges',
        'GET /api/v1/challenges/:id',
        'PUT /api/v1/challenges/:id',
        'POST /api/v1/challenges/:id/submit',
        'GET /api/v1/challenges/:id/submissions',
        'GET /api/v1/challenges/leaderboard'
      ];
    
    case 'progress':
      return [
        ...baseEndpoints,
        'GET /api/v1/progress/users/:userId',
        'POST /api/v1/progress/users/:userId/courses/:courseId',
        'GET /api/v1/progress/users/:userId/achievements',
        'GET /api/v1/progress/analytics'
      ];
    
    case 'notifications':
      return [
        ...baseEndpoints,
        'GET /api/v1/notifications',
        'POST /api/v1/notifications',
        'PUT /api/v1/notifications/:id/read',
        'DELETE /api/v1/notifications/:id'
      ];
    
    case 'ai':
      return [
        ...baseEndpoints,
        'POST /api/v1/ai/recommendations',
        'POST /api/v1/ai/code-review',
        'POST /api/v1/ai/qanda',
        'POST /api/v1/ai/content-suggestions'
      ];
    
    default:
      return baseEndpoints;
  }
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found for ${serviceName} service`,
      availableEndpoints: getEndpoints()
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${serviceName} Error]:`, err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.message
      }
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  // Default error
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Start server
const server = app.listen(serviceConfig.port, () => {
  console.log(`\n🚀 ${serviceName} service started successfully!`);
  console.log(`📡 Service URL: http://localhost:${serviceConfig.port}`);
  console.log(`💚 Health Check: http://localhost:${serviceConfig.port}/health`);
  console.log(`📚 API Info: http://localhost:${serviceConfig.port}/api/info`);
  console.log(`🌐 CORS Origins: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`\n📋 Available Endpoints:`);
  getEndpoints().forEach(endpoint => {
    console.log(`  ${endpoint}`);
  });
  console.log('');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📡 ${signal} received, shutting down ${serviceName} gracefully...`);
  
  server.close(() => {
    console.log(`✅ ${serviceName} service closed successfully`);
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error(`❌ ${serviceName} service did not close gracefully, forcing shutdown`);
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server };