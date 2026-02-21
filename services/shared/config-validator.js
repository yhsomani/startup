/**
 * TalentSphere Configuration Validator
 * Centralized environment variable validation for all services
 */

const Joi = require('joi');

// Common environment variable schemas
const commonSchemas = {
    // Node.js Environment
    NODE_ENV: Joi.string()
        .valid('development', 'staging', 'production')
        .default('development')
        .description('Application environment'),
    
    PORT: Joi.number()
        .port()
        .default(3000)
        .description('Service port'),
    
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info')
        .description('Logging level'),

    // Database Configuration
    DATABASE_HOST: Joi.string()
        .hostname()
        .required()
        .description('Database host'),
    
    DATABASE_PORT: Joi.number()
        .port()
        .default(5432)
        .description('Database port'),
    
    DATABASE_NAME: Joi.string()
        .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
        .required()
        .description('Database name'),
    
    DATABASE_USER: Joi.string()
        .alphanum()
        .min(1)
        .required()
        .description('Database username'),
    
    DATABASE_PASSWORD: Joi.string()
        .min(8)
        .required()
        .description('Database password'),
    
    DATABASE_SSL: Joi.boolean()
        .default(false)
        .description('Enable database SSL'),

    // Security Configuration
    JWT_SECRET: Joi.string()
        .min(32)
        .required()
        .description('JWT secret key'),
    
    ENCRYPTION_KEY: Joi.string()
        .min(32)
        .required()
        .description('Encryption key'),
    
    API_SECRET: Joi.string()
        .min(16)
        .required()
        .description('API secret'),

    // Performance Configuration
    DATABASE_CONNECTION_TIMEOUT_MILLIS: Joi.number()
        .positive()
        .default(10000)
        .description('Database connection timeout'),
    
    DATABASE_IDLE_TIMEOUT_MILLIS: Joi.number()
        .positive()
        .default(30000)
        .description('Database idle timeout'),
    
    DATABASE_QUERY_TIMEOUT: Joi.number()
        .positive()
        .default(30000)
        .description('Database query timeout'),
    
    DATABASE_MIN: Joi.number()
        .positive()
        .default(2)
        .description('Minimum database connections'),
    
    DATABASE_MAX: Joi.number()
        .positive()
        .default(10)
        .description('Maximum database connections'),

    // CORS Configuration
    CORS_ORIGIN: Joi.string()
        .uri()
        .default('http://localhost:3000')
        .description('CORS origin'),
    
    ENABLE_CORS: Joi.boolean()
        .default(true)
        .description('Enable CORS'),

    // File Upload Configuration
    UPLOAD_DIR: Joi.string()
        .default('./uploads')
        .description('File upload directory'),
    
    MAX_FILE_SIZE: Joi.number()
        .positive()
        .default(10 * 1024 * 1024)
        .description('Maximum file size in bytes'),
    
    ALLOWED_FILE_TYPES: Joi.string()
        .default('pdf,doc,docx,txt,jpg,png')
        .description('Allowed file types'),

    // Feature Flags
    ENABLE_VIRUS_SCANNING: Joi.boolean()
        .default(false)
        .description('Enable virus scanning'),
    
    ENABLE_OCR: Joi.boolean()
        .default(false)
        .description('Enable OCR processing'),
    
    ENABLE_RESUME_PARSING: Joi.boolean()
        .default(true)
        .description('Enable resume parsing'),

    // External Service Configuration
    REDIS_HOST: Joi.string()
        .hostname()
        .default('localhost')
        .description('Redis host'),
    
    REDIS_PORT: Joi.number()
        .port()
        .default(6379)
        .description('Redis port'),
    
    REDIS_PASSWORD: Joi.string()
        .allow('')
        .description('Redis password'),
    
    REDIS_DB: Joi.number()
        .min(0)
        .max(15)
        .default(0)
        .description('Redis database number'),

    // Email Configuration
    SMTP_HOST: Joi.string()
        .hostname()
        .description('SMTP host'),
    
    SMTP_PORT: Joi.number()
        .port()
        .default(587)
        .description('SMTP port'),
    
    SMTP_USER: Joi.string()
        .email()
        .description('SMTP username'),
    
    SMTP_PASSWORD: Joi.string()
        .description('SMTP password'),
    
    SMTP_FROM_EMAIL: Joi.string()
        .email()
        .description('From email address'),

    // AWS Configuration
    AWS_ACCESS_KEY_ID: Joi.string()
        .min(16)
        .description('AWS access key ID'),
    
    AWS_SECRET_ACCESS_KEY: Joi.string()
        .min(16)
        .description('AWS secret access key'),
    
    AWS_REGION: Joi.string()
        .default('us-west-2')
        .description('AWS region'),
    
    AWS_S3_BUCKET: Joi.string()
        .pattern(/^[a-z0-9.-]*$/)
        .description('AWS S3 bucket name'),

    // Elasticsearch Configuration
    ELASTICSEARCH_HOST: Joi.string()
        .hostname()
        .default('localhost')
        .description('Elasticsearch host'),
    
    ELASTICSEARCH_PORT: Joi.number()
        .port()
        .default(9200)
        .description('Elasticsearch port'),
    
    ELASTICSEARCH_USERNAME: Joi.string()
        .description('Elasticsearch username'),
    
    ELASTICSEARCH_PASSWORD: Joi.string()
        .description('Elasticsearch password'),
    
    ELASTICSEARCH_SSL: Joi.boolean()
        .default(false)
        .description('Enable Elasticsearch SSL')
};

