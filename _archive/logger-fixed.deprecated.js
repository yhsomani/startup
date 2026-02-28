/**
 * TalentSphere Shared Logger System
 * Provides centralized logging across all services
 */

class Logger {
    constructor(serviceName = "talentsphere") {
        this.serviceName = serviceName;
        this.level = process.env.LOG_LEVEL || "info";
    }

    info(message, meta = {}) {
        this.log("info", message, meta);
    }

    error(message, meta = {}) {
        this.log("error", message, meta);
    }

    warn(message, meta = {}) {
        this.log("warn", message, meta);
    }

    debug(message, meta = {}) {
        this.log("debug", message, meta);
    }

    log(level, message, meta) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            service: this.serviceName,
            message,
            ...meta,
        };

        // Console output for all environments
        if (this.shouldLog(level)) {
            console.log(
                `[${logEntry.timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}`,
                meta
            );
        }

        // File output for production
        if (process.env.NODE_ENV === "production" && process.env.LOG_DIR) {
            this.writeToFile(logEntry);
        }
    }

    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.level];
    }

    writeToFile(logEntry) {
        const fs = require("fs");
        const path = require("path");

        try {
            const logFile = path.join(process.env.LOG_DIR, `${this.serviceName}.log`);
            const logLine = JSON.stringify(logEntry) + "\n";
            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error("Failed to write to log file:", error);
        }
    }
}

// Create default logger instances
const createServiceLogger = serviceName => new Logger(serviceName);

module.exports = {
    Logger,
    createServiceLogger,
    // Pre-configured loggers for different services
    apiGateway: new Logger("api-gateway"),
    lmsService: new Logger("lms-service"),
    challengeService: new Logger("challenge-service"),
    analyticsService: new Logger("analytics-service"),
    dashboardService: new Logger("dashboard-service"),
    recruitmentService: new Logger("recruitment-service"),
    database: new Logger("database"),
    cache: new Logger("cache"),
};
