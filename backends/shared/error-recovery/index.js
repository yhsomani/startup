/**
 * Error Recovery and Circuit Breaker Implementation
 * Comprehensive error recovery with circuit breakers for service resilience
 */

const EventEmitter = require('events');

// =============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// =============================================================================

class CircuitBreaker extends EventEmitter {
  constructor(serviceName, options = {}) {
    super();
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
      averageResponseTime: 0,
      failureRate: 0
    };

    this.events = [];
    this.startTime = Date.now();
  }

  async execute(fn, ...args) {
    const requestStart = Date.now();
    this.requestCount++;

    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        this.events.push({
          type: 'BLOCKED',
          timestamp: new Date().toISOString(),
          message: `Request blocked by circuit breaker for ${this.serviceName}`
        });
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await Promise.race([
        fn(...args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.options.timeout)
        )
      ]);

      const responseTime = Date.now() - requestStart;
      this.stats.averageResponseTime =
        ((this.stats.averageResponseTime * (this.stats.totalRequests) + responseTime) / (this.stats.totalRequests + 1));

      this.onSuccess(responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - requestStart;
      this.onFailure(error, responseTime);
      throw error;
    }
  }

  onSuccess(responseTime) {
    this.failureCount = 0;
    this.successCount++;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    this.stats.successCount++;
    this.stats.totalRequests++;

    this.events.push({
      type: 'SUCCESS',
      timestamp: new Date().toISOString(),
      responseTime,
      message: `Request succeeded for ${this.serviceName}`
    });

    this.emit('success', {
      serviceName: this.serviceName,
      responseTime,
      stats: this.getStats()
    });
  }

  onFailure(error, responseTime) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.stats.errorCount++;
    this.stats.totalRequests++;

    const failureRate = (this.failureCount / this.requestCount) * 100;

    this.events.push({
      type: 'FAILURE',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime,
      failureRate,
      message: `Request failed for ${this.serviceName}: ${error.message}`
    });

    if (this.failureCount >= this.options.maxFailures) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.options.resetTimeout;
      this.stats.circuitBreakerTrips++;
    } else if (failureRate >= this.options.failureThreshold) {
      this.state = 'HALF_OPEN';
      this.nextAttempt = Date.now() + this.options.monitoringPeriod;
    }

    this.emit('failure', {
      serviceName: this.serviceName,
      error: error.message,
      responseTime,
      failureRate,
      stats: this.getStats()
    });
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.stats.successCount,
      requestCount: this.requestCount,
      stats: this.getStats(),
      events: this.events.slice(-10)
    };
  }

  getStats() {
    const uptime = Date.now() - this.startTime;
    const failureRate = this.requestCount > 0 ? (this.stats.errorCount / this.requestCount) * 100 : 0;

    return {
      state: this.state,
      uptime,
      requestCount: this.requestCount,
      successCount: this.stats.successCount,
      errorCount: this.stats.errorCount,
      timeouts: this.stats.timeouts,
      circuitBreakerTrips: this.stats.circuitBreakerTrips,
      averageResponseTime: this.stats.averageResponseTime,
      failureRate,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      configuration: this.options
    };
  }

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

  forceOpen(duration = 60000) {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + duration;
  }

  forceClose() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }

  getEvents(limit = 100) {
    return this.events.slice(-limit);
  }
}

// =============================================================================
// ERROR RECOVERY STRATEGIES
// =============================================================================

class ErrorRecovery {
  constructor(options = {}) {
    this.strategies = new Map();
    this.defaultStrategy = 'retry';
    this.setupDefaultStrategies();
  }

