/**
 * TalentSphere Service Startup Script
 * Standardized startup for all backend services
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Service configurations
const services = [
  {
    name: 'API Gateway',
    script: 'api-gateway/index.js',
    port: 8000,
    required: true
  },
  {
    name: 'Auth Service',
    script: 'backends/backend-flask/app.py',
    port: 5000,
    required: true,
    python: true
  },
  {
    name: 'Notification Service',
    script: 'backends/backend-node/server.js',
    port: 3030,
    required: true
  },
  {
    name: 'Collaboration Service',
    script: 'backends/collaboration-service/server.js',
    port: 1234,
    required: true
  },
  {
    name: 'Video Service',
    script: 'backends/backend-dotnet/VideoStreamingService.dll',
    port: 5062,
    required: false,
    dotnet: true
  },
  {
    name: 'Progress Service',
    script: 'backends/backend-spring-boot.jar',
    port: 8080,
    required: false,
    java: true
  },
  {
    name: 'AI Assistant',
    script: 'backends/backend-assistant/server.js',
    port: 5005,
    required: false
  }
];

// Frontend MFEs
const frontends = [
  {
    name: 'Shell MFE',
    script: 'frontend/ts-mfe-shell',
    port: 3000,
    command: 'npm run dev'
  },
  {
    name: 'LMS MFE',
    script: 'frontend/ts-mfe-lms',
    port: 3001,
    command: 'npm run dev'
  },
  {
    name: 'Challenge MFE',
    script: 'frontend/ts-mfe-challenge',
    port: 3002,
    command: 'npm run dev'
  }
];

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Process storage
const processes = new Map();

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function getServiceColor(index) {
  const serviceColors = [colors.cyan, colors.green, colors.yellow, colors.magenta, colors.blue];
  return serviceColors[index % serviceColors.length];
}

function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => resolve(false));
  });
}

function startService(service, type, index) {
  const color = getServiceColor(index);
  const serviceName = service.name;
  const scriptPath = path.resolve(service.script);

  log(`\n🚀 Starting ${serviceName}...`, color);
  
  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    log(`❌ Script not found: ${scriptPath}`, colors.red);
    if (service.required) {
      process.exit(1);
    }
    return null;
  }

  // Check if port is available
  checkPort(service.port).then(isAvailable => {
    if (!isAvailable) {
      log(`⚠️  Port ${service.port} is already in use for ${serviceName}`, colors.yellow);
    }
  });

  let command, args;
  
  if (service.python) {
    command = 'python';
    args = [scriptPath];
  } else if (service.java) {
    command = 'java';
    args = ['-jar', scriptPath];
  } else if (service.dotnet) {
    command = 'dotnet';
    args = [scriptPath];
  } else if (service.command) {
    [command, ...args] = service.command.split(' ');
    args = args || [];
    // Change to script directory for frontend MFEs
    process.chdir(scriptPath);
  } else {
    command = 'node';
    args = [scriptPath];
  }

  const process = spawn(command, args, {
    stdio: 'pipe',
    env: { ...process.env, SERVICE_NAME: serviceName.toLowerCase().replace(' ', '-') }
  });

  // Handle output
  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      log(`[${serviceName}] ${line}`, color);
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      log(`[${serviceName}] ERROR: ${line}`, colors.red);
    });
  });

  process.on('error', (error) => {
    log(`❌ Failed to start ${serviceName}: ${error.message}`, colors.red);
    if (service.required) {
      process.exit(1);
    }
  });

  process.on('close', (code) => {
    if (code !== 0) {
      log(`❌ ${serviceName} exited with code ${code}`, colors.red);
      if (service.required) {
        process.exit(1);
      }
    } else {
      log(`✅ ${serviceName} exited cleanly`, color);
    }
  });

  // Wait a moment for the service to start
  setTimeout(() => {
    log(`🟢 ${serviceName} started on port ${service.port}`, color);
  }, 2000);

  return process;
}

// Start all services
async function startAllServices() {
  log('\n🎯 TalentSphere Service Manager', colors.bright);
  log('==============================\n', colors.bright);

  // Start backend services first
  log('🔧 Starting Backend Services...\n', colors.blue);
  
  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    const process = startService(service, 'backend', i);
    if (process) {
      processes.set(service.name, process);
    }
    // Stagger starts to avoid port conflicts
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Wait a bit before starting frontends
  log('\n⏳ Waiting for backend services to initialize...\n', colors.yellow);
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start frontend MFEs
  log('\n🎨 Starting Frontend MFEs...\n', colors.green);
  
  for (let i = 0; i < frontends.length; i++) {
    const frontend = frontends[i];
    const process = startService(frontend, 'frontend', i);
    if (process) {
      processes.set(frontend.name, process);
    }
    // Stagger frontend starts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Show summary
  log('\n✅ All services started successfully!\n', colors.green);
  log('📋 Service Summary:', colors.bright);
  log('==================\n', colors.bright);
  
  log('Backend Services:', colors.blue);
  services.forEach(service => {
    const status = processes.has(service.name) ? '🟢 Running' : '🔴 Stopped';
    log(`  ${service.name} (Port ${service.port}): ${status}`);
  });

  log('\nFrontend MFEs:', colors.green);
  frontends.forEach(frontend => {
    const status = processes.has(frontend.name) ? '🟢 Running' : '🔴 Stopped';
    log(`  ${frontend.name} (Port ${frontend.port}): ${status}`);
  });

  log('\n🌐 Access URLs:', colors.bright);
  log('=================\n', colors.bright);
  log(`🏠 Shell App:        http://localhost:3000`, colors.cyan);
  log(`📚 LMS MFE:         http://localhost:3001`, colors.green);
  log(`💻 Challenge MFE:    http://localhost:3002`, colors.yellow);
  log(`🚪 API Gateway:     http://localhost:8000`, colors.blue);
  log(`📡 API Docs:        http://localhost:8000/api/docs`, colors.magenta);
  log(`💚 Health Check:     http://localhost:8000/health`, colors.green);

  log('\n🛠️  Development Tips:', colors.bright);
  log(`=====================\n`, colors.bright);
  log('• Use Ctrl+C to stop all services', colors.yellow);
  log('• Check browser console for any errors', colors.yellow);
  log('• All services have CORS enabled for localhost', colors.yellow);
  log('• API Gateway routes requests to appropriate services', colors.yellow);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\n\n🛑 Shutting down all services...\n', colors.yellow);
    
    processes.forEach((process, name) => {
      log(`🛑 Stopping ${name}...`, colors.red);
      process.kill('SIGTERM');
    });

    // Force exit after 5 seconds
    setTimeout(() => {
      log('\n👋 All services stopped. Goodbye!\n', colors.green);
      process.exit(0);
    }, 5000);
  });
}

// Check if required dependencies are available
function checkDependencies() {
  const requiredCommands = ['node', 'npm'];
  const optionalCommands = ['python', 'java', 'dotnet'];
  
  log('🔍 Checking dependencies...\n', colors.blue);
  
  for (const cmd of requiredCommands) {
    try {
      require('child_process').execSync(`${cmd} --version`, { stdio: 'ignore' });
      log(`✅ ${cmd} is available`, colors.green);
    } catch {
      log(`❌ ${cmd} is not installed or not in PATH`, colors.red);
      process.exit(1);
    }
  }

  for (const cmd of optionalCommands) {
    try {
      require('child_process').execSync(`${cmd} --version`, { stdio: 'ignore' });
      log(`✅ ${cmd} is available`, colors.green);
    } catch {
      log(`⚠️  ${cmd} is not available (optional)`, colors.yellow);
    }
  }
  
  log('');
}

// Main execution
if (require.main === module) {
  checkDependencies();
  startAllServices().catch(error => {
    log(`❌ Failed to start services: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { startService, services, frontends };