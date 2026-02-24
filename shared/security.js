/**
 * Security Configuration and Secret Management
 * 
 * This module provides secure handling of secrets and sensitive configuration
 * with validation, encryption, and environment-specific handling
 */

const crypto = require('crypto');

class SecurityConfig {
  constructor(validateOnStartup = false) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    // Initialize secret validation (only if explicitly requested)
    if (validateOnStartup) {
      this.validateSecrets();
    }
  }

  /**
   * Generate a secure random secret
   */
  static generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash a secret for storage
   */
  static hashSecret(secret) {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /**
   * Validate JWT secret strength
   */
  static validateJWTSecret(secret) {
    const minLength = 32;
    const hasEntropy = /[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(secret);

    return {
      isValid: secret && secret.length >= minLength && hasEntropy,
      errors: secret ? [
        ...(secret.length < minLength ? [`Secret must be at least ${minLength} characters long`] : []),
        ...(!hasEntropy ? ['Secret should contain mixed characters for better entropy'] : [])
      ] : ['Secret is required']
    };
  }

  /**
   * Get secure JWT configuration
   */
  getJWTConfig() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    // In production, ensure we're not using the default
    if (this.isProduction && this.isDefaultSecret(secret)) {
      throw new Error('Default JWT secret detected in production. Please set a secure secret.');
    }

    const validation = SecurityConfig.validateJWTSecret(secret);
    if (!validation.isValid) {
      throw new Error(`Invalid JWT secret: ${validation.errors.join(', ')}`);
    }

    return {
      secret,
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      issuer: 'talentsphere',
      audience: 'talentsphere-users'
    };
  }

  /**
   * Check if secret is a default/insecure one
   */
  isDefaultSecret(secret) {
    const defaultSecrets = [
      '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970',
      'c88a812a6318e33c0188dc9e52820bc5ad10512893b33a73e3601774f0c824a4',
      'your-super-secret-jwt-key-change-this-in-production',
      'your-super-secret-jwt-key-min-32-chars-change-this-in-production',
      'secret',
      'test-secret',
      'change-me'
    ];

    return defaultSecrets.includes(secret);
  }

  /**
   * Get secure CORS configuration
   */
  getCORSConfig() {
    const origin = process.env.CORS_ORIGIN;

    if (!origin || origin === '*') {
      if (this.isProduction) {
        throw new Error('CORS_ORIGIN cannot be wildcard (*) in production');
      }

      // Development: allow local development
      return {
        origin: ['http://localhost:3000', 'http://localhost:3100', 'http://127.0.0.1:3000', 'http://127.0.0.1:3100'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
        allowedHeaders: [
          'Content-Type', 'Authorization', 'X-Requested-With',
          'Accept', 'X-CSRF-Token', 'X-HTTP-Method-Override',
          'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP',
          'X-Client-Version', 'X-Client-ID', 'X-Device-ID',
          'X-Platform', 'X-Timezone', 'X-Language',
          'X-App-Version', 'X-Device-Type', 'X-OS', 'X-OS-Version'
        ],
        exposedHeaders: [
          'X-Total-Count', 'X-Page-Count', 'X-Request-ID',
          'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset',
          'X-Response-Time', 'X-Server', 'X-Timestamp',
          'Link', 'Location', 'Retry-After', 'ETag', 'Last-Modified'
        ],
        preflightContinue: false,
        optionsSuccessStatus: 204,
        maxAge: 86400 // 24 hours
      };
    }

    // Production: use specific origins
    const origins = origin.split(',').map(o => o.trim());

    return {
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      allowedHeaders: [
        'Content-Type', 'Authorization', 'X-Requested-With',
        'Accept', 'X-CSRF-Token', 'X-HTTP-Method-Override',
        'X-Requested-With', 'X-Forwarded-For', 'X-Real-IP',
        'X-Client-Version', 'X-Client-ID', 'X-Device-ID',
        'X-Platform', 'X-Timezone', 'X-Language',
        'X-App-Version', 'X-Device-Type', 'X-OS', 'X-OS-Version'
      ],
      exposedHeaders: [
        'X-Total-Count', 'X-Page-Count', 'X-Request-ID',
        'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset',
        'X-Response-Time', 'X-Server', 'X-Timestamp',
        'Link', 'Location', 'Retry-After', 'ETag', 'Last-Modified'
      ],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400 // 24 hours
    };
  }

  /**
   * Get secure session configuration
   */
  getSessionConfig() {
    const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('SESSION_SECRET or JWT_SECRET is required');
    }

    return {
      secret,
      name: 'talentsphere.sid',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: this.isProduction, // HTTPS only in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      }
    };
  }

  /**
   * Get security headers configuration
   */
  getSecurityHeaders() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
          connectSrc: ["'self'", "https://api.talentsphere.com", "ws:", "wss:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'"],
          childSrc: ["'self'"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
          sandbox: ['allow-downloads', 'allow-forms', 'allow-same-origin', 'allow-scripts', 'allow-popups'],
          reportUri: ['/api/security/csp-report']
        }
      },
      crossOriginEmbedderPolicy: this.isProduction ? 'require-corp' : false,
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
      hsts: this.isProduction ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false,
      noSniff: true,
      xssFilter: true,
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: 'none',
      hidePoweredBy: true,
      ieNoOpen: true,
      dnsPrefetchControl: { allow: false },
      hpkp: false  // Deprecated, not recommended
    };
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    const isTest = process.env.NODE_ENV === 'test' || process.env.E2E_TESTING === 'true';

    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: isTest ? 10000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100),
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Stricter limits for sensitive endpoints - disabled during testing to prevent parallel worker blocks
      sensitiveEndpoints: isTest ? {} : {
        '/api/v1/auth/login': { max: 5, windowMs: 15 * 60 * 1000 },
        '/api/v1/auth/register': { max: 3, windowMs: 60 * 60 * 1000 },
        '/api/v1/auth/forgot-password': { max: 3, windowMs: 60 * 60 * 1000 }
      }
    };
  }

  /**
   * Validate all required secrets on startup
   */
  validateSecrets() {
    const requiredSecrets = ['JWT_SECRET'];
    const missing = [];

    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        missing.push(secret);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // In production, ensure we're not using defaults
    if (this.isProduction) {
      if (this.isDefaultSecret(process.env.JWT_SECRET)) {
        throw new Error('Production environment detected with default JWT secret. Please set a secure secret.');
      }

      if (process.env.CORS_ORIGIN === '*') {
        throw new Error('Production environment detected with wildcard CORS origin. Please specify allowed origins.');
      }
    }
  }

  /**
   * Generate secrets for development setup
   */
  static generateDevelopmentSecrets() {
    return {
      JWT_SECRET: SecurityConfig.generateSecureSecret(64),
      SESSION_SECRET: SecurityConfig.generateSecureSecret(64),
      ENCRYPTION_KEY: SecurityConfig.generateSecureSecret(32),
      API_SECRET: SecurityConfig.generateSecureSecret(48)
    };
  }

  /**
   * Encrypt sensitive data using AES-256-CBC with proper IV
   */
  encrypt(text, key = process.env.ENCRYPTION_KEY) {
    if (!key) {
      throw new Error('ENCRYPTION_KEY is required for encryption');
    }

    // Derive a 32-byte key from the password using SHA-256
    const derivedKey = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data using AES-256-CBC with proper IV
   */
  decrypt(encryptedText, key = process.env.ENCRYPTION_KEY) {
    if (!key) {
      throw new Error('ENCRYPTION_KEY is required for decryption');
    }

    // Derive a 32-byte key from the password using SHA-256
    const derivedKey = crypto.createHash('sha256').update(key).digest();
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encrypted = textParts.join(':');

    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Global instance for convenience (no validation on import)
const securityConfig = new SecurityConfig(false);

// Convenience functions
function getSecret(key) {
  return process.env[key];
}

function getJWTConfig() {
  return securityConfig.getJWTConfig();
}

function getCORSConfig() {
  return securityConfig.getCORSConfig();
}

function getSecurityHeaders() {
  return securityConfig.getSecurityHeaders();
}

module.exports = {
  SecurityConfig,
  securityConfig,
  getSecret,
  getJWTConfig,
  getCORSConfig,
  getSecurityHeaders,
  getRateLimitConfig: () => securityConfig.getRateLimitConfig(),
  generateSecureSecret: SecurityConfig.generateSecureSecret,
  hashSecret: SecurityConfig.hashSecret,
  validateJWTSecret: SecurityConfig.validateJWTSecret,
  generateDevelopmentSecrets: SecurityConfig.generateDevelopmentSecrets
};