// Service-specific environment variable schemas
const serviceSchemas = {
    'analytics-service': {
        ANALYTICS_API_PORT: Joi.number().port().default(3009),
        ANALYTICS_RETENTION_DAYS: Joi.number().positive().default(365),
        AGGREGATION_INTERVAL: Joi.string().valid('hourly', 'daily', 'weekly').default('hourly'),
        ENABLE_REAL_TIME_AGGREGATION: Joi.boolean().default(true),
        ENABLE_EXECUTIVE_DASHBOARDS: Joi.boolean().default(true),
        ENABLE_USER_ENGAGEMENT_ANALYTICS: Joi.boolean().default(true),
        ENABLE_JOB_POSTING_ANALYTICS: Joi.boolean().default(true),
        ENABLE_REVENUE_ANALYTICS: Joi.boolean().default(true),
        ENABLE_PERFORMANCE_METRICS: Joi.boolean().default(true),
        ENABLE_USER_BEHAVIOR_TRACKING: Joi.boolean().default(true),
        ENABLE_CONVERSION_TRACKING: Joi.boolean().default(true)
    },

    'file-service': {
        RESUME_API_PORT: Joi.number().port().default(3004),
        MAX_FILE_SIZE: Joi.number().positive().default(10 * 1024 * 1024),
        ENABLE_OCR: Joi.boolean().default(false),
        ENABLE_RESUME_PARSING: Joi.boolean().default(true),
        ENABLE_VIRUS_SCANNING: Joi.boolean().default(true),
        ANTIVIRUS_COMMAND: Joi.string().default('clamscan')
    },

    'notification-service': {
        NOTIFICATION_API_PORT: Joi.number().port().default(3007),
        NOTIFICATION_WS_PORT: Joi.number().port().default(8080),
        MESSAGE_RETENTION_DAYS: Joi.number().positive().default(30),
        MAX_MESSAGE_LENGTH: Joi.number().positive().default(5000),
        ENABLE_ATTACHMENTS: Joi.boolean().default(true),
        MAX_ATTACHMENT_SIZE: Joi.number().positive().default(5 * 1024 * 1024)
    },

    'search-service': {
        SEARCH_API_PORT: Joi.number().port().default(3006),
        ENABLE_FULL_TEXT_SEARCH: Joi.boolean().default(true),
        SIMILARITY_THRESHOLD: Joi.number().min(0).max(1).default(0.7),
        MAX_RECOMMENDATIONS: Joi.number().positive().default(10),
        DEFAULT_QUERY_LIMIT: Joi.number().positive().default(20)
    },

    'video-service': {
        VIDEO_API_PORT: Joi.number().port().default(3005),
        VIDEO_PLATFORM: Joi.string().valid('zoom', 'jitsi', 'custom').default('zoom'),
        AUTO_RECORDING: Joi.boolean().default(true),
        MUTE_PARTICIPANTS_UPON_ENTRY: Joi.boolean().default(false),
        WAITING_ROOM: Joi.boolean().default(true),
        DURATION: Joi.number().positive().default(60)
    },

    'messaging-service': {
        MESSAGING_API_PORT: Joi.number().port().default(3008),
        MESSAGING_WS_PORT: Joi.number().port().default(8081)
    },

    'performance-monitoring': {
        PERFORMANCE_MONITORING_PORT: Joi.number().port().default(3010),
        QUERY_CACHE_TIMEOUT: Joi.number().positive().default(300000),
        SLOW_QUERY_THRESHOLD: Joi.number().positive().default(1000)
    },

    'ai-matching-service': {
        AI_MATCHING_API_PORT: Joi.number().port().default(3011),
        SIMILARITY_THRESHOLD: Joi.number().min(0).max(1).default(0.7),
        MAX_RECOMMENDATIONS: Joi.number().positive().default(10)
    }
};

