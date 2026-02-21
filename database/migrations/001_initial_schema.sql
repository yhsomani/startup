-- TalentSphere Database Migration Script
-- Comprehensive database schema creation for PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    headline VARCHAR(200),
    bio TEXT,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    location JSONB,
    role VARCHAR(50) DEFAULT 'employee',
    permissions TEXT[] DEFAULT ARRAY['read'],
    company_id UUID REFERENCES companies(id),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search vector for users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search ON users 
USING GIN (to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(bio, '')));

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(500),
    headquarters VARCHAR(255),
    founded_year INTEGER,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search vector for companies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search ON companies 
USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(industry, '')));

-- Jobs table with full-text search
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL REFERENCES users(id),
    employment_type VARCHAR(50) DEFAULT 'full-time',
    experience_level VARCHAR(50) DEFAULT 'mid',
    location JSONB,
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) DEFAULT 'yearly',
    requirements TEXT[],
    benefits TEXT[],
    skills_required JSONB DEFAULT '[]',
    remote_type VARCHAR(50) DEFAULT 'onsite',
    deadline TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    application_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Full-text search vector
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            coalesce(title, '') || ' ' || 
            coalesce(description, '') || ' ' || 
            coalesce(employment_type, '') || ' ' || 
            coalesce(experience_level, '') || ' ' ||
            array_to_string(coalesce(requirements, ARRAY[]::text[]), ' ') || ' ' ||
            array_to_string(coalesce(benefits, ARRAY[]::text[]), ' ')
        )
    ) STORED
);

-- Jobs indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_is_featured ON jobs(is_featured);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_min ON jobs(salary_min);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_max ON jobs(salary_max);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search ON jobs USING GIN(search_vector);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills_required);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    cover_letter TEXT,
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    answers JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application indexes
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_unique ON job_applications(job_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at DESC);

-- Job views table for analytics
CREATE TABLE IF NOT EXISTS job_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job views indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at DESC);

-- Connections table for networking
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    message TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_connection UNIQUE (
        LEAST(user_id_1, user_id_2),
        GREATEST(user_id_1, user_id_2)
    )
);

-- Connections indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_user1 ON connections(user_id_1);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_user2 ON connections(user_id_2);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_updated_at ON connections(updated_at DESC);

-- Conversations table for messaging
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) DEFAULT '',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Analytics tables for performance monitoring
CREATE TABLE IF NOT EXISTS job_analytics (
    date DATE PRIMARY KEY,
    new_applications INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    viewed_applications INTEGER DEFAULT 0,
    interviewing_applications INTEGER DEFAULT 0,
    offers_made INTEGER DEFAULT 0,
    offers_accepted INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_analytics (
    date DATE PRIMARY KEY,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    job_applications INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_term TEXT NOT NULL,
    search_type VARCHAR(50),
    user_id UUID REFERENCES users(id),
    results_count INTEGER DEFAULT 0,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_analytics_searched_at ON search_analytics(searched_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_analytics_search_term ON search_analytics USING GIN(to_tsvector('english', search_term));

-- Insert sample data for testing
INSERT INTO companies (id, name, description, industry, size, founded_year, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440123', 'TechCorp Solutions', 'Leading technology company', 'Technology', 'Large', 2010, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO companies (id, name, description, industry, size, founded_year, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440124', 'StartupHub', 'Innovative startup building future of work', 'Technology', 'Small', 2020, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample users for testing
INSERT INTO users (id, email, password_hash, first_name, last_name, role, company_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440125', 'admin@talentsphere.com', '$2b$12$N...hash...', 'John', 'Doe', 'admin', '550e8400-e29b-41d4-a716-446655440123', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, role, company_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440126', 'hr@talentsphere.com', '$2b$12$N...hash...', 'Jane', 'Smith', 'hr', '550e8400-e29b-41d4-a716-446655440123', NOW())
ON CONFLICT DO NOTHING;

-- Insert sample jobs for testing
INSERT INTO jobs (id, title, description, company_id, posted_by, employment_type, location, salary_min, salary_max, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440127', 'Senior Frontend Developer', 'Looking for experienced frontend developer', '550e8400-e29b-41d4-a716-446655440123', 'full-time', 'Remote', 120000, 180000, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO jobs (id, title, description, company_id, posted_by, employment_type, location, salary_min, salary_max, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440128', 'Backend Developer', 'Backend developer position available', '550e8400-e29b-41d4-a716-446655440124', '550e8400-e29b-41d4-a716-446655440126', 'full-time', 'Remote', 90000, 130000, NOW())
ON CONFLICT DO NOTHING;

-- Create analytics entries
INSERT INTO job_analytics (date, new_applications, total_applications) VALUES 
(CURRENT_DATE, 0, 0)
ON CONFLICT (date) DO NOTHING;

INSERT INTO user_analytics (date, new_users, active_users) VALUES 
(CURRENT_DATE, 0, 0)
ON CONFLICT (date) DO NOTHING;

-- Success message
DO $$
BEGIN;
    RAISE NOTICE 'TalentSphere database migration completed successfully';
    RAISE NOTICE 'Tables created: users, companies, jobs, job_applications, job_views, connections, conversations, messages, notifications, job_analytics, user_analytics, search_analytics';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'Indexes created for performance optimization';
END;
$$;