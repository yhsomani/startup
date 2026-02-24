/**
 * TalentSphere Main Server Entry Point
 * Entry point for the entire TalentSphere application
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration for all services to start
const services = [
    { name: "API Gateway", path: "api-gateway/server.js" },
    { name: "Auth Service", path: "backends/backend-enhanced/auth-service/index.js" },
    { name: "User Profile Service", path: "backends/backend-enhanced/user-profile-service/index.js" },
    { name: "Job Listing Service", path: "backends/backend-enhanced/job-listing-service/index.js" },
    { name: "Company Service", path: "backends/backend-enhanced/company-service/index.js" },
    { name: "Notification Service", path: "backends/backend-enhanced/notification-service/index.js" },
    { name: "Email Service", path: "backends/backend-enhanced/email-service/index.js" },
    { name: "Analytics Service", path: "backends/backend-enhanced/analytics-service/index.js" }
];

const runningProcesses = [];

console.log("🚀 Starting TalentSphere Backend Services...");

services.forEach(service => {
    const fullPath = path.join(__dirname, service.path);

    if (fs.existsSync(fullPath)) {
        console.log(`📡 Starting ${service.name}...`);

        const proc = spawn("node", [fullPath], {
            stdio: "inherit",
            env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "development" }
        });

        proc.on("error", error => {
            console.error(`Failed to start ${service.name}:`, error);
        });

        proc.on("exit", code => {
            if (code !== 0 && code !== null) {
                console.log(`${service.name} exited with code ${code}`);
            }
        });

        runningProcesses.push({ name: service.name, proc });
    } else {
        console.warn(`⚠️  Service script not found: ${fullPath}`);
    }
});

// Handle graceful shutdown
const shutdown = () => {
    console.log("\n🛑 Shutting down TalentSphere services...");
    runningProcesses.forEach(item => {
        console.log(`停止 ${item.name}...`);
        item.proc.kill("SIGINT");
    });

    // Give services a moment to shut down gracefully
    setTimeout(() => {
        console.log("👋 All services stopped.");
        process.exit(0);
    }, 2000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
