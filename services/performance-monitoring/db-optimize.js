#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Comprehensive Database Optimization Script
 * Optimizes database queries for search and filtering performance
 */

class DatabaseOptimizer {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://localhost/talentsphere',
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.optimizationLog = [];
    }

    async connect() {
        try {
            await this.pool.query('SELECT 1');
            console.log('✅ Connected to database successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            return false;
        }
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${type}: ${message}`;
        this.optimizationLog.push(logEntry);
        console.log(logEntry);
    }

    async executeOptimization(query, description) {
        try {
            this.log(`Executing: ${description}`);
            const result = await this.pool.query(query);
            this.log(`✅ Success: ${description}`, 'SUCCESS');
            return { success: true, result, description };
        } catch (error) {
            this.log(`❌ Failed: ${description} - ${error.message}`, 'ERROR');
            return { success: false, error: error.message, description };
        }
    }

    async optimizeTables() {
        this.log('Starting table optimization...');

        const optimizations = [
            // ANALYZE all tables to update statistics
            {
                query: 'ANALYZE;',
                description: 'Update table statistics for query planner'
            },

            // VACUUM to reclaim storage
            {
                query: 'VACUUM ANALYZE;',
                description: 'Reclaim storage and update statistics'
            }
        ];

        const results = [];
        for (const opt of optimizations) {
            const result = await this.executeOptimization(opt.query, opt.description);
            results.push(result);
        }

        return results;
    }

    async createSearchIndexes() {
        this.log('Creating search optimization indexes...');

        const searchIndexes = [
            // Jobs table indexes
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_gin 
          ON jobs USING gin(to_tsvector('english', title));
        `,
                description: 'Full-text search index on job titles'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_description_gin 
          ON jobs USING gin(to_tsvector('english', description));
        `,
                description: 'Full-text search index on job descriptions'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_combined_search 
          ON jobs USING gin(
            to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
          );
        `,
                description: 'Combined full-text search index'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location_btree 
          ON jobs (location);
        `,
                description: 'B-tree index on job location'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_range 
          ON jobs (min_salary, max_salary);
        `,
                description: 'Index for salary range queries'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_status 
          ON jobs (company_id, status);
        `,
                description: 'Composite index for company job listings'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at_desc 
          ON jobs (created_at DESC);
        `,
                description: 'Index for recent job sorting'
            },

            // Users table indexes
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique 
          ON users (email);
        `,
                description: 'Unique index on user emails'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username 
          ON users (username);
        `,
                description: 'Index on usernames'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status 
          ON users (role, status);
        `,
                description: 'Composite index for user filtering'
            },

            // User profiles indexes
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id 
          ON user_profiles (user_id);
        `,
                description: 'Index on profile user IDs'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_completion 
          ON user_profiles (completion_percentage);
        `,
                description: 'Index for profile completion filtering'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location 
          ON user_profiles (location);
        `,
                description: 'Index on user locations'
            },

            // Applications table indexes
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_user 
          ON applications (job_id, user_id);
        `,
                description: 'Composite index for application lookups'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status_date 
          ON applications (status, created_at);
        `,
                description: 'Index for application status and date filtering'
            },

            // Companies table indexes
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_gin 
          ON companies USING gin(to_tsvector('english', name));
        `,
                description: 'Full-text search index on company names'
            },
            {
                query: `
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_industry 
          ON companies (industry);
        `,
                description: 'Index on company industries'
            }
        ];

        const results = [];
        for (const index of searchIndexes) {
            const result = await this.executeOptimization(index.query, index.description);
            results.push(result);

            // Brief pause between concurrent index creations
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return results;
    }

    async createMaterializedViews() {
        this.log('Creating materialized views for performance...');

        const materializedViews = [
            {
                query: `
          CREATE MATERIALIZED VIEW IF NOT EXISTS mv_job_search_stats AS
          SELECT 
            j.company_id,
            c.name as company_name,
            COUNT(j.id) as total_jobs,
            COUNT(CASE WHEN j.status = 'active' THEN 1 END) as active_jobs,
            AVG(j.min_salary) as avg_min_salary,
            AVG(j.max_salary) as avg_max_salary,
            MAX(j.created_at) as latest_job_posted
          FROM jobs j
          JOIN companies c ON j.company_id = c.id
          GROUP BY j.company_id, c.name
          ORDER BY total_jobs DESC;
        `,
                description: 'Materialized view for job statistics by company'
            },
            {
                query: `
          CREATE INDEX IF NOT EXISTS idx_mv_job_search_stats_company 
          ON mv_job_search_stats (company_id);
        `,
                description: 'Index for materialized view'
            }
        ];

        const results = [];
        for (const view of materializedViews) {
            const result = await this.executeOptimization(view.query, view.description);
            results.push(result);
        }

        return results;
    }

    async optimizeConfiguration() {
        this.log('Checking and optimizing database configuration...');

        const configChecks = [
            {
                query: `
          SHOW shared_buffers;
        `,
                description: 'Check shared buffers setting'
            },
            {
                query: `
          SHOW work_mem;
        `,
                description: 'Check work memory setting'
            },
            {
                query: `
          SHOW maintenance_work_mem;
        `,
                description: 'Check maintenance work memory setting'
            }
        ];

        const results = [];
        for (const check of configChecks) {
            const result = await this.executeOptimization(check.query, check.description);
            results.push(result);
        }

        return results;
    }

    async generateOptimizationReport() {
        this.log('Generating optimization report...');

        const reportQueries = [
            // Index usage statistics
            {
                query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
          FROM pg_stat_user_indexes
          JOIN pg_index USING (indexrelid)
          WHERE schemaname = 'public'
          ORDER BY idx_scan DESC NULLS LAST
          LIMIT 20;
        `,
                description: 'Index usage statistics'
            },

            // Table bloat analysis
            {
                query: `
          SELECT 
            schemaname,
            tablename,
            ROUND((100 * (psut.n_tup_ins + psut.n_tup_upd + psut.n_tup_del)::float / 
                  GREATEST(psut.n_tup_ins + psut.n_tup_upd + psut.n_tup_del + psut.n_tup_hot_upd, 1))::numeric, 2) as pct_dead_tuple,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
          FROM pg_stat_user_tables psut
          WHERE psut.n_tup_ins + psut.n_tup_upd + psut.n_tup_del > 0
          ORDER BY pct_dead_tuple DESC
          LIMIT 10;
        `,
                description: 'Table bloat analysis'
            },

            // Missing index suggestions
            {
                query: `
          SELECT 
            schemaname,
            tablename,
            attname,
            n_tup_upd + n_tup_ins + n_tup_del as total_writes,
            CASE 
              WHEN n_tup_upd + n_tup_ins + n_tup_del > 1000 
              THEN 'Consider indexing for frequent updates'
              ELSE 'Low write frequency'
            END as recommendation
          FROM pg_stat_user_tables
          JOIN pg_attribute ON attrelid = relid
          WHERE attnum > 0 AND NOT attisdropped
          ORDER BY total_writes DESC
          LIMIT 15;
        `,
                description: 'Missing index recommendations'
            }
        ];

        const report = {};
        for (const rpt of reportQueries) {
            try {
                const result = await this.pool.query(rpt.query);
                report[rpt.description] = result.rows;
            } catch (error) {
                report[rpt.description] = { error: error.message };
            }
        }

        return report;
    }

    async saveReport(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-optimization-report-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);

        try {
            await fs.writeFile(filepath, JSON.stringify({
                timestamp: new Date().toISOString(),
                log: this.optimizationLog,
                report: report
            }, null, 2));

            this.log(`Report saved to: ${filepath}`);
            return filepath;
        } catch (error) {
            this.log(`Failed to save report: ${error.message}`, 'ERROR');
            return null;
        }
    }

    async runFullOptimization() {
        this.log('=== Starting Comprehensive Database Optimization ===');

        // Connect to database
        const connected = await this.connect();
        if (!connected) {
            process.exit(1);
        }

        try {
            // Run all optimization phases
            const tableResults = await this.optimizeTables();
            const indexResults = await this.createSearchIndexes();
            const viewResults = await this.createMaterializedViews();
            const configResults = await this.optimizeConfiguration();

            // Generate final report
            const report = await this.generateOptimizationReport();

            // Save report
            const reportPath = await this.saveReport(report);

            this.log('=== Database Optimization Complete ===');
            this.log(`Summary:`);
            this.log(`- Tables optimized: ${tableResults.filter(r => r.success).length}/${tableResults.length}`);
            this.log(`- Indexes created: ${indexResults.filter(r => r.success).length}/${indexResults.length}`);
            this.log(`- Materialized views: ${viewResults.filter(r => r.success).length}/${viewResults.length}`);
            this.log(`- Report saved to: ${reportPath || 'N/A'}`);

        } catch (error) {
            this.log(`Optimization failed: ${error.message}`, 'ERROR');
        } finally {
            await this.pool.end();
        }
    }
}

// Run optimization if script is executed directly
if (require.main === module) {
    const optimizer = new DatabaseOptimizer();
    optimizer.runFullOptimization().catch(console.error);
}

module.exports = DatabaseOptimizer;