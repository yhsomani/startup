/**
 * Base Repository Class
 * 
 * Generic database repository with:
 * - CRUD operations
 * - Query building
 * - Pagination support
 * - Caching capabilities
 * - Transaction support
 * - Error handling
 */

const { createLogger } = require('../../../services/shared/logger');

class BaseRepository {
  constructor(tableName, serviceName = 'unknown-service') {
    this.tableName = tableName;
    this.serviceName = serviceName;
    this.logger = createLogger(`BaseRepository-${serviceName}-${tableName}`);
    this.queryCount = 0;
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000; // 1 second
    this.cache = new Map();
    this.cacheTimeout = parseInt(process.env.QUERY_CACHE_TIMEOUT) || 5 * 60 * 1000; // 5 minutes
    this.defaultLimit = parseInt(process.env.DEFAULT_QUERY_LIMIT) || 50;
    this.defaultOffset = 0;
  }

  /**
   * Create a new record
   * @param {Object} data - Data to insert
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Created record
   */
  async create(data, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.getClient(options);
      
      try {
        // Build INSERT query dynamically based on data keys
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
          INSERT INTO ${this.tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        const result = await client.query(query, values);
        const record = result.rows[0];
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow create query detected', {
            table: this.tableName,
            queryTime,
            query: query.substring(0, 200) + '...',
            data: JSON.stringify(data)
          });
        }
        
        // Invalidate cache for this table
        this.invalidateCache();
        
        this.logger.info('Record created successfully', {
          table: this.tableName,
          recordId: record.id,
          queryTime
        });
        
