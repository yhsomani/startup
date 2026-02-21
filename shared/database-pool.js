/**
 * TalentSphere Database Connection Pool Manager
 * Provides optimized connection pooling for PostgreSQL and MongoDB
 */

const { Pool } = require("pg");
const { MongoClient } = require("mongodb");
const redis = require("redis");

class DatabaseConnectionManager {
    constructor() {
        this.pools = new Map();
        this.clients = new Map();
        this.metrics = {
            connections: new Map(),
            queries: new Map(),
            errors: new Map(),
        };
        this.config = this.loadConfig();
    }

    /**
     * Load database configuration
     */
    loadConfig() {
        return {
            postgres: {
                user: process.env.DB_USER || "postgres",
                host: process.env.DB_HOST || "localhost",
                database: process.env.DB_NAME || "talentsphere",
                password: process.env.DB_PASSWORD || "password",
                port: parseInt(process.env.DB_PORT) || 5432,
                // Pool configuration
                max: parseInt(process.env.DB_POOL_MAX) || 20,
                min: parseInt(process.env.DB_POOL_MIN) || 5,
                idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
                connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
                // Health check
                healthCheckInterval: parseInt(process.env.DB_HEALTH_CHECK) || 30000,
            },
            mongodb: {
                uri: process.env.MONGODB_URI || "mongodb://localhost:27017/talentsphere",
                // Pool configuration
                maxPoolSize: parseInt(process.env.MONGO_POOL_MAX) || 10,
                minPoolSize: parseInt(process.env.MONGO_POOL_MIN) || 2,
                maxIdleTimeMS: parseInt(process.env.MONGO_IDLE_TIMEOUT) || 30000,
                serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT) || 10000,
                // Retry configuration
                retryWrites: true,
                retryReads: true,
            },
            redis: {
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD,
                database: parseInt(process.env.REDIS_DB) || 0,
                // Pool configuration
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                enableOfflineQueue: false,
                // Connection limits
                family: 4,
                keepAlive: true,
            },
        };
    }

    /**
     * Initialize PostgreSQL connection pool
     */
    async initPostgresPool(serviceName = "default") {
        const poolKey = `postgres_${serviceName}`;

        if (this.pools.has(poolKey)) {
            return this.pools.get(poolKey);
        }

        try {
            const pool = new Pool({
                ...this.config.postgres,
                // Custom health check
                healthCheck: {
                    text: "SELECT 1",
                    interval: this.config.postgres.healthCheckInterval,
                },
                // Logging
                log: (msg, level) => {
                    if (level === "error") {
                        this.recordError("postgres", msg);
                    }
                },
            });

            // Setup pool event listeners
            pool.on("connect", client => {
                this.incrementMetric("postgres", "connections");
                console.log(`PostgreSQL client connected for ${serviceName}`);
            });

            pool.on("acquire", client => {
                this.incrementMetric("postgres", "acquires");
            });

            pool.on("remove", client => {
                this.incrementMetric("postgres", "removes");
            });

            pool.on("error", (err, client) => {
                this.recordError("postgres", err);
                console.error(`PostgreSQL pool error for ${serviceName}:`, err);
            });

            // Test connection
            await pool.query("SELECT NOW()");

            this.pools.set(poolKey, pool);
            console.log(`PostgreSQL pool initialized for ${serviceName}`);

            return pool;
        } catch (error) {
            console.error(`Failed to initialize PostgreSQL pool for ${serviceName}:`, error);
            throw error;
        }
    }

    /**
     * Initialize MongoDB connection
     */
    async initMongoClient(serviceName = "default") {
        const clientKey = `mongodb_${serviceName}`;

        if (this.clients.has(clientKey)) {
            return this.clients.get(clientKey);
        }

        try {
            const client = new MongoClient(this.config.mongodb.uri, {
                ...this.config.mongodb,
                // Monitor connection events
                monitorCommands: true,
            });

            // Setup event listeners
            client.on("serverOpening", event => {
                console.log(`MongoDB server opening for ${serviceName}:`, event.address);
                this.incrementMetric("mongodb", "connections");
            });

            client.on("serverClosed", event => {
                console.log(`MongoDB server closed for ${serviceName}:`, event.address);
            });

            client.on("serverHeartbeatFailed", event => {
                this.recordError(
                    "mongodb",
                    new Error(`Heartbeat failed: ${event.failure.message}`)
                );
            });

            // Connect to server
            await client.connect();

            this.clients.set(clientKey, client);
            console.log(`MongoDB client initialized for ${serviceName}`);

            return client;
        } catch (error) {
            console.error(`Failed to initialize MongoDB client for ${serviceName}:`, error);
            throw error;
        }
    }

    /**
     * Initialize Redis connection
     */
    async initRedisClient(serviceName = "default") {
        const clientKey = `redis_${serviceName}`;

        if (this.clients.has(clientKey)) {
            return this.clients.get(clientKey);
        }

        try {
            const client = redis.createClient(this.config.redis);

            // Setup event listeners
            client.on("connect", () => {
                console.log(`Redis client connected for ${serviceName}`);
                this.incrementMetric("redis", "connections");
            });

            client.on("error", err => {
                this.recordError("redis", err);
                console.error(`Redis client error for ${serviceName}:`, err);
            });

            client.on("end", () => {
                console.log(`Redis client disconnected for ${serviceName}`);
            });

            client.on("reconnecting", () => {
                console.log(`Redis client reconnecting for ${serviceName}`);
            });

            // Connect to Redis
            await client.connect();

            this.clients.set(clientKey, client);
            console.log(`Redis client initialized for ${serviceName}`);

            return client;
        } catch (error) {
            console.error(`Failed to initialize Redis client for ${serviceName}:`, error);
            throw error;
        }
    }

    /**
     * Get PostgreSQL pool
     */
    getPostgresPool(serviceName = "default") {
        const poolKey = `postgres_${serviceName}`;
        const pool = this.pools.get(poolKey);

        if (!pool) {
            throw new Error(`PostgreSQL pool not found for service: ${serviceName}`);
        }

        return pool;
    }

    /**
     * Get MongoDB client
     */
    getMongoClient(serviceName = "default") {
        const clientKey = `mongodb_${serviceName}`;
        const client = this.clients.get(clientKey);

        if (!client) {
            throw new Error(`MongoDB client not found for service: ${serviceName}`);
        }

        return client;
    }

    /**
     * Get Redis client
     */
    getRedisClient(serviceName = "default") {
        const clientKey = `redis_${serviceName}`;
        const client = this.clients.get(clientKey);

        if (!client) {
            throw new Error(`Redis client not found for service: ${serviceName}`);
        }

        return client;
    }

    /**
     * Execute PostgreSQL query with connection from pool
     */
    async queryPostgres(serviceName, text, params = []) {
        const pool = this.getPostgresPool(serviceName);
        const start = Date.now();

        try {
            const result = await pool.query(text, params);
            const duration = Date.now() - start;

            this.recordQuery("postgres", duration);
            return result;
        } catch (error) {
            this.recordError("postgres", error);
            throw error;
        }
    }

    /**
     * Execute MongoDB operation with transaction support
     */
    async executeMongo(serviceName, databaseName, collectionName, operation) {
        const client = this.getMongoClient(serviceName);
        const start = Date.now();

        try {
            const db = client.db(databaseName);
            const collection = db.collection(collectionName);

            const result = await operation(collection);
            const duration = Date.now() - start;

            this.recordQuery("mongodb", duration);
            return result;
        } catch (error) {
            this.recordError("mongodb", error);
            throw error;
        }
    }

    /**
     * Execute Redis operation
     */
    async executeRedis(serviceName, operation) {
        const client = this.getRedisClient(serviceName);
        const start = Date.now();

        try {
            const result = await operation(client);
            const duration = Date.now() - start;

            this.recordQuery("redis", duration);
            return result;
        } catch (error) {
            this.recordError("redis", error);
            throw error;
        }
    }

    /**
     * Get database health status
     */
    async getHealthStatus() {
        const status = {
            postgres: {},
            mongodb: {},
            redis: {},
            timestamp: new Date().toISOString(),
        };

        // Check PostgreSQL pools
        for (const [key, pool] of this.pools.entries()) {
            if (key.startsWith("postgres_")) {
                const serviceName = key.replace("postgres_", "");
                try {
                    const result = await pool.query(
                        "SELECT NOW() as timestamp, version() as version"
                    );
                    status.postgres[serviceName] = {
                        status: "healthy",
                        timestamp: result.rows[0].timestamp,
                        version: result.rows[0].version,
                        totalCount: pool.totalCount,
                        idleCount: pool.idleCount,
                        waitingCount: pool.waitingCount,
                    };
                } catch (error) {
                    status.postgres[serviceName] = {
                        status: "unhealthy",
                        error: error.message,
                    };
                }
            }
        }

        // Check MongoDB clients
        for (const [key, client] of this.clients.entries()) {
            if (key.startsWith("mongodb_")) {
                const serviceName = key.replace("mongodb_", "");
                try {
                    const admin = client.db().admin();
                    const result = await admin.ping();
                    status.mongodb[serviceName] = {
                        status: result.ok === 1 ? "healthy" : "unhealthy",
                        timestamp: new Date().toISOString(),
                    };
                } catch (error) {
                    status.mongodb[serviceName] = {
                        status: "unhealthy",
                        error: error.message,
                    };
                }
            }
        }

        // Check Redis clients
        for (const [key, client] of this.clients.entries()) {
            if (key.startsWith("redis_")) {
                const serviceName = key.replace("redis_", "");
                try {
                    const result = await client.ping();
                    status.redis[serviceName] = {
                        status: result === "PONG" ? "healthy" : "unhealthy",
                        timestamp: new Date().toISOString(),
                    };
                } catch (error) {
                    status.redis[serviceName] = {
                        status: "unhealthy",
                        error: error.message,
                    };
                }
            }
        }

        return status;
    }

    /**
     * Get pool statistics
     */
    getPoolStatistics() {
        const stats = {
            postgres: {},
            mongodb: {},
            redis: {},
            queries: {},
            errors: {},
            timestamp: new Date().toISOString(),
        };

        // PostgreSQL pool stats
        for (const [key, pool] of this.pools.entries()) {
            if (key.startsWith("postgres_")) {
                const serviceName = key.replace("postgres_", "");
                stats.postgres[serviceName] = {
                    totalCount: pool.totalCount,
                    idleCount: pool.idleCount,
                    waitingCount: pool.waitingCount,
                    max: pool.options.max,
                    min: pool.options.min,
                };
            }
        }

        // MongoDB connection stats
        for (const [key, client] of this.clients.entries()) {
            if (key.startsWith("mongodb_")) {
                const serviceName = key.replace("mongodb_", "");
                const serverDescriptions = client.topology?.s?.serverDescriptions || {};
                stats.mongodb[serviceName] = {
                    connectedServers: Object.keys(serverDescriptions).length,
                    topologyType: client.topology?.s?.type || "Unknown",
                };
            }
        }

        // Redis connection stats
        for (const [key, client] of this.clients.entries()) {
            if (key.startsWith("redis_")) {
                const serviceName = key.replace("redis_", "");
                stats.redis[serviceName] = {
                    status: client.status,
                    options: client.options,
                };
            }
        }

        // Query and error metrics
        stats.queries = Object.fromEntries(this.metrics.queries);
        stats.errors = Object.fromEntries(this.metrics.errors);

        return stats;
    }

    /**
     * Close all connections gracefully
     */
    async closeAll() {
        const closePromises = [];

        // Close PostgreSQL pools
        for (const [key, pool] of this.pools.entries()) {
            closePromises.push(pool.end());
        }

        // Close MongoDB clients
        for (const [key, client] of this.clients.entries()) {
            if (key.startsWith("mongodb_")) {
                closePromises.push(client.close());
            }
        }

        // Close Redis clients
        for (const [key, client] of this.clients.entries()) {
            if (key.startsWith("redis_")) {
                closePromises.push(client.quit());
            }
        }

        try {
            await Promise.all(closePromises);
            console.log("All database connections closed gracefully");
        } catch (error) {
            console.error("Error closing database connections:", error);
            throw error;
        }
    }

    /**
     * Record query metrics
     */
    recordQuery(dbType, duration) {
        if (!this.metrics.queries.has(dbType)) {
            this.metrics.queries.set(dbType, { count: 0, totalTime: 0, avgTime: 0 });
        }

        const metric = this.metrics.queries.get(dbType);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
    }

    /**
     * Record error metrics
     */
    recordError(dbType, error) {
        if (!this.metrics.errors.has(dbType)) {
            this.metrics.errors.set(dbType, { count: 0, lastError: null });
        }

        const metric = this.metrics.errors.get(dbType);
        metric.count++;
        metric.lastError = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Increment connection metrics
     */
    incrementMetric(dbType, metric) {
        if (!this.metrics.connections.has(dbType)) {
            this.metrics.connections.set(dbType, {});
        }

        const dbMetrics = this.metrics.connections.get(dbType);
        dbMetrics[metric] = (dbMetrics[metric] || 0) + 1;
    }
}

module.exports = {
    DatabaseConnectionManager,
    dbManager: new DatabaseConnectionManager(),
};
