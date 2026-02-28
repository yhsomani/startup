/**
 * Frontend Environment Configuration
 * Centralized environment variables and configuration management for TalentSphere frontend
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// API Configuration
const apiConfig = {
  baseURL: process.env.REACT_APP_API_URL || (isDevelopment ? 'http://localhost:8000' : '/api'),
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  retries: parseInt(process.env.REACT_APP_API_RETRIES) || 3,
  retryDelay: parseInt(process.env.REACT_APP_API_RETRY_DELAY) || 1000
};

// WebSocket Configuration
const wsConfig = {
  url: process.env.REACT_APP_WS_URL || (isDevelopment ? 'ws://localhost:8000' : null),
  reconnectAttempts: parseInt(process.env.REACT_APP_WS_RECONNECT_ATTEMPTS) || 5,
  reconnectDelay: parseInt(process.env.REACT_APP_WS_RECONNECT_DELAY) || 1000,
  heartbeatInterval: parseInt(process.env.REACT_APP_WS_HEARTBEAT_INTERVAL) || 30000
};

// Application Configuration
const appConfig = {
  name: process.env.REACT_APP_NAME || 'TalentSphere',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  description: process.env.REACT_APP_DESCRIPTION || 'Professional talent acquisition and networking platform',
  
  // Features
  features: {
    analytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    websocket: process.env.REACT_APP_ENABLE_WEBSOCKET === 'true',
    notifications: process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
    chat: process.env.REACT_APP_ENABLE_CHAT === 'true',
    fileUpload: process.env.REACT_APP_ENABLE_FILE_UPLOAD === 'true',
    darkMode: process.env.REACT_APP_ENABLE_DARK_MODE === 'true'
  },
  
  // Limits
  limits: {
    maxFileSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 10485760, // 10MB
    maxMessageLength: parseInt(process.env.REACT_APP_MAX_MESSAGE_LENGTH) || 2000,
    maxConnections: parseInt(process.env.REACT_APP_MAX_CONNECTIONS) || 1000,
    maxApplicationsPerDay: parseInt(process.env.REACT_APP_MAX_APPLICATIONS_PER_DAY) || 10
  },
  
  // Cache configuration
  cache: {
    defaultTTL: parseInt(process.env.REACT_APP_CACHE_TTL) || 300000, // 5 minutes
    profileCacheTTL: parseInt(process.env.REACT_APP_PROFILE_CACHE_TTL) || 600000, // 10 minutes
    jobsCacheTTL: parseInt(process.env.REACT_APP_JOBS_CACHE_TTL) || 180000, // 3 minutes
    companiesCacheTTL: parseInt(process.env.REACT_APP_COMPANIES_CACHE_TTL) || 600000 // 10 minutes
  }
};

// Monitoring Configuration
const monitoringConfig = {
  enablePerformanceMonitoring: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
  enableErrorTracking: process.env.REACT_APP_ENABLE_ERROR_TRACKING === 'true',
  enableUserAnalytics: process.env.REACT_APP_ENABLE_USER_ANALYTICS === 'true',
  sampleRate: parseFloat(process.env.REACT_APP_MONITORING_SAMPLE_RATE) || 0.1,
  
  // Error tracking
  errorTracking: {
    endpoint: process.env.REACT_APP_ERROR_TRACKING_ENDPOINT,
    apiKey: process.env.REACT_APP_ERROR_TRACKING_API_KEY,
    includeStackTrace: isDevelopment,
    maxErrorsPerSession: parseInt(process.env.REACT_APP_MAX_ERRORS_PER_SESSION) || 10
  },
  
  // Performance monitoring
  performanceMonitoring: {
    endpoint: process.env.REACT_APP_PERFORMANCE_MONITORING_ENDPOINT,
    apiKey: process.env.REACT_APP_PERFORMANCE_MONITORING_API_KEY,
    enableRouteTiming: process.env.REACT_APP_ENABLE_ROUTE_TIMING === 'true',
    enableComponentTiming: process.env.REACT_APP_ENABLE_COMPONENT_TIMING === 'true',
    enableResourceTiming: process.env.REACT_APP_ENABLE_RESOURCE_TIMING === 'true'
  }
};

// Third-party integrations
const integrations = {
  // Google Analytics
  googleAnalytics: {
    trackingId: process.env.REACT_APP_GA_TRACKING_ID,
    enabled: process.env.REACT_APP_ENABLE_GA === 'true'
  },
  
  // Sentry for error tracking
  sentry: {
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.REACT_APP_ENABLE_SENTRY === 'true'
  },
  
  // Hotjar for user analytics
  hotjar: {
    siteId: process.env.REACT_APP_HOTJAR_SITE_ID,
    enabled: process.env.REACT_APP_ENABLE_HOTJAR === 'true'
  },
  
  // Intercom for customer support
  intercom: {
    appId: process.env.REACT_APP_INTERCOM_APP_ID,
    enabled: process.env.REACT_APP_ENABLE_INTERCOM === 'true'
  }
};

// Security Configuration
const securityConfig = {
  // CORS settings
  cors: {
    allowedOrigins: process.env.REACT_APP_CORS_ORIGINS ? 
      process.env.REACT_APP_CORS_ORIGINS.split(',') : 
      (isDevelopment ? ['http://localhost:3000', 'http://localhost:3100'] : ['https://talentsphere.com']),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version'],
    credentials: true
  },
  
  // Authentication
  auth: {
    tokenKey: 'authToken',
    refreshTokenKey: 'refreshToken',
    userKey: 'user',
    tokenExpiry: parseInt(process.env.REACT_APP_TOKEN_EXPIRY) || 86400000, // 24 hours
    refreshBuffer: parseInt(process.env.REACT_APP_REFRESH_BUFFER) || 300000, // 5 minutes
    maxLoginAttempts: parseInt(process.env.REACT_APP_MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.REACT_APP_LOCKOUT_DURATION) || 900000 // 15 minutes
  },
  
  // File upload security
  fileUpload: {
    allowedTypes: process.env.REACT_APP_ALLOWED_FILE_TYPES ? 
      process.env.REACT_APP_ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword'],
    maxFileSize: appConfig.limits.maxFileSize,
    scanForMalware: process.env.REACT_APP_SCAN_UPLOADS === 'true',
    virusScanEndpoint: process.env.REACT_APP_VIRUS_SCAN_ENDPOINT
  }
};

// Development-specific configurations
const developmentConfig = {
  mockAPI: process.env.REACT_APP_MOCK_API === 'true',
  enableHotReload: true,
  enableDetailedErrors: true,
  enableDebugTools: true,
  logAPICalls: process.env.REACT_APP_LOG_API_CALLS === 'true'
};

// Production-specific configurations
const productionConfig = {
  enableMinification: true,
  enableServiceWorker: true,
  enableOfflineSupport: true,
  enableCDN: process.env.REACT_APP_ENABLE_CDN === 'true',
  cdnURL: process.env.REACT_APP_CDN_URL,
  enablePerformanceMonitoring: true,
  enableErrorTracking: true
};

// Utility functions
const getConfig = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  return {
    environment,
    isDevelopment,
    isProduction,
    isTest,
    api: apiConfig,
    websocket: wsConfig,
    app: appConfig,
    monitoring: monitoringConfig,
    integrations,
    security: securityConfig,
    ...(isDevelopment ? { development: developmentConfig } : {}),
    ...(isProduction ? { production: productionConfig } : {}),
    ...(isTest ? { test: { enableDetailedErrors: true } } : {})
  };
};

const getEnvVar = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

const isFeatureEnabled = (featureName) => {
  const config = getConfig();
  return config.app.features[featureName] || false;
};

// Validation functions
const validateConfig = () => {
  const config = getConfig();
  const errors = [];
  
  // Required environment variables
  if (!config.api.baseURL) {
    errors.push('REACT_APP_API_URL is required');
  }
  
  // API configuration validation
  if (config.api.timeout < 1000) {
    errors.push('REACT_APP_API_TIMEOUT must be at least 1000ms');
  }
  
  if (config.api.retries < 1 || config.api.retries > 10) {
    errors.push('REACT_APP_API_RETRIES must be between 1 and 10');
  }
  
  // File upload validation
  if (config.app.limits.maxFileSize < 1024) {
    errors.push('REACT_APP_MAX_FILE_SIZE must be at least 1KB');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    config
  };
};

// Export configuration
const config = getConfig();
const validation = validateConfig();

export {
  config,
  validation,
  getConfig,
  getEnvVar,
  isFeatureEnabled,
  apiConfig,
  appConfig,
  securityConfig,
  monitoringConfig,
  integrations
};