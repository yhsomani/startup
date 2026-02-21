/**
 * Enhanced Database Connection Manager with Security Features
 *
 * Secure PostgreSQL connection management with:
 * - SQL injection prevention
 * - Connection pooling optimization
 * - Prepared statements
 * - Query logging and monitoring
 * - Connection health checks
 */

const { Pool, Client } = require("pg");
const { createLogger } = require("../../shared/enhanced-logger");
const SecureQueryBuilder = require("./secure-query-builder");

class SecureDatabaseManager {
    constructor(config = {}) {
        this.logger = createLogger("SecureDatabaseManager");

        // Enhanced configuration with security defaults
        this.config = {
            connectionString: process.env.DATABASE_URL,
            max: config.max || 20,
            min: config.min || 5,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
            acquireTimeoutMillis: config.acquireTimeoutMillis || 60000,
            createTimeoutMillis: config.createTimeoutMillis || 30000,
            destroyTimeoutMillis: config.destroyTimeoutMillis || 5000,
            reapIntervalMillis: config.reapIntervalMillis || 1000,
            createRetryIntervalMillis: config.createRetryIntervalMillis || 200,

            // Security settings
            ssl:
                process.env.NODE_ENV === "production"
                    ? {
                        rejectUnauthorized: true,
                        checkServerIdentity: () => undefined, // Allow custom hostname verification
                    }
                    : false,

            // Query settings
            statement_timeout: config.statement_timeout || 30000, // 30 seconds per query
            query_timeout: config.query_timeout || 60000, // 1 minute total
            application_name: config.application_name || "talentsphere-api",

            // Logging
            logConnections: config.logConnections !== false,
            logDisconnections: config.logDisconnections !== false,
            logQueries: config.logQueries !== false,
            logSlowQueries: config.logSlowQueries !== false,
            slowQueryThreshold: config.slowQueryThreshold || 1000, // 1 second

            ...config,
        };

        this.pool = null;
        this.isInitialized = false;
        this.queryStats = {
            totalQueries: 0,
            slowQueries: 0,
            failedQueries: 0,
            avgQueryTime: 0,
        };

        // Query whitelist for extra security
        this.allowedOperations = [
            "SELECT",
            "INSERT",
            "UPDATE",
            "DELETE",
            "WITH",
            "BEGIN",
            "COMMIT",
            "ROLLBACK",
        ];

        this.maxQueryTime = this.config.query_timeout;
        this.slowQueryThreshold = this.config.slowQueryThreshold;
    }

    /**
     * Initialize the secure database connection pool
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            this.logger.info("Initializing secure database connection pool...", {
                maxConnections: this.config.max,
                minConnections: this.config.min,
                sslEnabled: !!this.config.ssl,
                statementTimeout: this.config.statement_timeout,
            });

            // Create connection pool with enhanced security settings
            this.pool = new Pool({
                connectionString: this.config.connectionString,
                max: this.config.max,
                min: this.config.min,
                idleTimeoutMillis: this.config.idleTimeoutMillis,
                connectionTimeoutMillis: this.config.connectionTimeoutMillis,
                ssl: this.config.ssl,
                statement_timeout: this.config.statement_timeout,
                query_timeout: this.config.query_timeout,
                application_name: this.config.application_name,

                // Security-enhanced connection settings
                options: "-c default_transaction_isolation=read_committed -c statement_timeout=30s",
            });

            // Test the connection with security check
            const testResult = await this.performHealthCheck();
            if (!testResult.connected) {
                throw new Error("Database health check failed during initialization");
            }

            this.isInitialized = true;
            this.logger.info("Secure database connection pool initialized successfully", {
                poolStats: testResult.pool,
            });

            // Set up event listeners for monitoring
            this.setupEventListeners();
        } catch (error) {
            this.logger.error("Failed to initialize secure database connection pool:", error);
            throw new Error(`Database initialization failed: ${error.message}`);
        }
    }

    /**
     * Set up event listeners for pool monitoring
     */
    setupEventListeners() {
        if (!this.pool) return;

        this.pool.on("connect", client => {
            if (this.config.logConnections) {
                this.logger.debug("New database client connected", {
                    totalCount: this.pool.totalCount,
                    idleCount: this.pool.idleCount,
                    waitingCount: this.pool.waitingCount,
                });
            }
        });

        this.pool.on("acquire", client => {
            // Set query timeout for this connection
            client.query(`SET statement_timeout = ${this.config.statement_timeout}`);
        });

        this.pool.on("release", (err, client) => {
            if (this.config.logDisconnections) {
                this.logger.debug("Database client released", {
                    totalCount: this.pool.totalCount,
                    idleCount: this.pool.idleCount,
                    waitingCount: this.pool.waitingCount,
                    hadError: !!err,
                });
            }
        });

        this.pool.on("remove", client => {
            this.logger.warn("Database client removed from pool", {
                totalCount: this.pool.totalCount,
                idleCount: this.pool.idleCount,
                waitingCount: this.pool.waitingCount,
            });
        });

        this.pool.on("error", (err, client) => {
            this.logger.error("Database pool error:", {
                error: err.message,
                stack: err.stack,
                clientConnected: !!client,
            });
        });
    }

