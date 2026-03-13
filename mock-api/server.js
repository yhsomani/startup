/**
 * TalentSphere Mock API Server
 * Simulates all backend endpoints so the frontend can be tested without Docker/DBs  
 * Runs on port 8000 (matching VITE_API_BASE_URL used by the frontend)
 */

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────────────────────
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));
const ok = (res, data) => res.json({ success: true, ...data });
const paginate = (items, page = 1, limit = 10) => {
    const p = parseInt(page, 10), l = parseInt(limit, 10);
    const start = (p - 1) * l;
    return { data: items.slice(start, start + l), total: items.length, page: p, limit: l, pages: Math.ceil(items.length / l) };
};

// ─── Mock Data ──────────────────────────────────────────────────────────────
const USERS = [
    { id: 'u1', email: 'developer@talentsphere.com', firstName: 'Arjun', lastName: 'Dev', role: 'DEVELOPER', user_type: 'developer' },
    { id: 'u2', email: 'recruiter@talentsphere.com', firstName: 'Priya', lastName: 'HR', role: 'RECRUITER', user_type: 'recruiter' },
    { id: 'u3', email: 'admin@talentsphere.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN', user_type: 'admin' },
];

const JOBS = Array.from({ length: 15 }, (_, i) => ({
    id: `j${i + 1}`,
    title: ['Senior React Developer', 'Full Stack Engineer', 'ML Engineer', 'DevOps Engineer', 'Product Manager',
        'Backend Engineer', 'iOS Developer', 'Android Dev', 'Data Scientist', 'SRE', 'Cloud Architect',
        'Security Engineer', 'QA Engineer', 'Technical Writer', 'UX Engineer'][i],
    company: ['Google', 'Razorpay', 'Swiggy', 'Flipkart', 'Atlassian', 'Microsoft', 'Uber', 'Amazon', 'Zomato', 'PhonePe', 'Adobe', 'Infosys', 'TCS', 'Wipro', 'HCL'][i],
    location: ['Bangalore', 'Mumbai', 'Remote', 'Hyderabad', 'Pune', 'Delhi', 'Chennai', 'Kolkata', 'Noida', 'Gurgaon', 'Bangalore', 'Mumbai', 'Remote', 'Hyderabad', 'Pune'][i],
    type: ['Full-time', 'Contract', 'Full-time', 'Full-time', 'Full-time', 'Remote', 'Full-time', 'Full-time', 'Part-time', 'Full-time', 'Full-time', 'Contract', 'Full-time', 'Part-time', 'Full-time'][i],
    salary: `₹${(i + 1) * 2 + 10}-${(i + 1) * 2 + 20} LPA`,
    skills: [['React', 'TypeScript', 'GraphQL'], ['Node.js', 'Python', 'AWS'], ['Python', 'TensorFlow'], ['K8s', 'Terraform'], ['Product', 'SQL'], ['Go', 'gRPC'], ['Swift', 'SwiftUI'], ['Kotlin', 'Android'], ['Python', 'Spark'], ['Linux', 'Observability'], ['AWS', 'Terraform'], ['Python', 'SAST'], ['Jest', 'Playwright'], ['Markdown', 'API'], ['TypeScript', 'CSS']][i],
    experience: `${i % 4 + 1}-${i % 4 + 3} years`,
    description: 'We are looking for a talented engineer to join our world-class team and help build amazing products used by millions of users worldwide.',
    requirements: ['Strong problem-solving skills', 'Team player', '3+ years of relevant experience'],
    status: 'active',
    postedAt: new Date(Date.now() - i * 86400000).toISOString(),
    isNew: i < 3,
}));

