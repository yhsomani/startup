-- Migration: PRD V1 Challenge Engine Schemas
-- Adds tables for challenges, test cases, templates, and attempts.

-- 1. Create difficulty enum
CREATE TYPE challenge_difficulty_enum AS ENUM ('easy', 'medium', 'hard');

-- 2. Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  difficulty challenge_difficulty_enum NOT NULL DEFAULT 'easy',
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  time_limit_ms INTEGER DEFAULT 5000,
  memory_limit_mb INTEGER DEFAULT 256,
  pass_rate_percent INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Challenge Skills (Linking challenges to skills)
CREATE TABLE IF NOT EXISTS challenge_skills (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  points INTEGER DEFAULT 1,
  PRIMARY KEY (challenge_id, skill_name)
);

-- 4. Challenge Test Cases
CREATE TABLE IF NOT EXISTS challenge_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  input_data TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  weight INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Challenge Templates (Starter code per language)
CREATE TABLE IF NOT EXISTS challenge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  language VARCHAR(50) NOT NULL,
  starter_code TEXT NOT NULL,
  solution_code TEXT, -- reference solution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (challenge_id, language)
);

-- 6. Challenge Attempts (User submissions)
CREATE TYPE challenge_status_enum AS ENUM ('passed', 'failed', 'syntax_error', 'timeout');

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  status challenge_status_enum NOT NULL,
  execution_time_ms INTEGER,
  memory_used_mb NUMERIC(8,2),
  passed_test_count INTEGER DEFAULT 0,
  total_test_count INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  used_hint BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_id ON challenge_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_challenge_id ON challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_status ON challenge_attempts(status);
