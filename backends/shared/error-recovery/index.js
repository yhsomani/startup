/**
 * Error Recovery and Circuit Breaker Implementation
 * Comprehensive error recovery with circuit breakers for service resilience
 */

const EventEmitter = require('events');

// =============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// =============================================================================

/**
 * Circuit breaker with configurable options
 */
class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.options = {
      timeout: options.timeout || 30000,
      maxFailures: options.maxFailures || 5,
      resetTimeout: options.resetTimeout || 60000,
      monitoringPeriod: options.monitoringPeriod || 120000,
      halfOpenMaxCalls: options.halfOpenMaxCalls || 3,
      successThreshold: options.successThreshold || 10,
      failureThreshold: options.failureThreshold || 5,
      ...options
    };
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
    this.requestCount = 0;
    this.stats = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      timeouts: 0,
      circuitBreakerTrips: 0,
      averageResponseTime: 0
      failureRate: 0
    };
    
    this.events = [];
    this.startTime = Date.now();
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn, ...args) {
    const requestStart = Date.now();
    this.requestCount++;

    try {
      // Check circuit state
      if (this.state === 'OPEN') {
        if (Date.now() >= this.nextAttempt) {
          this.state = 'HALF_OPEN';
        } else {
          throw new Error(`Circuit breaker OPEN for ${this.serviceName}`);
        }
      }

        this.events.push({
          type: 'BLOCKED',
          timestamp: new Date().toISOString(),
          message: `Request blocked by circuit breaker for ${this.serviceName}`
        });

        throw new Error(`Circuit breaker OPEN for ${this.serviceName}`);
      }

      // Execute with timeout
      const result = await Promise.race([
        fn(...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout'), this.options.timeout)
        )
      ]);

      const responseTime = Date.now() - requestStart;
      this.stats.averageResponseTime = 
        ((this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;
      
      this.onSuccess(responseTime);

      return result;
    } catch (error) {
      const responseTime = Date.now() - requestStart;
      this.onFailure(error, responseTime);
      throw error;
    }
  }

  /**
   * Called on successful request
   */
  onSuccess(responseTime) {
    this.failureCount = 0;
    this.successCount++;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    this.stats.successCount++;
    this.stats.totalRequests++;
    this.stats.averageResponseTime = 
      ((this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests);
    
    this.events.push({
      type: 'SUCCESS',
      timestamp: new Date().toISOString(),
      responseTime,
      message: `Request succeeded for ${this.serviceName}`
    });

    // Emit success event
    this.emit('success', {
      serviceName: this.serviceName,
      responseTime,
      stats: this.getStats()
    });
  }

  /**
   * Called on failed request
   */
  onFailure(error, responseTime) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.stats.errorCount++;
    this.stats.totalRequests++;
    this.stats.averageResponseTime = 
      ((this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests);
    
    const failureRate = (this.failureCount / this.requestCount) * 100;
    
    this.events.push({
      type: 'FAILURE',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime,
      failureRate,
      message: `Request failed for ${this.serviceName}: ${error.message}`
    });

    // Check if circuit should open
    if (this.failureCount >= this.options.maxFailures) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    } else if (failureRate >= this.options.failureThreshold) {
      this.state = 'HALF_OPEN';
      this.nextAttempt = Date.now() + this.options.monitoringPeriod;
    }

    // Emit failure event
    this.emit('failure', {
      serviceName: this.serviceName,
      error: error.message,
      responseTime,
      failureRate,
      stats: this.getStats()
    });
  }

  /**
   * Get current circuit state and statistics
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.stats.successCount,
      requestCount: this.requestCount,
      stats: this.getStats(),
      events: this.events.slice(-10) // Last 10 events
    };
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const uptime = Date.now() - this.startTime;
    const failureRate = this.requestCount > 0 ? (this.stats.errorCount / this.requestCount) * 100 : 0;
    
    return {
      state: this.state,
      uptime,
      requestCount: this.requestCount,
      successCount: this.stats.successCount,
      errorCount: this.errorsCount,
      timeouts: this.stats.timeouts,
      circuitBreakerTrips: this.stats.circuitBreakerTrips,
      averageResponseTime: this.stats.averageResponseTime,
      failureRate,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      configuration: this.options
    };
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
    this.requestCount = 0;
    this.stats = {
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      timeouts: 0,
      circuitBreakerTrips: 0,
      averageResponseTime: 0,
      failureRate: 0
    };
    
    this.events = [];
    this.startTime = Date.now();
  }

  /**
   * Force open circuit breaker
   */
  forceOpen(duration = 60000) {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + duration;
  }

  /**
   * Force close circuit breaker
   */
  forceClose() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }
  }

  /**
   * Get event history
   */
  getEvents(limit = 100) {
    return this.events.slice(-limit);
  }
  }
}

