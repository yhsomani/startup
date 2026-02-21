/**
 * TalentSphere API Integration Test Suite
 * Tests all API endpoints and frontend-backend integration
 */

const axios = require('axios');
const WebSocket = require('ws');

// Test configuration
const GATEWAY_URL = 'http://localhost:8000';
const FRONTEND_URLS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002'
];

const API_ENDPOINTS = {
  // Health endpoints
  health: '/health',
  
  // Auth endpoints
  authRegister: '/api/v1/auth/register',
  authLogin: '/api/v1/auth/login',
  authProfile: '/api/v1/auth/profile',
  authRefresh: '/api/v1/auth/refresh',
  
  // Course endpoints
  coursesList: '/api/v1/courses',
  coursesCreate: '/api/v1/courses',
  coursesDetail: '/api/v1/courses/1',
  
  // Challenge endpoints
  challengesList: '/api/v1/challenges',
  challengesCreate: '/api/v1/challenges',
  challengesDetail: '/api/v1/challenges/1',
  challengesLeaderboard: '/api/v1/challenges/leaderboard',
  
  // Progress endpoints
  progressUser: '/api/v1/progress/users/1',
  progressAchievements: '/api/v1/progress/users/1/achievements',
  
  // Notification endpoints
  notificationsList: '/api/v1/notifications',
  notificationsCreate: '/api/v1/notifications',
  
  // AI endpoints
  aiRecommendations: '/api/v1/ai/recommendations',
  aiCodeReview: '/api/v1/ai/code-review',
  
  // Gamification endpoints
  gamificationPoints: '/api/v1/gamification/points',
  gamificationBadges: '/api/v1/gamification/badges',
  
  // Video endpoints
  videoUpload: '/api/v1/video/upload',
  videoStream: '/api/v1/video/stream/1'
};