  setupDefaultStrategies() {
    this.strategies.set('timeout', { maxRetries: 3, baseDelay: 1000, maxDelay: 10000, backoffMultiplier: 2 });
    this.strategies.set('connection', { maxRetries: 5, baseDelay: 500, maxDelay: 30000, backoffMultiplier: 2 });
    this.strategies.set('rate_limit', { baseDelay: 5000, maxRetries: 2, backoffMultiplier: 3 });
    this.strategies.set('service_unavailable', { maxRetries: 3, baseDelay: 2000, maxDelay: 30000, backoffMultiplier: 2, fallBackTo: 'cache' });
    this.strategies.set('database', { maxRetries: 2, baseDelay: 1000, maxDelay: 30000, backoffMultiplier: 2 });
    this.strategies.set('validation', { maxRetries: 1, baseDelay: 500, maxDelay: 30000 });
    this.strategies.set('network', { maxRetries: 3, baseDelay: 1000, maxDelay: 30000, backoffMultiplier: 2 });
    this.strategies.set('500_error', { maxRetries: 2, baseDelay: 1000, maxDelay: 30000, backoffMultiplier: 3, fallBackTo: 'degraded_service' });
    this.strategies.set('503_error', { maxRetries: 2, baseDelay: 2000, maxDelay: 30000, fallBackTo: 'cache' });
    this.strategies.set('504_error', { maxRetries: 1, baseDelay: 5000, maxDelay: 30000, fallBackTo: 'degraded_service' });
    this.strategies.set('default', { maxRetries: 3, baseDelay: 1000, maxDelay: 10000, fallBackTo: 'error_response' });
  }

  addStrategy(name, strategy) {
    this.strategies.set(name, strategy);
  }

  getErrorType(error) {
    if (!error) return 'default';
    if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') return 'timeout';
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') return 'connection';
    if (error.status === 429) return 'rate_limit';
    if (error.status === 503) return 'service_unavailable';
    if (error.status === 500) return '500_error';
    if (error.name === 'ValidationError') return 'validation';
    return 'default';
  }

  getStrategy(error) {
    const errorType = this.getErrorType(error);
    return this.strategies.get(errorType) || this.strategies.get('default');
  }

  async executeWithRecovery(fn, options = {}) {
    const strategy = options.strategy ? this.strategies.get(options.strategy) : this.strategies.get('default');
    const maxRetries = options.maxRetries || (strategy ? strategy.maxRetries : 3) || 3;

    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt >= maxRetries) {
          throw error;
        }

        const delay = this.calculateDelay(strategy || this.strategies.get('default'), attempt);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  calculateDelay(strategy, attempt) {
    const baseDelay = strategy.baseDelay || 1000;
    const maxDelay = strategy.maxDelay || 30000;
    const multiplier = strategy.backoffMultiplier || 2;
    return Math.min(baseDelay * Math.pow(multiplier, attempt - 1), maxDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// RETRY IMPLEMENTATION
// =============================================================================

class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.defaultStrategy = 'exponential_backoff';
    this.jitter = options.jitter || false;
  }

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
          return { success: false, error };
        }