// =============================================================================
// ERROR RECOVERY STRATEGIES
// =============================================================================

/**
 * Error recovery strategies
 */
class ErrorRecoveryStrategies {
  constructor() {
    this.strategies = new Map();
    this.defaultStrategy = 'retry';
    this.setupDefaultStrategies();
  }

  setupDefaultStrategies() {
    // Timeout errors
    this.strategies.set('timeout', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    });

    // Connection errors
    this.strategies.set('connection', {
      maxRetries: 5,
      baseDelay: 500,
      maxDelay: 30000,
      backoffMultiplier: 2
    });

    // Rate limiting errors
    this.strategies.set('rate_limit', {
      baseDelay: 5000,
      maxRetries: 2,
      backoffMultiplier: 3
    });

    // Service unavailable errors
    this.strategies.set('service_unavailable', {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      fallBackTo: 'cache'
    });

    // Database errors
    this.strategies.set('database', {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 10000,
      maxDelay: 30000,
      backoffMultiplier: 2
    });

    // Validation errors
    this.strategies.set('validation', {
      maxRetries: 1,
      baseDelay: 500,
      maxDelay: 5000,
      maxDelay: 30000
    });
  }

    // Network errors
    this.strategies.set('network', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      maxDelay: 30000,
      backoffMultiplier: 2
    });
  }

    // 500 Internal server errors
    this.strategies.set('500_error', {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 10000,
      maxDelay: 30000,
      backoffMultiplier: 3,
      fallBackTo: 'degraded_service'
    });
  }

    // 503 Service Unavailable
    this.strategies.set('503_error', {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 30000,
      maxDelay: 30000,
      fallBackTo: 'cache'
    });
  }

    // 504 Gateway Timeout
    this.strategies.set('504_error', {
      maxRetries: 1,
      baseDelay: 5000,
      maxDelay: 30000,
      fallBackTo: 'degraded_service'
    });
  }

    // Default fallback
    this.strategies.set('default', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      fallBackTo: 'error_response'
    });
  }

    /**
     * Add custom recovery strategy
     */
    addStrategy(name, strategy) {
      this.strategies.set(name, strategy);
    }

    /**
     * Get recovery strategy for error
     */
    getStrategy(error) {
      const errorType = this.getErrorType(error);
      return this.strategies.get(errorType) || this.defaultStrategy;
    }

    /**
     * Execute function with error recovery
     */
    async executeWithRecovery(fn, options = {}) {
      const strategy = options.strategy || this.defaultStrategy;
      const maxRetries = options.maxRetries || strategy.maxRetries || 3;
      
      let attempt = 0;
      let lastError;
      
      while (attempt < maxRetries) {
        try {
          const result = await fn();
          return { success: true, data: result };
        } catch (error) {
          lastError = error;
          attempt++;
          
          if (attempt >= maxRetries) {
            console.error(`Failed after ${maxRetries} attempts for ${options.operation || 'unknown operation'}: ${error.message}`);
            return { success: false, error };
          }

          const delay = this.calculateDelay(strategy, attempt);
          if (delay > 0) {
            await this.sleep(delay);
          }
        }
      }
      
      return { success: false, error };
    }

    /**
     * Calculate delay based on strategy
     */
    calculateDelay(strategy, attempt) {
      const baseDelay = strategy.baseDelay || 1000;
      const maxDelay = strategy.maxDelay || 30000;
      const multiplier = strategy.backoffMultiplier || 2;
      
      const delay = Math.min(
        baseDelay * Math.pow(multiplier, attempt - 1),
        maxDelay
      );
      
      return delay;
    }

    /**
     * Sleep for specified duration
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
}

// =============================================================================
// RETRY IMPLEMENTATION
// =============================================================================

/**
 * Retry utility with exponential backoff
 */
class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.defaultStrategy = 'exponential_backoff';
    this.jitter = options.jitter || false;
  }

  /**
   * Execute function with retry logic
   */
  async execute(fn, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      try {
        const result = await fn();
        return { success: true, data: result };
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt >= maxRetries) {
          console.error(`Failed after ${maxRetries} attempts:`, error.message);
          return { success: false, error };
        }

        const delay = this.calculateDelay(attempt);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    return { success: false, error };
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateDelay(attempt) {
    const delay = Math.min(
      this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1),
      this.maxDelay
    );
    
    return delay;
  }

    /**
   * Sleep for specified duration
   */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
}

