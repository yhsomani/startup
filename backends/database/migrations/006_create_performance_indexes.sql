-- Performance optimization indexes and constraints

-- Additional indexes for frequently queried combinations

-- Jobs performance indexes
CREATE INDEX IF NOT EXISTS idx_jobs_active_posted_at ON jobs(is_active, posted_at DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_company_active ON jobs(company_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_location_experience ON jobs(location, experience_level) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_type_salary ON jobs(employment_type, salary_min) WHERE salary_min IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_expires_soon ON jobs(expires_at) WHERE expires_at > NOW() AND is_active = TRUE;

-- Companies performance indexes
CREATE INDEX IF NOT EXISTS idx_companies_active_verified ON companies(is_active, is_verified) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_companies_industry_size ON companies(industry, size);
CREATE INDEX IF NOT EXISTS idx_companies_founded_desc ON companies(founded_year DESC) WHERE founded_year IS NOT NULL;

-- Users performance indexes
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- Applications performance indexes
CREATE INDEX IF NOT EXISTS idx_applications_status_applied ON applications(status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_company_status ON applications(company_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_starred ON applications(is_starred) WHERE is_starred = TRUE;

-- Connections performance indexes
CREATE INDEX IF NOT EXISTS idx_connections_accepted ON connections(status, connected_at DESC) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_connections_user_connections ON GIN(
    ARRAY[requester_id, recipient_id]
);

-- Messages performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_unread ON messages(conversation_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_sender_unread ON messages(sender_id, is_deleted) WHERE is_deleted = FALSE;

-- Notifications performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_unread_urgent ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = FALSE AND (priority = 'high' OR priority = 'urgent');
CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(user_id, is_read, expires_at, created_at DESC)
WHERE expires_at IS NULL OR expires_at > NOW();

-- Partitioned tables for large datasets

-- User activities partitioning (by month for better performance)
CREATE TABLE IF NOT EXISTS user_activities_partitioned (
    LIKE user_activities INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for the current year
DO $$
DECLARE
    month_date DATE;
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    FOR month_date IN 
        SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'),
            DATE_TRUNC('month', CURRENT_DATE + INTERVAL '3 months'),
            '1 month'::INTERVAL
        )::date
    LOOP
        start_date := month_date;
        end_date := month_date + INTERVAL '1 month';
        table_name := 'user_activities_' || TO_CHAR(month_date, 'YYYY_MM');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF user_activities_partitioned
                       FOR VALUES FROM (%L) TO (%L)',
                       table_name, start_date, end_date);
    END LOOP;
END $$;

-- Search queries partitioning (by month)
CREATE TABLE IF NOT EXISTS search_queries_partitioned (
    LIKE search_queries INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
    month_date DATE;
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    FOR month_date IN 
        SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'),
            DATE_TRUNC('month', CURRENT_DATE + INTERVAL '3 months'),
            '1 month'::INTERVAL
        )::date
    LOOP
        start_date := month_date;
        end_date := month_date + INTERVAL '1 month';
        table_name := 'search_queries_' || TO_CHAR(month_date, 'YYYY_MM');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF search_queries_partitioned
                       FOR VALUES FROM (%L) TO (%L)',
                       table_name, start_date, end_date);
    END LOOP;
END $$;

-- Materialized views for expensive queries

-- Active job postings with company info
CREATE MATERIALIZED VIEW IF NOT EXISTS active_jobs_with_company AS
SELECT 
    j.id,
    j.title,
    j.description,
    j.location,
    j.employment_type,
    j.experience_level,
    j.salary_min,
    j.salary_max,
    j.posted_at,
    j.expires_at,
    j.skills_required,
    c.name as company_name,
    c.logo_url as company_logo,
    c.industry as company_industry,
    c.size as company_size
FROM jobs j
LEFT JOIN companies c ON j.company_id = c.id
WHERE j.is_active = TRUE 
AND (j.expires_at IS NULL OR j.expires_at > NOW())
AND c.is_active = TRUE;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_jobs_with_company_id 
ON active_jobs_with_company(id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_active_jobs_with_company()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_jobs_with_company;
END;
$$ LANGUAGE plpgsql;

-- User network summary
CREATE MATERIALIZED VIEW IF NOT EXISTS user_network_summary AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT CASE WHEN c.status = 'accepted' AND c.requester_id = u.id THEN c.recipient_id END) as connections_made,
    COUNT(DISTINCT CASE WHEN c.status = 'accepted' AND c.recipient_id = u.id THEN c.requester_id END) as connections_received,
    COUNT(DISTINCT CASE WHEN c.status = 'accepted' THEN 
        CASE WHEN c.requester_id = u.id THEN c.recipient_id ELSE c.requester_id END END
    ) as total_connections,
    COUNT(DISTINCT CASE WHEN c.status = 'pending' AND c.requester_id = u.id THEN c.recipient_id END) as pending_sent,
    COUNT(DISTINCT CASE WHEN c.status = 'pending' AND c.recipient_id = u.id THEN c.requester_id END) as pending_received
FROM users u
LEFT JOIN connections c ON (c.requester_id = u.id OR c.recipient_id = u.id)
GROUP BY u.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_network_summary_user_id 
ON user_network_summary(user_id);

-- Function to refresh network summary
CREATE OR REPLACE FUNCTION refresh_user_network_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_network_summary;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old data function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
DECLARE
    deleted_rows INTEGER;
BEGIN
    -- Clean up old notification reads (older than 90 days)
    DELETE FROM notification_reads 
    WHERE read_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RAISE LOG 'Cleaned up % old notification_read records', deleted_rows;
    
    -- Clean up old message reads (older than 180 days)
    DELETE FROM message_reads 
    WHERE read_at < NOW() - INTERVAL '180 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RAISE LOG 'Cleaned up % old message_read records', deleted_rows;
    
    -- Clean up old user activities (older than 2 years)
    DELETE FROM user_activities 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RAISE LOG 'Cleaned up % old user_activity records', deleted_rows;
    
    -- Clean up old search queries (older than 1 year)
    DELETE FROM search_queries 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RAISE LOG 'Cleaned up % old search_query records', deleted_rows;
    
    -- Clean up expired notifications
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND is_read = FALSE;
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RAISE LOG 'Cleaned up % expired notifications', deleted_rows;
END;
$$ LANGUAGE plpgsql;

-- Create pg_stat_statements extension for query monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Tables for query performance tracking
CREATE TABLE IF NOT EXISTS slow_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT,
    query_duration_ms INTEGER,
    rows_examined INTEGER,
    rows_returned INTEGER,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert trigger for slow queries
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS trigger AS $$
BEGIN
    IF NEW.total_exec_time > 1000 THEN -- Log queries taking more than 1 second
        INSERT INTO slow_queries (query_text, query_duration_ms, rows_examined, rows_returned)
        VALUES (NEW.query, NEW.total_exec_time * 1000, NEW.rows, NEW.rows);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Schema for tracking migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions (adjust based on your setup)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'talentsphere_user') THEN
        GRANT USAGE ON SCHEMA public TO talentsphere_user;
        GRANT CREATE ON SCHEMA public TO talentsphere_user;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO talentsphere_user;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO talentsphere_user;
    END IF;
END $$;

COMMIT;