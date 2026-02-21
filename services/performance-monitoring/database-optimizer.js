const { Pool } = require('pg');
const winston = require('winston');

/**
 * Database Query Optimizer
 * Provides query optimization, indexing recommendations, and performance monitoring
 */
class DatabaseQueryOptimizer {
    constructor(options = {}) {
        this.options = {
            connectionString: options.connectionString || process.env.DATABASE_URL,
            maxConnections: options.maxConnections || 20,
            idleTimeoutMillis: options.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: options.connectionTimeoutMillis || 2000,
            enableQueryLogging: options.enableQueryLogging !== false,
            slowQueryThreshold: options.slowQueryThreshold || 1000, // milliseconds
            ...options
        };

        this.pool = new Pool(this.options);
        this.queryStats = new Map();
        this.indexRecommendations = [];

        this.setupConnectionPooling();
        this.setupQueryInterception();
    }

    setupConnectionPooling() {
        // Connection pool event handlers
        this.pool.on('connect', (client) => {
            winston.info('New database connection established');
        });

        this.pool.on('error', (err, client) => {
            winston.error('Unexpected error on idle client', err);
        });

        this.pool.on('acquire', (client) => {
            winston.debug('Connection acquired from pool');
        });

        this.pool.on('remove', (client) => {
            winston.debug('Connection removed from pool');
        });
    }

    setupQueryInterception() {
        // Override query method to add timing and optimization
        const originalQuery = this.pool.query;

        this.pool.query = async (text, params) => {
            const startTime = Date.now();

            try {
                const result = await originalQuery.call(this.pool, text, params);
                const duration = Date.now() - startTime;

                this.recordQueryStats(text, duration, true);
                this.analyzeQueryPerformance(text, duration);

                if (duration > this.options.slowQueryThreshold) {
                    this.handleSlowQuery(text, params, duration);
                }

                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                this.recordQueryStats(text, duration, false);
                throw error;
            }
        };
    }

    recordQueryStats(query, duration, success) {
        // Normalize query for statistics (remove parameters)
        const normalizedQuery = this.normalizeQuery(query);

        if (!this.queryStats.has(normalizedQuery)) {
            this.queryStats.set(normalizedQuery, {
                executions: 0,
                totalDuration: 0,
                avgDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                failures: 0,
                lastExecution: null
            });
        }

        const stats = this.queryStats.get(normalizedQuery);
        stats.executions++;
        stats.totalDuration += duration;
        stats.avgDuration = stats.totalDuration / stats.executions;
        stats.minDuration = Math.min(stats.minDuration, duration);
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        stats.lastExecution = new Date().toISOString();

        if (!success) {
            stats.failures++;
        }
    }

    normalizeQuery(query) {
        // Remove parameter values and normalize whitespace
        return query
            .replace(/\$(\d+)/g, '$1') // Remove parameter placeholders
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .trim()
            .toLowerCase();
    }

    analyzeQueryPerformance(query, duration) {
        // Analyze query patterns and suggest optimizations
        const analysis = {
            query: query.substring(0, 100),
            duration,
            recommendations: []
        };

        // Check for common optimization opportunities
        if (query.toLowerCase().includes('select *')) {
            analysis.recommendations.push('Avoid SELECT * - specify only needed columns');
        }

        if (query.toLowerCase().includes('order by') && !query.toLowerCase().includes('limit')) {
            analysis.recommendations.push('Consider adding LIMIT clause with ORDER BY');
        }

        if (query.toLowerCase().includes('join') && duration > 500) {
            analysis.recommendations.push('Consider indexing join columns');
        }

        // Store recommendations for high-duration queries
        if (duration > 1000 && analysis.recommendations.length > 0) {
            this.indexRecommendations.push(analysis);
        }
    }

    handleSlowQuery(query, params, duration) {
        winston.warn(`Slow query detected (${duration}ms):`, {
            query: query.substring(0, 200),
            params: params ? params.slice(0, 5) : null,
            duration
        });

        // Generate optimization suggestions
        this.generateOptimizationSuggestions(query, duration);
    }

    generateOptimizationSuggestions(query, duration) {
        const suggestions = [];

        // LIKE queries without indexes
        if (query.toLowerCase().includes('like \'%') && !query.toLowerCase().includes('ilike')) {
            suggestions.push('Consider using trigram indexes for LIKE queries');
        }

        // Missing WHERE clauses
        if (!query.toLowerCase().includes('where') && query.toLowerCase().includes('select')) {
            suggestions.push('Add WHERE clauses to limit result sets');
        }

        // Suboptimal JOINs
        if ((query.match(/join/gi) || []).length > 2) {
            suggestions.push('Consider reducing JOIN complexity or using materialized views');
        }

        if (suggestions.length > 0) {
            winston.info('Query optimization suggestions:', suggestions);
        }
    }

    async getQueryPerformanceReport() {
        const slowQueries = [];
        const fastQueries = [];

        this.queryStats.forEach((stats, query) => {
            const queryInfo = {
                query: query.substring(0, 100),
                ...stats
            };

            if (stats.avgDuration > this.options.slowQueryThreshold) {
                slowQueries.push(queryInfo);
            } else {
                fastQueries.push(queryInfo);
            }
        });

        // Sort by average duration
        slowQueries.sort((a, b) => b.avgDuration - a.avgDuration);
        fastQueries.sort((a, b) => b.avgDuration - a.avgDuration);

        return {
            slowQueries: slowQueries.slice(0, 20),
            fastQueries: fastQueries.slice(0, 20),
            totalQueries: this.queryStats.size,
            recommendations: this.indexRecommendations.slice(0, 10)
        };
    }

