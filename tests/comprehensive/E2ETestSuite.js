/**
 * End-to-End Integration Tests
 * Complete integration testing for TalentSphere platform
 */

const TestSuite = require('./TestSuite');
const request = require('supertest');

class E2ETestSuite extends TestSuite {
  constructor() {
    super();
    this.setupData = {};
  }

  // Complete user journey test
  async testCompleteUserJourney(apps) {
    logger.info('Testing Complete User Journey...');
    
    await this.runTest('User Registration → Login → Profile Setup → Job Search → Application', async () => {
      const { auth, user, job } = apps;
      
      // Step 1: User Registration
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@journey.com',
        password: 'JourneyTest123!',
        agreeToTerms: true
      };
      
      const registerResponse = await request(auth)
        .post('/register')
        .send(userData)
        .expect(201);
      
      this.assert(registerResponse.body.success, 'Registration should succeed');
      
      // Step 2: Login
      const loginResponse = await request(auth)
        .post('/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
      
      this.assert(loginResponse.body.success, 'Login should succeed');
      const token = loginResponse.body.data.token;
      
      // Step 3: Profile Setup
      const profileData = {
        title: 'Software Engineer',
        bio: 'Experienced software engineer looking for new opportunities',
        location: 'San Francisco, CA',
        skills: ['JavaScript', 'React', 'Node.js']
      };
      
      const profileResponse = await request(user)
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(profileData)
        .expect(200);
      
      this.assert(profileResponse.body.success, 'Profile update should succeed');
      
      // Step 4: Job Search
      const searchResponse = await request(job)
        .get('/jobs/search?q=React')
        .expect(200);
      
      this.assert(searchResponse.body.data.jobs.length > 0, 'Should find React jobs');
      
      // Step 5: Job Application
      const jobToApply = searchResponse.body.data.jobs[0];
      const applicationData = {
        coverLetter: 'I am interested in this React position...',
        portfolioUrl: 'https://portfolio.example.com'
      };
      
      const applicationResponse = await request(job)
        .post(`/jobs/${jobToApply.id}/apply`)
        .set('Authorization', `Bearer ${token}`)
        .send(applicationData)
        .expect(201);
      
      this.assert(applicationResponse.body.success, 'Application should succeed');
    });
  }

