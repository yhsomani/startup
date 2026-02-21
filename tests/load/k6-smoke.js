/**
 * k6 Smoke Test — TalentSphere
 * Verifies all critical endpoints are up.
 * Run: k6 run tests/load/k6-smoke.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
    },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
    const checks = [
        { name: 'health', url: `${BASE}/health` },
        { name: 'jobs list', url: `${BASE}/api/v1/jobs?limit=5` },
        { name: 'leaderboard', url: `http://localhost:3015/leaderboard` },
    ];

    for (const c of checks) {
        const res = http.get(c.url, { timeout: '10s' });
        check(res, {
            [`${c.name} status 200`]: (r) => r.status === 200,
            [`${c.name} < 500ms`]: (r) => r.timings.duration < 500,
        });
    }

    sleep(1);
}
