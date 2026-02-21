/**
 * TalentSphere Main Server Entry Point
 * Entry point for the entire TalentSphere application
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Check if API Gateway exists and start it
const apiGatewayPath = path.join(__dirname, "api-gateway", "server.js");

if (fs.existsSync(apiGatewayPath)) {
    console.log("🚀 Starting TalentSphere API Gateway...");

    // Start API Gateway
    const gatewayProcess = spawn("node", [apiGatewayPath], {
        stdio: "inherit",
        env: process.env,
    });

    gatewayProcess.on("error", error => {
        console.error("Failed to start API Gateway:", error);
        process.exit(1);
    });

    gatewayProcess.on("exit", code => {
        console.log(`API Gateway exited with code ${code}`);
        process.exit(code);
    });

    // Handle graceful shutdown
    process.on("SIGINT", () => {
        console.log("🛑 Shutting down TalentSphere...");
        gatewayProcess.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
        console.log("🛑 Shutting down TalentSphere...");
        gatewayProcess.kill("SIGTERM");
    });
} else {
    console.error("❌ API Gateway server.js not found at:", apiGatewayPath);
    console.error("Please ensure the API Gateway is properly built and deployed.");
    process.exit(1);
}
