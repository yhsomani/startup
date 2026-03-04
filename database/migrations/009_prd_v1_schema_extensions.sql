-- Migration: PRD V1 Schema Extensions
-- Adds user_type, developer_profiles, and recruiter_profiles tables

-- 1. Create the new ENUM types
CREATE TYPE user_type_enum AS ENUM ('developer', 'recruiter');
CREATE TYPE skill_level_enum AS ENUM ('beginner', 'intermediate', 'advanced');

-- 2. Modify the users table to include user_type
ALTER TABLE users ADD COLUMN user_type user_type_enum;

-- Backfill existing data
UPDATE users SET user_type = 'developer' WHERE role = 'employee' OR role = 'admin';
UPDATE users SET user_type = 'recruiter' WHERE role = 'hr';

-- Set default for future inserts
ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'developer';

-- 3. Create developer_profiles table
CREATE TABLE IF NOT EXISTS developer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  desired_role VARCHAR(100),
  skill_level skill_level_enum,
  primary_language VARCHAR(50),
  secondary_languages TEXT[] DEFAULT '{}',
  bio VARCHAR(500),
  github_url VARCHAR(500),
  profile_completeness_percent INT DEFAULT 0,
  is_open_to_recruiting BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create recruiter_profiles table
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  company_domain VARCHAR(255) NOT NULL,
  company_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255) UNIQUE,
  verification_token_expires_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  job_title VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_developer_profiles_skill_level ON developer_profiles(skill_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recruiter_profiles_company_domain ON recruiter_profiles(company_domain);

-- Backfill existing developer profiles
INSERT INTO developer_profiles (user_id, display_name, bio)
SELECT id, first_name || ' ' || last_name, bio
FROM users
WHERE user_type = 'developer'
ON CONFLICT DO NOTHING;

-- Backfill existing recruiter profiles
INSERT INTO recruiter_profiles (user_id, company_name, company_domain, company_verified)
SELECT u.id, c.name, COALESCE(REGEXP_REPLACE(c.website, '^https?://(?:www\.)?', ''), 'example.com'), true
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE u.user_type = 'recruiter'
ON CONFLICT DO NOTHING;
