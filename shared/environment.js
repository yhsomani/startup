/**
 * Environment Configuration Module
 * Centralized environment variable management for TalentSphere services
 */

require('dotenv').config();

// Validate required environment variables
const validateEnvironment = (required = []) => {
  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Get environment variable with optional default and type validation
const getEnvVar = (key, defaultValue = null, type = 'string') => {
  const value = process.env[key];
  
  if (value === undefined || value === '') {
    if (defaultValue !== null) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  // Type conversion
  switch (type) {
    case 'number':
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
      }
      return numValue;
      
    case 'boolean':
      return value.toLowerCase() === 'true' || value === '1';
      
    case 'json':
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error(`Environment variable ${key} must be valid JSON, got: ${value}`);
      }
      
    case 'array':
      return value.split(',').map(item => item.trim());
      
    case 'string':
    default:
      return value;
  }
};

// Database Configuration
const getDatabaseConfig = () => {
  validateEnvironment(['DATABASE_URL']);
  
  return {
    url: getEnvVar('DATABASE_URL'),
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvVar('DB_PORT', 5432, 'number'),
    database: getEnvVar('DB_NAME', 'talentsphere'),
    username: getEnvVar('DB_USER', 'talentsphere'),
    password: getEnvVar('DB_PASSWORD', 'talent123'),
    ssl: getEnvVar('DB_SSL', false, 'boolean'),
    minConnections: getEnvVar('DB_MIN_CONNECTIONS', 2, 'number'),
    maxConnections: getEnvVar('DB_MAX_CONNECTIONS', 20, 'number'),
    connectionTimeout: getEnvVar('DB_CONNECTION_TIMEOUT', 30000, 'number'),
    idleTimeout: getEnvVar('DB_IDLE_TIMEOUT', 10000, 'number')
  };
};

// Redis Configuration
const getRedisConfig = () => {
  return {
    url: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: getEnvVar('REDIS_PORT', 6379, 'number'),
    password: getEnvVar('REDIS_PASSWORD', ''),
    database: getEnvVar('REDIS_DB', 0, 'number'),
    retryAttempts: getEnvVar('REDIS_RETRY_ATTEMPTS', 3, 'number'),
    retryDelay: getEnvVar('REDIS_RETRY_DELAY', 1000, 'number')
  };
};

// JWT Configuration
const getJWTConfig = () => {
  validateEnvironment(['JWT_SECRET']);
  
  return {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '30d'),
    algorithm: getEnvVar('JWT_ALGORITHM', 'HS256'),
    issuer: getEnvVar('JWT_ISSUER', 'talentsphere'),
    audience: getEnvVar('JWT_AUDIENCE', 'talentsphere-users')
  };
};

// Email Configuration
const getEmailConfig = () => {
  return {
    host: getEnvVar('SMTP_HOST', 'localhost'),
    port: getEnvVar('SMTP_PORT', 587, 'number'),
    secure: getEnvVar('SMTP_SECURE', false, 'boolean'),
    user: getEnvVar('SMTP_USER', ''),
    password: getEnvVar('SMTP_PASSWORD', ''),
    from: getEnvVar('EMAIL_FROM', 'noreply@talentsphere.com'),
    templates: getEnvVar('EMAIL_TEMPLATES_PATH', './templates')
  };
};

// CORS Configuration
const getCORSConfig = () => {
  const origin = getEnvVar('CORS_ORIGIN', '*');
  const origins = origin === '*' ? '*' : origin.split(',').map(o => o.trim());
  
  return {
    origin: origins,
    credentials: getEnvVar('CORS_CREDENTIALS', true, 'boolean'),
    methods: getEnvVar('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE', 'array'),
    allowedHeaders: getEnvVar('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization', 'array'),
    exposedHeaders: getEnvVar('CORS_EXPOSED_HEADERS', '', 'array'),
    maxAge: getEnvVar('CORS_MAX_AGE', 86400, 'number')
  };
};

// Rate Limiting Configuration
const getRateLimitConfig = () => {
  return {
    enabled: getEnvVar('RATE_LIMIT_ENABLED', true, 'boolean'),
    windowMs: getEnvVar('RATE_LIMIT_WINDOW_MS', 900000, 'number'),
    maxRequests: getEnvVar('RATE_LIMIT_MAX_REQUESTS', 100, 'number'),
    skipSuccessfulRequests: getEnvVar('RATE_LIMIT_SKIP_SUCCESS', false, 'boolean'),
    skipFailedRequests: getEnvVar('RATE_LIMIT_SKIP_FAILED', false, 'boolean')
  };
};

