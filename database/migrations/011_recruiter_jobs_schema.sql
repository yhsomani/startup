-- Migration: Recruiter Jobs Schema Phase 3
-- Updates the existing jobs table to match PRD V1 schema for Recruiter Discovery & Job Matching

-- Create ENUMs if they do not exist
DO $$ BEGIN
    CREATE TYPE job_seniority_enum AS ENUM ('entry', 'mid', 'senior', 'lead');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status_enum AS ENUM ('active', 'closed', 'filled', 'draft');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS required_skill_proficiency JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS seniority_level job_seniority_enum,
ADD COLUMN IF NOT EXISTS experience_years_min INT,
ADD COLUMN IF NOT EXISTS job_status job_status_enum DEFAULT 'active',
ADD COLUMN IF NOT EXISTS applications_count INT DEFAULT 0;

-- Optionally, we can rename 'posted_by' to 'recruiter_id' or just use 'posted_by' as the recruiter.
-- For compatibility, we'll keep posted_by and make sure it references the user_id of a recruiter.

-- Create index for faster searching by required_skills using GIN
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_required_skills ON jobs USING GIN(required_skills);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_job_status ON jobs(job_status);
