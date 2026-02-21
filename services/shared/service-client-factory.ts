/**
 * Service Client Factory
 * 
 * Centralized factory for creating and managing service clients.
 * Provides singleton instances and shared configuration.
 */

import { ServiceClient, type ServiceClientConfig } from './service-client.js';
import { type ServiceRegistry } from './service-registry.js';
import { type MetricsCollector } from './metrics.js';
import { createLogger, type Logger } from './logger.js';

export interface ServiceClientFactoryConfig {
  /** Default circuit breaker configuration */
  defaultCircuitBreaker?: {
    timeout?: number;
    resetTimeout?: number;
    monitoringPeriod?: number;
    threshold?: number;
  };
  /** Default retry configuration */
  defaultRetry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  };
  /** Default timeout */
  defaultTimeout?: number;
  /** Whether to enable distributed tracing */
  enableTracing?: boolean;
}

/**
 * Factory for creating and managing service clients
 */
export class ServiceClientFactory {
  private static instance: ServiceClientFactory;
  private readonly clients: Map<string, ServiceClient> = new Map();
  private readonly logger: Logger;
  private readonly config: Required<ServiceClientFactoryConfig>;

  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly tracing: any,
    private readonly metrics: MetricsCollector,
    config: ServiceClientFactoryConfig = {}
  ) {
    this.logger = createLogger('ServiceClientFactory');
    this.config = {
      defaultCircuitBreaker: {
        timeout: 30000,
        resetTimeout: 60000,
        monitoringPeriod: 10000,
        threshold: 5,
        ...config.defaultCircuitBreaker
      },
      defaultRetry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
        ...config.defaultRetry
      },
      defaultTimeout: 30000,
      enableTracing: true,
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(
    serviceRegistry: ServiceRegistry,
    tracing: any,
    metrics: MetricsCollector,
    config?: ServiceClientFactoryConfig
  ): ServiceClientFactory {
    if (!ServiceClientFactory.instance) {
      ServiceClientFactory.instance = new ServiceClientFactory(
        serviceRegistry,
        tracing,
        metrics,
        config
      );
    }
    return ServiceClientFactory.instance;
  }

  /**
   * Create or get service client
   */
  createClient(serviceName: string, config?: Partial<ServiceClientConfig>): ServiceClient {
    if (this.clients.has(serviceName)) {
      return this.clients.get(serviceName)!;
    }

    const clientConfig: ServiceClientConfig = {
      serviceName,
      circuitBreaker: this.config.defaultCircuitBreaker,
      retry: this.config.defaultRetry,
      timeout: this.config.defaultTimeout,
      enableCompression: true,
      headers: {},
      ...config
    };

    const client = new ServiceClient(clientConfig, this.serviceRegistry, this.tracing, this.metrics);
    
    this.clients.set(serviceName, client);
    
    this.logger.info('Service client created', { serviceName });
    
    return client;
  }

  /**
   * Get existing client
   */
  getClient(serviceName: string): ServiceClient | undefined {
    return this.clients.get(serviceName);
  }

  /**
   * Get all clients
   */
  getAllClients(): Map<string, ServiceClient> {
    return new Map(this.clients);
  }

  /**
   * Remove client
   */
  removeClient(serviceName: string): boolean {
    const removed = this.clients.delete(serviceName);
    if (removed) {
      this.logger.info('Service client removed', { serviceName });
    }
    return removed;
  }

  /**
   * Get health status of all clients
   */
  getHealthStatus(): Record<string, any> {
    const health: Record<string, any> = {};

    this.clients.forEach((client, serviceName) => {
      const circuitBreakerStates = client.getCircuitBreakerStates();
      const status = {
        serviceName,
        circuitBreakers: circuitBreakerStates,
        totalCircuitBreakers: Object.keys(circuitBreakerStates).length,
        openCircuitBreakers: Object.values(circuitBreakerStates)
          .filter(state => state.state === 'OPEN').length
      };
      
      health[serviceName] = status;
    });

    return health;
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.clients.forEach((client, serviceName) => {
      const circuitBreakerStates = client.getCircuitBreakerStates();
      Object.keys(circuitBreakerStates).forEach(targetService => {
        client.resetCircuitBreaker(targetService);
      });
    });

    this.logger.info('All circuit breakers reset');
  }

  /**
   * Shutdown all clients
   */
  async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.clients.entries()).map(
      async ([serviceName, client]) => {
        try {
          // Add any cleanup logic for the client here
          this.logger.info('Shutting down client', { serviceName });
        } catch (error) {
          this.logger.error('Error shutting down client', {
            serviceName,
            error: error.message
          });
        }
      }
    );

    await Promise.allSettled(shutdownPromises);
    this.clients.clear();

    this.logger.info('Service client factory shutdown complete');
  }
}