        const delay = this.calculateDelay(attempt);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    return { success: false, error: lastError };
  }

  calculateDelay(attempt) {
    return Math.min(
      this.baseDelay * Math.pow(this.backoffMultiplier, attempt - 1),
      this.maxDelay
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// GRACEFUL DEGRADATION
// =============================================================================

class GracefulDegradation {
  constructor() {
    this.degradedServices = new Set();
    this.fallbackResponses = new Map();
    this.degradationStrategies = new Map();
    this.setupDefaultStrategies();
  }

  setupDefaultStrategies() {
    this.degradationStrategies.set('auth', {
      fallBackTo: 'cache',
      fallbackResponse: {
        success: true,
        data: { isAuthenticated: false, requiresVerification: true },
        message: 'Authentication service temporarily unavailable - using fallback mode'
      }
    });

    this.degradationStrategies.set('courses', {
      fallBackTo: 'cache',
      fallbackResponse: {
        success: true,
        data: { courses: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
        message: 'Courses service temporarily unavailable - showing cached data'
      }
    });

    this.degradationStrategies.set('challenges', {
      fallBackTo: 'cache',
      fallbackResponse: {
        success: true,
        data: { challenges: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
        message: 'Challenges service temporarily unavailable - showing cached data'
      }
    });

    this.degradationStrategies.set('progress', {
      fallBackTo: 'cache',
      fallbackResponse: {
        success: true,
        data: { progress: {}, achievements: [] },
        message: 'Progress tracking temporarily unavailable'
      }
    });

    this.degradationStrategies.set('notifications', {
      fallBackTo: 'cache',
      fallbackResponse: {
        success: true,
        data: { notifications: [] },
        message: 'Notifications temporarily unavailable'
      }
    });
  }

  registerService(serviceName, strategy) {
    this.degradedServices.add(serviceName);
    this.fallbackResponses.set(serviceName, strategy.fallbackResponse);
    if (strategy) {
      this.degradationStrategies.set(serviceName, strategy);
    }
  }

  isServiceDegraded(serviceName) {
    return this.degradedServices.has(serviceName);
  }

  getFallbackResponse(serviceName) {
    const strategy = this.degradationStrategies.get(serviceName);
    return strategy ? strategy.fallbackResponse : null;
  }

  getDegradationStatus() {
    const services = Array.from(this.degradedServices);
    return {
      totalServices: services.length,
      degradedServices: services,
      degradedRate: services.length > 0 ? (services.length / 12) * 100 : 0,
      services: services
    };
  }

  clearDegradations() {
    this.degradedServices.clear();
    this.fallbackResponses.clear();
  }

  activateFallback(serviceName) {
    this.degradedServices.add(serviceName);
  }

  deactivateFallback(serviceName) {
    this.degradedServices.delete(serviceName);
  }

  createFallbackResponse(serviceName, data = {}) {
    const strategy = this.degradationStrategies.get(serviceName);
    if (!strategy) return { success: false, data };
    const baseResponse = strategy.fallbackResponse;
    return {
      ...baseResponse,
      data: { ...baseResponse.data, ...data }
    };
  }
}

// =============================================================================
// SERVICE HEALTH MONITORING WITH CIRCUIT BREAKER COORDINATION
// =============================================================================

class ServiceHealthMonitor {
  constructor() {
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.healthCheckInterval = 30000; // 30 seconds
    this.monitoringEnabled = true;
    this.startMonitoring();
  }

  registerService(serviceName, serviceConfig) {
    const circuitBreaker = new CircuitBreaker(serviceName, serviceConfig.circuitBreaker);
    const healthCheck = async () => {
      try {
        const fetch = require('node-fetch');
        const response = await fetch(serviceConfig.healthCheck || `http://localhost:${serviceConfig.port}${serviceConfig.healthEndpoint || '/health'}`, {
          timeout: 5000
        });

        return {
          status: response.ok ? 'healthy' : 'unhealthy',
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
  }

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

  updateServiceHealth(serviceName, result) {
    const service = this.services.get(serviceName);
    if (!service) return;

    service.lastCheck = new Date().toISOString();
    service.lastResponseTime = parseInt(result.responseTime) || 0;
    service.status = result.status === 'healthy' ? 'healthy' : 'unhealthy';

    if (service.circuitBreaker) {
      if (result.status === 'unhealthy') {
        service.circuitBreaker.forceOpen(30000);
      }
    }
  }

  getServiceHealth(serviceName) {
    return this.services.get(serviceName);
  }

  getAllServicesHealth() {
    const results = {};
    for (const [serviceName, service] of this.services) {
      results[serviceName] = {
        name: service.name,
        status: service.status,
        lastCheck: service.lastCheck,
        responseTime: service.lastResponseTime,
        circuitBreaker: service.circuitBreaker ? service.circuitBreaker.getState() : null
      };
    }
    return results;
  }

  startMonitoring() {
    if (!this.monitoringEnabled) return;

    this.checkAllServices();

    setInterval(async () => {
      await this.checkAllServices();
    }, this.healthCheckInterval);
  }

  stopMonitoring() {
    this.monitoringEnabled = false;
  }

  getMonitoringReport() {
    const healthStatus = this.getAllServicesHealth();
    const totalServices = Object.keys(healthStatus).length;
    const healthyServices = Object.values(healthStatus).filter(s => s.status === 'healthy').length;
    const degradedServices = totalServices - healthyServices;
    const degradedRate = totalServices > 0 ? (degradedServices / totalServices) * 100 : 0;

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
  ServiceHealthMonitor,
  errorRecovery,
  retryManager,
  gracefulDegradation,
  serviceHealthMonitor
};