/**
 * TalentSphere Centralized Configuration Management
 * Handles all service configurations with environment-specific overrides
 */

require("dotenv").config();

class ConfigManager {
    constructor() {
        this.environment = process.env.NODE_ENV || "development";
        this.isProduction = this.environment === "production";
        this.isDevelopment = this.environment === "development";
        this.isTest = this.environment === "test";

        this.loadConfig();
        this.validateConfig();
    }

    /**
     * Load default configurations
     */
    loadDefaultConfigs() {
        // Database configuration
        this.setConfig("database", {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT) || 5432,
            name: process.env.DB_NAME || "talentsphere",
            user: process.env.DB_USER || "talentsphere_user",
            password: process.env.DB_PASSWORD || "",
            ssl: process.env.DB_SSL === "true",
            poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
            poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
            connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
            queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
        });

        // Redis configuration
        this.setConfig("redis", {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || "",
            db: parseInt(process.env.REDIS_DB) || 0,
            maxRetries: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
            retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
            lazyConnect: process.env.REDIS_LAZY_CONNECT !== "false",
            keyPrefix: process.env.REDIS_KEY_PREFIX || "talentsphere:",
        });

        // Service ports
        this.setConfig("services", {
            auth: parseInt(process.env.AUTH_SERVICE_PORT) || 3001,
            user: parseInt(process.env.USER_SERVICE_PORT) || 3002,
            job: parseInt(process.env.JOB_SERVICE_PORT) || 3003,
            company: parseInt(process.env.COMPANY_SERVICE_PORT) || 3004,
            network: parseInt(process.env.NETWORK_SERVICE_PORT) || 3005,
            search: parseInt(process.env.SEARCH_SERVICE_PORT) || 3006,
            analytics: parseInt(process.env.ANALYTICS_SERVICE_PORT) || 3007,
            gamification: parseInt(process.env.GAMIFICATION_SERVICE_PORT) || 3008,
            collaboration: parseInt(process.env.COLLABORATION_SERVICE_PORT) || 3009,
            notification: parseInt(process.env.NOTIFICATION_SERVICE_PORT) || 3010,
            apiGateway: parseInt(process.env.API_GATEWAY_PORT) || 8000,
        });

        // Security configuration
        this.setConfig("security", {
            jwtSecret: process.env.JWT_SECRET || this.generateSecret("jwt"),
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
            jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
            bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
            encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecret("encryption"),
            sessionSecret: process.env.SESSION_SECRET || this.generateSecret("session"),
            apiSecret: process.env.API_SECRET || this.generateSecret("api"),
            rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
            rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
            corsOrigins: process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
                : ["http://localhost:3000"],
        });

