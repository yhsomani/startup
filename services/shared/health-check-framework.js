/**
 * Comprehensive Health Check Framework for TalentSphere
 *
 * Provides standardized health monitoring for:
 * - Service health status
 * - Database connectivity
 * - Redis/cache connectivity
 * - External service dependencies
 * - System resources
 * - Performance metrics
 * - Custom health checks
 */

const { createLogger } = require("../../shared/enhanced-logger");
const EventEmitter = require("events");

class HealthCheckFramework extends EventEmitter {
    constructor(serviceName, options = {}) {
        super();

        this.serviceName = serviceName;
        this.logger = createLogger(`HealthCheck-${serviceName}`);

        // Configuration
        this.config = {
            // Health check intervals
            basicInterval: options.basicInterval || 30000, // 30 seconds
            deepInterval: options.deepInterval || 300000, // 5 minutes
            resourceInterval: options.resourceInterval || 60000, // 1 minute

            // Timeouts
            defaultTimeout: options.defaultTimeout || 5000, // 5 seconds
            databaseTimeout: options.databaseTimeout || 10000, // 10 seconds
            externalTimeout: options.externalTimeout || 15000, // 15 seconds

            // Thresholds
            memoryThreshold: options.memoryThreshold || 90, // 90%
            cpuThreshold: options.cpuThreshold || 85, // 85%
            diskThreshold: options.diskThreshold || 85, // 85%

            // Status levels
            warningThreshold: options.warningThreshold || 2, // 2 failed checks
            criticalThreshold: options.criticalThreshold || 5, // 5 failed checks

            ...options,
        };

        // Health status
        this.status = {
            overall: "healthy", // healthy, warning, degraded, critical
            lastCheck: null,
            uptime: process.uptime(),
            checks: {},
            dependencies: {},
            metrics: {},
            history: [],
        };

        // Check registry
        this.checks = new Map();
        this.dependencies = new Map();

        // Intervals
        this.intervals = {
            basic: null,
            deep: null,
            resource: null,
        };

        // Initialize default checks
        this.initializeDefaultChecks();

        this.logger.info("Health Check Framework initialized", {
            serviceName,
            basicInterval: this.config.basicInterval,
            deepInterval: this.config.deepInterval,
        });
    }

    /**
     * Initialize default health checks
     */
    initializeDefaultChecks() {
        // Basic service health
        this.addCheck("service", {
            name: "Service Health",
            description: "Basic service availability",
            timeout: this.config.defaultTimeout,
            check: async () => {
                return {
                    status: "healthy",
                    message: "Service is running",
                    responseTime: Date.now(),
                    uptime: process.uptime(),
                };
            },
        });

        // Memory check
        this.addCheck("memory", {
            name: "Memory Usage",
            description: "System memory utilization",
            timeout: this.config.defaultTimeout,
            threshold: this.config.memoryThreshold,
            check: async () => {
                const memUsage = process.memoryUsage();
                const totalMemory = require("os").totalmem();
                const usedMemory = memUsage.heapUsed;
                const usagePercent = (usedMemory / totalMemory) * 100;

                const status =
                    usagePercent > this.config.memoryThreshold
                        ? "unhealthy"
                        : usagePercent > this.config.memoryThreshold * 0.8
                          ? "warning"
                          : "healthy";

                return {
                    status,
                    message: `Memory usage: ${usagePercent.toFixed(2)}%`,
                    usage: {
                        heapUsed: memUsage.heapUsed,
                        heapTotal: memUsage.heapTotal,
                        external: memUsage.external,
                        rss: memUsage.rss,
                        usagePercent: usagePercent,
                        totalMemory,
                        threshold: this.config.memoryThreshold,
                    },
                };
            },
        });

        // CPU check
        this.addCheck("cpu", {
            name: "CPU Usage",
            description: "System CPU utilization",
            timeout: this.config.defaultTimeout,
            threshold: this.config.cpuThreshold,
            check: async () => {
                const cpus = require("os").cpus();
                let totalIdle = 0;
                let totalTick = 0;

                cpus.forEach(cpu => {
                    for (let type in cpu.times) {
                        totalTick += cpu.times[type];
                    }
                    totalIdle += cpu.times.idle;
                });

                const usagePercent = 100 - (totalIdle / totalTick) * 100;
                const status =
                    usagePercent > this.config.cpuThreshold
                        ? "unhealthy"
                        : usagePercent > this.config.cpuThreshold * 0.8
                          ? "warning"
                          : "healthy";

                return {
                    status,
                    message: `CPU usage: ${usagePercent.toFixed(2)}%`,
                    usage: {
                        usagePercent,
                        cores: cpus.length,
                        threshold: this.config.cpuThreshold,
                    },
                };
            },
        });

        // Process info check
        this.addCheck("process", {
            name: "Process Information",
            description: "Service process information",
            timeout: this.config.defaultTimeout,
            check: async () => {
                return {
                    status: "healthy",
                    message: "Process information collected",
                    info: {
                        pid: process.pid,
                        uptime: process.uptime(),
                        version: process.version,
                        platform: process.platform,
                        arch: process.arch,
                        memoryUsage: process.memoryUsage(),
                    },
                };
            },
        });
    }

