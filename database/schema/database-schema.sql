/**
 * Database Schema Design for User Service
 * PostgreSQL schema with proper relationships and constraints
 */

-- Users table
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_phone_valid CHECK (phone IS NULL OR phone ~* '^\+?[0-9\-\s\(\)]{10,20}$'),
    CONSTRAINT users_phone_length CHECK (phone IS NULL OR length(phone) BETWEEN 10 AND 20)
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    bio TEXT,
    location JSONB,
    avatar_url VARCHAR(500),
    website VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    experience_level VARCHAR(50) DEFAULT 'entry' CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'executive')),
    job_title VARCHAR(200),
    industry VARCHAR(100),
    preferred_locations TEXT,
    remote_work BOOLEAN DEFAULT false,
    salary_expectation_min INTEGER CHECK (salary_expectation_min >= 0),
    salary_expectation_max INTEGER CHECK (salary_expectation_max >= salary_expectation_min),
    salary_currency VARCHAR(3) DEFAULT 'USD' CHECK (salary_currency ~* '^[A-Z]{3}$'),
    availability VARCHAR(50) DEFAULT 'immediately' CHECK (availability IN ('immediately', '1-2_weeks', '1_month', '2-3_months', '3+_months')),
    relocation VARCHAR(20) DEFAULT 'willing' CHECK (relocation IN ('willing', 'reluctant', 'unable')),
    skills JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    proficiency VARCHAR(20) DEFAULT 'beginner',
    years_experience INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    CONSTRAINT skills_name_unique (name)
);

-- User skills junction table
CREATE TABLE user_skills (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    years_experience INTEGER NOT NULL,
    proficiency VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skill_id)
    UNIQUE (user_id, skill_id)
);

-- Experience table
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Education table
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    institution VARCHAR(200) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE OR NULL,
    gpa DECIMAL(3,2) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    PRIMARY KEY (id)
);

-- Language table (for language skills)
CREATE TABLE languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    proficiency_level VARCHAR(20) DEFAULT 'beginner'
);

-- User languages junction table
CREATE TABLE user_languages (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    proficiency VARCHAR(20) DEFAULT 'beginner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, language_id)
    UNIQUE (user_id, language_id)
);

-- Certifications table
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending',
    verification_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
    UNIQUE (user_id, name)
);

-- User certifications junction table
CREATE TABLE user_certifications (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    certification_id UUID REFERENCES certifications(id) ON DELETE CASCADE,
    earned_date DATE NOT NULL,
    expiry_date DATE OR NULL,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, certification_id)
    UNIQUE (user_id, certification_id)
);

-- Professional Development Hours (for experience tracking)
CREATE TABLE professional_development_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, experience_id)
);

-- Referrals table (for referral programs)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    reward_credits DECIMAL(10,0) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- User notifications preferences
CREATE TABLE user_notification_preferences (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    job_alerts BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    application_updates BOOLEAN DEFAULT true,
    network_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    weekly_report BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

-- Activity tracking (for monitoring user engagement)
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (user_id, entity_type, entity_id, timestamp)
);

-- View tracking (for job impressions)
CREATE TABLE job_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE OR NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    referrer VARCHAR(200),
    user_agent VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (job_id, user_id, viewed_at)
);

-- Application tracking
CREATE TABLE application_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT application_views_unique UNIQUE (job_id, user_id, viewed_at)
);

-- Document tracking
CREATE TABLE document_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE OR NULL,
    document_id UUID NOT NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (user_id, document_id, downloaded_at)
);

-- Event tracking (for system events)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    source_service VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE OR NULL,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) DEFAULT 'info',
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Analytics for user behavior
CREATE TABLE user_analytics (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_sessions INTEGER DEFAULT 0,
    session_duration_avg DECIMAL(8,2) DEFAULT 0,
    pages_viewed INTEGER DEFAULT 0,
    time_on_site_seconds INTEGER DEFAULT 0,
    device_types JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

-- Search history
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE OR NULL,
    search_query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    clicked_result_id UUID OR NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (id, user_id, search_query)
);

-- Saved jobs
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT saved_jobs_unique UNIQUE (user_id, job_id)
);

-- Rating history for audit trails
CREATE TABLE rating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE OR NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_id UUID OR NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (entity_type, entity_id, user_id, rating)
);

-- Connection history (for networking analysis)
CREATE TABLE connection_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_service VARCHAR(50) NOT NULL,
    to_service VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    PRIMARY KEY (id)
);

---

-- Constraints and Indexes
CREATE UNIQUE INDEX users_email_idx ON users(email);
CREATE INDEX users_created_at_idx ON users(created_at);
CREATE INDEX users_active_idx ON users(is_active);