        // Logging configuration
        this.setConfig("logging", {
            level: process.env.LOG_LEVEL || "info",
            format: process.env.LOG_FORMAT || "json",
            file: process.env.LOG_FILE === "true",
            console: process.env.LOG_CONSOLE !== "false",
            elasticsearch: {
                url: process.env.ELASTICSEARCH_URL,
                auth: process.env.ELASTICSEARCH_AUTH
                    ? JSON.parse(process.env.ELASTICSEARCH_AUTH)
                    : null,
            },
            maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE) || 5242880, // 5MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
        });

        // File upload configuration
        this.setConfig("upload", {
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
            allowedTypes: process.env.ALLOWED_FILE_TYPES
                ? process.env.ALLOWED_FILE_TYPES.split(",").map(type => type.trim())
                : ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"],
            storage: process.env.FILE_STORAGE || "local",
            s3: {
                bucket: process.env.AWS_S3_BUCKET,
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        // Email configuration
        this.setConfig("email", {
            provider: process.env.EMAIL_SERVICE_PROVIDER || "sendgrid",
            apiKey: process.env.EMAIL_API_KEY,
            from: process.env.EMAIL_FROM || "noreply@talentsphere.com",
            fromName: process.env.EMAIL_FROM_NAME || "TalentSphere",
            templates: {
                welcome: process.env.EMAIL_TEMPLATE_WELCOME,
                verification: process.env.EMAIL_TEMPLATE_VERIFICATION,
                passwordReset: process.env.EMAIL_TEMPLATE_PASSWORD_RESET,
                jobAlert: process.env.EMAIL_TEMPLATE_JOB_ALERT,
            },
        });

        // Feature flags
        this.setConfig("features", {
            enableGamification: process.env.FF_ENABLE_GAMIFICATION === "true",
            enableRealTime: process.env.FF_ENABLE_REAL_TIME === "true",
            enableAI: process.env.FF_ENABLE_AI === "true",
            enableAnalytics: process.env.FF_ENABLE_ANALYTICS !== "false",
            enableNotifications: process.env.FF_ENABLE_NOTIFICATIONS !== "false",
            enableFileUploads: process.env.FF_ENABLE_FILE_UPLOADS !== "false",
            enableSearch: process.env.FF_ENABLE_SEARCH !== "false",
            enableCollaboration: process.env.FF_ENABLE_COLLABORATION === "true",
        });

        // Monitoring configuration
        this.setConfig("monitoring", {
            enabled: process.env.MONITORING_ENABLED === "true",
            metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 60000, // 1 minute
            healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
            alerting: {
                enabled: process.env.ALERTING_ENABLED === "true",
                webhook: process.env.ALERT_WEBHOOK_URL,
                email: process.env.ALERT_EMAIL,
                slack: process.env.ALERT_SLACK_WEBHOOK,
            },
        });
    }

    /**
     * Setup configuration validation rules
     */
    setupConfigValidation() {
        // Database validation
        this.addValidator("database", config => {
            if (!config.host || !config.name || !config.user) {
                throw new Error("Database configuration incomplete");
            }
            if (config.port < 1 || config.port > 65535) {
                throw new Error("Invalid database port");
            }
            return true;
        });

        // Security validation
        this.addValidator("security", config => {
            if (!config.jwtSecret || config.jwtSecret.length < 32) {
                throw new Error("JWT secret must be at least 32 characters");
            }
            if (!config.encryptionKey || config.encryptionKey.length < 32) {
                throw new Error("Encryption key must be at least 32 characters");
            }
            return true;
        });

        // Service ports validation
        this.addValidator("services", config => {
            const usedPorts = Object.values(config);
            const duplicates = usedPorts.filter((port, index) => usedPorts.indexOf(port) !== index);
            if (duplicates.length > 0) {
                throw new Error(`Duplicate service ports: ${duplicates.join(", ")}`);
            }
            return true;
        });
    }

    /**
     * Load encryption keys
     */
    loadEncryptionKeys() {
        const keysPath = path.join(__dirname, "../config/keys.json");

        if (fs.existsSync(keysPath)) {
            try {
                const keysData = fs.readFileSync(keysPath, "utf8");
                this.encryptKeys = JSON.parse(keysData);
            } catch (error) {
                console.warn("Failed to load encryption keys:", error.message);
            }
        }
    }

    /**
     * Generate cryptographically secure secret
     */
    generateSecret(type) {
        const keyLength = type === "jwt" || type === "encryption" ? 64 : 32;
        return crypto.randomBytes(keyLength).toString("hex");
    }

    /**
     * Set configuration value
     */
    setConfig(key, value) {
        // Validate if validator exists
        if (this.validators.has(key)) {
            const validator = this.validators.get(key);
            validator(value);
        }

        this.configs.set(key, value);

        // Emit change event if watcher exists
        if (this.watchers.has(key)) {
            this.watchers.get(key).forEach(callback => callback(value, key));
        }
    }

    /**
     * Get configuration value
     */
    getConfig(key, defaultValue = null) {
        return this.configs.has(key) ? this.configs.get(key) : defaultValue;
    }

    /**
     * Get nested configuration value
     */
    getNestedConfig(path, defaultValue = null) {
        const keys = path.split(".");
        let current = Object.fromEntries(this.configs);

        for (const key of keys) {
            if (current && typeof current === "object" && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }

        return current;
    }

    /**
     * Update configuration
     */
    updateConfig(key, updates) {
        const current = this.getConfig(key, {});
        const updated = { ...current, ...updates };
        this.setConfig(key, updated);
    }

    /**
     * Add configuration validator
     */
    addValidator(key, validator) {
        this.validators.set(key, validator);
    }

    /**
     * Add configuration watcher
     */
    addWatcher(key, callback) {
        if (!this.watchers.has(key)) {
            this.watchers.set(key, []);
        }
        this.watchers.get(key).push(callback);
    }

    /**
     * Remove configuration watcher
     */
    removeWatcher(key, callback) {
        if (this.watchers.has(key)) {
            const callbacks = this.watchers.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Load configuration from file
     */
    loadFromFile(filePath) {
        try {
            const configData = fs.readFileSync(filePath, "utf8");
            const config = JSON.parse(configData);

            Object.keys(config).forEach(key => {
                this.setConfig(key, config[key]);
            });

            return true;
        } catch (error) {
            console.error(`Failed to load config from ${filePath}:`, error.message);
            return false;
        }
    }

    /**
     * Save configuration to file
     */
    saveToFile(filePath) {
        try {
            const config = Object.fromEntries(this.configs);
            const configData = JSON.stringify(config, null, 2);
            fs.writeFileSync(filePath, configData, "utf8");
            return true;
        } catch (error) {
            console.error(`Failed to save config to ${filePath}:`, error.message);
            return false;
        }
    }

    /**
     * Encrypt sensitive configuration values
     */
    encryptValue(value, keyName = null) {
        if (typeof value !== "string") {
            value = JSON.stringify(value);
        }

        const algorithm = "aes-256-gcm";
        const key =
            keyName && this.encryptKeys.has(keyName)
                ? Buffer.from(this.encryptKeys.get(keyName), "hex")
                : Buffer.from(this.getNestedConfig("security.encryptionKey"), "hex");

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);

        let encrypted = cipher.update(value, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString("hex"),
            authTag: authTag.toString("hex"),
        };
    }

    /**
     * Decrypt sensitive configuration values
     */
    decryptValue(encryptedData, keyName = null) {
        const algorithm = "aes-256-gcm";
        const key =
            keyName && this.encryptKeys.has(keyName)
                ? Buffer.from(this.encryptKeys.get(keyName), "hex")
                : Buffer.from(this.getNestedConfig("security.encryptionKey"), "hex");

        const decipher = crypto.createDecipher(algorithm, key);
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));

        let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    }

    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig() {
        const envConfigs = {
            development: {
                logLevel: "debug",
                corsOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
                rateLimitMax: 1000,
                monitoringEnabled: false,
            },
            testing: {
                logLevel: "error",
                corsOrigins: ["http://localhost:3000"],
                rateLimitMax: 10000,
                monitoringEnabled: false,
            },
            staging: {
                logLevel: "info",
                corsOrigins: ["https://staging.talentsphere.com"],
                rateLimitMax: 500,
                monitoringEnabled: true,
            },
            production: {
                logLevel: "warn",
                corsOrigins: ["https://talentsphere.com", "https://www.talentsphere.com"],
                rateLimitMax: 100,
                monitoringEnabled: true,
                ssl: true,
            },
        };

        return envConfigs[this.environment] || envConfigs.development;
    }

    /**
     * Get all configurations
     */
    getAllConfigs() {
        return Object.fromEntries(this.configs);
    }

    /**
     * Validate all configurations
     */
    validateAll() {
        const errors = [];

        this.validators.forEach((validator, key) => {
            try {
                if (this.configs.has(key)) {
                    validator(this.configs.get(key));
                }
            } catch (error) {
                errors.push({ key, error: error.message });
            }
        });

        return errors;
    }

    /**
     * Get configuration summary
     */
    getSummary() {
        return {
            environment: this.environment,
            configsCount: this.configs.size,
            validatorsCount: this.validators.size,
            watchersCount: Array.from(this.watchers.values()).reduce(
                (sum, callbacks) => sum + callbacks.length,
                0
            ),
            keysAvailable: this.encryptKeys.size,
            lastUpdated: new Date().toISOString(),
        };
    }

    /**
     * Reset all configurations
     */
    reset() {
        this.configs.clear();
        this.watchers.clear();
        this.loadDefaultConfigs();
    }

    /**
     * Export configuration to environment variables
     */
    exportToEnv() {
        const config = this.getAllConfigs();
        const envVars = [];

        const flattenObject = (obj, prefix = "") => {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                const envKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase();

                if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                    flattenObject(value, envKey);
                } else {
                    envVars.push(`${envKey}=${typeof value === "string" ? `"${value}"` : value}`);
                }
            });
        };

        flattenObject(config);

        return envVars.join("\n");
    }
}

// Singleton instance
const configManager = new ConfigManager();

// Load environment-specific overrides
const envConfigPath = path.join(__dirname, `../config/${configManager.environment}.json`);
if (fs.existsSync(envConfigPath)) {
    configManager.loadFromFile(envConfigPath);
}

// Load user-specific config
const userConfigPath = path.join(__dirname, "../config/user.json");
if (fs.existsSync(userConfigPath)) {
    configManager.loadFromFile(userConfigPath);
}

module.exports = {
    ConfigManager,
    configManager,
    getConfig: (key, defaultValue) => configManager.getConfig(key, defaultValue),
    getNestedConfig: (path, defaultValue) => configManager.getNestedConfig(path, defaultValue),
    setConfig: (key, value) => configManager.setConfig(key, value),
    updateConfig: (key, updates) => configManager.updateConfig(key, updates),
    addWatcher: (key, callback) => configManager.addWatcher(key, callback),
    removeWatcher: (key, callback) => configManager.removeWatcher(key, callback),
    validateAll: () => configManager.validateAll(),
    getSummary: () => configManager.getSummary(),
    getAllConfigs: () => configManager.getAllConfigs(),
    exportToEnv: () => configManager.exportToEnv(),
};
