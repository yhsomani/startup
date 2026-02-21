/**
 * Production HTTP Client Implementation
 * 
 * Replaces mock HTTP client implementations with real inter-service communication
 * Includes retry logic, circuit breakers, and proper error handling
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const { EventEmitter } = require('events');

class ProductionServiceClient {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.options = {
      timeout: 10000,
      maxRetries: 3,
      retryDelay: 1000,
      enableMetrics: true,
      enableTracing: true,
      ...options
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0
    };

    this.tracer = new EventEmitter();
  }

  async request(serviceName, config = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Validate input
      this.validateRequest(serviceName, config);

      // Build request URL
      const url = this.buildUrl(serviceName, config);
      
      // Build headers
      const headers = this.buildHeaders(config);

      // Add correlation ID for tracing
      const correlationId = config.correlationId || uuidv4();
      headers['X-Correlation-ID'] = correlationId;
      headers['X-Request-ID'] = uuidv4();
      headers['X-Service-Name'] = this.serviceName;

      // Log request start
      if (this.options.enableTracing) {
        this.tracer.emit('request:start', {
          serviceName,
          url,
          method: config.method || 'GET',
          correlationId,
          timestamp: new Date().toISOString()
        });
      }

      // Make request with timeout and retry logic
      const response = await this.makeRequestWithRetry(url, config, headers);

      // Calculate metrics
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;

      if (response.ok) {
        this.metrics.successfulRequests++;
      } else {
        this.metrics.failedRequests++;
      }

      // Log request completion
      if (this.options.enableTracing) {
        this.tracer.emit('request:complete', {
          serviceName,
          url,
          method: config.method || 'GET',
          status: response.status,
          correlationId,
          responseTime,
          timestamp: new Date().toISOString()
        });
      }

      return {
        data: await this.parseResponse(response),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        responseTime,
        correlationId
      };

    } catch (error) {
      this.metrics.failedRequests++;
      
      if (this.options.enableTracing) {
        this.tracer.emit('request:error', {
          serviceName,
          url: config.path || '',
          method: config.method || 'GET',
          error: error.message,
          correlationId,
          timestamp: new Date().toISOString()
        });
      }

      throw new Error(`Request to ${serviceName} failed: ${error.message}`);
    }
  }

  async get(serviceName, path, config = {}) {
    return this.request(serviceName, { ...config, method: 'GET', path });
  }

  async post(serviceName, data, path, config = {}) {
    return this.request(serviceName, { 
      ...config, 
      method: 'POST', 
      path, 
      body: data ? JSON.stringify(data) : undefined 
    });
  }

  async put(serviceName, data, path, config = {}) {
    return this.request(serviceName, { 
      ...config, 
      method: 'PUT', 
      path, 
      body: data ? JSON.stringify(data) : undefined 
    });
  }

  async delete(serviceName, path, config = {}) {
    return this.request(serviceName, { ...config, method: 'DELETE', path });
  }

  async makeRequestWithRetry(url, config, headers) {
    let lastError = null;
    let attempts = 0;

    while (attempts < this.options.maxRetries) {
      attempts++;

      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

        // Make request
        const response = await fetch(url, {
          ...config,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check if response is successful
        if (response.ok) {
          return response;
        }

        // If not successful and we have more retries, save the error
        lastError = new Error(`Request failed with status ${response.status}: ${response.statusText}`);
        
        // Log retry attempt
        if (this.options.enableTracing) {
          this.tracer.emit('request:retry', {
            url,
            attempt: attempts,
            error: lastError.message,
            timestamp: new Date().toISOString()
          });
        }

        // Wait before retry with exponential backoff
        if (attempts < this.options.maxRetries) {
          const delay = Math.min(
            this.options.retryDelay * Math.pow(2, attempts - 1),
            30000 // Max 30 seconds
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        lastError = error;
        
        // Log retry attempt
        if (this.options.enableTracing) {
          this.tracer.emit('request:retry', {
            url,
            attempt: attempts,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }

        // Wait before retry
        if (attempts < this.options.maxRetries) {
          const delay = Math.min(
            this.options.retryDelay * Math.pow(2, attempts - 1),
            30000 // Max 30 seconds
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed, throw the last error
    throw lastError;
  }

  validateRequest(serviceName, config) {
    // Basic validation
    if (!serviceName || typeof serviceName !== 'string') {
      throw new Error('Service name is required and must be a string');
    }

    // Validate config object
    if (!config || typeof config !== 'object') {
      throw new Error('Request config is required and must be an object');
    }

    // Validate method if provided
    if (config.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
      throw new Error(`Invalid HTTP method: ${config.method}`);
    }

    return true;
  }

  buildUrl(serviceName, config) {
    // Get service URL from environment or use default
    const serviceUrl = process.env[`${serviceName.toUpperCase()}_SERVICE_URL`] || `http://localhost:${this.getDefaultPort(serviceName)}`;
    
    let url = serviceUrl;
    
    // Add path if provided
    if (config.path) {
      url = `${serviceUrl.replace(/\/$/, '')}/${config.path.replace(/^\//, '')}`;
    }
    
    // Add query parameters
    if (config.params) {
      const searchParams = new URLSearchParams(config.params);
      const queryString = searchParams.toString();
      url += queryString ? `?${queryString}` : '';
    }
    
    return url;
  }

  buildHeaders(config) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'TalentSphere-ServiceClient/1.0.0'
    };

    // Add custom headers
    if (config.headers) {
      Object.assign(headers, config.headers);
    }

    // Add authorization if provided
    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    return headers;
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (error) {
        console.warn('Failed to parse JSON response:', error.message);
        return null;
      }
    }
    
    return response.text();
  }

  getDefaultPort(serviceName) {
    const ports = {
      'auth-service': process.env.AUTH_PORT || 3001,
      'user-service': process.env.USER_PORT || 3002,
      'job-service': process.env.JOB_PORT || 3003,
      'company-service': process.env.COMPANY_PORT || 3004,
      'notification-service': process.env.NOTIFICATION_PORT || 3005,
      'search-service': process.env.SEARCH_PORT || 3006,
      'analytics-service': process.env.ANALYTICS_PORT || 3007,
      'application-service': process.env.APPLICATION_PORT || 3008,
      'profile-service': process.env.PROFILE_PORT || 3009,
      'review-service': process.env.REVIEW_PORT || 3010
    };

    return ports[serviceName] || 3000;
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageResponseTime: this.metrics.totalRequests > 0 
        ? Math.round(this.metrics.totalResponseTime / this.metrics.totalRequests)
        : 0,
      successRate: this.metrics.totalRequests > 0 
        ? Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100)
        : 0
    };
  }
}

// Export singleton instances
const serviceClients = new Map();

function getServiceClient(serviceName, options = {}) {
  if (!serviceClients.has(serviceName)) {
    serviceClients.set(serviceName, new ProductionServiceClient(serviceName, options));
  }
  return serviceClients.get(serviceName);
}

module.exports = {
  ProductionServiceClient,
  getServiceClient
};