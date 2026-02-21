# TalentSphere Configuration Management Guide

**Last Updated:** January 29, 2026  
**Version:** 1.0

This guide provides comprehensive instructions for managing configuration across the TalentSphere microservices architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Environment Files](#environment-files)
- [Configuration Validation](#configuration-validation)
- [Security Best Practices](#security-best-practices)
- [Deployment Configuration](#deployment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

TalentSphere uses environment-based configuration management with the following key components:

### 🏗️ Architecture

```
Configuration Management
├── Environment Files (.env.*)
├── Configuration Validator (config-validator.js)
├── Management Script (config-manager.js)
├── Service-Specific Configurations
└── Security & Validation
```

### 🔧 Key Features

- **Centralized validation** for all environment variables
- **Environment-specific configurations** (dev/staging/prod)
- **Security auditing** for sensitive values
- **Template generation** for new services
- **Automated validation** in CI/CD pipelines

---

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd TalentSphere

# Create development environment
node scripts/config-manager.js create-env development

# Validate all services
node scripts/config-manager.js validate-all
```

### 2. Service Development

```bash
# Validate specific service
node scripts/config-manager.js validate analytics-service

# Generate template for new service
node scripts/config-manager.js generate my-new-service
```

### 3. Environment Management

```bash
# Check environment file status
node scripts/config-manager.js check-env production

# Run security audit
node scripts/config-manager.js audit

# List all services
node scripts/config-manager.js list-services
```

---

## Environment Files

### File Structure

```
TalentSphere/
├── .env.development.example    # Development template
├── .env.staging.example        # Staging template
├── .env.production.example    # Production template
├── .env.development           # Your development config (gitignored)
├── .env.staging              # Staging config (gitignored)
└── .env.production          # Production config (gitignored)
```

### Creating Environment Files

1. **Copy the appropriate template:**
   ```bash
   cp .env.development.example .env.development
   ```

2. **Update with your values:**
   ```bash
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PASSWORD=your_secure_password
   
   # Security
   JWT_SECRET=your_super_secure_jwt_secret_key_32_chars
   ENCRYPTION_KEY=your_32_character_encryption_key
   ```

3. **Validate the configuration:**
   ```bash
   node scripts/config-manager.js check-env development
   ```

---

## Configuration Validation

### Built-in Validator

The configuration validator checks for:

- **Required variables** (database, security keys)
- **Data types** (ports, URLs, boolean flags)
- **Security requirements** (minimum lengths, format)
- **Service-specific requirements**

### Validation Examples

```bash
# Validate single service
node scripts/config-manager.js validate analytics-service

# Validate all services
node scripts/config-manager.js validate-all

# Generate validation report
node scripts/config-manager.js validate analytics-service > validation-report.txt
```

### Integration with Services

Each service should include validation on startup:

```javascript
// service/server.js
const { validateServiceConfig } = require('../shared/config-validator');

function startService() {
    const validation = validateServiceConfig('analytics-service');
    
    if (!validation.isValid) {
        console.error('❌ Configuration validation failed:');
        validation.errors.forEach(error => {
            console.error(`  ${error.key}: ${error.message}`);
        });
        process.exit(1);
    }

    const config = validation.config;
    // Start service with validated config
}
```

---

## Security Best Practices

### 🔐 Critical Variables

The following variables require special attention:

| Variable | Purpose | Minimum Requirements |
|----------|---------|---------------------|
| `JWT_SECRET` | JWT token signing | 32+ characters, random |
| `ENCRYPTION_KEY` | Data encryption | 32+ characters, random |
| `DATABASE_PASSWORD` | Database access | 16+ characters, complex |
| `API_SECRET` | API authentication | 16+ characters, random |

### 🛡️ Security Guidelines

1. **Never commit real credentials** to version control
2. **Use strong, random values** for all secrets
3. **Rotate secrets regularly** (every 90 days)
4. **Use environment-specific values** (different per environment)
5. **Enable SSL/TLS** in production environments

### 🔍 Security Auditing

Run regular security audits:

```bash
# Comprehensive security audit
node scripts/config-manager.js audit

# Focus on production environment
node scripts/config-manager.js check-env production
```

---

## Deployment Configuration

### Development Environment

```bash
# Set development variables
export NODE_ENV=development
export LOG_LEVEL=debug
export ENABLE_API_DOCS=true

# Use development database
export DATABASE_HOST=localhost
export DATABASE_NAME=talentsphere_dev

# Relax security for development
export ENABLE_CORS=true
export CORS_ORIGIN=http://localhost:3000
```

### Production Environment

```bash
# Set production variables
export NODE_ENV=production
export LOG_LEVEL=warn
export ENABLE_API_DOCS=false

# Use production database with SSL
export DATABASE_HOST=prod-db.talentsphere.com
export DATABASE_SSL=true

# Tighten security
export ENABLE_CORS=false
export RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Configuration

```dockerfile
# Dockerfile
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_HOST=${DB_HOST}
ENV DATABASE_PASSWORD=${DB_PASSWORD}

# Copy environment file
COPY .env.production /app/.env
```

### Kubernetes Configuration

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: talentsphere-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "warn"
  DATABASE_HOST: "postgres-service"
  ENABLE_CORS: "false"

---
apiVersion: v1
kind: Secret
metadata:
  name: talentsphere-secrets
type: Opaque
data:
  DATABASE_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
```

---

## Service-Specific Configuration

### Analytics Service

```javascript
// Analytics service specific configuration
const analyticsConfig = {
    retentionPeriod: process.env.ANALYTICS_RETENTION_DAYS || 365,
    aggregationInterval: process.env.AGGREGATION_INTERVAL || 'hourly',
    enableRealTimeAggregation: process.env.ENABLE_REAL_TIME_AGGREGATION === 'true',
    // ... other analytics-specific settings
};
```

### File Service

```javascript
// File service specific configuration
const fileConfig = {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024,
    enableVirusScanning: process.env.ENABLE_VIRUS_SCANNING === 'true',
    encryptionKey: process.env.ENCRYPTION_KEY,
    // ... other file-specific settings
};
```

---

## Configuration Management Script

### Available Commands

```bash
# Help and information
node scripts/config-manager.js help

# Service management
node scripts/config-manager.js list-services
node scripts/config-manager.js validate <service>
node scripts/config-manager.js validate-all

# Template generation
node scripts/config-manager.js generate <service>
node scripts/config-manager.js generate-all

# Environment management
node scripts/config-manager.js create-env <env>
node scripts/config-manager.js check-env <env>
node scripts/config-manager.js audit
```

### Example Workflow

```bash
# 1. Create development environment
node scripts/config-manager.js create-env development

# 2. Edit .env.development with your values
vim .env.development

# 3. Validate the environment
node scripts/config-manager.js check-env development

# 4. Validate specific service
node scripts/config-manager.js validate analytics-service

# 5. Run security audit
node scripts/config-manager.js audit
```

---

## Troubleshooting

### Common Issues

#### 1. Missing Required Variables

**Error:** `DATABASE_HOST is required`

**Solution:** Add the missing variable to your environment file:
```bash
echo "DATABASE_HOST=localhost" >> .env.development
```

#### 2. Invalid Data Types

**Error:** `PORT must be a valid port number`

**Solution:** Ensure port numbers are valid:
```bash
# Invalid
PORT=3000.5

# Valid
PORT=3000
```

#### 3. Security Violations

**Error:** `JWT_SECRET must be at least 32 characters`

**Solution:** Generate a proper secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Enable debug mode
export DEBUG=talentsphere:*
export LOG_LEVEL=debug

# Run validation with debug output
node scripts/config-manager.js validate analytics-service
```

### Environment Variable Conflicts

When multiple services define different values for the same variable:

```bash
# Check for conflicts
grep -r "PORT=" services/ | sort | uniq -c

# Use service-specific ports
export ANALYTICS_API_PORT=3009
export FILE_SERVICE_PORT=3004
export NOTIFICATION_API_PORT=3007
```

---

## 🔧 Advanced Configuration

### Custom Validation Rules

Add custom validation for your service:

```javascript
// services/my-service/config.js
const Joi = require('joi');

const customSchema = Joi.object({
    MY_SERVICE_PORT: Joi.number().port().default(3012),
    MY_FEATURE_FLAG: Joi.boolean().default(true),
    CUSTOM_SETTING: Joi.string().pattern(/^[A-Z]+$/).required()
});

module.exports = customSchema;
```

### Environment Variable Encryption

For production environments, use encrypted variables:

```javascript
// services/shared/secure-config.js
const crypto = require('crypto');

function decryptVariable(encryptedValue, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Usage
const decryptedPassword = decryptVariable(process.env.ENCRYPTED_DB_PASSWORD, process.env.ENCRYPTION_KEY);
```

### Dynamic Configuration

Load configuration from external sources:

```javascript
// services/shared/dynamic-config.js
class DynamicConfig {
    constructor() {
        this.config = {};
        this.watchers = new Map();
    }

    async loadFromSource(source) {
        // Load from AWS Parameter Store, Consul, etc.
        const response = await fetch(source);
        this.config = await response.json();
    }

    watchVariable(name, callback) {
        if (!this.watchers.has(name)) {
            this.watchers.set(name, []);
        }
        this.watchers.get(name).push(callback);
    }

    get(key) {
        return this.config[key] || process.env[key];
    }
}

module.exports = DynamicConfig;
```

---

## 📊 Monitoring & Analytics

### Configuration Metrics

Track configuration changes and usage:

```javascript
// services/shared/config-metrics.js
class ConfigMetrics {
    constructor() {
        this.changes = [];
        this.validationResults = [];
    }

    recordChange(key, oldValue, newValue, timestamp = new Date()) {
        this.changes.push({ key, oldValue, newValue, timestamp });
    }

    recordValidation(service, result, timestamp = new Date()) {
        this.validationResults.push({ service, result, timestamp });
    }

    getReport() {
        return {
            totalChanges: this.changes.length,
            validationErrors: this.validationResults.filter(r => !r.result.isValid).length,
            recentChanges: this.changes.slice(-10),
            securityIssues: this.identifySecurityIssues()
        };
    }

    identifySecurityIssues() {
        return this.changes.filter(change => 
            change.key.includes('SECRET') || 
            change.key.includes('PASSWORD') ||
            change.key.includes('KEY')
        );
    }
}
```

---

## 🚀 Best Practices Summary

### Development
- ✅ Use `.env.development` for local development
- ✅ Include helpful defaults and comments
- ✅ Enable debug logging and API documentation
- ✅ Use relaxed security settings for easier testing

### Staging
- ✅ Mirror production configuration as much as possible
- ✅ Use staging-specific services (staging DB, S3 bucket, etc.)
- ✅ Enable comprehensive logging and monitoring
- ✅ Test all security features

### Production
- ✅ Use strong, unique secrets for each environment
- ✅ Enable SSL/TLS for all external connections
- ✅ Implement rate limiting and security headers
- ✅ Use external secret management (AWS Secrets Manager, Vault)

### CI/CD Integration
- ✅ Validate configuration in pipeline
- ✅ Run security audits before deployment
- ✅ Track configuration changes
- ✅ Automate environment variable updates

---

## 📞 Support

For configuration-related issues:

1. **Check the validation output** for specific error messages
2. **Review the documentation** for the specific service
3. **Run the security audit** to identify potential issues
4. **Create an issue** in the project repository with:
   - Environment (dev/staging/prod)
   - Service name
   - Full error message
   - Steps to reproduce

---

**Last Reviewed:** January 29, 2026  
**Next Review Due:** April 29, 2026