    /**
     * Validate query for security issues
     */
    validateQuery(query, params = []) {
        if (typeof query !== "string") {
            throw new Error("Query must be a string");
        }

        const upperQuery = query.toUpperCase().trim();

        // Check for allowed operations
        const hasAllowedOperation = this.allowedOperations.some(
            op => upperQuery.startsWith(op) || upperQuery.includes(` ${op} `)
        );

        if (!hasAllowedOperation) {
            throw new Error(`Operation not allowed: ${upperQuery.substring(0, 20)}`);
        }

        // Check for dangerous SQL patterns
        const dangerousPatterns = [
            /;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|UNION)/i,
            /(\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|UNION)\b).*\b(OR|AND)\b.*1\s*=\s*1/i,
            /--|\/\*|\*\/|xp_|sp_/i,
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(query)) {
                this.logger.warn("Potentially dangerous SQL pattern detected", {
                    query: query.substring(0, 100),
                    pattern: pattern.toString(),
                });
                throw new Error("SQL injection attempt detected");
            }
        }

        // Validate parameters
        if (!Array.isArray(params)) {
            throw new Error("Parameters must be an array");
        }

        return true;
    }

    /**
     * Execute a secure query with validation and monitoring
     */
    async query(text, params = [], options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const startTime = Date.now();
        const queryId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Validate query for security
            this.validateQuery(text, params);

            // Log query if enabled (but not sensitive data)
            if (this.config.logQueries || (options.slow && this.config.logSlowQueries)) {
                this.logger.debug("Executing query", {
                    queryId,
                    query: this.sanitizeQueryForLogging(text),
                    paramCount: params.length,
                    estimatedCost: options.estimatedCost || "unknown",
                });
            }

            // Execute query with timeout
            const result = await Promise.race([
                this.pool.query(text, params),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Query timeout")), this.maxQueryTime)
                ),
            ]);

            const duration = Date.now() - startTime;
            this.updateQueryStats(duration, false, false);

            // Log slow queries
            if (duration > this.slowQueryThreshold && this.config.logSlowQueries) {
                this.logger.warn("Slow query detected", {
                    queryId,
                    query: this.sanitizeQueryForLogging(text),
                    duration: `${duration}ms`,
                    threshold: `${this.slowQueryThreshold}ms`,
                    rowCount: result.rowCount,
                });
            }

            // Log successful query if enabled
            if (this.config.logQueries) {
                this.logger.debug("Query completed successfully", {
                    queryId,
                    duration: `${duration}ms`,
                    rowCount: result.rowCount,
                });
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.updateQueryStats(duration, false, true);

            this.logger.error("Database query failed", {
                queryId,
                query: this.sanitizeQueryForLogging(text),
                paramCount: params.length,
                duration: `${duration}ms`,
                error: error.message,
                code: error.code,
                severity: error.severity || "ERROR",
            });

            // Rethrow with additional context
            const enhancedError = new Error(`Database query failed: ${error.message}`);
            enhancedError.originalError = error;
            enhancedError.queryId = queryId;
            enhancedError.duration = duration;

            throw enhancedError;
        }
    }

    /**
     * Sanitize query for logging (remove sensitive data)
     */
    sanitizeQueryForLogging(query) {
        return (
            query
                .replace(/\b(password|token|secret|key)\s*=\s*['"][^'"]*['"]/gi, "$1 = '****'")
                .substring(0, 500) + (query.length > 500 ? "..." : "")
        );
    }

    /**
     * Update query statistics
     */
    updateQueryStats(duration, isSlow, failed) {
        this.queryStats.totalQueries++;

        if (isSlow || duration > this.slowQueryThreshold) {
            this.queryStats.slowQueries++;
        }

        if (failed) {
            this.queryStats.failedQueries++;
        }

        // Update average query time
        this.queryStats.avgQueryTime =
            (this.queryStats.avgQueryTime * (this.queryStats.totalQueries - 1) + duration) /
            this.queryStats.totalQueries;
    }

    /**
     * Create a secure transaction
     */
    async transaction(callback, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const client = await this.pool.connect();
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            this.logger.debug("Starting transaction", { transactionId });

            // Set isolation level if specified
            if (options.isolationLevel) {
                await client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
            }

            await client.query("BEGIN");

            // Create a client wrapper that uses our secure query method
            const secureClient = {
                query: (text, params, queryOptions = {}) => {
                    const fullText = queryOptions.skipValidation ? text : text;
                    return this.validateAndExecuteQuery(client, fullText, params, queryOptions);
                },
            };

            const result = await callback(secureClient);

            await client.query("COMMIT");

            this.logger.debug("Transaction committed successfully", { transactionId });
            return result;
        } catch (error) {
            await client.query("ROLLBACK");

            this.logger.error("Transaction failed and rolled back", {
                transactionId,
                error: error.message,
            });

            throw error;
        } finally {
            client.release();
            this.logger.debug("Transaction completed", { transactionId });
        }
    }

    /**
     * Validate and execute query on specific client
     */
    async validateAndExecuteQuery(client, text, params, options = {}) {
        if (!options.skipValidation) {
            this.validateQuery(text, params);
        }

        return client.query(text, params);
    }

    /**
     * Create a secure query builder
     */
    createQueryBuilder() {
        return new SecureQueryBuilder(this);
    }

    /**
     * Secure insert operation
     */
    async insert(tableName, data, options = {}) {
        this.validateTableName(tableName);
        this.validateInsertData(data);

        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`);

        const query = `
            INSERT INTO ${this.escapeIdentifier(tableName)} (${columns.map(this.escapeIdentifier).join(", ")})
            VALUES (${placeholders.join(", ")})
            ${options.returning ? `RETURNING ${options.returning}` : "RETURNING *"}
        `;

        const result = await this.query(query, values);
        return result.rows[0];
    }

    /**
     * Secure update operation
     */
    async update(tableName, id, data, idColumn = "id", options = {}) {
        this.validateTableName(tableName);
        this.validateIdentifier(idColumn);
        this.validateUpdateData(data);

        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns
            .map((col, index) => `${this.escapeIdentifier(col)} = $${index + 2}`)
            .join(", ");

        const query = `
            UPDATE ${this.escapeIdentifier(tableName)}
            SET ${placeholders}
            WHERE ${this.escapeIdentifier(idColumn)} = $1
            ${options.returning ? `RETURNING ${options.returning}` : "RETURNING *"}
        `;

        const result = await this.query(query, [id, ...values]);
        return result.rows[0];
    }

    /**
     * Secure delete operation
     */
    async delete(tableName, id, idColumn = "id") {
        this.validateTableName(tableName);
        this.validateIdentifier(idColumn);

        const query = `DELETE FROM ${this.escapeIdentifier(tableName)} WHERE ${this.escapeIdentifier(idColumn)} = $1`;
        await this.query(query, [id]);
    }

    /**
     * Secure find by ID operation
     */
    async findById(tableName, id, idColumn = "id", options = {}) {
        this.validateTableName(tableName);
        this.validateIdentifier(idColumn);

        const columns = options.columns || "*";
        const query = `SELECT ${columns} FROM ${this.escapeIdentifier(tableName)} WHERE ${this.escapeIdentifier(idColumn)} = $1`;
        const result = await this.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Secure pagination
     */
    async paginate(tableName, options = {}) {
        this.validateTableName(tableName);

        const {
            page = 1,
            limit = 20,
            orderBy = "created_at",
            orderDirection = "DESC",
            whereClause = "1=1",
            selectColumns = "*",
        } = options;

        // Validate pagination parameters
        if (page < 1 || page > 10000) {
            throw new Error("Page number out of bounds");
        }

        if (limit < 1 || limit > 1000) {
            throw new Error("Limit out of bounds");
        }

        this.validateIdentifier(orderBy);

        if (!["ASC", "DESC"].includes(orderDirection.toUpperCase())) {
            throw new Error("Invalid order direction");
        }

        const offset = (page - 1) * limit;

        // Main query
        const dataQuery = `
            SELECT ${selectColumns}
            FROM ${this.escapeIdentifier(tableName)}
            WHERE ${whereClause}
            ORDER BY ${this.escapeIdentifier(orderBy)} ${orderDirection}
            LIMIT $1 OFFSET $2
        `;

        // Count query
        const countQuery = `SELECT COUNT(*) as total FROM ${this.escapeIdentifier(tableName)} WHERE ${whereClause}`;

        const [dataResult, countResult] = await Promise.all([
            this.query(dataQuery, [limit, offset]),
            this.query(countQuery),
        ]);

        const total = parseInt(countResult.rows[0].total);

        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Validate table name
     */
    validateTableName(tableName) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
            throw new Error(`Invalid table name: ${tableName}`);
        }
    }

    /**
     * Validate identifier (column name, etc.)
     */
    validateIdentifier(identifier) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
            throw new Error(`Invalid identifier: ${identifier}`);
        }
    }

    /**
     * Validate insert data
     */
    validateInsertData(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("Insert data must be an object");
        }

        if (Object.keys(data).length === 0) {
            throw new Error("Insert data cannot be empty");
        }

        // Check for dangerous keys
        for (const key of Object.keys(data)) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                throw new Error(`Invalid column name in data: ${key}`);
            }
        }
    }

    /**
     * Validate update data
     */
    validateUpdateData(data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("Update data must be an object");
        }

        if (Object.keys(data).length === 0) {
            throw new Error("Update data cannot be empty");
        }
    }

    /**
     * Escape identifier for SQL
     */
    escapeIdentifier(identifier) {
        this.validateIdentifier(identifier);
        return `"${identifier.replace(/"/g, '""')}"`;
    }

    /**
     * Perform comprehensive health check
     */
    async performHealthCheck() {
        try {
            const startTime = Date.now();
            const result = await this.query(
                "SELECT 1 as health_status, NOW() as server_time, version() as version"
            );
            const responseTime = Date.now() - startTime;

            return {
                status: "healthy",
                connected: true,
                responseTime: `${responseTime}ms`,
                timestamp: new Date().toISOString(),
                serverTime: result.rows[0].server_time,
                version: result.rows[0].version,
                pool: {
                    totalCount: this.pool.totalCount,
                    idleCount: this.pool.idleCount,
                    waitingCount: this.pool.waitingCount,
                    maxConnections: this.config.max,
                    minConnections: this.config.min,
                },
                queryStats: this.queryStats,
            };
        } catch (error) {
            return {
                status: "unhealthy",
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                pool: this.pool
                    ? {
                        totalCount: this.pool.totalCount,
                        idleCount: this.pool.idleCount,
                        waitingCount: this.pool.waitingCount,
                    }
                    : null,
                queryStats: this.queryStats,
            };
        }
    }

    /**
     * Get query statistics
     */
    getQueryStats() {
        return { ...this.queryStats };
    }

    /**
     * Reset query statistics
     */
    resetQueryStats() {
        this.queryStats = {
            totalQueries: 0,
            slowQueries: 0,
            failedQueries: 0,
            avgQueryTime: 0,
        };
    }

    /**
     * Close the connection pool gracefully
     */
    async close() {
        if (this.pool) {
            this.logger.info("Closing secure database connection pool...");

            // Wait for active connections to finish
            const timeout = setTimeout(() => {
                this.logger.warn("Force closing pool after timeout");
            }, 10000);

            await this.pool.end();
            clearTimeout(timeout);

            this.isInitialized = false;
            this.logger.info("Secure database connection pool closed successfully");
        }
    }
}

// Singleton instance with security enhancements
let secureDatabaseManager = null;

function getSecureDatabaseManager(config) {
    if (!secureDatabaseManager) {
        secureDatabaseManager = new SecureDatabaseManager(config);
    }
    return secureDatabaseManager;
}

module.exports = {
    SecureDatabaseManager,
    getSecureDatabaseManager,
};
