/**
 * Database Connection Manager
 * 
 * Centralized database connection management with connection pooling,
 * health monitoring, and automatic reconnection for all services
 */

const { Pool } = require('pg');
const { createLogger } = require('../shared/logger');
require('dotenv').config();

class DatabaseManager {
  constructor(serviceName, config = {}) {
    this.serviceName = serviceName;
    this.logger = createLogger(`Database:${serviceName}`);
    
    // Database configuration
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'talentsphere',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      // Connection pool settings
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      // SSL configuration
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false,
      // Retry settings
      retries: parseInt(process.env.DB_RETRIES) || 3,
      retryDelay: parseInt(process.env.DB_RETRY_DELAY) || 1000,
      ...config
    };

    this.pool = null;
    this.healthCheckInterval = null;
    this.isHealthy = false;
    this.metrics = {
      totalQueries: 0,
      activeConnections: 0,
      errors: 0,
      lastError: null
    };
  }

  /**
   * Initialize database connection pool
   */
  async initialize() {
    try {
      this.logger.info('Initializing database connection', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        poolSize: this.config.max
      });

      // Create connection pool
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        max: this.config.max,
        min: this.config.min,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
        ssl: this.config.ssl,
        // Error handling
        application_name: `talentsphere-${this.serviceName}`,
        // Connection logging
        log: (message) => {
          if (message.level === 'error') {
            this.logger.error('Database error', { message });
            this.metrics.errors++;
            this.metrics.lastError = new Date();
          } else {
            this.logger.debug('Database log', { message });
          }
        }
      });

      // Test connection
      await this.testConnection();

      // Setup health monitoring
      this.startHealthMonitoring();

      // Setup pool event listeners
      this.setupPoolEventListeners();

      this.logger.info('Database connection pool initialized successfully', {
        service: this.serviceName,
        poolSize: this.config.max
      });

    } catch (error) {
      this.logger.error('Failed to initialize database connection', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Execute a query with automatic retry and logging
   */
  async query(text, params = [], options = {}) {
    const startTime = Date.now();
    let attempts = 0;
    let lastError = null;

    while (attempts < this.config.retries) {
      attempts++;
      
      try {
        this.metrics.totalQueries++;
        
        // Get client from pool
        const client = await this.pool.connect();
        this.metrics.activeConnections++;

        try {
          // Execute query
          const result = await client.query(text, params);
          
          // Log successful query (debug level for performance)
          this.logger.debug('Query executed successfully', {
            query: this.sanitizeQuery(text),
            paramsCount: params.length,
            duration: Date.now() - startTime,
            attempt: attempts,
            rowsAffected: result.rowCount || result.rows?.length || 0
          });

          return result;

        } finally {
          // Always release client
          client.release();
          this.metrics.activeConnections--;
        }

      } catch (error) {
        lastError = error;
        
        this.logger.warn('Query attempt failed', {
          attempt: attempts,
          error: error.message,
          code: error.code,
          query: this.sanitizeQuery(text),
          paramsCount: params.length
        });

        // Don't retry for certain errors
        if (this.shouldNotRetry(error)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempts < this.config.retries) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempts - 1));
        }
      }
    }

    // All attempts failed
    this.logger.error('Query failed after all attempts', {
      attempts,
      error: lastError.message,
      code: lastError.code,
      query: this.sanitizeQuery(text),
      duration: Date.now() - startTime
    });

    this.metrics.errors++;
    this.metrics.lastError = new Date();
    
    throw lastError;
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    const startTime = Date.now();
    let attempts = 0;
    let lastError = null;

    while (attempts < this.config.retries) {
      attempts++;
      
      try {
        const client = await this.pool.connect();
        this.metrics.activeConnections++;

        try {
          await client.query('BEGIN');
          
          const result = await callback(client);
          
          await client.query('COMMIT');
          
          this.logger.debug('Transaction completed successfully', {
            duration: Date.now() - startTime,
            attempt: attempts
          });

          return result;

        } catch (error) {
          await client.query('ROLLBACK');
          throw error;

        } finally {
          client.release();
          this.metrics.activeConnections--;
        }

      } catch (error) {
        lastError = error;
        
        this.logger.warn('Transaction attempt failed', {
          attempt: attempts,
          error: error.message,
          code: error.code
        });

        if (this.shouldNotRetry(error)) {
          break;
        }

        if (attempts < this.config.retries) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempts - 1));
        }
      }
    }

    this.logger.error('Transaction failed after all attempts', {
      attempts,
      error: lastError.message,
      duration: Date.now() - startTime
    });

    throw lastError;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const result = await this.query('SELECT 1 as health_check');
      this.isHealthy = true;
      
      this.logger.debug('Database health check passed', {
        service: this.serviceName
      });

      return true;

    } catch (error) {
      this.isHealthy = false;
      
      this.logger.error('Database health check failed', {
        service: this.serviceName,
        error: error.message
      });

      return false;
    }
  }

  /**
   * Get database health status
   */
  getHealth() {
    return {
      service: this.serviceName,
      healthy: this.isHealthy,
      metrics: { ...this.metrics },
      pool: {
        totalCount: this.pool?.totalCount || 0,
        idleCount: this.pool?.idleCount || 0,
        waitingCount: this.pool?.waitingCount || 0
      },
      config: {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        maxConnections: this.config.max
      }
    };
  }

  /**
   * Close database connection pool
   */
  async close() {
    try {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }

      this.logger.info('Database connection pool closed', {
        service: this.serviceName
      });

    } catch (error) {
      this.logger.error('Error closing database pool', {
        service: this.serviceName,
        error: error.message
      });
    }
  }

  // Private methods

  /**
   * Setup pool event listeners
   */
  setupPoolEventListeners() {
    if (!this.pool) {return;}

    this.pool.on('connect', (client) => {
      this.logger.debug('New database client connected', {
        service: this.serviceName,
        processId: client.processID
      });
    });

    this.pool.on('acquire', (client) => {
      this.logger.debug('Database client acquired from pool', {
        service: this.serviceName,
        processId: client.processID
      });
    });

    this.pool.on('remove', (client) => {
      this.logger.debug('Database client removed from pool', {
        service: this.serviceName,
        processId: client.processID
      });
    });

    this.pool.on('error', (error, client) => {
      this.logger.error('Database pool error', {
        service: this.serviceName,
        error: error.message,
        processId: client?.processID
      });
    });
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.testConnection();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  sanitizeQuery(query) {
    return query
      .replace(/password\s*=\s*['"][^'"]*['"]/gi, "password='***'")
      .replace(/token\s*=\s*['"][^'"]*['"]/gi, "token='***'")
      .replace(/secret\s*=\s*['"][^'"]*['"]/gi, "secret='***'")
      .substring(0, 200); // Limit length
  }

  /**
   * Determine if error should not be retried
   */
  shouldNotRetry(error) {
    const noRetryCodes = [
      '23505', // Unique constraint violation
      '23503', // Foreign key constraint violation  
      '23502', // Not null constraint violation
      '42703', // Undefined column
      '42701', // Undefined function
      '42P01', // Undefined table
      '42601', // Syntax error
      '08006', // Connection failure (don't retry connection issues)
      '08001'  // SQL client unable to establish connection
    ];

    return noRetryCodes.includes(error.code) || 
           error.severity === 'FATAL' ||
           error.message?.includes('password') ||
           error.message?.includes('authentication');
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DatabaseManager;