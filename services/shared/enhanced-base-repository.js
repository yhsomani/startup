/**
 * Enhanced Base Repository with Connection Pooling
 *
 * Generic database repository with:
 * - Connection pooling via DatabaseConnectionPool
 * - CRUD operations with SQL injection protection
 * - Query building and optimization
 * - Pagination support
 * - Intelligent caching
 * - Transaction support
 * - Comprehensive error handling
 * - Performance monitoring
 */

const { createLogger } = require("../../shared/enhanced-logger");
const DatabaseConnectionPool = require("./database-connection-pool");
const { v4: uuidv4 } = require("uuid");

class EnhancedBaseRepository {
    constructor(tableName, serviceName = "unknown-service", options = {}) {
        this.tableName = tableName;
        this.serviceName = serviceName;
        this.logger = createLogger(`BaseRepository-${serviceName}-${tableName}`);

        // Performance settings
        this.slowQueryThreshold =
            options.slowQueryThreshold || parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000;
        this.defaultLimit = options.defaultLimit || parseInt(process.env.DEFAULT_QUERY_LIMIT) || 50;
        this.defaultOffset = 0;

        // Query cache (in-memory for frequently accessed data)
        this.queryCache = new Map();
        this.cacheTimeout =
            options.cacheTimeout || parseInt(process.env.QUERY_CACHE_TIMEOUT) || 5 * 60 * 1000;
        this.cacheEnabled = options.cacheEnabled !== false;

        // Metrics
        this.queryCount = 0;
        this.slowQueries = 0;
        this.cacheHits = 0;
        this.cacheMisses = 0;

        // Initialize connection pool
        this.dbPool = new DatabaseConnectionPool(serviceName);
        this.isInitialized = false;
    }

    /**
     * Initialize the repository
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            await this.dbPool.initialize();
            this.isInitialized = true;
            this.logger.info("Repository initialized", {
                tableName: this.tableName,
                serviceName: this.serviceName,
                cacheEnabled: this.cacheEnabled,
            });
        } catch (error) {
            this.logger.error("Failed to initialize repository", {
                tableName: this.tableName,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Ensure repository is initialized before operations
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    /**
     * Get database client from pool
     */
    async getClient(options = {}) {
        await this.ensureInitialized();

        if (options.transaction) {
            return options.transaction;
        }

        return this.dbPool.getClient();
    }

    /**
     * Execute a query with performance monitoring
     */
    async executeQuery(query, params = [], options = {}) {
        const startTime = Date.now();
        const queryId = uuidv4();

        try {
            const client = await this.getClient(options);

            this.logger.debug("Executing query", {
                queryId,
                query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
                params: params.length > 0 ? "[REDACTED]" : "[]",
                tableName: this.tableName,
            });

            let result;
            if (options.transaction) {
                result = await options.transaction.query(query, params);
            } else {
                const dbClient = await client;
                result = await dbClient.query(query, params);
                dbClient.release();
            }

            const queryTime = Date.now() - startTime;
            this.queryCount++;

            // Track slow queries
            if (queryTime > this.slowQueryThreshold) {
                this.slowQueries++;
                this.logger.warn("Slow query detected", {
                    queryId,
                    queryTime,
                    threshold: this.slowQueryThreshold,
                    query: query.substring(0, 500),
                    tableName: this.tableName,
                });
            }

            this.logger.debug("Query executed successfully", {
                queryId,
                queryTime,
                rowCount: result.rowCount,
                tableName: this.tableName,
            });

            return result;
        } catch (error) {
            const queryTime = Date.now() - startTime;
            this.logger.error("Query execution failed", {
                queryId,
                queryTime,
                error: error.message,
                query: query.substring(0, 500),
                tableName: this.tableName,
            });
            throw error;
        }
    }

    /**
     * Generate cache key for queries
     */
    getCacheKey(method, params = {}) {
        const key = `${this.tableName}:${method}:${JSON.stringify(params)}`;
        return Buffer.from(key).toString("base64");
    }

    /**
     * Get cached query result
     */
    getCachedResult(cacheKey) {
        if (!this.cacheEnabled) {
            return null;
        }

        const cached = this.queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            this.cacheHits++;
            this.logger.debug("Cache hit", { cacheKey, tableName: this.tableName });
            return cached.result;
        }

        if (cached) {
            this.queryCache.delete(cacheKey);
        }

