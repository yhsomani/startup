/**
 * Test Setup for TalentSphere Test Suite
 * Configures test environment and global utilities
 */

const path = require('path');
const { configManager } = require('../shared/config-manager');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';

// Load test configuration
configManager.setConfig('testing', {
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/talentsphere_test',
    host: 'localhost',
    port: 5433,
    name: 'talentsphere_test',
    user: 'test',
    password: 'test'
  },
  redis: {
    host: 'localhost',
    port: 6380,
    db: 1,
    keyPrefix: 'test:talentsphere:'
  },
  services: {
    auth: 3011,
    user: 3012,
    job: 3013,
    company: 3014,
    network: 3015,
    search: 3016,
    analytics: 3017,
    gamification: 3018,
    collaboration: 3019,
    notification: 3020,
    apiGateway: 8001
  },
  security: {
    jwtSecret: 'test-jwt-secret-for-testing-only',
    encryptionKey: 'test-encryption-key-32-chars-long',
    sessionSecret: 'test-session-secret-key-for-testing'
  }
});

// Global test utilities
global.testUtils = {
  // Test data generators
  generateUser: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    ...overrides
  }),

  generateCompany: (overrides = {}) => ({
    id: 'company-123',
    name: 'Test Company',
    description: 'Test Company Description',
    ...overrides
  }),

  generateJob: (overrides = {}) => ({
    id: 'job-123',
    title: 'Test Job',
    description: 'Test Job Description',
    companyId: 'company-123',
    ...overrides
  }),

  // Random test data
  randomEmail: () => `test-${Date.now()}@example.com`,
  randomString: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
  randomNumber: (min = 1, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  // Date utilities
  daysAgo: (days) => new Date(Date.now() - (days * 24 * 60 * 60 * 1000)),
  daysFromNow: (days) => new Date(Date.now() + (days * 24 * 60 * 60 * 1000)),
  
  // Clean test databases
  async cleanupDatabase() {
    // Database cleanup would be implemented here
    console.log('Cleaning up test database...');
  },

  // Clean test Redis
  async cleanupRedis() {
    // Redis cleanup would be implemented here
    console.log('Cleaning up test Redis...');
  }
};

// Mock external services
global.mocks = {
  // Email service mock
  emailService: {
    send: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    sendTemplate: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  },

  // File storage mock
  fileStorage: {
    upload: jest.fn().mockResolvedValue({ url: 'https://test.com/file.jpg' }),
    delete: jest.fn().mockResolvedValue(true)
  },

  // Analytics mock
  analytics: {
    track: jest.fn().mockResolvedValue(true),
    trackEvent: jest.fn().mockResolvedValue(true)
  }
};

// Custom matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  }
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  };
});

afterEach(() => {
  global.console = originalConsole;
});