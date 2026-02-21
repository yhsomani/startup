/**
 * Service Registry Implementation
 * 
 * Handles service discovery, registration, and health monitoring
 * for microservices communication
 */

import { createLogger, type Logger } from './logger.js';
import type { MetricsCollector } from './metrics.js';

export interface ServiceInstance {
  /** Service instance ID */
  instanceId: string;
  /** Service name */
  serviceName: string;
  /** Service URL */
  url: string;
  /** Service host */
  host: string;
  /** Service port */
  port: number;
  /** Service health status */
  health: 'healthy' | 'unhealthy' | 'unknown';
  /** Last health check timestamp */
  lastHealthCheck: Date;
  /** Service metadata */
  metadata?: Record<string, any>;
  /** Service version */
  version?: string;
  /** Service region */
  region?: string;
  /** Service load metrics */
  load?: {
    requestsPerSecond: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

export interface ServiceRegistryConfig {
  /** Health check interval in milliseconds */
  healthCheckInterval?: number;
  /** Service timeout in milliseconds */
  serviceTimeout?: number;
  /** Unhealthy threshold (consecutive failures) */
  unhealthyThreshold?: number;
  /** Load balancing strategy */
  loadBalancingStrategy?: 'round-robin' | 'random' | 'least-connections';
  /** Enable service metrics */
  enableMetrics?: boolean;
}

/**
 * Service Registry for service discovery and load balancing
 */
export class ServiceRegistry {
  private readonly services: Map<string, ServiceInstance[]> = new Map();
  private readonly serviceCounters: Map<string, number> = new Map();
  private readonly logger: Logger;
  private readonly config: Required<ServiceRegistryConfig>;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(
    private readonly metrics: MetricsCollector,
    config: ServiceRegistryConfig = {}
  ) {
    this.logger = createLogger('ServiceRegistry');
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      serviceTimeout: 5000, // 5 seconds
      unhealthyThreshold: 3,
      loadBalancingStrategy: 'round-robin',
      enableMetrics: true,
      ...config
    };

    this.startHealthCheckTimer();
  }

  /**
   * Register a service instance
   */
  async registerService(serviceInstance: Omit<ServiceInstance, 'instanceId' | 'lastHealthCheck'>): Promise<string> {
    const instanceId = `${serviceInstance.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullInstance: ServiceInstance = {
      ...serviceInstance,
      instanceId,
      lastHealthCheck: new Date(),
      health: 'unknown'
    };

    if (!this.services.has(serviceInstance.serviceName)) {
      this.services.set(serviceInstance.serviceName, []);
      this.serviceCounters.set(serviceInstance.serviceName, 0);
    }

    const instances = this.services.get(serviceInstance.serviceName)!;
    
    // Check if instance already exists (by URL)
    const existingIndex = instances.findIndex(i => i.url === serviceInstance.url);
    if (existingIndex >= 0) {
      instances[existingIndex] = fullInstance;
      this.logger.info('Service instance updated', { 
        serviceName: serviceInstance.serviceName, 
        instanceId,
        url: serviceInstance.url 
      });
    } else {
      instances.push(fullInstance);
      this.logger.info('Service instance registered', { 
        serviceName: serviceInstance.serviceName, 
        instanceId,
        url: serviceInstance.url 
      });
    }

    if (this.config.enableMetrics) {
      this.metrics.incrementCounter('service.registry.registrations.total', {
        service: serviceInstance.serviceName
      });
      this.metrics.gauge('service.registry.instances.total', instances.length, {
        service: serviceInstance.serviceName
      });
    }

    return instanceId;
  }

  /**
   * Unregister a service instance
   */
  async unregisterService(serviceName: string, instanceId: string): Promise<boolean> {
    const instances = this.services.get(serviceName);
    if (!instances) {
      return false;
    }

    const initialLength = instances.length;
    const filteredInstances = instances.filter(instance => instance.instanceId !== instanceId);
    
    if (filteredInstances.length === initialLength) {
      return false;
    }

    this.services.set(serviceName, filteredInstances);

    if (this.config.enableMetrics) {
      this.metrics.incrementCounter('service.registry.unregistrations.total', {
        service: serviceName
      });
      this.metrics.gauge('service.registry.instances.total', filteredInstances.length, {
        service: serviceName
      });
    }

    this.logger.info('Service instance unregistered', { serviceName, instanceId });

    return true;
  }

  /**
   * Get a service instance using load balancing
   */
  async getService(serviceName: string): Promise<ServiceInstance> {
    const instances = this.services.get(serviceName);
    
    if (!instances || instances.length === 0) {
      throw new Error(`No instances found for service: ${serviceName}`);
    }

    // Filter only healthy instances
    const healthyInstances = instances.filter(instance => instance.health === 'healthy');
    
    if (healthyInstances.length === 0) {
      throw new Error(`No healthy instances found for service: ${serviceName}`);
    }

    const selectedInstance = this.selectInstance(healthyInstances, serviceName);

    if (this.config.enableMetrics) {
      this.metrics.incrementCounter('service.registry.requests.total', {
        service: serviceName,
        strategy: this.config.loadBalancingStrategy
      });
    }

    return selectedInstance;
  }

  /**
   * Get all instances for a service
   */
  async getAllServiceInstances(serviceName: string): Promise<ServiceInstance[]> {
    const instances = this.services.get(serviceName) || [];
    return [...instances];
  }

  /**
   * Get all registered services
   */
  async getAllServices(): Promise<Record<string, ServiceInstance[]>> {
    const result: Record<string, ServiceInstance[]> = {};
    
    this.services.forEach((instances, serviceName) => {
      result[serviceName] = [...instances];
    });

    return result;
  }

  /**
   * Update service health status
   */
  async updateServiceHealth(serviceName: string, instanceId: string, health: ServiceInstance['health']): Promise<boolean> {
    const instances = this.services.get(serviceName);
    if (!instances) {
      return false;
    }

    const instance = instances.find(i => i.instanceId === instanceId);
    if (!instance) {
      return false;
    }

    const previousHealth = instance.health;
    instance.health = health;
    instance.lastHealthCheck = new Date();

    if (this.config.enableMetrics) {
      this.metrics.gauge('service.health', health === 'healthy' ? 1 : 0, {
        service: serviceName,
        instanceId
      });

      if (previousHealth !== health) {
        this.metrics.incrementCounter('service.health.changes.total', {
          service: serviceName,
          from: previousHealth,
          to: health
        });
      }
    }

    this.logger.debug('Service health updated', {
      serviceName,
      instanceId,
      health,
      previousHealth
    });

    return true;
  }

  /**
   * Update service load metrics
   */
  async updateServiceLoad(serviceName: string, instanceId: string, load: ServiceInstance['load']): Promise<boolean> {
    const instances = this.services.get(serviceName);
    if (!instances) {
      return false;
    }

    const instance = instances.find(i => i.instanceId === instanceId);
    if (!instance) {
      return false;
    }

    instance.load = load;

    if (this.config.enableMetrics) {
      this.metrics.gauge('service.load.requests_per_second', load.requestsPerSecond, {
        service: serviceName,
        instanceId
      });
      this.metrics.gauge('service.load.cpu_usage', load.cpuUsage, {
        service: serviceName,
        instanceId
      });
      this.metrics.gauge('service.load.memory_usage', load.memoryUsage, {
        service: serviceName,
        instanceId
      });
    }

    return true;
  }

  /**
   * Select instance based on load balancing strategy
   */
  private selectInstance(instances: ServiceInstance[], serviceName: string): ServiceInstance {
    switch (this.config.loadBalancingStrategy) {
      case 'random':
        return instances[Math.floor(Math.random() * instances.length)];

      case 'least-connections':
        return instances.reduce((least, current) => 
          (current.load?.requestsPerSecond || 0) < (least.load?.requestsPerSecond || 0) ? current : least
        );

      case 'round-robin':
      default:
        const counter = this.serviceCounters.get(serviceName) || 0;
        const selectedIndex = counter % instances.length;
        this.serviceCounters.set(serviceName, counter + 1);
        return instances[selectedIndex];
    }
  }

  /**
   * Start health check timer
   */
  private startHealthCheckTimer(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);

    this.logger.info('Health check timer started', {
      interval: this.config.healthCheckInterval
    });
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises: Promise<void>[] = [];

    this.services.forEach((instances, serviceName) => {
      instances.forEach(instance => {
        healthCheckPromises.push(this.checkServiceHealth(serviceName, instance));
      });
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of a specific service instance
   */
  private async checkServiceHealth(serviceName: string, instance: ServiceInstance): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.serviceTimeout);

      const response = await fetch(`${instance.url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ServiceRegistry/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await this.updateServiceHealth(serviceName, instance.instanceId, 'healthy');
      } else {
        await this.updateServiceHealth(serviceName, instance.instanceId, 'unhealthy');
      }

    } catch (error) {
      await this.updateServiceHealth(serviceName, instance.instanceId, 'unhealthy');
      
      this.logger.debug('Health check failed', {
        serviceName,
        instanceId: instance.instanceId,
        error: error.message
      });
    }
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalServices: number;
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
    services: Record<string, {
      instances: number;
      healthy: number;
      unhealthy: number;
    }>;
  } {
    const stats = {
      totalServices: this.services.size,
      totalInstances: 0,
      healthyInstances: 0,
      unhealthyInstances: 0,
      services: {} as Record<string, { instances: number; healthy: number; unhealthy: number }>
    };

    this.services.forEach((instances, serviceName) => {
      const healthy = instances.filter(i => i.health === 'healthy').length;
      const unhealthy = instances.filter(i => i.health === 'unhealthy').length;

      stats.totalInstances += instances.length;
      stats.healthyInstances += healthy;
      stats.unhealthyInstances += unhealthy;

      stats.services[serviceName] = {
        instances: instances.length,
        healthy,
        unhealthy
      };
    });

    return stats;
  }

  /**
   * Cleanup unhealthy instances
   */
  async cleanupUnhealthyInstances(): Promise<number> {
    let removedCount = 0;
    const now = new Date();
    const unhealthyThreshold = this.config.unhealthyThreshold * this.config.healthCheckInterval;

    for (const [serviceName, instances] of this.services.entries()) {
      const filteredInstances = instances.filter(instance => {
        const timeSinceLastCheck = now.getTime() - instance.lastHealthCheck.getTime();
        
        // Remove instances that have been unhealthy for too long
        if (instance.health === 'unhealthy' && timeSinceLastCheck > unhealthyThreshold) {
          this.logger.info('Removing unhealthy service instance', {
            serviceName,
            instanceId: instance.instanceId,
            unhealthyDuration: timeSinceLastCheck
          });
          removedCount++;
          return false;
        }

        return true;
      });

      this.services.set(serviceName, filteredInstances);
    }

    if (removedCount > 0 && this.config.enableMetrics) {
      this.metrics.incrementCounter('service.registry.cleanup.total', {
        removed: removedCount.toString()
      });
    }

    return removedCount;
  }

  /**
   * Shutdown the service registry
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    this.services.clear();
    this.serviceCounters.clear();

    this.logger.info('Service registry shutdown complete');
  }
}