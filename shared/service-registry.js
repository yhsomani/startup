/**
 * TalentSphere Service Registry and Discovery
 * Microservice communication and coordination
 */

const { EventEmitter } = require("events");
const { createClient } = require("redis");
const axios = require("axios");
const config = require("../../../shared/config-manager");

class ServiceRegistry extends EventEmitter {
    constructor() {
        super();

        this.services = new Map();
        this.healthChecks = new Map();
        this.redisClient = null;

        this.initializeRedis();
        this.startHealthMonitoring();
        this.startDiscovery();
    }

    /**
     * Initialize Redis connection for service registry
     */
    async initializeRedis() {
        try {
            const redisConfig = config.getRedisConfig();

            this.redisClient = createClient({
                socket: {
                    host: redisConfig.host,
                    port: redisConfig.port,
                },
                password: redisConfig.password,
            });

            this.redisClient.on("error", err => {
                console.error("Redis client error:", err);
            });

            this.redisClient.on("connect", () => {
                console.log("Connected to Redis service registry");
            });

            await this.redisClient.connect();
        } catch (error) {
            console.error("Failed to initialize Redis:", error);
            // Fallback to in-memory registry
            this.fallbackMode = true;
        }
    }

    /**
     * Register a service
     */
    async registerService(serviceInfo) {
        const {
            id,
            name,
            version,
            host,
            port,
            protocol = "http",
            healthEndpoint = "/health",
            metadata = {},
            ttl = 60, // seconds
        } = serviceInfo;

        const service = {
            id,
            name,
            version,
            host,
            port,
            protocol,
            url: `${protocol}://${host}:${port}`,
            healthEndpoint,
            metadata,
            registeredAt: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            ttl,
            status: "healthy",
        };

        // Store in local registry
        this.services.set(id, service);

        // Store in Redis
        if (!this.fallbackMode) {
            const redisKey = `service:${name}:${id}`;
            await this.redisClient.setEx(redisKey, ttl * 2, JSON.stringify(service));

            // Add to service list
            await this.redisClient.sAdd(`services:${name}`, id);
        }

        // Start health checking for this service
        this.startHealthCheck(service);

        this.emit("serviceRegistered", service);
        console.log(`Service registered: ${name} (${id})`);

        return service;
    }

    /**
     * Unregister a service
     */
    async unregisterService(serviceId) {
        const service = this.services.get(serviceId);

        if (!service) {
            throw new Error(`Service ${serviceId} not found`);
        }

        // Remove from local registry
        this.services.delete(serviceId);

        // Remove from Redis
        if (!this.fallbackMode) {
            const redisKey = `service:${service.name}:${serviceId}`;
            await this.redisClient.del(redisKey);
            await this.redisClient.sRem(`services:${service.name}`, serviceId);
        }

        // Stop health checking
        if (this.healthChecks.has(serviceId)) {
            clearInterval(this.healthChecks.get(serviceId));
            this.healthChecks.delete(serviceId);
        }

        this.emit("serviceUnregistered", service);
        console.log(`Service unregistered: ${service.name} (${serviceId})`);

        return service;
    }

    /**
     * Discover services by name
     */
    async discoverServices(serviceName) {
        let services = [];

        // Try Redis first
        if (!this.fallbackMode) {
            try {
                const serviceIds = await this.redisClient.sMembers(`services:${serviceName}`);

                for (const serviceId of serviceIds) {
                    const redisKey = `service:${serviceName}:${serviceId}`;
                    const serviceData = await this.redisClient.get(redisKey);

                    if (serviceData) {
                        services.push(JSON.parse(serviceData));
                    }
                }
            } catch (error) {
                console.error("Redis discovery failed:", error);
                // Fallback to local registry
            }
        }

        // Fallback to local registry
        if (services.length === 0) {
            services = Array.from(this.services.values()).filter(
                service => service.name === serviceName && service.status === "healthy"
            );
        }

        return services;
    }

    /**
     * Get a specific service instance (load balanced)
     */
    async getService(serviceName, strategy = "round-robin") {
        const services = await this.discoverServices(serviceName);

        if (services.length === 0) {
            throw new Error(`No healthy instances found for service: ${serviceName}`);
        }

        let selectedService;

        switch (strategy) {
            case "random":
                selectedService = services[Math.floor(Math.random() * services.length)];
                break;

            case "round-robin":
                const counterKey = `round-robin:${serviceName}`;
                let index = 0;

                if (!this.fallbackMode) {
                    try {
                        index = (await this.redisClient.incr(counterKey)) % services.length;
                    } catch {
                        // Fallback
                        index = services.length % services.length;
                    }
                } else {
                    index = services.length % services.length;
                }

                selectedService = services[index];
                break;

            case "least-connections":
                // For simplicity, just return first (could be enhanced)
                selectedService = services[0];
                break;

            default:
                selectedService = services[0];
        }

        return selectedService;
    }

    /**
     * Make service-to-service call
     */
    async callService(serviceName, endpoint, options = {}) {
        try {
            const service = await this.getService(serviceName);
            const url = `${service.url}${endpoint}`;

            const response = await axios({
                url,
                method: options.method || "GET",
                data: options.data,
                params: options.params,
                headers: {
                    ...options.headers,
                    "X-Service-Caller": process.env.SERVICE_NAME || "unknown",
                    "X-Request-ID": options.requestId || this.generateRequestId(),
                },
                timeout: options.timeout || 30000,
                validateStatus: options.validateStatus || (status => status >= 200 && status < 300),
            });

            return {
                success: true,
                data: response.data,
                status: response.status,
                headers: response.headers,
                service,
            };
        } catch (error) {
            console.error(`Service call failed: ${serviceName}${endpoint}`, error.message);

            return {
                success: false,
                error: error.message,
                code: error.code,
                status: error.response?.status,
            };
        }
    }

