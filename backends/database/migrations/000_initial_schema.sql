-- TalentSphere Database Initialization
-- Main migration script for setting up database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For GIN indexes
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Run all migration files
\i backends/backend-enhanced/auth-service/migrations/001_create_users_table.sql
\i backends/backend-enhanced/user-service/migrations/001_create_user_tables.sql

-- Jobs tables
\i backends/database/migrations/001_create_jobs_table.sql

-- Companies tables
\i backends/database/migrations/002_create_companies_table.sql

-- Applications tables
\i backends/database/migrations/003_create_applications_table.sql

-- Network and messaging tables
\i backends/database/migrations/004_create_network_tables.sql

-- Notifications and analytics tables
\i backends/database/migrations/005_create_notifications_table.sql

-- Performance indexes
\i backends/database/migrations/006_create_performance_indexes.sql

COMMIT;

-- Log successful migration
DO $$
BEGIN
    INSERT INTO schema_migrations (migration_name, executed_at) 
    VALUES ('initial_schema', NOW()) 
    ON CONFLICT DO NOTHING;
END $$;