const crypto = require('crypto');

/**
 * Secure Secrets Management for TalentSphere
 * Handles encryption, decryption, and secure environment variable management
 */
class SecretsManager {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.encoding = 'hex';
    
    // Initialize master key from environment or generate one
    this.masterKey = this.getOrCreateMasterKey();
  }

  /**
   * Get or create master encryption key
   */
  getOrCreateMasterKey() {
    const envKey = process.env.MASTER_ENCRYPTION_KEY;
    if (envKey && envKey.length >= 64) {
      return Buffer.from(envKey, 'hex');
    }
    
    // Generate new key if none exists (for development)
    if (!envKey && process.env.NODE_ENV === 'development') {
      const newKey = crypto.randomBytes(32).toString('hex');
      console.warn('🔐 Generated new master key. Save this to your environment:');
      console.warn(`MASTER_ENCRYPTION_KEY=${newKey}`);
      return Buffer.from(newKey, 'hex');
    }
    
    throw new Error('MASTER_ENCRYPTION_KEY environment variable is required in production');
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text) {
    if (!text) {return null;}
    
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.masterKey);
      cipher.setAAD(Buffer.from('talentsphere', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', this.encoding);
      encrypted += cipher.final(this.encoding);
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString(this.encoding),
        tag: tag.toString(this.encoding)
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData) {
    if (!encryptedData || !encryptedData.encrypted) {return null;}
    
    try {
      const iv = Buffer.from(encryptedData.iv, this.encoding);
      const tag = Buffer.from(encryptedData.tag, this.encoding);
      
      const decipher = crypto.createDecipher(this.algorithm, this.masterKey);
      decipher.setAAD(Buffer.from('talentsphere', 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, this.encoding, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password) {
    const bcrypt = require('bcrypt');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    const bcrypt = require('bcrypt');
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT secrets with proper entropy
   */
  generateJWTSecrets() {
    return {
      jwtSecret: this.generateSecureToken(64),
      jwtRefreshSecret: this.generateSecureToken(64),
      sessionSecret: this.generateSecureToken(64),
      apiSecret: this.generateSecureToken(48),
      encryptionKey: this.generateSecureToken(32)
    };
  }

  /**
   * Validate JWT secret strength
   */
  validateJWTSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      return { valid: false, error: 'Secret must be a non-empty string' };
    }
    
    if (secret.length < 32) {
      return { valid: false, error: 'Secret must be at least 32 characters long' };
    }
    
    // Check for sufficient entropy (at least 3 different character types)
    const hasUpper = /[A-Z]/.test(secret);
    const hasLower = /[a-z]/.test(secret);
    const hasNumbers = /[0-9]/.test(secret);
    const hasSpecial = /[^A-Za-z0-9]/.test(secret);
    
    const complexityScore = [hasUpper, hasLower, hasNumbers, hasSpecial].filter(Boolean).length;
    
    if (complexityScore < 3) {
      return { 
        valid: false, 
        error: 'Secret must contain at least 3 of: uppercase, lowercase, numbers, special characters' 
      };
    }
    
    return { valid: true };
  }

  /**
   * Rotate secrets securely
   */
  async rotateSecrets() {
    const newSecrets = this.generateJWTSecrets();
    
    // Here you would update your environment variables
    // or secret management system (AWS Secrets Manager, etc.)
    
    return {
      success: true,
      message: 'Secrets generated successfully. Update your environment with these values:',
      secrets: newSecrets
    };
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data) {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth',
      'authorization', 'credentials', 'ssn', 'creditCard'
    ];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const masked = { ...data };
    
    for (const key in masked) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (typeof masked[key] === 'string') {
          masked[key] = masked[key].length > 4 
            ? '*'.repeat(masked[key].length - 4) + masked[key].slice(-4)
            : '****';
        } else {
          masked[key] = '[MASKED]';
        }
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }
    
    return masked;
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment() {
    const requiredSecrets = [
      'JWT_SECRET',
      'SESSION_SECRET', 
      'ENCRYPTION_KEY',
      'DATABASE_URL'
    ];
    
    const missing = [];
    const invalid = [];
    
    for (const secret of requiredSecrets) {
      const value = process.env[secret];
      
      if (!value) {
        missing.push(secret);
      } else if (secret.includes('SECRET') || secret.includes('KEY')) {
        const validation = this.validateJWTSecret(value);
        if (!validation.valid) {
          invalid.push({ secret, error: validation.error });
        }
      }
    }
    
    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid
    };
  }
}

module.exports = new SecretsManager();