const PROFILES = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`,
    userId: `u${i + 10}`,
    name: ['Aanya Sharma', 'Rajan Mehta', 'Priya Kumar', 'Arjun Nair', 'Meera Iyer', 'Siddharth Rao', 'Kavitha Reddy', 'Dev Malhotra'][i],
    role: ['Senior Frontend Engineer', 'Full Stack Developer', 'ML Engineer', 'DevOps Engineer', 'Product Manager', 'Backend Engineer', 'Data Scientist', 'iOS Developer'][i],
    company: ['Google', 'Razorpay', 'Microsoft', 'Swiggy', 'Atlassian', 'Flipkart', 'Uber', 'PhonePe'][i],
    initials: ['AS', 'RM', 'PK', 'AN', 'MI', 'SR', 'KR', 'DM'][i],
    avatarInitials: ['AS', 'RM', 'PK', 'AN', 'MI', 'SR', 'KR', 'DM'][i],
    skills: [['React', 'TypeScript', 'GraphQL'], ['Node.js', 'MongoDB'], ['Python', 'TensorFlow'], ['K8s', 'Terraform'], ['Strategy', 'Agile'], ['Go', 'gRPC'], ['Python', 'Spark'], ['Swift', 'SwiftUI']][i],
    mutualConnections: [4, 2, 6, 1, 8, 3, 0, 2][i],
    bio: 'Passionate engineer building the future of tech.',
    location: 'Bangalore, India',
    experience: `${i + 2} years`,
}));

const NOTIFICATIONS = [
    { id: 'n1', type: 'job_match', title: 'New Job Match!', message: 'Senior React Developer at Google matches your profile.', read: false, createdAt: new Date(Date.now() - 300000).toISOString() },
    { id: 'n2', type: 'application', title: 'Application Viewed', message: 'Razorpay viewed your application for Full Stack Engineer.', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'n3', type: 'connection', title: 'New Connection', message: 'Aanya Sharma accepted your connection request.', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'n4', type: 'achievement', title: 'Badge Unlocked!', message: 'You earned the "7-Day Streak" badge. +50 XP!', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'n5', type: 'message', title: 'New Message', message: 'Priya HR sent you a message about an opportunity.', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const COURSES = Array.from({ length: 10 }, (_, i) => ({
    id: `c${i + 1}`,
    title: ['Advanced React Patterns', 'System Design for Engineers', 'Python for ML', 'AWS Solutions Architect', 'TypeScript Mastery', 'Docker & Kubernetes', 'Go Lang Fundamentals', 'Data Structures', 'Product Management 101', 'GraphQL Deep Dive'][i],
    description: 'A comprehensive course designed to take your skills to the next level.',
    instructor: { name: ['Dr. Sarah Chen', 'Raj Kumar', 'Meera Singh', 'John AWS', 'TS Expert'][i % 5], rating: 4.7 + (i % 3) * 0.1 },
    duration: `${10 + i * 2}h ${(i * 15) % 60}m`,
    level: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
    rating: 4.5 + (i % 5) * 0.1,
    enrolledCount: 5000 + i * 2000,
    tags: [['React', 'TypeScript'], ['Architecture'], ['Python', 'ML'], ['AWS'], ['TypeScript']][i % 5],
    isFree: i % 4 === 0,
    price: `₹${(i + 1) * 500}`,
    progress: i < 3 ? Math.floor(Math.random() * 80 + 10) : 0,
    isEnrolled: i < 3,
    thumbnail: null,
}));

const CHALLENGES = Array.from({ length: 10 }, (_, i) => ({
    id: `ch${i + 1}`,
    title: ['Two Sum', 'Reverse Linked List', 'Binary Search', 'Valid Parentheses', 'Merge Intervals', 'Longest Substring', 'Max Subarray', 'Climb Stairs', 'Word Break', 'Graph BFS'][i],
    difficulty: ['Easy', 'Easy', 'Easy', 'Medium', 'Medium', 'Medium', 'Easy', 'Easy', 'Hard', 'Medium'][i],
    tags: [['Array', 'HashTable'], ['LinkedList'], ['BinarySearch'], ['Stack'], ['Array', 'Sorting'], ['SlidingWindow'], ['DP'], ['DP'], ['DP', 'Trie'], ['Graph', 'BFS']][i],
    acceptanceRate: `${45 + i * 3}%`,
    solvedCount: 50000 - i * 3000,
    solved: i < 2,
}));

const LEADERBOARD = Array.from({ length: 50 }, (_, i) => ({
    rank: i + 1,
    userId: `u${i + 1}`,
    name: ['Aanya Sharma', 'Rajan Mehta', 'Priya Kumar', 'Arjun Nair', 'Meera Iyer', 'Siddharth Rao', 'Kavitha Reddy', 'Dev Malhotra', 'Ankit Singh', 'Sneha Patel'][i % 10],
    xp: 10000 - i * 180,
    level: Math.floor((10000 - i * 180) / 2000) + 1,
    badges: Array.from({ length: Math.max(1, 5 - Math.floor(i / 10)) }, (_, j) => ({ name: `Badge ${j + 1}` })),
    challengesSolved: 100 - i * 2,
    streak: Math.max(0, 30 - i),
}));

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────
app.post('/api/v1/auth/login', async (req, res) => {
    await delay();
    const { email, password } = req.body;
    const user = USERS.find(u => u.email === email);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    return ok(res, {
        accessToken: `mock-access-token-${user.role}`,
        refreshToken: `mock-refresh-token-${user.id}`,
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, user_type: user.user_type },
    });
});

app.post('/api/v1/auth/register', async (req, res) => {
    await delay();
    const { email, firstName, lastName, user_type } = req.body;
    const role = user_type === 'recruiter' ? 'RECRUITER' : 'DEVELOPER';
    const user = { id: `u${Date.now()}`, email, firstName, lastName, role, user_type };
    return ok(res, { accessToken: `mock-token-${user.id}`, refreshToken: `mock-refresh-${user.id}`, user });
});

app.post('/api/v1/auth/refresh-token', async (req, res) => {
    await delay(50);
    ok(res, { accessToken: 'refreshed-mock-token', refreshToken: 'new-refresh-token' });
});

app.post('/api/v1/auth/logout', async (req, res) => {
    await delay(50);
    ok(res, { message: 'Logged out' });
});

app.post('/api/v1/auth/forgot-password', async (req, res) => {
    await delay();
    ok(res, { message: 'OTP sent to your email' });
});

app.post('/api/v1/auth/verify-otp', async (req, res) => {
    await delay();
    if (req.body.otp === '000000') return res.status(400).json({ success: false, message: 'Invalid OTP' });
    ok(res, { message: 'OTP verified' });
});

app.post('/api/v1/auth/reset-password', async (req, res) => {
    await delay();
    ok(res, { message: 'Password reset successfully' });
});

// ─── USER PROFILE ROUTES ─────────────────────────────────────────────────────
app.get('/api/v1/users/profile', async (req, res) => {
    await delay();
    ok(res, { profile: { ...PROFILES[0], skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'], bio: 'Passionate full-stack developer building amazing user experiences.' } });
});

app.put('/api/v1/users/profile', async (req, res) => {
    await delay();
    ok(res, { profile: req.body, message: 'Profile updated' });
});

app.get('/api/v1/users/profiles/discover', async (req, res) => {
    await delay();
    const { search = '' } = req.query;
    const filtered = PROFILES.filter(p =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase())
    );
    ok(res, { profiles: filtered });
});

app.post('/api/v1/users/profiles/:id/connect', async (req, res) => {
    await delay();
    ok(res, { message: 'Connection request sent' });
});

// ─── JOB ROUTES ───────────────────────────────────────────────────────────
app.get('/api/v1/jobs', async (req, res) => {
    await delay();
    const { page = 1, limit = 10, search = '' } = req.query;
    const filtered = JOBS.filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()));
    ok(res, { jobs: paginate(filtered, page, limit).data, ...paginate(filtered, page, limit) });
});

app.get('/api/v1/jobs/active', async (req, res) => {
    await delay();
    const { page = 1, limit = 10 } = req.query;
    ok(res, { jobs: paginate(JOBS, page, limit).data, total: JOBS.length, pages: Math.ceil(JOBS.length / parseInt(limit)) });
});

app.get('/api/v1/jobs/:id', async (req, res) => {
    await delay();
    const job = JOBS.find(j => j.id === req.params.id) || JOBS[0];
    ok(res, { job });
});

app.post('/api/v1/jobs', async (req, res) => {
    await delay();
    const job = { id: `j${Date.now()}`, ...req.body, postedAt: new Date().toISOString(), status: req.body.status || 'active' };
    ok(res, { job, message: 'Job posted successfully' });
});

app.post('/api/v1/jobs/:id/apply', async (req, res) => {
    await delay();
    ok(res, { application: { id: `app${Date.now()}`, jobId: req.params.id, status: 'pending' }, message: 'Application submitted!' });
});

// ─── COMPANY ROUTES ───────────────────────────────────────────────────────
app.get('/api/v1/companies/:id', async (req, res) => {
    await delay();
    ok(res, {
        company: {
            id: req.params.id,
            name: 'TechFlow Solutions',
            industry: 'Software Development',
            size: '250-500',
            location: 'Bangalore, India',
            website: 'https://techflow.io',
            founded: '2018',
            description: 'TechFlow Solutions builds cutting-edge developer tools and productivity platforms trusted by 2M+ engineers worldwide.',
            culture: ['Remote-first', 'Open Source', 'Continuous Learning', 'Work-Life Balance'],
            coverGradient: 'from-indigo-600 via-purple-600 to-pink-600',
            initials: 'TS',
            employees: PROFILES.slice(0, 3).map(p => ({ ...p, company: 'TechFlow' })),
        }
    });
});

// ─── NOTIFICATION ROUTES ──────────────────────────────────────────────────
app.get('/api/v1/notifications', async (req, res) => {
    await delay();
    ok(res, { notifications: NOTIFICATIONS, unreadCount: NOTIFICATIONS.filter(n => !n.read).length });
});

app.patch('/api/v1/notifications/mark-all-read', async (req, res) => {
    await delay(50);
    NOTIFICATIONS.forEach(n => n.read = true);
    ok(res, { message: 'All notifications marked as read' });
});

app.patch('/api/v1/notifications/:id/read', async (req, res) => {
    await delay(50);
    const n = NOTIFICATIONS.find(n => n.id === req.params.id);
    if (n) n.read = true;
    ok(res, { message: 'Notification marked as read' });
});

// ─── COURSE/LMS ROUTES ────────────────────────────────────────────────────
app.get('/api/v1/courses', async (req, res) => {
    await delay();
    const { page = 1, limit = 10 } = req.query;
    ok(res, { courses: paginate(COURSES, page, limit).data, total: COURSES.length });
});

app.get('/api/v1/courses/:id', async (req, res) => {
    await delay();
    const course = COURSES.find(c => c.id === req.params.id) || COURSES[0];
    ok(res, {
        course: {
            ...course, curriculum: [
                { section: 'Introduction', lessons: [{ id: 'l1', title: 'Course Overview', duration: '5:30', free: true, completed: true }, { id: 'l2', title: 'Prerequisites', duration: '10:00', free: true, completed: true }] },
                { section: 'Core Concepts', lessons: [{ id: 'l3', title: 'Deep Dive', duration: '22:10', free: false, completed: false }, { id: 'l4', title: 'Advanced Patterns', duration: '28:45', free: false, completed: false }] },
                { section: 'Projects', lessons: [{ id: 'l5', title: 'Build a Project', duration: '45:00', free: false, completed: false }] },
            ], whatYoullLearn: ['Core fundamentals', 'Advanced patterns', 'Real-world projects', 'Best practices']
        }
    });
});

app.post('/api/v1/courses/:id/enroll', async (req, res) => {
    await delay();
    ok(res, { message: 'Enrolled successfully', enrollmentId: `enr${Date.now()}` });
});

app.put('/api/v1/lms/progress', async (req, res) => {
    await delay(100);
    const { courseId, lessonId, timestamp } = req.body;
    ok(res, { message: 'Progress saved', courseId, lessonId, timestamp });
});

// ─── CHALLENGE ROUTES ─────────────────────────────────────────────────────
app.get('/api/v1/challenges', async (req, res) => {
    await delay();
    ok(res, { challenges: CHALLENGES, total: CHALLENGES.length });
});

app.get('/api/v1/challenges/:id', async (req, res) => {
    await delay();
    const ch = CHALLENGES.find(c => c.id === req.params.id) || CHALLENGES[0];
    ok(res, {
        challenge: {
            ...ch,
            description: 'Given an array of integers and a target, return indices of the two numbers that add up to the target.',
            examples: [{ input: 'nums=[2,7,11,15], target=9', output: '[0,1]' }],
            constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹'],
            starterCode: { javascript: 'function solution() {\n  // your code\n}', python: 'def solution():\n    pass' },
        }
    });
});

app.post('/api/v1/challenges/:id/submit', async (req, res) => {
    await delay(1500);
    const passed = Math.random() > 0.4;
    ok(res, { passed, xpEarned: passed ? 100 : 0, testResults: [{ passed: true, time: '45ms' }, { passed, time: '52ms' }] });
});

app.post('/api/v1/challenges/execute', async (req, res) => {
    await delay(1000);
    ok(res, {
        output: 'Compilation successful...\nRunning tests...\nTest case 1: Passed\nTest case 2: Passed\n\nTotal time: 120ms',
        passed: true
    });
});

// ─── GAMIFICATION ROUTES ──────────────────────────────────────────────────
app.get('/api/v1/leaderboard', async (req, res) => {
    await delay();
    const { limit = 50 } = req.query;
    ok(res, { leaderboard: LEADERBOARD.slice(0, parseInt(limit)), userRank: 14 });
});

app.get('/api/v1/achievements', async (req, res) => {
    await delay();
    ok(res, { xp: 2340, streak: 7, level: 3, badges: [], achievements: [] });
});

// ─── SEARCH ROUTES ────────────────────────────────────────────────────────
app.get('/api/v1/search', async (req, res) => {
    await delay();
    const { q = '' } = req.query;
    ok(res, { jobs: JOBS.filter(j => j.title.toLowerCase().includes(q.toLowerCase())).slice(0, 5), profiles: PROFILES.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 3) });
});

// ─── MESSAGES ROUTES ──────────────────────────────────────────────────────
const MESSAGES_DATA = {
    u2: [
        { id: 'm1', senderId: 'u2', receiverId: 'u1', text: 'Hey! Are you free for a quick call tomorrow?', createdAt: new Date(Date.now() - 600000).toISOString() },
        { id: 'm2', senderId: 'u1', receiverId: 'u2', text: 'Yes! What time works?', createdAt: new Date(Date.now() - 540000).toISOString() },
        { id: 'm3', senderId: 'u2', receiverId: 'u1', text: 'Sounds good! See you then.', createdAt: new Date(Date.now() - 120000).toISOString() },
    ],
    u3: [
        { id: 'm4', senderId: 'u3', receiverId: 'u1', text: 'Thanks for the referral!', createdAt: new Date(Date.now() - 3600000).toISOString() },
    ],
};

app.get('/api/v1/messages', async (req, res) => {
    await delay();
    const contacts = PROFILES.slice(0, 5).map((p, i) => ({
        userId: p.userId,
        name: p.name,
        initials: p.initials,
        lastMessage: Object.values(MESSAGES_DATA)[i % 2]?.slice(-1)[0]?.text ?? 'Start a conversation',
        lastTime: i === 0 ? '2m' : i === 1 ? '1h' : `${i}d`,
        unread: i < 2 ? i + 1 : 0,
        online: i < 2,
    }));
    ok(res, { contacts });
});

app.get('/api/v1/messages/:userId', async (req, res) => {
    await delay();
    const msgs = MESSAGES_DATA[req.params.userId] ?? [];
    ok(res, { messages: msgs });
});

app.post('/api/v1/messages', async (req, res) => {
    await delay(100);
    const msg = { id: `m${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
    ok(res, { message: msg });
});