/**
 * Configuration Validator Class
 */
class ConfigValidator {
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.schema = this.buildSchema();
        this.validationResult = null;
    }

    /**
     * Build complete schema for the service
     */
    buildSchema() {
        const schema = { ...commonSchemas };
        
        // Add service-specific variables
        if (serviceSchemas[this.serviceName]) {
            Object.assign(schema, serviceSchemas[this.serviceName]);
        }

        return Joi.object(schema).options({
            allowUnknown: false,
            stripUnknown: false,
            convert: true
        });
    }

    /**
     * Validate environment variables
     */
    validate() {
        // Only validate the variables we have defined in our schema
        const env = {};
        const schemaDescription = this.schema.describe();
        
        // Extract only the variables we care about from process.env
        Object.keys(schemaDescription.keys).forEach(key => {
            if (process.env[key] !== undefined) {
                env[key] = process.env[key];
            }
        });
        
        try {
            const { error, value, warning } = this.schema.validate(env, {
                abortEarly: false,
                allowUnknown: false,
                stripUnknown: false
            });

            // Check for required variables that are missing
            const missingRequired = [];
            Object.entries(schemaDescription.keys).forEach(([key, descriptor]) => {
                if (descriptor.flags && descriptor.flags.presence === 'required' && !process.env[key]) {
                    missingRequired.push({
                        key,
                        message: `"${key}" is required`,
                        value: undefined
                    });
                }
            });

            const allErrors = [];
            if (error) {
                allErrors.push(...error.details.map(detail => ({
                    key: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context.value
                })));
            }
            allErrors.push(...missingRequired);

            this.validationResult = {
                isValid: allErrors.length === 0,
                validatedConfig: value,
                errors: allErrors,
                warnings: warning ? warning.details.map(detail => ({
                    key: detail.path.join('.'),
                    message: detail.message
                })) : []
            };

            return this.validationResult;
        } catch (err) {
            this.validationResult = {
                isValid: false,
                validatedConfig: {},
                errors: [{ key: 'schema', message: err.message }],
                warnings: []
            };

            return this.validationResult;
        }
    }

    /**
     * Get validated configuration
     */
    getConfig() {
        if (!this.validationResult) {
            this.validate();
        }

        return this.validationResult.validatedConfig;
    }

    /**
     * Check if configuration is valid
     */
    isValid() {
        if (!this.validationResult) {
            this.validate();
        }

        return this.validationResult.isValid;
    }

    /**
     * Print validation results to console
     */
    printResults() {
        if (!this.validationResult) {
            this.validate();
        }

        console.log(`\n🔍 Configuration Validation for ${this.serviceName}`);
        console.log('='.repeat(50));

        if (this.validationResult.isValid) {
            console.log('✅ Configuration is valid');
        } else {
            console.log('❌ Configuration has errors:');
            this.validationResult.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.key}: ${error.message}`);
                if (error.value !== undefined) {
                    console.log(`     Current value: ${JSON.stringify(error.value)}`);
                }
            });
        }

        if (this.validationResult.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.validationResult.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning.key}: ${warning.message}`);
            });
        }

        console.log('');
    }

    /**
     * Get configuration summary
     */
    getSummary() {
        if (!this.validationResult) {
            this.validate();
        }

        const config = this.validationResult.validatedConfig;
        
        return {
            service: this.serviceName,
            environment: config.NODE_ENV,
            port: config.PORT,
            database: {
                host: config.DATABASE_HOST,
                port: config.DATABASE_PORT,
                name: config.DATABASE_NAME,
                ssl: config.DATABASE_SSL
            },
            features: {
                cors: config.ENABLE_CORS,
                virusScanning: config.ENABLE_VIRUS_SCANNING,
                ocr: config.ENABLE_OCR,
                resumeParsing: config.ENABLE_RESUME_PARSING
            },
            isValid: this.validationResult.isValid,
            errorCount: this.validationResult.errors.length,
            warningCount: this.validationResult.warnings.length
        };
    }
}

