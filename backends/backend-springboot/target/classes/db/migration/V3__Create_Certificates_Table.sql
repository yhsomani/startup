-- Create certificates table for course completion certificates
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY,
    enrollment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    course_id VARCHAR(255) NOT NULL,
    course_title VARCHAR(500) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    certificate_url VARCHAR(1000) NOT NULL,
    verification_code VARCHAR(50) NOT NULL UNIQUE,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT unique_enrollment_certificate UNIQUE (enrollment_id)
);

-- Create index on verification code for fast lookup
CREATE INDEX idx_verification_code ON certificates(verification_code);

-- Create index on enrollment_id
CREATE INDEX idx_enrollment_id ON certificates(enrollment_id);
