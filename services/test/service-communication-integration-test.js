/**
 * Integration Test for HTTP Client and Service Communication
 * 
 * Tests the complete integration between services using HTTP client,
 * service registry, and authentication
 */

const assert = require('assert');
const { ServiceClientFactory } = require('../shared/service-client-factory');
const { ServiceRegistry } = require('../shared/service-registry');
const { InterServiceAuth } = require('../shared/inter-service-auth');
const { MetricsCollector } = require('../shared/metrics');

/**
 * Integration test suite for service communication
 */
class ServiceCommunicationIntegrationTest {
  constructor() {
    this.metrics = new MetricsCollector();
    this.serviceRegistry = new ServiceRegistry(this.metrics);
    this.interServiceAuth = new InterServiceAuth(this.metrics);
    this.serviceClientFactory = null;
  }

  /**
   * Setup test environment
   */
  async setup() {
    console.log('🔧 Setting up integration test environment...');

    // Initialize service client factory
    this.serviceClientFactory = new ServiceClientFactory(
      this.serviceRegistry,
      {
        getCorrelationId: () => `test-${Date.now()}`,
        getCurrentTraceId: () => `trace-${Date.now()}`,
        createSpan: (name) => ({
          setTag: () => {},
          logEvent: () => {},
          logError: () => {},
          finish: () => {}
        }),
        startSpan: (name, context) => ({
          setTag: () => {},
          logEvent: () => {},
          logError: () => {},
          finish: () => {}
        })
      },
      this.metrics
    );

    // Register test services
    await this.registerTestServices();

    // Register service credentials
    this.registerServiceCredentials();

    console.log('✅ Test environment setup complete');
  }

  /**
   * Register test services in the service registry
   */
  async registerTestServices() {
    const testServices = [
      {
        serviceName: 'user-service',
        url: 'http://localhost:3002',
        host: 'localhost',
        port: 3002,
        version: '1.0.0',
        region: 'local'
      },
      {
        serviceName: 'job-service',
        url: 'http://localhost:3003',
        host: 'localhost',
        port: 3003,
        version: '1.0.0',
        region: 'local'
      },
      {
        serviceName: 'company-service',
        url: 'http://localhost:3004',
        host: 'localhost',
        port: 3004,
        version: '1.0.0',
        region: 'local'
      },
      {
        serviceName: 'auth-service',
        url: 'http://localhost:3001',
        host: 'localhost',
        port: 3001,
        version: '1.0.0',
        region: 'local'
      }
    ];

    for (const service of testServices) {
      await this.serviceRegistry.registerService(service);
      console.log(`📝 Registered service: ${service.serviceName}`);
    }
  }

  /**
   * Register service credentials for authentication
   */
  registerServiceCredentials() {
    const serviceCredentials = [
      {
        serviceId: 'user-service-1',
        serviceName: 'user-service',
        secretKey: 'user-service-secret-key',
        permissions: [
          'users.read',
          'users.write',
          'profiles.read',
          'profiles.write'
        ],
        roles: ['user-service', 'data-owner']
      },
      {
        serviceId: 'job-service-1',
        serviceName: 'job-service',
        secretKey: 'job-service-secret-key',
        permissions: [
          'jobs.read',
          'jobs.write',
          'applications.read',
          'applications.write'
        ],
        roles: ['job-service', 'data-owner']
      },
      {
        serviceId: 'company-service-1',
        serviceName: 'company-service',
        secretKey: 'company-service-secret-key',
        permissions: [
          'companies.read',
          'companies.write',
          'reviews.read',
          'reviews.write'
        ],
        roles: ['company-service', 'data-owner']
      },
      {
        serviceId: 'auth-service-1',
        serviceName: 'auth-service',
        secretKey: 'auth-service-secret-key',
        permissions: [
          'auth.read',
          'auth.write',
          'tokens.read',
          'tokens.write'
        ],
        roles: ['auth-service', 'admin']
      }
    ];

    serviceCredentials.forEach(cred => {
      this.interServiceAuth.registerServiceCredentials(cred);
    });
  }