    /**
     * Add custom health check
     */
    addCheck(id, config) {
        if (!id || !config || !config.check) {
            throw new Error("Health check ID, config, and check function are required");
        }

        this.checks.set(id, {
            ...config,
            lastRun: null,
            lastResult: null,
            failureCount: 0,
            successCount: 0,
        });

        this.logger.debug("Health check added", { id, name: config.name });
    }

    /**
     * Add dependency check
     */
    addDependency(id, config) {
        if (!id || !config) {
            throw new Error("Dependency ID and config are required");
        }

        this.dependencies.set(id, {
            ...config,
            lastCheck: null,
            lastResult: null,
            failureCount: 0,
            successCount: 0,
        });

        this.logger.debug("Dependency check added", { id, name: config.name });
    }

    /**
     * Add database dependency check
     */
    addDatabaseDependency(id, database, options = {}) {
        this.addDependency(id, {
            name: `Database: ${id}`,
            description: `Connectivity to ${id} database`,
            timeout: this.config.databaseTimeout,
            check: async () => {
                try {
                    const startTime = Date.now();

                    // Test database connection
                    if (database.ping) {
                        await database.ping();
                    } else if (database.query) {
                        await database.query("SELECT 1");
                    } else if (database.execute) {
                        await database.execute("SELECT 1");
                    } else {
                        throw new Error("No valid database method available");
                    }

                    const responseTime = Date.now() - startTime;

                    return {
                        status: "healthy",
                        message: "Database connection successful",
                        responseTime,
                        metadata: {
                            database: id,
                            host: options.host || "unknown",
                            connectionType: options.connectionType || "unknown",
                        },
                    };
                } catch (error) {
                    return {
                        status: "unhealthy",
                        message: `Database connection failed: ${error.message}`,
                        error: error.message,
                        responseTime: Date.now() - startTime,
                    };
                }
            },
        });
    }

    /**
     * Add Redis dependency check
     */
    addRedisDependency(id, redis, options = {}) {
        this.addDependency(id, {
            name: `Redis: ${id}`,
            description: `Connectivity to ${id} Redis instance`,
            timeout: this.config.defaultTimeout,
            check: async () => {
                try {
                    const startTime = Date.now();

                    // Test Redis connection
                    const result = await redis.ping();
                    const responseTime = Date.now() - startTime;

                    if (result === "PONG") {
                        return {
                            status: "healthy",
                            message: "Redis connection successful",
                            responseTime,
                            metadata: {
                                redis: id,
                                host: options.host || "unknown",
                                port: options.port || 6379,
                            },
                        };
                    } else {
                        throw new Error(`Unexpected Redis response: ${result}`);
                    }
                } catch (error) {
                    return {
                        status: "unhealthy",
                        message: `Redis connection failed: ${error.message}`,
                        error: error.message,
                        responseTime: Date.now() - startTime,
                    };
                }
            },
        });
    }

    /**
     * Add external service dependency check
     */
    addExternalDependency(id, config) {
        this.addDependency(id, {
            name: `External: ${config.name || id}`,
            description: `Connectivity to ${config.name || id} external service`,
            timeout: this.config.externalTimeout,
            check: async () => {
                try {
                    const startTime = Date.now();

                    if (config.url) {
                        // HTTP check
                        const response = await fetch(config.url, {
                            method: "GET",
                            timeout: this.config.externalTimeout,
                            headers: config.headers || {},
                        });

                        const responseTime = Date.now() - startTime;
                        const isHealthy =
                            response.ok &&
                            (!config.expectedStatus || response.status === config.expectedStatus);

                        return {
                            status: isHealthy ? "healthy" : "unhealthy",
                            message: `HTTP ${response.status}: ${response.statusText}`,
                            responseTime,
                            metadata: {
                                url: config.url,
                                status: response.status,
                                expectedStatus: config.expectedStatus,
                            },
                        };
                    } else if (config.check) {
                        // Custom check function
                        const result = await config.check();
                        const responseTime = Date.now() - startTime;

                        return {
                            status: result.healthy ? "healthy" : "unhealthy",
                            message: result.message || "Custom check completed",
                            responseTime,
                            metadata: result.metadata || {},
                        };
                    } else {
                        throw new Error("External dependency must have URL or check function");
                    }
                } catch (error) {
                    return {
                        status: "unhealthy",
                        message: `External service check failed: ${error.message}`,
                        error: error.message,
                        responseTime: Date.now() - startTime,
                    };
                }
            },
        });
    }

