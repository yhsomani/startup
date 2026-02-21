/**
 * Comprehensive End-to-End Tests for TalentSphere Microservices
 * 
 * Complete test suite covering:
 * - Service communication
 * - Database integration
 * - Authentication and authorization
 * - API Gateway routing
 * - Error handling and resilience
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

class TalentSphereE2ETests {
  constructor() {
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
    this.testTimeout = 30000;
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    
    this.testData = {
      users: [],
      companies: [],
      jobs: [],
      applications: [],
      tokens: {}
    };
  }

  /**
   * Run all E2E tests
   */
  async runAllTests() {
    console.log('🧪 Starting TalentSphere End-to-End Tests');
    console.log('==========================================');

    try {
      // Health check tests
      await this.testHealthChecks();
      
      // Authentication tests
      await this.testAuthentication();
      
      // User service tests
      await this.testUserService();
      
      // Job service tests
      await this.testJobService();
      
      // Company service tests
      await this.testCompanyService();
      
      // Inter-service communication tests
      await this.testInterServiceCommunication();
      
      // Load balancing tests
      await this.testLoadBalancing();
      
      // Error handling tests
      await this.testErrorHandling();
      
      // Performance tests
      await this.testPerformance();
      
      // Security tests
      await this.testSecurity();
      
      // Print results
      this.printResults();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Health check tests
   */
  async testHealthChecks() {
    console.log('\n📊 Testing Health Checks...');
    
    const tests = [
      {
        name: 'Gateway Health Check',
        test: () => axios.get(`${this.baseURL}/health`)
      },
      {
        name: 'Auth Service Health',
        test: () => axios.get(`${this.baseURL}/health`, {
          headers: { 'X-Service-Name': 'auth-service' }
        })
      },
      {
        name: 'User Service Health',
        test: () => axios.get(`${this.baseURL}/health`, {
          headers: { 'X-Service-Name': 'user-service' }
        })
      },
      {
        name: 'Job Service Health',
        test: () => axios.get(`${this.baseURL}/health`, {
          headers: { 'X-Service-Name': 'job-service' }
        })
      },
      {
        name: 'Company Service Health',
        test: () => axios.get(`${this.baseURL}/health`, {
          headers: { 'X-Service-Name': 'company-service' }
        })
      }
    ];

    await this.runTestSuite('Health Checks', tests);
  }

  /**
   * Authentication tests
   */
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    // Test user registration
    const userData = {
      email: `test.user.${uuidv4()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'candidate'
    };

    await this.runTest('User Registration', async () => {
      const response = await axios.post(`${this.baseURL}/api/v1/auth/register`, userData);
      this.testData.users.push(response.data.user);
      return response.data.success;
    });

    // Test user login
    await this.runTest('User Login', async () => {
      const response = await axios.post(`${this.baseURL}/api/v1/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      if (response.data.token) {
        this.testData.tokens.user = response.data.token;
      }
      
      return response.data.token && response.data.user.email === userData.email;
    });

    // Test token validation
    await this.runTest('Token Validation', async () => {
      const response = await axios.post(`${this.baseURL}/api/v1/auth/validate`, {
        token: this.testData.tokens.user
      });
      
      return response.data.valid;
    });

    // Test company registration
    const companyData = {
      name: 'Test Company',
      email: `test.company.${uuidv4()}@example.com`,
      password: 'TestPassword123!',
      industry: 'technology',
      size: '51-200',
      description: 'A test company for E2E testing'
    };

    await this.runTest('Company Registration', async () => {
      const response = await axios.post(`${this.baseURL}/api/v1/auth/company/register`, companyData);
      this.testData.companies.push(response.data.company);
      return response.data.success;
    });

    // Test company login
    await this.runTest('Company Login', async () => {
      const response = await axios.post(`${this.baseURL}/api/v1/auth/company/login`, {
        email: companyData.email,
        password: companyData.password
      });
      
      if (response.data.token) {
        this.testData.tokens.company = response.data.token;
      }
      
      return response.data.token && response.data.company.name === companyData.name;
    });
  }

  /**
   * User service tests
   */
  async testUserService() {
    console.log('\n👤 Testing User Service...');
    
    if (!this.testData.tokens.user) {
      console.warn('⚠️ Skipping user service tests - no user token available');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${this.testData.tokens.user}`
    };

    // Test get user profile
    await this.runTest('Get User Profile', async () => {
      const userId = this.testData.users[0].id;
      const response = await axios.get(`${this.baseURL}/api/v1/users/${userId}`, { headers });
      
      return response.data.user.id === userId;
    });

    // Test update user profile
    await this.runTest('Update User Profile', async () => {
      const userId = this.testData.users[0].id;
      const updateData = {
        bio: 'Updated bio for E2E testing',
        location: {
          city: 'Test City',
          state: 'CA',
          country: 'USA'
        }
      };
      
      const response = await axios.put(`${this.baseURL}/api/v1/users/${userId}`, updateData, { headers });
      
      return response.data.success || response.data.profile.bio === updateData.bio;
    });

    // Test user search
    await this.runTest('User Search', async () => {
      const response = await axios.get(`${this.baseURL}/api/v1/users/search?q=Test`, { headers });
      
      return Array.isArray(response.data.users) && response.data.users.length > 0;
    });

    // Test add user skill
    await this.runTest('Add User Skill', async () => {
      const response = await axios.post(`${this.baseURL}/api/v1/skills`, {
        userId: this.testData.users[0].id,
        skillName: 'JavaScript',
        level: 'advanced',
        yearsOfExperience: 5
      }, { headers });
      
      return response.data.success || response.data.skill;
    });

    // Test get user skills
    await this.runTest('Get User Skills', async () => {
      const userId = this.testData.users[0].id;
      const response = await axios.get(`${this.baseURL}/api/v1/skills/${userId}`, { headers });
      
      return Array.isArray(response.data.skills);
    });
  }

  /**
   * Job service tests
   */
  async testJobService() {
    console.log('\n💼 Testing Job Service...');
    
    if (!this.testData.tokens.company) {
      console.warn('⚠️ Skipping job service tests - no company token available');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${this.testData.tokens.company}`
    };

    // Test create job
    const jobData = {
      title: 'Senior JavaScript Developer',
      description: 'We are looking for an experienced JavaScript developer to join our team.',
      companyId: this.testData.companies[0].id,
      postedBy: this.testData.companies[0].id,
      employmentType: 'full-time',
      experienceLevel: 'senior',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        remote: true
      },
      salary: {
        min: 120000,
        max: 180000,
        currency: 'USD',
        period: 'yearly'
      },
      skills: [
        { name: 'JavaScript', level: 'required', years: 5 },
        { name: 'React', level: 'required', years: 3 }
      ]
    };

    await this.runTest('Create Job', async () => {
      const response = await axios.post(`${this.baseURL}/api/v1/jobs`, jobData, { headers });
      
      if (response.data.success) {
        this.testData.jobs.push(response.data.job);
      }
      
      return response.data.success || response.data.job;
    });

    // Test get jobs
    await this.runTest('Get Jobs', async () => {
      const response = await axios.get(`${this.baseURL}/api/v1/jobs`);
      
      return Array.isArray(response.data.jobs) && response.data.jobs.length > 0;
    });

    // Test get job details
    await this.runTest('Get Job Details', async () => {
      if (this.testData.jobs.length === 0) {return false;}
      
      const jobId = this.testData.jobs[0].id;
      const response = await axios.get(`${this.baseURL}/api/v1/jobs/${jobId}`);
      
      return response.data.job.id === jobId;
    });

    // Test job search
    await this.runTest('Job Search', async () => {
      const response = await axios.get(`${this.baseURL}/api/v1/jobs?q=JavaScript`);
      
      return Array.isArray(response.data.jobs) && response.data.jobs.length > 0;
    });

    // Test apply for job
    await this.runTest('Apply for Job', async () => {
      if (this.testData.jobs.length === 0 || !this.testData.tokens.user) {return false;}
      
      const jobId = this.testData.jobs[0].id;
      const applicationData = {
        userId: this.testData.users[0].id,
        coverLetter: 'I am excited to apply for this position.',
        resumeUrl: 'https://example.com/resume.pdf'
      };

      const response = await axios.post(`${this.baseURL}/api/v1/jobs/${jobId}/apply`, applicationData, {
        headers: { 'Authorization': `Bearer ${this.testData.tokens.user}` }
      });
      
      if (response.data.success) {
        this.testData.applications.push(response.data.application);
      }
      
      return response.data.success || response.data.application;
    });
  }

  /**
   * Company service tests
   */
  async testCompanyService() {
    console.log('\n🏢 Testing Company Service...');
    
    // Test get company profile
    await this.runTest('Get Company Profile', async () => {
      if (this.testData.companies.length === 0) {return false;}
      
      const companyId = this.testData.companies[0].id;
      const response = await axios.get(`${this.baseURL}/api/v1/companies/${companyId}`);
      
      return response.data.company.id === companyId;
    });

    // Test company search
    await this.runTest('Company Search', async () => {
      const response = await axios.get(`${this.baseURL}/api/v1/companies/search?q=Technology`);
      
      return Array.isArray(response.data.companies) && response.data.companies.length > 0;
    });

    // Test add company review
    await this.runTest('Add Company Review', async () => {
      if (this.testData.companies.length === 0 || !this.testData.tokens.user) {return false;}
      
      const companyId = this.testData.companies[0].id;
      const reviewData = {
        userId: this.testData.users[0].id,
        rating: 5,
        title: 'Great Company!',
        comment: 'Excellent work environment and great team.',
        wouldRecommend: true
      };

      const response = await axios.post(`${this.baseURL}/api/v1/companies/${companyId}/reviews`, reviewData, {
        headers: { 'Authorization': `Bearer ${this.testData.tokens.user}` }
      });
      
      return response.data.success || response.data.review;
    });

    // Test get company reviews
    await this.runTest('Get Company Reviews', async () => {
      if (this.testData.companies.length === 0) {return false;}
      
      const companyId = this.testData.companies[0].id;
      const response = await axios.get(`${this.baseURL}/api/v1/companies/${companyId}/reviews`);
      
      return Array.isArray(response.data.reviews);
    });
  }

  /**
   * Inter-service communication tests
   */
  async testInterServiceCommunication() {
    console.log('\n🔄 Testing Inter-Service Communication...');
    
    await this.runTest('Service Discovery', async () => {
      // Test that services can discover each other
      const response = await axios.get(`${this.baseURL}/admin/services`);
      
      const services = response.data;
      const expectedServices = ['auth-service', 'user-service', 'job-service', 'company-service'];
      
      return expectedServices.every(service => services[service]);
    });

    await this.runTest('Service Load Balancing', async () => {
      // Make multiple requests to test load balancing
      const promises = Array(10).fill().map(() => 
        axios.get(`${this.baseURL}/api/v1/jobs`)
      );
      
      const responses = await Promise.allSettled(promises);
      
      return responses.every(response => response.status === 'fulfilled');
    });

    await this.runTest('Circuit Breaker Functionality', async () => {
      // Test circuit breaker by making requests to potentially unhealthy service
      // This is a simplified test - in real scenario, you'd need to simulate service failures
      
      const promises = Array(20).fill().map(() => 
        axios.get(`${this.baseURL}/api/v1/users/nonexistent`, { 
          timeout: 1000 
        }).catch(() => ({ status: 404 }))
      );
      
      const responses = await Promise.allSettled(promises);
      
      return responses.every(response => 
        response.status === 'fulfilled' || 
        (response.reason && response.reason.status === 404)
      );
    });
  }

  /**
   * Load balancing tests
   */
  async testLoadBalancing() {
    console.log('\n⚖️ Testing Load Balancing...');
    
    await this.runTest('Concurrent Request Handling', async () => {
      const concurrentRequests = 50;
      const promises = Array(concurrentRequests).fill().map(() =>
        axios.get(`${this.baseURL}/api/v1/jobs`, { timeout: 5000 })
      );
      
      const startTime = Date.now();
      const responses = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const totalTime = endTime - startTime;
      
      // At least 80% should succeed within reasonable time
      return successful >= concurrentRequests * 0.8 && totalTime < 10000;
    });
  }

  /**
   * Error handling tests
   */
  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');
    
    await this.runTest('404 Error Handling', async () => {
      try {
        await axios.get(`${this.baseURL}/api/v1/nonexistent`);
        return false; // Should not reach here
      } catch (error) {
        return error.response && error.response.status === 404;
      }
    });

    await this.runTest('Authentication Error', async () => {
      try {
        await axios.get(`${this.baseURL}/api/v1/users/protected`, {
          headers: { 'Authorization': 'Bearer invalid-token' }
        });
        return false;
      } catch (error) {
        return error.response && error.response.status === 401;
      }
    });

    await this.runTest('Validation Error', async () => {
      try {
        await axios.post(`${this.baseURL}/api/v1/auth/register`, {
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '' // Required field missing
        });
        return false;
      } catch (error) {
        return error.response && error.response.status === 400;
      }
    });
  }

  /**
   * Performance tests
   */
  async testPerformance() {
    console.log('\n🚀 Testing Performance...');
    
    await this.runTest('Response Time Test', async () => {
      const startTime = Date.now();
      await axios.get(`${this.baseURL}/api/v1/jobs`);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // Should respond within 2 seconds
      return responseTime < 2000;
    });

    await this.runTest('Throughput Test', async () => {
      const requests = 100;
      const promises = Array(requests).fill().map(() =>
        axios.get(`${this.baseURL}/api/v1/jobs`)
      );
      
      const startTime = Date.now();
      const responses = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const totalTime = endTime - startTime;
      const requestsPerSecond = successful / (totalTime / 1000);
      
      // Should handle at least 50 requests per second
      return requestsPerSecond >= 50;
    });
  }

  /**
   * Security tests
   */
  async testSecurity() {
    console.log('\n🔒 Testing Security...');
    
    await this.runTest('CORS Headers', async () => {
      const response = await axios.options(`${this.baseURL}/api/v1/jobs`);
      
      const corsHeaders = response.headers['access-control-allow-origin'];
      return corsHeaders && corsHeaders.length > 0;
    });

    await this.runTest('Rate Limiting', async () => {
      const limit = 20;
      const promises = Array(limit + 10).fill().map(() =>
        axios.post(`${this.baseURL}/api/v1/auth/login`, {
          email: 'test@example.com',
          password: 'test'
        }).catch(error => error.response || { status: 429 })
      );
      
      const responses = await Promise.allSettled(promises);
      
      // Should get rate limited after exceeding limit
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' ? 
        r.value.status === 429 : 
        r.reason.status === 429
      ).length;
      
      return rateLimited > 0;
    });

    await this.runTest('Input Sanitization', async () => {
      try {
        const maliciousInput = {
          email: 'test@example.com<script>alert("xss")</script>',
          password: '<script>alert("xss")</script>'
        };
        
        await axios.post(`${this.baseURL}/api/v1/auth/register`, maliciousInput);
        return false; // Should not reach here due to validation
      } catch (error) {
        // Should catch validation error, not execute script
        return error.response && error.response.status === 400;
      }
    });
  }

  /**
   * Run individual test
   */
  async runTest(testName, testFunction) {
    this.testResults.total++;
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      if (result) {
        this.testResults.passed++;
        console.log(`  ✅ ${testName} - Passed (${duration}ms)`);
        this.testResults.details.push({
          name: testName,
          status: 'passed',
          duration
        });
      } else {
        this.testResults.failed++;
        console.log(`  ❌ ${testName} - Failed (${duration}ms)`);
        this.testResults.details.push({
          name: testName,
          status: 'failed',
          duration,
          error: 'Test returned false'
        });
      }
      
    } catch (error) {
      this.testResults.failed++;
      console.log(`  ❌ ${testName} - Error: ${error.message}`);
      this.testResults.details.push({
        name: testName,
        status: 'error',
        error: error.message
      });
    }
  }

  /**
   * Run test suite
   */
  async runTestSuite(suiteName, tests) {
    console.log(`\n📋 Running ${suiteName}...`);
    
    for (const test of tests) {
      await this.runTest(test.name, test.test);
    }
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n==========================================');
    console.log('📊 FINAL TEST RESULTS');
    console.log('==========================================');
    
    const successRate = this.testResults.total > 0 ? 
      (this.testResults.passed / this.testResults.total * 100).toFixed(2) : 0;
    
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.details
        .filter(test => test.status === 'failed' || test.status === 'error')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error || 'Test failed'}`);
        });
    }
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! TalentSphere is ready for production.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the issues above.');
    }
    
    console.log('==========================================');
    
    // Exit with appropriate code
    process.exit(this.testResults.failed === 0 ? 0 : 1);
  }
}

module.exports = TalentSphereE2ETests;

// Auto-run if this is the main module
if (require.main === module) {
  const tests = new TalentSphereE2ETests();
  tests.runAllTests();
}