-- TalentSphere Company Service Database Schema
-- PostgreSQL migration for production-ready company management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(50) NOT NULL CHECK (industry IN ('technology', 'healthcare', 'finance', 'education', 'retail', 'manufacturing', 'consulting', 'other')),
    size VARCHAR(20) NOT NULL CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    website VARCHAR(500),
    founded_year INTEGER CHECK (founded_year >= 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    headquarters JSONB,
    contact JSONB,
    social_media JSONB,
    benefits TEXT[],
    culture JSONB,
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'suspended', 'inactive')),
    verification_level VARCHAR(20) DEFAULT 'none' CHECK (verification_level IN ('none', 'email', 'phone', 'business_license', 'tax_id', 'domain')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company locations table
CREATE TABLE IF NOT EXISTS company_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    coordinates JSONB,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_headquarters BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'recruiter', 'hiring_manager', 'employee')),
    department VARCHAR(100),
    title VARCHAR(100),
    start_date DATE,
    end_date DATE,
    permissions TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company verifications table
CREATE TABLE IF NOT EXISTS company_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('email', 'phone', 'business_license', 'tax_id', 'domain')),
    verification_data JSONB,
    documents JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    reviewed_by UUID,
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company benefits catalog
CREATE TABLE IF NOT EXISTS benefits_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(50) NOT NULL CHECK (category IN ('health', 'financial', 'work_life', 'professional', 'perks')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company benefits mapping
CREATE TABLE IF NOT EXISTS company_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    benefit_id UUID NOT NULL REFERENCES benefits_catalog(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, benefit_id)
);

-- Company culture values catalog
CREATE TABLE IF NOT EXISTS culture_values_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    value VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company culture values mapping
CREATE TABLE IF NOT EXISTS company_culture_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    value_id UUID NOT NULL REFERENCES culture_values_catalog(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, value_id)
);

-- Company metrics table
CREATE TABLE IF NOT EXISTS company_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    profile_views INTEGER DEFAULT 0,
    job_views INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    new_followers INTEGER DEFAULT 0,
    engagement_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, metric_date)
);

-- Company activity log
CREATE TABLE IF NOT EXISTS company_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company settings/preferences
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    privacy_settings JSONB,
    notification_settings JSONB,
    branding_settings JSONB,
    recruitment_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_locations_updated_at 
    BEFORE UPDATE ON company_locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_verifications_updated_at 
    BEFORE UPDATE ON company_verifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_benefits_updated_at 
    BEFORE UPDATE ON company_benefits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_culture_values_updated_at 
    BEFORE UPDATE ON company_culture_values 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at 
    BEFORE UPDATE ON company_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_activity_log_created_at 
    BEFORE INSERT ON company_activity_log 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default company benefits catalog
INSERT INTO benefits_catalog (name, description, category, icon, is_active) VALUES
('Health Insurance', 'Comprehensive health insurance coverage for employees', 'health', 'health-insurance', 'shield'),
('Dental Insurance', 'Dental and vision coverage for employees', 'health', 'dental', 'tooth'),
('Retirement Plan', '401(k) matching company retirement plan', 'financial', 'retirement', 'piggy-bank'),
('Life Insurance', 'Life insurance coverage for employees', 'health', 'life-insurance', 'heart'),
('Stock Options', 'Company stock purchase options', 'financial', 'stocks', 'chart-line'),
('Paid Time Off', 'Generous paid time off policy', 'work_life', 'calendar', 'beach'),
('Flexible Schedule', 'Flexible working arrangements', 'work_life', 'clock'),
('Remote Work', 'Work from home opportunities', 'work_life', 'home'),
'Parental Leave', 'Paid parental leave policies', 'work_life', 'family', 'baby'),
'Gym Membership', 'On-site gym or fitness center access', 'perks', 'dumbbell'),
'Tuition Reimbursement', 'Education assistance and reimbursement programs', 'financial', 'graduation-cap', 'school'),
'Commuter Benefits', 'Public transportation and commuter benefits', 'financial', 'bus', 'train'),
'Professional Development', 'Skill development and training programs', 'professional', 'trending-up',
'Mental Health Support', 'Mental health services and resources', 'health', 'brain'),
'Equipment Allowance', 'Company-provided equipment and tools', 'work_life', 'laptop'),
'Food & Snacks', 'Office-provided meals and beverages', 'perks', 'coffee'),
'Company Car', 'Company vehicle for business use', 'perks', 'car'),
'Employee Discounts', 'Discounts on products and services', 'perks', 'percentage'),
'Wellness Programs', 'Health and wellness initiatives', 'health', 'spa',
'Childcare Support', 'On-site childcare services', 'perks', 'children'),
'Legal Assistance', 'Legal services and consultation', 'professional', 'gavel'),
'Pet Insurance', 'Pet health insurance and veterinary coverage', 'perks', 'paw'),
'Bonus Programs', 'Performance-based bonuses and incentives', 'financial', 'money',
'Career Advancement', 'Career counseling and advancement services', 'professional', 'briefcase')

