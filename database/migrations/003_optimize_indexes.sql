-- TalentSphere Database Index Optimization
-- Remove redundant indexes and add missing performance indexes

-- Drop redundant and duplicate indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_duplicate;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_name_duplicate;
DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_company_duplicate;
DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_poster_duplicate;

-- Optimized Users Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique ON users (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company ON users (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users (is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_verified ON users (is_verified) WHERE is_verified = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created ON users (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users (last_login DESC) WHERE last_login IS NOT NULL;

-- Optimized Companies Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name ON companies (name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_industry ON companies (industry);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_size ON companies (size);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_active ON companies (is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_created ON companies (created_at DESC);

-- Optimized Jobs Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company ON jobs (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_poster ON jobs (posted_by) WHERE posted_by IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_type ON jobs (employment_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_range ON jobs (salary_min, salary_max);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created ON jobs (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_expires ON jobs (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active ON jobs (expires_at) WHERE expires_at > NOW();

-- Optimized Job Applications Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_user ON job_applications (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_job_status ON job_applications (job_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_applied ON job_applications (applied_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status ON job_applications (status);

-- Optimized Connections Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_user1 ON connections (user_id_1) WHERE user_id_1 IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_user2 ON connections (user_id_2) WHERE user_id_2 IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_status ON connections (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_updated ON connections (updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_pending ON connections (status, updated_at) WHERE status = 'pending';

-- Optimized Conversations Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_created_by ON conversations (created_by) WHERE created_by IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_created ON conversations (created_at DESC);

-- Optimized Messages Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages (conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender ON messages (sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created ON messages (created_at ASC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_type ON messages (type);

-- Optimized Notifications Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user ON notifications (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created ON notifications (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications (user_id, is_read, created_at) WHERE is_read = false;

-- Create composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_type ON jobs (company_id, employment_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_type ON jobs (salary_min, salary_max, employment_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location_type ON jobs (location, employment_type) WHERE location IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_status ON job_applications (user_id, status, applied_at);

-- Create partial indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_verified ON users (id, email, role) WHERE is_active = true AND is_verified = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_posted ON jobs (id, title, company_id) WHERE expires_at > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at) WHERE conversation_id IS NOT NULL;

-- Add foreign key constraints if missing
DO $$
BEGIN
    -- Add foreign key constraints with proper cascade handling
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_id_fkey;
    ALTER TABLE users ADD CONSTRAINT users_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
    
    ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_job_id_fkey;
    ALTER TABLE job_applications ADD CONSTRAINT job_applications_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    
    ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_user_id_fkey;
    ALTER TABLE job_applications ADD CONSTRAINT job_applications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_user_id_1_fkey;
    ALTER TABLE connections ADD CONSTRAINT connections_user_id_1_fkey 
        FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_user_id_2_fkey;
    ALTER TABLE connections ADD CONSTRAINT connections_user_id_2_fkey 
        FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_created_by_fkey;
    ALTER TABLE conversations ADD CONSTRAINT conversations_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_conversation_id_fkey;
    ALTER TABLE conversation_participants ADD CONSTRAINT conversation_participants_conversation_id_fkey 
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    
    ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS conversation_participants_user_id_fkey;
    ALTER TABLE conversation_participants ADD CONSTRAINT conversation_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
    ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
    
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
    ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Database index optimization and foreign key constraints completed successfully';
END;
$$;