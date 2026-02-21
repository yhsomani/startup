/**
 * Unit Tests for Input Validator
 * Tests validation logic, sanitization, and security features
 */

const { validate, ValidationSchemas, InputSanitizer, CustomValidators } = require('../../shared/input-validator');
const { ValidationError } = require('../../shared/error-handler');

describe('Input Validator', () => {
  let sanitizer;

  beforeEach(() => {
    sanitizer = new InputSanitizer();
  });

  describe('InputSanitizer', () => {
    describe('sanitizeString', () => {
      it('should remove XSS scripts', () => {
        const input = '<script>alert("xss")</script>Hello';
        const result = sanitizer.sanitizeString(input);
        
        expect(result).toBe('Hello');
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert');
      });

      it('should remove SQL injection patterns', () => {
        const input = "'; DROP TABLE users; --";
        const result = sanitizer.sanitizeString(input);
        
        expect(result).not.toContain('DROP');
        expect(result).not.toContain('users');
      });

      it('should trim whitespace', () => {
        const input = '  Hello World  ';
        const result = sanitizer.sanitizeString(input);
        
        expect(result).toBe('Hello World');
      });

      it('should limit string length', () => {
        const input = 'x'.repeat(100);
        const result = sanitizer.sanitizeString(input, { maxLength: 20 });
        
        expect(result.length).toBe(20);
      });

      it('should preserve valid characters', () => {
        const input = 'Hello, World! 123';
        const result = sanitizer.sanitizeString(input);
        
        expect(result).toBe(input);
      });
    });

    describe('sanitizeEmail', () => {
      it('should validate and normalize email', () => {
        const input = 'Test.User@EXAMPLE.COM';
        const result = sanitizer.sanitizeEmail(input);
        
        expect(result).toBe('test.user@example.com');
      });

      it('should reject invalid email format', () => {
        const invalidEmails = [
          'invalid-email',
          '@missingdomain.com',
          'missing@.com',
          'space @domain.com'
        ];

        invalidEmails.forEach(email => {
          expect(() => {
            sanitizer.sanitizeEmail(email);
          }).toThrow(ValidationError);
        });
      });
    });

    describe('sanitizePhone', () => {
      it('should extract digits from phone number', () => {
        const input = '+1 (555) 123-4567';
        const result = sanitizer.sanitizePhone(input);
        
        expect(result).toBe('15551234567');
      });

      it('should reject invalid phone numbers', () => {
        const invalidPhones = [
          '123', // Too short
          '123456789012345' // Too long
        ];

        invalidPhones.forEach(phone => {
          expect(() => {
            sanitizer.sanitizePhone(phone);
          }).toThrow(ValidationError);
        });
      });
    });

    describe('sanitizeURL', () => {
      it('should validate HTTPS URL', () => {
        const input = 'HTTPS://EXAMPLE.COM/PATH';
        const result = sanitizer.sanitizeURL(input);
        
        expect(result).toBe('https://example.com/PATH');
      });

      it('should reject HTTP URLs in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        
        expect(() => {
          sanitizer.sanitizeURL('http://example.com');
        }).toThrow(ValidationError);
        
        process.env.NODE_ENV = originalEnv;
      });

      it('should reject invalid URLs', () => {
        expect(() => {
          sanitizer.sanitizeURL('not-a-url');
        }).toThrow(ValidationError);
      });
    });

    describe('sanitizeObject', () => {
      it('should recursively sanitize nested objects', () => {
        const input = {
          name: '<script>alert("xss")</script>John',
          profile: {
            bio: "'; DROP TABLE users; --",
            contact: {
              email: ' TEST@EXAMPLE.COM ',
              phone: '555-123-4567'
            }
          }
        };

        const result = sanitizer.sanitizeObject(input);
        
        expect(result.name).toBe('John');
        expect(result.profile.bio).not.toContain('DROP');
        expect(result.profile.contact.email).toBe('test@example.com');
        expect(result.profile.contact.phone).toBe('5551234567');
      });

      it('should use schema-based validation', () => {
        const schema = {
          email: { type: 'email' },
          name: { type: 'string', maxLength: 50 },
          age: { type: 'number' },
          active: { type: 'boolean' }
        };

        const input = {
          email: ' TEST@EXAMPLE.COM ',
          name: 'John Doe',
          age: '25',
          active: 'true'
        };

        const result = sanitizer.sanitizeObject(input, schema);
        
        expect(result.email).toBe('test@example.com');
        expect(result.name).toBe('John Doe');
        expect(result.age).toBe(25);
        expect(result.active).toBe(true);
      });
    });

    describe('removeSensitiveFields', () => {
      it('should mask password fields', () => {
        const input = {
          username: 'john',
          password: 'secret123',
          token: 'abc123xyz',
          apiKey: 'secret-key'
        };

        const result = sanitizer.removeSensitiveFields(input);
        
        expect(result.username).toBe('john');
        expect(result.password).toBe('t123');
        expect(result.token).toBe('xyz');
        expect(result.apiKey).toBe('[REDACTED]');
      });

      it('should mask nested sensitive fields', () => {
        const input = {
          user: {
            name: 'John',
            credentials: {
              password: 'secret123',
              token: 'abc123'
            }
          }
        };

        const result = sanitizer.removeSensitiveFields(input);
        
        expect(result.user.name).toBe('john');
        expect(result.user.credentials.password).toBe('t123');
        expect(result.user.credentials.token).toBe('xyz');
      });
    });
  });

  describe('ValidationSchemas', () => {
    describe('user.register', () => {
      it('should validate valid user data', () => {
        const validUser = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'ValidPass123!',
          role: 'user'
        };

        const { error } = ValidationSchemas.user.register.validate(validUser);
        
        expect(error).toBeUndefined();
      });

      it('should reject invalid email', () => {
        const invalidUser = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'ValidPass123!',
          role: 'user'
        };

        const { error } = ValidationSchemas.user.register.validate(invalidUser);
        
        expect(error).toBeDefined();
        expect(error.details).toContain(
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('email')
          })
        );
      });

      it('should reject weak password', () => {
        const invalidUser = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'weak',
          role: 'user'
        };

        const { error } = ValidationSchemas.user.register.validate(invalidUser);
        
        expect(error).toBeDefined();
        expect(error.details).toContain(
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('contain')
          })
        );
      });
    });

    describe('job.create', () => {
      it('should validate valid job data', () => {
        const validJob = {
          title: 'Software Engineer',
          description: 'We are looking for a talented software engineer...',
          companyId: 'company-123',
          jobType: 'full-time',
          experienceLevel: 'mid'
        };

        const { error } = ValidationSchemas.job.create.validate(validJob);
        
        expect(error).toBeUndefined();
      });

      it('should reject invalid job type', () => {
        const invalidJob = {
          title: 'Software Engineer',
          description: 'We are looking for a talented software engineer...',
          companyId: 'company-123',
          jobType: 'invalid-type',
          experienceLevel: 'mid'
        };

        const { error } = ValidationSchemas.job.create.validate(invalidJob);
        
        expect(error).toBeDefined();
      });
    });
  });

  describe('CustomValidators', () => {
    describe('alphaNumeric', () => {
      it('should validate alphanumeric strings', () => {
        expect(CustomValidators.alphaNumeric('abc123')).toBe('abc123');
      });

      it('should reject non-alphanumeric strings', () => {
        const result = CustomValidators.alphaNumeric('abc-123');
        expect(result).toHaveProperty('error', 'custom.alphaNumeric');
      });
    });

    describe('passwordStrength', () => {
      it('should validate strong passwords', () => {
        const strongPassword = 'StrongPass123!';
        expect(CustomValidators.passwordStrength(strongPassword)).toBe(strongPassword);
      });

      it('should reject weak passwords', () => {
        const weakPassword = 'weak';
        const result = CustomValidators.passwordStrength(weakPassword);
        expect(result).toHaveProperty('error', 'custom.passwordStrength');
      });
    });

    describe('uuid', () => {
      it('should validate UUID format', () => {
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        expect(CustomValidators.uuid(validUUID)).toBe(validUUID);
      });

      it('should reject invalid UUID format', () => {
        const invalidUUID = 'invalid-uuid';
        const result = CustomValidators.uuid(invalidUUID);
        expect(result).toHaveProperty('error', 'custom.uuid');
      });
    });
  });

  describe('validate middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {},
        params: {}
      };
      
      mockRes = {
        json: jest.fn(),
        status: jest.fn(() => mockRes)
      };
      
      mockNext = jest.fn();
    });

    it('should validate request body', () => {
      const schema = ValidationSchemas.user.register;
      const middleware = validate(schema, 'body');
      
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'ValidPass123!',
        role: 'user'
      };

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).toEqual(mockReq.body);
    });

    it('should return error for invalid data', () => {
      const schema = ValidationSchemas.user.register;
      const middleware = validate(schema, 'body');
      
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'weak',
        role: 'user'
      };

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        details: expect.any(Array)
      });
    });

    it('should strip unknown fields', () => {
      const schema = ValidationSchemas.user.register;
      const middleware = validate(schema, 'body');
      
      mockReq.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'ValidPass123!',
        role: 'user',
        unknownField: 'should be removed',
        anotherUnknown: 123
      };

      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body).not.toHaveProperty('unknownField');
      expect(mockReq.body).not.toHaveProperty('anotherUnknown');
    });
  });

  describe('Security Tests', () => {
    it('should prevent script injection', () => {
      const xssPayload = '<script>window.location="http://evil.com"</script>';
      const result = sanitizer.sanitizeString(xssPayload);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('window.location');
      expect(result).not.toContain('evil.com');
    });

    it('should prevent SQL injection', () => {
      const sqlPayload = "'; DROP TABLE users; SELECT * FROM users WHERE '1'='1";
      const result = sanitizer.sanitizeString(sqlPayload);
      
      expect(result).not.toContain('DROP');
      expect(result).not.toContain('SELECT');
      expect(result).not.toContain('1=1');
    });

    it('should prevent command injection', () => {
      const commandPayload = '; rm -rf /';
      const result = sanitizer.sanitizeString(commandPayload);
      
      expect(result).not.toContain('rm');
      expect(result).not.toContain('-rf');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large inputs efficiently', () => {
      const largeInput = 'x'.repeat(10000);
      const startTime = Date.now();
      
      const result = sanitizer.sanitizeString(largeInput);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toBe(largeInput);
      expect(duration).toBeLessThan(100); // Should process quickly
    });

    it('should handle deep nested objects efficiently', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'test data'.repeat(100)
                }
              }
            }
          }
        }
      };
      
      const startTime = Date.now();
      
      const result = sanitizer.sanitizeObject(deepObject);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toEqual(deepObject);
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      expect(sanitizer.sanitizeString(null)).toBeNull();
      expect(sanitizer.sanitizeString(undefined)).toBeUndefined();
      expect(sanitizer.sanitizeObject(null)).toBeNull();
      expect(sanitizer.sanitizeObject(undefined)).toBeUndefined();
    });

    it('should handle empty strings and objects', () => {
      expect(sanitizer.sanitizeString('')).toBe('');
      expect(sanitizer.sanitizeObject({})).toEqual({});
    });

    it('should handle circular references', () => {
      const circular = {};
      circular.self = circular;
      
      expect(() => {
        sanitizer.sanitizeObject(circular);
      }).not.toThrow();
    });
  });
});