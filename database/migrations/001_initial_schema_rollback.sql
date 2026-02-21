-- TalentSphere Database Rollback Script
-- Reverses changes from migration 001_initial_schema.sql

-- Drop tables in reverse order of creation to respect foreign key constraints
DROP TABLE IF EXISTS search_analytics CASCADE;
DROP TABLE IF EXISTS user_analytics CASCADE;
DROP TABLE IF EXISTS job_analytics CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS job_views CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop extensions
DROP EXTENSION IF EXISTS "unaccent";
DROP EXTENSION IF EXISTS "pg_trgm";
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Success message
DO $$
BEGIN;
    RAISE NOTICE 'TalentSphere database rollback completed successfully';
    RAISE NOTICE 'All tables and extensions dropped';
END;
$$;