// =============================================================================
// GRACEFUL DEGRADATION
// =============================================================================

/**
 * Graceful degradation manager
 */
class GracefulDegradation {
  constructor() {
    this.degradedServices = new Set();
    this.fallbackResponses = new Map();
    this.degradationStrategies = new Map();
    
    this.setupDefaultStrategies();
  }

  setupDefaultStrategies() {
      // Service degradation strategies
      this.degradationStrategies.set('auth', {
        fallBackTo: 'cache',
        fallbackResponse: {
          success: true,
          data: {
            isAuthenticated: false,
            requiresVerification: true
          },
          message: 'Authentication service temporarily unavailable - using fallback mode'
        }
      });

      this.degradationStrategies.set('courses', {
        fallBackTo: 'cache',
        fallbackResponse: {
          success: true,
          data: {
            courses: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          },
          message: 'Courses service temporarily unavailable - showing cached data'
        }
      });

      this.degradationStrategies.set('challenges', {
        fallBackTo: 'cache',
        fallbackResponse: {
          success: {
            challenges: [],
            pagination: {
              page: 1,
              limit: 20,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          },
          message: 'Challenges service temporarily unavailable - showing cached data'
        }
      });

      this.degradationStrategies.push('progress', {
        fallBackTo: 'cache',
        fallbackResponse: {
          success: true,
          data: {
            progress: {},
            achievements: []
          },
          message: 'Progress tracking temporarily unavailable'
        }
      });

      this.degradationStrategies.push('notifications', {
        fallBackTo: 'cache',
        fallbackResponse: {
          success: true,
          data: { notifications: [] },
          message: 'Notifications temporarily unavailable'
        }
      });
    }
  }

  /**
     * Register service for degradation
     */
    registerService(serviceName, strategy) {
      this.degradedServices.add(serviceName);
      this.fallbackResponses.set(serviceName, strategy.fallbackResponse);
    }

    /**
     * Check if service is degraded
     */
    isServiceDegraded(serviceName) {
      return this.degradedServices.has(serviceName);
    }

    /**
     * Get fallback response for service
     */
    getFallbackResponse(serviceName) {
      return this.fallbackResponses.get(serviceName);
    }

    /**
     * Get degradation status
     */
    getDegradationStatus() {
      const services = Array.from(this.degradedServices);
      return {
        totalServices: services.length,
        degradedServices: services,
        degradedRate: services.length > 0 ? (services.length / 12) * 100 : 0,
        services: services
      };
    }

    /**
     * Clear all degradations
     */
    clearDegradations() {
      this.degradedServices.clear();
      this.fallbackResponses.clear();
      this.degradationStrategies.clear();
    }

    /**
     * Activate fallback for service
     */
    activateFallback(serviceName) {
      console.warn(`⚠️ Activating fallback for ${serviceName} service`);
      this.degradedServices.add(serviceName);
    }

    /**
     * Deactivate fallback for service
     */
    deactivateFallback(serviceName) {
      console.log(`✅ Deactivating fallback for ${serviceName} service`);
      this.degradedServices.delete(serviceName);
    }

    /**
     * Create fallback response for service
     */
    createFallbackResponse(serviceName, data = {}) {
      const strategy = this.degradationStrategies.get(serviceName);
      const baseResponse = strategy.fallbackResponse;
      
      return {
        ...baseResponse,
        data: { ...baseResponse.data, ...data }
      };
    }
  }
  }
}

// =============================================================================
// SERVICE HEALTH MONITORING WITH CIRCUIT BREAKER COORDINATION
// =============================================================================

/**
 * Service health monitor with circuit breaker integration
 */
class ServiceHealthMonitor {
  constructor() {
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.monitoringEnabled = true;
    this.alertThreshold = 3 failures in 5 minutes
    
    this.startMonitoring();
  }