  /**
   * Test service registration and discovery
   */
  async testServiceRegistry() {
    console.log('\n🔍 Testing Service Registry...');

    // Test getting a service
    try {
      const userService = await this.serviceRegistry.getService('user-service');
      assert(userService.serviceName === 'user-service', 'Service name should match');
      assert(userService.url === 'http://localhost:3002', 'Service URL should match');
      console.log('✅ Service discovery working correctly');
    } catch (error) {
      console.error('❌ Service discovery failed:', error.message);
      throw error;
    }

    // Test getting all services
    try {
      const allServices = await this.serviceRegistry.getAllServices();
      assert(Object.keys(allServices).length === 4, 'Should have 4 registered services');
      assert(allServices['user-service'].length === 1, 'User service should have 1 instance');
      console.log('✅ Service listing working correctly');
    } catch (error) {
      console.error('❌ Service listing failed:', error.message);
      throw error;
    }

    // Test registry statistics
    try {
      const stats = this.serviceRegistry.getRegistryStats();
      assert(stats.totalServices === 4, 'Should have 4 total services');
      assert(stats.totalInstances === 4, 'Should have 4 total instances');
      console.log('✅ Registry statistics working correctly');
    } catch (error) {
      console.error('❌ Registry statistics failed:', error.message);
      throw error;
    }
  }

  /**
   * Test authentication and authorization
   */
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    // Test token generation
    try {
      const token = await this.interServiceAuth.generateToken(
        'user-service-1',
        'job-service'
      );
      
      assert(token.token, 'Token should be generated');
      assert(token.type === 'jwt', 'Token type should be JWT');
      assert(token.expiresAt > new Date(), 'Token should not be expired');
      console.log('✅ Token generation working correctly');
    } catch (error) {
      console.error('❌ Token generation failed:', error.message);
      throw error;
    }

    // Test token validation
    try {
      const token = await this.interServiceAuth.generateToken(
        'user-service-1',
        'job-service'
      );
      
      const validation = await this.interServiceAuth.validateToken(
        token.token,
        'job-service'
      );
      
      assert(validation.valid, 'Token should be valid');
      assert(validation.serviceId === 'user-service-1', 'Service ID should match');
      assert(validation.serviceName === 'user-service', 'Service name should match');
      assert(validation.permissions.includes('users.read'), 'Should have users.read permission');
      console.log('✅ Token validation working correctly');
    } catch (error) {
      console.error('❌ Token validation failed:', error.message);
      throw error;
    }

    // Test permission checking
    try {
      const hasPermission = await this.interServiceAuth.hasPermission(
        'user-service-1',
        'users.read'
      );
      assert(hasPermission, 'User service should have users.read permission');

      const noPermission = await this.interServiceAuth.hasPermission(
        'user-service-1',
        'admin.write'
      );
      assert(!noPermission, 'User service should not have admin.write permission');
      console.log('✅ Permission checking working correctly');
    } catch (error) {
      console.error('❌ Permission checking failed:', error.message);
      throw error;
    }

    // Test auth headers generation
    try {
      const headers = await this.interServiceAuth.getAuthHeaders(
        'user-service-1',
        'job-service'
      );
      
      assert(headers['Authorization'], 'Should have Authorization header');
      assert(headers['X-Service-ID'] === 'user-service-1', 'Should have Service ID header');
      assert(headers['X-Request-Time'], 'Should have Request Time header');
      console.log('✅ Auth headers generation working correctly');
    } catch (error) {
      console.error('❌ Auth headers generation failed:', error.message);
      throw error;
    }