// ─── AI ASSISTANT ROUTES ──────────────────────────────────────────────────
const AI_RESPONSES = {
    resume: 'Here are key improvements for your resume:\n\n1. Use impact-driven bullet points with metrics\n2. Tailor skills section to each role\n3. Lead with a strong 2-3 sentence summary',
    jobs: 'Based on your profile, top roles to target: Senior Frontend Engineer, Full Stack Developer, and Staff Engineer at Series B+ startups.',
    interview: "Let's start! **Q1:** Tell me about a challenging technical problem you solved and how you approached it.",
    default: "I can help with resume optimization, job search strategy, interview prep, and career roadmaps. What would you like to work on?",
};

app.post('/api/v1/ai/chat', async (req, res) => {
    await delay(800);
    const msg = (req.body.message || '').toLowerCase();
    let reply = AI_RESPONSES.default;
    if (msg.includes('resume') || msg.includes('cv')) reply = AI_RESPONSES.resume;
    else if (msg.includes('job') || msg.includes('role')) reply = AI_RESPONSES.jobs;
    else if (msg.includes('interview')) reply = AI_RESPONSES.interview;
    ok(res, { reply, tokens: 150 });
});

// ─── BILLING ROUTES ───────────────────────────────────────────────────────
app.get('/api/v1/billing/plan', async (req, res) => {
    await delay();
    ok(res, { plan: { id: 'free', name: 'Free', status: 'active', renewsAt: null, applicationsUsed: 3, applicationsLimit: 5 } });
});

