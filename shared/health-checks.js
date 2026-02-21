/**
 * TalentSphere Health Check System
 * Provides comprehensive health monitoring for all services and dependencies
 */

class HealthCheckManager {
    constructor() {
        this.checks = new Map();
        this.results = new Map();
        this.config = this.loadConfig();
        this.startTime = Date.now();
    }

    /**
     * Load health check configuration
     */
    loadConfig() {
        return {
            timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000,
            retries: parseInt(process.env.HEALTH_CHECK_RETRIES) || 3,
            retryDelay: parseInt(process.env.HEALTH_CHECK_RETRY_DELAY) || 1000,
            warningThreshold: parseInt(process.env.HEALTH_WARNING_THRESHOLD) || 80,
            criticalThreshold: parseInt(process.env.HEALTH_CRITICAL_THRESHOLD) || 90,
        };
    }

    /**
     * Register a health check
     */
    registerCheck(name, checkFunction, options = {}) {
        const {
            timeout = this.config.timeout,
            retries = this.config.retries,
            critical = false,
            category = "general",
        } = options;

        this.checks.set(name, {
            name,
            checkFunction,
            timeout,
            retries,
            critical,
            category,
            lastCheck: null,
            consecutiveFailures: 0,
        });

        console.log(`Health check registered: ${name}`);
    }

