#!/usr/bin/env node

/**
 * TalentSphere Service Diagnostics
 * Identifies startup failures for each service
 * Usage: node scripts/diagnose-services.js
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");

const services = [
    { name: "API Gateway", path: "api-gateway/server.js", port: 3000 },
    { name: "Auth Service", path: "backends/auth-service/index.js", port: 3001 },
    { name: "User Profile Service", path: "backends/backend-enhanced/user-profile-service/index.js", port: 3009 },
    { name: "Job Listing Service", path: "backends/backend-enhanced/job-listing-service/index.js", port: 3010 },
    { name: "Company Service", path: "backends/backend-enhanced/company-service/index.js", port: 4006 },
    { name: "Notification Service", path: "backends/backend-enhanced/notification-service/index.js", port: 4005 },
    { name: "Email Service", path: "backends/backend-enhanced/email-service/index.js", port: 4007 },
    { name: "Analytics Service", path: "backends/backend-enhanced/analytics-service/index.js", port: 3008 },
];

const results = {
    fileExists: [],
    fileNotFound: [],
    alreadyRunning: [],
    startupSuccessful: [],
    startupFailed: [],
};

console.log("\n🔍 TalentSphere Service Diagnostics\n");
console.log("=" .repeat(60));

// Check if port is in use
function checkPortOpen(port) {
    return new Promise(resolve => {
        const socket = net.createConnection(port, "127.0.0.1");
        socket.on("connect", () => {
            socket.destroy();
            resolve(true);
        });
        socket.on("error", () => {
            resolve(false);
        });
        setTimeout(() => {
            socket.destroy();
            resolve(false);
        }, 1000);
    });
}

// Test each service
async function diagnoseServices() {
    for (const service of services) {
        const fullPath = path.join(__dirname, "..", service.path);
        console.log(`\n📋 ${service.name}`);
        console.log(`   Path: ${fullPath}`);
        console.log(`   Port: ${service.port}`);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.log(`   ❌ File NOT found`);
            results.fileNotFound.push(service);
            continue;
        }
        console.log(`   ✅ File exists`);
        results.fileExists.push(service);

        // Check if port is already in use
        const portInUse = await checkPortOpen(service.port);
        if (portInUse) {
            console.log(`   ⚠️  Port ${service.port} already in use (service running?)`);
            results.alreadyRunning.push(service);
            continue;
        }
        console.log(`   ✅ Port ${service.port} available`);

        // Try to start service with timeout
        console.log(`   🚀 Attempting startup...`);
        try {
            const startPromise = new Promise((resolve, reject) => {
                let errorOutput = "";
                let successOutput = "";

                const proc = spawn("node", [fullPath], {
                    timeout: 5000,
                    env: { 
                        ...process.env, 
                        NODE_ENV: process.env.NODE_ENV || "development" 
                    }
                });

                const timer = setTimeout(() => {
                    proc.kill();
                    reject(new Error("Startup timeout (5s)"));
                }, 5000);

                proc.stdout.on("data", data => {
                    successOutput += data.toString();
                });

                proc.stderr.on("data", data => {
                    errorOutput += data.toString();
                });

                proc.on("error", error => {
                    clearTimeout(timer);
                    reject(error);
                });

                proc.on("exit", code => {
                    clearTimeout(timer);
                    if (code === 0) {
                        resolve({ output: successOutput });
                    } else if (code === null) {
                        resolve({ output: successOutput, killed: true });
                    } else {
                        reject(new Error(`Exit code ${code}: ${errorOutput}`));
                    }
                });
            });

            await startPromise;
            console.log(`   ✅ Service started successfully (killed after verification)`);
            results.startupSuccessful.push(service);
        } catch (error) {
            const errorMsg = error.message || String(error);
            console.log(`   ❌ Startup failed: ${errorMsg.substring(0, 80)}...`);
            results.startupFailed.push({ ...service, error: errorMsg });
        }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 DIAGNOSTIC SUMMARY\n");
    console.log(`✅ Files exist: ${results.fileExists.length}/${services.length}`);
    console.log(`❌ Files missing: ${results.fileNotFound.length}/${services.length}`);
    console.log(`⚠️  Already running: ${results.alreadyRunning.length}/${services.length}`);
    console.log(`🚀 Startup successful: ${results.startupSuccessful.length}/${services.length}`);
    console.log(`💥 Startup failed: ${results.startupFailed.length}/${services.length}`);

    if (results.startupFailed.length > 0) {
        console.log("\n🔴 SERVICES THAT FAILED TO START:\n");
        results.startupFailed.forEach(svc => {
            console.log(`   ${svc.name}`);
            console.log(`      Error: ${svc.error}`);
        });
    }

    console.log("\n");
}

// Run diagnostics
diagnoseServices().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
