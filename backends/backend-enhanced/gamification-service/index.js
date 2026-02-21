/**
 * TalentSphere Gamification Service
 * Handles points, badges, streaks, levels, and leaderboard
 * Port: 3015
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// ─── Logger ───────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [new winston.transports.Console()]
});

// ─── Database ─────────────────────────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/talentsphere',
    min: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// ─── Level thresholds ─────────────────────────────────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
const POINT_ACTIONS = {
    profile_complete: 50,
    job_apply: 10,
    job_save: 2,
    resume_upload: 20,
    badge_earned: 25,
    daily_login: 5,
    profile_view: 1,
    referral: 100,
    interview_scheduled: 30,
};

const BADGES = {
    first_application: { name: 'First Steps', icon: '🚀', description: 'Applied to your first job' },
    ten_applications: { name: 'Go-Getter', icon: '🎯', description: 'Applied to 10 jobs' },
    profile_complete: { name: 'Pro Profile', icon: '⭐', description: 'Completed your profile 100%' },
    seven_day_streak: { name: 'Week Warrior', icon: '🔥', description: '7-day login streak' },
    thirty_day_streak: { name: 'Dedicated', icon: '💪', description: '30-day login streak' },
    resume_uploaded: { name: 'Resume Ready', icon: '📄', description: 'Uploaded your resume' },
    first_interview: { name: 'Interview Star', icon: '🎤', description: 'Scheduled your first interview' },
    referrer: { name: 'Community Builder', icon: '🤝', description: 'Referred a friend' },
    level_5: { name: 'Rising Talent', icon: '🌟', description: 'Reached Level 5' },
    level_10: { name: 'TalentSphere Elite', icon: '👑', description: 'Reached Level 10' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getLevel = (points) => {
    let level = 1;
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
        else break;
    }
    return level;
};

const getPointsToNextLevel = (points) => {
    const level = getLevel(points);
    if (level >= LEVEL_THRESHOLDS.length) return 0;
    return LEVEL_THRESHOLDS[level] - points;
};

// ─── DB helpers ───────────────────────────────────────────────────────────────
async function ensureUserRecord(userId) {
    await pool.query(`
        INSERT INTO gamification_users (user_id, total_points, level)
        VALUES ($1, 0, 1)
        ON CONFLICT (user_id) DO NOTHING
    `, [userId]);
}

async function ensureSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS gamification_users (
            user_id       TEXT PRIMARY KEY,
            total_points  INTEGER NOT NULL DEFAULT 0,
            level         INTEGER NOT NULL DEFAULT 1,
            created_at    TIMESTAMPTZ DEFAULT NOW(),
            updated_at    TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS gamification_points (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     TEXT NOT NULL REFERENCES gamification_users(user_id),
            action      TEXT NOT NULL,
            points      INTEGER NOT NULL,
            description TEXT,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS gamification_badges (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     TEXT NOT NULL REFERENCES gamification_users(user_id),
            badge_key   TEXT NOT NULL,
            name        TEXT NOT NULL,
            icon        TEXT NOT NULL,
            description TEXT,
            earned_at   TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, badge_key)
        );

        CREATE TABLE IF NOT EXISTS gamification_streaks (
            user_id          TEXT PRIMARY KEY REFERENCES gamification_users(user_id),
            current_streak   INTEGER NOT NULL DEFAULT 0,
            longest_streak   INTEGER NOT NULL DEFAULT 0,
            last_checkin     DATE,
            updated_at       TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_gp_user ON gamification_points(user_id);
        CREATE INDEX IF NOT EXISTS idx_gb_user ON gamification_badges(user_id);
    `);
    logger.info('Gamification schema ready');
}

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ─── Health & Metrics ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'gamification-service', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/metrics', (req, res) => {
    const mem = process.memoryUsage();
    const fmt = (b) => `${(b / 1024 / 1024).toFixed(1)} MB`;
    res.json({
        service: 'gamification-service',
        version: '1.0.0',
        health: { status: 'healthy', uptime: process.uptime() * 1000 },
        performance: {
            uptime: process.uptime() * 1000,
            memory: { rss: fmt(mem.rss), heapUsed: fmt(mem.heapUsed), heapTotal: fmt(mem.heapTotal) }
        },
        timestamp: new Date().toISOString()
    });
});

// ─── Points ───────────────────────────────────────────────────────────────────

// GET /users/:id/points
app.get('/users/:id/points', async (req, res) => {
    try {
        const { id } = req.params;
        await ensureUserRecord(id);

        const result = await pool.query(
            'SELECT total_points, level FROM gamification_users WHERE user_id = $1', [id]
        );
        const { total_points, level } = result.rows[0];
        const computedLevel = getLevel(total_points);

        res.json({
            user_id: id,
            total_points,
            level: computedLevel,
            points_to_next_level: getPointsToNextLevel(total_points),
            level_thresholds: LEVEL_THRESHOLDS,
        });
    } catch (err) {
        logger.error('Error fetching points', { error: err.message });
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// POST /users/:id/points  { action, description? }
app.post('/users/:id/points', async (req, res) => {
    try {
        const { id } = req.params;
        const { action, description } = req.body;

        const pointValue = POINT_ACTIONS[action];
        if (!pointValue) {
            return res.status(400).json({ error: 'INVALID_ACTION', message: `Unknown action: ${action}`, valid_actions: Object.keys(POINT_ACTIONS) });
        }

        await ensureUserRecord(id);

        // Record transaction
        await pool.query(
            'INSERT INTO gamification_points (user_id, action, points, description) VALUES ($1, $2, $3, $4)',
            [id, action, pointValue, description || action]
        );

        // Update total
        const updated = await pool.query(
            'UPDATE gamification_users SET total_points = total_points + $1, updated_at = NOW() WHERE user_id = $2 RETURNING total_points',
            [pointValue, id]
        );

        const newTotal = updated.rows[0].total_points;
        const newLevel = getLevel(newTotal);

        // Check for level-up badge
        if (newLevel >= 5) await awardBadgeInternal(id, 'level_5');
        if (newLevel >= 10) await awardBadgeInternal(id, 'level_10');

        res.json({
            awarded: pointValue,
            action,
            total_points: newTotal,
            level: newLevel,
            points_to_next_level: getPointsToNextLevel(newTotal),
        });
    } catch (err) {
        logger.error('Error awarding points', { error: err.message });
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// GET /users/:id/points/history
app.get('/users/:id/points/history', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = Math.min(parseInt(req.query.limit || '50'), 200);
        const result = await pool.query(
            'SELECT action, points, description, created_at FROM gamification_points WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
            [id, limit]
        );
        res.json({ user_id: id, history: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// ─── Badges ───────────────────────────────────────────────────────────────────

async function awardBadgeInternal(userId, badgeKey) {
    const badge = BADGES[badgeKey];
    if (!badge) return false;
    try {
        await pool.query(
            `INSERT INTO gamification_badges (user_id, badge_key, name, icon, description)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, badge_key) DO NOTHING`,
            [userId, badgeKey, badge.name, badge.icon, badge.description]
        );
        // Award badge points
        await pool.query(
            'INSERT INTO gamification_points (user_id, action, points, description) VALUES ($1, $2, $3, $4)',
            [userId, 'badge_earned', POINT_ACTIONS.badge_earned, `Earned badge: ${badge.name}`]
        );
        await pool.query(
            'UPDATE gamification_users SET total_points = total_points + $1, updated_at = NOW() WHERE user_id = $2',
            [POINT_ACTIONS.badge_earned, userId]
        );
        return true;
    } catch {
        return false;
    }
}

// GET /users/:id/badges
app.get('/users/:id/badges', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, badge_key, name, icon, description, earned_at FROM gamification_badges WHERE user_id = $1 ORDER BY earned_at DESC',
            [id]
        );
        res.json({ user_id: id, badges: result.rows, total: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// POST /users/:id/badges  { badge_key }
app.post('/users/:id/badges', async (req, res) => {
    try {
        const { id } = req.params;
        const { badge_key } = req.body;

        if (!BADGES[badge_key]) {
            return res.status(400).json({ error: 'INVALID_BADGE', message: `Unknown badge: ${badge_key}`, valid_badges: Object.keys(BADGES) });
        }

        await ensureUserRecord(id);
        const awarded = await awardBadgeInternal(id, badge_key);
        const badge = BADGES[badge_key];

        res.status(awarded ? 201 : 200).json({
            awarded,
            badge_key,
            badge,
            message: awarded ? `Badge "${badge.name}" awarded!` : 'Already earned',
        });
    } catch (err) {
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// GET /badges — list all available badges
app.get('/badges', (req, res) => {
    res.json({
        badges: Object.entries(BADGES).map(([key, badge]) => ({ key, ...badge }))
    });
});

// ─── Streaks ──────────────────────────────────────────────────────────────────

// GET /users/:id/streaks
app.get('/users/:id/streaks', async (req, res) => {
    try {
        const { id } = req.params;
        await ensureUserRecord(id);

        const result = await pool.query(
            `INSERT INTO gamification_streaks (user_id, current_streak, longest_streak)
             VALUES ($1, 0, 0)
             ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
             RETURNING current_streak, longest_streak, last_checkin`,
            [id]
        );

        res.json({ user_id: id, ...result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// POST /users/:id/streaks/checkin
app.post('/users/:id/streaks/checkin', async (req, res) => {
    try {
        const { id } = req.params;
        await ensureUserRecord(id);

        const today = new Date().toISOString().split('T')[0];

        const existing = await pool.query(
            'SELECT current_streak, longest_streak, last_checkin FROM gamification_streaks WHERE user_id = $1',
            [id]
        );

        let current = 0, longest = 0;
        let alreadyCheckedIn = false;

        if (existing.rows.length > 0) {
            const { current_streak, longest_streak, last_checkin } = existing.rows[0];
            const lastDate = last_checkin ? new Date(last_checkin).toISOString().split('T')[0] : null;

            if (lastDate === today) {
                alreadyCheckedIn = true;
                current = current_streak;
                longest = longest_streak;
            } else {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                current = lastDate === yesterday ? current_streak + 1 : 1;
                longest = Math.max(current, longest_streak);
            }
        } else {
            current = 1;
            longest = 1;
        }

        if (!alreadyCheckedIn) {
            await pool.query(
                `INSERT INTO gamification_streaks (user_id, current_streak, longest_streak, last_checkin)
                 VALUES ($1, $2, $3, $4::date)
                 ON CONFLICT (user_id) DO UPDATE SET
                   current_streak = $2, longest_streak = $3, last_checkin = $4::date, updated_at = NOW()`,
                [id, current, longest, today]
            );

            // Award daily login points
            await pool.query(
                'INSERT INTO gamification_points (user_id, action, points, description) VALUES ($1, $2, $3, $4)',
                [id, 'daily_login', POINT_ACTIONS.daily_login, 'Daily check-in']
            );
            await pool.query(
                'UPDATE gamification_users SET total_points = total_points + $1, updated_at = NOW() WHERE user_id = $2',
                [POINT_ACTIONS.daily_login, id]
            );

            // Streak badges
            if (current >= 7) await awardBadgeInternal(id, 'seven_day_streak');
            if (current >= 30) await awardBadgeInternal(id, 'thirty_day_streak');
        }

        res.json({
            user_id: id,
            current_streak: current,
            longest_streak: longest,
            already_checked_in: alreadyCheckedIn,
            points_awarded: alreadyCheckedIn ? 0 : POINT_ACTIONS.daily_login,
        });
    } catch (err) {
        logger.error('Checkin error', { error: err.message });
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// ─── Leaderboard ──────────────────────────────────────────────────────────────
app.get('/leaderboard', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '10'), 100);
        const result = await pool.query(
            'SELECT user_id, total_points, level FROM gamification_users ORDER BY total_points DESC LIMIT $1',
            [limit]
        );
        res.json({
            leaderboard: result.rows.map((row, i) => ({ rank: i + 1, ...row })),
            generated_at: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
    }
});

// ─── Available actions ────────────────────────────────────────────────────────
app.get('/actions', (req, res) => {
    res.json({ actions: Object.entries(POINT_ACTIONS).map(([key, pts]) => ({ action: key, points: pts })) });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.GAMIFICATION_PORT || 3015;

async function start() {
    try {
        await pool.connect();
        logger.info('Database connected');
        await ensureSchema();
        app.listen(PORT, () => logger.info(`Gamification service running on port ${PORT}`));
    } catch (err) {
        logger.error('Startup failed', { error: err.message });
        process.exit(1);
    }
}

start();

module.exports = { app };
