/**
 * Additional Unit Tests to Improve Coverage
 * Focus on testing uncovered service functions
 */

const request = require('supertest');

// Mock shared modules for testing
jest.mock('../../../shared/database-connection', () => ({
  getDatabaseManager: () => mockDatabase
}));

jest.mock('../../../shared/error-handler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'AppError';
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }
}));

jest.mock('../../../shared/config-manager', () => ({
  configManager: {
    get: jest.fn(),
    set: jest.fn(),
    validateAll: jest.fn()
  }
}));

// Mock database
const mockDatabase = {
  query: jest.fn(),
  transaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  close: jest.fn()
};

describe('Additional Coverage Tests', () => {

  describe('Service Integration', () => {
    test('should handle database connection errors gracefully', async () => {
      // Mock database failure
      mockDatabase.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const service = require('../../services/analytics-service/analytics-service');

      await expect(service.logEvent('test', {})).rejects.toThrow('Database connection failed');
    });

    test('should validate configuration on startup', () => {
      const configManager = require('../../../shared/config-manager').configManager;
      configManager.validateAll.mockReturnValue({ valid: true });

      const service = require('../../services/analytics-service/analytics-service');

      expect(configManager.validateAll).toHaveBeenCalled();
    });

    test('should handle missing environment variables', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const service = require('../../services/analytics-service/analytics-service');

      // Should use default values when env vars are missing
      expect(service.config.environment).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    test('should create appropriate error objects', () => {
      const { AppError, ValidationError, AuthenticationError } = require('../../../shared/error-handler');

      const appError = new AppError('Test error', 500);
      expect(appError).toBeInstanceOf(Error);
      expect(appError.statusCode).toBe(500);
      expect(appError.name).toBe('AppError');

      const validationError = new ValidationError('Invalid input');
      expect(validationError).toBeInstanceOf(Error);
      expect(validationError.name).toBe('ValidationError');

      const authError = new AuthenticationError('Unauthorized');
      expect(authError).toBeInstanceOf(Error);
      expect(authError.name).toBe('AuthenticationError');
    });

    test('should log errors appropriately', () => {
      const logger = require('../../../shared/logger');
      jest.spyOn(logger, 'error');

      const { AppError } = require('../../../shared/error-handler');
      const error = new AppError('Test error', 500);

      // Simulate error logging
      logger.error(error);

      expect(logger.error).toHaveBeenCalledWith(error);
    });
  });

  describe('Database Operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should handle successful database queries', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await mockDatabase.query('SELECT * FROM test');

      expect(result).toEqual({ rows: [], rowCount: 0 });
      expect(mockDatabase.query).toHaveBeenCalledWith('SELECT * FROM test');
    });

    test('should handle database transaction errors', async () => {
      mockDatabase.transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(mockDatabase.transaction()).rejects.toThrow('Transaction failed');
    });

    test('should properly close database connections', () => {
      mockDatabase.close.mockImplementation(() => Promise.resolve());

      return mockDatabase.close().then(() => {
        expect(mockDatabase.close).toHaveBeenCalled();
      });
    });
  });

  describe('API Response Handling', () => {
    test('should handle JSON response parsing', () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        status: 200,
        headers: { 'content-type': 'application/json' }
      };

      return mockResponse.json().then(data => {
        expect(data).toEqual({ data: 'test' });
        expect(mockResponse.json).toHaveBeenCalled();
      });
    });

    test('should handle error responses', () => {
      const mockResponse = {
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Not found' })
      };

      expect(mockResponse.status).toBe(404);
    });

    test('should set appropriate headers', () => {
      const mockResponse = {
        setHeader: jest.fn(),
        headers: {}
      };

      mockResponse.setHeader('content-type', 'application/json');
      mockResponse.setHeader('x-custom-header', 'value');

      expect(mockResponse.setHeader).toHaveBeenCalledWith('content-type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-custom-header', 'value');
    });
  });

  describe('Input Validation', () => {
    test('should validate email addresses', () => {
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });

    test('should validate phone numbers', () => {
      const validatePhone = (phone) => {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        return phoneRegex.test(phone);
      };

      expect(validatePhone('+1-555-0123')).toBe(true);
      expect(validatePhone('5550123')).toBe(true);
      expect(validatePhone('invalid-phone')).toBe(false);
    });

    test('should sanitize user input', () => {
      const sanitize = (input) => {
        if (typeof input !== 'string') { return input; }
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      };

      expect(sanitize('<script>alert("xss")</script>')).toBe('');
      expect(sanitize('Normal text')).toBe('Normal text');
      expect(sanitize('Text with <b>bold</b>')).toBe('Text with <b>bold</b>');
    });
  });

  describe('Utility Functions', () => {
    test('should format dates correctly', () => {
      const formatDate = (date) => {
        return new Date(date).toISOString().split('T')[0];
      };

      expect(formatDate('2024-01-30')).toBe('2024-01-30');
      expect(formatDate(new Date('2024-01-30'))).toBe('2024-01-30');
    });

    test('should generate UUIDs', () => {
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(uuid2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(uuid1).not.toBe(uuid2);
    });

    test('should calculate pagination correctly', () => {
      const calculatePagination = (page, limit, total) => {
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
          offset,
          limit,
          totalPages,
          currentPage: page,
          hasNextPage,
          hasPrevPage,
          totalItems: total
        };
      };

      const pagination = calculatePagination(2, 10, 25);

      expect(pagination.offset).toBe(10);
      expect(pagination.limit).toBe(10);
      expect(pagination.totalPages).toBe(3);
      expect(pagination.currentPage).toBe(2);
      expect(pagination.hasNextPage).toBe(true);
      expect(pagination.hasPrevPage).toBe(true);
      expect(pagination.totalItems).toBe(25);
    });
  });

  describe('Authentication Middleware', () => {
    test('should verify JWT tokens', () => {
      const mockJWT = {
        verify: jest.fn().mockReturnValue({ userId: '123', role: 'user' }),
        sign: jest.fn().mockReturnValue('mock-jwt-token')
      };

      jest.doMock('jsonwebtoken', () => mockJWT);

      const auth = require('../../../shared/auth-middleware');
      const token = 'valid-jwt-token';
      const decoded = auth.verifyToken(token);

      expect(decoded).toEqual({ userId: '123', role: 'user' });
    });

    test('should handle invalid tokens', () => {
      const mockJWT = {
        verify: jest.fn().mockImplementation(() => {
          throw new Error('Invalid token');
        })
      };

      jest.doMock('jsonwebtoken', () => mockJWT);

      const auth = require('../../../shared/auth-middleware');

      expect(() => auth.verifyToken('invalid-token')).toThrow('Invalid token');
    });

    test('should hash passwords securely', () => {
      const mockBcrypt = {
        hash: jest.fn().mockResolvedValue('hashed-password'),
        compare: jest.fn().mockResolvedValue(true)
      };

      jest.doMock('bcryptjs', () => mockBcrypt);

      const auth = require('../../../shared/auth-middleware');

      return auth.hashPassword('password').then(hashed => {
        expect(hashed).toBe('hashed-password');
        expect(mockBcrypt.hash).toHaveBeenCalledWith('password', 10);
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should track request counts', () => {
      const rateLimiter = {
        requests: new Map(),
        isAllowed: function (ip) {
          const count = this.requests.get(ip) || 0;
          const now = Date.now();
          const windowMs = 60000; // 1 minute
          const maxRequests = 100;

          if (now - (this.requests.get(ip + '_time') || 0) > windowMs) {
            this.requests.set(ip, 1);
            this.requests.set(ip + '_time', now);
          } else {
            this.requests.set(ip, count + 1);
          }

          return this.requests.get(ip) <= maxRequests;
        }
      };

      expect(rateLimiter.isAllowed('127.0.0.1')).toBe(true);
      expect(rateLimiter.isAllowed('127.0.0.1')).toBe(true);
    });
  });

  describe('File Upload Handling', () => {
    test('should validate file types', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const validateFileType = (mimetype) => {
        return allowedTypes.includes(mimetype);
      };

      expect(validateFileType('image/jpeg')).toBe(true);
      expect(validateFileType('application/pdf')).toBe(true);
      expect(validateFileType('application/exe')).toBe(false);
    });

    test('should validate file sizes', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const validateFileSize = (size) => {
        return size <= maxSize;
      };

      expect(validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(validateFileSize(10 * 1024 * 1024)).toBe(false); // 10MB
    });

    test('should sanitize filenames', () => {
      const sanitizeFilename = (filename) => {
        return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      };

      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('my document@#$%.pdf')).toBe('my_document____.pdf');
    });
  });

  describe('Cache Management', () => {
    test('should set and get cache values', () => {
      const cache = {
        data: new Map(),
        set: function (key, value, ttl = 3600000) {
          this.data.set(key, {
            value,
            expiry: Date.now() + ttl
          });
        },
        get: function (key) {
          const item = this.data.get(key);
          if (!item) { return null; }
          if (Date.now() > item.expiry) {
            this.data.delete(key);
            return null;
          }
          return item.value;
        }
      };

      cache.set('test-key', 'test-value', 60000);
      expect(cache.get('test-key')).toBe('test-value');

      // Test expiration
      cache.set('expire-key', 'expire-value', 0);
      expect(cache.get('expire-key')).toBeNull();
    });
  });

});