    async analyzeMissingIndexes() {
        const missingIndexQueries = [
            `
        SELECT
          schemaname,
          tablename,
          attname,
          n_tup_upd + n_tup_ins + n_tup_del as writes,
          n_tup_hot_upd as hot_updates,
          CASE
            WHEN n_tup_upd + n_tup_ins + n_tup_del > 1000 THEN
              'Consider indexing for frequent updates'
            ELSE 'Low write frequency'
          END as recommendation
        FROM pg_stat_user_tables
        JOIN pg_attribute ON attrelid = relid
        WHERE attnum > 0 AND NOT attisdropped
        ORDER BY writes DESC
        LIMIT 20;
      `,
            `
        SELECT
          relname as table_name,
          seq_scan,
          idx_scan,
          CASE
            WHEN seq_scan > idx_scan * 10 THEN 'High sequential scans - consider indexing'
            ELSE 'Index usage appears adequate'
          END as recommendation
        FROM pg_stat_user_tables
        WHERE seq_scan > 0
        ORDER BY seq_scan DESC
        LIMIT 20;
      `
        ];

        const results = [];
        for (const query of missingIndexQueries) {
            try {
                const result = await this.pool.query(query);
                results.push(result.rows);
            } catch (error) {
                winston.error('Error analyzing missing indexes:', error);
            }
        }

        return results;
    }

    async createRecommendedIndexes() {
        const recommendations = await this.analyzeMissingIndexes();
        const createdIndexes = [];

        for (const tableAnalysis of recommendations) {
            for (const row of tableAnalysis) {
                if (row.recommendation && row.recommendation.includes('consider indexing')) {
                    try {
                        const indexName = `idx_${row.tablename}_${row.attname || 'seqscan'}_${Date.now()}`;
                        const createIndexQuery = `
              CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
              ON ${row.tablename} (${row.attname || 'id'});
            `;

                        await this.pool.query(createIndexQuery);
                        createdIndexes.push({
                            table: row.tablename,
                            column: row.attname,
                            indexName,
                            recommendation: row.recommendation
                        });

                        winston.info(`Created index: ${indexName} on ${row.tablename}`);
                    } catch (error) {
                        winston.error(`Failed to create index on ${row.tablename}:`, error);
                    }
                }
            }
        }

        return createdIndexes;
    }

    async optimizeJobSearchQueries() {
        // Job search specific optimizations
        const jobSearchOptimizations = [
            // Full-text search index for job titles and descriptions
            `
        CREATE INDEX IF NOT EXISTS idx_jobs_fulltext 
        ON jobs USING gin(to_tsvector('english', title || ' ' || description));
      `,

            // Index for job location searches
            `
        CREATE INDEX IF NOT EXISTS idx_jobs_location 
        ON jobs (location);
      `,

            // Index for salary range queries
            `
        CREATE INDEX IF NOT EXISTS idx_jobs_salary 
        ON jobs (min_salary, max_salary);
      `,

            // Index for company-based job searches
            `
        CREATE INDEX IF NOT EXISTS idx_jobs_company 
        ON jobs (company_id);
      `,

            // Composite index for common job search patterns
            `
        CREATE INDEX IF NOT EXISTS idx_jobs_search_composite 
        ON jobs (status, created_at, location);
      `
        ];

        const results = [];
        for (const query of jobSearchOptimizations) {
            try {
                await this.pool.query(query);
                results.push({ status: 'success', query: query.substring(0, 50) });
            } catch (error) {
                results.push({ status: 'failed', query: query.substring(0, 50), error: error.message });
                winston.error('Job search optimization failed:', error);
            }
        }

        return results;
    }

    async optimizeUserProfileQueries() {
        // User profile specific optimizations
        const userProfileOptimizations = [
            // Index for user email lookups
            `
        CREATE INDEX IF NOT EXISTS idx_users_email 
        ON users (email);
      `,

            // Index for username searches
            `
        CREATE INDEX IF NOT EXISTS idx_users_username 
        ON users (username);
      `,

            // Index for user role filtering
            `
        CREATE INDEX IF NOT EXISTS idx_users_role 
        ON users (role);
      `,

            // Index for user profile completion status
            `
        CREATE INDEX IF NOT EXISTS idx_profiles_completion 
        ON user_profiles (completion_percentage);
      `,

            // Index for skill-based searches
            `
        CREATE INDEX IF NOT EXISTS idx_user_skills 
        ON user_skills (skill_name);
      `
        ];

        const results = [];
        for (const query of userProfileOptimizations) {
            try {
                await this.pool.query(query);
                results.push({ status: 'success', query: query.substring(0, 50) });
            } catch (error) {
                results.push({ status: 'failed', query: query.substring(0, 50), error: error.message });
                winston.error('User profile optimization failed:', error);
            }
        }

        return results;
    }

    async getDatabaseStatistics() {
        const statsQueries = [
            // Connection pool statistics
            `
        SELECT count(*) as active_connections
        FROM pg_stat_activity 
        WHERE state = 'active';
      `,

            // Table size information
            `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          n_tup_ins + n_tup_upd + n_tup_del as total_writes
        FROM pg_tables t
        JOIN pg_stat_user_tables s ON t.tablename = s.relname
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
      `,

            // Index usage statistics
            `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC NULLS LAST
        LIMIT 20;
      `
        ];

        const results = {};
        for (let i = 0; i < statsQueries.length; i++) {
            try {
                const result = await this.pool.query(statsQueries[i]);
                results[`stat_${i}`] = result.rows;
            } catch (error) {
                winston.error(`Database statistics query ${i} failed:`, error);
                results[`stat_${i}`] = { error: error.message };
            }
        }

        return results;
    }

    async cleanup() {
        await this.pool.end();
        winston.info('Database query optimizer cleaned up');
    }
}

module.exports = DatabaseQueryOptimizer;