    // Test token extraction
    try {
      const token = await this.interServiceAuth.generateToken('user-service-1');
      const headers = await this.interServiceAuth.getAuthHeaders('user-service-1');
      
      const extraction = await this.interServiceAuth.extractTokenFromHeaders(headers);
      assert(extraction.valid, 'Token extraction should be valid');
      assert(extraction.serviceId === 'user-service-1', 'Extracted service ID should match');
      console.log('✅ Token extraction working correctly');
    } catch (error) {
      console.error('❌ Token extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Test HTTP client functionality
   */
  async testHttpClient() {
    console.log('\n🌐 Testing HTTP Client...');

    // Test service client creation
    try {
      const client = this.serviceClientFactory.createClient('test-client');
      assert(client, 'Client should be created');
      console.log('✅ Service client creation working correctly');
    } catch (error) {
      console.error('❌ Service client creation failed:', error.message);
      throw error;
    }

    // Test circuit breaker states
    try {
      const client = this.serviceClientFactory.createClient('test-client');
      const states = client.getCircuitBreakerStates();
      assert(typeof states === 'object', 'Circuit breaker states should be an object');
      console.log('✅ Circuit breaker states working correctly');
    } catch (error) {
      console.error('❌ Circuit breaker states failed:', error.message);
      throw error;
    }

    // Test client factory health status
    try {
      const health = this.serviceClientFactory.getHealthStatus();
      assert(typeof health === 'object', 'Health status should be an object');
      assert(health['test-client'], 'Should have test client in health status');
      console.log('✅ Client factory health status working correctly');
    } catch (error) {
      console.error('❌ Client factory health status failed:', error.message);
      throw error;
    }
  }

  /**
   * Test complete integration flow
   */
  async testIntegrationFlow() {
    console.log('\n🔄 Testing Complete Integration Flow...');

    try {
      // Step 1: Get authentication headers
      const authHeaders = await this.interServiceAuth.getAuthHeaders(
        'user-service-1',
        'job-service'
      );

      // Step 2: Create service client for user service
      const userClient = this.serviceClientFactory.createClient('user-service-integration', {
        headers: authHeaders
      });

      // Step 3: Get service instance for job service
      const jobService = await this.serviceRegistry.getService('job-service');

      // Step 4: Simulate making a request (would normally go to actual service)
      console.log('📡 Simulating request from user-service to job-service');
      console.log(`   Target URL: ${jobService.url}`);
      console.log(`   Auth Token: ${authHeaders.Authorization.substring(0, 20)}...`);
      console.log(`   Service ID: ${authHeaders['X-Service-ID']}`);

      // Step 5: Validate the token at the receiving end
      const tokenValidation = await this.interServiceAuth.extractTokenFromHeaders(authHeaders);
      assert(tokenValidation.valid, 'Token should be valid at receiving end');
      assert(tokenValidation.serviceId === 'user-service-1', 'Service ID should match');

      console.log('✅ Complete integration flow working correctly');
    } catch (error) {
      console.error('❌ Integration flow failed:', error.message);
      throw error;
    }
  }

  /**
   * Test error handling and resilience
   */
  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling and Resilience...');

    // Test invalid token validation
    try {
      const invalidValidation = await this.interServiceAuth.validateToken('invalid-token');
      assert(!invalidValidation.valid, 'Invalid token should not be valid');
      assert(invalidValidation.error, 'Should have error message');
      console.log('✅ Invalid token validation working correctly');
    } catch (error) {
      console.error('❌ Invalid token validation failed:', error.message);
      throw error;
    }

    // Test unauthorized service
    try {
      const unauthorizedClient = this.serviceClientFactory.createClient('unauthorized');
      const headers = await this.interServiceAuth.getAuthHeaders('nonexistent-service');
      assert(false, 'Should have thrown error for nonexistent service');
    } catch (error) {
      assert(error.message.includes('not found'), 'Should have not found error');
      console.log('✅ Unauthorized service handling working correctly');
    }

    // Test permission checking for non-existent service
    try {
      const hasPermission = await this.interServiceAuth.hasPermission('nonexistent', 'users.read');
      assert(!hasPermission, 'Nonexistent service should not have permissions');
      console.log('✅ Nonexistent service permission handling working correctly');
    } catch (error) {
      console.error('❌ Nonexistent service permission handling failed:', error.message);
      throw error;
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting Service Communication Integration Tests\n');

    try {
      await this.setup();
      await this.testServiceRegistry();
      await this.testAuthentication();
      await this.testHttpClient();
      await this.testIntegrationFlow();
      await this.testErrorHandling();

      console.log('\n🎉 All Integration Tests Passed Successfully!');
      console.log('\n📊 Test Summary:');
      console.log('   ✅ Service Registry: PASS');
      console.log('   ✅ Authentication: PASS');
      console.log('   ✅ HTTP Client: PASS');
      console.log('   ✅ Integration Flow: PASS');
      console.log('   ✅ Error Handling: PASS');

    } catch (error) {
      console.error('\n💥 Integration Tests Failed:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');

    try {
      if (this.serviceClientFactory) {
        await this.serviceClientFactory.shutdown();
      }
      await this.interServiceAuth.shutdown();
      await this.serviceRegistry.shutdown();

      console.log('✅ Test environment cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

// Run tests if this is the main module
if (require.main === module) {
  const test = new ServiceCommunicationIntegrationTest();

  test.runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    })
    .finally(() => {
      return test.cleanup();
    });
}

module.exports = ServiceCommunicationIntegrationTest;