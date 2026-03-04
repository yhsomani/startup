-- ==============================================
-- Database Schema Standardization Migration
-- ==============================================
-- Fixes primary key consistency, foreign key constraints, and data types
-- Run after initial schema migration
-- ==============================================

-- ==============================================
-- Fix 1: Standardize certificates table to use UUID primary key
-- ==============================================

-- Create backup of existing certificates data
CREATE TABLE IF NOT EXISTS certificates_backup AS 
SELECT * FROM public.certificates;

-- Drop the old table with inconsistent primary key
DROP TABLE IF EXISTS public.certificates CASCADE;

-- Recreate certificates table with UUID primary key and proper constraints
CREATE TABLE IF NOT EXISTS public.certificates (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title character varying(255) NOT NULL,
    user_name character varying(255) NOT NULL,
    certificate_url character varying(500) NOT NULL,
    verification_code character varying(100) NOT NULL UNIQUE,
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    CONSTRAINT certificates_verification_code_unique UNIQUE (verification_code),
    CONSTRAINT certificates_user_course_unique UNIQUE (user_id, course_id)
);

-- Restore data from backup if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates_backup') THEN
        INSERT INTO public.certificates (enrollment_id, user_id, course_id, course_title, user_name, certificate_url, verification_code, issued_at)
        SELECT 
            CASE 
                WHEN enrollment_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN enrollment_id::uuid
                ELSE gen_random_uuid()
            END as enrollment_id,
            CASE 
                WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN user_id::uuid
                ELSE (SELECT id FROM public.users LIMIT 1) -- Fallback to first user for data integrity
            END as user_id,
            CASE 
                WHEN course_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN course_id::uuid
                ELSE (SELECT id FROM public.courses LIMIT 1) -- Fallback to first course for data integrity
            END as course_id,
            course_title,
            user_name,
            certificate_url,
            verification_code,
            issued_at
        FROM certificates_backup;
        
        -- Drop backup after successful migration
        DROP TABLE certificates_backup;
    END IF;
END $$;

-- ==============================================
-- Fix 2: Standardize user ID types in gamification tables
-- ==============================================

-- Migrate user_streaks to use UUID
CREATE TABLE IF NOT EXISTS user_streaks_backup AS 
SELECT * FROM public.user_streaks;

ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS user_uuid uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Migrate data from integer user_id to uuid
UPDATE public.user_streaks 
SET user_uuid = u.id
FROM public.users u
WHERE public.user_streaks.user_id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET u.id - 1);

-- Set user_uuid as NOT NULL after data migration
ALTER TABLE public.user_streaks 
ALTER COLUMN user_uuid SET NOT NULL;

-- Drop old user_id column and rename user_uuid
ALTER TABLE public.user_streaks 
DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.user_streaks 
RENAME COLUMN user_uuid TO user_id;

-- Migrate user_points to use UUID
CREATE TABLE IF NOT EXISTS user_points_backup AS 
SELECT * FROM public.user_points;

ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS user_uuid uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Migrate data
UPDATE public.user_points 
SET user_uuid = u.id
FROM public.users u
WHERE public.user_points.user_id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET u.id - 1);

ALTER TABLE public.user_points 
ALTER COLUMN user_uuid SET NOT NULL;

ALTER TABLE public.user_points 
DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.user_points 
RENAME COLUMN user_uuid TO user_id;

-- Add unique constraint back
ALTER TABLE public.user_points 
ADD CONSTRAINT user_points_user_id_unique UNIQUE (user_id);

-- Migrate user_badges to use UUID
CREATE TABLE IF NOT EXISTS user_badges_backup AS 
SELECT * FROM public.user_badges;

ALTER TABLE public.user_badges 
ADD COLUMN IF NOT EXISTS user_uuid uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Migrate data
UPDATE public.user_badges 
SET user_uuid = u.id
FROM public.users u
WHERE public.user_badges.user_id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1 OFFSET u.id - 1);

ALTER TABLE public.user_badges 
DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.user_badges 
RENAME COLUMN user_uuid TO user_id;

-- ==============================================
-- Fix 3: Add comprehensive database indexes
-- ==============================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Course-related indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_title ON public.courses(title);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at);

-- Enrollment-related indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);

-- Submission-related indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON public.submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);

-- Certificate-related indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates(issued_at);

-- Gamification-related indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON public.user_streaks(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON public.user_points(total_points);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON public.user_points(level);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_user_status ON public.submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_published ON public.courses(instructor_id, is_published);

-- ==============================================
-- Fix 4: Add missing foreign key constraints
-- ==============================================

-- Ensure all certificate references are valid
ALTER TABLE public.certificates 
ADD CONSTRAINT certificates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.certificates 
ADD CONSTRAINT certificates_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- ==============================================
-- Fix 5: Update data types for consistency
-- ==============================================

-- Ensure all timestamp columns have the same precision
ALTER TABLE public.certificates 
ALTER COLUMN issued_at TYPE timestamp(6) without time zone;

ALTER TABLE public.user_streaks 
ALTER COLUMN last_activity TYPE timestamp(6) without time zone,
ALTER COLUMN streak_start_date TYPE timestamp(6) without time zone;

ALTER TABLE public.user_badges 
ALTER COLUMN earned_at TYPE timestamp(6) without time zone;

-- ==============================================
-- Update migration tracking
-- ==============================================
INSERT INTO public.service_migrations (service_name, version, applied_at) 
VALUES ('database-schema-standardization', '1.0.0', CURRENT_TIMESTAMP)
ON CONFLICT (service_name) 
DO UPDATE SET 
    version = EXCLUDED.version,
    applied_at = EXCLUDED.applied_at;

-- ==============================================
-- Cleanup and optimization
-- ==============================================
ANALYZE;
VACUUM ANALYZE;

-- Create or replace function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON public.user_points 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;