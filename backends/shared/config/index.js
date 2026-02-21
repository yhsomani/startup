/**
 * TalentSphere Shared Configuration
 * Common configuration utilities for all backend services
 */

const path = require('path');
require('dotenv').config();

// Base configuration
const config = {
  // Service ports
  ports: {
    gateway: parseInt(process.env.GATEWAY_PORT) || 8000,
    auth: parseInt(process.env.FLASK_PORT) || 5000,
    challenges: parseInt(process.env.FLASK_PORT) || 5000,
    courses: parseInt(process.env.FLASK_PORT) || 5000,
    video: parseInt(process.env.DOTNET_PORT) || 5062,
    progress: parseInt(process.env.SPRING_PORT) || 8080,
    notifications: parseInt(process.env.NODE_PORT) || 3030,
    ai: parseInt(process.env.ASSISTANT_PORT) || 5005,
    collaboration: 1234,
    gamification: parseInt(process.env.GAMIFICATION_PORT) || 5007,
    recruitment: parseInt(process.env.RECRUITMENT_PORT) || 5006,
    job: parseInt(process.env.JOB_PORT) || 3003,
    network: parseInt(process.env.NETWORK_PORT) || 3004,
    search: parseInt(process.env.SEARCH_PORT) || 3008,
    analytics: parseInt(process.env.ANALYTICS_PORT) || 3006,
    file: parseInt(process.env.FILE_SERVICE_PORT) || 3009
  },

  // Frontend ports
  frontendPorts: {
    shell: parseInt(process.env.SHELL_PORT) || 3000,
    lms: parseInt(process.env.LMS_PORT) || 3001,
    challenge: parseInt(process.env.CHALLENGE_PORT) || 3002
  },

  // API base URLs
  apiUrls: {
    gateway: `http://localhost:${process.env.GATEWAY_PORT || 8000}`,
    auth: `http://localhost:${process.env.FLASK_PORT || 5000}/api/v1/auth`,
    courses: `http://localhost:${process.env.FLASK_PORT || 5000}/api/v1/courses`,
    challenges: `http://localhost:${process.env.FLASK_PORT || 5000}/api/v1/challenges`,
    video: `http://localhost:${process.env.DOTNET_PORT || 5062}/api/v1/video`,
    progress: `http://localhost:${process.env.SPRING_PORT || 8080}/api/v1/progress`,
    notifications: `http://localhost:${process.env.NODE_PORT || 3030}/api/v1/notifications`,
    ai: `http://localhost:${process.env.ASSISTANT_PORT || 5005}/api/v1/ai`,
    collaboration: `http://localhost:1234`,
    gamification: `http://localhost:${process.env.GAMIFICATION_PORT || 5007}/api/v1/gamification`,
    recruitment: `http://localhost:${process.env.RECRUITMENT_PORT || 5006}/api/v1/recruitment`,
    job: `http://localhost:${process.env.JOB_PORT || 3003}`,
    network: `http://localhost:${process.env.NETWORK_PORT || 3004}`,
    search: `http://localhost:${process.env.SEARCH_PORT || 3005}`,
    analytics: `http://localhost:${process.env.ANALYTICS_PORT || 3006}`
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'talentsphere',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.NODE_ENV === 'production',
    url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'talentsphere'}`
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0
  },

  // RabbitMQ configuration
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT) || 5672,
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: 'talentsphere',
    queues: {
      notifications: 'notifications',
      progress: 'progress',
      collaboration: 'collaboration',
      analytics: 'analytics',
      email: 'email'
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || '506a96e13dd6c15a48e02d305414deeea5e2b1068ff19449e65c46d5c548bba876a0f52903887b4b7d1c5b3b6d8f0e3a5d4f2c6b8a1e9d7c5b3a9f2e6d4c8b0a',
    expiration: parseInt(process.env.JWT_EXPIRATION) || 86400,
    refreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION) || 604800
  },

  // File upload configuration
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760, // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx').split(','),
    destination: process.env.UPLOAD_DESTINATION || 'uploads/',
    video: {
      maxSize: parseInt(process.env.VIDEO_MAX_SIZE) || 104857600, // 100MB
      allowedTypes: (process.env.VIDEO_ALLOWED_TYPES || 'mp4,avi,mov,wmv').split(',')
    }
  },

  // Email configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@talentsphere.io'
  },

  // AWS configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.S3_BUCKET_NAME || 'talentsphere-videos'
    }
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000
  },

  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10m'
  }
};

// Service-specific configuration generator
config.getServiceConfig = (serviceName) => {
  const serviceConfig = {
    name: serviceName,
    port: config.ports[serviceName],
    apiUrl: config.apiUrls[serviceName],
    ...config
  };

  // Service-specific overrides
  switch (serviceName) {
    case 'auth':
      return {
        ...serviceConfig,
        jwt: config.jwt,
        cors: {
          origin: [
            `http://localhost:${config.frontendPorts.shell}`,
            `http://localhost:${config.frontendPorts.lms}`,
            `http://localhost:${config.frontendPorts.challenge}`
          ],
          credentials: true
        }
      };

    case 'notifications':
      return {
        ...serviceConfig,
        socket: {
          cors: {
            origin: [
              `http://localhost:${config.frontendPorts.shell}`,
              `http://localhost:${config.frontendPorts.lms}`,
              `http://localhost:${config.frontendPorts.challenge}`
            ],
            credentials: true
          }
        }
      };

    case 'collaboration':
      return {
        ...serviceConfig,
        websocket: {
          port: config.ports.collaboration,
          cors: {
            origin: [
              `http://localhost:${config.frontendPorts.shell}`,
              `http://localhost:${config.frontendPorts.challenge}`
            ],
            credentials: true
          }
        }
      };

    default:
      return serviceConfig;
  }
};

// Environment validation
config.validate = () => {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = config;