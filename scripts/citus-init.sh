#!/bin/bash
set -e

COORDINATOR_HOST="${CITUS_COORDINATOR_HOST:-localhost}"
COORDINATOR_PORT="${CITUS_COORDINATOR_PORT:-5432}"
COORDINATOR_USER="${POSTGRES_USER:-postgres}"
COORDINATOR_DB="${POSTGRES_DB:-talentsphere}"

echo "Waiting for Citus coordinator to be ready..."
until PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" -c "SELECT 1" > /dev/null 2>&1; do
  sleep 2
done
echo "Coordinator is ready!"

echo "Creating Citus extension..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
CREATE EXTENSION IF NOT EXISTS citus;

-- Enable sequence to be globally accessible
ALTER EXTENSION citus UPDATE;

-- Verify Citus version
SELECT citus_version();
EOF

echo "Adding worker nodes..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
SELECT * FROM citus_get_active_worker_nodes();
EOF

WORKER_1="${CITUS_WORKER_1:-citus-worker-0}"
WORKER_2="${CITUS_WORKER_2:-citus-worker-1}"
WORKER_3="${CITUS_WORKER_3:-citus-worker-2}"

PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
SELECT citus_add_node('$WORKER_1', 5432);
SELECT citus_add_node('$WORKER_2', 5432);
SELECT citus_add_node('$WORKER_3', 5432);
EOF

echo "Verifying cluster..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
SELECT * FROM citus_get_active_worker_nodes();
EOF

echo "Creating reference tables (replicated across all nodes)..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
-- Reference tables (replicated - good for small, frequently joined tables)

-- Skills reference table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    proficiency VARCHAR(20) DEFAULT 'beginner',
    years_experience INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_reference_table('skills');

-- Languages reference table
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    proficiency_level VARCHAR(20) DEFAULT 'beginner'
);
SELECT create_reference_table('languages');

-- Companies reference table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(500),
    description TEXT,
    logo_url VARCHAR(500),
    rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_reference_table('companies');

-- Job listings reference
CREATE TABLE job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements JSONB,
    responsibilities JSONB,
    location JSONB,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    employment_type VARCHAR(50),
    experience_level VARCHAR(50),
    skills_required JSONB DEFAULT '[]',
    benefits JSONB DEFAULT '[]',
    is_remote BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);
SELECT create_reference_table('job_listings');
EOF

echo "Creating distributed tables (sharded by user_id)..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
-- User data distributed by user_id (co-located for joins)

-- Users table - sharded by user id
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 hour',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('users', 'id', shard_count => 32);

-- User profiles - co-located with users
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    bio TEXT,
    location JSONB,
    avatar_url VARCHAR(500),
    website VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    experience_level VARCHAR(50) DEFAULT 'entry',
    job_title VARCHAR(200),
    industry VARCHAR(100),
    preferred_locations TEXT,
    remote_work BOOLEAN DEFAULT false,
    salary_expectation_min INTEGER,
    salary_expectation_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    availability VARCHAR(50) DEFAULT 'immediately',
    relocation VARCHAR(20) DEFAULT 'willing',
    skills JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('user_profiles', 'user_id', colocate_with => 'users');

-- User skills - co-located with users
CREATE TABLE user_skills (
    user_id UUID NOT NULL,
    skill_id UUID NOT NULL,
    years_experience INTEGER NOT NULL,
    proficiency VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id)
);
SELECT create_distributed_table('user_skills', 'user_id', colocate_with => 'users');

-- Experiences - co-located with users
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company VARCHAR(200),
    position VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    current BOOLEAN DEFAULT true,
    description TEXT,
    achievements JSONB DEFAULT '[]',
    technologies_used JSONB DEFAULT '[]',
    team_size INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('experiences', 'user_id', colocate_with => 'users');

-- Education - co-located with users
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    institution VARCHAR(200) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    gpa DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('education', 'user_id', colocate_with => 'users');

-- User languages - co-located with users
CREATE TABLE user_languages (
    user_id UUID NOT NULL,
    language_id UUID NOT NULL,
    proficiency VARCHAR(20) DEFAULT 'beginner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, language_id)
);
SELECT create_distributed_table('user_languages', 'user_id', colocate_with => 'users');

-- Certifications - co-located with users
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verification_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('certifications', 'user_id', colocate_with => 'users');

