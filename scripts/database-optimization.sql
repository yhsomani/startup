-- Database Performance Optimization for TalentSphere
-- This script creates indexes and optimizes queries for better performance

-- Users table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

-- Courses table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_active ON courses(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_popularity ON courses(enrollment_count DESC);

-- Enrollments table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments(enrolled_at DESC);

-- Lessons table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_course ON lessons(course_id, order_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_type ON lessons(lesson_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_duration ON lessons(duration);

-- Progress table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_course ON progress(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_lesson ON progress(lesson_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_user_course ON progress(user_id, course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_completed ON progress(is_completed) WHERE is_completed = true;

-- Challenges table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_tags ON challenges USING GIN(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_active ON challenges(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_language ON challenges(preferred_language);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_created_at ON challenges(created_at DESC);

-- Submissions table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_challenge ON submissions(challenge_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_challenge ON submissions(user_id, challenge_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_score ON submissions(score DESC);

-- Test Cases table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_cases_challenge ON test_cases(challenge_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_cases_difficulty ON test_cases(difficulty);

-- Activity Logs table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_type ON activity_logs(user_id, activity_type, created_at DESC);

-- Notifications table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Badges table optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_badges_user ON badges(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_badges_type ON badges(badge_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_badges_earned_at ON badges(earned_at DESC);

-- Create materialized views for complex queries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_course_statistics AS
SELECT 
    c.id,
    c.title,
    COUNT(e.id) as enrollment_count,
    AVG(CASE WHEN p.is_completed THEN 1 ELSE 0 END) * 100 as completion_rate,
    AVG(p.completion_percentage) as avg_completion_percentage,
    c.created_at
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
LEFT JOIN progress p ON c.id = p.course_id
WHERE c.is_active = true
GROUP BY c.id, c.title, c.created_at;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_progress_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT e.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN p.is_completed THEN e.course_id END) as completed_courses,
    AVG(p.completion_percentage) as avg_progress,
    COUNT(DISTINCT s.challenge_id) as attempted_challenges,
    COUNT(DISTINCT CASE WHEN s.status = 'accepted' THEN s.challenge_id END) as solved_challenges,
    MAX(p.updated_at) as last_activity
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id AND e.status = 'active'
LEFT JOIN progress p ON u.id = p.user_id
LEFT JOIN submissions s ON u.id = s.user_id
GROUP BY u.id, u.email;

-- Create functions to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_course_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_statistics;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_user_progress_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_progress_summary;
END;
$$ LANGUAGE plpgsql;

-- Set up periodic refresh using pg_cron (if available)
-- SELECT cron.schedule('refresh-statistics', '0 */6 * * *', 'SELECT refresh_course_statistics(); SELECT refresh_user_progress_summary();');

-- Create optimized search function
CREATE OR REPLACE FUNCTION search_courses(search_term TEXT, category_filter TEXT DEFAULT NULL, level_filter TEXT DEFAULT NULL)
RETURNS TABLE(id UUID, title VARCHAR, description TEXT, match_score REAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        CASE 
            WHEN search_term IS NULL THEN 0
            WHEN c.title ILIKE '%' || search_term || '%' THEN 1.0
            WHEN c.description ILIKE '%' || search_term || '%' THEN 0.8
            ELSE 0.5
        END +
        CASE 
            WHEN category_filter IS NOT NULL AND c.category = category_filter THEN 0.2
            ELSE 0
        END +
        CASE 
            WHEN level_filter IS NOT NULL AND c.level = level_filter THEN 0.2
            ELSE 0
        END as match_score
    FROM courses c
    WHERE c.is_active = true
      AND (search_term IS NULL OR c.title ILIKE '%' || search_term || '%' OR c.description ILIKE '%' || search_term || '%')
      AND (category_filter IS NULL OR c.category = category_filter)
      AND (level_filter IS NULL OR c.level = level_filter)
    ORDER BY match_score DESC, c.enrollment_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Optimize connection settings (requires superuser privileges)
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;
-- ALTER SYSTEM SET random_page_cost = 1.1;
-- ALTER SYSTEM SET effective_io_concurrency = 200;
-- SELECT pg_reload_conf();

-- Add partitioning for large tables (optional for high-traffic deployments)
-- This example partitions submissions by month
/*
CREATE TABLE submissions_partitioned (
    LIKE submissions INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE submissions_2024_01 PARTITION OF submissions_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE submissions_2024_02 PARTITION OF submissions_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
*/

-- Create vacuum and analyze schedule
-- This should be scheduled to run during off-peak hours
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE courses;
-- VACUUM ANALYZE enrollments;
-- VACUUM ANALYZE submissions;

-- Performance monitoring queries
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries (requires pg_stat_statements)
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;