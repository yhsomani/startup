-- Migration: 008_implement_sharding.sql
-- Implements Citus horizontal sharding for high-volume tables
-- Run this after base schema migrations (001-007)

-- Ensure Citus extension is available
CREATE EXTENSION IF NOT EXISTS citus;

-- ============================================
-- STEP 1: Add Worker Nodes (run once per cluster)
-- ============================================
-- Note: In Kubernetes, workers auto-register. For docker-compose, run:
-- SELECT citus_add_node('citus-worker-1', 5432);
-- SELECT citus_add_node('citus-worker-2', 5432);

-- Verify cluster setup
-- SELECT * FROM citus_get_active_worker_nodes();

-- ============================================
-- STEP 2: Convert Tables to Distributed
-- ============================================

-- ============================================
-- HIGH-VOLUME: Analytics & Events (by timestamp)
-- ============================================

-- User Activities - distributed by timestamp for time-range queries
-- Use this for: activity dashboards, user engagement metrics
SELECT create_distributed_table(
    'user_activities',
    'timestamp',
    shard_count => 64,
    shard_max_size => 1024  -- 1GB max per shard
);

-- Events - high volume event stream
-- Use this for: system audit logs, analytics
SELECT create_distributed_table(
    'events',
    'timestamp',
    shard_count => 64,
    shard_max_size => 2048  -- 2GB max per shard
);

-- Job Views - time-series impressions
SELECT create_distributed_table(
    'job_views',
    'viewed_at',
    shard_count => 32
);

-- Application Views - time-series
SELECT create_distributed_table(
    'application_views',
    'viewed_at',
    shard_count => 32
);

-- Search History - time-series
SELECT create_distributed_table(
    'search_history',
    'created_at',
    shard_count => 32
);

-- ============================================
-- USER-CENTRIC: All data for a user on same shard
-- ============================================

-- Users - core entity, high cardinality
SELECT create_distributed_table(
    'users',
    'id',
    shard_count => 32
);

-- User Profiles - co-located with users (automatic via foreign key)
SELECT create_distributed_table(
    'user_profiles',
    'user_id',
    colocate_with => 'users'
);

-- User Skills - co-located
SELECT create_distributed_table(
    'user_skills',
    'user_id',
    colocate_with => 'users'
);

-- Experiences - co-located
SELECT create_distributed_table(
    'experiences',
    'user_id',
    colocate_with => 'users'
);

-- Education - co-located
SELECT create_distributed_table(
    'education',
    'user_id',
    colocate_with => 'users'
);

-- User Languages - co-located
SELECT create_distributed_table(
    'user_languages',
    'user_id',
    colocate_with => 'users'
);

-- Certifications - co-located
SELECT create_distributed_table(
    'certifications',
    'user_id',
    colocate_with => 'users'
);

-- User Certifications - co-located
SELECT create_distributed_table(
    'user_certifications',
    'user_id',
    colocate_with => 'users'
);

-- Referrals - co-located
SELECT create_distributed_table(
    'referrals',
    'referrer_id',
    colocate_with => 'users'
);

-- User Analytics - co-located (for fast user-level aggregations)
SELECT create_distributed_table(
    'user_analytics',
    'user_id',
    colocate_with => 'users'
);

-- ============================================
-- COMPANY-CENTRIC: Job-related data
-- ============================================

-- Job Listings - distributed by company for company-centric queries
SELECT create_distributed_table(
    'job_listings',
    'company_id',
    shard_count => 16
);

-- Saved Jobs - co-located with users for quick lookup
SELECT create_distributed_table(
    'saved_jobs',
    'user_id',
    colocate_with => 'users'
);

-- ============================================
-- STEP 3: Reference Tables (replicated to all workers)
-- ============================================

-- These small tables are copied to every worker for fast joins
-- Do NOT use for high-volume transactional tables

SELECT create_reference_table('skills');
SELECT create_reference_table('languages');
SELECT create_reference_table('companies');

-- ============================================
-- STEP 4: Create Indexes (after distribution)
-- ============================================

-- User-centric indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_job_title ON user_profiles(job_title);
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience ON user_profiles(experience_level);

CREATE INDEX IF NOT EXISTS idx_experiences_company ON experiences(company);
CREATE INDEX IF NOT EXISTS idx_experiences_position ON experiences(position);

CREATE INDEX IF NOT EXISTS idx_education_institution ON education(institution);

-- Time-series indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_entity ON user_activities(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source_service);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);

-- Job indexes
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_location ON job_listings((location->>'city'));

-- ============================================
-- STEP 5: Verify Distribution
-- ============================================

-- Check shard distribution
-- SELECT * FROM citus_shards WHERE shardid > 0;

-- Check colocation groups
-- SELECT * FROM citus_shard_placements;

-- Verify reference tables
-- SELECT * FROM citus_get_rebalance_shard_placements() WHERE shardid > 0;

-- ============================================
-- IMPORTANT: Application Query Rules
-- ============================================
/*
CRITICAL: All queries on distributed tables MUST include shard key:

✅ GOOD - Routes to single shard:
  SELECT * FROM users WHERE id = 'uuid-here';
  SELECT * FROM user_activities WHERE timestamp > '2024-01-01';

❌ BAD - Broadcasts to ALL shards (very slow):
  SELECT * FROM users WHERE email = 'test@example.com';
  SELECT * FROM user_activities WHERE activity_type = 'login';

For non-shard-key queries, use Elasticsearch or aggregate offline.
*/
