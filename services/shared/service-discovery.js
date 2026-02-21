/**
 * Service Discovery System for TalentSphere
 *
 * Provides dynamic service discovery with:
 * - Redis-based service registration
 * - Consul integration for service health
 * - Load balancing across multiple service instances
 * - Health monitoring and automatic failover
 * - Service version management
 */

const Redis = require("ioredis");
const { createLogger } = require("./enhanced-logger");
const { v4: uuidv4 } = require("uuid");

class ServiceDiscovery {
    constructor(options = {}) {
        this.logger = createLogger("ServiceDiscovery");

        this.config = {
            redis: {
                host: options.redis?.host || process.env.REDIS_HOST || "localhost",
                port: options.redis?.port || process.env.REDIS_PORT || 6379,
                password: options.redis?.password || process.env.REDIS_PASSWORD,
                db: options.redis?.db || 0,
            },
            consul: {
                host: options.consul?.host || process.env.CONSUL_HOST || "localhost",
                port: options.consul?.port || process.env.CONSUL_PORT || 8500,
                enabled: options.consul?.enabled || process.env.CONSUL_ENABLED === "true",
            },
            cache: {
                ttl: options.cache?.ttl || 30000, // 30 seconds
                maxSize: options.cache?.maxSize || 1000,
            },
            loadBalancing: {
                strategy: options.loadBalancing?.strategy || "round-robin", // round-robin, least-connections, random
                healthCheckInterval: options.loadBalancing?.healthCheckInterval || 10000, // 10 seconds
            },
            monitoring: {
                metricsInterval: options.monitoring?.metricsInterval || 60000, // 1 minute
                healthCheckTimeout: options.monitoring?.healthCheckTimeout || 5000, // 5 seconds
            },
        };

        // Initialize connections
        this.redis = null;
        this.consul = null;
        this.serviceCache = new Map();
        this.healthStatus = new Map();
        this.metrics = new Map();
        this.loadBalancers = new Map();

        this.initialize();
    }

