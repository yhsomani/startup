/**
 * Unified Service Startup Script
 * This script provides a consistent startup pattern for all TalentSphere services
 *
 * Usage:
 * node scripts/start-service.js --service=search-service --port=3004
 *
 * Environment variables:
 * - SERVICE_NAME: Name of the service
 * - PORT: Port for the service
 * - ENABLE_SERVICE_DISCOVERY: Enable/disable service registration (default: true)
 * - REDIS_HOST: Redis host for service discovery
 * - CONSUL_ENABLED: Enable Consul integration
 */

const path = require("path");
const { createServiceRegistry } = require("../services/shared/service-registry");
const { createLogger } = require("../shared/enhanced-logger");

class ServiceStarter {
    constructor(options = {}) {
        this.logger = createLogger("ServiceStarter");
        this.serviceRegistry = null;
        this.serviceInstance = null;

        this.options = {
            serviceName: options.serviceName || process.env.SERVICE_NAME,
            port: options.port || process.env.PORT || 3000,
            host: options.host || process.env.SERVICE_HOST || "localhost",
            servicePath: options.servicePath || process.env.SERVICE_PATH,
            enableServiceDiscovery: options.enableServiceDiscovery !== false,

            // Service metadata
            version: options.version || process.env.SERVICE_VERSION || "1.0.0",
            description: options.description || `${this.options.serviceName} microservice`,
            tags:
                options.tags ||
                (process.env.SERVICE_TAGS ? process.env.SERVICE_TAGS.split(",") : []),

            // Health check
            healthCheckPath: options.healthCheckPath || "/health",

            ...options,
        };
    }

    /**
     * Start the service with proper initialization
     */
    async start() {
        try {
            this.logger.info("Starting service...", {
                serviceName: this.options.serviceName,
                port: this.options.port,
                serviceDiscovery: this.options.enableServiceDiscovery,
            });

            // Step 1: Initialize Service Registry
            if (this.options.enableServiceDiscovery) {
                await this.initializeServiceRegistry();
            }

            // Step 2: Load and initialize the service
            await this.initializeService();

            // Step 3: Update service metadata
            if (this.serviceRegistry) {
                await this.updateServiceMetadata();
            }

            // Step 4: Setup graceful shutdown
            this.setupGracefulShutdown();

            this.logger.info("Service started successfully", {
                serviceName: this.options.serviceName,
                port: this.options.port,
                instanceId: this.serviceRegistry?.getInstanceInfo()?.instanceId,
                serviceDiscovery: !!this.serviceRegistry,
            });

            return this.serviceInstance;
        } catch (error) {
            this.logger.error("Failed to start service", {
                serviceName: this.options.serviceName,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Initialize Service Registry
     */
    async initializeServiceRegistry() {
        this.serviceRegistry = createServiceRegistry(this.options.serviceName, {
            port: this.options.port,
            host: this.options.host,
            version: this.options.version,
            tags: this.options.tags,
            metadata: {
                description: this.options.description,
                startedAt: new Date().toISOString(),
                startupScript: true,
            },
            healthCheckPath: this.options.healthCheckPath,
        });

        await this.serviceRegistry.initialize();
        this.logger.info("Service Registry initialized");
    }

    /**
     * Initialize the actual service
     */
    async initializeService() {
        if (!this.options.servicePath) {
            throw new Error("Service path is required");
        }

        try {
            // Dynamic import of the service module
            const ServiceClass = require(path.resolve(this.options.servicePath));

            // Create service instance
            if (typeof ServiceClass === "function") {
                this.serviceInstance = new ServiceClass({
                    port: this.options.port,
                    serviceRegistry: this.serviceRegistry,
                    ...this.options,
                });
            } else if (ServiceClass.default && typeof ServiceClass.default === "function") {
                this.serviceInstance = new ServiceClass.default({
                    port: this.options.port,
                    serviceRegistry: this.serviceRegistry,
                    ...this.options,
                });
            } else if (typeof ServiceClass.start === "function") {
                // Service module has a start function
                this.serviceInstance = await ServiceClass.start({
                    port: this.options.port,
                    serviceRegistry: this.serviceRegistry,
                    ...this.options,
                });
            } else {
                throw new Error(`Invalid service module: ${this.options.servicePath}`);
            }

            // Initialize the service if it has an initialize method
            if (this.serviceInstance && typeof this.serviceInstance.initialize === "function") {
                await this.serviceInstance.initialize();
            }

            this.logger.info("Service initialized", {
                servicePath: this.options.servicePath,
                instanceType: typeof this.serviceInstance,
            });
        } catch (error) {
            this.logger.error("Failed to initialize service", {
                servicePath: this.options.servicePath,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Update service metadata with runtime information
     */
    async updateServiceMetadata() {
        if (!this.serviceRegistry) {return;}

        const metadata = {
            status: "running",
            initializedAt: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        };

        // Add service-specific metadata if available
        if (this.serviceInstance) {
            if (this.serviceInstance.getServiceInfo) {
                metadata.serviceInfo = this.serviceInstance.getServiceInfo();
            }

            if (this.serviceInstance.getEndpoints) {
                metadata.endpoints = this.serviceInstance.getEndpoints();
            }
        }

        await this.serviceRegistry.updateMetadata(metadata);
        this.logger.info("Service metadata updated", metadata);
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown() {
        const gracefulShutdown = async signal => {
            this.logger.info(`Received ${signal}, starting graceful shutdown...`);

            try {
                // Shutdown service instance first
                if (this.serviceInstance) {
                    if (typeof this.serviceInstance.close === "function") {
                        await this.serviceInstance.close();
                    } else if (typeof this.serviceInstance.shutdown === "function") {
                        await this.serviceInstance.shutdown();
                    } else if (typeof this.serviceInstance.stop === "function") {
                        await this.serviceInstance.stop();
                    }
                }

                // Shutdown service registry
                if (this.serviceRegistry) {
                    await this.serviceRegistry.shutdown();
                }

                this.logger.info("Graceful shutdown completed");
                process.exit(0);
            } catch (error) {
                this.logger.error("Error during graceful shutdown", {
                    error: error.message,
                    stack: error.stack,
                });
                process.exit(1);
            }
        };

        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // For nodemon
    }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace("--", "").replace(/-/g, "");
        const value = args[i + 1];

        if (value !== undefined && !value.startsWith("--")) {
            options[key] = value;
        }
    }

    return options;
}

/**
 * Main execution
 */
async function main() {
    try {
        const args = parseArgs();

        // Validate required arguments
        if (!args.service && !process.env.SERVICE_NAME) {
            console.error(
                "Error: Service name is required. Use --service=<name> or SERVICE_NAME environment variable"
            );
            process.exit(1);
        }

        // Determine service path
        const serviceName = args.service || process.env.SERVICE_NAME;
        const servicePath =
            args.servicePath || path.join(__dirname, "..", "services", serviceName, "server.js");

        const starter = new ServiceStarter({
            ...args,
            serviceName,
            servicePath,
        });

        await starter.start();
    } catch (error) {
        console.error("Failed to start service:", error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = { ServiceStarter };