        return record;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to create record', {
        table: this.tableName,
        error: error.message,
        stack: error.stack,
        data
      });
      throw new DatabaseError('CREATE_FAILED', error.message, error);
    }
  }

  /**
   * Create multiple records
   * @param {Array} records - Records to insert
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Created records
   */
  async createMany(records, options = {}) {
    const startTime = Date.now();
    
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('Records must be a non-empty array');
    }

    try {
      const client = await this.getClient(options);
      
      try {
        const columns = Object.keys(records[0]);
        const values = records.map(record => Object.values(record));
        const placeholders = values.length ? 
          values[0].map((_, index) => `$${index + 1}`).join(', ') : '';
        
        const query = `
          INSERT INTO ${this.tableName} (${columns.join(', ')})
          VALUES ${values.map(() => `(${placeholders})`).join(', ')}
          RETURNING *
        `;
        
        // Flatten values for query execution
        const flatValues = values.flat();
        
        const result = await client.query(query, flatValues);
        const createdRecords = result.rows;
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow createMany query detected', {
            table: this.tableName,
            queryTime,
            recordCount: records.length,
            query: query.substring(0, 200) + '...'
          });
        }
        
        // Invalidate cache for this table
        this.invalidateCache();
        
        this.logger.info('Multiple records created successfully', {
          table: this.tableName,
          recordCount: createdRecords.length,
          queryTime
        });
        
        return createdRecords;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to create multiple records', {
        table: this.tableName,
        error: error.message,
        stack: error.stack,
        recordCount: records.length
      });
      throw new DatabaseError('CREATE_MANY_FAILED', error.message, error);
    }
  }

  /**
   * Find records by criteria
   * @param {Object} where - Selection criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Found records
   */
  async find(where = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        limit = this.defaultLimit,
        offset = this.defaultOffset,
        orderBy = 'id',
        order = 'ASC',
        useCache = false
      } = options;

      // Check cache first
      const cacheKey = this.generateCacheKey(where, options);
      if (useCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
          this.logger.debug('Returning cached result', { cacheKey });
          return cached.data;
        }
      }

      const client = await this.getClient(options);
      
      try {
        const { whereClause, queryParams } = this.buildWhereClause(where);
        const orderByClause = this.buildOrderByClause(orderBy, order);
        const limitClause = limit ? `LIMIT ${limit}` : '';
        const offsetClause = offset ? `OFFSET ${offset}` : '';
        
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
          this.logger.warn('Slow find query detected', {
            table: this.tableName,
            where,
            options,
            queryTime,
            query: query.substring(0, 200) + '...',
            resultCount: records.length
          });
        }
        
        // Cache result if caching is enabled
        if (useCache) {
          this.cache.set(cacheKey, {
            data: records,
            timestamp: Date.now()
          });
        }
        
        this.logger.debug('Records found successfully', {
          table: this.tableName,
          resultCount: records.length,
          queryTime
        });
        
        return records;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to find records', {
        table: this.tableName,
        where,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('FIND_FAILED', error.message, error);
    }
  }

  /**
   * Find record by ID
   * @param {string} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found record
   */
  async findById(id, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.getClient(options);
      
      try {
        const query = `
          SELECT * FROM ${this.tableName}
          WHERE id = $1
          LIMIT 1
        `;
        
        const result = await client.query(query, [id]);
        const record = result.rows[0] || null;
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow findById query detected', {
            table: this.tableName,
            id,
            queryTime,
            found: !!record
          });
        }
        
        this.logger.debug('Record found by ID successfully', {
          table: this.tableName,
          id,
          found: !!record,
          queryTime
        });
        
        return record;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to find record by ID', {
        table: this.tableName,
        id,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('FIND_BY_ID_FAILED', error.message, error);
    }
  }

  /**
   * Find first record by criteria
   * @param {Object} where - Selection criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Found record
   */
  async findFirst(where = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      const { orderBy = 'id', order = 'ASC' } = options;
      
      const client = await this.getClient(options);
      
      try {
        const { whereClause, queryParams } = this.buildWhereClause(where);
        const orderByClause = this.buildOrderByClause(orderBy, order);
        
        const query = `
          SELECT * FROM ${this.tableName}
          WHERE ${whereClause}
          ${orderByClause}
          LIMIT 1
        `;
        
        const result = await client.query(query, queryParams);
        const record = result.rows[0] || null;
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow findFirst query detected', {
            table: this.tableName,
            where,
            options,
            queryTime,
            found: !!record
          });
        }
        
        this.logger.debug('First record found successfully', {
          table: this.tableName,
          found: !!record,
          queryTime
        });
        
        return record;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to find first record', {
        table: this.tableName,
        where,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('FIND_FIRST_FAILED', error.message, error);
    }
  }

  /**
   * Update record by ID
   * @param {string} id - Record ID
   * @param {Object} updateData - Data to update
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Updated record
   */
  async update(id, updateData, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.getClient(options);
      
      try {
        const columns = Object.keys(updateData);
        const values = Object.values(updateData);
        const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
        
        const query = `
          UPDATE ${this.tableName}
          SET ${setClause}
          WHERE id = $${columns.length + 1}
          RETURNING *
        `;
        
        const result = await client.query(query, [...values, id]);
        const record = result.rows[0];
        
        if (!record) {
          throw new Error(`No record found with id: ${id}`);
        }
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow update query detected', {
            table: this.tableName,
            id,
            updateData,
            queryTime
          });
        }
        
        // Invalidate cache for this table
        this.invalidateCache();
        
        this.logger.info('Record updated successfully', {
          table: this.tableName,
          id,
          updatedFields: columns,
          queryTime
        });
        
        return record;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to update record', {
        table: this.tableName,
        id,
        updateData,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('UPDATE_FAILED', error.message, error);
    }
  }

  /**
   * Update multiple records
   * @param {Object} where - Selection criteria
   * @param {Object} updateData - Data to update
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Updated records
   */
  async updateMany(where, updateData, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.getClient(options);
      
      try {
        const { whereClause, whereParams } = this.buildWhereClause(where);
        const setClause = Object.keys(updateData)
          .map((col, index) => `${col} = $${Object.keys(where).length + index + 1}`)
          .join(', ');
        
        const query = `
          UPDATE ${this.tableName}
          SET ${setClause}
          WHERE ${whereClause}
          RETURNING *
        `;
        
        const result = await client.query(query, [...Object.values(updateData), ...whereParams]);
        const records = result.rows;
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow updateMany query detected', {
            table: this.tableName,
            where,
            updateData,
            queryTime,
            updatedCount: records.length
          });
        }
        
        // Invalidate cache for this table
        this.invalidateCache();
        
        this.logger.info('Multiple records updated successfully', {
          table: this.tableName,
          updatedCount: records.length,
          queryTime
        });
        
        return records;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to update multiple records', {
        table: this.tableName,
        where,
        updateData,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('UPDATE_MANY_FAILED', error.message, error);
    }
  }

  /**
   * Delete record by ID
   * @param {string} id - Record ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Deleted record
   */
  async delete(id, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.getClient(options);
      
      try {
        const query = `
          DELETE FROM ${this.tableName}
          WHERE id = $1
          RETURNING *
        `;
        
        const result = await client.query(query, [id]);
        const record = result.rows[0] || null;
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow delete query detected', {
            table: this.tableName,
            id,
            queryTime,
            deleted: !!record
          });
        }
        
        // Invalidate cache for this table
        this.invalidateCache();
        
        this.logger.info('Record deleted successfully', {
          table: this.tableName,
          id,
          deleted: !!record,
          queryTime
        });
        
        return record;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to delete record', {
        table: this.tableName,
        id,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('DELETE_FAILED', error.message, error);
    }
  }

  /**
   * Delete multiple records
   * @param {Object} where - Selection criteria
   * @param {Object} options - Query options
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteMany(where, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.getClient(options);
      
      try {
        const { whereClause, whereParams } = this.buildWhereClause(where);
        
        const query = `
          DELETE FROM ${this.tableName}
          WHERE ${whereClause}
        `;
        
        const result = await client.query(query, whereParams);
        const deletedCount = result.rowCount;
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow deleteMany query detected', {
            table: this.tableName,
            where,
            queryTime,
            deletedCount
          });
        }
        
        // Invalidate cache for this table
        this.invalidateCache();
        
        this.logger.info('Multiple records deleted successfully', {
          table: this.tableName,
          deletedCount,
          queryTime
        });
        
        return deletedCount;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to delete multiple records', {
        table: this.tableName,
        where,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('DELETE_MANY_FAILED', error.message, error);
    }
  }

  /**
   * Count records by criteria
   * @param {Object} where - Selection criteria
   * @param {Object} options - Query options
   * @returns {Promise<number>} Number of records
   */
  async count(where = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      const client = await this.getClient(options);
      
      try {
        const { whereClause, queryParams } = this.buildWhereClause(where);
        
        const query = `
          SELECT COUNT(*) as count
          FROM ${this.tableName}
          WHERE ${whereClause}
        `;
        
        const result = await client.query(query, queryParams);
        const count = parseInt(result.rows[0].count);
        
        this.queryCount++;
        const queryTime = Date.now() - startTime;
        
        if (queryTime > this.slowQueryThreshold) {
          this.logger.warn('Slow count query detected', {
            table: this.tableName,
            where,
            queryTime,
            count
          });
        }
        
        this.logger.debug('Records counted successfully', {
          table: this.tableName,
          count,
          queryTime
        });
        
        return count;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to count records', {
        table: this.tableName,
        where,
        options,
        error: error.message,
        stack: error.stack
      });
      throw new DatabaseError('COUNT_FAILED', error.message, error);
    }
  }

  /**
   * Build WHERE clause from criteria
   * @param {Object} where - Selection criteria
   * @returns {Object} WHERE clause and parameters
   */
  buildWhereClause(where) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(where).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        conditions.push(`${key} IS NULL`);
      } else if (typeof value === 'object' && value.$regex) {
        conditions.push(`${key} ~ $${paramIndex}`);
        params.push(value.$regex);
        paramIndex++;
      } else if (typeof value === 'object' && value.$in) {
        if (Array.isArray(value.$in) && value.$in.length > 0) {
          const placeholders = value.$in.map(() => `$${paramIndex++}`).join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value.$in);
          paramIndex++;
        } else {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(null);
          paramIndex++;
        }
      } else if (typeof value === 'object' && value.$ne) {
        conditions.push(`${key} != $${paramIndex}`);
        params.push(value.$ne);
        paramIndex++;
      } else if (typeof value === 'object' && value.$gte) {
        conditions.push(`${key} >= $${paramIndex}`);
        params.push(value.$gte);
        paramIndex++;
      } else if (typeof value === 'object' && value.$lte) {
        conditions.push(`${key} <= $${paramIndex}`);
        params.push(value.$lte);
        paramIndex++;
      } else if (typeof value === 'object' && value.$between) {
        conditions.push(`${key} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        params.push(value.$between[0], value.$between[1]);
        paramIndex += 2;
      } else {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    return {
      whereClause,
      queryParams: params
    };
  }

  /**
   * Build ORDER BY clause
   * @param {string} orderBy - Field to order by
   * @param {string} order - Order direction
   * @returns {string} ORDER BY clause
   */
  buildOrderByClause(orderBy, order = 'ASC') {
    if (!orderBy) {
      return '';
    }

    const direction = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return `ORDER BY ${orderBy} ${direction}`;
  }

  /**
   * Generate cache key
   * @param {Object} where - Selection criteria
   * @param {Object} options - Query options
   * @returns {string} Cache key
   */
  generateCacheKey(where, options) {
    const keyParts = [
      this.tableName,
      JSON.stringify(where),
      JSON.stringify(options)
    ];
    
    return Buffer.from(JSON.stringify(keyParts)).toString('base64');
  }

  /**
   * Invalidate cache
   */
  invalidateCache() {
    this.cache.clear();
    this.logger.debug('Cache invalidated', { table: this.tableName });
  }

  /**
   * Get database client (to be extended by specific repositories)
   */
  async getClient(options = {}) {
    // This method should be overridden by specific repositories
    throw new Error('getClient method must be implemented by extending class');
  }

  /**
   * Get repository statistics
   * @returns {Object} Repository statistics
   */
  getStats() {
    return {
      tableName: this.tableName,
      serviceName: this.serviceName,
      queryCount: this.queryCount,
      slowQueryThreshold: this.slowQueryThreshold,
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout,
      defaultLimit: this.defaultLimit
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('Repository cache cleared', { table: this.tableName });
  }
}

/**
 * Custom Database Error class
 */
class DatabaseError extends Error {
  constructor(type, message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.serviceName = 'BaseRepository';
  }
}

module.exports = {
  BaseRepository,
  DatabaseError
};