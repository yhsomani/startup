/**
 * TalentSphere Security & Secrets Management
 * 
 * Secure generation and management of secrets and tokens
 */

const crypto = require('crypto');

class SecurityConfig {
  /**
   * Generate a cryptographically secure random secret
   * @param {number} length - Length of the secret in bytes
   * @returns {string} Base64 encoded secret
   */
  static generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Generate a hex-encoded encryption key
   * @param {number} length - Length of the key in bytes
   * @returns {string} Hex encoded key
   */
  static generateEncryptionKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a JWT-compatible secret
   * @returns {string} JWT secret
   */
  static generateJWTSecret() {
    return this.generateSecureSecret(64);
  }

  /**
   * Generate a refresh token secret
   * @returns {string} Refresh token secret
   */
  static generateRefreshSecret() {
    return this.generateSecureSecret(64);
  }

  /**
   * Generate a session secret
   * @returns {string} Session secret
   */
  static generateSessionSecret() {
    return this.generateSecureSecret(64);
  }

  /**
   * Generate a secure password
   * @param {number} length - Password length
   * @returns {string} Secure password
   */
  static generateSecurePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(crypto.randomInt(0, charset.length));
    }
    return password;
  }

  /**
   * Validate JWT secret strength
   * @param {string} secret - JWT secret to validate
   * @returns {object} Validation result
   */
  static validateJWTSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      return { valid: false, message: 'Secret is required and must be a string' };
    }

    if (secret.length < 32) {
      return { valid: false, message: 'Secret must be at least 32 characters long' };
    }

    if (secret === 'CHANGE_THIS_SECURE_SECRET_IN_PRODUCTION' || 
        secret.includes('change') || 
        secret.includes('default')) {
      return { valid: false, message: 'Default or placeholder secret detected' };
    }

    // Check for sufficient entropy
    const uniqueChars = new Set(secret).size;
    if (uniqueChars < 20) {
      return { valid: false, message: 'Secret has insufficient entropy' };
    }

    return { valid: true };
  }

  /**
   * Hash a password securely
   * @param {string} password - Password to hash
   * @param {number} rounds - Number of salt rounds
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password, rounds = 12) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, rounds);
  }

  /**
   * Verify a password against a hash
   * @param {string} password - Password to verify
   * @param {string} hash - Hash to verify against
   * @returns {Promise<boolean>} Whether password matches
   */
  static async verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate environment file with secure defaults
   * @param {object} options - Options for generation
   * @returns {string} Generated .env content
   */
  static generateSecureEnv(options = {}) {
    const jwtSecret = options.jwtSecret || this.generateJWTSecret();
    const refreshSecret = options.refreshSecret || this.generateRefreshSecret();
    const sessionSecret = options.sessionSecret || this.generateSessionSecret();
    const encryptionKey = options.encryptionKey || this.generateEncryptionKey();
    const dbPassword = options.dbPassword || this.generateSecurePassword();

    return `# ==============================================
# TalentSphere - Secure Environment Configuration
# Generated on: ${new Date().toISOString()}
# ==============================================

# ==============================================
# Authentication & Security
# ==============================================
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=${refreshSecret}
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=${sessionSecret}
ENCRYPTION_KEY=${encryptionKey}

# ==============================================
# Database
# ==============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=talentsphere
DB_USER=postgres
DB_PASSWORD=${dbPassword}
DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@\${DB_HOST}:\${DB_PORT}/\${DB_NAME}

# ==============================================
# Redis
# ==============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${this.generateSecurePassword()}

# ==============================================
# CORS
# ==============================================
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,https://talentsphere.com

# ==============================================
# Rate Limiting
# ==============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ==============================================
# Environment
# ==============================================
NODE_ENV=development
LOG_LEVEL=info
`;
  }

  /**
   * Audit existing secrets for security issues
   * @param {object} secrets - Secrets object to audit
   * @returns {object} Audit results
   */
  static auditSecrets(secrets) {
    const issues = [];
    const warnings = [];

    Object.entries(secrets).forEach(([key, value]) => {
      if (typeof value !== 'string') {return;}

      // Check for default/placeholder values
      if (value.includes('CHANGE_THIS') || value.includes('default')) {
        issues.push(`${key}: Contains placeholder value`);
      }

      // Check for weak secrets
      if (value.length < 32 && (key.includes('SECRET') || key.includes('KEY'))) {
        issues.push(`${key}: Secret too short (minimum 32 characters)`);
      }

      // Check for common patterns
      if (value.toLowerCase().includes('password') || value.toLowerCase().includes('secret')) {
        warnings.push(`${key}: Secret contains predictable words`);
      }

      // Check for repeated characters
      if (/(.)\1{5,}/.test(value)) {
        warnings.push(`${key}: Contains repeated characters`);
      }
    });

    return {
      secure: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 25) - (warnings.length * 5))
    };
  }
}

module.exports = {
  SecurityConfig
};