-- ==============================================
-- TalentSphere Database Schema Migration
-- ==============================================
-- This script initializes the complete database schema
-- Run once after creating the PostgreSQL database
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE)
-- ==============================================

-- Tables with no dependencies (base tables)

-- Users table (base for all user references)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) without time zone,
    email character varying(255) NOT NULL UNIQUE,
    is_active boolean DEFAULT true,
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['STUDENT'::character varying, 'INSTRUCTOR'::character varying, 'ADMIN'::character varying])::text[])))
);

-- Challenges table (base for submissions)
CREATE TABLE IF NOT EXISTS public.challenges (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) without time zone,
    dataset_url character varying(255),
    description text,
    evaluation_metric character varying(255),
    is_active boolean DEFAULT true,
    passing_score numeric(38,2),
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);

-- Courses table (depends on users for instructor_id)
CREATE TABLE IF NOT EXISTS public.courses (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) without time zone,
    currency character varying(3) DEFAULT 'USD',
    description text,
    is_active boolean DEFAULT true,
    is_published boolean DEFAULT false,
    preview_video_url character varying(255),
    price numeric(38,2) NOT NULL DEFAULT 0,
    subtitle character varying(255),
    thumbnail_url character varying(255),
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    instructor_id uuid NOT NULL REFERENCES public.users(id)
);

-- Course skills (depends on courses)
CREATE TABLE IF NOT EXISTS public.course_skills (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) without time zone,
    skill_name character varying(255) NOT NULL,
    course_id uuid NOT NULL REFERENCES public.courses(id)
);

-- Sections (depends on courses)
CREATE TABLE IF NOT EXISTS public.sections (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) without time zone,
    is_active boolean DEFAULT true,
    order_index integer NOT NULL,
    title character varying(255) NOT NULL,
    course_id uuid NOT NULL REFERENCES public.courses(id)
);

-- Lessons (depends on sections)
CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid NOT NULL PRIMARY KEY,
    challenge_id uuid,
    content_markdown text,
    created_at timestamp(6) without time zone,
    description text,
    duration integer,
    is_active boolean DEFAULT true,
    order_index integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    video_url character varying(255),
    section_id uuid NOT NULL REFERENCES public.sections(id),
    CONSTRAINT lessons_type_check CHECK (((type)::text = ANY ((ARRAY['video'::character varying, 'quiz'::character varying, 'challenge'::character varying, 'text'::character varying])::text[])))
);

-- Enrollments (depends on users and courses)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id uuid NOT NULL PRIMARY KEY,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone,
    enrolled_at timestamp(6) without time zone,
    is_active boolean DEFAULT true,
    last_accessed_at timestamp(6) without time zone,
    progress_percentage integer DEFAULT 0,
    status character varying(50) NOT NULL DEFAULT 'active',
    updated_at timestamp(6) without time zone,
    course_id uuid NOT NULL REFERENCES public.courses(id),
    user_id uuid NOT NULL REFERENCES public.users(id),
    CONSTRAINT unique_user_course UNIQUE (user_id, course_id),
    CONSTRAINT enrollments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'paused'::character varying, 'cancelled'::character varying])::text[])))
);

-- Lesson progress (depends on enrollments and lessons)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id uuid NOT NULL PRIMARY KEY,
    completed_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone,
    is_active boolean DEFAULT true,
    is_completed boolean DEFAULT false,
    last_accessed_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    video_position_seconds integer DEFAULT 0,
    enrollment_id uuid NOT NULL REFERENCES public.enrollments(id),
    lesson_id uuid NOT NULL REFERENCES public.lessons(id),
    CONSTRAINT unique_enrollment_lesson UNIQUE (enrollment_id, lesson_id)
);

-- Submissions (depends on challenges and users)
CREATE TABLE IF NOT EXISTS public.submissions (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp(6) without time zone,
    feedback text,
    file_path character varying(255) NOT NULL,
    graded_at timestamp(6) without time zone,
    is_active boolean DEFAULT true,
    score numeric(38,2),
    status character varying(255) NOT NULL DEFAULT 'pending',
    submitted_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    challenge_id uuid NOT NULL REFERENCES public.challenges(id),
    user_id uuid NOT NULL REFERENCES public.users(id),
    CONSTRAINT submissions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'grading'::character varying, 'passed'::character varying, 'failed'::character varying])::text[])))
);

-- Certificates (with proper foreign key constraints)
CREATE TABLE IF NOT EXISTS public.certificates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title character varying(255) NOT NULL,
    user_name character varying(255) NOT NULL,
    certificate_url character varying(500) NOT NULL,
    verification_code character varying(100) NOT NULL UNIQUE,
    issued_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT certificates_user_course_unique UNIQUE (user_id, course_id)
);

-- ==============================================
-- Gamification Tables
-- ==============================================

-- User streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity timestamp(6) without time zone,
    streak_start_date timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);

-- User points
CREATE TABLE IF NOT EXISTS public.user_points (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    total_points integer DEFAULT 0,
    level integer DEFAULT 1,
    points_to_next_level integer DEFAULT 100,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);

-- User badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id character varying(50) NOT NULL,
    badge_name character varying(100),
    badge_icon character varying(10),
    earned_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- ==============================================
-- Service Migration Tracking Table
-- ==============================================

CREATE TABLE IF NOT EXISTS public.service_migrations (
    service_name character varying(255) NOT NULL PRIMARY KEY,
    version character varying(50) NOT NULL,
    applied_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    checksum character varying(64)
);

-- ==============================================
-- Comprehensive Indexes for Performance
-- ==============================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Course-related indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_title ON public.courses(title);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at);

-- Enrollment-related indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);

-- Submission-related indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON public.submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);

-- Certificate-related indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates(issued_at);

-- Gamification-related indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON public.user_streaks(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON public.user_points(total_points);
CREATE INDEX IF NOT EXISTS idx_user_points_level ON public.user_points(level);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.enrollments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_user_status ON public.submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_published ON public.courses(instructor_id, is_published);

-- Lesson progress indexes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON public.lesson_progress(is_completed);

-- Service migrations index
CREATE INDEX IF NOT EXISTS idx_service_migrations_applied_at ON public.service_migrations(applied_at);

-- ==============================================
-- Schema Complete
-- ==============================================
