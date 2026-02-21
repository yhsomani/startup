/**
 * Secure Base Repository Class
 *
 * Fixed version with SQL injection protection and proper parameterization
 */

const { createLogger } = require("../../../services/shared/logger");

class SecureBaseRepository {
    constructor(tableName, serviceName = "unknown-service") {
        // Whitelist of allowed table names to prevent SQL injection
        this.ALLOWED_TABLES = new Set([
            "users",
            "user_profiles",
            "job_listings",
            "applications",
            "companies",
            "skills",
            "user_skills",
            "experiences",
            "education",
            "certifications",
            "notifications",
            "files",
            "saved_jobs",
            "job_views",
            "search_history",
        ]);

        this.ALLOWED_COLUMNS = new Set([
            "id",
            "email",
            "password_hash",
            "first_name",
            "last_name",
            "phone",
            "date_of_birth",
            "is_active",
            "is_verified",
            "is_premium",
            "created_at",
            "updated_at",
            "title",
            "bio",
            "location",
            "avatar_url",
            "website",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "experience_level",
            "job_title",
            "industry",
            "preferred_locations",
            "remote_work",
            "salary_expectation_min",
            "salary_expectation_max",
            "salary_currency",
            "availability",
            "relocation",
            "skills",
            "education",
            "experience",
            "settings",
            "user_id",
            "job_id",
            "company_id",
            "application_date",
            "status",
            "name",
            "description",
            "logo_url",
            "website_url",
            "size",
            "founded_year",
            "headquarters",
            "category",
            "founded_year",
        ]);

        this.tableName = this.validateTableName(tableName);
        this.serviceName = serviceName;
        this.logger = createLogger(`SecureBaseRepository-${serviceName}-${this.tableName}`);
        this.queryCount = 0;
        this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000; // 1 second
        this.cache = new Map();
        this.cacheTimeout = parseInt(process.env.QUERY_CACHE_TIMEOUT) || 5 * 60 * 1000; // 5 minutes
        this.defaultLimit = parseInt(process.env.DEFAULT_QUERY_LIMIT) || 50;
        this.defaultOffset = 0;
    }

    /**
     * Validate table name against whitelist
     */
    validateTableName(tableName) {
        if (!this.ALLOWED_TABLES.has(tableName)) {
            this.logger.error("Invalid table name attempted", {
                tableName,
                allowedTables: Array.from(this.ALLOWED_TABLES),
            });
            throw new Error(`Invalid table name: ${tableName}`);
        }
        return tableName;
    }

    /**
     * Validate column name against whitelist
     */
    validateColumnName(columnName) {
        if (!this.ALLOWED_COLUMNS.has(columnName)) {
            this.logger.error("Invalid column name attempted", {
                columnName,
                allowedColumns: Array.from(this.ALLOWED_COLUMNS),
            });
            throw new Error(`Invalid column name: ${columnName}`);
        }
        return columnName;
    }