  // Multi-service integration test
  async testServiceIntegration(apps) {
    logger.info('Testing Service Integration...');
    
    await this.runTest('Auth Service ↔ User Service Integration', async () => {
      const { auth, user } = apps;
      
      // Register user through auth service
      const userData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com',
        password: 'IntegrationTest123!',
        agreeToTerms: true
      };
      
      const registerResponse = await request(auth)
        .post('/register')
        .send(userData)
        .expect(201);
      
      const token = registerResponse.body.data.token;
      
      // Verify user was created in user service
      const profileResponse = await request(user)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      this.assert(profileResponse.body.data.user.email === userData.email, 'User should exist in user service');
    });
  }

  // Data consistency test
  async testDataConsistency(apps) {
    logger.info('Testing Data Consistency...');
    
    await this.runTest('User Data Consistency Across Services', async () => {
      const { auth, user, job } = apps;
      
      // Register and login
      const userData = {
        firstName: 'Consistency',
        lastName: 'Test',
        email: 'consistency@test.com',
        password: 'ConsistencyTest123!',
        agreeToTerms: true
      };
      
      const loginResponse = await request(auth)
        .post('/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
      
      const token = loginResponse.body.data.token;
      
      // Update profile in user service
      const profileUpdate = {
        title: 'Senior Developer',
        bio: 'Updated bio for consistency test',
        location: 'New York, NY'
      };
      
      await request(user)
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(profileUpdate)
        .expect(200);
      
      // Verify profile reflects updates
      const profileResponse = await request(user)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      const profile = profileResponse.body.data.user;
      this.assert(profile.title === profileUpdate.title, 'Profile title should be updated');
      this.assert(profile.bio === profileUpdate.bio, 'Profile bio should be updated');
      this.assert(profile.location === profileUpdate.location, 'Profile location should be updated');
    });
  }

  // Error handling test
  async testErrorHandling(apps) {
    logger.info('Testing Error Handling...');
    
    await this.runTest('Graceful Error Handling', async () => {
      const { user } = apps;
      
      // Test with invalid auth token
      const response = await request(user)
        .get('/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      this.assert(response.body.error.code === 'UNAUTHORIZED', 'Should handle invalid token gracefully');
      this.assert(response.body.error.message, 'Should provide error message');
      this.assert(response.body.error.requestId, 'Should include request ID for tracing');
    });

    await this.runTest('Input Validation Error Handling', async () => {
      const { auth } = apps;
      
      const invalidData = {
        email: 'invalid-email',
        password: '123' // Too short
      };
      
      const response = await request(auth)
        .post('/login')
        .send(invalidData)
        .expect(400);
      
      this.assert(response.body.error.code === 'VALIDATION_ERROR', 'Should return validation error');
      this.assert(Array.isArray(response.body.error.details), 'Should provide validation details');
    });
  }

  // Performance under load test
  async testPerformanceUnderLoad(apps) {
    logger.info('Testing Performance Under Load...');
    
    await this.runTest('Load Testing - 100 Concurrent Users', async () => {
      const { apiGateway } = apps;
      const concurrentUsers = 100;
      
      const startTime = Date.now();
      
      // Simulate 100 concurrent users
      const userRequests = Array(concurrentUsers).fill().map((_, index) =>
        request(apiGateway)
          .get('/health')
          .set('X-User-ID', `user-${index}`)
      );
      
      const responses = await Promise.all(userRequests);
      const totalTime = Date.now() - startTime;
      
      // Verify all requests succeeded
      const successfulResponses = responses.filter(res => res.status === 200);
      this.assert(
        successfulResponses.length === concurrentUsers,
        `All ${concurrentUsers} requests should succeed (got ${successfulResponses.length})`
      );
      
      // Verify response time is reasonable
      const avgResponseTime = totalTime / concurrentUsers;
      this.assert(
        avgResponseTime < 1000,
        `Average response time should be < 1000ms (got ${avgResponseTime}ms)`
      );
    });
  }

  // WebSocket integration test
  async testWebSocketIntegration(apps) {
    logger.info('Testing WebSocket Integration...');
    
    await this.runTest('Real-time Message Delivery', async () => {
      const { websocketClient } = apps;
      
      let messageReceived = false;
      
      // Connect and listen for messages
      websocketClient.connect();
      websocketClient.on('new_message', (data) => {
        if (data.content === 'Test message') {
          messageReceived = true;
        }
      });
      
      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send message
      websocketClient.sendMessage('send_message', {
        conversationId: 'test-conversation',
        content: 'Test message'
      });
      
      // Wait for message delivery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.assert(messageReceived, 'Message should be delivered in real-time');
    });
  }

  // Security integration test
  async testSecurityIntegration(apps) {
    logger.info('Testing Security Integration...');
    
    await this.runTest('End-to-End Security Flow', async () => {
      const { auth, user } = apps;
      
      // Test SQL injection attempt
      const maliciousInput = {
        email: "'; DROP TABLE users; --",
        password: 'password'
      };
      
      const response = await request(auth)
        .post('/login')
        .send(maliciousInput);
      
      // Should not be successful and should not cause server error
      this.assert(response.status !== 500, 'Should handle SQL injection attempt');
      this.assert(response.status === 400 || response.status === 401, 'Should reject malicious input');
    });

    await this.runTest('Rate Limiting Across Services', async () => {
      const { auth } = apps;
      
      // Make rapid requests to trigger rate limiting
      const rapidRequests = Array(20).fill().map(() =>
        request(auth).get('/health')
      );
      
      const responses = await Promise.all(rapidRequests);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      this.assert(rateLimitedResponses.length > 0, 'Should enforce rate limiting');
    });
  }

  // Run complete E2E test suite
  async runCompleteE2ETestSuite(apps) {
    logger.info('🚀 Starting TalentSphere End-to-End Test Suite...');
    
    try {
      // User Journey Tests
      await this.testCompleteUserJourney(apps);
      
      // Service Integration Tests
      await this.testServiceIntegration(apps);
      
      // Data Consistency Tests
      await this.testDataConsistency(apps);
      
      // Error Handling Tests
      await this.testErrorHandling(apps);
      
      // Performance Tests
      await this.testPerformanceUnderLoad(apps);
      
      // WebSocket Tests
      await this.testWebSocketIntegration(apps);
      
      // Security Tests
      await this.testSecurityIntegration(apps);
      
    } catch (error) {
      logger.error('E2E Test suite execution error:', error);
    }
    
    const report = this.generateReport();
    logger.info('E2E Test Suite Complete:', report);
    
    return report;
  }
}

module.exports = E2ETestSuite;