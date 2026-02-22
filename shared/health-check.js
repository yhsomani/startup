/**
 * Health Check Middleware
 *
 * Provides comprehensive health checks including:
 * - Basic liveness (/health)
 * - Readiness with dependencies (/ready)
 * - Deep health checks (/health/deep)
 */

const os = require("os");

class HealthCheck {
    constructor(options = {}) {
        this.serviceName = options.serviceName || "unknown";
        this.version = options.version || "1.0.0";
        this.checks = new Map();
        this.startTime = Date.now();
    }

    registerCheck(name, check) {
        this.checks.set(name, check);
    }

    registerDatabaseCheck(name, pool) {
        this.checks.set(name, async () => {
            try {
                await pool.query("SELECT 1");
                return { status: "healthy" };
            } catch (error) {
                return { status: "unhealthy", error: error.message };
            }
        });
    }

    registerRedisCheck(name, client) {
        this.checks.set(name, async () => {
            try {
                await client.ping();
                return { status: "healthy" };
            } catch (error) {
                return { status: "unhealthy", error: error.message };
            }
        });
    }

    registerRabbitMQCheck(name, channel) {
        this.checks.set(name, async () => {
            try {
                await channel.checkQueue("health");
                return { status: "healthy" };
            } catch (error) {
                return { status: "unhealthy", error: error.message };
            }
        });
    }

    async getSystemInfo() {
        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
            cpu: os.loadavg(),
        };
    }

    async liveness() {
        return {
            status: "ok",
            service: this.serviceName,
            version: this.version,
            timestamp: new Date().toISOString(),
        };
    }

    async readiness() {
        const checks = {};
        let allHealthy = true;

        for (const [name, checkFn] of this.checks.entries()) {
            try {
                const result = await checkFn();
                checks[name] = result;
                if (result.status === "unhealthy") {
                    allHealthy = false;
                }
            } catch (error) {
                checks[name] = { status: "unhealthy", error: error.message };
                allHealthy = false;
            }
        }

        return {
            status: allHealthy ? "ok" : "degraded",
            service: this.serviceName,
            checks,
            timestamp: new Date().toISOString(),
        };
    }

    async deepHealth() {
        const [liveness, readiness, systemInfo] = await Promise.all([
            this.liveness(),
            this.readiness(),
            this.getSystemInfo(),
        ]);

        return {
            liveness,
            readiness,
            system: systemInfo,
            dependencies: await this.readiness(),
        };
    }

    middleware() {
        const health = this;

        return async (req, res) => {
            const path = req.path;

            try {
                let result;
                let statusCode = 200;

                if (path === "/health" || path === "/health/liveness") {
                    result = await health.liveness();
                } else if (path === "/ready" || path === "/health/ready") {
                    result = await health.readiness();
                    if (result.status !== "ok") {
                        statusCode = 503;
                    }
                } else if (path === "/health/deep") {
                    result = await health.deepHealth();
                    if (result.readiness.status !== "ok") {
                        statusCode = 503;
                    }
                } else {
                    return res.status(404).json({ error: "Not found" });
                }

                res.status(statusCode).json(result);
            } catch (error) {
                res.status(500).json({
                    status: "error",
                    error: error.message,
                });
            }
        };
    }
}

const healthCheck = new HealthCheck({
    serviceName: process.env.SERVICE_NAME || "talentsphere-service",
    version: process.env.APP_VERSION || "1.0.0",
});

module.exports = {
    HealthCheck,
    healthCheck,
};