    /**
     * Sanitize string values to prevent injection
     */
    sanitizeString(value) {
        if (typeof value !== "string") {
            return value;
        }

        // Remove any potentially dangerous characters
        return value
            .replace(/['"\\;]/g, "")
            .replace(/--/g, "")
            .replace(/\/\*/g, "")
            .trim();
    }

    /**
     * Create a new record with parameterized queries
     */
    async create(data, options = {}) {
        const startTime = Date.now();

        try {
            const client = await this.getClient(options);

            try {
                // Validate and sanitize all data keys and values
                const sanitizedData = {};
                for (const [key, value] of Object.entries(data)) {
                    this.validateColumnName(key);
                    sanitizedData[key] =
                        typeof value === "string" ? this.sanitizeString(value) : value;
                }

                const columns = Object.keys(sanitizedData);
                const values = Object.values(sanitizedData);
                const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

                const query = `
          INSERT INTO ${this.tableName} (${columns.join(", ")})
          VALUES (${placeholders})
          RETURNING *
        `;

                const result = await client.query(query, values);
                const record = result.rows[0];

                this.queryCount++;
                const queryTime = Date.now() - startTime;

                if (queryTime > this.slowQueryThreshold) {
                    this.logger.warn("Slow create query detected", {
                        table: this.tableName,
                        queryTime,
                        query: query.substring(0, 200) + "...",
                        data: JSON.stringify(sanitizedData),
                    });
                }

                this.invalidateCache();

                this.logger.info("Record created successfully", {
                    table: this.tableName,
                    recordId: record.id,
                    queryTime,
                });

                return record;
            } finally {
                client.release();
            }
        } catch (error) {
            this.logger.error("Failed to create record", {
                table: this.tableName,
                error: error.message,
                stack: error.stack,
                data,
            });
            throw new DatabaseError("CREATE_FAILED", error.message, error);
        }
    }

    /**
     * Find records by criteria with secure WHERE clause building
     */
    async find(where = {}, options = {}) {
        const startTime = Date.now();

        try {
            const {
                limit = this.defaultLimit,
                offset = this.defaultOffset,
                orderBy = "id",
                order = "ASC",
                useCache = false,
            } = options;

            // Check cache first
            const cacheKey = this.generateCacheKey(where, options);
            if (useCache && this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                    this.logger.debug("Returning cached result", { cacheKey });
                    return cached.data;
                }
            }

            const client = await this.getClient(options);

            try {
                const { whereClause, queryParams } = this.buildSecureWhereClause(where);
                const orderByClause = this.buildSecureOrderByClause(orderBy, order);
                const limitClause = limit ? `LIMIT ${limit}` : "";
                const offsetClause = offset ? `OFFSET ${offset}` : "";

                const query = `
          SELECT * FROM ${this.tableName}
          WHERE ${whereClause}
          ${orderByClause}
          ${limitClause}
          ${offsetClause}
        `;

                const result = await client.query(query, queryParams);
                const records = result.rows;

                this.queryCount++;
                const queryTime = Date.now() - startTime;

                if (queryTime > this.slowQueryThreshold) {
                    this.logger.warn("Slow find query detected", {
                        table: this.tableName,
                        where,
                        options,
                        queryTime,
                        query: query.substring(0, 200) + "...",
                        resultCount: records.length,
                    });
                }

                // Cache result if caching is enabled
                if (useCache) {
                    this.cache.set(cacheKey, {
                        data: records,
                        timestamp: Date.now(),
                    });
                }

                this.logger.debug("Records found successfully", {
                    table: this.tableName,
                    resultCount: records.length,
                    queryTime,
                });

                return records;
            } finally {
                client.release();
            }
        } catch (error) {
            this.logger.error("Failed to find records", {
                table: this.tableName,
                where,
                options,
                error: error.message,
                stack: error.stack,
            });
            throw new DatabaseError("FIND_FAILED", error.message, error);
        }
    }

    /**
     * Build secure WHERE clause with parameterization
     */
    buildSecureWhereClause(where) {
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(where)) {
            this.validateColumnName(key);

            if (value === null || value === undefined) {
                conditions.push(`${key} IS NULL`);
            } else if (typeof value === "object" && value.$regex) {
                // Handle regex queries safely
                const regexPattern = value.$regex;
                if (typeof regexPattern === "string" && !this.isValidRegex(regexPattern)) {
                    throw new Error("Invalid regex pattern");
                }
                conditions.push(`${key} ~ $${paramIndex}`);
                params.push(regexPattern);
                paramIndex++;
            } else if (typeof value === "object" && value.$in) {
                if (!Array.isArray(value.$in) || value.$in.length === 0) {
                    throw new Error("IN operator requires non-empty array");
                }
                const placeholders = value.$in.map(() => `$${paramIndex++}`).join(", ");
                conditions.push(`${key} IN (${placeholders})`);
                params.push(...value.$in);
            } else if (typeof value === "object" && value.$ne) {
                conditions.push(`${key} != $${paramIndex}`);
                params.push(value.$ne);
                paramIndex++;
            } else if (typeof value === "object" && value.$gte) {
                conditions.push(`${key} >= $${paramIndex}`);
                params.push(value.$gte);
                paramIndex++;
            } else if (typeof value === "object" && value.$lte) {
                conditions.push(`${key} <= $${paramIndex}`);
                params.push(value.$lte);
                paramIndex++;
            } else if (typeof value === "object" && value.$between) {
                if (!Array.isArray(value.$between) || value.$between.length !== 2) {
                    throw new Error("BETWEEN operator requires array with exactly 2 values");
                }
                conditions.push(`${key} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
                params.push(value.$between[0], value.$between[1]);
                paramIndex += 2;
            } else {
                conditions.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "1=1";

        return {
            whereClause,
            queryParams: params,
        };
    }

    /**
     * Validate regex pattern
     */
    isValidRegex(pattern) {
        try {
            new RegExp(pattern);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Build secure ORDER BY clause
     */
    buildSecureOrderByClause(orderBy, order = "ASC") {
        if (!orderBy) {
            return "";
        }

        this.validateColumnName(orderBy);

        const direction = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
        return `ORDER BY ${orderBy} ${direction}`;
    }

    /**
     * Generate cache key
     */
    generateCacheKey(where, options) {
        const keyData = {
            table: this.tableName,
            where,
            options,
        };
        return Buffer.from(JSON.stringify(keyData)).toString("base64");
    }

    /**
     * Invalidate cache
     */
    invalidateCache() {
        this.cache.clear();
        this.logger.debug("Cache invalidated", { table: this.tableName });
    }

    /**
     * Get database client (to be extended by specific repositories)
     */
    async getClient(options = {}) {
        // This method should be overridden by specific repositories
        throw new Error("getClient method must be implemented by extending class");
    }

    /**
     * Get repository statistics
     */
    getStats() {
        return {
            tableName: this.tableName,
            serviceName: this.serviceName,
            queryCount: this.queryCount,
            slowQueryThreshold: this.slowQueryThreshold,
            cacheSize: this.cache.size,
            cacheTimeout: this.cacheTimeout,
            defaultLimit: this.defaultLimit,
            defaultOffset: this.defaultOffset,
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info("Repository cache cleared", { table: this.tableName });
    }
}

/**
 * Custom Database Error class
 */
class DatabaseError extends Error {
    constructor(type, message, originalError) {
        super(message);
        this.name = "DatabaseError";
        this.type = type;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

module.exports = {
    SecureBaseRepository,
    DatabaseError,
};
