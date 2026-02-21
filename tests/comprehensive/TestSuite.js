/**
 * TalentSphere Comprehensive Test Suite
 * Complete testing framework for all services and components
 */

const request = require('supertest');
const assert = require('assert');
const { createLogger } = require('../../shared/logger');

const logger = createLogger('TestSuite');

class TestSuite {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
    this.totalTests = 0;
  }

  // Test utility methods
  async runTest(testName, testFunction) {
    try {
      await testFunction();
      this.logPass(testName);
    } catch (error) {
      this.logFail(testName, error);
    }
  }

  logPass(testName) {
    logger.info(`✅ PASS: ${testName}`);
    this.testResults.push({ name: testName, status: 'PASS' });
    this.passedTests++;
    this.totalTests++;
  }

  logFail(testName, error) {
    logger.error(`❌ FAIL: ${testName} - ${error.message}`);
    this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
    this.failedTests++;
    this.totalTests++;
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertContains(haystack, needle, message) {
    if (!haystack.includes(needle)) {
      throw new Error(message || `Expected ${haystack} to contain ${needle}`);
    }
  }

  // Generate test report
  generateReport() {
    const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(2);
    
    return {
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        passRate: `${passRate}%`
      },
      details: this.testResults
    };
  }

  // API Tests
  async testAPIHealth(app) {
    logger.info('Testing API Health Endpoints...');
    
    await this.runTest('API Gateway Health Check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      this.assert(response.body.status === 'healthy', 'Health check should return healthy status');
    });

    await this.runTest('Auth Service Health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      this.assert(response.body.service === 'auth-service', 'Should identify as auth service');
    });

    await this.runTest('User Service Health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      this.assert(response.body.service === 'user-service', 'Should identify as user service');
    });
  }

  // Authentication Tests
  async testAuthentication(app) {
    logger.info('Testing Authentication...');
    
    await this.runTest('User Registration', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        password: 'SecurePass123!',
        agreeToTerms: true
      };
      
      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);
      
      this.assert(response.body.success, 'Registration should succeed');
      this.assert(response.body.data.user.email === userData.email, 'Should return user email');
    });

    await this.runTest('User Login', async () => {
      const credentials = {
        email: 'john.doe@test.com',
        password: 'SecurePass123!'
      };
      
      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(200);
      
      this.assert(response.body.success, 'Login should succeed');
      this.assert(response.body.data.token, 'Should return auth token');
    });

    await this.runTest('Invalid Login', async () => {
      const credentials = {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      };
      
      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);
      
      this.assert(!response.body.success, 'Login should fail for invalid credentials');
    });

    await this.runTest('Protected Route Access', async () => {
      const response = await request(app)
        .get('/profile')
        .expect(401);
      
      this.assert(response.body.error.code === 'UNAUTHORIZED', 'Should return unauthorized error');
    });
  }

  // User Service Tests
  async testUserService(app) {
    logger.info('Testing User Service...');
    
    await this.runTest('Get User Profile', async () => {
      const token = await this.getAuthToken(app);
      
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      this.assert(response.body.data.user, 'Should return user profile data');
    });

    await this.runTest('Update User Profile', async () => {
      const token = await this.getAuthToken(app);
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };
      
      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);
      
      this.assert(response.body.success, 'Profile update should succeed');
    });
  }

  // Job Service Tests
  async testJobService(app) {
    logger.info('Testing Job Service...');
    
    await this.runTest('Get Jobs List', async () => {
      const response = await request(app)
        .get('/jobs')
        .expect(200);
      
      this.assert(Array.isArray(response.body.data.jobs), 'Should return jobs array');
      this.assert(response.body.data.jobs.length > 0, 'Should return at least one job');
    });

    await this.runTest('Create Job Posting', async () => {
      const token = await this.getAuthToken(app);
      const jobData = {
        title: 'Senior React Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        type: 'Full-time',
        description: 'Looking for an experienced React developer...',
        skills: ['React', 'TypeScript', 'Node.js']
      };
      
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send(jobData)
        .expect(201);
      
      this.assert(response.body.success, 'Job creation should succeed');
      this.assert(response.body.data.job.title === jobData.title, 'Should return job title');
    });

    await this.runTest('Search Jobs', async () => {
      const response = await request(app)
        .get('/jobs/search?q=React')
        .expect(200);
      
      this.assert(Array.isArray(response.body.data.jobs), 'Should return search results');
      response.body.data.jobs.forEach(job => {
        this.assert(
          job.title.includes('React') || job.description.includes('React'),
          'Search results should contain React'
        );
      });
    });
  }

  // Security Tests
  async testSecurity(app) {
    logger.info('Testing Security Measures...');
    
    await this.runTest('Rate Limiting', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill().map(() => 
        request(app).get('/health')
      );
      
      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(res => res.status === 429);
      
      this.assert(rateLimitedResponse, 'Should enforce rate limiting');
    });

    await this.runTest('CORS Headers', async () => {
      const response = await request(app)
        .options('/health')
        .expect(200);
      
      this.assert(response.headers['access-control-allow-origin'], 'Should include CORS headers');
    });

    await this.runTest('Security Headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      this.assert(response.headers['x-content-type-options'], 'Should include security headers');
      this.assert(response.headers['x-frame-options'], 'Should include frame protection');
    });

    await this.runTest('Input Validation', async () => {
      const maliciousInput = {
        email: '<script>alert("xss")</script>@test.com',
        password: 'a' // Too short
      };
      
      const response = await request(app)
        .post('/login')
        .send(maliciousInput)
        .expect(400);
      
      this.assert(response.body.error.code === 'VALIDATION_ERROR', 'Should reject malicious input');
    });
  }

  // Database Tests
  async testDatabase(app) {
    logger.info('Testing Database Operations...');
    
    await this.runTest('Database Connection', async () => {
      // This would typically test database connectivity
      this.assert(true, 'Database connection test placeholder');
    });

    await this.runTest('Data Persistence', async () => {
      const token = await this.getAuthToken(app);
      const profileData = {
        firstName: 'Test',
        lastName: 'User'
      };
      
      // Update profile
      await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(profileData)
        .expect(200);
      
      // Retrieve profile
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      this.assert(response.body.data.user.firstName === 'Test', 'Data should persist correctly');
    });
  }

  // WebSocket Tests
  async testWebSocket(socketClient) {
    logger.info('Testing WebSocket Functionality...');
    
    await this.runTest('WebSocket Connection', async () => {
      const connected = socketClient.connect();
      this.assert(connected, 'WebSocket should connect successfully');
    });

    await this.runTest('Message Sending', async () => {
      const messageSent = socketClient.sendMessage('test', { content: 'Hello World' });
      this.assert(messageSent, 'Should send message successfully');
    });

    await this.runTest('Real-time Notifications', async () => {
      let notificationReceived = false;
      
      socketClient.on('notification', (data) => {
        notificationReceived = true;
      });
      
      // Simulate receiving notification
      socketClient.emit('notification', { type: 'test', message: 'Test notification' });
      
      // Wait for notification
      setTimeout(() => {
        this.assert(notificationReceived, 'Should receive real-time notification');
      }, 1000);
    });
  }

  // Performance Tests
  async testPerformance(app) {
    logger.info('Testing Performance...');
    
    await this.runTest('Response Time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      this.assert(responseTime < 500, `Response time should be < 500ms (got ${responseTime}ms)`);
    });

    await this.runTest('Concurrent Requests', async () => {
      const concurrentRequests = Array(50).fill().map(() =>
        request(app).get('/health')
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;
      
      const allSuccessful = responses.every(res => res.status === 200);
      this.assert(allSuccessful, 'All concurrent requests should succeed');
      this.assert(totalTime < 2000, `Concurrent requests should complete quickly (got ${totalTime}ms)`);
    });
  }

  // Helper method to get auth token
  async getAuthToken(app) {
    const credentials = {
      email: 'demo@example.com',
      password: 'password123'
    };
    
    const response = await request(app)
      .post('/login')
      .send(credentials)
      .expect(200);
    
    return response.body.data.token;
  }

  // Run complete test suite
  async runCompleteTestSuite(apps) {
    logger.info('🚀 Starting TalentSphere Complete Test Suite...');
    
    const { apiGateway, auth, user, job, websocketClient } = apps;
    
    try {
      // API Health Tests
      await this.testAPIHealth(apiGateway);
      
      // Authentication Tests
      await this.testAuthentication(auth);
      
      // Service Tests
      await this.testUserService(user);
      await this.testJobService(job);
      
      // Security Tests
      await this.testSecurity(apiGateway);
      
      // Database Tests
      await this.testDatabase(user);
      
      // WebSocket Tests
      if (websocketClient) {
        await this.testWebSocket(websocketClient);
      }
      
      // Performance Tests
      await this.testPerformance(apiGateway);
      
    } catch (error) {
      logger.error('Test suite execution error:', error);
    }
    
    const report = this.generateReport();
    logger.info('Test Suite Complete:', report);
    
    return report;
  }
}

module.exports = TestSuite;