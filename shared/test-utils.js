/**
 * TalentSphere Testing Framework
 * 
 * Comprehensive testing setup for unit, integration, and E2E tests
 * Includes test utilities, mocks, and standardized test patterns
 */

const path = require('path');
const { Pool } = require('pg');
const { createLogger } = require('./logger');

class TestUtils {
  constructor() {
    this.logger = createLogger('TestUtils');
    this.testDb = null;
  }

  /**
   * Initialize test database
   */
  async setupTestDatabase() {
    try {
      this.testDb = new Pool({
        host: process.env.TEST_DB_HOST || 'localhost',
        port: process.env.TEST_DB_PORT || 5432,
        database: process.env.TEST_DB_NAME || 'talentsphere_test',
        user: process.env.TEST_DB_USER || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        max: 5
      });

      // Test connection
      await this.testDb.query('SELECT NOW()');
      this.logger.info('Test database initialized');
    } catch (error) {
      this.logger.error('Failed to initialize test database:', error);
      throw error;
    }
  }

  /**
   * Clean test database
   */
  async cleanupTestDatabase() {
    if (!this.testDb) { return; }

    try {
      const tables = [
        'certificates',
        'enrollments',
        'submissions',
        'courses',
        'challenges',
        'users',
        'user_badges',
        'user_points',
        'user_streaks',
        'audit_logs',
        'notification_history',
        'notification_recipients',
        'notifications'
      ];

      for (const table of tables) {
        await this.testDb.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      }

      this.logger.info('Test database cleaned');
    } catch (error) {
      this.logger.error('Failed to clean test database:', error);
    }
  }

  /**
   * Create test user
   */
  async createTestUser(userData = {}) {
    const defaultUser = {
      id: TestUtils.generateUUID(),
      email: `test-user-${Date.now()}@example.com`,
      role: 'STUDENT',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const user = { ...defaultUser, ...userData };

    await this.testDb.query(`
      INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = EXCLUDED.updated_at
    `, [user.id, user.email, user.password_hash, user.role, user.is_active, user.created_at, user.updated_at]);

    return user;
  }

  /**
   * Create test course
   */
  async createTestCourse(courseData = {}) {
    const instructor = await this.createTestUser({ role: 'INSTRUCTOR' });

    const defaultCourse = {
      id: TestUtils.generateUUID(),
      instructor_id: instructor.id,
      title: `Test Course ${Date.now()}`,
      description: 'Test course description',
      price: 99.99,
      is_published: true,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const course = { ...defaultCourse, ...courseData };

    await this.testDb.query(`
      INSERT INTO courses (id, instructor_id, title, description, price, is_published, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        is_published = EXCLUDED.is_published,
        is_active = EXCLUDED.is_active,
        updated_at = EXCLUDED.updated_at
    `, [course.id, course.instructor_id, course.title, course.description, course.price,
    course.is_published, course.is_active, course.created_at, course.updated_at]);

    return course;
  }

  /**
   * Create test challenge
   */
  async createTestChallenge(challengeData = {}) {
    const defaultChallenge = {
      id: TestUtils.generateUUID(),
      title: `Test Challenge ${Date.now()}`,
      description: 'Test challenge description',
      passing_score: 80.0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const challenge = { ...defaultChallenge, ...challengeData };

    await this.testDb.query(`
      INSERT INTO challenges (id, title, description, passing_score, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        passing_score = EXCLUDED.passing_score,
        is_active = EXCLUDED.is_active,
        updated_at = EXCLUDED.updated_at
    `, [challenge.id, challenge.title, challenge.description, challenge.passing_score,
    challenge.is_active, challenge.created_at, challenge.updated_at]);

    return challenge;
  }

  /**
   * Generate JWT token for testing
   */
  static generateTestToken(payload = {}) {
    const jwt = require('jsonwebtoken');
    const defaultPayload = {
      userId: TestUtils.generateUUID(),
      email: 'test@example.com',
      role: 'STUDENT',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };

    const finalPayload = { ...defaultPayload, ...payload };
    return jwt.sign(finalPayload, process.env.JWT_SECRET || 'test-secret');
  }

  /**
   * Generate UUID
   */
  static generateUUID() {
    return require('crypto').randomUUID();
  }

  /**
   * Generate test data
   */
  static generateTestData(type, count = 1) {
    const items = [];

    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'user':
          items.push({
            id: TestUtils.generateUUID(),
            email: `test${i}-${Date.now()}@example.com`,
            password: 'test123456',
            name: `Test User ${String.fromCharCode(65 + i)}`, // Use letters to pass name validation
            role: 'STUDENT'
          });
          break;

        case 'course':
          items.push({
            id: TestUtils.generateUUID(),
            title: `Test Course ${i}`,
            description: `Description for test course ${i}`,
            price: 99.99 + i,
            is_published: true,
            category: 'programming'
          });
          break;

        case 'challenge':
          items.push({
            id: TestUtils.generateUUID(),
            title: `Test Challenge ${i}`,
            description: `Description for test challenge ${i}`,
            difficulty: 'medium',
            passing_score: 80
          });
          break;

        case 'notification':
          items.push({
            id: TestUtils.generateUUID(),
            type: 'info',
            title: `Test Notification ${i}`,
            message: `This is test notification ${i}`,
            priority: 'normal'
          });
          break;

        default:
          throw new Error(`Unknown test data type: ${type}`);
      }
    }

    return count === 1 ? items[0] : items;
  }

  /**
   * Create mock HTTP response
   */
  static mockResponse(data = {}, statusCode = 200) {
    return {
      statusCode,
      data,
      headers: {
        'content-type': 'application/json',
        'x-request-id': TestUtils.generateUUID()
      }
    };
  }

  /**
   * Create mock request object
   */
  static mockRequest(overrides = {}) {
    const defaultRequest = {
      method: 'GET',
      url: '/test',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${TestUtils.generateTestToken()}`,
        'x-request-id': TestUtils.generateUUID()
      },
      body: {},
      params: {},
      query: {},
      user: { id: TestUtils.generateUUID(), role: 'STUDENT' }
    };

    return { ...defaultRequest, ...overrides };
  }

  /**
   * Assert response structure
   */
  static assertResponse(response, expectedStatus = 200, expectedFields = []) {
    expect(response).toBeDefined();
    expect(response.statusCode).toBe(expectedStatus);

    if (expectedFields.length > 0) {
      expect(response.data).toBeDefined();
      expectedFields.forEach(field => {
        expect(response.data).toHaveProperty(field);
      });
    }
  }

  /**
   * Wait for async operations
   */
  static async sleep(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry async function with exponential backoff
   */
  static async retry(fn, maxRetries = 3, baseDelay = 100) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await TestUtils.sleep(baseDelay * Math.pow(2, i));
        }
      }
    }

    throw lastError;
  }

  /**
   * Close test database connection
   */
  async close() {
    if (this.testDb) {
      await this.testDb.end();
      this.logger.info('Test database connection closed');
    }
  }
}

module.exports = TestUtils;