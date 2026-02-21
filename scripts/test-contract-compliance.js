/**
 * TalentSphere Contract Compliance Testing Suite
 * Automated testing for contract compliance across all services
 */

const axios = require('axios');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize AJV
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false
});
addFormats(ajv);

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

const CONFIG = {
  apiGatewayUrl: 'http://localhost:8000',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
};

const ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    profile: '/api/v1/auth/profile',
    refresh: '/api/v1/auth/refresh'
  },
  // Course endpoints
  courses: {
    list: '/api/v1/courses',
    detail: '/api/v1/courses/1',
    create: '/api/v1/courses',
    update: '/api/v1/courses/1',
    enroll: '/api/v1/courses/1/enroll'
  },
  // Challenge endpoints
  challenges: {
    list: '/api/v1/challenges',
    detail: '/api/v1/challenges/1',
    create: '/api/v1/challenges',
    submit: '/api/v1/challenges/1/submit',
    leaderboard: '/api/v1/challenges/leaderboard'
  },
  // Progress endpoints
  progress: {
    user: '/api/v1/progress/users/1',
    achievements: '/api/v1/progress/users/1/achievements',
    analytics: '/api/v1/progress/analytics'
  },
  // Notification endpoints
  notifications: {
    list: '/api/v1/notifications',
    create: '/api/v1/notifications',
    markRead: '/api/v1/notifications/1/read'
  },
  // AI endpoints
  ai: {
    recommendations: '/api/v1/ai/recommendations',
    codeReview: '/api/v1/ai/code-review',
    qanda: '/api/v1/ai/qanda'
  }
};

// =============================================================================
// CONTRACT SCHEMAS FOR TESTING
// =============================================================================

/**
 * Standard API response schema
 */
const apiResponseSchema = {
  type: 'object',
  required: ['success', 'timestamp', 'requestId'],
  properties: {
    success: { type: 'boolean' },
    data: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object' },
        field: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        requestId: { type: 'string' }
      },
      required: ['code', 'message']
    },
    message: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    requestId: { type: 'string' },
    pagination: {
      type: 'object',
      properties: {
        page: { type: 'number', minimum: 1 },
        limit: { type: 'number', minimum: 1, maximum: 100 },
        total: { type: 'number', minimum: 0 },
        totalPages: { type: 'number', minimum: 0 },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' }
      }
    }
  }
};

/**
 * User schema
 */
const userSchema = {
  type: 'object',
  required: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string', minLength: 1, maxLength: 50 },
    lastName: { type: 'string', minLength: 1, maxLength: 50 },
    avatar: { type: 'string', format: 'uri' },
    role: { type: 'string', enum: ['student', 'instructor', 'admin', 'super_admin'] },
    isActive: { type: 'boolean' },
    isVerified: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    lastLoginAt: { type: 'string', format: 'date-time' }
  }
};

/**
 * Course schema
 */