app.get('/api/v1/billing/invoices', async (req, res) => {
    await delay();
    ok(res, {
        invoices: [
            { id: 'inv-001', date: '2026-03-01', amount: 999, currency: 'INR', status: 'paid', plan: 'Pro Monthly' },
            { id: 'inv-002', date: '2026-02-01', amount: 999, currency: 'INR', status: 'paid', plan: 'Pro Monthly' },
        ]
    });
});

app.post('/api/v1/billing/upgrade', async (req, res) => {
    await delay();
    ok(res, { message: 'Subscription upgraded', plan: req.body.planId });
});

// ─── APPLICATIONS ROUTES ──────────────────────────────────────────────────
const APPLICATIONS = [
    { id: 'app1', jobTitle: 'Senior Frontend Developer', company: 'Google', location: 'Bangalore', type: 'Full-time', appliedAt: '2 days ago', status: 'interview' },
    { id: 'app2', jobTitle: 'Full Stack Engineer', company: 'Zomato', location: 'Remote', type: 'Full-time', appliedAt: '5 days ago', status: 'screening' },
    { id: 'app3', jobTitle: 'React Developer', company: 'Razorpay', location: 'Mumbai', type: 'Full-time', appliedAt: '1 week ago', status: 'applied' },
    { id: 'app4', jobTitle: 'UI Engineer', company: 'CRED', location: 'Bangalore', type: 'Full-time', appliedAt: '2 weeks ago', status: 'rejected' },
    { id: 'app5', jobTitle: 'Frontend Lead', company: 'PhonePe', location: 'Bangalore', type: 'Full-time', appliedAt: '3 weeks ago', status: 'offer' },
];

