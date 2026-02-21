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
    headquarters JSONB, -- { address, city, state, country, postal_code },
    contact JSONB, -- { phone, email, website },
    social_media JSONB, -- { linkedin, twitter, facebook, instagram },
    benefits TEXT[], -- Array of benefit strings
    culture JSONB, -- { values: [], description TEXT }
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'suspended', 'inactive'),
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
    coordinates JSONB, -- { lat, lng }
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
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'recruiter', 'hiring_manager', 'employee'),
    department VARCHAR(100),
    title VARCHAR(100),
    start_date DATE,
    end_date DATE,
    permissions TEXT[], -- Array of permission strings
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'suspended'),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company verifications table
CREATE TABLE IF NOT EXISTS company_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('email', 'phone', 'business_license', 'tax_id', 'domain')),
    verification_data JSONB,
    documents JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired'),
    reviewed_by UUID,
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Benefits catalog
CREATE TABLE IF NOT EXISTS benefits_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('health', 'financial', 'work_life', 'professional', 'perks'),
    icon VARCHAR(100),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Company settings/preferences table
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE(company_id),
    privacy_settings JSONB,
    notification_settings JSONB,
    branding_settings JSONB,
    recruitment_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Functions to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_locations_updated_at 
    BEFORE UPDATE ON company_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_verifications_updated_at 
    BEFORE UPDATE ON company_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_benefits_updated_at 
    BEFORE UPDATE ON company_benefits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_culture_values_updated_at 
    BEFORE UPDATE ON company_culture_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at 
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_activity_log_created_at 
    BEFORE INSERT ON company_activity_log 
    FOR EACH ROW EXECUTE FUNCTION update_created_at_column();

-- View for company statistics
CREATE OR REPLACE VIEW company_stats AS
SELECT 
    c.id,
    c.name,
    c.industry,
    c.size,
    c.status,
    COUNT(DISTINCT cl.id) FILTER (cl.is_active = TRUE) as location_count,
    COUNT(DISTINCT e.id) FILTER (e.status = 'active' AND e.joined_at >= CURRENT_DATE - INTERVAL '30 days') as active_employees_30d
    COUNT(DISTINCT e.id) FILTER (e.status = 'active' AND e.joined_at >= CURRENT_DATE - INTERVAL '30 days') as recent_active_30d),
    COUNT(DISTINCT e.id) FILTER (e.status = 'active' AND e.left_at IS NULL) as current_active_users),
    COUNT(DISTINCT cl.id) FILTER (e.status = 'active') AND e.left_at IS NOT NULL AND e.joined_at >= CURRENT_DATE - INTERVAL '30 days') AS retained_users_30d),
    COALESCE(COUNT(DISTINCT cl.id) FILTER (e.status IN ('active', 'suspended')) as churned_30d
    ),
    COUNT(DISTINCT cl.id) FILTER (e.status = 'active') AND e.left_at IS NULL AND e.joined_at >= CURRENT_DATE - INTERVAL '30 days') as active_users_30d),
    AVG(CASE WHEN e.status = 'active') THEN 
      COALESCE(e.left_at - e.joined_at, EXTRACT(EPOCH FROM e.joined_at)) FILTER (e.status = 'active')) ELSE 0 END) as avg_days_active
    ) as avg_days_active),
    COUNT(DISTINCT cl.id) FILTER (e.status = 'active') AND e.left_at IS NULL AND e.joined_at >= CURRENT_DATE - INTERVAL '30 days') AS current_users_30d)
    ),
    c.total_applications,
    AVG(CASE WHEN e.status = 'active') THEN 
      COALESCE(e.left_at - e.joined_at, EXTRACT(EPOCH FROM e.joined_at)) FILTER (e.status = 'active')) ELSE 0 END) ) / NULL
  ) as avg_time_to_left
FROM companies c
LEFT JOIN (
  SELECT 
    c.id, c.name, c.industry, c.size, c.status
) ON (jobs j
  WHERE j.company_id = c.id AND j.status IN ('active', 'rejected', 'pending')
) LEFT JOIN candidates a ON j.company_id = c.id GROUP BY j.id
    WHERE j.status IN ('active', 'pending')
    GROUP BY j.id
  HAVING MAX(a.created_at)
    ORDER BY a.created_at DESC
  ),
    6 months/ago FROM CURRENT_DATE
  ) 
