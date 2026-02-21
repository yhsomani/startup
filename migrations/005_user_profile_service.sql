-- Migration script for user profile service tables
-- This script creates the necessary tables for user profiles, skills, experiences, and educations

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    headline VARCHAR(200),
    summary TEXT,
    location VARCHAR(100),
    industry VARCHAR(100),
    profile_picture VARCHAR(500),
    cover_photo VARCHAR(500),
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_experiences table
CREATE TABLE IF NOT EXISTS user_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_educations table
CREATE TABLE IF NOT EXISTS user_educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    institution VARCHAR(200) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    grade VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_industry ON user_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_user_skills_profile_id ON user_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_name ON user_skills(name);
CREATE INDEX IF NOT EXISTS idx_user_skills_level ON user_skills(level);

CREATE INDEX IF NOT EXISTS idx_user_experiences_profile_id ON user_experiences(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_experiences_company ON user_experiences(company);
CREATE INDEX IF NOT EXISTS idx_user_experiences_start_date ON user_experiences(start_date);
CREATE INDEX IF NOT EXISTS idx_user_experiences_is_current ON user_experiences(is_current);

CREATE INDEX IF NOT EXISTS idx_user_educations_profile_id ON user_educations(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_educations_institution ON user_educations(institution);
CREATE INDEX IF NOT EXISTS idx_user_educations_degree ON user_educations(degree);
CREATE INDEX IF NOT EXISTS idx_user_educations_start_date ON user_educations(start_date);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for user_profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for user_skills table
DROP TRIGGER IF EXISTS update_user_skills_updated_at ON user_skills;
CREATE TRIGGER update_user_skills_updated_at
    BEFORE UPDATE ON user_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for user_experiences table
DROP TRIGGER IF EXISTS update_user_experiences_updated_at ON user_experiences;
CREATE TRIGGER update_user_experiences_updated_at
    BEFORE UPDATE ON user_experiences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for user_educations table
DROP TRIGGER IF EXISTS update_user_educations_updated_at ON user_educations;
CREATE TRIGGER update_user_educations_updated_at
    BEFORE UPDATE ON user_educations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores user profile information';
COMMENT ON COLUMN user_profiles.user_id IS 'ID of the user this profile belongs to';
COMMENT ON COLUMN user_profiles.first_name IS 'User first name';
COMMENT ON COLUMN user_profiles.last_name IS 'User last name';
COMMENT ON COLUMN user_profiles.headline IS 'Professional headline';
COMMENT ON COLUMN user_profiles.summary IS 'Professional summary';
COMMENT ON COLUMN user_profiles.location IS 'User location';
COMMENT ON COLUMN user_profiles.industry IS 'Professional industry';
COMMENT ON COLUMN user_profiles.profile_picture IS 'URL to profile picture';
COMMENT ON COLUMN user_profiles.cover_photo IS 'URL to cover photo';
COMMENT ON COLUMN user_profiles.social_links IS 'Social media links as JSON object';

COMMENT ON TABLE user_skills IS 'Stores user skills and proficiency levels';
COMMENT ON COLUMN user_skills.profile_id IS 'ID of the profile this skill belongs to';
COMMENT ON COLUMN user_skills.name IS 'Skill name';
COMMENT ON COLUMN user_skills.level IS 'Proficiency level (beginner, intermediate, advanced, expert)';

COMMENT ON TABLE user_experiences IS 'Stores user work experience';
COMMENT ON COLUMN user_experiences.profile_id IS 'ID of the profile this experience belongs to';
COMMENT ON COLUMN user_experiences.company IS 'Company name';
COMMENT ON COLUMN user_experiences.title IS 'Job title';
COMMENT ON COLUMN user_experiences.location IS 'Job location';
COMMENT ON COLUMN user_experiences.start_date IS 'Start date of employment';
COMMENT ON COLUMN user_experiences.end_date IS 'End date of employment (null if current)';
COMMENT ON COLUMN user_experiences.description IS 'Job description';
COMMENT ON COLUMN user_experiences.is_current IS 'Whether this is the current job';

COMMENT ON TABLE user_educations IS 'Stores user education history';
COMMENT ON COLUMN user_educations.profile_id IS 'ID of the profile this education belongs to';
COMMENT ON COLUMN user_educations.institution IS 'Educational institution';
COMMENT ON COLUMN user_educations.degree IS 'Degree obtained';
COMMENT ON COLUMN user_educations.field_of_study IS 'Field of study';
COMMENT ON COLUMN user_educations.start_date IS 'Start date of education';
COMMENT ON COLUMN user_educations.end_date IS 'End date of education (null if ongoing)';
COMMENT ON COLUMN user_educations.grade IS 'Grade or GPA';
COMMENT ON COLUMN user_educations.description IS 'Additional details about education';

-- Grant necessary permissions (adjust as needed for your security setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO talentsphere_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_skills TO talentsphere_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_experiences TO talentsphere_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_educations TO talentsphere_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO talentsphere_user;