// ANSI colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test API endpoint
async function testEndpoint(name, path, method = 'GET', data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${GATEWAY_URL}${path}`,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const startTime = Date.now();
    const response = await axios(config);
    const endTime = Date.now();

    return {
      success: true,
      status: response.status,
      responseTime: endTime - startTime,
      data: response.data,
      headers: response.headers
    };

  } catch (err) {
    return {
      success: false,
      status: err.response?.status || 'ERROR',
      responseTime: null,
      error: err.message,
      data: err.response?.data
    };
  }
}

// Test CORS headers
async function testCORSHeaders(path) {
  const origins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
  const results = [];

  for (const origin of origins) {
    try {
      const response = await axios.options(`${GATEWAY_URL}${path}`, {
        headers: { Origin: origin },
        timeout: 3000
      });

      results.push({
        origin,
        allowOrigin: response.headers['access-control-allow-origin'],
        allowMethods: response.headers['access-control-allow-methods'],
        allowHeaders: response.headers['access-control-allow-headers'],
        credentials: response.headers['access-control-allow-credentials'],
        success: true
      });

    } catch (err) {
      results.push({
        origin,
        error: err.message,
        success: false
      });
    }
  }

  return results;
}

// Test WebSocket connection
async function testWebSocketConnection(url) {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.terminate();
        resolve({ success: false, error: 'Connection timeout' });
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ success: true });
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });

    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

// Test authentication flow
async function testAuthFlow() {
  log('\n🔐 Testing Authentication Flow', colors.bright);
  log(''.padEnd(50, '-'), colors.cyan);

  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  let authResult = { success: false };

  // Test registration
  const registerResult = await testEndpoint(
    'Register User',
    API_ENDPOINTS.authRegister,
    'POST',
    testUser
  );

  if (registerResult.success) {
    success('✓ User registration successful');
    authResult = registerResult;
  } else {
    warning('⚠ User registration failed (user may already exist)');
  }

  // Test login
  const loginResult = await testEndpoint(
    'Login User',
    API_ENDPOINTS.authLogin,
    'POST',
    {
      email: testUser.email,
      password: testUser.password
    }
  );

  if (loginResult.success) {
    success('✓ User login successful');
    authResult = loginResult;
  } else {
    warning('⚠ User login failed');
  }

  // Test profile with token
  if (authResult.success && authResult.data?.token) {
    const profileResult = await testEndpoint(
      'Get User Profile',
      API_ENDPOINTS.authProfile,
      'GET',
      null,
      { Authorization: `Bearer ${authResult.data.token}` }
    );

    if (profileResult.success) {
      success('✓ Profile access successful');
    } else {
      error('✗ Profile access failed');
    }
  }

  return authResult.success;
}

// Test API endpoints
async function testAPIEndpoints() {
  log('\n🔌 Testing API Endpoints', colors.bright);
  log(''.padEnd(50, '-'), colors.cyan);

  const endpoints = [
    { name: 'Health Check', path: API_ENDPOINTS.health, method: 'GET' },
    { name: 'Courses List', path: API_ENDPOINTS.coursesList, method: 'GET' },
    { name: 'Challenges List', path: API_ENDPOINTS.challengesList, method: 'GET' },
    { name: 'Notifications List', path: API_ENDPOINTS.notificationsList, method: 'GET' },
    { name: 'Gamification Points', path: API_ENDPOINTS.gamificationPoints, method: 'GET' },
    { name: 'AI Recommendations', path: API_ENDPOINTS.aiRecommendations, method: 'POST', data: { userId: 1 } }
  ];

  let successCount = 0;

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.path, endpoint.method, endpoint.data);
    
    if (result.success) {
      success(`✓ ${endpoint.name} (${result.responseTime}ms)`);
      successCount++;
    } else {
      error(`✗ ${endpoint.name} - ${result.error}`);
    }
  }

  return successCount;
}

// Test CORS across services
async function testCORSIntegration() {
  log('\n🌐 Testing CORS Integration', colors.bright);
  log(''.padEnd(50, '-'), colors.cyan);

  const criticalPaths = [
    API_ENDPOINTS.health,
    API_ENDPOINTS.coursesList,
    API_ENDPOINTS.challengesList,
    API_ENDPOINTS.notificationsList
  ];

  let successCount = 0;

  for (const path of criticalPaths) {
    const corsResults = await testCORSHeaders(path);
    const pathSuccess = corsResults.every(r => r.success && r.allowOrigin);
    
    if (pathSuccess) {
      success(`✓ CORS working for ${path}`);
      successCount++;
    } else {
      error(`✗ CORS failed for ${path}`);
    }
  }

  return successCount;
}

// Test WebSocket services
async function testWebSocketServices() {
  log('\n🔌 Testing WebSocket Services', colors.bright);
  log(''.padEnd(50, '-'), colors.cyan);

  const websockets = [
    { name: 'Collaboration Service', url: 'ws://localhost:1234' },
    { name: 'Notification Service', url: 'ws://localhost:3030' }
  ];

  let successCount = 0;

  for (const ws of websockets) {
    const result = await testWebSocketConnection(ws.url);
    
    if (result.success) {
      success(`✓ ${ws.name} connected`);
      successCount++;
    } else {
      error(`✗ ${ws.name} failed - ${result.error}`);
    }
  }

  return successCount;
}

// Test frontend accessibility
async function testFrontendAccessibility() {
  log('\n🎨 Testing Frontend Accessibility', colors.bright);
  log(''.padEnd(50, '-'), colors.cyan);

  let successCount = 0;

  for (const url of FRONTEND_URLS) {
    try {
      const response = await axios.get(url, { timeout: 3000 });
      
      if (response.status === 200) {
        success(`✓ ${url} accessible`);
        successCount++;
      } else {
        error(`✗ ${url} returned ${response.status}`);
      }
    } catch (error) {
      error(`✗ ${url} - ${error.message}`);
    }
  }

  return successCount;
}

// Main test runner
async function runIntegrationTests() {
  log('🎯 TalentSphere Integration Test Suite', colors.bright);
  log('====================================\n', colors.bright);

  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;

  // Run test suites
  const testSuites = [
    { name: 'Frontend Accessibility', test: testFrontendAccessibility, weight: 1 },
    { name: 'Authentication Flow', test: testAuthFlow, weight: 1 },
    { name: 'API Endpoints', test: testAPIEndpoints, weight: 6 },
    { name: 'CORS Integration', test: testCORSIntegration, weight: 4 },
    { name: 'WebSocket Services', test: testWebSocketServices, weight: 2 }
  ];

  for (const suite of testSuites) {
    totalTests += suite.weight;
    const result = await suite.test();
    if (typeof result === 'boolean' && result) {
      passedTests += suite.weight;
    } else if (typeof result === 'number') {
      passedTests += result;
    }
  }

  // Summary
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  log('\n📊 Test Results Summary', colors.bright);
  log('========================\n', colors.bright);
  
  const passRate = Math.round((passedTests / totalTests) * 100);
  
  info(`Total Tests: ${totalTests}`);
  info(`Passed: ${passedTests}`);
  info(`Failed: ${totalTests - passedTests}`);
  info(`Duration: ${duration}s`);
  info(`Pass Rate: ${passRate}%`);

  if (passRate >= 80) {
    success('\n🎉 Integration tests passed! System is working correctly.');
  } else if (passRate >= 60) {
    warning('\n⚠️  Some tests failed. System may have issues.');
  } else {
    error('\n❌ Multiple tests failed. System needs attention.');
  }

  // Recommendations
  log('\n💡 Recommendations:', colors.bright);
  log('==================\n', colors.bright);
  
  if (passRate < 100) {
    log('1. Ensure all services are running with "node start-services.js"', colors.blue);
    log('2. Check CORS configuration in .env.cors', colors.blue);
    log('3. Verify all environment variables are set', colors.blue);
    log('4. Check for port conflicts with "netstat -an | grep LISTEN"', colors.blue);
    log('5. Review individual service logs for errors', colors.blue);
  } else {
    log('✅ All systems operational!', colors.green);
  }

  log('\n🔗 Access URLs:', colors.bright);
  log('==================\n', colors.bright);
  log(`🏠 Main Application: ${FRONTEND_URLS[0]}`, colors.cyan);
  log(`🚪 API Gateway: ${GATEWAY_URL}`, colors.blue);
  log(`📚 API Documentation: ${GATEWAY_URL}/api/docs`, colors.magenta);
  log(`💚 Health Check: ${GATEWAY_URL}/health`, colors.green);

  process.exit(passRate >= 80 ? 0 : 1);
}

// Check prerequisites
async function checkPrerequisites() {
  log('🔍 Checking prerequisites...', colors.blue);

  // Check if services are running
  try {
    await axios.get(`${GATEWAY_URL}/health`, { timeout: 2000 });
    log('✓ API Gateway is accessible', colors.green);
  } catch (error) {
    error('✗ API Gateway is not accessible');
    log('  Please start services with: node start-services.js', colors.yellow);
    process.exit(1);
  }

  log('');
}

// Main execution
if (require.main === module) {
  checkPrerequisites().then(() => {
    runIntegrationTests().catch(error => {
      error(`Integration test execution failed: ${error.message}`);
      process.exit(1);
    });
  });
}

module.exports = {
  testEndpoint,
  testCORSHeaders,
  testWebSocketConnection,
  runIntegrationTests
};