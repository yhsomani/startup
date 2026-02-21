-- TalentSphere Email Service Database Schema
-- PostgreSQL migration for production-ready email management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_email VARCHAR(255) NOT NULL,
    reply_to VARCHAR(255),
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(500) NOT NULL,
    text_content TEXT,
    html_content TEXT,
    attachments JSONB, -- Array of attachment objects
    template_id UUID REFERENCES email_templates(id),
    template_data JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
    message_id VARCHAR(255), -- SMTP message ID
    delivery_attempts INTEGER DEFAULT 0,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    tracking_enabled BOOLEAN DEFAULT FALSE,
    open_tracking_enabled BOOLEAN DEFAULT FALSE,
    click_tracking_enabled BOOLEAN DEFAULT FALSE,
    campaign_id UUID REFERENCES email_campaigns(id),
    user_id UUID, -- Recipient user ID if available
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    subject_template TEXT NOT NULL,
    text_template TEXT,
    html_template TEXT NOT NULL,
    variables JSONB, -- Array of variable definitions with type, required, description
    default_data JSONB, -- Default template data
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES email_templates(id),
    campaign_type VARCHAR(50) DEFAULT 'newsletter' CHECK (campaign_type IN ('newsletter', 'marketing', 'transactional', 'notification')),
    recipients JSONB NOT NULL, -- Array of recipient objects with email, userId, variables
    segment_id UUID, -- User segment for targeted campaigns
    scheduled_for TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    settings JSONB, -- Campaign settings like sendRate, tracking, etc.
    total_recipients INTEGER NOT NULL,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    complained_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email tracking events table
CREATE TABLE IF NOT EXISTS email_tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed', 'suppressed')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    url TEXT, -- For click events
    geolocation JSONB, -- { country, city, region }
    device JSONB, -- { type, os, browser }
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    user_id UUID,
    category VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'marketing', 'newsletter', 'notifications', 'updates')),
    status VARCHAR(20) DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced', 'complained', 'suppressed')),
    subscription_source VARCHAR(50), -- How they subscribed (signup, purchase, etc.)
    unsubscribe_reason TEXT,
    custom_preferences JSONB, -- User-specific email preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, category)
);

-- Email suppression list
CREATE TABLE IF NOT EXISTS email_suppression_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    reason VARCHAR(100) NOT NULL CHECK (reason IN ('bounce', 'complaint', 'manual', 'spam', 'hard_bounce', 'soft_bounce')),
    description TEXT,
    source VARCHAR(100), -- Source of suppression (complaint, bounce, etc.)
    is_permanent BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email delivery providers
CREATE TABLE IF NOT EXISTS email_delivery_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('smtp', 'api', 'webhook')),
    config JSONB NOT NULL, -- Provider-specific configuration
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1, -- Lower number = higher priority
    rate_limit INTEGER, -- Emails per minute/hour
    is_backup BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email send logs (detailed audit trail)
CREATE TABLE IF NOT EXISTS email_send_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES email_delivery_providers(id),
    request_data JSONB, -- Full request sent to provider
    response_data JSONB, -- Full response from provider
    status_code INTEGER,
    response_time INTEGER, -- in milliseconds
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email templates versions (for versioning)
CREATE TABLE IF NOT EXISTS email_template_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    subject_template TEXT NOT NULL,
    text_template TEXT,
    html_template TEXT NOT NULL,
    variables JSONB,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, version)
);

-- User segments (for targeted campaigns)
CREATE TABLE IF NOT EXISTS user_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- Segment definition rules
    user_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User segment members
CREATE TABLE IF NOT EXISTS user_segment_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id UUID NOT NULL REFERENCES user_segments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(segment_id, user_id)
);