/**
 * Validate configuration for a specific service
 */
function validateServiceConfig(serviceName) {
    const validator = new ConfigValidator(serviceName);
    const result = validator.validate();
    
    return {
        ...result,
        summary: validator.getSummary(),
        config: validator.getConfig()
    };
}

/**
 * Validate configuration for all services
 */
function validateAllServices() {
    const results = {};
    
    Object.keys(serviceSchemas).forEach(serviceName => {
        results[serviceName] = validateServiceConfig(serviceName);
    });

    return results;
}

/**
 * Create environment-specific configuration
 */
function createEnvironmentConfig(serviceName, environment = 'development') {
    const envDefaults = {
        development: {
            NODE_ENV: 'development',
            LOG_LEVEL: 'debug',
            ENABLE_CORS: true,
            ENABLE_API_DOCS: true,
            DATABASE_SSL: false
        },
        staging: {
            NODE_ENV: 'staging',
            LOG_LEVEL: 'info',
            ENABLE_CORS: true,
            ENABLE_API_DOCS: false,
            DATABASE_SSL: true
        },
        production: {
            NODE_ENV: 'production',
            LOG_LEVEL: 'warn',
            ENABLE_CORS: false,
            ENABLE_API_DOCS: false,
            DATABASE_SSL: true
        }
    };

    const validator = new ConfigValidator(serviceName);
    const baseConfig = validator.getConfig();
    
    return {
        ...baseConfig,
        ...envDefaults[environment]
    };
}

/**
 * Generate .env file template
 */
function generateEnvTemplate(serviceName) {
    const validator = new ConfigValidator(serviceName);
    const schema = validator.schema.describe();
    const template = [];

    template.push(`# ${serviceName.toUpperCase()} Environment Variables`);
    template.push(`# Generated on ${new Date().toISOString()}`);
    template.push('');

    Object.entries(schema.keys).forEach(([key, descriptor]) => {
        if (descriptor.flags && descriptor.flags.default) {
            template.push(`${key}=${descriptor.flags.default}`);
        } else {
            template.push(`${key}=YOUR_${key.toUpperCase()}_HERE`);
        }
        
        if (description) {
            template.push(`# ${description}`);
        }
        template.push('');
    });

    return template.join('\n');
}

module.exports = {
    ConfigValidator,
    validateServiceConfig,
    validateAllServices,
    createEnvironmentConfig,
    generateEnvTemplate,
    commonSchemas,
    serviceSchemas
};