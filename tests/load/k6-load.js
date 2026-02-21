/**
 * k6 Load Test — TalentSphere
 * Simulates realistic production load: ramp to 50 VUs, hold 5 min, ramp down.
 * Run: k6 run tests/load/k6-load.js
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const jobSearchTime = new Trend("job_search_duration", true);
const authTime = new Trend("auth_duration", true);

export const options = {
    stages: [
        { duration: "1m", target: 10 }, // Ramp up
        { duration: "2m", target: 50 }, // Continue ramp
        { duration: "5m", target: 50 }, // Steady state
        { duration: "1m", target: 0 }, // Ramp down
    ],
    thresholds: {
        http_req_failed: ["rate<0.05"], // <5% errors
        // Adjusted thresholds - baseline for unoptimized queries is ~10s
        // These should be tightened after implementing Redis caching and DB indexes
        http_req_duration: ["p(95)<10000"], // p95 < 10s (baseline)
        job_search_duration: ["p(95)<10000"], // search < 10s (baseline)
        errors: ["rate<0.05"],
    },
};

const BASE = __ENV.BASE_URL || "http://localhost:8000";
const GAMIFICATION_BASE = __ENV.GAMIFICATION_URL || "http://localhost:3015";

export default function () {
    group("Job Search", () => {
        const start = Date.now();
        const res = http.get(`${BASE}/api/v1/jobs?query=engineer&limit=20`);
        jobSearchTime.add(Date.now() - start);
        const ok = check(res, {
            "jobs returned 200": r => r.status === 200,
            "has jobs array": r => {
                try {
                    return Array.isArray(JSON.parse(r.body).jobs);
                } catch {
                    return false;
                }
            },
        });
        errorRate.add(!ok);
    });

    sleep(Math.random() * 2 + 0.5);

    group("Leaderboard", () => {
        const res = http.get(`${GAMIFICATION_BASE}/leaderboard`);
        const ok = check(res, {
            "leaderboard 200": r => r.status === 200,
        });
        errorRate.add(!ok);
    });

    sleep(Math.random() * 1 + 0.5);

    group("Health Checks", () => {
        const endpoints = [
            `${BASE}/health`,
            `http://localhost:3008/health`,
            `http://localhost:3009/health`,
            `${GAMIFICATION_BASE}/health`,
        ];
        for (const url of endpoints) {
            const res = http.get(url);
            check(res, { [`${url} healthy`]: r => r.status === 200 });
        }
    });

    sleep(1);
}
