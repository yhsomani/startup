#!/usr/bin/env node

/**
 * TalentSphere Secret Generator
 * 
 * This script generates secure secrets for development and production use.
 * Run this script to get new secrets for your .env file.
 */

const crypto = require('crypto');
const { SecurityConfig } = require('../shared/security');

/**
 * Generate a cryptographically secure random string
 */
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Generate all required secrets for TalentSphere
 */
function generateAllSecrets() {
  console.log('🔐 TalentSphere Secret Generator');
  console.log('================================\n');
  
  const secrets = {
    // JWT Secrets
    JWT_SECRET: generateSecureSecret(64),
    JWT_REFRESH_SECRET: generateSecureSecret(64),
    
    // Session Security
    SESSION_SECRET: generateSecureSecret(64),
    
    // Encryption
    ENCRYPTION_KEY: generateSecureSecret(32),
    
    // API Communication
    API_SECRET: generateSecureSecret(48),
    
    // Database
    DB_PASSWORD: generateSecureSecret(24),
    
    // Redis
    REDIS_PASSWORD: generateSecureSecret(24),
    
    // External Service Keys (placeholders - get from providers)
    STRIPE_SECRET_KEY: 'sk_test_' + generateSecureSecret(24),
    STRIPE_WEBHOOK_SECRET: 'whsec_' + generateSecureSecret(32),
    
    // Webhook secrets
    WEBHOOK_SECRET: generateSecureSecret(32),
    
    // Email service (placeholder)
    EMAIL_API_KEY: 'SG.' + generateSecureSecret(48),
    
    // Monitoring (placeholder)
    SENTRY_DSN: 'https://' + generateSecureSecret(32) + '@sentry.io/1234567',
    
    // Development database
    POSTGRES_PASSWORD: generateSecureSecret(24),
    
    // Microservice authentication
    SERVICE_AUTH_KEY: generateSecureSecret(32),
    
    // Session encryption
    SESSION_ENCRYPTION_KEY: generateSecureSecret(32),
    
    // File storage
    STORAGE_SECRET: generateSecureSecret(40),
    
    // Cache
    CACHE_SECRET: generateSecureSecret(24),
    
    // Message broker
    MESSAGE_BROKER_SECRET: generateSecureSecret(32),
    
    // Analytics
    ANALYTICS_SECRET: generateSecureSecret(24)
  };
  
  return secrets;
}

/**
 * Display secrets in .env format
 */
function displaySecrets(secrets) {
  console.log('📝 Generated Secrets (copy these to your .env file):');
  console.log('=====================================================\n');
  
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('==============================');
  console.log('1. Store these secrets securely and NEVER commit them to version control');
  console.log('2. Use different secrets for development and production');
  console.log('3. Rotate secrets regularly (every 90 days recommended)');
  console.log('4. For external services (Stripe, SendGrid, etc.), get real keys from providers');
  console.log('5. Use a secret management system in production (AWS Secrets Manager, Azure Key Vault, etc.)');
  console.log('6. Enable encryption at rest and in transit for all sensitive data');
  console.log('7. Implement proper access controls and audit logging for secret access');
}

/**
 * Validate generated secrets
 */
function validateSecrets(secrets) {
  console.log('\n✅ Validating generated secrets...');
  
  const validationResults = {};
  
  // Validate JWT secret
  const jwtValidation = SecurityConfig.validateJWTSecret(secrets.JWT_SECRET);
  validationResults.JWT_SECRET = jwtValidation.isValid;
  
  if (!jwtValidation.isValid) {
    console.log(`❌ JWT Secret validation failed: ${jwtValidation.errors.join(', ')}`);
  }
  
  // Check minimum lengths
  const minLengths = {
    ENCRYPTION_KEY: 32,
    API_SECRET: 48,
    SESSION_SECRET: 64
  };
  
  Object.entries(minLengths).forEach(([key, minLength]) => {
    const isValid = secrets[key] && secrets[key].length >= minLength;
    validationResults[key] = isValid;
    
    if (!isValid) {
      console.log(`❌ ${key} is too short (minimum ${minLength} characters)`);
    }
  });
  
  const allValid = Object.values(validationResults).every(Boolean);
  
  if (allValid) {
    console.log('✅ All secrets passed validation');
  } else {
    console.log('❌ Some secrets failed validation');
  }
  
  return allValid;
}