GROUP BY c.industry, c.size
    ORDER BY c.total_applications DESC,
    COUNT(*) as job_applications
  ),6 months/ago FROM CURRENT_DATE DESC
  )  (
      SELECT c.id,
      c.name,
      c.industry,
      c.size,
      c.status,
      c.total_applications,
      AVG(s.profile_views) as profile_views,
      COUNT(DISTINCT a.id) FILTER (a.status = 'active') FILTER (a.joined_at >= CURRENT_DATE - INTERVAL '30 days') as current_users_30d),
      COUNT(DISTINCT a.id) FILTER (a.status = 'active' AND a.left_at IS NULL AND a.joined_at >= CURRENT_DATE - INTERVAL '30 days') as retained_users_30d,
      AVG(CASE WHEN a.status = 'active') THEN 
        COALESCE(a.left_at - a.joined_at, EXTRACT(EPOCH FROM a.joined_at), EXTRACT(EPOCH FROM a.joined_at)) FILTER (a.status IN ('active', 'suspended')) ELSE 0 END) ) / NULL
      ) as avg_days_active
    ),
      AVG(CASE WHEN a.status = 'active') THEN 
        COALESCE(a.left_at - a.joined_at, EXTRACT(EPOCH FROM a.joined_at)) FILTER (a.status IN ('active', 'suspended')) ELSE 0 END ) / NULL
    ) as avg_time_to_left
    )
  ) 
    COUNT(DISTINCT a.id) FILTER (e.status IN ('active', 'suspended')) as churned_30d
    ) as churn_rate
FROM companies c
LEFT JOIN (
    SELECT 
      c.id, 
      COUNT(DISTINCT a.id) FILTER (a.status = 'active') FILTER (a.left_at >= CURRENT_DATE - INTERVAL '30 days')) as current_users_30d
    ) as current_users_30d
    ) as retained_users_30d

CREATE OR REPLACE VIEW user_summary AS
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.headline,
    u.created_at,
    COUNT(DISTINCT j.id) FILTER (e.status = 'active' AND e.left_at >= CURRENT_DATE - INTERVAL '30 days') as current_users_30d),
    COUNT(DISTINCT j.id) FILTER (e.status = 'active' AND e.left_at IS NULL AND e.joined_at >= CURRENT_DATE - INTERVAL '30 days') as current_users_30d,
    COUNT(DISTINCT j.id) FILTER (e.status = 'active' AND e.left_at IS NULL AND e.joined_at >= CURRENT_DATE - INTERVAL '30 days') as retained_users_30d,
    AVG(
      CASE 
        WHEN u.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 
          COALESCE(EXTRACT(DAY FROM u.created_at, CURRENT_DATE) AS 
            DAYS) 
        ELSE
          COALESCE(DAY FROM u.created_at, CURRENT_DATE AS 
            DAYS 
        END
      ) AS avg_days_since_first_login
      ),
    COUNT(DISTINCT e.id) FILTER (e.status = 'active') FILTER (e.left_at >= CURRENT_DATE - INTERVAL '30 days) AS current_users_30d,
      COUNT(DISTINCT e.id) FILTER (e.status IN ('active', 'suspended')) AS churned_30d
    )
  )

-- Helper function for query building
CREATE OR REPLACE FUNCTION build_where_clause(
    conditions JSONB
) RETURNS TABLE (
      whereClause TEXT,
      params TEXT[]
    ) AS TEXT
BEGIN
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(conditions).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        conditions.push(`${key} IS NULL`);
      } else if (typeof value === 'object') {
        conditions.push(`${key} IS NULL`);
      } else if (typeof value === 'object' && value.$regex) {
        conditions.push(`${key} ~ $${paramIndex}`);
        params.push(value.$regex);
        paramIndex++;
      } else if (typeof value === 'object' && value.$in) {
        if (Array.isArray(value.$in) && value.$in.length > 0) {
          const placeholders = value.$in.map(() => `$${paramIndex++}`).join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value.$in);
          paramIndex += value.$in.length;
          paramIndex++;
        } else if (typeof value === 'object' && value.$ne) {
          conditions.push(`${key} != $${paramIndex}`);
          params.push(value.$ne);
          paramIndex++;
        } else if (typeof value === 'object' && value.$gte) {
          conditions.push(`${key} >= $${paramIndex}`);
          params.push(value.$gte);
          paramIndex++;
        } else if (typeof value === 'object' && value.$lte) {
          conditions.push(`${key} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
          params.push(value.$lte);
          paramIndex += 2;
        } else if (typeof value === 'object' && value.$between) {
          conditions.push(`${key} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
          params.push(value.$between[0], value.$between[1]);
          paramIndex += 2;
        } else {
          conditions.push(`${key} = $${paramIndex}`);
          params.push(value);
        }
      }
    }

    return {
      whereClause: conditions.length > 0 ? conditions.join(' AND ') : '1=1',
      queryParams: params
    };
  END;
$$ LANGUAGE plpgsql;

COMMIT;