    /**
     * Initialize service discovery connections
     */
    async initialize() {
        try {
            // Initialize Redis connection
            this.redis = new Redis({
                host: this.config.redis.host,
                port: this.config.redis.port,
                password: this.config.redis.password,
                db: this.config.redis.db,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keyPrefix: "service-discovery:",
                reconnectOnError: true,
            });

            this.redis.on("connect", () => {
                this.logger.info("Redis connected for service discovery");
            });

            this.redis.on("error", error => {
                this.logger.error("Redis connection error", { error: error.message });
            });

            // Initialize Consul if enabled
            if (this.config.consul.enabled) {
                await this.initializeConsul();
            }

            // Start background tasks
            this.startBackgroundTasks();

            this.logger.info("Service discovery initialized", {
                redis: this.config.redis.host + ":" + this.config.redis.port,
                consul: this.config.consul.enabled
                    ? this.config.consul.host + ":" + this.config.consul.port
                    : "disabled",
                loadBalancing: this.config.loadBalancing.strategy,
            });
        } catch (error) {
            this.logger.error("Failed to initialize service discovery", {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Initialize Consul client
     */
    async initializeConsul() {
        try {
            const consul = require("consul")({
                host: this.config.consul.host,
                port: this.config.consul.port,
                promisify: true,
            });

            this.consul = consul;
            this.logger.info("Consul client initialized");
        } catch (error) {
            this.logger.warn("Failed to initialize Consul client", { error: error.message });
            this.consul = null;
        }
    }

    /**
     * Start background monitoring tasks
     */
    startBackgroundTasks() {
        // Health monitoring
        setInterval(() => this.monitorServiceHealth(), this.config.monitoring.healthCheckInterval);

        // Metrics collection
        setInterval(() => this.collectMetrics(), this.config.monitoring.metricsInterval);

        // Cache cleanup
        setInterval(() => this.cleanupCache(), this.config.cache.ttl);
    }

    /**
     * Register a service instance
     */
    async registerService(serviceName, instanceInfo) {
        try {
            const instanceId = uuidv4();
            const serviceInstance = {
                id: instanceId,
                serviceName,
                host: instanceInfo.host || "localhost",
                port: instanceInfo.port || 3000,
                protocol: instanceInfo.protocol || "http",
                path: instanceInfo.path || "/",
                metadata: instanceInfo.metadata || {},
                version: instanceInfo.version || "1.0.0",
                tags: instanceInfo.tags || [],
                registeredAt: new Date().toISOString(),
                lastHeartbeat: new Date().toISOString(),
                status: "healthy",
                weight: instanceInfo.weight || 1,
                zone: instanceInfo.zone || "default",
            };

            // Store in Redis
            const redisKey = `service:${serviceName}:${instanceId}`;
            await this.redis.setex(
                redisKey,
                this.config.cache.ttl,
                JSON.stringify(serviceInstance)
            );

            // Add to service instances set
            await this.redis.sadd(`services:${serviceName}`, instanceId);

            // Store in Consul if available
            if (this.consul) {
                await this.consul.agent.service.register({
                    id: instanceId,
                    name: serviceName,
                    address: serviceInstance.host,
                    port: serviceInstance.port,
                    check: {
                        http: `${serviceInstance.protocol}://${serviceInstance.host}:${serviceInstance.port}${serviceInstance.path}/health`,
                        interval: "10s",
                        timeout: "5s",
                        deregistercriticalserviceafter: "30s",
                    },
                    tags: serviceInstance.tags,
                    meta: serviceInstance.metadata,
                });
            }

            // Update local cache
            this.updateServiceCache(serviceName);

            this.logger.info("Service registered successfully", {
                serviceName,
                instanceId,
                host: serviceInstance.host,
                port: serviceInstance.port,
            });

            return instanceId;
        } catch (error) {
            this.logger.error("Failed to register service", {
                serviceName,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Deregister a service instance
     */
    async deregisterService(serviceName, instanceId) {
        try {
            // Remove from Redis
            const redisKey = `service:${serviceName}:${instanceId}`;
            await this.redis.del(redisKey);
            await this.redis.srem(`services:${serviceName}`, instanceId);

            // Remove from Consul if available
            if (this.consul) {
                await this.consul.agent.service.deregister(instanceId);
            }

            // Update local cache
            this.updateServiceCache(serviceName);

            this.logger.info("Service deregistered successfully", {
                serviceName,
                instanceId,
            });
        } catch (error) {
            this.logger.error("Failed to deregister service", {
                serviceName,
                instanceId,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Get service URL with load balancing
     */
    async getServiceUrl(serviceName, options = {}) {
        try {
            // Check cache first
            const cacheKey = `service-url:${serviceName}`;
            const cached = await this.redis.get(cacheKey);

            if (cached) {
                const cachedData = JSON.parse(cached);
                if (Date.now() - cachedData.timestamp < this.config.cache.ttl) {
                    return cachedData.url;
                }
            }

            // Get healthy service instances
            const instances = await this.getHealthyServiceInstances(serviceName);

            if (instances.length === 0) {
                throw new Error(`No healthy instances found for service: ${serviceName}`);
            }

            // Select instance using load balancing strategy
            const selectedInstance = this.selectInstance(instances, options);

            // Build service URL
            const url = `${selectedInstance.protocol}://${selectedInstance.host}:${selectedInstance.port}${selectedInstance.path}`;

            // Cache the result
            await this.redis.setex(
                cacheKey,
                Math.floor(this.config.cache.ttl / 2),
                JSON.stringify({
                    url,
                    instanceId: selectedInstance.id,
                    timestamp: Date.now(),
                })
            );

            this.logger.debug("Service URL resolved", {
                serviceName,
                url,
                instanceId: selectedInstance.id,
                strategy: this.config.loadBalancing.strategy,
                totalInstances: instances.length,
            });

            return url;
        } catch (error) {
            this.logger.error("Failed to get service URL", {
                serviceName,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    /**
     * Get all healthy service instances
     */
    async getHealthyServiceInstances(serviceName) {
        try {
            // Get instance IDs from Redis
            const instanceIds = await this.redis.smembers(`services:${serviceName}`);

            if (instanceIds.length === 0) {
                return [];
            }

            // Get instance details
            const instanceKeys = instanceIds.map(id => `service:${serviceName}:${id}`);
            const instances = await this.redis.mget(instanceKeys);

            const healthyInstances = instances
                .filter(instance => instance !== null)
                .map(instance => JSON.parse(instance))
                .filter(instance => instance.status === "healthy");

            // Check health of instances from Consul if available
            if (this.consul && this.config.consul.enabled) {
                const consulServices = await this.consul.health.service({
                    service: serviceName,
                    passing: true,
                });

                for (const consulService of consulServices) {
                    const instance = healthyInstances.find(
                        inst => inst.id === consulService.Service.ID
                    );
                    if (instance) {
                        // Verify health status from Consul
                        instance.consulHealthy = consulService.Checks.every(
                            check => check.Status === "passing"
                        );
                    }
                }
            }

            return healthyInstances;
        } catch (error) {
            this.logger.error("Failed to get healthy service instances", {
                serviceName,
                error: error.message,
                stack: error.stack,
            });
            return [];
        }
    }

    /**
     * Select service instance using load balancing strategy
     */
    selectInstance(instances, options = {}) {
        const strategy = options.strategy || this.config.loadBalancing.strategy;

        switch (strategy) {
            case "round-robin":
                return this.roundRobinSelection(instances);

            case "least-connections":
                return this.leastConnectionsSelection(instances);

            case "random":
                return this.randomSelection(instances);

            case "weighted":
                return this.weightedSelection(instances);

            default:
                return this.roundRobinSelection(instances);
        }
    }

    /**
     * Round-robin selection strategy
     */
    roundRobinSelection(instances) {
        const key = "round-robin";
        if (!this.loadBalancers.has(key)) {
            this.loadBalancers.set(key, { index: 0 });
        }

        const balancer = this.loadBalancers.get(key);
        const selectedInstance = instances[balancer.index % instances.length];
        balancer.index++;

        return selectedInstance;
    }

    /**
     * Least connections selection strategy
     */
    leastConnectionsSelection(instances) {
        const key = "least-connections";
        if (!this.loadBalancers.has(key)) {
            this.loadBalancers.set(key, { connections: new Map() });
        }

        const balancer = this.loadBalancers.get(key);
        let selectedInstance = instances[0];
        let minConnections = Infinity;

        for (const instance of instances) {
            const connections = balancer.connections.get(instance.id) || 0;
            if (connections < minConnections) {
                minConnections = connections;
                selectedInstance = instance;
            }
        }

        return selectedInstance;
    }

    /**
     * Random selection strategy
     */
    randomSelection(instances) {
        const randomIndex = Math.floor(Math.random() * instances.length);
        return instances[randomIndex];
    }

    /**
     * Weighted selection strategy
     */
    weightedSelection(instances) {
        const totalWeight = instances.reduce((sum, instance) => sum + (instance.weight || 1), 0);
        let random = Math.random() * totalWeight;

        for (const instance of instances) {
            random -= instance.weight || 1;
            if (random <= 0) {
                return instance;
            }
        }

        return instances[0]; // Fallback
    }

    /**
     * Update service cache
     */
    async updateServiceCache(serviceName) {
        try {
            const instances = await this.getHealthyServiceInstances(serviceName);
            this.serviceCache.set(serviceName, {
                instances,
                lastUpdated: Date.now(),
                count: instances.length,
            });
        } catch (error) {
            this.logger.error("Failed to update service cache", {
                serviceName,
                error: error.message,
            });
        }
    }

    /**
     * Monitor service health
     */
    async monitorServiceHealth() {
        try {
            for (const [serviceName] of this.serviceCache.keys()) {
                const instances = await this.getHealthyServiceInstances(serviceName);

                for (const instance of instances) {
                    try {
                        const isHealthy = await this.performHealthCheck(instance);
                        const previousStatus =
                            this.healthStatus.get(`${serviceName}:${instance.id}`) || "unknown";

                        if (isHealthy !== previousStatus) {
                            // Update status in Redis
                            const redisKey = `service:${serviceName}:${instance.id}`;
                            const updatedInstance = {
                                ...instance,
                                status: isHealthy ? "healthy" : "unhealthy",
                                lastHeartbeat: new Date().toISOString(),
                            };
                            await this.redis.setex(
                                redisKey,
                                this.config.cache.ttl,
                                JSON.stringify(updatedInstance)
                            );

                            this.healthStatus.set(
                                `${serviceName}:${instance.id}`,
                                isHealthy ? "healthy" : "unhealthy"
                            );

                            this.logger.debug("Service health status changed", {
                                serviceName,
                                instanceId: instance.id,
                                status: isHealthy ? "healthy" : "unhealthy",
                            });
                        }
                    } catch (error) {
                        this.logger.warn("Health check failed for instance", {
                            serviceName,
                            instanceId: instance.id,
                            error: error.message,
                        });
                    }
                }
            }
        } catch (error) {
            this.logger.error("Failed to monitor service health", {
                error: error.message,
                stack: error.stack,
            });
        }
    }

    /**
     * Perform health check on a service instance
     */
    async performHealthCheck(instance) {
        try {
            const healthUrl = `${instance.protocol}://${instance.host}:${instance.port}${instance.path}/health`;
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                this.config.monitoring.healthCheckTimeout
            );

            const response = await fetch(healthUrl, {
                method: "GET",
                signal: controller.signal,
                timeout: this.config.monitoring.healthCheckTimeout,
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Collect service discovery metrics
     */
    async collectMetrics() {
        try {
            const metrics = {
                timestamp: new Date().toISOString(),
                services: {},
                redis: {
                    connected: this.redis.status === "ready",
                    memory: await this.redis.info("memory"),
                },
                consul: {
                    connected: this.consul ? true : false,
                    services: this.consul ? await this.consul.catalog.service.list() : [],
                },
            };

            // Collect per-service metrics
            for (const [serviceName] of this.serviceCache.keys()) {
                const instances = await this.getHealthyServiceInstances(serviceName);
                metrics.services[serviceName] = {
                    totalInstances: instances.length,
                    healthyInstances: instances.filter(inst => inst.status === "healthy").length,
                    lastUpdated: this.serviceCache.get(serviceName)?.lastUpdated,
                };
            }

            // Store metrics
            await this.redis.setex("service-discovery:metrics", 300, JSON.stringify(metrics));

            this.logger.debug("Service discovery metrics collected", metrics);
        } catch (error) {
            this.logger.error("Failed to collect metrics", {
                error: error.message,
                stack: error.stack,
            });
        }
    }

    /**
     * Cleanup expired cache entries
     */
    async cleanupCache() {
        try {
            const pattern = "service-url:*";
            const keys = await this.redis.keys(pattern);

            for (const key of keys) {
                const cached = await this.redis.get(key);
                if (cached) {
                    const data = JSON.parse(cached);
                    if (Date.now() - data.timestamp > this.config.cache.ttl) {
                        await this.redis.del(key);
                    }
                }
            }
        } catch (error) {
            this.logger.error("Failed to cleanup cache", {
                error: error.message,
                stack: error.stack,
            });
        }
    }

    /**
     * Get service discovery statistics
     */
    async getStats() {
        try {
            const [metrics, redisInfo] = await Promise.all([
                this.redis.get("service-discovery:metrics"),
                this.redis.info("memory"),
            ]);

            return {
                services: this.serviceCache.size,
                healthChecks: this.healthStatus.size,
                cache: this.serviceCache,
                metrics: metrics ? JSON.parse(metrics) : null,
                redis: redisInfo,
                config: this.config,
                uptime: process.uptime(),
            };
        } catch (error) {
            this.logger.error("Failed to get service discovery stats", {
                error: error.message,
                stack: error.stack,
            });
            return null;
        }
    }

    /**
     * Get all registered services
     */
    async getAllServices() {
        const services = {};

        for (const [serviceName] of this.serviceCache.keys()) {
            services[serviceName] = await this.getHealthyServiceInstances(serviceName);
        }

        return services;
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info("Shutting down service discovery...");

        if (this.redis) {
            await this.redis.quit();
        }

        if (this.consul) {
            // Consul cleanup would go here
        }

        this.logger.info("Service discovery shut down completed");
    }
}

module.exports = ServiceDiscovery;
