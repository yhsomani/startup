/**
 * k6 Stress Test — TalentSphere
 * Finds breaking point by ramping to 200 VUs then beyond.
 * Run: k6 run tests/load/k6-stress.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 150 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 0 },  // Recovery
    ],
    thresholds: {
        http_req_failed: ['rate<0.15'],   // Allow up to 15% during stress
        http_req_duration: ['p(99)<5000'],  // p99 < 5s even under stress
    },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
    const targets = [
        () => http.get(`${BASE}/health`),
        () => http.get(`${BASE}/api/v1/jobs?limit=10`),
        () => http.get(`http://localhost:3015/leaderboard`),
    ];

    const fn = targets[Math.floor(Math.random() * targets.length)];
    const res = fn();
    const ok = check(res, {
        'status ok': (r) => r.status < 500,
    });
    errorRate.add(!ok);
    sleep(0.5);
}
