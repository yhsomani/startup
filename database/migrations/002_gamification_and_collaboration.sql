-- TalentSphere Database Schema v002
-- Add gamification tables and indexes
-- Version: 002
-- Description: Adds gamification features for user engagement

BEGIN;

-- Create user_streaks table for tracking daily learning streaks
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    streak_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create user_badges table for earned achievements
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    badge_icon VARCHAR(10) NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Create user_points table for points and levels
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    level INTEGER DEFAULT 1 CHECK (level > 0),
    points_to_next_level INTEGER DEFAULT 100 CHECK (points_to_next_level > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create collaboration_sessions table for real-time collaboration
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) DEFAULT 'general' CHECK (session_type IN ('general', 'coding', 'review', 'meeting')),
    max_participants INTEGER DEFAULT 4 CHECK (max_participants > 0 AND max_participants <= 50),
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_participants table for tracking session members
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant')),
    UNIQUE(session_id, user_id)
);

-- Create session_messages table for chat and collaboration data
CREATE TABLE IF NOT EXISTS session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'code', 'file', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_events table for tracking user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON user_streaks(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total_points ON user_points(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_creator_id ON collaboration_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_status ON collaboration_sessions(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_created_at ON collaboration_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_joined_at ON session_participants(joined_at);

CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_user_id ON session_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created_at ON session_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_session_messages_type ON session_messages(message_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
    BEFORE UPDATE ON user_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_sessions_updated_at
    BEFORE UPDATE ON collaboration_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_participants_last_active
    BEFORE UPDATE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_messages_updated_at
    BEFORE UPDATE ON session_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default badge definitions
INSERT INTO user_badges (user_id, badge_id, badge_name, badge_icon)
SELECT 
    gen_random_uuid(), 
    badge_id, 
    badge_name, 
    badge_icon
FROM (VALUES 
    ('first_course', 'First Course Complete', '🎓'),
    ('week_warrior', '7-Day Streak', '🔥'),
    ('month_master', '30-Day Streak', '💪'),
    ('code_master', '100 Challenges Solved', '💻'),
    ('perfect_score', 'Perfect Challenge Score', '⭐'),
    ('top_learner', 'Top 10% Student', '🏆'),
    ('helpful_peer', 'Helped 10 Students', '🤝'),
    ('fast_learner', 'Completed Course in 1 Week', '⚡')
) AS badges(badge_id, badge_name, badge_icon)
WHERE NOT EXISTS (
    SELECT 1 FROM user_badges WHERE badge_id = badges.badge_id
) LIMIT 1; -- Just create template badges (user_id will be overridden in real usage)

-- Create views for common queries
CREATE OR REPLACE VIEW user_gamification_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(us.current_streak, 0) as current_streak,
    COALESCE(us.longest_streak, 0) as longest_streak,
    COALESCE(up.total_points, 0) as total_points,
    COALESCE(up.level, 1) as level,
    COALESCE(ub.badge_count, 0) as badges_earned
FROM users u
LEFT JOIN user_streaks us ON u.id = us.user_id
LEFT JOIN user_points up ON u.id = up.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as badge_count
    FROM user_badges
    GROUP BY user_id
) ub ON u.id = ub.user_id;

-- Create active sessions view
CREATE OR REPLACE VIEW active_collaboration_sessions AS
SELECT 
    cs.id,
    cs.name,
    cs.session_type,
    cs.status,
    cs.created_at,
    cs.creator_id,
    creator.first_name as creator_name,
    creator.email as creator_email,
    COUNT(sp.id) as participant_count,
    cs.max_participants
FROM collaboration_sessions cs
JOIN users creator ON cs.creator_id = creator.id
LEFT JOIN session_participants sp ON cs.id = sp.session_id
WHERE cs.status = 'active'
GROUP BY cs.id, creator.first_name, creator.email
ORDER BY cs.created_at DESC;

COMMIT;

-- Migration completed
-- Version: 002 applied successfully