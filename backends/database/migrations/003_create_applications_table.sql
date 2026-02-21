-- Application tracking and management tables

-- Job applications (extended version)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    user_id UUID NOT NULL,
    company_id UUID, -- Denormalized for performance
    
    -- Application status workflow
    status VARCHAR(50) DEFAULT 'pending', -- pending, viewed, screening, interviewing, offer, rejected, withdrawn, hired
    substatus VARCHAR(100), -- More detailed status (e.g., phone_screen, technical_interview)
    
    -- Application details
    cover_letter TEXT,
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    expected_salary DECIMAL(12, 2),
    current_salary DECIMAL(12, 2),
    notice_period VARCHAR(50), -- immediate, 2_weeks, 1_month, etc.
    work_authorization VARCHAR(100), -- citizen, work_visa, student_visa, etc.
    
    -- Recruiter information
    recruiter_id UUID REFERENCES users(id), -- Internal recruiter if any
    assigned_to UUID REFERENCES users(id), -- Assigned recruiter
    
    -- Application timeline
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_viewed_at TIMESTAMP WITH TIME ZONE,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Application source
    source VARCHAR(100), -- job_board, referral, company_website, linkedin, etc.
    source_details TEXT, -- Additional source information
    
    -- Application feedback
    employer_notes TEXT,
    internal_notes TEXT,
    rejection_reason VARCHAR(500),
    
    -- Metadata
    is_withdrawn BOOLEAN DEFAULT FALSE,
    withdrawal_reason TEXT,
    is_starred BOOLEAN DEFAULT FALSE, -- Marked as important
    
    CONSTRAINT unique_application UNIQUE(job_id, user_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'viewed', 'screening', 'interviewing', 'offer', 'rejected', 'withdrawn', 'hired'))
);

-- Application timeline events
CREATE TABLE IF NOT EXISTS application_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- status_change, note, interview_scheduled, offer_made, etc.
    event_data JSONB, -- Flexible data storage for different event types
    created_by UUID REFERENCES users(id), -- Who created the event
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    notes TEXT -- Optional notes about the event
);

-- Interview schedules
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    interview_type VARCHAR(50) NOT NULL, -- phone, video, onsite, technical, behavioral
    interview_round INTEGER DEFAULT 1, -- First, second, final round, etc.
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    interviewer_ids UUID[] REFERENCES users(id), -- Array of interviewer IDs
    location VARCHAR(255), -- Meeting link or physical address
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(100), -- For video conferencing integration
    
    -- Interview status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    feedback JSONB, -- Structured feedback from interviewers
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- Overall rating
    notes TEXT,
    
    scheduled_by UUID REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offers made to candidates
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Offer details
    offer_type VARCHAR(50) NOT NULL, -- full_time, contract, internship, freelance
    job_title VARCHAR(255) NOT NULL,
    salary_base DECIMAL(12, 2),
    salary_bonus DECIMAL(12, 2),
    salary_equity VARCHAR(500), -- Equity description
    total_compensation DECIMAL(12, 2),
    
    -- Employment terms
    start_date DATE,
    location VARCHAR(255),
    work_remote BOOLEAN DEFAULT FALSE,
    work_hybrid BOOLEAN DEFAULT FALSE,
    work_hours_per_week INTEGER,
    employment_duration VARCHAR(50), -- permanent, 6_months, 1_year, etc.
    
    -- Benefits
    benefits TEXT[],
    signing_bonus DECIMAL(12, 2),
    relocation_bonus DECIMAL(12, 2),
    other_compensation TEXT,
    
    -- Offer status
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired, withdrawn
    expiration_date DATE,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    offer_letter_url VARCHAR(500),
    internal_notes TEXT,
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application analytics and metrics
CREATE TABLE IF NOT EXISTS application_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    
    -- Daily metrics
    total_applications INTEGER DEFAULT 0,
    new_applications INTEGER DEFAULT 0,
    viewed_applications INTEGER DEFAULT 0,
    interviewing_applications INTEGER DEFAULT 0,
    offers_made INTEGER DEFAULT 0,
    offers_accepted INTEGER DEFAULT 0,
    applications_rejected INTEGER DEFAULT 0,
    
    -- Conversion rates
    view_to_interview_rate DECIMAL(5, 2),
    interview_to_offer_rate DECIMAL(5, 2),
    offer_to_acceptance_rate DECIMAL(5, 2),
    overall_conversion_rate DECIMAL(5, 2),
    
    -- Time metrics (in days)
    avg_time_to_first_view DECIMAL(5, 2),
    avg_time_to_interview DECIMAL(5, 2),
    avg_time_to_offer DECIMAL(5, 2),
    avg_time_to_hire DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date)
);

-- Indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_company_id ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_recruiter_id ON applications(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON applications(assigned_to);

-- Application events indexes
CREATE INDEX IF NOT EXISTS idx_application_events_application_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_application_events_created_at ON application_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_events_event_type ON application_events(event_type);

-- Interviews indexes
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_ids ON interviews USING GIN(interviewer_ids);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- Offers indexes
CREATE INDEX IF NOT EXISTS idx_offers_application_id ON offers(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_expiration_date ON offers(expiration_date);

-- Application analytics indexes
CREATE INDEX IF NOT EXISTS idx_application_analytics_date ON application_analytics(date DESC);

-- Triggers for updated_at
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();