# TalentSphere Environment Variables Configuration Guide

**Last Updated:** January 29, 2026  
**Version:** 1.0

This document provides comprehensive documentation of all environment variables used across TalentSphere microservices for proper configuration management.

## 📋 Table of Contents

- [Service-Specific Environment Variables](#service-specific-environment-variables)
- [Database Configuration](#database-configuration)
- [External Service Integration](#external-service-integration)
- [Security & Authentication](#security--authentication)
- [Performance & Monitoring](#performance--monitoring)
- [File Storage & Processing](#file-storage--processing)
- [Notification & Messaging](#notification--messaging)
- [Video & Media](#video--media)
- [Development & Debugging](#development--debugging)
- [Environment-Specific Configurations](#environment-specific-configurations)

---

## Service-Specific Environment Variables

### Analytics Service
```bash
# Analytics Service Configuration
ANALYTICS_API_PORT=3009
ANALYTICS_RETENTION_DAYS=365
AGGREGATION_INTERVAL=hourly
ENABLE_REAL_TIME_AGGREGATION=true
ENABLE_EXECUTIVE_DASHBOARDS=true
ENABLE_USER_ENGAGEMENT_ANALYTICS=true
ENABLE_JOB_POSTING_ANALYTICS=true
ENABLE_REVENUE_ANALYTICS=true
ENABLE_PERFORMANCE_METRICS=true
ENABLE_USER_BEHAVIOR_TRACKING=true
ENABLE_CONVERSION_TRACKING=true
```

### File Service
```bash
# File Service Configuration
RESUME_API_PORT=3004
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ENABLE_OCR=false
ENABLE_RESUME_PARSING=true
ENABLE_VIRUS_SCANNING=true
ANTIVIRUS_COMMAND=clamscan
ENCRYPTION_KEY=your-encryption-key-here
```

### Notification Service
```bash
# Notification Service Configuration
NOTIFICATION_API_PORT=3007
NOTIFICATION_WS_PORT=8080
MESSAGE_RETENTION_DAYS=30
MAX_MESSAGE_LENGTH=5000
ENABLE_ATTACHMENTS=true
MAX_ATTACHMENT_SIZE=5242880
```

### Search Service
```bash
# Search Service Configuration
SEARCH_API_PORT=3006
ENABLE_FULL_TEXT_SEARCH=true
SIMILARITY_THRESHOLD=0.7
MAX_RECOMMENDATIONS=10
DEFAULT_QUERY_LIMIT=20
```

### Video Service
```bash
# Video Service Configuration
VIDEO_API_PORT=3005
VIDEO_PLATFORM=zoom
AUTO_RECORDING=true
MUTE_PARTICIPANTS_UPON_ENTRY=false
WAITING_ROOM=true
DURATION=60
```

### Messaging Service
```bash
# Messaging Service Configuration
MESSAGING_API_PORT=3008
MESSAGING_WS_PORT=8081
```

### Performance Monitoring
```bash
# Performance Monitoring Configuration
PERFORMANCE_MONITORING_PORT=3010
QUERY_CACHE_TIMEOUT=300000
SLOW_QUERY_THRESHOLD=1000
```

### AI Matching Service
```bash
# AI Matching Service Configuration
AI_MATCHING_API_PORT=3011
```

---

## Database Configuration

### PostgreSQL Configuration
```bash
# Common Database Variables (used by all services)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=talentsphere
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password-here
DATABASE_SSL=true
DATABASE_CONNECTION_TIMEOUT_MILLIS=10000
DATABASE_IDLE_TIMEOUT_MILLIS=30000
DATABASE_QUERY_TIMEOUT=30000
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_RETRIES=3
DATABASE_RETRY_DELAY=1000

# Connection Pool Configuration
DATABASE_MIN=2
DATABASE_MAX=10
DATABASE_KEEPALIVES_IDLE=30
DATABASE_KEEPALIVES_INTERVAL=30
```

### Database Connection String (Alternative)
```bash
DATABASE_CONNECTION_STRING=postgresql://username:password@host:port/database
```

---

## External Service Integration

### Email Service (SMTP)
```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@talentsphere.com
```

### AWS S3 Configuration
```bash
# AWS S3 for File Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=talentsphere-files
```

### Elasticsearch Configuration
```bash
# Elasticsearch for Search
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your-password
ELASTICSEARCH_SSL=false
```

### Redis Configuration
```bash
# Redis for Caching
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

---

## Security & Authentication

### JWT Configuration
```bash
# JWT Token Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### API Security
```bash
# API Security Configuration
API_SECRET=your-api-secret-here
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Encryption
```bash
# Encryption Keys
ENCRYPTION_KEY=your-32-character-encryption-key
HASH_SALT_ROUNDS=12
```

---

## Performance & Monitoring

### General Performance
```bash
# Performance Configuration
NODE_ENV=production
LOG_LEVEL=info
REQUEST_TIMEOUT=30000
MAX_PAYLOAD_SIZE=1048576
ENABLE_COMPRESSION=true
```

### Caching Configuration
```bash
# Caching
CACHE_TTL=3600
ENABLE_QUERY_CACHE=true
CACHE_MAX_SIZE=1000
```

---

## File Storage & Processing

### File Upload Configuration
```bash
# File Upload Settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,png
ENABLE_VIRUS_SCANNING=true
ANTIVIRUS_COMMAND=clamscan
```

### File Processing
```bash
# File Processing
ENABLE_OCR=true
ENABLE_RESUME_PARSING=true
THUMBNAIL_GENERATION=true
IMAGE_QUALITY=80
```

---

## Notification & Messaging

### WebSocket Configuration
```bash
# WebSocket Settings
WS_PORT=8080
WS_PATH=/ws
WS_MAX_PAYLOAD=1048576
WS_HEARTBEAT_INTERVAL=30000
```

### Notification Configuration
```bash
# Notification Settings
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
NOTIFICATION_QUEUE_SIZE=1000
```

---

## Video & Media

### Video Conference Integration
```bash
# Video Service Configuration
VIDEO_PLATFORM=zoom
ZOOM_API_KEY=your-zoom-api-key
ZOOM_API_SECRET=your-zoom-api-secret
ZOOM_WEBHOOK_SECRET=your-webhook-secret
```

### Video Settings
```bash
# Video Conference Settings
AUTO_RECORDING=true
MUTE_PARTICIPANTS_UPON_ENTRY=false
WAITING_ROOM=true
DEFAULT_DURATION=60
MAX_PARTICIPANTS=50
```

---

## Development & Debugging

### Development Environment
```bash
# Development Configuration
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:3000
ENABLE_API_DOCS=true
ENABLE_SWAGGER_UI=true
```

### Debug Configuration
```bash
# Debug Settings
DEBUG=talentsphere:*
ENABLE_QUERY_LOGGING=true
ENABLE_PERFORMANCE_LOGGING=true
ENABLE_ERROR_STACK_TRACES=true
```

---

## Environment-Specific Configurations

### Development Environment (.env.development)
```bash
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=talentsphere_dev
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:3000
ENABLE_API_DOCS=true
ENABLE_SWAGGER_UI=true
```

### Staging Environment (.env.staging)
```bash
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_HOST=staging-db.talentsphere.com
DATABASE_NAME=talentsphere_staging
ENABLE_CORS=true
CORS_ORIGIN=https://staging.talentsphere.com
ENABLE_API_DOCS=false
```

### Production Environment (.env.production)
```bash
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_HOST=prod-db.talentsphere.com
DATABASE_NAME=talentsphere_prod
ENABLE_CORS=false
ENABLE_API_DOCS=false
ENABLE_SWAGGER_UI=false
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_SECURITY_HEADERS=true
```

---

## 🔧 Configuration Management

### Environment Variable Validation

Each service should implement environment variable validation on startup:

```javascript
// Example validation function
function validateEnvironment() {
    const required = ['DATABASE_HOST', 'DATABASE_PASSWORD', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
```

### Default Values Strategy

Services should provide sensible defaults for non-critical variables:

```javascript
const config = {
    port: process.env.SERVICE_PORT || 3000,
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || 5432,
        ssl: process.env.DATABASE_SSL === 'true'
    },
    features: {
        enableCaching: process.env.ENABLE_CACHE !== 'false',
        enableLogging: process.env.ENABLE_LOGGING !== 'false'
    }
};
```

### Security Considerations

1. **Never commit secrets to version control**
2. **Use environment-specific .env files**
3. **Implement secret rotation policies**
4. **Use strong encryption keys** (minimum 32 characters)
5. **Enable SSL/TLS in production**
6. **Regular security audits of environment variables**

---

## 📝 Environment Setup Instructions

### 1. Development Setup

1. Copy `.env.example` to `.env.development`
2. Set development-specific values
3. Run `npm run dev:configure` to validate configuration

### 2. Production Deployment

1. Set environment variables in your deployment platform
2. Use secret management systems (AWS Secrets Manager, HashiCorp Vault)
3. Implement environment variable validation in CI/CD pipeline
4. Monitor configuration changes and security events

### 3. Docker Configuration

```dockerfile
# Dockerfile example
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_HOST=${DB_HOST}
ENV DATABASE_PASSWORD=${DB_PASSWORD}
```

### 4. Kubernetes Configuration

```yaml
# ConfigMap example
apiVersion: v1
kind: ConfigMap
metadata:
  name: talentsphere-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
```

---

## 🚨 Critical Security Variables

The following variables are **CRITICAL** and must be properly secured:

- `JWT_SECRET` - JWT token signing
- `ENCRYPTION_KEY` - Data encryption
- `DATABASE_PASSWORD` - Database access
- `API_SECRET` - API authentication
- `AWS_SECRET_ACCESS_KEY` - AWS access
- `REDIS_PASSWORD` - Redis access

**Never log or expose these variables in error messages!**

---

## 📊 Environment Variable Summary

| Category | Count | Critical |
|----------|-------|----------|
| Database | 15 | 4 |
| Security | 8 | 5 |
| Service-Specific | 35 | 2 |
| External Services | 12 | 6 |
| Performance | 8 | 0 |
| Development | 6 | 0 |
| **Total** | **84** | **17** |

---

## 🔄 Maintenance Checklist

### Weekly
- [ ] Review environment variable usage logs
- [ ] Check for unused variables
- [ ] Validate security variables strength

### Monthly
- [ ] Rotate encryption keys and secrets
- [ ] Audit access to configuration management
- [ ] Update documentation for new variables

### Quarterly
- [ ] Comprehensive security audit
- [ ] Performance impact review
- [ ] Configuration optimization review

---

## 📞 Support

For questions about environment variable configuration:

1. Check the service-specific documentation
2. Review the `.env.example` files in each service directory
3. Contact the DevOps team for production configurations
4. Create an issue in the project repository for configuration-related problems

---

**Last Reviewed:** January 29, 2026  
**Next Review Due:** April 29, 2026