const courseSchema = {
  type: 'object',
  required: ['id', 'title', 'description', 'instructorId', 'categoryId', 'difficulty', 'duration', 'price', 'status', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', minLength: 10, maxLength: 10000 },
    instructorId: { type: 'string', format: 'uuid' },
    categoryId: { type: 'string', format: 'uuid' },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    duration: { type: 'number', minimum: 1 },
    price: { type: 'number', minimum: 0 },
    currency: { type: 'string' },
    status: { type: 'string', enum: ['draft', 'published', 'archived', 'under_review'] },
    rating: { type: 'number', minimum: 0, maximum: 5 },
    reviewCount: { type: 'number', minimum: 0 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

/**
 * Challenge schema
 */
const challengeSchema = {
  type: 'object',
  required: ['id', 'title', 'description', 'difficulty', 'type', 'timeLimit', 'memoryLimit', 'points', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', minLength: 10, maxLength: 5000 },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'expert'] },
    type: { type: 'string', enum: ['algorithm', 'data_structure', 'system_design', 'frontend', 'backend', 'full_stack'] },
    timeLimit: { type: 'number', minimum: 1 },
    memoryLimit: { type: 'number', minimum: 64 },
    points: { type: 'number', minimum: 10 },
    submissionCount: { type: 'number', minimum: 0 },
    successRate: { type: 'number', minimum: 0, maximum: 1 },
    isPublished: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' }
  }
};

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate response against schema
 */
function validateResponse(response, schema) {
  const validate = ajv.compile(schema);
  const isValid = validate(response);
  
  return {
    isValid,
    errors: validate.errors || [],
    errorsText: validate.errors?.map(err => `${err.instancePath || 'root'}: ${err.message}`).join(', ') || ''
  };
}

/**
 * Make HTTP request with retry logic
 */
async function makeRequest(url, options = {}, schema = null) {
  const config = {
    ...options,
    url: `${CONFIG.apiGatewayUrl}${url}`,
    timeout: CONFIG.timeout,
    validateStatus: (status) => status < 500 // Retry on server errors
  };

  let lastError;
  
  for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
    try {
      const response = await axios(config);
      
      // Validate response structure
      if (schema) {
        const validation = validateResponse(response.data, schema);
        if (!validation.isValid) {
          throw new Error(`Response validation failed: ${validation.errorsText}`);
        }
      }
      
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      lastError = error;
      
      if (attempt < CONFIG.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    status: lastError?.response?.status || 0
  };
}

// =============================================================================
// TEST CASES
// =============================================================================

/**
 * Test authentication endpoints
 */
async function testAuthentication() {
  console.log('🔐 Testing Authentication Endpoints...');
  
  const tests = [
    {
      name: 'Login - Valid credentials',
      endpoint: ENDPOINTS.auth.login,
      method: 'POST',
      data: {
        email: 'test@example.com',
        password: 'TestPassword123!'
      },
      expectedStatus: 200,
      schema: apiResponseSchema
    },
    {
      name: 'Login - Invalid credentials',
      endpoint: ENDPOINTS.auth.login,
      method: 'POST',
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      },
      expectedStatus: 401,
      schema: apiResponseSchema
    },
    {
      name: 'Register - Valid data',
      endpoint: ENDPOINTS.auth.register,
      method: 'POST',
      data: {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        firstName: 'New',
        lastName: 'User',
        agreeToTerms: true
      },
      expectedStatus: 201,
      schema: apiResponseSchema
    },
    {
      name: 'Get Profile - Authenticated',
      endpoint: ENDPOINTS.auth.profile,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema,
      requiresAuth: true
    }
  ];

  return runTests('Authentication', tests);
}

/**
 * Test course endpoints
 */
async function testCourses() {
  console.log('📚 Testing Course Endpoints...');
  
  const tests = [
    {
      name: 'List courses',
      endpoint: ENDPOINTS.courses.list,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema
    },
    {
      name: 'Get course details',
      endpoint: ENDPOINTS.courses.detail,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema
    },
    {
      name: 'Create course - Valid data',
      endpoint: ENDPOINTS.courses.create,
      method: 'POST',
      data: {
        title: 'Test Course',
        description: 'A test course for contract compliance',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        difficulty: 'beginner',
        duration: 60,
        price: 99.99,
        currency: 'USD'
      },
      expectedStatus: 201,
      schema: apiResponseSchema,
      requiresAuth: true
    }
  ];

  return runTests('Courses', tests);
}

/**
 * Test challenge endpoints
 */
async function testChallenges() {
  console.log('💻 Testing Challenge Endpoints...');
  
  const tests = [
    {
      name: 'List challenges',
      endpoint: ENDPOINTS.challenges.list,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema
    },
    {
      name: 'Get challenge details',
      endpoint: ENDPOINTS.challenges.detail,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema
    },
    {
      name: 'Submit challenge solution',
      endpoint: ENDPOINTS.challenges.submit,
      method: 'POST',
      data: {
        code: 'function test() { return "Hello World"; }',
        language: 'javascript'
      },
      expectedStatus: 200,
      schema: apiResponseSchema,
      requiresAuth: true
    }
  ];

  return runTests('Challenges', tests);
}

/**
 * Test progress endpoints
 */
async function testProgress() {
  console.log('📈 Testing Progress Endpoints...');
  
  const tests = [
    {
      name: 'Get user progress',
      endpoint: ENDPOINTS.progress.user,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema,
      requiresAuth: true
    },
    {
      name: 'Get user achievements',
      endpoint: ENDPOINTS.progress.achievements,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema,
      requiresAuth: true
    }
  ];

  return runTests('Progress', tests);
}

/**
 * Test notification endpoints
 */
async function testNotifications() {
  console.log('🔔 Testing Notification Endpoints...');
  
  const tests = [
    {
      name: 'List notifications',
      endpoint: ENDPOINTS.notifications.list,
      method: 'GET',
      expectedStatus: 200,
      schema: apiResponseSchema,
      requiresAuth: true
    },
    {
      name: 'Create notification',
      endpoint: ENDPOINTS.notifications.create,
      method: 'POST',
      data: {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system_announcement'
      },
      expectedStatus: 201,
      schema: apiResponseSchema,
      requiresAuth: true
    }
  ];

  return runTests('Notifications', tests);
}

/**
 * Test AI endpoints
 */
async function testAI() {
  console.log('🤖 Testing AI Endpoints...');
  
  const tests = [
    {
      name: 'Get recommendations',
      endpoint: ENDPOINTS.ai.recommendations,
      method: 'POST',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        context: { courseId: '123e4567-e89b-12d3-a456-426614174000' }
      },
      expectedStatus: 200,
      schema: apiResponseSchema,
      requiresAuth: true
    },
    {
      name: 'Code review',
      endpoint: ENDPOINTS.ai.codeReview,
      method: 'POST',
      data: {
        code: 'function test() { console.log("test"); }',
        language: 'javascript'
      },
      expectedStatus: 200,
      schema: apiResponseSchema,
      requiresAuth: true
    }
  ];

  return runTests('AI', tests);
}

// =============================================================================
// TEST EXECUTION
// =============================================================================

/**
 * Run a set of tests
 */
async function runTests(category, tests) {
  const results = {
    category,
    total: tests.length,
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        data: test.data
      };

      if (test.requiresAuth) {
        config.headers = {
          'Authorization': 'Bearer valid-test-token'
        };
      }

      const result = await makeRequest(test.endpoint, config, test.schema);
      
      if (result.success && result.status === test.expectedStatus) {
        results.passed++;
        console.log(`  ✅ ${test.name}`);
      } else {
        results.failed++;
        const error = {
          test: test.name,
          expected: test.expectedStatus,
          actual: result.status,
          error: result.error?.message
        };
        results.errors.push(error);
        console.log(`  ❌ ${test.name} - Expected ${test.expectedStatus}, got ${result.status}`);
        
        if (result.error) {
          console.log(`     Error: ${result.error.message}`);
        }
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        test: test.name,
        error: error.message
      });
      console.log(`  ❌ ${test.name} - ${error.message}`);
    }
  }

  return results;
}

