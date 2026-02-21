/**
 * Database Connection Manager
 * Centralized PostgreSQL connection management for all backend services
 */

const { Pool, Client } = require('pg');
const { createLogger } = require('../../shared/logger');

class DatabaseManager {
  constructor(config = {}) {
    this.logger = createLogger('DatabaseManager');
    this.config = {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ...config
    };

    this.pool = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing database connection pool...');

      // Create connection pool
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        max: this.config.max,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      this.logger.info('Database connection pool initialized successfully');

      // Handle pool errors
      this.pool.on('error', (err) => {
        this.logger.error('Database pool error:', err);
      });

      this.pool.on('connect', (client) => {
        this.logger.debug('New database client connected', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        });
      });

      this.pool.on('remove', (client) => {
        this.logger.debug('Database client removed', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        });
      });

    } catch (error) {
      this.logger.error('Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  async query(text, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const start = Date.now();

    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      this.logger.debug('Database query executed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params.length,
        duration: `${duration}ms`,
        rowCount: result.rowCount
      });

      return result;
    } catch (error) {
      this.logger.error('Database query failed:', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction failed and rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health_status');
      return {
        status: 'healthy',
        connected: true,
        timestamp: new Date().toISOString(),
        pool: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async close() {
    if (this.pool) {
      this.logger.info('Closing database connection pool...');
      await this.pool.end();
      this.isInitialized = false;
      this.logger.info('Database connection pool closed');
    }
  }

  // Utility methods
  async executeStoredProcedure(procedureName, params = []) {
    const queryText = `CALL ${procedureName}(${params.map((_, index) => `$${index + 1}`).join(', ')})`;
    return this.query(queryText, params);
  }

  async insert(tableName, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  async findById(tableName, id, idColumn = 'id') {
    const query = `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`;
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  async update(tableName, id, data, idColumn = 'id') {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 2}`).join(', ');

    const query = `
      UPDATE ${tableName}
      SET ${columns.map((col, index) => `${col} = $${index + 2}`).join(', ')}
      WHERE ${idColumn} = $1
      RETURNING *
    `;

    const result = await this.query(query, [id, ...values]);
    return result.rows[0];
  }

  async delete(tableName, id, idColumn = 'id') {
    const query = `DELETE FROM ${tableName} WHERE ${idColumn} = $1`;
    await this.query(query, [id]);
  }

  async paginate(tableName, options = {}) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      whereClause = '1=1',
      selectColumns = '*'
    } = options;

    const offset = (page - 1) * limit;

    const query = `
      SELECT ${selectColumns}
      FROM ${tableName}
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $1 OFFSET $2
    `;

    const result = await this.query(query, [limit, offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName} WHERE ${whereClause}`;
    const countResult = await this.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Get pool statistics
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      totalConnections: this.pool.totalCount - this.pool.waitingCount
    };
  }
}

// Singleton instance
let databaseManager = null;

function getDatabaseManager(config) {
  if (!databaseManager) {
    databaseManager = new DatabaseManager(config);
  }
  return databaseManager;
}

module.exports = {
  DatabaseManager,
  getDatabaseManager
};