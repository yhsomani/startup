/**
 * Security Utilities
 * 
 * Centralized security utilities for encryption, secrets management, and security helpers
 */

const crypto = require('crypto');
const { createLogger } = require('./logger');

const logger = createLogger('Security');

// Encryption configuration
const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16,  // 128 bits
  saltLength: 32,
  tagLength: 16
};

/**
 * Get secret from environment or secure storage
 */
function getSecret(key, defaultValue = null) {
  const secret = process.env[key] || defaultValue;
  
  if (!secret && defaultValue === null) {
    logger.warn(`Secret not found: ${key}`);
  }
  
  return secret;
}

/**
 * Generate secure random string
 */
function generateSecureRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash password using bcrypt (wrapper)
 */
async function hashPassword(password, saltRounds = 12) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password using bcrypt
 */
async function verifyPassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
function generateJWT(payload, secretKey, expiresIn = '24h') {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, secretKey, { expiresIn });
}

/**
 * Verify JWT token
 */
function verifyJWT(token, secretKey) {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, secretKey);
}

/**
 * Encrypt sensitive data
 */
function encrypt(text, secretKey) {
  try {
    const salt = crypto.randomBytes(encryptionConfig.saltLength);
    const iv = crypto.randomBytes(encryptionConfig.ivLength);
    
    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(secretKey, salt, 100000, encryptionConfig.keyLength, 'sha256');
    
    const cipher = crypto.createCipher(encryptionConfig.algorithm, key);
    cipher.setAAD(Buffer.from('additional-data', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedData, secretKey) {
  try {
    const { encrypted, salt, iv, tag } = encryptedData;
    
    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(secretKey, Buffer.from(salt, 'hex'), 100000, encryptionConfig.keyLength, 'sha256');
    
    const decipher = crypto.createDecipher(encryptionConfig.algorithm, key);
    decipher.setAAD(Buffer.from('additional-data', 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Generate secure API key
 */
function generateAPIKey(prefix = 'ts') {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${timestamp}_${randomBytes}`;
}

/**
 * Validate API key format
 */
function validateAPIKey(apiKey, prefix = 'ts') {
  const apiKeyPattern = new RegExp(`^${prefix}_[a-z0-9]+_[a-f0-9]{48}$`);
  return apiKeyPattern.test(apiKey);
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: calculatePasswordScore(password)
  };
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordScore(password) {
  let score = 0;
  
  // Length contribution (up to 30 points)
  score += Math.min(password.length * 2, 30);
  
  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
  
  // Entropy (up to 30 points)
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 3, 30);
  
  return Math.min(score, 100);
}

/**
 * Sanitize user input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Rate limiting helpers
 */
const rateLimitConfig = {
  // Default rate limit configuration
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  },
  
  // Auth operations
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again later.',
  },
  
  // Sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 sensitive operations per hour
    message: 'Too many sensitive operations from this IP, please try again later.',
  }
};

/**
 * Get rate limit configuration
 */
function getRateLimitConfig(type = 'default') {
  return rateLimitConfig[type] || rateLimitConfig.default;
}

/**
 * Generate secure session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create nonce for CSP
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

module.exports = {
  getSecret,
  generateSecureRandomString,
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  encrypt,
  decrypt,
  generateAPIKey,
  validateAPIKey,
  generateCSRFToken,
  validateEmail,
  validatePassword,
  sanitizeInput,
  getRateLimitConfig,
  generateSessionId,
  generateNonce,
  encryptionConfig
};