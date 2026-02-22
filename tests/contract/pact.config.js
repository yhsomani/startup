/**
 * Contract Testing Setup
 *
 * Uses Pact for consumer-driven contract testing.
 * - Consumer: Frontend or service that makes requests
 * - Provider: Backend service that responds
 */

const path = require("path");

module.exports = {
    consumer: {
        name: "ts-mfe-shell",
        packages: [
            { name: "auth-service", version: "1.0.0" },
            { name: "user-service", version: "1.0.0" },
            { name: "job-service", version: "1.0.0" },
            { name: "lms-service", version: "1.0.0" },
        ],
    },
    pactFilesOrDirs: [path.join(__dirname, "../pacts")],
    pactDir: path.join(__dirname, "../pacts"),
    logDir: path.join(__dirname, "../logs/pact"),
    logLevel: "INFO",
    provider: {
        name: "talentsphere-backend",
        host: "localhost",
    },
};
