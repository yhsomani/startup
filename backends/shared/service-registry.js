/**
 * Service Registry for TalentSphere Platform
 *
 * Centralized service discovery and health monitoring
 * Provides automatic service registration, health checks, and load balancing
 */

const { createLogger } = require("../../shared/enhanced-logger");
const EventEmitter = require("events");

class ServiceRegistry extends EventEmitter {
    constructor(serviceName, options = {}) {
        super();
        this.serviceName = serviceName;
        this.logger = createLogger("ServiceRegistry");

        this.options = {
            port: options.port || 3000,
            version: options.version || "1.0.0",
            healthCheckPath: options.healthCheckPath || "/health",
            metricsPath: options.metricsPath || "/metrics",
            heartbeatInterval: options.heartbeatInterval || 30000, // 30 seconds
            healthCheckTimeout: options.healthCheckTimeout || 5000, // 5 seconds
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 2000, // 2 seconds
            ...options,
        };

        this.services = new Map();
        this.healthStatus = new Map();
        this.metrics = {
            registrationCount: 0,
            healthChecksPerformed: 0,
            healthChecksPassed: 0,
            healthChecksFailed: 0,
            lastHealthCheck: null,
        };

        this.heartbeatInterval = null;
        this.isRunning = false;

        this.logger.info(`Service Registry initialized for ${serviceName}`, {
            options: this.options,
        });
    }

    /**
     * Register a service
     */
    async register(serviceInfo) {
        const {
            name,
            version,
            host = "localhost",
            port,
            protocol = "http",
            healthCheckPath = "/health",
            metadata = {},
        } = serviceInfo;

        const serviceId = `${name}:${host}:${port}`;

        const service = {
            id: serviceId,
            name,
            version,
            host,
            port,
            protocol,
            url: `${protocol}://${host}:${port}`,
            healthCheckUrl: `${protocol}://${host}:${port}${healthCheckPath}`,
            status: "registering",
            registeredAt: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            metadata,
            healthChecks: {
                total: 0,
                passed: 0,
                failed: 0,
                lastCheck: null,
                lastResult: null,
            },
        };

        try {
            // Verify service is reachable
            await this.performHealthCheck(service);
            service.status = "healthy";

            this.services.set(serviceId, service);
            this.healthStatus.set(serviceId, {
                status: "healthy",
                lastCheck: new Date().toISOString(),
                lastResult: "success",
            });

            this.metrics.registrationCount++;
            this.metrics.healthChecksPerformed++;
            this.metrics.healthChecksPassed++;

            this.logger.info(`Service registered successfully`, {
                serviceId,
                name,
                url: service.url,
                version,
            });

            this.emit("serviceRegistered", service);

            return {
                success: true,
                service,
                message: "Service registered successfully",
            };
        } catch (error) {
            service.status = "unhealthy";
            this.services.set(serviceId, service);

            this.logger.error(`Service registration failed - unhealthy`, {
                serviceId,
                error: error.message,
            });

            this.emit("serviceRegistrationFailed", service, error);

            return {
                success: false,
                service,
                error: error.message,
                message: "Service registered but unhealthy",
            };
        }
    }

    /**
     * Unregister a service
     */
    async unregister(serviceId) {
        const service = this.services.get(serviceId);

        if (!service) {
            this.logger.warn(`Service not found for unregistration`, { serviceId });
            return false;
        }

        this.services.delete(serviceId);
        this.healthStatus.delete(serviceId);

        this.logger.info(`Service unregistered`, {
            serviceId,
            name: service.name,
        });

        this.emit("serviceUnregistered", service);

        return true;
    }

    /**
     * Get all registered services
     */
    getAllServices() {
        return Array.from(this.services.values());
    }

    /**
     * Get services by name
     */
    getServicesByName(name) {
        return Array.from(this.services.values()).filter(service => service.name === name);
    }

    /**
     * Get healthy services
     */
    getHealthyServices() {
        return Array.from(this.services.values()).filter(service => {
            const health = this.healthStatus.get(service.id);
            return health && health.status === "healthy";
        });
    }

    /**
     * Get service by ID
     */
    getService(serviceId) {
        return this.services.get(serviceId);
    }

