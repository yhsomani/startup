const winston = require('winston');

/**
 * Database Connection Pool Configuration Utility
 * Provides environment-specific pool configuration and optimization
 */
class PoolConfigurator {
    constructor() {
        this.environments = {
            development: {
                min: 2,
                max: 10,
                connectionTimeoutMillis: 3000,
                idleTimeoutMillis: 30000,
                maxUses: 7500,
                validationInterval: 30000
            },
            staging: {
                min: 5,
                max: 25,
                connectionTimeoutMillis: 4000,
                idleTimeoutMillis: 45000,
                maxUses: 10000,
                validationInterval: 45000
            },
            production: {
                min: 10,
                max: 50,
                connectionTimeoutMillis: 5000,
                idleTimeoutMillis: 60000,
                maxUses: 15000,
                validationInterval: 60000
            }
        };
    }

    /**
     * Get environment-specific pool configuration
     */
    getConfig(environment = process.env.NODE_ENV || 'development') {
        const env = environment.toLowerCase();
        const baseConfig = this.environments[env] || this.environments.development;

        return {
            ...baseConfig,
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'talentsphere',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectionString: process.env.DATABASE_URL,

            // Additional production optimizations
            ...(env === 'production' && {
                ssl: {
                    rejectUnauthorized: false
                },
                keepAlive: true,
                keepAliveInitialDelayMillis: 10000
            }),

            // Logging configuration
            log: (msg) => {
                if (msg.level === 'error') {
                    winston.error(`DB Pool ${msg.level}:`, msg.message);
                } else {
                    winston.debug(`DB Pool ${msg.level}:`, msg.message);
                }
            }
        };
    }

    /**
     * Auto-tune pool configuration based on system resources
     */
    autoTuneConfig(systemInfo = {}) {
        const cpuCores = systemInfo.cpuCores || require('os').cpus().length;
        const memory = systemInfo.memory || require('os').totalmem();
        const environment = process.env.NODE_ENV || 'development';

        let baseConfig = this.getConfig(environment);

        // Adjust based on CPU cores
        if (cpuCores > 8) {
            baseConfig.max = Math.min(baseConfig.max, cpuCores * 4);
            baseConfig.min = Math.min(baseConfig.min, Math.floor(cpuCores * 1.5));
        }

        // Adjust based on available memory
        const memoryGB = memory / (1024 * 1024 * 1024);
        if (memoryGB > 16) {
            // Increase pool size for high-memory systems
            baseConfig.max = Math.min(baseConfig.max, Math.floor(memoryGB * 2));
        } else if (memoryGB < 4) {
            // Reduce pool size for low-memory systems
            baseConfig.max = Math.min(baseConfig.max, 8);
            baseConfig.min = Math.min(baseConfig.min, 2);
        }

        winston.info(`Auto-tuned pool config for ${cpuCores} CPU cores, ${memoryGB.toFixed(1)}GB RAM`);

        return baseConfig;
    }

    /**
     * Validate pool configuration
     */
    validateConfig(config) {
        const errors = [];

        if (config.min < 0) {
            errors.push('Minimum connections must be non-negative');
        }

        if (config.max <= 0) {
            errors.push('Maximum connections must be positive');
        }

        if (config.min > config.max) {
            errors.push('Minimum connections cannot exceed maximum connections');
        }

        if (config.connectionTimeoutMillis <= 0) {
            errors.push('Connection timeout must be positive');
        }

        if (config.idleTimeoutMillis < 0) {
            errors.push('Idle timeout must be non-negative');
        }

        if (errors.length > 0) {
            throw new Error(`Invalid pool configuration: ${errors.join(', ')}`);
        }

        return true;
    }

    /**
     * Generate pool sizing recommendations
     */
    getSizingRecommendations(workloadProfile = 'mixed') {
        const recommendations = {
            conservative: {
                description: 'Low concurrency, stable workload',
                min: 2,
                max: 8,
                ratio: '1:4'
            },
            moderate: {
                description: 'Moderate concurrency, varying workload',
                min: 5,
                max: 20,
                ratio: '1:4'
            },
            aggressive: {
                description: 'High concurrency, bursty workload',
                min: 10,
                max: 50,
                ratio: '1:5'
            }
        };

        const profile = recommendations[workloadProfile] || recommendations.moderate;

        return {
            ...profile,
            tuningTips: [
                'Start with conservative settings and monitor performance',
                'Increase max connections gradually based on observed demand',
                'Keep min connections at ~25% of max for steady-state performance',
                'Monitor connection wait times and adjust accordingly',
                'Consider connection lifecycle (maxUses) for long-running applications'
            ]
        };
    }

    /**
     * Monitor and suggest pool adjustments
     */
    async monitorAndSuggest(currentStats, config) {
        const suggestions = [];

        // Check utilization
        const utilization = currentStats.utilization || 0;
        if (utilization > 0.85) {
            suggestions.push({
                type: 'scale_up',
                message: 'High pool utilization detected',
                recommendation: 'Increase max connections by 25-50%',
                priority: 'high'
            });
        } else if (utilization < 0.3 && config.max > 10) {
            suggestions.push({
                type: 'scale_down',
                message: 'Low pool utilization detected',
                recommendation: 'Reduce max connections to optimize resource usage',
                priority: 'low'
            });
        }

        // Check waiting clients
        const waitingRatio = (currentStats.waitingClients || 0) / (config.max || 1);
        if (waitingRatio > 0.3) {
            suggestions.push({
                type: 'optimize',
                message: 'High client wait queue detected',
                recommendation: 'Increase min connections or reduce query latency',
                priority: 'medium'
            });
        }

        // Check connection errors
        const errorRate = ((currentStats.connectionErrors || 0) / (currentStats.totalQueries || 1)) * 100;
        if (errorRate > 5) {
            suggestions.push({
                type: 'troubleshoot',
                message: 'High connection error rate detected',
                recommendation: 'Check database connectivity and credentials',
                priority: 'high'
            });
        }

        return suggestions;
    }

    /**
     * Generate configuration documentation
     */
    generateDocumentation() {
        return {
            overview: 'Database Connection Pool Configuration Guide',
            environments: this.environments,
            sizingGuide: this.getSizingRecommendations(),
            bestPractices: [
                'Always set min connections to handle baseline load',
                'Set max connections based on database capacity and workload',
                'Use connection validation to detect stale connections',
                'Monitor pool metrics to identify scaling needs',
                'Implement graceful degradation for connection failures',
                'Consider using separate pools for different workloads',
                'Enable SSL in production environments',
                'Set appropriate timeouts to prevent hanging connections'
            ],
            monitoringMetrics: [
                'Pool utilization (active/max connections)',
                'Waiting client queue length',
                'Connection acquisition time',
                'Query execution time',
                'Connection error rates',
                'Idle connection count'
            ]
        };
    }
}

module.exports = PoolConfigurator;