/**
 * TalentSphere JWT Middleware Test Suite
 * Tests JWT authentication across all services
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const auth = require('../shared/middleware/auth');

// Test configuration
const JWT_SECRET = '506a96e13dd6c15a48e02d305414deeea5e2b1068ff19449e65c46d5c548bba876a0f52903887b4b7d1c5b3b6d8f0e3a5d4f2c6b8a1e9d7c5b3a9f2e6d4c8b0a';

// Generate test tokens
const generateTestToken = (userOverrides = {}) => {
  const defaultUser = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'employee',
    permissions: ['read', 'write'],
    companyId: 'test-company-456'
  };
  
  const user = { ...defaultUser, ...userOverrides };
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
};

const generateExpiredToken = () => {
  return jwt.sign(
    { userId: 'expired-user', email: 'expired@example.com' },
    JWT_SECRET,
    { expiresIn: '-1h' } // Expired 1 hour ago
  );
};

// Service base URLs
const SERVICES = {
  job: 'http://localhost:3003',
  network: 'http://localhost:3004',
  search: 'http://localhost:3005',
  analytics: 'http://localhost:3006',
  notification: 'http://localhost:3030'
};

class JWTTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting JWT Middleware Test Suite\n');
    
    // Test 1: Token validation
    await this.testTokenValidation();
    
    // Test 2: Role-based access
    await this.testRoleBasedAccess();
    
    // Test 3: Company access control
    await this.testCompanyAccess();
    
    // Test 4: Resource ownership
    await this.testResourceOwnership();
    
    // Test 5: Optional authentication
    await this.testOptionalAuth();
    
    // Test 6: Service-specific implementations
    await this.testServiceSpecificAuth();
    
    this.printResults();
  }

  async testTokenValidation() {
    console.log('📋 Testing Token Validation...');
    
    const tests = [
      {
        name: 'Valid token should pass',
        token: generateTestToken(),
        expectedStatus: 200
      },
      {
        name: 'Missing token should fail',
        token: null,
        expectedStatus: 401
      },
      {
        name: 'Expired token should fail',
        token: generateExpiredToken(),
        expectedStatus: 403
      },
      {
        name: 'Invalid token should fail',
        token: 'invalid.token.here',
        expectedStatus: 403
      }
    ];

    for (const service in SERVICES) {
      for (const test of tests) {
        await this.runSingleTest(service, 'health', test);
      }
    }
  }

  async testRoleBasedAccess() {
    console.log('\n👥 Testing Role-Based Access Control...');
    
    const roleTests = [
      {
        name: 'Employee accessing protected endpoint',
        user: { role: 'employee' },
        endpoint: '/jobs',
        method: 'POST',
        expectedStatus: 403 // Employees can't create jobs
      },
      {
        name: 'HR accessing protected endpoint',
        user: { role: 'hr' },
        endpoint: '/jobs',
        method: 'POST',
        expectedStatus: 200 // HR can create jobs
      },
      {
        name: 'Admin accessing protected endpoint',
        user: { role: 'admin' },
        endpoint: '/jobs',
        method: 'POST',
        expectedStatus: 200 // Admin can create jobs
      }
    ];

    for (const test of roleTests) {
      const token = generateTestToken(test.user);
      await this.runSingleTest('job', test.endpoint, {
        name: test.name,
        token,
        method: test.method,
        expectedStatus: test.expectedStatus,
        body: {
          title: 'Test Job',
          description: 'Test Description',
          companyId: 'test-company',
          postedBy: 'test-user',
          employmentType: 'full-time',
          location: { city: 'Test City' }
        }
      });
    }
  }

  async testCompanyAccess() {
    console.log('\n🏢 Testing Company Access Control...');
    
    const companyTests = [
      {
        name: 'User accessing own company data',
        user: { companyId: 'company-123', role: 'hr' },
        endpoint: '/companies/company-123/jobs',
        expectedStatus: 200
      },
      {
        name: 'User accessing different company data',
        user: { companyId: 'company-456', role: 'hr' },
        endpoint: '/companies/company-123/jobs',
        expectedStatus: 403
      },
      {
        name: 'Super admin accessing any company data',
        user: { companyId: 'company-456', role: 'super_admin' },
        endpoint: '/companies/company-123/jobs',
        expectedStatus: 200
      }
    ];

    for (const test of companyTests) {
      const token = generateTestToken(test.user);
      await this.runSingleTest('job', test.endpoint, {
        name: test.name,
        token,
        expectedStatus: test.expectedStatus
      });
    }
  }

  async testResourceOwnership() {
    console.log('\n🔒 Testing Resource Ownership...');
    
    const ownershipTests = [
      {
        name: 'User accessing own recommended jobs',
        user: { userId: 'user-123' },
        endpoint: '/users/user-123/recommended-jobs',
        expectedStatus: 200
      },
      {
        name: 'User accessing other user\'s recommended jobs',
        user: { userId: 'user-456' },
        endpoint: '/users/user-123/recommended-jobs',
        expectedStatus: 403
      },
      {
        name: 'Admin accessing other user\'s recommended jobs',
        user: { userId: 'admin-user', role: 'admin' },
        endpoint: '/users/user-123/recommended-jobs',
        expectedStatus: 200
      }
    ];

    for (const test of ownershipTests) {
      const token = generateTestToken(test.user);
      await this.runSingleTest('job', test.endpoint, {
        name: test.name,
        token,
        expectedStatus: test.expectedStatus
      });
    }
  }

  async testOptionalAuth() {
    console.log('\n🔓 Testing Optional Authentication...');
    
    const optionalTests = [
      {
        name: 'Public job search without token',
        token: null,
        endpoint: '/jobs',
        expectedStatus: 200
      },
      {
        name: 'Public job search with valid token',
        token: generateTestToken(),
        endpoint: '/jobs',
        expectedStatus: 200
      },
      {
        name: 'Public job search with invalid token',
        token: 'invalid.token',
        endpoint: '/jobs',
        expectedStatus: 200 // Should still work with optional auth
      }
    ];

    for (const test of optionalTests) {
      await this.runSingleTest('search', test.endpoint, {
        name: test.name,
        token: test.token,
        expectedStatus: test.expectedStatus
      });
    }
  }

  async testServiceSpecificAuth() {
    console.log('\n🔧 Testing Service-Specific Authentication...');
    
    const serviceTests = [
      {
        service: 'analytics',
        name: 'Analytics endpoint requires auth',
        endpoint: '/dashboard',
        token: null,
        expectedStatus: 401
      },
      {
        service: 'network',
        name: 'Network connections require auth',
        endpoint: '/connections',
        token: null,
        expectedStatus: 401
      },
      {
        service: 'network',
        name: 'Valid token can access connections',
        endpoint: '/connections',
        token: generateTestToken(),
        expectedStatus: 200
      },
      {
        service: 'notification',
        name: 'Notification broadcasting requires admin',
        endpoint: '/api/broadcast',
        token: generateTestToken({ role: 'employee' }),
        expectedStatus: 403
      },
      {
        service: 'notification',
        name: 'Admin can broadcast notifications',
        endpoint: '/api/broadcast',
        token: generateTestToken({ role: 'admin' }),
        expectedStatus: 200,
        body: {
          title: 'Test Broadcast',
          message: 'Test message'
        }
      }
    ];

    for (const test of serviceTests) {
      await this.runSingleTest(test.service, test.endpoint, test);
    }
  }

  async runSingleTest(service, endpoint, testConfig) {
    const { name, token, method = 'GET', expectedStatus, body } = testConfig;
    
    this.testResults.total++;
    
    try {
      const serviceUrl = SERVICES[service];
      if (!serviceUrl) {
        throw new Error(`Service ${service} not configured`);
      }

      let req = request(serviceUrl)[method.toLowerCase()](endpoint);
      
      if (token) {
        req.set('Authorization', `Bearer ${token}`);
      }
      
      if (body) {
        req.send(body);
      }

      const response = await req;
      const actualStatus = response.status;

      if (actualStatus === expectedStatus) {
        this.testResults.passed++;
        this.testResults.details.push({
          name,
          service,
          status: '✅ PASS',
          expected: expectedStatus,
          actual: actualStatus
        });
      } else {
        this.testResults.failed++;
        this.testResults.details.push({
          name,
          service,
          status: '❌ FAIL',
          expected: expectedStatus,
          actual: actualStatus,
          error: response.body?.error || response.text
        });
      }
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        name,
        service,
        status: '❌ ERROR',
        error: error.message
      });
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 JWT MIDDLEWARE TEST RESULTS');
    console.log('='.repeat(80));
    
    // Print individual test results
    this.testResults.details.forEach(test => {
      console.log(`${test.status} ${test.name}`);
      if (test.service) console.log(`   Service: ${test.service}`);
      if (test.expected !== undefined) console.log(`   Expected: ${test.expected}`);
      if (test.actual !== undefined) console.log(`   Actual: ${test.actual}`);
      if (test.error) console.log(`   Error: ${test.error}`);
      console.log();
    });

    // Print summary
    console.log('='.repeat(80));
    console.log(`📈 SUMMARY:`);
    console.log(`   Total Tests: ${this.testResults.total}`);
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   📊 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n⚠️  Some tests failed. Please check the JWT middleware implementation.');
    } else {
      console.log('\n🎉 All JWT middleware tests passed!');
    }
    
    console.log('='.repeat(80));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new JWTTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = JWTTestSuite;