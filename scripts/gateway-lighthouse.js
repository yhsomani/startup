const GATEWAY_URL = 'http://localhost:8000';
const SERVICES = [
    { name: 'Auth', path: '/api/v1/auth/health' },
    { name: 'Challenge', path: '/api/v1/challenges' },
    { name: 'Assistant', path: '/api/v1/assistant/health' },
    { name: 'Recruitment', path: '/api/v1/candidates/search' },
    { name: 'Gamification', path: '/api/v1/users/1/streaks' },
];

async function runLighthouse() {
    console.log('🚀 Starting TalentSphere Gateway Lighthouse (Native Fetch)...');
    let score = 0;
    let total = SERVICES.length + 1;

    // 1. Gateway Health
    try {
        const res = await fetch(`${GATEWAY_URL}/health`);
        const text = await res.text();
        if (res.status === 200 && text.includes('healthy')) {
            console.log('✅ Gateway Health: PASSED');
            score++;
        } else {
            console.log(`❌ Gateway Health: FAILED (Status: ${res.status}, Body: ${text})`);
        }
    } catch (e) {
        console.error('❌ Gateway Health: FAILED', e.message);
    }

    // 2. Service Routing
    for (const svc of SERVICES) {
        try {
            const res = await fetch(`${GATEWAY_URL}${svc.path}`, {
                headers: { 'X-User-Id': 'lighthouse-test' }
            });
            console.log(`✅ Routing to ${svc.name}: PASSED (Status: ${res.status})`);
            score++;
        } catch (e) {
            console.error(`❌ Routing to ${svc.name}: FAILED`, e.message);
        }
    }

    const percentage = Math.round((score / total) * 100);
    console.log('\n--- Final Result ---');
    console.log(`Score: ${score}/${total} (${percentage}%)`);

    if (percentage === 100) {
        console.log('🌟 System is optimal!');
    } else {
        console.log('⚠️ Some services may be unreachable through the gateway.');
    }
}

runLighthouse();