    /**
     * Run basic health checks
     */
    async runBasicChecks() {
        const results = {};
        const startTime = Date.now();

        // Run all registered checks
        for (const [id, checkConfig] of this.checks.entries()) {
            try {
                const checkStart = Date.now();
                const result = await Promise.race([
                    checkConfig.check(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error("Health check timeout")),
                            checkConfig.timeout
                        )
                    ),
                ]);

                const checkTime = Date.now() - checkStart;

                // Update check statistics
                if (result.status === "healthy") {
                    checkConfig.successCount++;
                    checkConfig.failureCount = 0;
                } else {
                    checkConfig.failureCount++;
                }

                checkConfig.lastRun = new Date();
                checkConfig.lastResult = result;

                results[id] = {
                    ...result,
                    checkTime,
                    failureCount: checkConfig.failureCount,
                    successCount: checkConfig.successCount,
                };

                this.logger.debug(`Health check completed: ${id}`, {
                    status: result.status,
                    checkTime,
                    failureCount: checkConfig.failureCount,
                });
            } catch (error) {
                checkConfig.failureCount++;
                checkConfig.lastRun = new Date();
                checkConfig.lastResult = {
                    status: "unhealthy",
                    message: `Health check failed: ${error.message}`,
                    error: error.message,
                };

                results[id] = checkConfig.lastResult;

                this.logger.error(`Health check failed: ${id}`, {
                    error: error.message,
                    failureCount: checkConfig.failureCount,
                });
            }
        }

        // Calculate overall status
        const overallStatus = this.calculateOverallStatus(results);

        // Update status
        this.status = {
            ...this.status,
            overall: overallStatus,
            lastCheck: new Date(),
            checks: results,
            checkTime: Date.now() - startTime,
        };

        // Add to history
        this.status.history.push({
            timestamp: new Date(),
            status: overallStatus,
            checkTime: Date.now() - startTime,
            healthyChecks: Object.values(results).filter(r => r.status === "healthy").length,
            totalChecks: Object.keys(results).length,
        });

        // Keep only last 100 entries
        if (this.status.history.length > 100) {
            this.status.history = this.status.history.slice(-100);
        }

        this.emit("basic-checks-completed", this.status);
        this.logger.info("Basic health checks completed", {
            status: overallStatus,
            healthyChecks: Object.values(results).filter(r => r.status === "healthy").length,
            totalChecks: Object.keys(results).length,
            checkTime: Date.now() - startTime,
        });

        return this.status;
    }

    /**
     * Run deep health checks (includes dependencies)
     */
    async runDeepChecks() {
        const results = { ...this.status.checks };
        const dependencyResults = {};
        const startTime = Date.now();

        // Run dependency checks
        for (const [id, depConfig] of this.dependencies.entries()) {
            try {
                const depStart = Date.now();
                const result = await Promise.race([
                    depConfig.check(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error("Dependency check timeout")),
                            depConfig.timeout
                        )
                    ),
                ]);

                const depTime = Date.now() - depStart;

                // Update dependency statistics
                if (result.status === "healthy") {
                    depConfig.successCount++;
                    depConfig.failureCount = 0;
                } else {
                    depConfig.failureCount++;
                }

                depConfig.lastCheck = new Date();
                depConfig.lastResult = result;

                dependencyResults[id] = {
                    ...result,
                    checkTime: depTime,
                    failureCount: depConfig.failureCount,
                    successCount: depConfig.successCount,
                };

                this.logger.debug(`Dependency check completed: ${id}`, {
                    status: result.status,
                    checkTime: depTime,
                    failureCount: depConfig.failureCount,
                });
            } catch (error) {
                depConfig.failureCount++;
                depConfig.lastCheck = new Date();
                depConfig.lastResult = {
                    status: "unhealthy",
                    message: `Dependency check failed: ${error.message}`,
                    error: error.message,
                };

                dependencyResults[id] = depConfig.lastResult;

                this.logger.error(`Dependency check failed: ${id}`, {
                    error: error.message,
                    failureCount: depConfig.failureCount,
                });
            }
        }

        // Calculate overall status including dependencies
        const allResults = { ...results, ...dependencyResults };
        const overallStatus = this.calculateOverallStatus(allResults);

        // Update status
        this.status = {
            ...this.status,
            overall: overallStatus,
            lastCheck: new Date(),
            checks: results,
            dependencies: dependencyResults,
            checkTime: Date.now() - startTime,
        };

        this.emit("deep-checks-completed", this.status);
        this.logger.info("Deep health checks completed", {
            status: overallStatus,
            healthyChecks: Object.values(allResults).filter(r => r.status === "healthy").length,
            totalChecks: Object.keys(allResults).length,
            checkTime: Date.now() - startTime,
        });

        return this.status;
    }

    /**
     * Calculate overall health status
     */
    calculateOverallStatus(results) {
        const allResults = Object.values(results);
        const healthyCount = allResults.filter(r => r.status === "healthy").length;
        const totalCount = allResults.length;

        if (totalCount === 0) {
            return "unknown";
        }

        const healthRatio = healthyCount / totalCount;

        if (healthRatio >= 0.95) {
            return "healthy";
        } else if (healthRatio >= 0.8) {
            return "warning";
        } else if (healthRatio >= 0.5) {
            return "degraded";
        } else {
            return "critical";
        }
    }

    /**
     * Start health check monitoring
     */
    start() {
        this.logger.info("Starting health check monitoring");

        // Basic health checks
        if (this.intervals.basic) {
            clearInterval(this.intervals.basic);
        }

        this.intervals.basic = setInterval(async () => {
            await this.runBasicChecks();
        }, this.config.basicInterval);

        // Deep health checks
        if (this.intervals.deep) {
            clearInterval(this.intervals.deep);
        }

        this.intervals.deep = setInterval(async () => {
            await this.runDeepChecks();
        }, this.config.deepInterval);

        // Run initial checks
        this.runBasicChecks();

        this.emit("started");
    }

    /**
     * Stop health check monitoring
     */
    stop() {
        this.logger.info("Stopping health check monitoring");

        Object.values(this.intervals).forEach(interval => {
            if (interval) {
                clearInterval(interval);
            }
        });

        this.emit("stopped");
    }

    /**
     * Get current health status
     */
    getStatus() {
        return {
            ...this.status,
            uptime: process.uptime(),
            timestamp: new Date(),
            config: {
                basicInterval: this.config.basicInterval,
                deepInterval: this.config.deepInterval,
                resourceInterval: this.config.resourceInterval,
                memoryThreshold: this.config.memoryThreshold,
                cpuThreshold: this.config.cpuThreshold,
            },
        };
    }

    /**
     * Get health check summary
     */
    getSummary() {
        const current = this.getStatus();
        const checks = Object.values(current.checks);
        const dependencies = Object.values(current.dependencies);

        return {
            overall: current.overall,
            timestamp: current.timestamp,
            uptime: current.uptime,
            lastCheck: current.lastCheck,

            checks: {
                total: checks.length,
                healthy: checks.filter(c => c.status === "healthy").length,
                warning: checks.filter(c => c.status === "warning").length,
                unhealthy: checks.filter(c => c.status === "unhealthy").length,
                checkTime: current.checkTime,
            },

            dependencies: {
                total: dependencies.length,
                healthy: dependencies.filter(d => d.status === "healthy").length,
                unhealthy: dependencies.filter(d => d.status === "unhealthy").length,
            },

            performance: {
                averageResponseTime: this.calculateAverageResponseTime(checks),
                slowestCheck: this.findSlowestCheck(checks),
                fastestCheck: this.findFastestCheck(checks),
            },

            trends: {
                last24Hours: this.getStatusTrends(24),
                last7Days: this.getStatusTrends(24 * 7),
                last30Days: this.getStatusTrends(24 * 30),
            },
        };
    }

    /**
     * Calculate average response time
     */
    calculateAverageResponseTime(checks) {
        const responseTimes = checks.filter(c => c.checkTime).map(c => c.checkTime);

        if (responseTimes.length === 0) {return 0;}

        return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    /**
     * Find slowest check
     */
    findSlowestCheck(checks) {
        return checks.reduce(
            (slowest, check) =>
                !check.checkTime || (slowest.checkTime && check.checkTime < slowest.checkTime)
                    ? slowest
                    : check,
            { checkTime: 0 }
        );
    }

    /**
     * Find fastest check
     */
    findFastestCheck(checks) {
        return checks.reduce(
            (fastest, check) =>
                !check.checkTime || (fastest.checkTime && check.checkTime > fastest.checkTime)
                    ? fastest
                    : check,
            { checkTime: Infinity }
        );
    }

    /**
     * Get status trends over time period
     */
    getStatusTrends(hours) {
        const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        const recentHistory = this.status.history.filter(h => h.timestamp >= cutoffTime);

        if (recentHistory.length === 0) {
            return { status: "unknown", dataPoints: 0 };
        }

        const statusCounts = recentHistory.reduce((counts, entry) => {
            counts[entry.status] = (counts[entry.status] || 0) + 1;
            return counts;
        }, {});

        const mostCommonStatus = Object.entries(statusCounts).sort(([, a], [, b]) => b - a)[0][0];

        return {
            status: mostCommonStatus,
            dataPoints: recentHistory.length,
            distribution: statusCounts,
            period: `${hours} hours`,
        };
    }
}

module.exports = HealthCheckFramework;
