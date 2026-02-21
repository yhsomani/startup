#!/usr/bin/env node

/**
 * Gateway Service Registration Script
 * 
 * Automatically registers all TalentSphere services with the API Gateway
 * and starts the gateway with proper service discovery
 */

const { getServicePort } = require('../shared/ports');
const { EnhancedGateway } = require('./gateway-with-tracing');

// Service definitions
const services = [
  {
    name: 'auth',
    port: getServicePort('user-auth-service'),
    path: 'auth'
  },
  {
    name: 'user',
    port: getServicePort('user-service'),
    path: 'users'
  },
  {
    name: 'job',
    port: getServicePort('job-service'),
    path: 'jobs'
  },
  {
    name: 'company',
    port: getServicePort('company-service'),
    path: 'companies'
  },
  {
    name: 'application',
    port: getServicePort('application-service'),
    path: 'applications'
  },
  {
    name: 'network',
    port: getServicePort('network-service'),
    path: 'network'
  },
  {
    name: 'message',
    port: getServicePort('message-service'),
    path: 'messages'
  },
  {
    name: 'notification',
    port: getServicePort('notification-service'),
    path: 'notifications'
  }
];

async function initializeGateway() {
  console.log('🚀 Initializing TalentSphere API Gateway...');
  
  const gateway = new EnhancedGateway({
    port: process.env.GATEWAY_PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    enableTracing: process.env.ENABLE_TRACING !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    }
  });

  // Register all services
  console.log('📡 Registering services with gateway...');
  
  for (const service of services) {
    try {
      const serviceUrl = `http://localhost:${service.port}`;
      await gateway.serviceRegistry.registerService(service.name, serviceUrl, {
        circuitBreaker: {
          timeout: 5000,
          maxFailures: 3,
          resetTimeout: 30000
        },
        healthCheck: {
          interval: 30000,
          timeout: 5000,
          path: '/health'
        }
      });
      
      console.log(`✅ Registered ${service.name} service at ${serviceUrl}`);
    } catch (error) {
      console.error(`❌ Failed to register ${service.name} service:`, error.message);
    }
  }

  // Start the gateway
  try {
    await gateway.start();
    
    console.log('\n🎉 Gateway started successfully!');
    console.log(`📍 Gateway URL: http://localhost:${gateway.config.port}`);
    console.log(`🔍 Health Check: http://localhost:${gateway.config.port}/health`);
    console.log(`📊 Status: http://localhost:${gateway.config.port}/status`);
    
    console.log('\n📡 Registered Services:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ Service    │ Port │ Gateway Endpoint               │');
    console.log('├─────────────────────────────────────────────────┤');
    
    for (const service of services) {
      const endpoint = `/api/v1/${service.name}/*`;
      console.log(`│ ${service.name.padEnd(10)} │ ${service.port.toString().padEnd(4)} │ ${endpoint.padEnd(31)} │`);
    }
    
    console.log('└─────────────────────────────────────────────────┘');
    
    console.log('\n💡 Example API Calls:');
    console.log(`   POST http://localhost:${gateway.config.port}/api/v1/auth/login`);
    console.log(`   GET  http://localhost:${gateway.config.port}/api/v1/jobs`);
    console.log(`   GET  http://localhost:${gateway.config.port}/api/v1/users/profile`);
    
  } catch (error) {
    console.error('❌ Failed to start gateway:', error);
    process.exit(1);
  }

  return gateway;
}

// Start the gateway
if (require.main === module) {
  let gateway = null;
  
  initializeGateway()
    .then((gw) => {
      gateway = gw;
    })
    .catch((error) => {
      console.error('💥 Gateway initialization failed:', error);
      process.exit(1);
    });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received, shutting down gateway gracefully...`);
    
    if (gateway) {
      try {
        await gateway.stop();
        console.log('✅ Gateway stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error stopping gateway:', error);
        process.exit(1);
      }
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

module.exports = {
  initializeGateway,
  services
};