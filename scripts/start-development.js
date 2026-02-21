#!/usr/bin/env node

/**
 * TalentSphere Development Server
 * Start all services with proper database setup and monitoring
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const services = [
  {
    name: 'Database',
    command: 'docker-compose -f docker-compose.infrastructure.yml up -d',
    cwd: process.cwd(),
    color: '\x1b[36m', // Cyan
    healthCheck: {
      url: 'http://localhost:5432',
      timeout: 30000
    }
  },
  {
    name: 'API Gateway',
    command: 'node api-gateway/start-gateway.js',
    cwd: process.cwd(),
    color: '\x1b[35m', // Magenta
    healthCheck: {
      url: 'http://localhost:3000/health',
      timeout: 15000
    }
  },
  {
    name: 'Auth Service',
    command: 'node backends/backend-enhanced/auth-service/index.js',
    cwd: process.cwd(),
    port: 3001,
    color: '\x1b[32m', // Green
    healthCheck: {
      url: 'http://localhost:3001/health',
      timeout: 10000
    }
  },
  {
    name: 'Job Service',
    command: 'node backends/backend-enhanced/job-service/index.js',
    cwd: process.cwd(),
    port: 3003,
    color: '\x1b[33m', // Yellow
    healthCheck: {
      url: 'http://localhost:3003/health',
      timeout: 10000
    }
  },
  {
    name: 'Company Service',
    command: 'node backends/backend-enhanced/company-service/index.js',
    cwd: process.cwd(),
    port: 3006,
    color: '\x1b[34m', // Blue
    healthCheck: {
      url: 'http://localhost:3006/health',
      timeout: 10000
    }
  },
  {
    name: 'Frontend',
    command: 'npm start',
    cwd: path.join(process.cwd(), 'frontends/frontend-application'),
    port: 3000,
    color: '\x1b[31m', // Red
    healthCheck: {
      url: 'http://localhost:3000',
      timeout: 20000
    }
  }
];

// Health check function
async function checkHealth(url, timeout) {
  const http = require('http');
  
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);

    const req = http.get(url, (res) => {
      clearTimeout(timer);
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

// Execute command with colored output
function executeCommand(service) {
  return new Promise((resolve, reject) => {
    console.log(`\n${service.color}🚀 Starting ${service.name}...\x1b[0m`);
    console.log(`\x1b[90mCommand: ${service.command}\x1b[0m`);
    
    const child = spawn('cmd', ['/c', service.command], {
      shell: true,
      cwd: service.cwd,
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(`${service.color}${data.toString()}\x1b[0m`);
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(`\x1b[91m${data.toString()}\x1b[0m`); // Red for errors
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${service.name} started successfully`);
        resolve({ success: true, output, errorOutput });
      } else {
        console.log(`\n❌ ${service.name} failed with code ${code}`);
        resolve({ success: false, output, errorOutput, code });
      }
    });

    child.on('error', (error) => {
      console.log(`\n💥 ${service.name} failed to start: ${error.message}`);
      reject(error);
    });

    return child;
  });
}

// Start services in order
async function startServices() {
  console.log('\x1b[1m🎯 Starting TalentSphere Development Environment\x1b[0m');
  console.log('\n📋 Services to start:');
  services.forEach((service, index) => {
    console.log(`${index + 1}. ${service.color}${service.name}\x1b[0m (Port: ${service.port || 'N/A'})`);
  });

  console.log('\n⚡ Starting services...\n');

  try {
    // Start database first
    console.log('\x1b[36m📦 Starting infrastructure...\x1b[0m');
    
    // Wait a bit for database to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Start other services
    const results = await Promise.allSettled(
      services.slice(1).map(service => executeCommand(service))
    );

    // Check results
    const successful = results.filter(r => r.value?.success).length;
    const failed = results.filter(r => !r.value?.success).length;

    console.log(`\n📊 Results: ${successful} successful, ${failed} failed`);

    // Health checks
    console.log('\n🏥 Running health checks...');
    
    for (const service of services) {
      if (service.healthCheck) {
        const isHealthy = await checkHealth(
          service.healthCheck.url, 
          service.healthCheck.timeout
        );
        
        if (isHealthy) {
          console.log(`✅ ${service.name} is healthy`);
        } else {
          console.log(`❌ ${service.name} health check failed`);
        }
      }
    }

    // Display access information
    console.log('\n🌐 Access URLs:');
    console.log('\x1b[32mFrontend:\x1b[0m http://localhost:3000');
    console.log('\x1b[35mAPI Gateway:\x1b[0m http://localhost:3000');
    console.log('\x1b[36mDatabase (pgAdmin):\x1b[0m http://localhost:8080 (if running)');
    console.log('\x1b[33mRedis Commander:\x1b[0m http://localhost:8081 (if running)');

    console.log('\n📚 Documentation:');
    console.log('API Docs: http://localhost:3000/api/docs (when implemented)');
    console.log('Health Checks: http://localhost:3000/health');

    console.log('\n🎉 TalentSphere is ready for development!');

  } catch (error) {
    console.error('\💥 Failed to start services:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down TalentSphere...');
  
  // Kill all child processes
  spawn('taskkill', ['/F', '/IM', 'node.exe'], { shell: true });
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down TalentSphere...');
  spawn('taskkill', ['/F', '/IM', 'node.exe'], { shell: true });
  process.exit(0);
});

// Start the services
startServices().catch(console.error);