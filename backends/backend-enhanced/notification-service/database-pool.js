/**
 * Database Connection Pool for Notification Service
 * 
 * Enhanced connection pooling with:
 * - Connection health monitoring
 * - Automatic reconnection
 * - Transaction management
 * - Query performance metrics
 * - Graceful shutdown handling
 */

const { Pool } = require('pg');
const { createLogger } = require('../../../../shared/logger');

class DatabaseConnectionPool {
  constructor(serviceName = 'notification-service') {
    this.serviceName = serviceName;
    this.logger = createLogger(`DatabaseConnectionPool-${serviceName}`);
    this.pool = null;
    this.isInitialized = false;
    this.healthCheckInterval = null;
    
    // Pool configuration
    this.poolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'talentsphere',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      min: parseInt(process.env.DB_MIN_CONNECTIONS) || 5,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      // Add SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      } : false,
      // Add application name for monitoring
      application_name: `${serviceName}-db-client`,
      // Add statement timeout for long-running queries
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000
    };
  }

  /**
   * Initialize the database connection pool
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('Database pool already initialized');
      return;
    }

    try {
      this.logger.info('Initializing database connection pool', {
        host: this.poolConfig.host,
        port: this.poolConfig.port,
        database: this.poolConfig.database,
        maxConnections: this.poolConfig.max,
        minConnections: this.poolConfig.min
      });

      this.pool = new Pool(this.poolConfig);

      // Set up pool event listeners
      this.pool.on('connect', (client) => {
        this.logger.debug('New database client connected', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        });
      });

      this.pool.on('acquire', (client) => {
        this.logger.debug('Database client acquired from pool', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        });
      });

      this.pool.on('remove', (client) => {
        this.logger.debug('Database client removed from pool', {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        });
      });

      this.pool.on('error', (err, client) => {
        this.logger.error('Database pool error', {
          error: err.message,
          stack: err.stack
        });
      });

      // Test the connection
      await this.testConnection();

      // Start health check interval
      this.startHealthCheck();

      this.isInitialized = true;
      this.logger.info('Database connection pool initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize database connection pool', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      this.logger.info('Database connection test successful', {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version.split(' ')[0] // Just PostgreSQL version
      });
      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await this.checkHealth();
        if (!isHealthy) {
          this.logger.warn('Database health check failed, attempting reconnection');
          await this.attemptReconnection();
        }
      } catch (error) {
        this.logger.error('Health check failed', {
          error: error.message
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Attempt to reconnect the database
   */
  async attemptReconnection() {
    try {
      this.logger.info('Attempting database reconnection');
      
      if (this.pool) {
        await this.pool.end();
      }
      
      await this.initialize();
      
      this.logger.info('Database reconnection successful');
      return true;
    } catch (error) {
      this.logger.error('Database reconnection failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get a client from the pool
   */
  async getClient() {
    if (!this.isInitialized || !this.pool) {
      throw new Error('Database pool not initialized');
    }

    const startTime = Date.now();
    const client = await this.pool.connect();
    const acquireTime = Date.now() - startTime;

    // Add query execution wrapper to track performance
    const originalQuery = client.query;
    client.query = async (...args) => {
      const queryStartTime = Date.now();
      try {
        const result = await originalQuery.apply(client, args);
        const queryTime = Date.now() - queryStartTime;
        
        this.logger.debug('Query executed', {
          query: typeof args[0] === 'string' ? args[0].substring(0, 100) : 'prepared',
          queryTime,
          acquireTime
        });
        
        return result;
      } catch (error) {
        const queryTime = Date.now() - queryStartTime;
        this.logger.error('Query failed', {
          query: typeof args[0] === 'string' ? args[0].substring(0, 100) : 'prepared',
          queryTime,
          error: error.message
        });
        throw error;
      }
    };

    return client;
  }

  /**
   * Execute a transaction
   */
  async executeTransaction(operations) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const operation of operations) {
        const result = await operation(client);
        results.push(result);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check database health
   */
  async checkHealth() {
    try {
      if (!this.pool) {
        return false;
      }

      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Database health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.pool.options.max,
      minConnections: this.pool.options.min
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down database connection pool');

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pool) {
      try {
        await this.pool.end();
        this.logger.info('Database connection pool shut down successfully');
      } catch (error) {
        this.logger.error('Error shutting down database pool', {
          error: error.message
        });
      }
    }

    this.isInitialized = false;
    this.pool = null;
  }

  /**
   * Execute a prepared statement with parameters
   */
  async executePreparedQuery(name, text, params = []) {
    const client = await this.getClient();
    
    try {
      // Prepare the statement if not already prepared
      await client.query({ name, text, values: [] });
      
      // Execute the prepared statement
      const result = await client.query(name, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Batch execute multiple queries
   */
  async executeBatch(queries) {
    const client = await this.getClient();
    const results = [];
    
    try {
      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }
      return results;
    } finally {
      client.release();
    }
  }
}

module.exports = DatabaseConnectionPool;