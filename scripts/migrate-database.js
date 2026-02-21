#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Database Migration Runner for TalentSphere
 * Handles database schema creation and versioning
 */

class MigrationRunner {
  constructor() {
    this.pool = null;
    this.migrationsPath = path.join(__dirname, '..', 'database', 'migrations');
    this.lockTableName = 'migration_locks';
    this.migrationTableName = 'schema_migrations';
  }

  /**
   * Initialize database connection
   */
  async connect() {
    try {
      console.log('🔌 Connecting to database...');
      
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Initialize migration tables
   */
  async initMigrationTables() {
    console.log('🏗️  Initializing migration tables...');
    
    const client = await this.pool.connect();
    
    try {
      // Create migration lock table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.lockTableName} (
          id SERIAL PRIMARY KEY,
          lock_name VARCHAR(255) UNIQUE NOT NULL,
          locked_at TIMESTAMP DEFAULT NOW(),
          locked_by VARCHAR(255),
          CONSTRAINT positive_lock CHECK (id > 0)
        );
      `);

      // Create migrations history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          applied_at TIMESTAMP DEFAULT NOW(),
          execution_time_ms INTEGER,
          checksum VARCHAR(64)
        );
      `);

      console.log('✅ Migration tables initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration tables:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Acquire migration lock
   */
  async acquireLock() {
    console.log('🔒 Acquiring migration lock...');
    
    const client = await this.pool.connect();
    
    try {
      const lockName = 'talentsphere_migrations';
      
      // Try to acquire lock
      const result = await client.query(`
        INSERT INTO ${this.lockTableName} (lock_name, locked_by) 
        VALUES ($1, $2) 
        ON CONFLICT (lock_name) DO NOTHING
        RETURNING id
      `, [lockName, process.env.USER || 'migration_runner']);

      if (result.rows.length === 0) {
        // Lock already exists, check if it's stale
        const lockInfo = await client.query(`
          SELECT locked_at, locked_by FROM ${this.lockTableName} 
          WHERE lock_name = $1
        `, [lockName]);

        if (lockInfo.rows.length > 0) {
          const lockAge = Date.now() - new Date(lockInfo.rows[0].locked_at).getTime();
          const staleThreshold = 30 * 60 * 1000; // 30 minutes

          if (lockAge > staleThreshold) {
            console.log('⚠️  Stale lock detected, removing it...');
            await client.query('DELETE FROM migration_locks WHERE lock_name = $1', [lockName]);
            
            // Try again
            const retryResult = await client.query(`
              INSERT INTO ${this.lockTableName} (lock_name, locked_by) 
              VALUES ($1, $2) 
              RETURNING id
            `, [lockName, process.env.USER || 'migration_runner']);

            if (retryResult.rows.length === 0) {
              throw new Error('Failed to acquire migration lock after retry');
            }
          } else {
            throw new Error('Migration lock is held by another process');
          }
        }
      }

      console.log('✅ Migration lock acquired');
    } catch (error) {
      console.error('❌ Failed to acquire migration lock:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release migration lock
   */
  async releaseLock() {
    console.log('🔓 Releasing migration lock...');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('DELETE FROM migration_locks WHERE lock_name = $1', ['talentsphere_migrations']);
      console.log('✅ Migration lock released');
    } catch (error) {
      console.error('❌ Failed to release migration lock:', error.message);
      // Don't throw here, as migration was likely successful
    } finally {
      client.release();
    }
  }

  /**
   * Get list of migration files
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => ({
          filename: file,
          version: path.basename(file, '.sql'),
          path: path.join(this.migrationsPath, file)
        }));

      return migrationFiles;
    } catch (error) {
      console.error('❌ Failed to read migration files:', error.message);
      throw error;
    }
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations() {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT version FROM schema_migrations ORDER BY applied_at');
      return result.rows.map(row => row.version);
    } catch (error) {
      console.error('❌ Failed to get applied migrations:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migrationFile) {
    console.log(`🔄 Applying migration: ${migrationFile.filename}`);
    
    const client = await this.pool.connect();
    const startTime = Date.now();
    
    try {
      // Read migration file
      const migrationContent = await fs.readFile(migrationFile.path, 'utf8');
      
      // Calculate checksum
      const crypto = require('crypto');
      const checksum = crypto.createHash('sha256').update(migrationContent).digest('hex');
      
      // Begin transaction
      await client.query('BEGIN');
      
      try {
        // Execute migration
        await client.query(migrationContent);
        
        // Record migration
        const executionTime = Date.now() - startTime;
        await client.query(`
          INSERT INTO ${this.migrationTableName} (version, execution_time_ms, checksum)
          VALUES ($1, $2, $3)
        `, [migrationFile.version, executionTime, checksum]);
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`✅ Migration ${migrationFile.filename} applied successfully (${executionTime}ms)`);
      } catch (migrationError) {
        // Rollback on error
        await client.query('ROLLBACK');
        throw migrationError;
      }
    } catch (error) {
      console.error(`❌ Failed to apply migration ${migrationFile.filename}:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    try {
      console.log('🚀 Starting database migration...');
      
      // Connect to database
      await this.connect();
      
      // Initialize migration tables
      await this.initMigrationTables();
      
      // Acquire lock
      await this.acquireLock();
      
      try {
        // Get migration files
        const migrationFiles = await this.getMigrationFiles();
        
        // Get applied migrations
        const appliedMigrations = await getAppliedMigrations();
        
        // Find pending migrations
        const pendingMigrations = migrationFiles.filter(
          file => !appliedMigrations.includes(file.version)
        );
        
        if (pendingMigrations.length === 0) {
          console.log('✅ No pending migrations');
          return { success: true, message: 'No pending migrations' };
        }
        
        console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
        
        // Apply pending migrations
        for (const migration of pendingMigrations) {
          await this.applyMigration(migration);
        }
        
        console.log('🎉 All migrations applied successfully');
        return { 
          success: true, 
          message: `Applied ${pendingMigrations.length} migrations successfully` 
        };
        
      } finally {
        // Always release lock
        await this.releaseLock();
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      // Close connection
      if (this.pool) {
        await this.pool.end();
      }
    }
  }

  /**
   * Get migration status
   */
  async status() {
    try {
      await this.connect();
      await this.initMigrationTables();
      
      const migrationFiles = await this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      const status = migrationFiles.map(file => ({
        version: file.version,
        filename: file.filename,
        applied: appliedMigrations.includes(file.version),
        status: appliedMigrations.includes(file.version) ? 'Applied' : 'Pending'
      }));
      
      return status;
    } catch (error) {
      console.error('❌ Failed to get migration status:', error.message);
      throw error;
    } finally {
      if (this.pool) {
        await this.pool.end();
      }
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const runner = new MigrationRunner();

  switch (command) {
    case 'migrate':
      await runner.migrate();
      break;
      
    case 'status':
      const status = await runner.status();
      console.table(status);
      break;
      
    default:
      console.log(`
📋 TalentSphere Migration Runner

Usage:
  node migrate.js migrate    - Run pending migrations
  node migrate.js status     - Show migration status

Environment variables required:
  DATABASE_URL               - PostgreSQL connection string

Examples:
  DATABASE_URL=postgresql://user:pass@localhost:5432/talentsphere node migrate.js migrate
  DATABASE_URL=postgresql://user:pass@localhost:5432/talentsphere node migrate.js status
      `);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Migration runner failed:', error);
    process.exit(1);
  });
}

module.exports = MigrationRunner;