  /**
   * Register service for monitoring
   */
  registerService(serviceName, serviceConfig) {
    const circuitBreaker = new CircuitBreaker(serviceName, serviceConfig.circuitBreaker);
    const healthCheck = async () => {
      try {
        const response = await fetch(serviceConfig.healthCheck || `http://localhost:${serviceConfig.port}${serviceConfig.healthEndpoint || '/health'}`, {
          timeout: 5000
        });
        
        return {
          status: response.ok,
          responseTime: response.headers.get('x-response-time') || '0',
          data: response.status === 200 ? await response.json() : null
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message
        };
      }
    };

    this.services.set(serviceName, {
      name: serviceConfig.name,
      url: serviceConfig.url,
      port: serviceConfig.port,
      healthCheck,
      circuitBreaker,
      lastCheck: null,
      lastResponseTime: 0,
      status: 'unknown'
    });

    this.circuitBreakers.set(serviceName, circuitBreaker);
    console.log(`🔍 Registered ${serviceName} for health monitoring`);
  }

    /**
   * Check all services
   */
    async checkAllServices() {
    const results = new Map();
    
    for (const [serviceName, service] of this.services) {
      try {
        const result = await service.healthCheck();
        this.updateServiceHealth(serviceName, result);
        results.set(serviceName, result);
      } catch (error) {
        this.updateServiceHealth(serviceName, { status: 'unhealthy', error: error.message });
        results.set(serviceName, { status: 'unhealthy', error: error.message });
      }
    }

    return results;
  }

    /**
   * Update service health status
   */
    updateServiceHealth(serviceName, result) {
      const service = this.services.get(serviceName);
      
      service.lastCheck = new Date().toISOString();
      service.lastResponseTime = parseInt(result.responseTime) || 0;
      service.status = result.status === 'healthy' ? 'healthy' : 'unhealthy';
      
      // Check if circuit breaker should be triggered
      if (service.circuitBreaker) {
        if (result.status === 'unhealthy') {
          service.circuitBreaker.forceOpen(30000); // Open circuit for 30 seconds
        }
      }
    }

      console.log(`📊 ${serviceName} health status: ${service.status} (${service.lastResponseTime}ms)`);
    }

    /**
   * Get service health status
   */
    getServiceHealth(serviceName) {
      return this.services.get(serviceName);
    }

    /**
   * Get all services health status
   */
    getAllServicesHealth() {
      const results = {};
      
      for (const [serviceName, service] of this.services) {
        results[serviceName] = {
          name: service.name,
          status: service.status,
          lastCheck: service.lastCheck,
          responseTime: service.lastResponseTime,
          circuitBreaker: service.circuitBreaker.getState()
        };
      }
      
      return results;
    }

    /**
   * Start monitoring
   */
    startMonitoring() {
      if (!this.monitoringEnabled) return;
      
      // Check all services immediately
      this.checkAllServices();
      
      // Set up periodic health checks
      setInterval(async () => {
        await this.checkAllServices();
        
        // Check for service degradation
        const healthStatus = this.getAllServicesHealth();
        const degradedCount = Object.values(healthStatus).filter(s => s.status === 'degraded').length;
        
        if (degradedCount > 0) {
          console.warn(`⚠️ ${degradedCount} services currently degraded`);
          
          // Log which services are degraded
          Object.entries(healthStatus).forEach(([name, health]) => {
            if (health.status === 'degraded') {
              console.warn(`  🔴 ${name} service is currently degraded`);
            }
          });
        }
      }
      }, this.healthCheckInterval);

      console.log('🔍 Service health monitoring started');
    }

    /**
   * Stop monitoring
   */
    stopMonitoring() {
      this.monitoringEnabled = false;
      console.log('🛑 Service health monitoring stopped');
    }
  }

    /**
   * Get monitoring report
   */
    getMonitoringReport() {
      const healthStatus = this.getAllServicesHealth();
      const totalServices = Object.keys(healthStatus).length;
      const healthyServices = Object.values(healthStatus).filter(s => s.status === 'healthy').length;
      const degradedServices = totalServices - healthyServices;
      const degradedRate = degradedCount > 0 ? (degradedCount / totalServices) * 100 : 0;
      
      return {
        timestamp: new Date().toISOString(),
        totalServices,
        healthyServices,
        degradedServices,
        degradedRate,
        services: healthStatus,
        complianceLevel: degradedRate < 5 ? 'EXCELLENT' : degradedRate < 10 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      };
    }
  }
}

// =============================================================================
// GLOBAL INSTANCES
// =============================================================================

const errorRecovery = new ErrorRecovery();
const retryManager = new RetryManager();
const gracefulDegradation = new GracefulDegradation();
const serviceHealthMonitor = new ServiceHealthMonitor();

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  CircuitBreaker,
  ErrorRecovery,
  RetryManager,
  GracefulDegradation,
  ServiceHealthMonitor
  errorMonitor,
  errorPrevention,
  performanceMonitor,
  contractMonitor
  contractMonitor
};