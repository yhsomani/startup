/**
 * Service Registration Utility for TalentSphere
 * Provides automatic service registration with ServiceDiscovery
 * for all microservices
 */

const { createLogger } = require("../shared/enhanced-logger");
const ServiceDiscovery = require("./service-discovery");

class ServiceRegistry {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.logger = createLogger(`ServiceRegistry-${serviceName}`);
        this.serviceDiscovery = null;
        this.instanceId = null;

        this.config = {
            enabled: options.enabled !== false, // Enable by default
            host: options.host || process.env.SERVICE_HOST || "localhost",
            port: options.port || process.env.PORT || 3000,
            path: options.path || "/",
            protocol: options.protocol || "http",
            version: options.version || "1.0.0",
            tags: options.tags || [],
            metadata: options.metadata || {},
            weight: options.weight || 1,
            zone: options.zone || "default",
            healthCheckPath: options.healthCheckPath || "/health",

            // Service Discovery Configuration
            redis: {
                host: process.env.REDIS_HOST || "localhost",
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                db: process.env.REDIS_DB || 0,
                ...options.redis,
            },

            consul: {
                host: process.env.CONSUL_HOST || "localhost",
                port: process.env.CONSUL_PORT || 8500,
                enabled: process.env.CONSUL_ENABLED === "true",
                ...options.consul,
            },

            // Heartbeat configuration
            heartbeat: {
                interval: options.heartbeatInterval || 10000, // 10 seconds
                timeout: options.heartbeatTimeout || 5000, // 5 seconds
                ...options.heartbeat,
            },
        };

        this.heartbeatInterval = null;
        this.isRegistered = false;
    }

    /**
     * Initialize service registration
     */
    async initialize() {
        if (!this.config.enabled) {
            this.logger.info("Service registration disabled");
            return;
        }

        try {
            // Initialize Service Discovery
            this.serviceDiscovery = new ServiceDiscovery({
                redis: this.config.redis,
                consul: this.config.consul,
                loadBalancing: {
                    strategy: process.env.LOAD_BALANCING_STRATEGY || "round-robin",
                    healthCheckInterval: 10000,
                },
            });

            await this.serviceDiscovery.initialize();
            this.logger.info("Service Discovery initialized");

            // Register the service
            await this.register();

            // Start heartbeat
            this.startHeartbeat();
        } catch (error) {
            this.logger.error("Failed to initialize service registration", {
                error: error.message,
                stack: error.stack,
            });

            // Continue without service registration for development
            this.logger.warn("Service will continue without registration");
        }
    }

    /**
     * Register the service with ServiceDiscovery
     */
    async register() {
        if (!this.serviceDiscovery || this.isRegistered) {
            return;
        }

        try {
            const instanceInfo = {
                host: this.config.host,
                port: this.config.port,
                protocol: this.config.protocol,
                path: this.config.path,
                version: this.config.version,
                tags: [...this.config.tags, this.serviceName],
                metadata: {
                    ...this.config.metadata,
                    startedAt: new Date().toISOString(),
                    nodeVersion: process.version,
                    platform: process.platform,
                    pid: process.pid,
                },
                weight: this.config.weight,
                zone: this.config.zone,
            };

            this.instanceId = await this.serviceDiscovery.registerService(
                this.serviceName,
                instanceInfo
            );

            this.isRegistered = true;
            this.logger.info("Service registered successfully", {
                instanceId: this.instanceId,
                host: this.config.host,
                port: this.config.port,
                version: this.config.version,
            });

            return this.instanceId;
        } catch (error) {
            this.logger.error("Failed to register service", {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Update service metadata
     */
    async updateMetadata(metadata) {
        if (!this.isRegistered || !this.instanceId) {
            return;
        }

        try {
            const currentInstances = await this.serviceDiscovery.getHealthyServiceInstances(
                this.serviceName
            );
            const currentInstance = currentInstances.find(inst => inst.id === this.instanceId);

            if (currentInstance) {
                const updatedInstance = {
                    ...currentInstance,
                    metadata: {
                        ...currentInstance.metadata,
                        ...metadata,
                        updatedAt: new Date().toISOString(),
                    },
                };

                // Re-register with updated metadata
                await this.serviceDiscovery.deregisterService(this.serviceName, this.instanceId);
                this.instanceId = await this.serviceDiscovery.registerService(
                    this.serviceName,
                    updatedInstance
                );

                this.logger.debug("Service metadata updated", { metadata });
            }
        } catch (error) {
            this.logger.error("Failed to update service metadata", {
                error: error.message,
            });
        }
    }

    /**
     * Start heartbeat to keep service registered
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(async () => {
            try {
                if (this.serviceDiscovery && this.isRegistered) {
                    // Update last heartbeat time
                    await this.updateMetadata({
                        lastHeartbeat: new Date().toISOString(),
                    });
                }
            } catch (error) {
                this.logger.warn("Heartbeat failed", { error: error.message });

                // Try to re-register
                try {
                    await this.register();
                } catch (regError) {
                    this.logger.error("Failed to re-register service", {
                        error: regError.message,
                    });
                }
            }
        }, this.config.heartbeat.interval);

        this.logger.debug("Heartbeat started", {
            interval: this.config.heartbeat.interval,
        });
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            this.logger.debug("Heartbeat stopped");
        }
    }

    /**
     * Deregister the service
     */
    async deregister() {
        if (!this.isRegistered || !this.instanceId || !this.serviceDiscovery) {
            return;
        }

        try {
            this.stopHeartbeat();

            await this.serviceDiscovery.deregisterService(this.serviceName, this.instanceId);

            this.isRegistered = false;
            this.instanceId = null;

            this.logger.info("Service deregistered successfully");
        } catch (error) {
            this.logger.error("Failed to deregister service", {
                error: error.message,
                stack: error.stack,
            });
        }
    }

    /**
     * Get service instance information
     */
    getInstanceInfo() {
        return {
            serviceName: this.serviceName,
            instanceId: this.instanceId,
            isRegistered: this.isRegistered,
            config: this.config,
            hasHeartbeat: !!this.heartbeatInterval,
        };
    }

    /**
     * Get service discovery client (for advanced usage)
     */
    getServiceDiscovery() {
        return this.serviceDiscovery;
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info("Shutting down service registry...");

        this.stopHeartbeat();
        await this.deregister();

        if (this.serviceDiscovery) {
            await this.serviceDiscovery.shutdown();
        }

        this.logger.info("Service registry shutdown completed");
    }
}

/**
 * Create a service registry instance
 * @param {string} serviceName - Name of the service
 * @param {Object} options - Configuration options
 * @returns {ServiceRegistry} Service registry instance
 */
function createServiceRegistry(serviceName, options = {}) {
    return new ServiceRegistry(serviceName, options);
}

/**
 * Middleware to automatically add service registry to Express app
 */
function serviceRegistryMiddleware(serviceRegistry) {
    return (req, res, next) => {
        req.serviceRegistry = serviceRegistry;
        req.instanceInfo = serviceRegistry.getInstanceInfo();
        next();
    };
}

module.exports = {
    ServiceRegistry,
    createServiceRegistry,
    serviceRegistryMiddleware,
};
