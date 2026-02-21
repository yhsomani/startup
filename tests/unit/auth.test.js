/**
 * Auth Service Unit Tests
 * 
 * Comprehensive unit tests for authentication service
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Mock pg module to prevent database connection attempts during unit tests
jest.mock('pg', () => {
  const mPool = {
    connect: jest.fn(),
    query: jest.fn().mockImplementation((text, params) => {
      // Simulate SELECT (check if user exists) -> Return empty (user not found)
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      // Simulate INSERT (create user) -> Return fake user
      if (text.trim().toUpperCase().startsWith('INSERT')) {
        console.log('MOCK INSERT PARAMS:', params); // DEBUG
        return Promise.resolve({
          rows: [{ id: 'mock-user-id', created_at: new Date(), email: params.find(p => typeof p === 'string' && p.includes('@')) }],
          rowCount: 1
        });
      }
      // Default
      return Promise.resolve({ rows: [], rowCount: 0 });
    }),
    end: jest.fn(),
    on: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

// Mock security config to avoid rate limiting issues in tests
jest.mock('../../shared/security', () => {
  const original = jest.requireActual('../../shared/security');
  return {
    ...original,
    getSecret: (key) => {
      if (key === 'JWT_SECRET') { return 'test-secret'; }
      return original.getSecret(key);
    },
    getRateLimitConfig: () => ({
      windowMs: 15 * 60 * 1000,
      max: 1000, // High limit for tests
      standardHeaders: true,
      legacyHeaders: false,
      sensitiveEndpoints: {
        '/login': { max: 1000, windowMs: 15 * 60 * 1000 },
        '/register': { max: 1000, windowMs: 15 * 60 * 1000 }
      }
    })
  };
});

const TestUtils = require('../../shared/test-utils');

describe('Auth Service', () => {
  let app;
  let testUtils;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'; // details for mock

    testUtils = new TestUtils();
    await testUtils.setupTestDatabase();

    // Set JWT secret BEFORE instantiation to ensure it's picked up
    process.env.JWT_SECRET = 'test-secret';

    // Import and start the auth service
    // Note: We used to require inside beforeAll, but require cache might persist. 
    // Ideally we should reset modules, but setting env var before new AuthService should work if logic is in constructor.
    const { AuthService } = require('../../backends/backend-enhanced/auth-service/index');
    const authService = new AuthService();
    await authService.initialize(); // Initialize contracts and database
    app = authService.app;
  });

  afterAll(async () => {
    await testUtils.close();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const { id, role, ...userData } = TestUtils.generateTestData('user');
      userData.password = 'Test123456!'; // Ensure strong password for validation

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject registration with duplicate email', async () => {
      const { id, role, ...userData } = TestUtils.generateTestData('user');
      userData.password = 'Test123456!'; // Ensure strong password

      // First registration should succeed (default mock returns empty for SELECT)
      await request(app)
        .post('/register')
        .send(userData)
        .expect(200);

      // Second registration should fail - Mock existing user
      const pool = new Pool();
      // First query is SELECT (check existence) -> Return user
      pool.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{ id: 'existing-id', email: userData.email }],
        rowCount: 1
      }));

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(409);

      expect(response.body.error.message).toContain('User already exists');
    });

    it('should reject registration with invalid email', async () => {
      const { id, role, ...baseData } = TestUtils.generateTestData('user');
      const userData = {
        ...baseData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      // We expect some validation error
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const { id, role, ...baseData } = TestUtils.generateTestData('user');
      const userData = {
        ...baseData,
        password: '123'
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser();
    });

    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('test123456', 10);

      const pool = new Pool();
      // Mock finding user
      pool.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          id: testUser.id,
          email: testUser.email,
          password_hash: hashedPassword,
          name: 'Test User'
        }],
        rowCount: 1
      }));
      // Mock update last login
      pool.query.mockImplementationOnce(() => Promise.resolve({ rows: [], rowCount: 1 }));

      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'test123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.token).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'test123456'
        })
        .expect(401);
    });

    it('should reject login with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('test123456', 10);

      const pool = new Pool();
      // Mock finding user
      pool.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          id: testUser.id,
          email: testUser.email,
          password_hash: hashedPassword,
          name: 'Test User'
        }],
        rowCount: 1
      }));

      const response = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({})
        .expect(400);
    });
  });

  describe('POST /logout', () => {
    let testToken;
    let testUser;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser();
      testToken = TestUtils.generateTestToken({
        userId: testUser.id,
        email: testUser.email
      });
    });

    it('should logout with valid token', async () => {
      const response = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${testToken}`)
        .send({})
        .expect(200);
    });
  });

  describe('GET /profile', () => {
    let testToken;
    let testUser;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser();
      testToken = TestUtils.generateTestToken({
        userId: testUser.id,
        email: testUser.email
      });
    });

    it('should return user profile with valid token', async () => {
      const pool = new Pool();
      // Mock finding user for profile - use persistent mock in case of multiple queries
      pool.query.mockImplementation(() => Promise.resolve({
        rows: [{
          id: testUser.id,
          email: testUser.email,
          name: 'Test User',
          created_at: new Date(),
          role: 'user',
          email_verified: false
        }],
        rowCount: 1
      }));

      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.id).toBe(testUser.id);
    });
  });

  // Refresh token tests (commented out until flow is verified)
  /*
  describe('POST /refresh-token', () => {
    let testToken;
    let testUser;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser();
      testToken = TestUtils.generateTestToken({
        userId: testUser.id,
        email: testUser.email
      });
    });

    it('should refresh valid token', async () => {
      const response = await request(app)
        .post('/refresh-token')
        .send({ token: testToken })
        .expect(200);

      expect(response.body.data.token).toBeDefined();
    });
  });
  */
});