app.get('/api/v1/applications', async (req, res) => {
    await delay();
    ok(res, { applications: APPLICATIONS, total: APPLICATIONS.length });
});

app.patch('/api/v1/applications/:id/status', async (req, res) => {
    await delay();
    ok(res, { message: 'Status updated', status: req.body.status });
});

// ─── SETTINGS ROUTES ──────────────────────────────────────────────────────
app.get('/api/v1/settings/preferences', async (req, res) => {
    await delay();
    ok(res, {
        preferences: {
            notifications: { emailJobAlerts: true, emailMessages: true, emailNews: false, pushAll: true, pushMentions: true },
            privacy: { showProfile: true, showInSearch: true, showActivity: false },
            appearance: { theme: 'system' },
        }
    });
});

app.put('/api/v1/settings/preferences', async (req, res) => {
    await delay();
    ok(res, { message: 'Preferences saved', preferences: req.body });
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'talentsphere-mock-api', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ message: 'TalentSphere Mock API', version: '2.0.0', endpoints: 36 }));

// ─── CATCH-ALL ───────────────────────────────────────────────────────────
app.use((req, res) => {
    console.log(`[UNMATCHED] ${req.method} ${req.path}`);
    res.status(200).json({ success: true, data: [], message: `Mock endpoint: ${req.path}` });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`\n🚀 TalentSphere Mock API v2.0 running on http://localhost:${PORT}`);
    console.log(`📋 36 endpoints available including:`);
    console.log(`   POST /api/v1/auth/login`);
    console.log(`   GET  /api/v1/jobs/active`);
    console.log(`   GET  /api/v1/messages`);
    console.log(`   POST /api/v1/ai/chat`);
    console.log(`   GET  /api/v1/billing/plan`);
    console.log(`   GET  /api/v1/applications`);
    console.log(`   GET  /api/v1/settings/preferences`);
    console.log(`   ... + 29 more (see source)\n`);
});