    /**
     * Start health monitoring for all services
     */
    startHealthMonitoring() {
        // Check all registered services every 30 seconds
        setInterval(async () => {
            for (const [serviceId, service] of this.services) {
                await this.checkServiceHealth(serviceId, service);
            }
        }, 30000);
    }

    /**
     * Start health checking for a specific service
     */
    startHealthCheck(service) {
        const healthCheck = setInterval(async () => {
            await this.checkServiceHealth(service.id, service);
        }, 15000); // Check every 15 seconds

        this.healthChecks.set(service.id, healthCheck);
    }

    /**
     * Check service health
     */
    async checkServiceHealth(serviceId, service) {
        try {
            const healthUrl = `${service.url}${service.healthEndpoint}`;
            const response = await axios.get(healthUrl, {
                timeout: 5000,
                validateStatus: status => status >= 200 && status < 300,
            });

            // Update service health status
            service.status = "healthy";
            service.lastHealthCheck = new Date().toISOString();

            // Update in Redis
            if (!this.fallbackMode) {
                const redisKey = `service:${service.name}:${serviceId}`;
                await this.redisClient.setEx(redisKey, service.ttl * 2, JSON.stringify(service));
            }

            // Update local registry
            this.services.set(serviceId, { ...service });

            this.emit("serviceHealthCheck", { serviceId, status: "healthy" });
        } catch (error) {
            service.status = "unhealthy";
            service.lastHealthCheck = new Date().toISOString();
            service.healthError = error.message;

            // Update in Redis
            if (!this.fallbackMode) {
                const redisKey = `service:${service.name}:${serviceId}`;
                await this.redisClient.setEx(redisKey, service.ttl * 2, JSON.stringify(service));
            }

            // Update local registry
            this.services.set(serviceId, { ...service });

            this.emit("serviceHealthCheck", {
                serviceId,
                status: "unhealthy",
                error: error.message,
            });
        }
    }

    /**
     * Start service discovery broadcast
     */
    startDiscovery() {
        // Announce service registry
        setInterval(async () => {
            try {
                const registryInfo = {
                    type: "service-registry",
                    id: "talentsphere-registry",
                    host: process.env.REGISTRY_HOST || "localhost",
                    port: process.env.REGISTRY_PORT || 8761,
                    services: Array.from(this.services.values()).map(s => ({
                        id: s.id,
                        name: s.name,
                        version: s.version,
                        status: s.status,
                    })),
                };

                if (!this.fallbackMode) {
                    await this.redisClient.publish(
                        "service-announce",
                        JSON.stringify(registryInfo)
                    );
                }

                this.emit("registryAnnounce", registryInfo);
            } catch (error) {
                console.error("Discovery broadcast failed:", error);
            }
        }, 60000); // Announce every minute
    }

    /**
     * API Gateway integration
     */
    createGatewayMiddleware() {
        return async (req, res, next) => {
            try {
                // Extract service name from path
                const serviceName = req.path.split("/")[2]; // /api/v1/service-name/...

                if (serviceName) {
                    const endpoint = req.path.replace(`/api/v1/${serviceName}`, "");
                    const service = await this.getService(serviceName);

                    if (service) {
                        // Proxy request to service
                        const result = await this.callService(serviceName, endpoint, {
                            method: req.method,
                            data: req.body,
                            params: req.query,
                            headers: req.headers,
                            requestId: req.requestId,
                        });

                        if (result.success) {
                            return res.status(result.status).json(result.data);
                        } else {
                            return res.status(result.status || 502).json({
                                error: "Service unavailable",
                                message: result.error,
                                requestId: req.requestId,
                            });
                        }
                    }
                }

                next();
            } catch (error) {
                console.error("Gateway middleware error:", error);
                res.status(500).json({
                    error: "Internal server error",
                    message: "Service discovery failed",
                    requestId: req.requestId,
                });
            }
        };
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get registry statistics
     */
    getStats() {
        const services = Array.from(this.services.values());
        const healthy = services.filter(s => s.status === "healthy").length;
        const unhealthy = services.filter(s => s.status === "unhealthy").length;

        return {
            total: services.length,
            healthy,
            unhealthy,
            fallbackMode: this.fallbackMode,
            services: services.map(s => ({
                id: s.id,
                name: s.name,
                version: s.version,
                status: s.status,
                registeredAt: s.registeredAt,
                lastHeartbeat: s.lastHeartbeat,
            })),
        };
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log("Shutting down service registry...");

        // Stop all health checks
        for (const healthCheck of this.healthChecks.values()) {
            clearInterval(healthCheck);
        }

        // Close Redis connection
        if (this.redisClient) {
            await this.redisClient.quit();
        }

        console.log("Service registry shutdown complete");
    }

    /**
     * Get healthy nodes for a service (for load balancing)
     */
    getHealthyNodes(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) return [];

        return service.instances
            .filter(instance => instance.status === "healthy")
            .map(instance => instance.url);
    }

    /**
     * Get nodes for consistent hashing ring
     * Returns only healthy instances for stateful routing
     */
    getNodesForHashRing(serviceName) {
        return this.getHealthyNodes(serviceName);
    }
}

// Singleton instance
const serviceRegistry = new ServiceRegistry();

module.exports = {
    ServiceRegistry,
    serviceRegistry,
};