ON CONFLICT (name) DO NOTHING; -- Avoid duplicates
) ON CONFLICT (name) DO NOTHING; -- Avoid duplicates

-- Insert default company culture values
INSERT INTO culture_values_catalog (value, description, icon) VALUES
('Innovation', 'Encouraging creative thinking and new ideas', 'lightbulb'),
('Collaboration', 'Fostering teamwork and collaboration', 'users'),
('Integrity', 'Honesty and ethical behavior', 'balance-scale'),
('Excellence', 'Striving for the highest standards', 'star'),
('Diversity & Inclusion', 'Embracing diversity and inclusivity', 'rainbow'),
('Growth Mindset', 'Focus on learning and improvement', 'growth-arrow'),
('Work-Life Balance', 'Balancing work and personal life', 'scale-horizontal'),
('Customer Focus', 'Prioritizing customer needs', 'users'),
('Agility', 'Being adaptable and responsive to change', 'refresh'),
('Transparency', 'Open and honest communication', 'eye',
('Sustainability', 'Environmental and social responsibility', 'leaf'),
('Accountability', 'Taking responsibility for actions and outcomes', 'clipboard-check'),
('Community', 'Building positive community impact', 'heart'),
('Well-being', 'Promoting health and happiness', 'smile')

ON CONFLICT (value) DO NOTHING; -- Avoid duplicates

-- Create view for company statistics
CREATE OR REPLACE VIEW company_stats AS
SELECT 
    c.id,
    c.name,
    c.industry,
    c.size,
    c.status,
    c.verification_level,
    c.is_featured,
    c.is_active,
    COUNT(DISTINCT cl.id) FILTER (cl.is_active = TRUE)) as location_count,
    COUNT(DISTINCT e.id) FILTER (e.status = 'active' AND e.joined_at IS NOT NULL) FILTER (CURRENT_DATE - e.joined_at <= INTERVAL '30 days')) as active_employees_30d,
    COUNT(DISTINCT cv.id) FILTER (cv.status = 'pending') as pending_verifications,
    COUNT(DISTINCT cb.id) FILTER (cb.is_active = TRUE) FILTER (CURRENT_DATE - cb.created_at <= INTERVAL '30 days')) as active_benefits_30d,
    COALESCE(AVG(ps.engagement_score), 0) as avg_engagement_score,
    MAX(ps.profile_views, 0) as max_profile_views_30d,
    MAX(ps.job_views, 0) as max_job_views_30d,
    MAX(ps.total_applications, 0) as max_applications_30d,
    MAX(ps.new_followers, 0) as max_followers_30d,
    c.created_at,
    c.updated_at
FROM companies c
LEFT JOIN company_locations cl ON c.id = cl.company_id
LEFT JOIN employees e ON c.id = e.company_id
LEFT JOIN company_verifications cv ON c.id = cv.company_id
LEFT JOIN company_benefits cb ON c.id = cb.company_id
LEFT JOIN company_metrics ps ON c.id = ps.company_id AND ps.metric_date = CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.name, c.industry, c.size, c.status, c.verification_level, c.is_featured, c.is_active, c.created_at, c.updated_at
ORDER BY c.created_at DESC
ON CONFLICT (id) DO NOTHING; -- Protect against existing views
-- Grant permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO company_service;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO company_service;

COMMIT;