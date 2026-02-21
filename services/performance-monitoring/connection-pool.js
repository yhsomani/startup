const { Pool } = require('pg');
const winston = require('winston');
const { EventEmitter } = require('events');

/**
 * Advanced Database Connection Pooling Service
 * Manages database connections with advanced pooling strategies and monitoring
 */
class DatabaseConnectionPool extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            // Connection settings
            connectionString: options.connectionString || process.env.DATABASE_URL,
            host: options.host || process.env.DB_HOST || 'localhost',
            port: options.port || process.env.DB_PORT || 5432,
            database: options.database || process.env.DB_NAME || 'talentsphere',
            user: options.user || process.env.DB_USER,
            password: options.password || process.env.DB_PASSWORD,

            // Pool configuration
            minConnections: options.minConnections || 5,
            maxConnections: options.maxConnections || 20,
            connectionTimeoutMillis: options.connectionTimeoutMillis || 5000,
            idleTimeoutMillis: options.idleTimeoutMillis || 30000,
            maxUses: options.maxUses || 7500, // Close connections after 7500 queries

            // Retry configuration
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,

            // Monitoring
            enableMonitoring: options.enableMonitoring !== false,
            monitoringInterval: options.monitoringInterval || 30000, // 30 seconds

            // Connection validation
            enableValidation: options.enableValidation !== false,
            validationQuery: options.validationQuery || 'SELECT 1',
            validationInterval: options.validationInterval || 60000, // 1 minute

            ...options
        };

        this.pool = null;
        this.isInitialized = false;
        this.connectionStats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            waitingClients: 0,
            totalQueries: 0,
            failedQueries: 0,
            connectionErrors: 0,
            retryAttempts: 0
        };

        this.healthChecks = [];
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Handle pool events
        this.on('pool-connect', (client) => {
            this.connectionStats.totalConnections++;
            winston.info('New database connection established');
        });

        this.on('pool-acquire', (client) => {
            this.connectionStats.activeConnections++;
            this.connectionStats.idleConnections = Math.max(0, this.connectionStats.idleConnections - 1);
            winston.debug('Connection acquired from pool');
        });

        this.on('pool-release', (client) => {
            this.connectionStats.activeConnections = Math.max(0, this.connectionStats.activeConnections - 1);
            this.connectionStats.idleConnections++;
            winston.debug('Connection released back to pool');
        });

        this.on('pool-error', (error, client) => {
            this.connectionStats.connectionErrors++;
            winston.error('Database connection error:', error);
        });

        this.on('pool-remove', (client) => {
            this.connectionStats.totalConnections = Math.max(0, this.connectionStats.totalConnections - 1);
            winston.debug('Connection removed from pool');
        });
    }

    async initialize() {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Create connection pool
            this.pool = new Pool({
                connectionString: this.options.connectionString,
                host: this.options.host,
                port: this.options.port,
                database: this.options.database,
                user: this.options.user,
                password: this.options.password,
                min: this.options.minConnections,
                max: this.options.maxConnections,
                connectionTimeoutMillis: this.options.connectionTimeoutMillis,
                idleTimeoutMillis: this.options.idleTimeoutMillis,
                maxUses: this.options.maxUses
            });

            // Attach pool event listeners
            this.attachPoolEvents();

            // Test connection
            await this.testConnection();

            // Start monitoring if enabled
            if (this.options.enableMonitoring) {
                this.startMonitoring();
            }

            this.isInitialized = true;
            winston.info('Database connection pool initialized successfully');
            return true;

        } catch (error) {
            winston.error('Failed to initialize database connection pool:', error);
            throw error;
        }
    }

    attachPoolEvents() {
        this.pool.on('connect', (client) => {
            this.emit('pool-connect', client);
        });

        this.pool.on('acquire', (client) => {
            this.emit('pool-acquire', client);
        });

        this.pool.on('release', (client) => {
            this.emit('pool-release', client);
        });

        this.pool.on('error', (error, client) => {
            this.emit('pool-error', error, client);
        });

        this.pool.on('remove', (client) => {
            this.emit('pool-remove', client);
        });
    }

    async testConnection(retries = 0) {
        try {
            const client = await this.pool.connect();
            try {
                await client.query('SELECT 1');
                client.release();
                return true;
            } catch (error) {
                client.release();
                throw error;
            }
        } catch (error) {
            if (retries < this.options.maxRetries) {
                winston.warn(`Connection test failed, retrying (${retries + 1}/${this.options.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
                return this.testConnection(retries + 1);
            }
            throw error;
        }
    }

    startMonitoring() {
        // Periodic monitoring
        setInterval(async () => {
            try {
                await this.collectPoolMetrics();
                this.checkPoolHealth();
            } catch (error) {
                winston.error('Pool monitoring error:', error);
            }
        }, this.options.monitoringInterval);

        // Connection validation
        if (this.options.enableValidation) {
            setInterval(async () => {
                await this.validateConnections();
            }, this.options.validationInterval);
        }
    }

    async collectPoolMetrics() {
        if (!this.pool) {return;}

        const poolStats = this.pool.totalCount;
        const idleCount = this.pool.idleCount;
        const waitingCount = this.pool.waitingCount;

        this.connectionStats.idleConnections = idleCount;
        this.connectionStats.waitingClients = waitingCount;
        this.connectionStats.activeConnections = poolStats - idleCount;

        // Emit metrics for external monitoring
        this.emit('pool-metrics', {
            ...this.connectionStats,
            poolSize: poolStats,
            utilization: poolStats > 0 ? (poolStats - idleCount) / poolStats : 0
        });

        winston.debug(`Pool stats - Total: ${poolStats}, Active: ${this.connectionStats.activeConnections}, Idle: ${idleCount}, Waiting: ${waitingCount}`);
    }

    checkPoolHealth() {
        const utilization = this.pool.totalCount > 0
            ? (this.pool.totalCount - this.pool.idleCount) / this.pool.totalCount
            : 0;

        // Warn if pool is over-utilized
        if (utilization > 0.8) {
            winston.warn(`High pool utilization: ${(utilization * 100).toFixed(1)}%`);
            this.emit('pool-overload', {
                utilization,
                active: this.connectionStats.activeConnections,
                max: this.options.maxConnections
            });
        }

        // Warn if too many clients are waiting
        if (this.connectionStats.waitingClients > this.options.maxConnections * 0.5) {
            winston.warn(`High client wait queue: ${this.connectionStats.waitingClients} clients waiting`);
            this.emit('pool-congestion', {
                waiting: this.connectionStats.waitingClients,
                maxQueue: this.options.maxConnections * 0.5
            });
        }
    }

    async validateConnections() {
        try {
            const result = await this.query(this.options.validationQuery);
            winston.debug('Connection validation successful');
            return true;
        } catch (error) {
            winston.error('Connection validation failed:', error);
            this.emit('pool-validation-failed', error);
            return false;
        }
    }

    // Enhanced query method with retry logic
    async query(text, params = [], options = {}) {
        if (!this.isInitialized) {
            throw new Error('Connection pool not initialized');
        }

        const maxRetries = options.maxRetries || this.options.maxRetries;
        const retryDelay = options.retryDelay || this.options.retryDelay;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                this.connectionStats.totalQueries++;

                const start = Date.now();
                const result = await this.pool.query(text, params);
                const duration = Date.now() - start;

                this.emit('query-executed', {
                    query: text.substring(0, 100),
                    duration,
                    success: true
                });

                return result;
            } catch (error) {
                this.connectionStats.failedQueries++;

                // Don't retry on client errors (syntax, etc.)
                if (error.code && error.code.startsWith('42')) {
                    throw error;
                }

                // Don't retry if we've exhausted attempts
                if (attempt === maxRetries) {
                    this.emit('query-failed', {
                        query: text.substring(0, 100),
                        error: error.message,
                        attempts: attempt + 1
                    });
                    throw error;
                }

                // Retry with exponential backoff
                const delay = retryDelay * Math.pow(2, attempt);
                winston.warn(`Query failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);

                this.connectionStats.retryAttempts++;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Transaction management
    async transaction(callback) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const result = await callback(client);

            await client.query('COMMIT');
            return result;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Connection management methods
    async getConnection() {
        if (!this.isInitialized) {
            throw new Error('Connection pool not initialized');
        }
        return await this.pool.connect();
    }

    async closeConnection(client) {
        if (client) {
            client.release();
        }
    }

    async getConnectionStats() {
        if (!this.pool) {
            return { ...this.connectionStats, initialized: false };
        }

        return {
            ...this.connectionStats,
            initialized: true,
            poolSize: this.pool.totalCount,
            idleConnections: this.pool.idleCount,
            waitingClients: this.pool.waitingCount,
            utilization: this.pool.totalCount > 0
                ? (this.pool.totalCount - this.pool.idleCount) / this.pool.totalCount
                : 0
        };
    }

    async resizePool(newMin, newMax) {
        if (!this.pool) {return false;}

        try {
            // Update pool configuration
            this.options.minConnections = newMin;
            this.options.maxConnections = newMax;

            // Note: node-postgres doesn't support dynamic resizing
            // In practice, you'd need to recreate the pool
            winston.info(`Pool resize requested: min=${newMin}, max=${newMax}`);

            this.emit('pool-resize', { min: newMin, max: newMax });
            return true;
        } catch (error) {
            winston.error('Failed to resize pool:', error);
            return false;
        }
    }

    async drain() {
        if (this.pool) {
            await this.pool.end();
            this.isInitialized = false;
            winston.info('Database connection pool drained');
        }
    }

    async cleanup() {
        await this.drain();
        this.removeAllListeners();
        winston.info('Database connection pool cleaned up');
    }

    // Health check method
    async healthCheck() {
        try {
            const stats = await this.getConnectionStats();
            const canConnect = await this.testConnection();

            return {
                status: canConnect ? 'healthy' : 'unhealthy',
                poolStats: stats,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = DatabaseConnectionPool;