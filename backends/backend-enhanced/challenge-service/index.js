const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: '../../.env' }); // try resolving to root

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/talentsphere'
});

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

// Language mappings for Piston
const languageInfo = {
    javascript: { language: 'javascript', version: '18.15.0' },
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '15.0.2' }
};

// --- Execution Helper ---
async function runWithPiston(code, language, input) {
    const langConfig = languageInfo[language];
    if (!langConfig) throw new Error(`Unsupported language: ${language}`);

    const payload = {
        language: langConfig.language,
        version: langConfig.version,
        files: [{ content: code }],
        stdin: input
    };

    try {
        const response = await axios.post(PISTON_URL, payload);
        return response.data.run;
    } catch (err) {
        throw new Error('Code execution failed: ' + (err.response?.data?.message || err.message));
    }
}

// Generate wrapper code for execution to evaluate tests automatically.
// For MVP, we pass the inputs via stdin and the user code reads it, or we append test wrapper logic manually.
// A simpler approach for MVP is to inject wrapper code around the user's code.
function wrapCode(userCode, testCases, language, functionName) {
    if (language === 'javascript') {
        return `
${userCode}

const tests = ${JSON.stringify(testCases.map(t => ({ input: JSON.parse(t.input_data), expected: t.expected_output })))};
let passed = 0;
let results = [];

for (let i = 0; i < tests.length; i++) {
  try {
    const test = tests[i];
    // extract args in order of the object keys
    const args = Object.values(test.input);
    const res = ${functionName}(...args);
    const isPass = JSON.stringify(res) === test.expected;
    if (isPass) passed++;
    results.push({ passed: isPass, expected: test.expected, actual: JSON.stringify(res) });
  } catch (e) {
    results.push({ passed: false, error: e.message });
  }
}
console.log(JSON.stringify({ passed, total: tests.length, results }));
`;
    }

    // Basic fallback if JS is easy, others could be added
    return userCode;
}

// --- API Routes ---

app.get('/api/v1/challenges', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, title, slug, difficulty, category FROM challenges ORDER BY created_at');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});

app.get('/api/v1/challenges/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const challengeRes = await pool.query('SELECT * FROM challenges WHERE slug = $1', [slug]);
        if (challengeRes.rows.length === 0) return res.status(404).json({ error: 'Challenge not found' });
        const challenge = challengeRes.rows[0];

        const templatesRes = await pool.query('SELECT language, starter_code FROM challenge_templates WHERE challenge_id = $1', [challenge.id]);
        challenge.templates = templatesRes.rows;
        res.json(challenge);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch challenge info' });
    }
});

app.post('/api/v1/challenges/:id/test-run', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, language } = req.body;

        // Only support JS wrapper logic for this prompt easily
        if (language !== 'javascript') {
            return res.status(400).json({ error: 'Only JavaScript is supported in this MVP iteration.' });
        }

        const challengeRes = await pool.query('SELECT slug FROM challenges WHERE id = $1', [id]);
        if (challengeRes.rows.length === 0) return res.status(404).json({ error: 'Challenge not found' });
        const slug = challengeRes.rows[0].slug;

        // Map slugs to function names
        const functionNames = {
            'two-sum': 'twoSum',
            'reverse-string': 'reverseString',
            'valid-palindrome': 'isPalindrome',
            'maximum-subarray': 'maxSubArray',
            'valid-parentheses': 'isValid'
        };
        const fnName = functionNames[slug];

        const testsRes = await pool.query('SELECT * FROM challenge_test_cases WHERE challenge_id = $1 AND is_hidden = false ORDER BY sort_order', [id]);
        const wrapped = wrapCode(code, testsRes.rows, language, fnName);

        const execution = await runWithPiston(wrapped, language, "");

        if (execution.code !== 0 || execution.stderr) {
            return res.json({ status: 'syntax_error', output: execution.stderr || execution.stdout });
        }

        try {
            // The last output line should be our JSON results
            const jsonRes = JSON.parse(execution.stdout.trim().split('\n').pop());
            res.json({
                status: jsonRes.passed === jsonRes.total ? 'passed' : 'failed',
                results: jsonRes.results,
                passed_count: jsonRes.passed,
                total_count: jsonRes.total
            });
        } catch (e) {
            res.json({ status: 'syntax_error', output: execution.stdout });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Mock user sync (in a real system we use events or Kafka, here we do HTTP)
async function sendSkillUpdate(userId, challengeId) {
    try {
        // 1. Get skills associated with this challenge
        const skillsRes = await pool.query('SELECT skill_name, points FROM challenge_skills WHERE challenge_id = $1', [challengeId]);
        const skills = skillsRes.rows;

        // 2. We skip calling user-service via HTTP and update the DB directly (for simplicity of the sandbox MVP, or we can make a HTTP request)
        // Actually PRD mentions backend (user-service) handles scoring auto-calculation.
        // Let's call the user profiles /api/v1/users/webhook/challenge-passed
        try {
            await axios.post('http://localhost:3002/api/v1/users/webhook/challenge-passed', {
                userId,
                challengeId,
                skills
            });
        } catch (e) {
            console.warn('Failed to alert user-service of completion. Is it running?', e.message);
        }
    } catch (e) {
        console.error('sendSkillUpdate err', e);
    }
}

app.post('/api/v1/challenges/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, language, userId } = req.body;

        // Need user!
        if (!userId) return res.status(401).json({ error: 'User required' });

        const challengeRes = await pool.query('SELECT slug FROM challenges WHERE id = $1', [id]);
        const slug = challengeRes.rows[0].slug;

        const functionNames = {
            'two-sum': 'twoSum',
            'reverse-string': 'reverseString',
            'valid-palindrome': 'isPalindrome',
            'maximum-subarray': 'maxSubArray',
            'valid-parentheses': 'isValid'
        };
        const fnName = functionNames[slug];

        const testsRes = await pool.query('SELECT * FROM challenge_test_cases WHERE challenge_id = $1 ORDER BY sort_order', [id]);
        const wrapped = wrapCode(code, testsRes.rows, language, fnName);

        const execution = await runWithPiston(wrapped, language, "");

        let status = 'failed';
        let jsonRes = { passed: 0, total: testsRes.rows.length, results: [] };

        if (execution.code === 0 && !execution.stderr) {
            try {
                jsonRes = JSON.parse(execution.stdout.trim().split('\n').pop());
                if (jsonRes.passed === jsonRes.total) status = 'passed';
            } catch (e) { }
        } else {
            status = 'syntax_error';
        }

        // Attempt recording
        await pool.query(
            `INSERT INTO challenge_attempts 
       (user_id, challenge_id, code, language, status, passed_test_count, total_test_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, id, code, language, status, jsonRes.passed, jsonRes.total]
        );

        if (status === 'passed') {
            // Sync skill
            await sendSkillUpdate(userId, id);
        }

        res.json({
            status,
            results: jsonRes.results,
            passed_count: jsonRes.passed,
            total_count: jsonRes.total
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => console.log(`Challenge Service ready on port ${PORT}`));
