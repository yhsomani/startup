-- TalentSphere Notification Service Database Schema
-- PostgreSQL migration for production-ready notification system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in-app', 'system')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'expired')),
    delivery_attempts INTEGER DEFAULT 0,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    processing_time INTEGER, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification recipients table (for one-to-many relationship)
CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    email VARCHAR(255),
    device_id VARCHAR(255),
    device_token TEXT,
    phone VARCHAR(20),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'skipped')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification history table (for user notification history)
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    job_alerts BOOLEAN DEFAULT TRUE,
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections', 'private')),
    social_notifications BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in-app')),
    subject_template TEXT,
    body_template TEXT NOT NULL,
    data_schema JSONB, -- JSON schema for template variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification metrics table (for analytics)
CREATE TABLE IF NOT EXISTS notification_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID,
    event_type VARCHAR(50) NOT NULL, -- 'created', 'sent', 'delivered', 'failed', 'read', 'clicked'
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    processing_time INTEGER -- in milliseconds
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notification_recipients(user_id, delivery_status);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_is_read ON notification_history(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_unread ON notification_history(user_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_metrics_notification_id ON notification_metrics(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_metrics_event_type ON notification_metrics(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_metrics_timestamp ON notification_metrics(event_timestamp);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_recipients_updated_at 
    BEFORE UPDATE ON notification_recipients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject_template, body_template, data_schema) VALUES
('welcome_email', 'email', 'Welcome to TalentSphere!', 
 'Hello {{firstName}}, welcome to TalentSphere! Your account has been successfully created.',
 '{"firstName": "string", "lastName": "string"}'),

('job_application_received', 'email', 'Job Application Received',
 'Hi {{firstName}}, your application for {{jobTitle}} at {{companyName}} has been received.',
 '{"firstName": "string", "jobTitle": "string", "companyName": "string"}'),

('interview_scheduled', 'email', 'Interview Scheduled',
 'Dear {{firstName}}, your interview for {{jobTitle}} has been scheduled for {{interviewDate}}.',
 '{"firstName": "string", "jobTitle": "string", "interviewDate": "string"}'),

('profile_viewed', 'push', 'Profile Viewed',
 '{{viewerName}} viewed your profile',
 '{"viewerName": "string", "viewerTitle": "string"}'),

('new_connection_request', 'push', 'New Connection Request',
 '{{requesterName}} wants to connect with you',
 '{"requesterName": "string", "requesterTitle": "string"}'),

('job_alert', 'email', 'New Job Opportunity',
 'Hi {{firstName}}, we found a new job opportunity that matches your profile: {{jobTitle}} at {{companyName}}',
 '{"firstName": "string", "jobTitle": "string", "companyName": "string"}'),

('password_reset', 'email', 'Password Reset Request',
 'Hello {{firstName}}, you requested to reset your password. Click here to reset: {{resetLink}}',
 '{"firstName": "string", "resetLink": "string"}')

ON CONFLICT (name) DO NOTHING;

-- Create view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    type,
    delivery_status,
    COUNT(*) as count,
    AVG(processing_time) as avg_processing_time
FROM notifications 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), type, delivery_status
ORDER BY date DESC;

-- Create view for user notification summary
CREATE OR REPLACE VIEW user_notification_summary AS
SELECT 
    nh.user_id,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN nh.is_read = FALSE THEN 1 END) as unread_notifications,
    COUNT(CASE WHEN nh.type = 'job_alert' THEN 1 END) as job_alerts,
    COUNT(CASE WHEN nh.type = 'social' THEN 1 END) as social_notifications,
    MAX(nh.created_at) as last_notification_at
FROM notification_history nh
WHERE nh.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY nh.user_id;

-- Grant permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO notification_service;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO notification_service;

COMMIT;