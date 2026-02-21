/**
 * Database Utilities and Standardized Operations
 * 
 * Provides common database operations, query builders, and connection management
 * for all TalentSphere services
 */

const { getDatabaseConfig } = require('./environment');
const { createLogger } = require('./logger');
const { Pool } = require('pg');

class DatabaseUtils {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.config = getDatabaseConfig();
    this.logger = createLogger(`DatabaseUtils-${serviceName}`);
    this.pool = null;
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl,
        min: this.config.minConnections,
        max: this.config.maxConnections,
        idleTimeoutMillis: this.config.idleTimeout,
        connectionTimeoutMillis: this.config.connectionTimeout,
        
        // Performance settings
        application_name: `talentsphere-${this.serviceName}`,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.logger.info(`Database connection pool initialized for ${this.serviceName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize database for ${this.serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Get database client from pool
   */
  async getClient() {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool.connect();
  }

  /**
   * Execute query with automatic client management
   */
  async query(text, params = []) {
    const client = await this.getClient();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      this.logger.debug('Query executed', {
        query: text.replace(/\s+/g, ' ').trim(),
        params: params.length ? `[${params.length} parameters]` : 'none',
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute transaction
   */
  async transaction(callback) {
    const client = await this.getClient();
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

  /**
   * Standardized query builder for common operations
   */
  static QueryBuilder = class {
    constructor() {
      this._table = '';
      this._select = [];
      this._where = [];
      this._join = [];
      this._orderBy = [];
      this._limit = null;
      this._offset = null;
      this._params = [];
    }

    table(table) {
      this._table = table;
      return this;
    }

    select(...columns) {
      this._select = columns.length ? columns : ['*'];
      return this;
    }

    where(condition, param = null) {
      if (param !== null) {
        this._params.push(param);
      }
      this._where.push(condition);
      return this;
    }

    join(table, onCondition, param = null) {
      if (param !== null) {
        this._params.push(param);
      }
      this._join.push({ table, onCondition });
      return this;
    }

    orderBy(column, direction = 'ASC') {
      this._orderBy.push({ column, direction });
      return this;
    }

    limit(count) {
      this._limit = count;
      return this;
    }

    offset(count) {
      this._offset = count;
      return this;
    }

    build() {
      let query = 'SELECT ';
      query += this._select.join(', ');
      query += ` FROM ${this._table}`;

      // Add JOINs
      this._join.forEach(join => {
        query += ` JOIN ${join.table} ON ${join.onCondition}`;
      });

      // Add WHERE conditions
      if (this._where.length > 0) {
        query += ` WHERE ${this._where.join(' AND ')}`;
      }

      // Add ORDER BY
      if (this._orderBy.length > 0) {
        const orderClauses = this._orderBy.map(o => `${o.column} ${o.direction}`);
        query += ` ORDER BY ${orderClauses.join(', ')}`;
      }

      // Add LIMIT
      if (this._limit) {
        query += ` LIMIT ${this._limit}`;
      }

      // Add OFFSET
      if (this._offset) {
        query += ` OFFSET ${this._offset}`;
      }

      return { query, params: this._params };
    }
  };

  /**
   * Standardized pagination
   */
  async paginate(table, options = {}) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      where = [],
      select = ['*']
    } = options;

    const offset = (page - 1) * limit;

    // Build count query
    const countQuery = new DatabaseUtils.QueryBuilder()
      .table(table)
      .select('COUNT(*) as total');

    where.forEach(condition => {
      countQuery.where(condition.clause, condition.param);
    });

    // Build data query
    const dataQuery = new DatabaseUtils.QueryBuilder()
      .table(table)
      .select(...select)
      .orderBy(orderBy, orderDirection)
      .limit(limit)
      .offset(offset);

    where.forEach(condition => {
      dataQuery.where(condition.clause, condition.param);
    });

    // Execute both queries
    const [countResult, dataResult] = await Promise.all([
      this.query(countQuery.build().query, countQuery.build().params),
      this.query(dataQuery.build().query, dataQuery.build().params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Create standardized audit log entry
   */
  async createAuditLog(action, tableName, recordId, userId, changes = {}) {
    const auditQuery = `
      INSERT INTO audit_logs (
        action, table_name, record_id, user_id, changes, created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `;
    
    const params = [action, tableName, recordId, userId, JSON.stringify(changes)];
    return this.query(auditQuery, params);
  }

  /**
   * Soft delete with audit
   */
  async softDelete(tableName, id, userId, reason = '') {
    return this.transaction(async (client) => {
      // Get record before deletion for audit
      const recordQuery = `SELECT * FROM ${tableName} WHERE id = $1`;
      const recordResult = await client.query(recordQuery, [id]);
      
      if (recordResult.rows.length === 0) {
        throw new Error(`Record not found in ${tableName}`);
      }

      // Soft delete
      const deleteQuery = `
        UPDATE ${tableName} 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP, deleted_by = $2, deleted_reason = $3
        WHERE id = $1
      `;
      await client.query(deleteQuery, [id, userId, reason]);

      // Create audit log
      await this.createAuditLog('DELETE', tableName, id, userId, {
        reason,
        record: recordResult.rows[0]
      });

      return recordResult.rows[0];
    });
  }

  /**
   * Check database health
   */
  async checkHealth() {
    try {
      const result = await this.query('SELECT 1 as health_check, NOW() as timestamp');
      const poolInfo = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };

      return {
        status: 'healthy',
        database: {
          connected: true,
          timestamp: result.rows[0].timestamp,
          pool: poolInfo
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.logger.info(`Database connection pool closed for ${this.serviceName}`);
    }
  }

  /**
   * Generate UUID for new records
   */
  static generateUUID() {
    return require('crypto').randomUUID();
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = DatabaseUtils;