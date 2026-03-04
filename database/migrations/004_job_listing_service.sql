-- Migration script for job listing service tables
-- This script creates the necessary tables for job listings and applications

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    company_id UUID NOT NULL,
    location VARCHAR(100) NOT NULL,
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'remote')),
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    experience_level VARCHAR(20) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    skills JSONB DEFAULT '[]',
    remote BOOLEAN DEFAULT false,
    benefits JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    cover_letter TEXT,
    resume TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interview', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_listings_company_id ON job_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_location ON job_listings(location);
CREATE INDEX IF NOT EXISTS idx_job_listings_employment_type ON job_listings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_listings_experience_level ON job_listings(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_created_at ON job_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_job_listings_remote ON job_listings(remote);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for job_listings table
DROP TRIGGER IF EXISTS update_job_listings_updated_at ON job_listings;
CREATE TRIGGER update_job_listings_updated_at
    BEFORE UPDATE ON job_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for job_applications table
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE job_listings IS 'Stores job listings posted by companies';
COMMENT ON COLUMN job_listings.title IS 'Job title';
COMMENT ON COLUMN job_listings.description IS 'Detailed job description';
COMMENT ON COLUMN job_listings.company_id IS 'ID of the company posting the job';
COMMENT ON COLUMN job_listings.location IS 'Job location';
COMMENT ON COLUMN job_listings.employment_type IS 'Type of employment (full-time, part-time, etc.)';
COMMENT ON COLUMN job_listings.salary_min IS 'Minimum salary for the position';
COMMENT ON COLUMN job_listings.salary_max IS 'Maximum salary for the position';
COMMENT ON COLUMN job_listings.experience_level IS 'Required experience level';
COMMENT ON COLUMN job_listings.skills IS 'Required skills as JSON array';
COMMENT ON COLUMN job_listings.remote IS 'Whether the job is remote';
COMMENT ON COLUMN job_listings.benefits IS 'Job benefits as JSON array';
COMMENT ON COLUMN job_listings.status IS 'Current status of the job listing';
COMMENT ON COLUMN job_listings.created_by IS 'ID of the user who created the listing';

COMMENT ON TABLE job_applications IS 'Stores job applications from users';
COMMENT ON COLUMN job_applications.job_id IS 'ID of the job being applied to';
COMMENT ON COLUMN job_applications.user_id IS 'ID of the user applying';
COMMENT ON COLUMN job_applications.cover_letter IS 'Cover letter text';
COMMENT ON COLUMN job_applications.resume IS 'Resume file path or URL';
COMMENT ON COLUMN job_applications.status IS 'Current status of the application';

-- Grant necessary permissions (adjust as needed for your security setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON job_listings TO talentsphere_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_applications TO talentsphere_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO talentsphere_user;