/**
 * Test API Gateway health
 */
async function testAPIGatewayHealth() {
  console.log('🏥 Testing API Gateway Health...');
  
  try {
    const response = await makeRequest('/health');
    
    if (response.success) {
      console.log('  ✅ API Gateway is healthy');
      return { success: true, data: response.data };
    } else {
      console.log('  ❌ API Gateway health check failed');
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.log(`  ❌ API Gateway health check failed: ${error.message}`);
    return { success: false, error };
  }
}

/**
 * Test contract violations
 */
async function testContractViolations() {
  console.log('⚠️ Testing Contract Violations...');
  
  const violations = [
    {
      name: 'Missing required fields',
      endpoint: ENDPOINTS.auth.register,
      method: 'POST',
      data: { email: 'test@example.com' }, // Missing password, firstName, lastName
      expectedStatus: 400
    },
    {
      name: 'Invalid data types',
      endpoint: ENDPOINTS.courses.create,
      method: 'POST',
      data: { title: 123, description: 'test' }, // title should be string
      expectedStatus: 400
    },
    {
      name: 'Unauthorized access',
      endpoint: ENDPOINTS.auth.profile,
      method: 'GET',
      expectedStatus: 401
    }
  ];

  const results = {
    category: 'Contract Violations',
    total: violations.length,
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const violation of violations) {
    try {
      const config = {
        method: violation.method,
        data: violation.data
      };

      const result = await makeRequest(violation.endpoint, config);
      
      if (!result.success && result.status === violation.expectedStatus) {
        results.passed++;
        console.log(`  ✅ ${violation.name} - Correctly rejected with ${violation.expectedStatus}`);
      } else {
        results.failed++;
        results.errors.push({
          test: violation.name,
          expected: violation.expectedStatus,
          actual: result.status
        });
        console.log(`  ❌ ${violation.name} - Expected ${violation.expectedStatus}, got ${result.status}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        test: violation.name,
        error: error.message
      });
      console.log(`  ❌ ${violation.name} - ${error.message}`);
    }
  }

  return results;
}

// =============================================================================
// MAIN TEST EXECUTION
// =============================================================================

/**
 * Run all contract compliance tests
 */
async function runAllTests() {
  console.log('🎯 TalentSphere Contract Compliance Test Suite');
  console.log('===============================================\n');

  // Test API Gateway health first
  const healthCheck = await testAPIGatewayHealth();
  if (!healthCheck.success) {
    console.error('❌ API Gateway is not accessible. Skipping contract tests.');
    process.exit(1);
  }

  // Run all test suites
  const testSuites = [
    await testAuthentication(),
    await testCourses(),
    await testChallenges(),
    await testProgress(),
    await testNotifications(),
    await testAI(),
    await testContractViolations()
  ];

  // Generate comprehensive report
  const totalTests = testSuites.reduce((sum, suite) => sum + suite.total, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
  const passRate = Math.round((totalPassed / totalTests) * 100);

  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Pass Rate: ${passRate}%`);

  // Print detailed results
  console.log('\n📋 Detailed Results');
  console.log('==================');
  
  testSuites.forEach(suite => {
    console.log(`\n${suite.category}:`);
    console.log(`  Total: ${suite.total}`);
    console.log(`  Passed: ${suite.passed}`);
    console.log(`  Failed: ${suite.failed}`);
    
    if (suite.errors.length > 0) {
      console.log('  Errors:');
      suite.errors.forEach(error => {
        console.log(`    - ${error.test}: ${error.expected || error.error}`);
      });
    }
  });

  // Overall assessment
  if (passRate >= 95) {
    console.log('\n🎉 Contract compliance test passed! System is maintaining contracts correctly.');
  } else if (passRate >= 80) {
    console.log('\n⚠️  Contract compliance test passed with warnings. Some contracts need attention.');
  } else {
    console.log('\n❌ Contract compliance test failed! System has contract violations.');
  }

  // Generate compliance report
  const report = {
    timestamp: new Date().toISOString(),
    totalTests,
    totalPassed,
    totalFailed,
    passRate,
    testSuites,
    complianceLevel: passRate >= 95 ? 'EXCELLENT' : passRate >= 80 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
  };

  // Save report to file
  const fs = require('fs');
  const reportPath = 'contract-compliance-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return report;
}

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Contract Compliance Testing Suite

Usage:
  node test-contract-compliance.js [options]

Options:
  --help, -h        Show this help message
  --category <name> Run specific test category (auth, courses, challenges, progress, notifications, ai)
  --verbose         Enable verbose logging

Available Categories:
  auth              Authentication endpoints
  courses            Course management endpoints  
  challenges         Coding challenge endpoints
  progress            Progress tracking endpoints
  notifications       Notification endpoints
  ai                  AI assistant endpoints
    `);
    process.exit(0);
  }

  const category = args.find(arg => arg.startsWith('--category='))?.split('=')[1];
  const verbose = args.includes('--verbose');

  if (category) {
    // Run specific category
    switch (category) {
      case 'auth':
        await testAuthentication();
        break;
      case 'courses':
        await testCourses();
        break;
      case 'challenges':
        await testChallenges();
        break;
      case 'progress':
        await testProgress();
        break;
      case 'notifications':
        await testNotifications();
        break;
      case 'ai':
        await testAI();
        break;
      default:
        console.error(`Unknown category: ${category}`);
        process.exit(1);
    }
  } else {
    // Run all tests
    await runAllTests();
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  runAllTests,
  testAuthentication,
  testCourses,
  testChallenges,
  testProgress,
  testNotifications,
  testAI,
  testContractViolations,
  testAPIGatewayHealth
};