-- User certifications - co-located with users
CREATE TABLE user_certifications (
    user_id UUID NOT NULL,
    certification_id UUID NOT NULL,
    earned_date DATE NOT NULL,
    expiry_date DATE,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, certification_id)
);
SELECT create_distributed_table('user_certifications', 'user_id', colocate_with => 'users');

-- Referrals - co-located with users
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referred_id UUID,
    referral_code VARCHAR(20) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    reward_credits DECIMAL(10,0) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('referrals', 'referrer_id', colocate_with => 'users');
EOF

echo "Creating time-series distributed tables..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
-- Time-series tables - distributed by time for efficient time-range queries

-- User activities - sharded by timestamp (range)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('user_activities', 'timestamp', 
    shard_count => 64, 
    shard_max_size => 1024);

-- Events - sharded by timestamp (high volume)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    source_service VARCHAR(50) NOT NULL,
    user_id UUID,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) DEFAULT 'info',
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('events', 'timestamp', 
    shard_count => 64, 
    shard_max_size => 2048);

-- Job views - sharded by viewed_at time
CREATE TABLE job_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    user_id UUID,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    referrer VARCHAR(200),
    user_agent VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('job_views', 'viewed_at', 
    shard_count => 32);

-- Application views - sharded by viewed_at time
CREATE TABLE application_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    user_id UUID NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('application_views', 'viewed_at', 
    shard_count => 32);

-- Search history - sharded by timestamp
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    search_query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    clicked_result_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('search_history', 'created_at', 
    shard_count => 32);

-- User analytics - sharded by user_id for quick lookups
CREATE TABLE user_analytics (
    user_id UUID PRIMARY KEY,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_sessions INTEGER DEFAULT 0,
    session_duration_avg DECIMAL(8,2) DEFAULT 0,
    pages_viewed INTEGER DEFAULT 0,
    time_on_site_seconds INTEGER DEFAULT 0,
    device_types JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
SELECT create_distributed_table('user_analytics', 'user_id', 
    colocate_with => 'users');
EOF

echo "Creating indexes..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
-- Indexes on reference tables
CREATE INDEX IF NOT EXISTS skills_name_idx ON skills(name);
CREATE INDEX IF NOT EXISTS languages_code_idx ON languages(code);
CREATE INDEX IF NOT EXISTS companies_industry_idx ON companies(industry);
CREATE INDEX IF NOT EXISTS companies_rating_idx ON companies(rating);

-- Indexes on distributed tables
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS users_active_idx ON users(is_active);

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_job_title_idx ON user_profiles(job_title);
CREATE INDEX IF NOT EXISTS user_profiles_experience_idx ON user_profiles(experience_level);

CREATE INDEX IF NOT EXISTS user_skills_skill_id_idx ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS experiences_company_idx ON experiences(company);
CREATE INDEX IF NOT EXISTS experiences_position_idx ON experiences(position);
CREATE INDEX IF NOT EXISTS experiences_start_date_idx ON experiences(start_date);

CREATE INDEX IF NOT EXISTS education_institution_idx ON education(institution);
CREATE INDEX IF NOT EXISTS education_field_idx ON education(field_of_study);

CREATE INDEX IF NOT EXISTS certifications_user_id_idx ON certifications(user_id);
CREATE INDEX IF NOT EXISTS certifications_verification_idx ON certifications(verification_status);

CREATE INDEX IF NOT EXISTS user_activities_user_id_idx ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS user_activities_type_idx ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS user_activities_entity_idx ON user_activities(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS events_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_source_idx ON events(source_service);
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);

CREATE INDEX IF NOT EXISTS job_views_job_id_idx ON job_views(job_id);
CREATE INDEX IF NOT EXISTS application_views_job_id_idx ON application_views(job_id);

CREATE INDEX IF NOT EXISTS search_history_user_idx ON search_history(user_id);
EOF

echo "Setting up shard rebalancing..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
-- Enable automatic shard rebalancing
SELECT citus_set_coordinator_host('citus-coordinator', 5432);
EOF

echo "Verifying cluster status..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$COORDINATOR_HOST" -p "$COORDINATOR_PORT" -U "$COORDINATOR_USER" -d "$COORDINATOR_DB" <<EOF
-- Show cluster health
SELECT * FROM citus_get_active_worker_nodes();
SELECT * FROM citus_shards;
SELECT citus_total_relation_shards('users');
SELECT citus_total_relation_shards('events');
EOF

echo "Citus sharding setup complete!"
