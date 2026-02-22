/**
 * Configuration Hot Reloader
 *
 * Watches config files and environment variables for changes,
 * allowing runtime configuration updates without restart.
 */

const fs = require("fs");
const path = require("path");
const { createLogger } = require("./logger");

class ConfigReloader {
    constructor(options = {}) {
        this.logger = createLogger("ConfigReloader");
        this.configPath = options.configPath || "./config";
        this.config = {};
        this.watcher = null;
        this.reloadCallbacks = [];
        this.debounceMs = options.debounceMs || 1000;
        this.lastReload = Date.now();
    }

    loadConfig() {
        try {
            const configFiles = ["default.json", `${process.env.NODE_ENV}.json`];

            for (const file of configFiles) {
                const filePath = path.join(this.configPath, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, "utf8");
                    this.config = { ...this.config, ...JSON.parse(content) };
                }
            }

            this.config = {
                ...this.config,
                ...this.loadEnvConfig(),
            };

            this.logger.info("Configuration loaded", { timestamp: new Date().toISOString() });
            return this.config;
        } catch (error) {
            this.logger.error("Failed to load config:", error.message);
            return {};
        }
    }

    loadEnvConfig() {
        return {
            port: parseInt(process.env.PORT) || 3000,
            nodeEnv: process.env.NODE_ENV || "development",
            logLevel: process.env.LOG_LEVEL || "info",
            db: {
                host: process.env.DB_HOST || "localhost",
                port: parseInt(process.env.DB_PORT) || 5432,
                name: process.env.DB_NAME || "talentsphere",
                user: process.env.DB_USER || "postgres",
            },
            redis: {
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT) || 6379,
            },
            rabbitmq: {
                host: process.env.RABBITMQ_HOST || "localhost",
                port: parseInt(process.env.RABBITMQ_PORT) || 5672,
            },
        };
    }

    watch() {
        if (this.watcher) return;

        try {
            this.watcher = fs.watch(this.configPath, (eventType, filename) => {
                if (filename && filename.endsWith(".json")) {
                    this.debouncedReload();
                }
            });
            this.logger.info("Watching config for changes");
        } catch (error) {
            this.logger.error("Failed to watch config:", error.message);
        }
    }

    debouncedReload() {
        const now = Date.now();
        if (now - this.lastReload < this.debounceMs) return;

        this.lastReload = now;
        setTimeout(() => this.reload(), this.debounceMs);
    }

    reload() {
        const oldConfig = { ...this.config };
        this.loadConfig();

        this.reloadCallbacks.forEach(cb => {
            try {
                cb(this.config, oldConfig);
            } catch (error) {
                this.logger.error("Reload callback error:", error.message);
            }
        });

        this.logger.info("Configuration reloaded");
    }

    onReload(callback) {
        this.reloadCallbacks.push(callback);
    }

    get(key) {
        return key.split(".").reduce((obj, k) => obj?.[k], this.config);
    }

    getAll() {
        return { ...this.config };
    }

    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
}

const configReloader = new ConfigReloader();

module.exports = {
    ConfigReloader,
    configReloader,
};
