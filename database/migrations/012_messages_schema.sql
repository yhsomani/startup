-- Migration: Messages Schema Phase 4
-- Creates the messages table for recruiter-to-developer messaging

DO $$ BEGIN
    CREATE TYPE message_status_enum AS ENUM ('sent', 'read', 'replied', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  from_recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  status message_status_enum DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_timestamps ON messages(to_developer_id, sent_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recruiter ON messages(from_recruiter_id, sent_at DESC);

-- Unique constraint for rate limiting (1 message per recruiter->developer per week)
-- Since we want exactly 1 message per week, doing it at the DB level perfectly is hard without a partial index or trigger.
-- We can add a simple index to make querying for rate limits fast.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_rate_limit ON messages(from_recruiter_id, to_developer_id, sent_at DESC);