// Logging Configuration
const getLoggingConfig = () => {
  return {
    level: getEnvVar('LOG_LEVEL', 'info'),
    format: getEnvVar('LOG_FORMAT', 'json'),
    file: getEnvVar('LOG_FILE', ''),
    maxFiles: getEnvVar('LOG_MAX_FILES', 5, 'number'),
    maxSize: getEnvVar('LOG_MAX_SIZE', '10m'),
    colorize: getEnvVar('LOG_COLORIZE', false, 'boolean'),
    timestamp: getEnvVar('LOG_TIMESTAMP', true, 'boolean')
  };
};

// File Upload Configuration
const getUploadConfig = () => {
  return {
    maxFileSize: getEnvVar('MAX_FILE_SIZE', 10485760, 'number'), // 10MB
    uploadPath: getEnvVar('UPLOAD_PATH', 'uploads/'),
    allowedTypes: getEnvVar('ALLOWED_FILE_TYPES', 'jpg,jpeg,png,pdf,doc,docx', 'array'),
    generateThumbnails: getEnvVar('GENERATE_THUMBNAILS', true, 'boolean'),
    thumbnailSize: getEnvVar('THUMBNAIL_SIZE', 200, 'number')
  };
};

// API Configuration
const getAPIConfig = () => {
  return {
    version: getEnvVar('API_VERSION', 'v1'),
    baseUrl: getEnvVar('API_BASE_URL', 'http://localhost:8000'),
    timeout: getEnvVar('API_TIMEOUT', 30000, 'number'),
    retries: getEnvVar('API_RETRIES', 3, 'number'),
    enableMetrics: getEnvVar('ENABLE_METRICS', true, 'boolean'),
    enableTracing: getEnvVar('ENABLE_TRACING', true, 'boolean')
  };
};

// Security Configuration
const getSecurityConfig = () => {
  return {
    bcryptRounds: getEnvVar('BCRYPT_ROUNDS', 12, 'number'),
    passwordMinLength: getEnvVar('PASSWORD_MIN_LENGTH', 8, 'number'),
    sessionSecret: getEnvVar('SESSION_SECRET', getEnvVar('JWT_SECRET')),
    enableHelmet: getEnvVar('ENABLE_HELMET', true, 'boolean'),
    enableCSRF: getEnvVar('ENABLE_CSRF', false, 'boolean')
  };
};

// Get complete configuration for a specific service
const getServiceConfig = (serviceName) => {
  const baseConfig = {
    environment: getEnvVar('NODE_ENV', 'development'),
    debug: getEnvVar('DEBUG', false, 'boolean'),
    
    // Use ports module for port configuration
    ports: require('./ports'),
    
    // Shared configurations
    database: getDatabaseConfig(),
    redis: getRedisConfig(),
    jwt: getJWTConfig(),
    cors: getCORSConfig(),
    rateLimit: getRateLimitConfig(),
    logging: getLoggingConfig(),
    api: getAPIConfig(),
    security: getSecurityConfig()
  };
  
  // Service-specific configurations
  const serviceConfigs = {
    'user-auth-service': {
      ...baseConfig,
      email: getEmailConfig(),
      features: {
        passwordReset: true,
        emailVerification: true,
        multiFactorAuth: false
      }
    },
    
    'user-profile-service': {
      ...baseConfig,
      upload: getUploadConfig(),
      features: {
        fileUpload: true,
        profileSearch: true,
        skillTags: true
      }
    },
    
    'job-listing-service': {
      ...baseConfig,
      features: {
        jobSearch: true,
        jobRecommendations: true,
        applicationTracking: true
      }
    },
    
    'notification-service': {
      ...baseConfig,
      email: getEmailConfig(),
      features: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false
      }
    },
    
    'company-service': {
      ...baseConfig,
      upload: getUploadConfig(),
      features: {
        companyVerification: true,
        jobPosting: true,
        companySearch: true
      }
    },
    
    'email-service': {
      ...baseConfig,
      email: getEmailConfig(),
      features: {
        bulkEmail: true,
        emailTemplates: true,
        emailTracking: true
      }
    },
    
    'analytics-service': {
      ...baseConfig,
      features: {
        userAnalytics: true,
        jobAnalytics: true,
        companyAnalytics: true
      }
    }
  };
  
  return serviceConfigs[serviceName] || baseConfig;
};

// Export configuration functions
module.exports = {
  validateEnvironment,
  getEnvVar,
  
  // Configuration getters
  getDatabaseConfig,
  getRedisConfig,
  getJWTConfig,
  getEmailConfig,
  getCORSConfig,
  getRateLimitConfig,
  getLoggingConfig,
  getUploadConfig,
  getAPIConfig,
  getSecurityConfig,
  getServiceConfig,
  
  // Common exports
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};