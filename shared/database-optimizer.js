/**
 * TalentSphere Database Optimizer
 * Advanced database optimization with intelligent caching and query optimization
 */

const { Pool } = require('pg');
const config = require('../../shared/config');
const { logger } = require('./enhanced-logger');

class DatabaseOptimizer {
  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      ssl: config.database.ssl,
      // Optimized connection pool settings
      max: 20, // Maximum number of connections
      min: 5,  // Minimum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.queryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  // Execute optimized query
  async query(text, params = [], options = {}) {
    const {
      useCache = false,
      cacheKey = null,
      cacheTTL = 300000, // 5 minutes
      optimize = true
    } = options;

    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.cacheStats.hits++;
        logger.debug('Query cache hit', { cacheKey, query: text.substring(0, 50) });
        return cached;
      }
      this.cacheStats.misses++;
    }

    const startTime = Date.now();
    let result;

    try {
      // Add query optimization hints
      let optimizedQuery = text;
      if (optimize) {
        optimizedQuery = this.optimizeQuery(text);
      }

      result = await this.pool.query(optimizedQuery, params);
      
      // Log performance
      const duration = Date.now() - startTime;
      logger.logDatabase('query', 'unknown', duration, {
        query: text.substring(0, 100),
        rowCount: result.rowCount,
        fromCache: false
      });

      // Cache result if enabled
      if (useCache && cacheKey && result.rows) {
        this.setCache(cacheKey, result, cacheTTL);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabase('query_error', 'unknown', duration, {
        query: text.substring(0, 100),
        error: error.message
      });
      throw error;
    }
  }

  // Optimize SQL query
  optimizeQuery(query) {
    let optimized = query;

    // Add appropriate hints based on query type
    if (query.toLowerCase().includes('select')) {
      // For SELECT queries
      if (query.toLowerCase().includes('order by')) {
        optimized = query + ' /*+ INDEX */';
      }
    }

    // Remove multiple spaces and normalize
    optimized = optimized.replace(/\s+/g, ' ').trim();

    return optimized;
  }

  // Cache management
  setCache(key, value, ttl = 300000) {
    this.queryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    });
    this.cacheStats.sets++;

    // Clean old entries periodically
    if (this.cacheStats.sets % 100 === 0) {
      this.cleanCache();
    }
  }

  getFromCache(key) {
    const cached = this.queryCache.get(key);
    if (!cached) {return null;}

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, cached] of this.queryCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  clearCache() {
    this.queryCache.clear();
    this.cacheStats = { hits: 0, misses: 0, sets: 0 };
  }

  // Batch operations
  async batch(operations) {
    const startTime = Date.now();
    
    try {
      const results = await this.pool.query('BEGIN');
      
      for (const operation of operations) {
        await this.pool.query(operation.text, operation.params);
      }
      
      await this.pool.query('COMMIT');
      
      const duration = Date.now() - startTime;
      logger.logDatabase('batch', 'unknown', duration, {
        operationCount: operations.length
      });

      return { success: true, results };
    } catch (error) {
      await this.pool.query('ROLLBACK');
      
      const duration = Date.now() - startTime;
      logger.logDatabase('batch_error', 'unknown', duration, {
        error: error.message
      });
      
      throw error;
    }
  }

  // Transaction wrapper
  async transaction(callback) {
    const startTime = Date.now();
    
    try {
      await this.pool.query('BEGIN');
      const result = await callback(this.pool);
      await this.pool.query('COMMIT');
      
      const duration = Date.now() - startTime;
      logger.logDatabase('transaction', 'unknown', duration);
      
      return result;
    } catch (error) {
      await this.pool.query('ROLLBACK');
      
      const duration = Date.now() - startTime;
      logger.logDatabase('transaction_error', 'unknown', duration, {
        error: error.message
      });
      
      throw error;
    }
  }

  // Optimized search queries
  async searchJobs(filters = {}, pagination = {}) {
    const {
      q: searchTerm,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      skills,
      company,
      postedWithin
    } = filters;

    const { limit = 20, offset = 0 } = pagination;

    // Build WHERE clause efficiently
    const whereConditions = ['j.is_active = TRUE'];
    const queryParams = [];
    let paramIndex = 1;

    // Full-text search optimization
    if (searchTerm) {
      whereConditions.push(`j.search_vector @@ websearch_to_tsquery('english', $${paramIndex})`);
      queryParams.push(searchTerm);
      paramIndex++;
    }

    // Location optimization with index
    if (location) {
      whereConditions.push(`j.location ILIKE $${paramIndex}`);
      queryParams.push(`%${location}%`);
      paramIndex++;
    }

    // Add other filters
    if (employmentType) {
      whereConditions.push(`j.employment_type = $${paramIndex}`);
      queryParams.push(employmentType);
      paramIndex++;
    }

    // Use specific indexes for salary range
    if (salaryMin !== undefined) {
      whereConditions.push(`j.salary_min >= $${paramIndex}`);
      queryParams.push(salaryMin);
      paramIndex++;
    }

    if (salaryMax !== undefined) {
      whereConditions.push(`j.salary_max <= $${paramIndex}`);
      queryParams.push(salaryMax);
      paramIndex++;
    }

    // Posted within optimization
    if (postedWithin) {
      const dateCondition = this.getDateCondition(postedWithin);
      whereConditions.push(`j.posted_at >= ${dateCondition}`);
    }

    // Optimized query with proper index usage
    const query = `
      SELECT 
        j.id,
        j.title,
        j.description,
        j.company_id,
        j.employment_type,
        j.experience_level,
        j.location,
        j.salary_min,
        j.salary_max,
        j.salary_currency,
        j.posted_at,
        c.name as company_name,
        ts_rank(j.search_vector, websearch_to_tsquery('english', $1)) as relevance_score
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY relevance_score DESC, j.posted_at DESC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `;

    const cacheKey = `search_jobs_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;

    return this.query(query, queryParams, {
      useCache: true,
      cacheKey,
      cacheTTL: 60000 // 1 minute for search results
    });
  }

  // Optimized user connections query
  async getUserConnections(userId, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;

    const query = `
      SELECT 
        c.id,
        c.status,
        c.created_at as connected_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.headline,
        u.avatar_url,
        u.company_id,
        comp.name as company_name
      FROM connections c
      JOIN users u ON (c.user_id_1 = u.id OR c.user_id_2 = u.id) AND u.id != $1
      LEFT JOIN companies comp ON u.company_id = comp.id
      WHERE (c.user_id_1 = $1 OR c.user_id_2 = $1) AND c.status = 'accepted'
      ORDER BY c.updated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const cacheKey = `user_connections_${userId}_${limit}_${offset}`;

    return this.query(query, [userId, limit, offset], {
      useCache: true,
      cacheKey,
      cacheTTL: 300000 // 5 minutes
    });
  }

  // Optimized job applications query
  async getJobApplications(jobId, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;

    const query = `
      SELECT 
        ja.id,
        ja.status,
        ja.applied_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.headline,
        u.avatar_url,
        u.resume_url,
        u.skills
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      WHERE ja.job_id = $1
      ORDER BY ja.applied_at DESC
      LIMIT $2 OFFSET $3
    `;

    const cacheKey = `job_applications_${jobId}_${limit}_${offset}`;

    return this.query(query, [jobId, limit, offset], {
      useCache: true,
      cacheKey,
      cacheTTL: 120000 // 2 minutes
    });
  }

  // Analytics query optimization
  async getJobAnalytics(jobId, period = '30d') {
    const dateCondition = this.getDateCondition(period);

    const query = `
      SELECT 
        COUNT(DISTINCT ja.id) as total_applications,
        COUNT(DISTINCT CASE WHEN ja.created_at >= ${dateCondition} THEN ja.id END) as new_applications,
        COUNT(DISTINCT jv.id) as total_views,
        COUNT(DISTINCT CASE WHEN jv.created_at >= ${dateCondition} THEN jv.id END) as new_views,
        AVG(EXTRACT(EPOCH FROM (ja.created_at - j.posted_at))/86400) as avg_days_to_apply
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      LEFT JOIN job_views jv ON j.id = jv.job_id
      WHERE j.id = $1
      GROUP BY j.id
    `;

    const cacheKey = `job_analytics_${jobId}_${period}`;

    return this.query(query, [jobId], {
      useCache: true,
      cacheKey,
      cacheTTL: 600000 // 10 minutes
    });
  }

  // Date condition helper
  getDateCondition(period) {
    const conditions = {
      '1d': "NOW() - INTERVAL '1 day'",
      '7d': "NOW() - INTERVAL '7 days'",
      '30d': "NOW() - INTERVAL '30 days'",
      '90d': "NOW() - INTERVAL '90 days'",
      '1y': "NOW() - INTERVAL '1 year'"
    };

    return conditions[period] || conditions['30d'];
  }

  // Connection pool monitoring
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      cacheStats: this.cacheStats,
      cacheSize: this.queryCache.size
    };
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health_check');
      const poolStats = this.getPoolStats();

      return {
        status: 'healthy',
        database: {
          connected: true,
          responseTime: 0, // Would need to measure actual response time
          pool: poolStats
        },
        cache: {
          hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0,
          size: this.queryCache.size,
          stats: this.cacheStats
        },
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

  // Close connection pool
  async close() {
    await this.pool.end();
    logger.info('Database optimizer pool closed');
  }
}

module.exports = DatabaseOptimizer;