    /**
     * Perform health check on a service
     */
    async performHealthCheck(service) {
        const startTime = Date.now();

        try {
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () => reject(new Error("Health check timeout")),
                    this.options.healthCheckTimeout
                );
            });

            // Create fetch promise
            const fetchPromise = this.makeHealthCheckRequest(service.healthCheckUrl);

            // Race between fetch and timeout
            const result = await Promise.race([fetchPromise, timeoutPromise]);

            const duration = Date.now() - startTime;

            // Update service health metrics
            service.healthChecks.total++;
            service.healthChecks.lastCheck = new Date().toISOString();
            service.healthChecks.lastResult = "success";
            service.healthChecks.passed++;
            service.healthChecks.duration = duration;

            // Update global health status
            this.healthStatus.set(service.id, {
                status: "healthy",
                lastCheck: new Date().toISOString(),
                lastResult: "success",
                duration,
            });

            this.metrics.healthChecksPerformed++;
            this.metrics.healthChecksPassed++;
            this.metrics.lastHealthCheck = new Date().toISOString();

            this.logger.debug(`Health check passed for ${service.name}`, {
                serviceId: service.id,
                duration: `${duration}ms`,
            });

            this.emit("healthCheckPassed", service);

            return {
                status: "healthy",
                duration,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            // Update service health metrics
            service.healthChecks.total++;
            service.healthChecks.lastCheck = new Date().toISOString();
            service.healthChecks.lastResult = "failed";
            service.healthChecks.failed++;
            service.healthChecks.duration = duration;
            service.healthChecks.error = error.message;

            // Update global health status
            this.healthStatus.set(service.id, {
                status: "unhealthy",
                lastCheck: new Date().toISOString(),
                lastResult: "failed",
                duration,
                error: error.message,
            });

            this.metrics.healthChecksPerformed++;
            this.metrics.healthChecksFailed++;
            this.metrics.lastHealthCheck = new Date().toISOString();

            this.logger.warn(`Health check failed for ${service.name}`, {
                serviceId: service.id,
                error: error.message,
                duration: `${duration}ms`,
            });

            this.emit("healthCheckFailed", service, error);

            return {
                status: "unhealthy",
                error: error.message,
                duration,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Make HTTP health check request
     */
    makeHealthCheckRequest(url) {
        const nodeFetch = require("node-fetch");

        return nodeFetch(url, {
            method: "GET",
            timeout: this.options.healthCheckTimeout,
            headers: {
                "User-Agent": `TalentSphere-ServiceRegistry/${this.options.version}`,
                "X-Health-Check": "true",
            },
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
    }

    /**
     * Start health monitoring for all services
     */
    startHealthMonitoring() {
        if (this.isRunning) {
            this.logger.warn("Health monitoring already running");
            return;
        }

        this.isRunning = true;
        this.logger.info("Starting health monitoring", {
            interval: this.options.heartbeatInterval,
        });

        // Initial health check for all services
        this.performAllHealthChecks();

        // Set up recurring health checks
        this.heartbeatInterval = setInterval(() => {
            this.performAllHealthChecks();
        }, this.options.heartbeatInterval);

        this.emit("healthMonitoringStarted");
    }

    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        this.logger.info("Health monitoring stopped");
        this.emit("healthMonitoringStopped");
    }

    /**
     * Perform health checks on all services
     */
    async performAllHealthChecks() {
        const services = Array.from(this.services.values());

        if (services.length === 0) {
            return;
        }

        const healthCheckPromises = services.map(service =>
            this.performHealthCheck(service).catch(error => ({
                service,
                error: error.message,
            }))
        );

        const results = await Promise.allSettled(healthCheckPromises);

        const healthyCount = results.filter(
            result => result.status === "fulfilled" && result.value.status === "healthy"
        ).length;

        const unhealthyCount = results.length - healthyCount;

        this.logger.info(`Health checks completed`, {
            totalServices: services.length,
            healthy: healthyCount,
            unhealthy: unhealthyCount,
        });

        this.emit("healthChecksCompleted", {
            total: services.length,
            healthy: healthyCount,
            unhealthy: unhealthyCount,
            results,
        });
    }

    /**
     * Get service URL for load balancing
     */
    getServiceUrl(serviceName, strategy = "round-robin") {
        const services = this.getHealthyServices().filter(service => service.name === serviceName);

        if (services.length === 0) {
            throw new Error(`No healthy services found for ${serviceName}`);
        }

        switch (strategy) {
            case "random":
                return services[Math.floor(Math.random() * services.length)].url;

            case "round-robin":
                const currentIndex = this.getServiceIndex(serviceName) || 0;
                const nextIndex = currentIndex % services.length;
                this.setServiceIndex(serviceName, nextIndex);
                return services[nextIndex].url;

            case "least-connections":
                return services.reduce((least, current) =>
                    (current.metadata.connections || 0) < (least.metadata.connections || 0)
                        ? current
                        : least
                ).url;

            default:
                return services[0].url;
        }
    }

    /**
     * Get and update service index for round-robin
     */
    getServiceIndex(serviceName) {
        return this.roundRobinIndexes ? this.roundRobinIndexes.get(serviceName) : 0;
    }

    setServiceIndex(serviceName, index) {
        if (!this.roundRobinIndexes) {
            this.roundRobinIndexes = new Map();
        }
        this.roundRobinIndexes.set(serviceName, index);
    }

    /**
     * Get registry metrics
     */
    getMetrics() {
        const services = Array.from(this.services.values());

        return {
            ...this.metrics,
            totalServices: services.length,
            healthyServices: services.filter(s => {
                const health = this.healthStatus.get(s.id);
                return health && health.status === "healthy";
            }).length,
            unhealthyServices: services.filter(s => {
                const health = this.healthStatus.get(s.id);
                return health && health.status === "unhealthy";
            }).length,
            services: services.map(service => ({
                id: service.id,
                name: service.name,
                version: service.version,
                status: service.status,
                url: service.url,
                registeredAt: service.registeredAt,
                healthChecks: service.healthChecks,
            })),
            isMonitoring: this.isRunning,
            uptime: this.isRunning ? Date.now() - this.startTime : 0,
        };
    }

    /**
     * Perform registry health check
     */
    async healthCheck() {
        const metrics = this.getMetrics();

        return {
            status: metrics.healthyServices > 0 ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            uptime: metrics.uptime,
            services: {
                total: metrics.totalServices,
                healthy: metrics.healthyServices,
                unhealthy: metrics.unhealthyServices,
            },
            metrics,
            version: this.options.version,
        };
    }

    /**
     * Get registry configuration
     */
    getConfiguration() {
        return {
            serviceName: this.serviceName,
            options: this.options,
            metrics: this.getMetrics(),
            isMonitoring: this.isRunning,
        };
    }
}

module.exports = ServiceRegistry;
