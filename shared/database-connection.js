/**
 * Database Connection Manager
 * 
 * Provides a standardized interface for database operations
 * including initialize, query, and insert methods used by services.
 */

const { Pool } = require('pg');
const { getDatabaseConfig } = require('./environment');
const { createLogger } = require('./logger');

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.logger = createLogger('DatabaseConnection');
        // Load config initially but don't connect yet
        try {
            this.config = getDatabaseConfig();
        } catch (err) {
            this.logger.warn('Failed to load database config:', err.message);
            this.config = {};
        }
    }

    async initialize() {
        if (this.pool) return;

        try {
            // Re-load config if it was empty, in case env vars are set later
            if (!this.config || Object.keys(this.config).length === 0) {
                this.config = getDatabaseConfig();
            }

            this.pool = new Pool(this.config);
            await this.pool.query('SELECT 1');
            this.logger.info('Database connection initialized');
        } catch (error) {
            this.logger.error('Failed to initialize database connection:', error);
            throw error;
        }
    }

    async query(text, params = []) {
        if (!this.pool) await this.initialize();

        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            this.logger.debug(`Query executed in ${duration}ms`, { text, rows: result.rowCount });
            return result;
        } catch (error) {
            this.logger.error('Query failed:', { text, error: error.message });
            throw error;
        }
    }

    async insert(table, data) {
        if (!this.pool) await this.initialize();

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;

        try {
            const result = await this.query(query, values);
            return result.rows[0];
        } catch (error) {
            this.logger.error(`Insert failed for table ${table}:`, error.message);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

// Singleton instance
const dbInstance = new DatabaseConnection();

const getDatabaseManager = () => dbInstance;

module.exports = {
    getDatabaseManager,
    DatabaseConnection // Export class for testing if needed
};
