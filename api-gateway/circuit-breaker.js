/**
 * Circuit Breaker Pattern Implementation
 * 
 * Provides fault tolerance for service calls by failing fast
 * when a service is consistently failing
 */

class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.options = {
      failureThreshold: options.maxFailures || 5,      // Number of failures before opening
      resetTimeout: options.resetTimeout || 60000,     // Time to wait before trying again (ms)
      monitoringPeriod: options.monitoringPeriod || 10000, // Time window to monitor failures (ms)
      successThreshold: options.successThreshold || 3,   // Success count to close circuit from HALF_OPEN
      timeout: options.timeout || 5000,                 // Request timeout (ms)
      ...options
    };
    
    this.logger = {
      info: (msg, data) => console.log(`[CircuitBreaker:${this.serviceName}] ${msg}`, data),
      warn: (msg, data) => console.warn(`[CircuitBreaker:${this.serviceName}] ${msg}`, data),
      error: (msg, data) => console.error(`[CircuitBreaker:${this.serviceName}] ${msg}`, data)
    };
  }

  async execute(operation) {
    const startTime = Date.now();
    
    try {
      if (this.state === 'OPEN') {
        if (this.shouldAttemptReset()) {
          this.state = 'HALF_OPEN';
          this.logger.info('Circuit breaker entering HALF_OPEN state');
        } else {
          throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
        }
      }

      const result = await this.withTimeout(operation, this.options.timeout);
      
      // Record success
      this.recordSuccess();
      
      const duration = Date.now() - startTime;
      this.logger.info('Operation completed successfully', { duration: `${duration}ms` });
      
      return result;
      
    } catch (error) {
      // Record failure
      this.recordFailure();
      
      const duration = Date.now() - startTime;
      this.logger.error('Operation failed', { 
        error: error.message,
        duration: `${duration}ms`,
        state: this.state,
        failureCount: this.failureCount
      });
      
      throw error;
    }
  }

  withTimeout(operation, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeout}ms`));
      }, timeout);

      Promise.resolve(operation())
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  recordSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        this.logger.info('Circuit breaker CLOSED after successful operations');
      }
    } else if (this.state === 'OPEN') {
      this.state = 'CLOSED';
      this.logger.info('Circuit breaker CLOSED');
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'CLOSED') {
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'OPEN';
        this.logger.warn('Circuit breaker OPEN due to failure threshold', {
          failureCount: this.failureCount,
          threshold: this.options.failureThreshold
        });
      }
    } else if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.logger.warn('Circuit breaker OPEN again in HALF_OPEN state');
    }
  }

  shouldAttemptReset() {
    if (!this.lastFailureTime) {
      return false;
    }
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.options.resetTimeout;
  }

  getState() {
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.state === 'OPEN' ? 
        this.lastFailureTime + this.options.resetTimeout : null,
      options: this.options
    };
  }

  // Manual control methods
  forceOpen() {
    this.state = 'OPEN';
    this.logger.warn('Circuit breaker manually forced OPEN');
  }

  forceClose() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.logger.info('Circuit breaker manually forced CLOSED');
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.logger.info('Circuit breaker reset to initial state');
  }

  // Metrics
  getMetrics() {
    const now = Date.now();
    const timeSinceLastFailure = this.lastFailureTime ? now - this.lastFailureTime : null;
    
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      timeSinceLastFailure,
      nextAttemptTime: this.state === 'OPEN' ? 
        this.lastFailureTime + this.options.resetTimeout : null,
      timeUntilNextAttempt: this.state === 'OPEN' ? 
        Math.max(0, (this.lastFailureTime + this.options.resetTimeout) - now) : null,
      isHealthy: this.state === 'CLOSED' || (this.state === 'HALF_OPEN' && this.successCount > 0),
      options: this.options
    };
  }
}

// Circuit breaker registry for managing multiple breakers
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }

  create(serviceName, options = {}) {
    if (this.breakers.has(serviceName)) {
      return this.breakers.get(serviceName);
    }

    const breaker = new CircuitBreaker(serviceName, options);
    this.breakers.set(serviceName, breaker);
    
    console.log(`🔌 Created circuit breaker for ${serviceName}`);
    
    return breaker;
  }

  get(serviceName) {
    return this.breakers.get(serviceName);
  }

  getAll() {
    return Array.from(this.breakers.values());
  }

  getMetrics() {
    return this.getAll().map(breaker => breaker.getMetrics());
  }

  reset(serviceName) {
    const breaker = this.get(serviceName);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }

  resetAll() {
    for (const breaker of this.getAll()) {
      breaker.reset();
    }
    console.log('🔄 All circuit breakers reset');
  }
}

// Global registry instance
const registry = new CircuitBreakerRegistry();

module.exports = {
  CircuitBreaker,
  CircuitBreakerRegistry,
  registry
};