-- Email performance metrics
CREATE TABLE IF NOT EXISTS email_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'daily', 'campaign', 'template'
    entity_id UUID, -- campaign_id, template_id, or NULL for overall
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    unique_opens INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    complained_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    revenue DECIMAL(10,2), -- If tracked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(metric_date, metric_type, entity_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_scheduled_for ON emails(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_campaign_id ON emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);
CREATE INDEX IF NOT EXISTS idx_emails_to_emails ON emails USING GIN(to_emails);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_template_id ON email_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_for ON email_campaigns(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_tracking_events_email_id ON email_tracking_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_event_type ON email_tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_timestamp ON email_tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_email_tracking_events_created_at ON email_tracking_events(created_at);

CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_id ON email_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_status ON email_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_category ON email_subscriptions(category);

CREATE INDEX IF NOT EXISTS idx_email_suppression_list_email ON email_suppression_list(email);
CREATE INDEX IF NOT EXISTS idx_email_suppression_list_reason ON email_suppression_list(reason);
CREATE INDEX IF NOT EXISTS idx_email_suppression_list_is_permanent ON email_suppression_list(is_permanent);

CREATE INDEX IF NOT EXISTS idx_email_delivery_providers_is_active ON email_delivery_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_email_delivery_providers_priority ON email_delivery_providers(priority);

CREATE INDEX IF NOT EXISTS idx_email_send_logs_email_id ON email_send_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_provider_id ON email_send_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_created_at ON email_send_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_user_segments_is_active ON user_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_user_segment_members_segment_id ON user_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_user_segment_members_user_id ON user_segment_members(user_id);

CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_date_type ON email_performance_metrics(metric_date, metric_type);
CREATE INDEX IF NOT EXISTS idx_email_performance_metrics_entity_id ON email_performance_metrics(entity_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_emails_updated_at 
    BEFORE UPDATE ON emails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at 
    BEFORE UPDATE ON email_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscriptions_updated_at 
    BEFORE UPDATE ON email_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_suppression_list_updated_at 
    BEFORE UPDATE ON email_suppression_list 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_delivery_providers_updated_at 
    BEFORE UPDATE ON email_delivery_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_segments_updated_at 
    BEFORE UPDATE ON user_segments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default email delivery providers
INSERT INTO email_delivery_providers (name, type, config, priority) VALUES
('Primary SMTP', 'smtp', 
 '{"host": "smtp.gmail.com", "port": 587, "secure": false, "auth": {"user": "", "pass": ""}}',
 1),
('Backup SMTP', 'smtp',
 '{"service": "gmail", "auth": {"user": "", "pass": ""}}',
 2)
ON CONFLICT (name) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, category, subject_template, html_template, text_template) VALUES
('welcome_email', 'transactional',
 'Welcome to TalentSphere!',
 '<h1>Welcome {{firstName}},</h1><p>Thank you for joining TalentSphere! Your account has been successfully created.</p>',
 'Welcome {{firstName}},\n\nThank you for joining TalentSphere! Your account has been successfully created.'),

('password_reset', 'transactional',
 'Reset Your TalentSphere Password',
 '<h1>Password Reset Request</h1><p>Click <a href="{{resetLink}}">here</a> to reset your password.</p>',
 'Click here to reset your password: {{resetLink}}'),

('email_verification', 'transactional',
 'Verify Your Email Address',
 '<h1>Verify Your Email</h1><p>Click <a href="{{verificationLink}}">here</a> to verify your email address.</p>',
 'Verify your email: {{verificationLink}}'),

('newsletter', 'marketing',
 'TalentSphere Newsletter - {{month}} {{year}}',
 '<h1>TalentSphere Newsletter</h1><p>{{content}}</p>',
 'TalentSphere Newsletter\n\n{{content}}'),

('job_application_received', 'notification',
 'Application Received for {{jobTitle}}',
 '<h1>Application Received</h1><p>Your application for {{jobTitle}} at {{companyName}} has been received.</p>',
 'Your application for {{jobTitle}} at {{companyName}} has been received.')

ON CONFLICT (name) DO NOTHING;

-- Create view for email statistics
CREATE OR REPLACE VIEW email_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    status,
    COUNT(*) as count,
    AVG(CASE WHEN delivered_at IS NOT NULL AND sent_at IS NOT NULL 
         THEN EXTRACT(EPOCH FROM (delivered_at - sent_at)) 
         ELSE NULL END) as avg_delivery_time_seconds
FROM emails 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), status
ORDER BY date DESC;

-- Create view for campaign performance
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
    ec.id,
    ec.name,
    ec.status,
    ec.total_recipients,
    ec.sent_count,
    ec.delivered_count,
    ec.opened_count,
    ec.clicked_count,
    ec.bounced_count,
    ec.complained_count,
    CASE 
        WHEN ec.total_recipients > 0 THEN 
            ROUND((ec.delivered_count::FLOAT / ec.total_recipients::FLOAT) * 100, 2)
        ELSE 0 
    END as delivery_rate_percent,
    CASE 
        WHEN ec.delivered_count > 0 THEN 
            ROUND((ec.opened_count::FLOAT / ec.delivered_count::FLOAT) * 100, 2)
        ELSE 0 
    END as open_rate_percent,
    CASE 
        WHEN ec.opened_count > 0 THEN 
            ROUND((ec.clicked_count::FLOAT / ec.opened_count::FLOAT) * 100, 2)
        ELSE 0 
    END as click_rate_percent,
    ec.created_at,
    ec.started_at,
    ec.completed_at
FROM email_campaigns ec
WHERE ec.status != 'draft'
ORDER BY ec.created_at DESC;

-- Create view for template performance
CREATE OR REPLACE VIEW template_performance AS
SELECT 
    et.id,
    et.name,
    et.category,
    COUNT(e.id) as total_sent,
    COUNT(CASE WHEN e.status = 'delivered' THEN 1 END) as delivered,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM email_tracking_events ete WHERE ete.email_id = e.id AND ete.event_type = 'opened') THEN 1 END) as opened,
    COUNT(CASE WHEN EXISTS(SELECT 1 FROM email_tracking_events ete WHERE ete.email_id = e.id AND ete.event_type = 'clicked') THEN 1 END) as clicked,
    CASE 
        WHEN COUNT(e.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN e.status = 'delivered' THEN 1 END)::FLOAT / COUNT(e.id)::FLOAT) * 100, 2)
        ELSE 0 
    END as delivery_rate_percent
FROM email_templates et
LEFT JOIN emails e ON et.id = e.template_id
GROUP BY et.id, et.name, et.category
ORDER BY total_sent DESC;

-- Grant permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO email_service;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO email_service;

COMMIT;