        this.cacheMisses++;
        return null;
    }

    /**
     * Cache query result
     */
    setCachedResult(cacheKey, result) {
        if (!this.cacheEnabled) {
            return;
        }

        this.queryCache.set(cacheKey, {
            result,
            timestamp: Date.now(),
        });

        // Cleanup old cache entries
        if (this.queryCache.size > 1000) {
            const oldestKey = this.queryCache.keys().next().value;
            this.queryCache.delete(oldestKey);
        }
    }

    /**
     * Create a new record with enhanced security
     */
    async create(data, options = {}) {
        await this.ensureInitialized();

        // Validate input
        if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
            throw new Error("Invalid data: must provide a non-empty object");
        }

        const startTime = Date.now();
        const cacheKey = this.getCacheKey("create", { data: Object.keys(data) });

        try {
            // Remove potentially harmful keys
            const sanitizedData = { ...data };
            delete sanitizedData.id; // Let database handle auto-increment
            delete sanitizedData.created_at; // Let database handle timestamps

            // Build INSERT query with parameterized values
            const columns = Object.keys(sanitizedData);
            const values = Object.values(sanitizedData);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

            const query = `
                INSERT INTO ${this.tableName} (${columns.join(", ")})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await this.executeQuery(query, values, options);

            // Invalidate relevant cache entries
            this.invalidateCache();

            this.logger.info("Record created", {
                tableName: this.tableName,
                recordId: result.rows[0]?.id,
                queryTime: Date.now() - startTime,
            });

            return result.rows[0];
        } catch (error) {
            this.logger.error("Failed to create record", {
                tableName: this.tableName,
                error: error.message,
                queryTime: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Find records with advanced filtering and pagination
     */
    async find(filters = {}, options = {}) {
        await this.ensureInitialized();

        const {
            limit = this.defaultLimit,
            offset = this.defaultOffset,
            orderBy = "created_at",
            orderDirection = "DESC",
            fields = "*",
            includeDeleted = false,
        } = options;

        const cacheKey = this.getCacheKey("find", { filters, options });

        // Try cache first
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
            return cached;
        }

        const startTime = Date.now();

        try {
            let query = `SELECT ${fields} FROM ${this.tableName}`;
            const params = [];
            let paramIndex = 1;

            // Build WHERE clause
            const whereConditions = [];

            if (Object.keys(filters).length > 0) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        if (Array.isArray(value)) {
                            whereConditions.push(`${key} = ANY($${paramIndex})`);
                            params.push(value);
                        } else if (typeof value === "object" && value.operation) {
                            // Support for complex operations
                            whereConditions.push(`${key} ${value.operation} $${paramIndex}`);
                            params.push(value.value);
                        } else {
                            whereConditions.push(`${key} = $${paramIndex}`);
                            params.push(value);
                        }
                        paramIndex++;
                    }
                });
            }

            // Add soft delete filter
            if (!includeDeleted && this.hasSoftDelete()) {
                whereConditions.push(`deleted_at IS NULL`);
            }

            if (whereConditions.length > 0) {
                query += ` WHERE ${whereConditions.join(" AND ")}`;
            }

            // Add ORDER BY
            if (orderBy) {
                query += ` ORDER BY ${orderBy} ${orderDirection}`;
            }

            // Add LIMIT and OFFSET
            if (limit) {
                query += ` LIMIT $${paramIndex}`;
                params.push(limit);
                paramIndex++;
            }

            if (offset) {
                query += ` OFFSET $${paramIndex}`;
                params.push(offset);
            }

            const result = await this.executeQuery(query, params, options);
            const response = {
                data: result.rows,
                pagination: {
                    limit,
                    offset,
                    total: result.rowCount,
                    hasMore: result.rowCount === limit,
                },
            };

            // Cache the result
            this.setCachedResult(cacheKey, response);

            this.logger.debug("Records found", {
                tableName: this.tableName,
                count: result.rows.length,
                queryTime: Date.now() - startTime,
            });

            return response;
        } catch (error) {
            this.logger.error("Failed to find records", {
                tableName: this.tableName,
                filters,
                error: error.message,
                queryTime: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Find a single record by ID
     */
    async findById(id, options = {}) {
        await this.ensureInitialized();

        if (!id) {
            throw new Error("ID is required");
        }

        const cacheKey = this.getCacheKey("findById", { id, ...options });
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
            return cached;
        }

        const startTime = Date.now();

        try {
            const query = `
                SELECT ${options.fields || "*"} 
                FROM ${this.tableName} 
                WHERE id = $1 ${!options.includeDeleted && this.hasSoftDelete() ? "AND deleted_at IS NULL" : ""}
            `;

            const result = await this.executeQuery(query, [id], options);

            if (result.rows.length === 0) {
                return null;
            }

            const record = result.rows[0];
            this.setCachedResult(cacheKey, record);

            this.logger.debug("Record found by ID", {
                tableName: this.tableName,
                id,
                queryTime: Date.now() - startTime,
            });

            return record;
        } catch (error) {
            this.logger.error("Failed to find record by ID", {
                tableName: this.tableName,
                id,
                error: error.message,
                queryTime: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Update a record by ID
     */
    async update(id, data, options = {}) {
        await this.ensureInitialized();

        if (!id) {
            throw new Error("ID is required");
        }

        if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
            throw new Error("Invalid data: must provide a non-empty object");
        }

        const startTime = Date.now();

        try {
            // Remove protected keys
            const sanitizedData = { ...data };
            delete sanitizedData.id;
            delete sanitizedData.created_at;
            delete sanitizedData.updated_at; // Let database handle

            if (Object.keys(sanitizedData).length === 0) {
                throw new Error("No valid fields to update");
            }

            // Build UPDATE query
            const updates = [];
            const params = [id];
            let paramIndex = 2;

            Object.entries(sanitizedData).forEach(([key, value]) => {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            });

            // Add updated_at timestamp
            updates.push(`updated_at = CURRENT_TIMESTAMP`);

            const query = `
                UPDATE ${this.tableName} 
                SET ${updates.join(", ")}
                WHERE id = $1
                RETURNING *
            `;

            const result = await this.executeQuery(query, params, options);

            if (result.rows.length === 0) {
                return null;
            }

            // Invalidate cache
            this.invalidateCache();

            this.logger.info("Record updated", {
                tableName: this.tableName,
                id,
                fields: Object.keys(sanitizedData),
                queryTime: Date.now() - startTime,
            });

            return result.rows[0];
        } catch (error) {
            this.logger.error("Failed to update record", {
                tableName: this.tableName,
                id,
                error: error.message,
                queryTime: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Soft delete a record
     */
    async softDelete(id, options = {}) {
        if (!this.hasSoftDelete()) {
            throw new Error("Table does not support soft delete");
        }

        await this.ensureInitialized();

        const startTime = Date.now();

        try {
            const query = `
                UPDATE ${this.tableName} 
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND deleted_at IS NULL
                RETURNING *
            `;

            const result = await this.executeQuery(query, [id], options);

            // Invalidate cache
            this.invalidateCache();

            this.logger.info("Record soft deleted", {
                tableName: this.tableName,
                id,
                queryTime: Date.now() - startTime,
            });

            return result.rows[0];
        } catch (error) {
            this.logger.error("Failed to soft delete record", {
                tableName: this.tableName,
                id,
                error: error.message,
                queryTime: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Hard delete a record
     */
    async delete(id, options = {}) {
        await this.ensureInitialized();

        if (!id) {
            throw new Error("ID is required");
        }

        const startTime = Date.now();

        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
            const result = await this.executeQuery(query, [id], options);

            // Invalidate cache
            this.invalidateCache();

            this.logger.info("Record deleted", {
                tableName: this.tableName,
                id,
                queryTime: Date.now() - startTime,
            });

            return result.rows[0];
        } catch (error) {
            this.logger.error("Failed to delete record", {
                tableName: this.tableName,
                id,
                error: error.message,
                queryTime: Date.now() - startTime,
            });
            throw error;
        }
    }

    /**
     * Execute a transaction
     */
    async transaction(callback) {
        await this.ensureInitialized();

        const client = await this.dbPool.getClient();

        try {
            await client.query("BEGIN");

            const result = await callback({
                query: (sql, params) => client.query(sql, params),
                executeQuery: (query, params) =>
                    this.executeQuery(query, params, { transaction: client }),
            });

            await client.query("COMMIT");

            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Check if table supports soft delete
     */
    hasSoftDelete() {
        // This could be made dynamic by checking table schema
        return process.env[`${this.tableName.toUpperCase()}_SOFT_DELETE`] !== "false";
    }

    /**
     * Invalidate cache for this table
     */
    invalidateCache() {
        const keysToDelete = [];

        for (const [key, value] of this.queryCache.entries()) {
            if (key.startsWith(Buffer.from(`${this.tableName}:`).toString("base64"))) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.queryCache.delete(key));

        this.logger.debug("Cache invalidated", {
            tableName: this.tableName,
            keysDeleted: keysToDelete.length,
        });
    }

    /**
     * Get repository metrics
     */
    getMetrics() {
        return {
            tableName: this.tableName,
            serviceName: this.serviceName,
            queryCount: this.queryCount,
            slowQueries: this.slowQueries,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            cacheSize: this.queryCache.size,
            cacheEnabled: this.cacheEnabled,
            isInitialized: this.isInitialized,
            databaseMetrics: this.dbPool.getMetrics(),
        };
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info("Shutting down repository...", {
            tableName: this.tableName,
        });

        if (this.dbPool) {
            await this.dbPool.shutdown();
        }

        this.queryCache.clear();
        this.logger.info("Repository shutdown completed");
    }
}

module.exports = EnhancedBaseRepository;
