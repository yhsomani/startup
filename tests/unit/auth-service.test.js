/**
 * Unit Tests for Authentication Service
 * Tests authentication logic, JWT handling, and user management
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { app } = require('../../backends/backend-enhanced/auth-service/index');
const { AppError, ValidationError, AuthenticationError } = require('../../../shared/error-handler');
const { configManager } = require('../../../shared/config-manager');

describe('Authentication Service', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    testUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'testPassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    };

    // Hash password for database storage
    testUser.passwordHash = await bcrypt.hash(testUser.password, 12);
    
    // Clean up any existing test data
    await global.testUtils.cleanupDatabase();
  });

  afterEach(async () => {
    // Clean up after each test
    await global.testUtils.cleanupDatabase();
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: global.testUtils.randomEmail(),
        password: 'ValidPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).toHaveProperty('id');
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'ValidPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details).toContain(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('email')
        })
      );
    });

    it('should reject registration with weak password', async () => {
      const invalidUser = {
        email: global.testUtils.randomEmail(),
        password: '123', // Too short
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate email registration', async () => {
      // First registration should succeed
      await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('CONFLICT');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(global, 'testDb', 'query')
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user in database
      await request(app)
        .post('/auth/register')
        .send(testUser);
    });

    it('should authenticate user with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
      
      // Verify JWT token
      const decodedToken = jwt.verify(
        response.body.data.token,
        configManager.getNestedConfig('security.jwtSecret')
      );
      expect(decodedToken).toHaveProperty('userId');
      expect(decodedToken).toHaveProperty('email', testUser.email);

      authToken = response.body.data.token;
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /auth/profile', () => {
    beforeEach(async () => {
      // Login and get token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      authToken = loginResponse.body.data.token;
    });

    it('should return user profile for authenticated user', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        configManager.getNestedConfig('security.jwtSecret'),
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      // Login and get token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      authToken = loginResponse.body.data.token;
    });

    it('should logout authenticated user successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Logged out successfully');
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      authToken = loginResponse.body.data.token;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh valid token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      // New token should be different
      expect(response.body.data.token).not.toBe(authToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Password Reset Flow', () => {
    let resetToken;

    it('should request password reset successfully', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message');
    });

    it('should reject password reset with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reset password with valid token', async () => {
      // Mock email service to capture reset token
      const mockSendEmail = global.mocks.emailService.send;
      mockSendEmail.mockResolvedValue({ messageId: 'test-reset-message' });

      // Request password reset
      await request(app)
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      // Get the reset token from the email mock
      const emailCall = mockSendEmail.mock.calls.find(call => 
        call[0].template === 'password-reset'
      );
      
      if (emailCall && emailCall[0].data && emailCall[0].data.resetToken) {
        resetToken = emailCall[0].data.resetToken;
      }

      // Reset password
      const newPassword = 'NewPassword123!';
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(
          request(app)
            .post('/auth/login')
            .send(loginData)
        );
      }

      const responses = await Promise.all(attempts);
      
      // First 5 should get 401, 6th should get 429
      expect(responses[4].status).toBe(401);
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.error).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'space @domain.com',
        'double..dot@domain.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/auth/register')
          .send({
            email,
            password: 'ValidPassword123!',
            firstName: 'Test',
            lastName: 'User'
          })
          .expect(400);

        expect(response.body.error).toBe('VALIDATION_ERROR');
      }
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        '123',
        'password',
        'qwerty',
        '12345678',
        'Password', // No special character
        'password1', // No uppercase
        'PASSWORD1', // No lowercase
        'Pass1', // Too short
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/auth/register')
          .send({
            email: global.testUtils.randomEmail(),
            password,
            firstName: 'Test',
            lastName: 'User'
          })
          .expect(400);

        expect(response.body.error).toBe('VALIDATION_ERROR');
      }
    });
  });
});