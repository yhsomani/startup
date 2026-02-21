-- ==============================================
-- TalentSphere Database Schema Fixes
-- Migration: 003_fix_schema_inconsistencies.sql
-- Description: Fix duplicate columns, invalid syntax, and constraint issues
-- ==============================================

BEGIN;

-- Fix 1: Drop and recreate user_profiles table with correct constraints
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    bio TEXT,
    location JSONB,
    avatar_url VARCHAR(500),
    website VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    experience_level VARCHAR(50) DEFAULT 'entry' CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'executive')),
    job_title VARCHAR(200),
    industry VARCHAR(100),
    preferred_locations TEXT,
    remote_work BOOLEAN DEFAULT false,
    salary_expectation_min INTEGER CHECK (salary_expectation_min >= 0),
    salary_expectation_max INTEGER CHECK (salary_expectation_max >= salary_expectation_min),
    salary_currency VARCHAR(3) DEFAULT 'USD' CHECK (salary_currency ~* '^[A-Z]{3}$'),
    availability VARCHAR(50) DEFAULT 'immediately' CHECK (availability IN ('immediately', '1-2_weeks', '1_month', '2-3_months', '3+_months')),
    relocation VARCHAR(20) DEFAULT 'willing' CHECK (relocation IN ('willing', 'reluctant', 'unable')),
    skills JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fix 2: Update jobs table foreign key references (if jobs table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_views') THEN
        ALTER TABLE job_views 
        DROP CONSTRAINT IF EXISTS job_views_job_id_fkey,
        ADD CONSTRAINT job_views_job_id_fkey FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'application_views') THEN
        ALTER TABLE application_views 
        DROP CONSTRAINT IF EXISTS application_views_job_id_fkey,
        ADD CONSTRAINT application_views_job_id_fkey FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_jobs') THEN
        ALTER TABLE saved_jobs 
        DROP CONSTRAINT IF EXISTS saved_jobs_job_id_fkey,
        ADD CONSTRAINT saved_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES job_listings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix 3: Improve users table email validation with proper regex
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_email_valid,
    ADD CONSTRAINT users_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    DROP CONSTRAINT IF EXISTS users_phone_valid,
    ADD CONSTRAINT users_phone_valid CHECK (phone IS NULL OR phone ~* '^\+?[0-9\-\s\(\)]{10,20}$'),
    DROP CONSTRAINT IF EXISTS users_phone_length,
    ADD CONSTRAINT users_phone_length CHECK (phone IS NULL OR length(phone) BETWEEN 10 AND 20);

-- Fix 4: Add missing indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_experience_level_idx ON user_profiles(experience_level);
CREATE INDEX IF NOT EXISTS user_profiles_industry_idx ON user_profiles(industry);
CREATE INDEX IF NOT EXISTS user_profiles_remote_work_idx ON user_profiles(remote_work);

-- Fix 5: Add update timestamp trigger for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix 6: Create job_listings table if it doesn't exist (referenced by foreign keys)
CREATE TABLE IF NOT EXISTS job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    location JSONB,
    salary_min INTEGER CHECK (salary_min >= 0),
    salary_max INTEGER CHECK (salary_max >= salary_min),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    remote_work BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for job_listings
CREATE INDEX IF NOT EXISTS job_listings_company_id_idx ON job_listings(company_id);
CREATE INDEX IF NOT EXISTS job_listings_status_idx ON job_listings(status);
CREATE INDEX IF NOT EXISTS job_listings_salary_min_idx ON job_listings(salary_min);
CREATE INDEX IF NOT EXISTS job_listings_salary_max_idx ON job_listings(salary_max);
CREATE INDEX IF NOT EXISTS job_listings_remote_work_idx ON job_listings(remote_work);
CREATE INDEX IF NOT EXISTS job_listings_created_at_idx ON job_listings(created_at);

-- Add trigger for job_listings
DROP TRIGGER IF EXISTS update_job_listings_updated_at ON job_listings;
CREATE TRIGGER update_job_listings_updated_at
    BEFORE UPDATE ON job_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ==============================================
-- Migration Verification
-- ==============================================
DO $$
BEGIN
    -- Check that critical tables exist and have correct structure
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users'), 'Users table missing';
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles'), 'User profiles table missing';
    ASSERT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_listings'), 'Job listings table missing';
    
    -- Check constraints exist
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_email_valid'
    ), 'Email validation constraint missing';
    
    -- Check indexes exist
    ASSERT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_profiles' AND indexname = 'user_profiles_user_id_idx'
    ), 'User profiles index missing';
    
    RAISE NOTICE '✅ Migration 003 completed successfully';
END $$;