/**
 * Generate development .env file
 */
function generateEnvFile(secrets, filename = '.env.generated') {
  const fs = require('fs');
  const path = require('path');
  
  let envContent = '# ==============================================\n';
  envContent += '# TalentSphere Generated Environment File\n';
  envContent += '# Generated on: ' + new Date().toISOString() + '\n';
  envContent += '# ⚠️  This is for development use only!\n';
  envContent += '# ==============================================\n\n';
  
  // Environment settings
  envContent += '# Environment\n';
  envContent += 'NODE_ENV=development\n';
  envContent += 'PORT=3000\n\n';
  
  // Database
  envContent += '# Database Configuration\n';
  envContent += 'DATABASE_URL=postgresql://talentsphere_user:' + secrets.DB_PASSWORD + '@localhost:5432/talentsphere\n';
  envContent += 'DB_HOST=localhost\n';
  envContent += 'DB_PORT=5432\n';
  envContent += 'DB_NAME=talentsphere\n';
  envContent += 'DB_USER=talentsphere_user\n';
  envContent += 'DB_PASSWORD=' + secrets.DB_PASSWORD + '\n\n';
  
  // Redis
  envContent += '# Redis Configuration\n';
  envContent += 'REDIS_URL=redis://localhost:6379\n';
  envContent += 'REDIS_PASSWORD=' + secrets.REDIS_PASSWORD + '\n\n';
  
  // Security
  envContent += '# Security Configuration\n';
  envContent += 'JWT_SECRET=' + secrets.JWT_SECRET + '\n';
  envContent += 'JWT_REFRESH_SECRET=' + secrets.JWT_REFRESH_SECRET + '\n';
  envContent += 'JWT_EXPIRES_IN=7d\n';
  envContent += 'JWT_REFRESH_EXPIRES_IN=30d\n';
  envContent += 'SESSION_SECRET=' + secrets.SESSION_SECRET + '\n';
  envContent += 'ENCRYPTION_KEY=' + secrets.ENCRYPTION_KEY + '\n';
  envContent += 'API_SECRET=' + secrets.API_SECRET + '\n\n';
  
  // CORS
  envContent += '# CORS Configuration\n';
  envContent += 'CORS_ORIGIN=http://localhost:3000,http://localhost:3100\n\n';
  
  // Features
  envContent += '# Feature Flags\n';
  envContent += 'ENABLE_AI_FEATURES=true\n';
  envContent += 'ENABLE_EMAIL_NOTIFICATIONS=true\n';
  envContent += 'ENABLE_FILE_UPLOADS=true\n';
  envContent += 'ENABLE_REAL_TIME_FEATURES=true\n\n';
  
  // Development settings
  envContent += '# Development Settings\n';
  envContent += 'DEBUG=true\n';
  envContent += 'MOCK_EXTERNAL_APIS=true\n';
  envContent += 'SKIP_EMAIL_VERIFICATION=false\n';
  
  const filePath = path.join(__dirname, '..', filename);
  fs.writeFileSync(filePath, envContent);
  
  console.log(`📁 Generated .env file: ${filePath}`);
  console.log('💡 Copy this file to .env and customize as needed');
}

// Main execution
if (require.main === module) {
  console.log('🚀 Starting TalentSphere secret generation...\n');
  
  try {
    const secrets = generateAllSecrets();
    displaySecrets(secrets);
    
    const isValid = validateSecrets(secrets);
    
    if (isValid) {
      generateEnvFile(secrets);
      console.log('\n🎉 Secret generation completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Review and copy the secrets to your environment');
      console.log('2. Set up your database and Redis with the generated passwords');
      console.log('3. Get real API keys from external service providers');
      console.log('4. Configure your development environment');
    } else {
      console.log('\n❌ Secret generation failed validation');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error generating secrets:', error.message);
    process.exit(1);
  }
}

module.exports = {
  generateSecureSecret,
  generateAllSecrets,
  validateSecrets,
  generateEnvFile
};