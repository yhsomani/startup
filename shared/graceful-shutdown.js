/**
 * Graceful Shutdown Handler
 *
 * Ensures clean shutdown of:
 * - HTTP server
 * - Database connections
 * - Redis connections
 * - Message queue connections
 * - Background jobs
 */

const { createLogger } = require("./logger");

class GracefulShutdown {
    constructor(options = {}) {
        this.logger = createLogger("GracefulShutdown");
        this.forceShutdownTimeout = options.forceShutdownTimeout || 30000;
        this.gracePeriod = options.gracePeriod || 10000;
        this.components = new Map();
        this.isShuttingDown = false;
    }

    register(name, shutdownFn, priority = 0) {
        this.components.set(name, {
            shutdownFn,
            priority,
        });

        this.logger.info(`Registered shutdown component: ${name}`);
    }

    registerServer(server) {
        this.register(
            "http-server",
            async () => {
                return new Promise((resolve, reject) => {
                    server.close(err => {
                        if (err) {
                            this.logger.error("Error closing HTTP server:", err);
                            reject(err);
                        } else {
                            this.logger.info("HTTP server closed");
                            resolve();
                        }
                    });
                });
            },
            100
        );
    }

    registerDatabase(pool) {
        this.register(
            "database",
            async () => {
                if (pool && pool.end) {
                    await pool.end();
                    this.logger.info("Database connections closed");
                }
            },
            50
        );
    }

    registerRedis(client) {
        this.register(
            "redis",
            async () => {
                if (client && client.quit) {
                    await client.quit();
                    this.logger.info("Redis connection closed");
                }
            },
            50
        );
    }

    registerMessageQueue(channel) {
        this.register(
            "message-queue",
            async () => {
                if (channel && channel.close) {
                    await channel.close();
                    this.logger.info("Message queue channel closed");
                }
            },
            50
        );
    }

    async shutdown(signal) {
        if (this.isShuttingDown) {
            this.logger.warn("Shutdown already in progress");
            return;
        }

        this.isShuttingDown = true;
        this.logger.info(`Received ${signal}, starting graceful shutdown...`);

        const sortedComponents = Array.from(this.components.entries()).sort(
            (a, b) => b[1].priority - a[1].priority
        );

        let shutdownComplete = false;
        const timeout = setTimeout(() => {
            if (!shutdownComplete) {
                this.logger.warn("Graceful shutdown timeout, forcing exit");
                process.exit(1);
            }
        }, this.forceShutdownTimeout);

        try {
            for (const [name, component] of sortedComponents) {
                this.logger.info(`Shutting down: ${name}`);
                const startTime = Date.now();

                try {
                    await Promise.race([
                        component.shutdownFn(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("Shutdown timeout")), 5000)
                        ),
                    ]);

                    const duration = Date.now() - startTime;
                    this.logger.info(`Shutdown complete: ${name} (${duration}ms)`);
                } catch (error) {
                    this.logger.error(`Error shutting down ${name}:`, error.message);
                }
            }

            shutdownComplete = true;
            clearTimeout(timeout);

            this.logger.info("Graceful shutdown complete");
            process.exit(0);
        } catch (error) {
            this.logger.error("Fatal error during shutdown:", error);
            clearTimeout(timeout);
            process.exit(1);
        }
    }

    start(server) {
        process.on("SIGTERM", () => this.shutdown("SIGTERM"));
        process.on("SIGINT", () => this.shutdown("SIGINT"));

        process.on("uncaughtException", error => {
            this.logger.error("Uncaught exception:", error);
            this.shutdown("uncaughtException");
        });

        process.on("unhandledRejection", (reason, promise) => {
            this.logger.error("Unhandled rejection:", reason);
            this.shutdown("unhandledRejection");
        });

        this.logger.info("Graceful shutdown handlers registered");
    }
}

const gracefulShutdown = new GracefulShutdown({
    forceShutdownTimeout: 30000,
    gracePeriod: 10000,
});

module.exports = {
    GracefulShutdown,
    gracefulShutdown,
};
