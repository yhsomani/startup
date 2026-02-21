-- Notifications and analytics tables

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- job_application, profile_view, message, connection, system, etc.
    category VARCHAR(50) DEFAULT 'general', -- job, social, system, marketing
    
    -- Notification sources
    source_type VARCHAR(50), -- user, company, job, system
    source_id UUID, -- ID of the source object
    
    -- Action buttons
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    secondary_action_url VARCHAR(500),
    secondary_action_text VARCHAR(100),
    
    -- Delivery tracking
    is_read BOOLEAN DEFAULT FALSE,
    is_delivered BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- User preferences
    is_email_sent BOOLEAN DEFAULT FALSE,
    is_push_sent BOOLEAN DEFAULT FALSE,
    is_sms_sent BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-hide notification
    metadata JSONB, -- Additional notification data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification channels
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Type-specific preferences
    job_alerts BOOLEAN DEFAULT TRUE,
    profile_views BOOLEAN DEFAULT TRUE,
    messages BOOLEAN DEFAULT TRUE,
    connections BOOLEAN DEFAULT TRUE,
    endorsements BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    
    -- Delivery preferences
    email_frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly, never
    push_frequency VARCHAR(20) DEFAULT 'immediate',
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- User activity tracking for analytics
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- login, profile_update, job_application, message_sent, etc.
    activity_data JSONB, -- Flexible data structure for different activity types
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    referrer_url VARCHAR(500),
    
    -- Location (optional)
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Timestamps
    activity_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile views tracking
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    
    -- Viewing context
    view_type VARCHAR(50) DEFAULT 'profile', -- profile, resume, etc.
    source VARCHAR(100), -- search, connection_list, company_page, etc.
    
    -- Viewer information
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    
    -- Viewer company and role (if known)
    viewer_company VARCHAR(255),
    viewer_job_title VARCHAR(255),
    
    -- Timestamps
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate counting
    date_viewed DATE DEFAULT CURRENT_DATE
);

-- Job search queries tracking
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous searches
    
    -- Query details
    query_text TEXT,
    query_filters JSONB, -- Search filters applied
    result_count INTEGER,
    
    -- Search context
    search_type VARCHAR(50) DEFAULT 'jobs', -- jobs, companies, people
    search_location VARCHAR(255), -- Search location used
    
    -- User behavior
    clicked_result_id UUID, -- Which result was clicked (if any)
    time_to_click_ms INTEGER, -- Time from search to click
    
    -- Technical details
    page_number INTEGER DEFAULT 1,
    results_per_page INTEGER DEFAULT 20,
    sort_by VARCHAR(50),
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_date DATE DEFAULT CURRENT_DATE
);

-- System-wide analytics and metrics
CREATE TABLE IF NOT EXISTS daily_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- User metrics
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    
    -- Job metrics
    new_jobs_posted INTEGER DEFAULT 0,
    active_jobs INTEGER DEFAULT 0,
    job_views INTEGER DEFAULT 0,
    job_applications INTEGER DEFAULT 0,
    
    -- Company metrics
    new_companies INTEGER DEFAULT 0,
    active_companies INTEGER DEFAULT 0,
    company_views INTEGER DEFAULT 0,
    
    -- Network metrics
    new_connections INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms DECIMAL(10, 2),
    error_rate DECIMAL(5, 2),
    uptime_percentage DECIMAL(5, 2),
    
    -- Engagement metrics
    page_views BIGINT DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5, 2),
    avg_session_duration_seconds INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date)
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Feature details
    feature_name VARCHAR(100) NOT NULL,
    feature_action VARCHAR(100) NOT NULL,
    
    -- Usage context
    usage_context JSONB, -- Additional context data
    a_b_test_variant VARCHAR(50), -- A/B test information
    
    -- Performance
    response_time_ms INTEGER,
    
    -- Timestamps
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_date DATE DEFAULT CURRENT_DATE
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- User activities indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_date ON user_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

-- Profile views indexes
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user_id ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_user_id ON profile_views(viewer_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_date_viewed ON profile_views(date_viewed);

-- Search queries indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_date ON search_queries(created_date);
CREATE INDEX IF NOT EXISTS idx_search_queries_search_type ON search_queries(search_type);

-- Daily analytics indexes
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);

-- Feature usage indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_used_at ON feature_usage(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_usage_date ON feature_usage(usage_date DESC);

-- Triggers for updated_at
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();