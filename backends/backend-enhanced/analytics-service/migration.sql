-- TalentSphere Analytics Service Database Schema
-- PostgreSQL migration for production-ready analytics and insights system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Analytics events table (raw event data)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID,
    session_id VARCHAR(255),
    properties JSONB,
    context JSONB,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_analytics_events_timestamp (timestamp),
    INDEX idx_analytics_events_user_id (user_id),
    INDEX idx_analytics_events_event_type (event_type),
    INDEX idx_analytics_events_processed (processed)
);

-- Aggregated metrics table (time-series aggregated data)
CREATE TABLE IF NOT EXISTS aggregated_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'count', 'sum', 'avg', 'rate'
    dimensions JSONB,
    time_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
    granularity VARCHAR(20) NOT NULL, -- 'hour', 'day', 'week', 'month'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_aggregated_metrics_name_time (metric_name, time_bucket),
    INDEX idx_aggregated_metrics_granularity (granularity)
);

-- User behavior analytics
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    date_bucket DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    session_duration_seconds INTEGER DEFAULT 0,
    job_views INTEGER DEFAULT 0,
    applications_sent INTEGER DEFAULT 0,
    connections_made INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date_bucket)
);

-- Job performance analytics
CREATE TABLE IF NOT EXISTS job_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    date_bucket DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    applications INTEGER DEFAULT 0,
    unique_applications INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4), -- applications / views
    avg_time_to_application INTEGER, -- in hours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, date_bucket)
);

-- Company performance analytics
CREATE TABLE IF NOT EXISTS company_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    date_bucket DATE NOT NULL,
    profile_views INTEGER DEFAULT 0,
    job_views INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, date_bucket)
);

-- Funnel analytics
CREATE TABLE IF NOT EXISTS funnel_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_name VARCHAR(100) NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    users_count INTEGER NOT NULL,
    conversion_rate DECIMAL(5,4),
    date_bucket DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_funnel_analytics_name_date (funnel_name, date_bucket)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    query JSONB NOT NULL,
    schedule JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report executions
CREATE TABLE IF NOT EXISTS report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    data JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID,
    status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    layout JSONB,
    widgets JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cohort analysis table
CREATE TABLE IF NOT EXISTS cohort_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cohort_date DATE NOT NULL,
    cohort_size INTEGER NOT NULL,
    period_number INTEGER NOT NULL, -- 0 = signup week, 1 = week 1, etc.
    active_users INTEGER NOT NULL,
    retention_rate DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cohort_analytics_date_period (cohort_date, period_number)
);

-- Revenue analytics
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_bucket DATE NOT NULL,
    revenue_type VARCHAR(50) NOT NULL, -- 'subscriptions', 'job_postings', 'premium_features'
    revenue_amount DECIMAL(10,2) NOT NULL,
    transaction_count INTEGER NOT NULL,
    average_transaction_value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_revenue_analytics_date_type (date_bucket, revenue_type)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    page_load_time DECIMAL(8,3), -- in seconds
    server_response_time DECIMAL(8,3), -- in seconds
    error_rate DECIMAL(5,4), -- percentage
    uptime_percentage DECIMAL(5,4),
    active_users INTEGER,
    total_requests INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_performance_metrics_date (metric_date)
);

-- A/B testing analytics
CREATE TABLE IF NOT EXISTS ab_test_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(200) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    user_count INTEGER NOT NULL,
    conversion_count INTEGER NOT NULL,
    conversion_rate DECIMAL(5,4),
    revenue DECIMAL(10,2),
    statistical_significance BOOLEAN DEFAULT FALSE,
    confidence_interval JSONB,
    date_bucket DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ab_test_analytics_test_variant (test_name, variant_name)
);

-- Real-time analytics cache
CREATE TABLE IF NOT EXISTS realtime_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_key VARCHAR(200) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_key)
);

-- Geographic analytics
CREATE TABLE IF NOT EXISTS geographic_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_bucket DATE NOT NULL,
    country VARCHAR(2), -- ISO country code
    region VARCHAR(100),
    city VARCHAR(100),
    metric_type VARCHAR(50) NOT NULL,
    metric_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_geographic_analytics_date (date_bucket),
    INDEX idx_geographic_analytics_location (country, region, city)
);

-- Device analytics
CREATE TABLE IF NOT EXISTS device_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date_bucket DATE NOT NULL,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    metric_type VARCHAR(50) NOT NULL,
    metric_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_analytics_date_device (date_bucket, device_type)
);

-- User segments analytics
CREATE TABLE IF NOT EXISTS user_segment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_name VARCHAR(100) NOT NULL,
    date_bucket DATE NOT NULL,
    segment_size INTEGER NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_segment_analytics_name_date (segment_name, date_bucket)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_behavior_analytics_updated_at 
    BEFORE UPDATE ON user_behavior_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_performance_analytics_updated_at 
    BEFORE UPDATE ON job_performance_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_performance_analytics_updated_at 
    BEFORE UPDATE ON company_performance_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at 
    BEFORE UPDATE ON dashboards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common analytics queries
CREATE OR REPLACE VIEW daily_user_summary AS
SELECT 
    date_bucket,
    SUM(page_views) as total_page_views,
    SUM(session_duration_seconds) as total_session_duration,
    AVG(session_duration_seconds) as avg_session_duration,
    SUM(job_views) as total_job_views,
    SUM(applications_sent) as total_applications,
    COUNT(*) as active_users
FROM user_behavior_analytics
GROUP BY date_bucket
ORDER BY date_bucket DESC;

