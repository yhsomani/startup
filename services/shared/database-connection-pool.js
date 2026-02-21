/**
 * Database Connection Pool
 * 
 * Advanced PostgreSQL connection pooling with:
 * - Connection health monitoring
 * - Automatic reconnection
 * - Transaction management
 * - Query performance metrics
 * - Graceful shutdown handling
 */

const { Pool, Client } = require('pg');
const { createLogger } = require('../../../services/shared/logger');

class DatabaseConnectionPool {
  constructor(serviceName = 'unknown-service') {
    this.serviceName = serviceName;
    this.logger = createLogger(`DatabaseConnectionPool-${serviceName}`);
    this.pool = null;
    this.isInitialized = false;
    this.healthCheckInterval = null;
    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      failedQueries: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      lastHealthCheck: null,
      connectionErrors: []
    };
    
    // Pool configuration with environment variable support
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
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
      // Add keepalives for connection stability
      keepalives: true,
      keepalives_idle: parseInt(process.env.DB_KEEPALIVES_IDLE) || 30000,
      keepalives_interval: parseInt(process.env.DB_KEEPALIVES_INTERVAL) || 10000,
      // Add connection limits
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
      query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 60000
    };

    this.logger.info('Database connection pool configured', {
      serviceName,
      config: {
        host: this.poolConfig.host,
        port: this.poolConfig.port,
        database: this.poolConfig.database,
        maxConnections: this.poolConfig.max,
        minConnections: this.poolConfig.min,
        ssl: this.poolConfig.ssl ? 'enabled' : 'disabled'
      }
    });
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
        minConnections: this.poolConfig.min,
        connectionTimeout: this.poolConfig.connectionTimeoutMillis,
        idleTimeout: this.poolConfig.idleTimeoutMillis
      });

      // Create the connection pool
      this.pool = new Pool(this.poolConfig);

      // Set up pool event listeners
      this.setupPoolEventListeners();

      // Test the initial connection
      await this.testConnection();

      // Start health check interval
      this.startHealthCheck();

      this.isInitialized = true;
      this.logger.info('Database connection pool initialized successfully', {
        poolSize: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });

    } catch (error) {
      this.logger.error('Failed to initialize database connection pool', {
        error: error.message,
        stack: error.stack,
        config: this.poolConfig
      });
      throw error;
    }
  }

  /**
   * Set up pool event listeners for monitoring
   */
  setupPoolEventListeners() {
    this.pool.on('connect', (client) => {
      this.connectionMetrics.totalConnections++;
      this.connectionMetrics.activeConnections++;
      
      this.logger.debug('New database client connected', {
        totalCount: this.connectionMetrics.totalConnections,
        activeCount: this.connectionMetrics.activeConnections,
        idleCount: this.pool.idleCount
      });

      // Set up client event listeners
      this.setupClientEventListeners(client);
    });

    this.pool.on('acquire', (client) => {
      this.connectionMetrics.activeConnections++;
      this.connectionMetrics.idleConnections--;
      
      this.logger.debug('Database client acquired from pool', {
        activeCount: this.connectionMetrics.activeConnections,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });

    this.pool.on('remove', (client) => {
      this.connectionMetrics.totalConnections--;
      if (this.connectionMetrics.activeConnections > 0) {
        this.connectionMetrics.activeConnections--;
      }
      
      this.logger.debug('Database client removed from pool', {
        totalCount: this.connectionMetrics.totalConnections,
        activeCount: this.connectionMetrics.activeConnections,
        idleCount: this.pool.idleCount
      });
    });

    this.pool.on('error', (error, client) => {
      this.connectionMetrics.connectionErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        clientInfo: client ? {
          processID: client.processID,
          connectionParameters: client.connectionParameters
        } : null
      });

      this.logger.error('Database pool error', {
        error: error.message,
        stack: error.stack
      });
    });

    this.pool.on('idle', () => {
      this.logger.debug('Database pool is idle');
    });
  }

  /**
   * Set up client event listeners for monitoring
   */
  setupClientEventListeners(client) {
    client.on('error', (error) => {
      this.connectionMetrics.failedQueries++;
      
      this.logger.error('Database client error', {
        error: error.message,
        stack: error.stack,
        clientInfo: client ? {
          processID: client.processID,
          connectionParameters: client.connectionParameters
        } : null
      });
    });

    client.on('notice', (notice) => {
      this.logger.warn('Database notice', {
        notice: notice.message,
        severity: notice.severity
      });
    });
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
        version: result.rows[0].version,
        connectionParameters: client.connectionParameters
      });
      
      return true;
    } finally {
      client.release();
    }
  }

  /**
   * Start health check interval
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
   * Check database health
   */
  async checkHealth() {
    if (!this.pool) {
      return false;
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('SELECT 1');
      
      this.connectionMetrics.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };

      return true;
    } catch (error) {
      this.connectionMetrics.lastHealthCheck = {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message
      };

      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Attempt database reconnection
   */
  async attemptReconnection() {
    try {
      this.logger.info('Attempting database reconnection');
      
      // Close existing pool
      if (this.pool) {
        await this.pool.end();
      }

      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Reinitialize pool
      await this.initialize();
      
      this.logger.info('Database reconnection successful');
      
    } catch (error) {
      this.logger.error('Database reconnection failed', {
        error: error.message,
        stack: error.stack
      });
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
    
    try {
      const client = await this.pool.connect();
      const acquireTime = Date.now() - startTime;
      
      this.logger.debug('Client acquired from pool', {
        acquireTime,
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });

      // Wrap the client's query method to add timing
      const originalQuery = client.query;
      client.query = async (...args) => {
        const queryStartTime = Date.now();
        
        try {
          const result = await originalQuery.apply(client, args);
          const queryTime = Date.now() - queryStartTime;
          
          this.connectionMetrics.totalQueries++;
          this.connectionMetrics.averageQueryTime = 
            (this.connectionMetrics.averageQueryTime + queryTime) / 2;
          
          if (queryTime > 5000) { // Slow query > 5 seconds
            this.connectionMetrics.slowQueries++;
            
            this.logger.warn('Slow query detected', {
              query: args[0],
              queryTime,
              parameters: args[1]
            });
          }
          
          this.logger.debug('Query executed successfully', {
            query: args[0],
            queryTime,
            parameters: args[1]
          });
          
          return result;
        } catch (error) {
          const queryTime = Date.now() - queryStartTime;
          this.connectionMetrics.failedQueries++;
          
          this.logger.error('Query execution failed', {
            query: args[0],
            queryTime,
            error: error.message,
            parameters: args[1]
          });
          
          throw error;
        }
      };

      // Wrap the client's release method
      const originalRelease = client.release;
      client.release = () => {
        const releaseTime = Date.now();
        
        if (this.connectionMetrics.activeConnections > 0) {
          this.connectionMetrics.activeConnections--;
        }
        
        originalRelease.call(client);
        
        this.logger.debug('Client released to pool', {
          activeCount: this.connectionMetrics.activeConnections,
          idleCount: this.pool.idleCount
        });
      };

      return client;
    } catch (error) {
      this.logger.error('Failed to acquire client from pool', {
        error: error.message,
        stack: error.stack,
        acquireTime: Date.now() - startTime
      });
      throw error;
    }
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
   * Execute a prepared statement with parameters
   */
  async executePreparedQuery(name, text, params = []) {
    const client = await this.getClient();
    
    try {
      // Prepare the statement
      await client.query({ name, text });
      
      // Execute the prepared statement
      const result = await client.query(name, params);
      
      this.logger.debug('Prepared query executed successfully', {
        name,
        params,
        rowCount: result.rowCount
      });
      
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
    
    try {
      const results = await Promise.all(
        queries.map(query => client.query(query.text || query, query.params || []))
      );
      
      this.logger.debug('Batch query executed successfully', {
        queryCount: queries.length,
        totalResults: results.length
      });
      
      return results;
    } finally {
      client.release();
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
      config: this.poolConfig,
      metrics: this.connectionMetrics,
      lastHealthCheck: this.connectionMetrics.lastHealthCheck,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
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
          error: error.message,
          stack: error.stack
        });
      }
    }

    this.isInitialized = false;
  }
}

module.exports = DatabaseConnectionPool;