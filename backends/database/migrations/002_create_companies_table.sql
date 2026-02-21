-- Company-related tables

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50), -- startup, small, medium, large, enterprise
    founded_year INTEGER,
    website VARCHAR(500),
    logo_url VARCHAR(500),
    headquarters VARCHAR(255),
    company_type VARCHAR(100), -- public, private, non-profit, government
    revenue_range VARCHAR(50), -- <1M, 1-10M, 10-50M, 50-100M, 100M+, etc.
    employee_count INTEGER,
    hq_country VARCHAR(2), -- ISO country code
    hq_city VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search and indexing
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', name), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(industry, '')), 'C')
    ) STORED
);

-- Company locations (multiple offices)
CREATE TABLE IF NOT EXISTS company_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(2) NOT NULL, -- ISO country code
    state_province VARCHAR(100),
    address TEXT,
    is_headquarters BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company social media links
CREATE TABLE IF NOT EXISTS company_social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- linkedin, twitter, facebook, instagram, youtube
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, platform)
);

-- Company benefits and perks
CREATE TABLE IF NOT EXISTS company_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    benefit_name VARCHAR(255) NOT NULL,
    benefit_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company reviews
CREATE TABLE IF NOT EXISTS company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Allow anonymous reviews
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    pros TEXT,
    cons TEXT,
    review_title VARCHAR(500),
    employment_status VARCHAR(100), -- current, former, intern
    job_title VARCHAR(255),
    years_worked INTEGER,
    is_recommended BOOLEAN,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified by company
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, user_id) -- One review per user per company
);

-- Company followers (users following companies)
CREATE TABLE IF NOT EXISTS company_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_size ON companies(size);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON companies USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON companies USING GIN(name gin_trgm_ops);

-- Company locations indexes
CREATE INDEX IF NOT EXISTS idx_company_locations_company_id ON company_locations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_locations_country ON company_locations(country);
CREATE INDEX IF NOT EXISTS idx_company_locations_city ON company_locations(city);

-- Company social links indexes
CREATE INDEX IF NOT EXISTS idx_company_social_links_company_id ON company_social_links(company_id);

-- Company benefits indexes
CREATE INDEX IF NOT EXISTS idx_company_benefits_company_id ON company_benefits(company_id);

-- Company reviews indexes
CREATE INDEX IF NOT EXISTS idx_company_reviews_company_id ON company_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_company_reviews_user_id ON company_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_company_reviews_rating ON company_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_company_reviews_is_verified ON company_reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_company_reviews_created_at ON company_reviews(created_at DESC);

-- Company followers indexes
CREATE INDEX IF NOT EXISTS idx_company_followers_company_id ON company_followers(company_id);
CREATE INDEX IF NOT EXISTS idx_company_followers_user_id ON company_followers(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_reviews_updated_at BEFORE UPDATE ON company_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();