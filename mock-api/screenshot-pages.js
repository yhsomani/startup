/**
 * TalentSphere UI Screenshot Script
 * Uses Playwright to capture screenshots of every page
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\yashs\\OneDrive\\Documents\\Startup\\TalentSphere\\ui-screenshots';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
    { name: '01-login', url: 'http://localhost:5175/login', auth: false },
    { name: '02-register', url: 'http://localhost:5175/register', auth: false },
    { name: '03-forgot-password', url: 'http://localhost:5175/forgot-password', auth: false },
    { name: '04-dashboard', url: 'http://localhost:5175/', auth: true },
    { name: '05-jobs', url: 'http://localhost:5175/jobs', auth: true },
    { name: '06-job-detail', url: 'http://localhost:5175/jobs/j1', auth: true },
    { name: '07-network', url: 'http://localhost:5175/network', auth: true },
    { name: '08-courses', url: 'http://localhost:5175/courses', auth: true },
    { name: '09-course-detail', url: 'http://localhost:5175/courses/c1', auth: true },
    { name: '10-challenges', url: 'http://localhost:5175/challenges', auth: true },
    { name: '11-code-editor', url: 'http://localhost:5175/challenges/ch1/solve', auth: true },
    { name: '12-leaderboard', url: 'http://localhost:5175/leaderboard', auth: true },
    { name: '13-achievements', url: 'http://localhost:5175/achievements', auth: true },
    { name: '14-profile', url: 'http://localhost:5175/profile', auth: true },
    { name: '15-job-posting', url: 'http://localhost:5175/jobs/new', auth: true },
    { name: '16-settings', url: 'http://localhost:5175/settings', auth: true },
    { name: '17-messages', url: 'http://localhost:5175/messages', auth: true },
    { name: '18-ai-assistant', url: 'http://localhost:5175/ai-assistant', auth: true },
    { name: '19-billing', url: 'http://localhost:5175/billing', auth: true },
    { name: '20-applications', url: 'http://localhost:5175/applications', auth: true },
    { name: '21-not-found', url: 'http://localhost:5175/404-non-existent-page', auth: false },
];

(async () => {
    console.log('🚀 Starting TalentSphere UI Screenshots (v2.0)\n');
    console.log(`📂 Output directory: ${OUT_DIR}`);

    const browser = await chromium.launch({ headless: true });

    // Use addInitScript to persist auth across ALL navigations
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        // Add dark mode preference if needed (can be handled via data-theme injection too)
    });

    await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'mock-access-token-DEVELOPER');
        localStorage.setItem('refreshToken', 'mock-refresh-token-u1');
        localStorage.setItem('user', JSON.stringify({
            id: 'u1',
            email: 'developer@talentsphere.com',
            firstName: 'Arjun',
            lastName: 'Dev',
            role: 'DEVELOPER',
            user_type: 'developer'
        }));
        // Force light mode initially for consistent screenshots
        localStorage.setItem('theme', 'light');
    });

    const page = await context.newPage();
    const results = [];

    for (const { name, url, auth } of PAGES) {
        try {
            console.log(`📸 Capturing ${name}...`);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

            // Wait extra time for React rendering and transitions
            await page.waitForTimeout(2000);

            const ssPath = path.join(OUT_DIR, `${name}.png`);
            await page.screenshot({ path: ssPath, fullPage: false });

            const title = await page.title();
            results.push({ name, url, status: '✅', title });
        } catch (err) {
            results.push({ name, url, status: '❌', error: err.message });
            console.log(`   ❌ Error: ${err.message.slice(0, 100)}`);
        }
    }

    await browser.close();

    console.log('\n📊 Screenshot Summary:');
    results.forEach(r => {
        const icon = r.status;
        const msg = r.error ? `Error: ${r.error.slice(0, 50)}...` : (r.title || 'No Title');
        console.log(`  ${icon} ${r.name.padEnd(20)} | ${msg}`);
    });

    const passed = results.filter(r => r.status === '✅').length;
    console.log(`\n🎉 Captured ${passed}/${results.length} pages successfully.`);
    console.log(`🔗 Check the files in: ${OUT_DIR}`);
})();