CREATE INDEX user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX skills_user_id_idx ON user_skills(user_id);
CREATE INDEX experiences_user_id_idx ON experiences(user_id);
CREATE INDEX education_user_id_idx ON education(user_id);
CREATE INDEX certifications_user_id_idx ON certifications(user_id);

CREATE INDEX languages_name_idx ON languages(name);
CREATE UNIQUE INDEX user_languages_user_id_idx ON user_languages(user_id, language_id);

CREATE INDEX experiences_user_id_idx ON experiences(user_id, current, start_date, end_date);
CREATE INDEX experiences_company_idx ON experiences(company);
CREATE INDEX experiences_position_idx ON experiences(position);

CREATE INDEX education_user_id_idx ON education(user_id, institution, field_of_study);
CREATE INDEX certifications_user_id_idx ON certifications(user_id, verification_status);
CREATE INDEX experiences_start_date_idx ON experiences(start_date);
CREATE INDEX experiences_end_date_idx ON experiences(end_date);

CREATE UNIQUE INDEX user_skills_user_id_idx ON user_skills(user_id, skill_id);
CREATE UNIQUE INDEX skills_name_idx ON skills(name);
CREATE UNIQUE INDEX skills_user_id_idx ON user_skills(skill_id, proficiency, years_experience);

CREATE INDEX jobs_company_idx ON jobs(company);
CREATE INDEX jobs_location_idx ON jobs(location);
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_created_at_idx ON jobs(created_at);
CREATE INDEX jobs_salary_min_idx ON jobs(salary_min);
CREATE INDEX jobs_salary_max_idx ON jobs(salary_max);

CREATE INDEX companies_industry_idx ON companies(industry);
CREATE INDEX companies_size_idx ON companies(size);
CREATE INDEX companies_location_idx ON companies(city, state, country);

CREATE INDEX companies_rating_idx ON companies(rating);

CREATE INDEX user_certifications_user_id_idx ON user_certifications(user_id, certification_id, verification_status);
CREATE INDEX application_views_job_id_idx ON application_views(job_id, user_id, viewed_at);
CREATE INDEX job_views_job_id_user_id_idx ON job_views(job_id, user_id, viewed_at);

CREATE INDEX job_views_user_id_viewed_at_idx ON job_views(user_id, viewed_at);

CREATE INDEX document_downloads_user_id_idx ON document_downloads(user_id, document_id, downloaded_at);

CREATE INDEX search_history_user_id_idx ON search_history(user_id, search_query);
CREATE INDEX user_activities_entity_id_idx ON user_activities(user_id, entity_id, timestamp);
CREATE INDEX user_analytics_user_id_idx ON user_analytics(user_id);
```

### **Database Migration Strategy**
```javascript
// Migration system configuration
const MIGRATION_CONFIG = {
    strategy: 'incremental',
    batchSize: 100,
    timeout: 30000,
    retries: 3,
    backupEnabled: true,
  rollbackEnabled: true
  environment: process.env.NODE_ENV || 'development'
};
```

### **Connection Pooling Configuration**
```javascript
// Connection pool optimization for all services
const DB_CONFIG = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 60000,
    ssl: process.env.DB_SSL === 'true',
    database: process.env.DB_NAME || 'talentsphere_production',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432
};
```

---

## 🗄️ **PHASE 2: Service Communication Implementation**

### **🔄 HTTP Client Module (CRITICAL)**
```javascript
// Enhanced HTTP client with retry logic, circuit breaker support
const { EnhancedHttpClient } = require('./http-client');
```

**Tasks:**
1. [ ] **Create HTTP Client Module** with circuit breaker and retry logic
2. [ ] **Add Request Interceptors** for tracing
3. [ ] **Service Discovery Client** for automatic service discovery
4. [ ] **Load Balancing Support** with multiple instances
5. [ ] **Error Handling** with comprehensive recovery strategies
6. [ ] **Performance Monitoring** for inter-service calls

### **API Client Integration**
```javascript
// Usage in enhanced services
this.httpClient.get('/api/user-service/users', {
    headers: { 'Authorization': `Bearer ${token}` },
    timeout: 5000
});
```

---

## 🎯 **SUCCESS METRICS FOR DATABASE PHASE**

### **Technical Targets**
- **Query Performance**: <100ms average for all operations
- **Connection Pool Efficiency**: <10ms connection time
- **Data Integrity**: Zero corruption across all operations
- **Migration Reliability**: 100% successful migrations

### **Business Metrics**
- **Data Persistence**: 100% of user data persisted
- **Data Recovery**: Complete backup and recovery procedures
- **Multi-Environment Ready**: Support for dev/staging/production configurations
- **Scalability**: Optimized for horizontal scaling