CREATE OR REPLACE VIEW job_performance_summary AS
SELECT 
    j.id as job_id,
    j.title,
    j.company_id,
    c.name as company_name,
    COALESCE(SUM(jpa.views), 0) as total_views,
    COALESCE(SUM(jpa.applications), 0) as total_applications,
    CASE 
        WHEN COALESCE(SUM(jpa.views), 0) > 0 
        THEN ROUND((SUM(jpa.applications)::DECIMAL / SUM(jpa.views)::DECIMAL) * 100, 2)
        ELSE 0 
    END as conversion_rate_percent
FROM jobs j
LEFT JOIN companies c ON j.company_id = c.id
LEFT JOIN job_performance_analytics jpa ON j.id = jpa.job_id
WHERE jpa.date_bucket >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY j.id, j.title, j.company_id, c.name
ORDER BY total_applications DESC;

CREATE OR REPLACE VIEW company_performance_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    COALESCE(SUM(cpa.profile_views), 0) as total_profile_views,
    COALESCE(SUM(cpa.job_views), 0) as total_job_views,
    COALESCE(SUM(cpa.total_applications), 0) as total_applications,
    COALESCE(SUM(cpa.new_followers), 0) as total_new_followers,
    COALESCE(AVG(cpa.engagement_score), 0) as avg_engagement_score
FROM companies c
LEFT JOIN company_performance_analytics cpa ON c.id = cpa.company_id
WHERE cpa.date_bucket >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.name
ORDER BY total_applications DESC;

CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT 
    DATE_TRUNC('month', date_bucket) as month,
    revenue_type,
    SUM(revenue_amount) as total_revenue,
    SUM(transaction_count) as total_transactions,
    AVG(average_transaction_value) as avg_transaction_value
FROM revenue_analytics
GROUP BY DATE_TRUNC('month', date_bucket), revenue_type
ORDER BY month DESC;

-- Function to aggregate user behavior data
CREATE OR REPLACE FUNCTION aggregate_user_behavior(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_behavior_analytics (
        user_id, date_bucket, page_views, session_duration_seconds,
        job_views, applications_sent, connections_made, messages_sent, last_active_at
    )
    SELECT 
        user_id,
        target_date,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END),
        COALESCE(SUM(CASE WHEN properties->>'session_duration' IS NOT NULL 
            THEN (properties->>'session_duration')::INTEGER ELSE 0 END), 0),
        COUNT(CASE WHEN event_type = 'job_view' THEN 1 END),
        COUNT(CASE WHEN event_type = 'job_apply' THEN 1 END),
        COUNT(CASE WHEN event_type = 'connection_request' THEN 1 END),
        COUNT(CASE WHEN event_type = 'message_sent' THEN 1 END),
        MAX(timestamp)
    FROM analytics_events
    WHERE DATE(timestamp) = target_date
        AND user_id IS NOT NULL
        AND processed = FALSE
    GROUP BY user_id
    ON CONFLICT (user_id, date_bucket) 
    DO UPDATE SET
        page_views = EXCLUDED.page_views,
        session_duration_seconds = EXCLUDED.session_duration_seconds,
        job_views = EXCLUDED.job_views,
        applications_sent = EXCLUDED.applications_sent,
        connections_made = EXCLUDED.connections_made,
        messages_sent = EXCLUDED.messages_sent,
        last_active_at = EXCLUDED.last_active_at,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Mark events as processed
    UPDATE analytics_events 
    SET processed = TRUE 
    WHERE DATE(timestamp) = target_date;
    
    RAISE NOTICE 'Aggregated user behavior for %', target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate job performance data
CREATE OR REPLACE FUNCTION aggregate_job_performance(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO job_performance_analytics (
        job_id, date_bucket, views, unique_views, applications, unique_applications
    )
    SELECT 
        properties->>'job_id'::UUID,
        target_date,
        COUNT(CASE WHEN event_type = 'job_view' THEN 1 END),
        COUNT(DISTINCT CASE WHEN event_type = 'job_view' THEN user_id END),
        COUNT(CASE WHEN event_type = 'job_apply' THEN 1 END),
        COUNT(DISTINCT CASE WHEN event_type = 'job_apply' THEN user_id END)
    FROM analytics_events
    WHERE DATE(timestamp) = target_date
        AND properties->>'job_id' IS NOT NULL
        AND processed = FALSE
    GROUP BY properties->>'job_id'::UUID
    ON CONFLICT (job_id, date_bucket) 
    DO UPDATE SET
        views = EXCLUDED.views,
        unique_views = EXCLUDED.unique_views,
        applications = EXCLUDED.applications,
        unique_applications = EXCLUDED.unique_applications,
        updated_at = CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'Aggregated job performance for %', target_date;
END;
$$ LANGUAGE plpgsql;

-- Insert default dashboard
INSERT INTO dashboards (name, description, layout, widgets, created_by) VALUES
('Executive Dashboard', 'High-level business metrics and KPIs', 
 '{"rows": [{"columns": [{"width": 6, "widgets": ["total_users", "active_users"]}, {"width": 6, "widgets": ["total_jobs", "total_applications"]}]}]}',
 '{"total_users": {"type": "metric", "title": "Total Users", "query": "SELECT COUNT(*) FROM users"}, "active_users": {"type": "metric", "title": "Active Users", "query": "SELECT COUNT(*) FROM user_behavior_analytics WHERE date_bucket >= CURRENT_DATE - INTERVAL \'7 days\'"}, "total_jobs": {"type": "metric", "title": "Total Jobs", "query": "SELECT COUNT(*) FROM jobs WHERE is_active = TRUE"}, "total_applications": {"type": "metric", "title": "Total Applications", "query": "SELECT COUNT(*) FROM job_performance_analytics WHERE date_bucket >= CURRENT_DATE - INTERVAL \'7 days\'"}}}',
 uuid_generate_v4()
) ON CONFLICT DO NOTHING;

COMMIT;