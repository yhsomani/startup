-- Migration: Add Performance Indexes
-- Description: Adds indexes to frequently queried columns in job_listings, job_applications, and user_profiles to improve search and filtering performance.

-- Job Listing Service
-- Filter by status (active/deleted)
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);

-- Filter by company_id (for company dashboard)
CREATE INDEX IF NOT EXISTS idx_job_listings_company_id ON job_listings(company_id);

-- Sort by created_at (default sort order)
CREATE INDEX IF NOT EXISTS idx_job_listings_created_at ON job_listings(created_at DESC);

-- Composite index for common search pattern: active jobs sorted by date
CREATE INDEX IF NOT EXISTS idx_job_listings_status_created_at ON job_listings(status, created_at DESC);

-- Filter by location
CREATE INDEX IF NOT EXISTS idx_job_listings_location ON job_listings(location);

-- Filter by employment_type
CREATE INDEX IF NOT EXISTS idx_job_listings_employment_type ON job_listings(employment_type);

-- Filter by experience_level
CREATE INDEX IF NOT EXISTS idx_job_listings_experience_level ON job_listings(experience_level);

-- Filter by remote
CREATE INDEX IF NOT EXISTS idx_job_listings_remote ON job_listings(remote);

-- Filter by salary range (min)
CREATE INDEX IF NOT EXISTS idx_job_listings_salary_min ON job_listings(salary_min);

-- Filter by salary range (max)
CREATE INDEX IF NOT EXISTS idx_job_listings_salary_max ON job_listings(salary_max);

-- Job Applications
-- Filter by job_id (to list applications for a job)
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);

-- Filter by user_id (to list applications by a user)
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);


-- User Profile Service
-- Fetch profile by user_id (auth checks)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- User Skills
-- Fetch skills by profile_id
CREATE INDEX IF NOT EXISTS idx_user_skills_profile_id ON user_skills(profile_id);

-- User Experiences
-- Fetch experiences by profile_id
CREATE INDEX IF NOT EXISTS idx_user_experiences_profile_id ON user_experiences(profile_id);

-- User Educations
-- Fetch educations by profile_id
CREATE INDEX IF NOT EXISTS idx_user_educations_profile_id ON user_educations(profile_id);