    /**
     * Execute a single health check with retry logic
     */
    async executeCheck(check) {
        const startTime = Date.now();
        let lastError = null;

        for (let attempt = 1; attempt <= check.retries + 1; attempt++) {
            try {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Health check timeout")), check.timeout);
                });

                const checkPromise = check.checkFunction();
                const result = await Promise.race([checkPromise, timeoutPromise]);

                const duration = Date.now() - startTime;

                return {
                    name: check.name,
                    status: "healthy",
                    message: "OK",
                    duration,
                    timestamp: new Date().toISOString(),
                    attempt,
                    details: result,
                };
            } catch (error) {
                lastError = error;

                if (attempt <= check.retries) {
                    await this.delay(this.config.retryDelay);
                }
            }
        }

        const duration = Date.now() - startTime;

        return {
            name: check.name,
            status: check.critical ? "critical" : "unhealthy",
            message: lastError.message || "Health check failed",
            duration,
            timestamp: new Date().toISOString(),
            attempt: check.retries + 1,
            error: {
                name: lastError.name,
                message: lastError.message,
                stack: process.env.NODE_ENV === "development" ? lastError.stack : undefined,
            },
        };
    }

    /**
     * Run all health checks
     */
    async runAllChecks() {
        const promises = Array.from(this.checks.values()).map(check => this.executeCheck(check));
        const results = await Promise.allSettled(promises);

        const healthReport = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            checks: {},
            summary: {
                total: this.checks.size,
                healthy: 0,
                unhealthy: 0,
                critical: 0,
                warnings: 0,
            },
            categories: {},
        };

        results.forEach((result, index) => {
            const check = Array.from(this.checks.values())[index];

            if (result.status === "fulfilled") {
                const checkResult = result.value;
                healthReport.checks[checkResult.name] = checkResult;

                // Update consecutive failures
                if (checkResult.status === "healthy") {
                    check.consecutiveFailures = 0;
                    healthReport.summary.healthy++;
                } else {
                    check.consecutiveFailures++;
                    if (checkResult.status === "critical") {
                        healthReport.summary.critical++;
                        healthReport.status = "critical";
                    } else {
                        healthReport.summary.unhealthy++;
                        if (healthReport.status === "healthy") {
                            healthReport.status = "unhealthy";
                        }
                    }
                }

                // Update category statistics
                if (!healthReport.categories[check.category]) {
                    healthReport.categories[check.category] = {
                        healthy: 0,
                        unhealthy: 0,
                        critical: 0,
                    };
                }

                if (checkResult.status === "healthy") {
                    healthReport.categories[check.category].healthy++;
                } else if (checkResult.status === "critical") {
                    healthReport.categories[check.category].critical++;
                } else {
                    healthReport.categories[check.category].unhealthy++;
                }
            } else {
                // Promise rejected
                healthReport.checks[check.name] = {
                    name: check.name,
                    status: check.critical ? "critical" : "unhealthy",
                    message: "Health check execution failed",
                    timestamp: new Date().toISOString(),
                    error: result.reason,
                };

                if (check.critical) {
                    healthReport.summary.critical++;
                    healthReport.status = "critical";
                } else {
                    healthReport.summary.unhealthy++;
                }
            }
        });

        // Cache results
        this.results.set("current", healthReport);

        return healthReport;
    }

    /**
     * Get system health status
     */
    async getHealthStatus() {
        const cached = this.results.get("current");

        // Return cached results if recent (within 30 seconds)
        if (cached && Date.now() - new Date(cached.timestamp).getTime() < 30000) {
            return cached;
        }

        return await this.runAllChecks();
    }

    /**
     * Get readiness status
     */
    async getReadinessStatus() {
        const health = await this.getHealthStatus();

        // Service is ready if no critical failures
        const isReady = health.summary.critical === 0;

        return {
            status: isReady ? "ready" : "not_ready",
            timestamp: health.timestamp,
            checks: Object.entries(health.checks)
                .filter(([name]) => this.checks.get(name)?.critical)
                .reduce((acc, [name, check]) => {
                    acc[name] = check;
                    return acc;
                }, {}),
        };
    }

    /**
     * Get liveness status
     */
    getLivenessStatus() {
        return {
            status: "alive",
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            version: process.env.npm_package_version || "1.0.0",
            environment: process.env.NODE_ENV || "development",
        };
    }

    /**
     * Predefined health checks
     */

    /**
     * Database connectivity check
     */
    createDatabaseCheck(dbManager, serviceName = "default") {
        return async () => {
            try {
                const status = await dbManager.getHealthStatus();
                return {
                    postgres: status.postgres,
                    mongodb: status.mongodb,
                    status: "connected",
                };
            } catch (error) {
                throw new Error(`Database connectivity failed: ${error.message}`);
            }
        };
    }

    /**
     * Redis connectivity check
     */
    createRedisCheck(redisClient) {
        return async () => {
            try {
                const result = await redisClient.ping();
                if (result !== "PONG") {
                    throw new Error("Redis ping failed");
                }
                return { status: "connected", response: result };
            } catch (error) {
                throw new Error(`Redis connectivity failed: ${error.message}`);
            }
        };
    }

    /**
     * External API check
     */
    createExternalApiCheck(url, options = {}) {
        const { method = "GET", headers = {}, expectedStatus = 200, timeout = 5000 } = options;

        return async () => {
            try {
                const response = await fetch(url, {
                    method,
                    headers,
                    signal: AbortSignal.timeout(timeout),
                });

                if (response.status !== expectedStatus) {
                    throw new Error(`Unexpected status code: ${response.status}`);
                }

                return {
                    status: "available",
                    statusCode: response.status,
                    responseTime: response.headers.get("x-response-time"),
                };
            } catch (error) {
                throw new Error(`External API check failed: ${error.message}`);
            }
        };
    }

    /**
     * Memory usage check
     */
    createMemoryCheck(threshold = 90) {
        return async () => {
            const memUsage = process.memoryUsage();
            const totalMem = require("os").totalmem();
            const usedMem = memUsage.heapUsed + memUsage.external;
            const usagePercent = (usedMem / totalMem) * 100;

            if (usagePercent > threshold) {
                throw new Error(`Memory usage too high: ${usagePercent.toFixed(2)}%`);
            }

            return {
                usage: {
                    heap: memUsage.heapUsed,
                    external: memUsage.external,
                    total: usedMem,
                    percentage: usagePercent.toFixed(2),
                },
                status: "normal",
            };
        };
    }

    /**
     * CPU usage check
     */
    createCpuCheck(threshold = 80) {
        return async () => {
            const cpus = require("os").cpus();
            const loadAvg = require("os").loadavg();
            const cpuCount = cpus.length;

            // Get average load over last minute
            const loadPercent = (loadAvg[0] / cpuCount) * 100;

            if (loadPercent > threshold) {
                throw new Error(`CPU usage too high: ${loadPercent.toFixed(2)}%`);
            }

            return {
                loadAverage: loadAvg,
                cpuCount,
                usagePercentage: loadPercent.toFixed(2),
                status: "normal",
            };
        };
    }

    /**
     * Disk space check
     */
    createDiskCheck(path = "/", threshold = 90) {
        return async () => {
            try {
                const fs = require("fs").promises;
                const stats = await fs.statfs(path);
                const freeSpace = stats.bavail * stats.bsize;
                const totalSpace = stats.blocks * stats.bsize;
                const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100;

                if (usedPercent > threshold) {
                    throw new Error(`Disk usage too high: ${usedPercent.toFixed(2)}%`);
                }

                return {
                    path,
                    total: totalSpace,
                    free: freeSpace,
                    used: totalSpace - freeSpace,
                    usagePercentage: usedPercent.toFixed(2),
                    status: "normal",
                };
            } catch (error) {
                throw new Error(`Disk space check failed: ${error.message}`);
            }
        };
    }

    /**
     * Service dependency check
     */
    createServiceDependencyCheck(serviceUrl, serviceName) {
        return async () => {
            try {
                const response = await fetch(`${serviceUrl}/health`, {
                    method: "GET",
                    timeout: 3000,
                });

                if (!response.ok) {
                    throw new Error(`Service ${serviceName} returned ${response.status}`);
                }

                const health = await response.json();
                return {
                    service: serviceName,
                    url: serviceUrl,
                    status: health.status,
                    timestamp: health.timestamp,
                };
            } catch (error) {
                throw new Error(`Service ${serviceName} is unavailable: ${error.message}`);
            }
        };
    }

    /**
     * Express.js middleware for health endpoints
     */
    createHealthMiddleware() {
        return {
            // Main health endpoint
            "/health": async (req, res) => {
                try {
                    const health = await this.getHealthStatus();
                    const statusCode =
                        health.status === "critical"
                            ? 503
                            : health.status === "unhealthy"
                              ? 200
                              : 200;

                    res.status(statusCode).json(health);
                } catch (error) {
                    res.status(500).json({
                        status: "error",
                        message: "Health check failed",
                        timestamp: new Date().toISOString(),
                        error: error.message,
                    });
                }
            },

            // Readiness probe endpoint
            "/ready": async (req, res) => {
                try {
                    const readiness = await this.getReadinessStatus();
                    const statusCode = readiness.status === "ready" ? 200 : 503;
                    res.status(statusCode).json(readiness);
                } catch (error) {
                    res.status(500).json({
                        status: "error",
                        message: "Readiness check failed",
                        error: error.message,
                    });
                }
            },

            // Liveness probe endpoint
            "/live": (req, res) => {
                try {
                    const liveness = this.getLivenessStatus();
                    res.status(200).json(liveness);
                } catch (error) {
                    res.status(500).json({
                        status: "error",
                        message: "Liveness check failed",
                        error: error.message,
                    });
                }
            },

            // Detailed health endpoint with category filtering
            "/health/detailed": async (req, res) => {
                try {
                    const health = await this.getHealthStatus();

                    if (req.query.category) {
                        const category = req.query.category;
                        health.checks = Object.entries(health.checks)
                            .filter(([name]) => this.checks.get(name)?.category === category)
                            .reduce((acc, [name, check]) => {
                                acc[name] = check;
                                return acc;
                            }, {});
                    }

                    res.status(200).json(health);
                } catch (error) {
                    res.status(500).json({
                        status: "error",
                        message: "Detailed health check failed",
                        error: error.message,
                    });
                }
            },
        };
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get all registered checks
     */
    getRegisteredChecks() {
        return Array.from(this.checks.values()).map(check => ({
            name: check.name,
            category: check.category,
            critical: check.critical,
            timeout: check.timeout,
            retries: check.retries,
            consecutiveFailures: check.consecutiveFailures,
        }));
    }

    /**
     * Remove a health check
     */
    removeCheck(name) {
        return this.checks.delete(name);
    }

    /**
     * Clear all health checks
     */
    clearChecks() {
        this.checks.clear();
        this.results.clear();
    }
}

module.exports = {
    HealthCheckManager,
    healthManager: new HealthCheckManager(),
};
