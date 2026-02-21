/**
 * Service Client Module
 * 
 * Enhanced HTTP client for inter-service communication with:
 * - Circuit breaker integration
 * - Retry logic with exponential backoff
 * - Request/response interceptors for tracing
 * - Graceful degradation
 * - Load balancing
 */

import CircuitBreaker, { CircuitBreakerConfig, CircuitBreakerState } from './circuit-breaker.js';
import { createLogger, type Logger } from './logger.js';
import type { ServiceRegistry } from './service-registry.js';
import type { MetricsCollector } from './metrics.js';

export interface ServiceClientConfig {
  /** Service name */
  serviceName: string;
  /** Circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;
  /** Retry configuration */
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  };
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to enable compression */
  enableCompression?: boolean;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface RequestConfig extends RequestInit {
  /** Path relative to service base URL */
  path?: string;
  /** Query parameters */
  params?: Record<string, string | number>;
  /** Whether to bypass circuit breaker */
  bypassCircuitBreaker?: boolean;
  /** Custom correlation ID */
  correlationId?: string;
  /** Request priority */
  priority?: 'low' | 'normal' | 'high';
}

export interface ServiceResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  responseTime: number;
  attempts: number;
  circuitBreakerState?: CircuitBreakerState;
  serviceUsed?: string;
}

export interface Interceptor {
  request?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  response?: (response: ServiceResponse) => ServiceResponse | Promise<ServiceResponse>;
  error?: (error: any) => any;
}

/**
 * Enhanced HTTP client for inter-service communication
 */
export class ServiceClient {
  private readonly config: Required<ServiceClientConfig>;
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly interceptors: { request: Interceptor[]; response: Interceptor[] } = {
    request: [],
    response: []
  };
  private readonly logger: Logger;
  private readonly metrics: MetricsCollector;

  constructor(
    config: ServiceClientConfig,
    private readonly serviceRegistry: ServiceRegistry,
    private readonly tracing: any,
    metrics: MetricsCollector
  ) {
    this.config = {
      ...config,
      circuitBreaker: {
        timeout: 30000,
        resetTimeout: 60000,
        monitoringPeriod: 10000,
        threshold: 5,
        ...config.circuitBreaker
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        factor: 2,
        ...config.retry
      },
      timeout: 30000,
      enableCompression: true,
      headers: {},
      ...config
    };

    this.logger = createLogger(`ServiceClient:${config.serviceName}`);
    this.metrics = metrics;

    // Add default interceptors
    this.setupDefaultInterceptors();
  }

  /**
   * Execute HTTP request with all enhancements
   */
  async request<T = any>(
    serviceName: string,
    config: RequestConfig = {}
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();
    const correlationId = config.correlationId || this.tracing.getCorrelationId();
    let attempts = 0;
    let lastError: any;

    // Get circuit breaker for this service
    const circuitBreaker = this.getCircuitBreaker(serviceName);

    // Apply request interceptors
    let requestConfig = await this.applyRequestInterceptors({
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
        'X-Correlation-ID': correlationId,
        'X-Requester-Service': this.config.serviceName,
        'X-Request-Priority': config.priority || 'normal'
      }
    });

    // Retry logic with exponential backoff
    while (attempts < this.config.retry.maxAttempts) {
      attempts++;

      try {
        // Check circuit breaker state
        if (!config.bypassCircuitBreaker && !circuitBreaker.canExecute()) {
          throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
        }

        // Get service instance
        const serviceInstance = await this.serviceRegistry.getService(serviceName);
        const url = this.buildUrl(serviceInstance.url, requestConfig.path, requestConfig.params);

        // Add trace headers
        const headers = new Headers(requestConfig.headers);
        headers.set('X-Trace-ID', this.tracing.getCurrentTraceId());
        headers.set('X-Span-ID', this.tracing.createSpan('http-request'));

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        // Execute request
        const response = await fetch(url, {
          ...requestConfig,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Record metrics
        const responseTime = Date.now() - startTime;
        this.metrics.incrementCounter('service.requests.total', {
          service: serviceName,
          method: requestConfig.method || 'GET',
          status: response.status
        });
        this.metrics.recordHistogram('service.requests.duration', responseTime, {
          service: serviceName,
          method: requestConfig.method || 'GET'
        });

        // Process response
        const serviceResponse: ServiceResponse<T> = {
          data: await this.parseResponse<T>(response),
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          responseTime,
          attempts,
          circuitBreakerState: circuitBreaker.getState(),
          serviceUsed: serviceInstance.instanceId
        };

        // Record success
        circuitBreaker.recordSuccess();

        // Apply response interceptors
        const finalResponse = await this.applyResponseInterceptors(serviceResponse);

        this.logger.info('Request successful', {
          serviceName,
          attempts,
          responseTime,
          status: response.status,
          correlationId
        });

        return finalResponse;

      } catch (error) {
        lastError = error;

        // Record failure
        circuitBreaker.recordFailure();

        this.logger.warn('Request attempt failed', {
          serviceName,
          attempt: attempts,
          error: error.message,
          correlationId
        });

        // If this is the last attempt, don't wait
        if (attempts >= this.config.retry.maxAttempts) {
          break;
        }

        // Exponential backoff delay
        const delay = Math.min(
          this.config.retry.initialDelay * Math.pow(this.config.retry.factor, attempts - 1),
          this.config.retry.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All attempts failed
    this.logger.error('All request attempts failed', {
      serviceName,
      attempts,
      error: lastError?.message,
      correlationId
    });

    // Apply error interceptors
    return this.applyErrorInterceptors(lastError);
  }

  /**
   * GET request
   */
  async get<T = any>(
    serviceName: string,
    path?: string,
    config: RequestConfig = {}
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, { ...config, method: 'GET', path });
  }

  /**
   * POST request
   */
  async post<T = any>(
    serviceName: string,
    data?: any,
    path?: string,
    config: RequestConfig = {}
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, {
      ...config,
      method: 'POST',
      path,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    serviceName: string,
    data?: any,
    path?: string,
    config: RequestConfig = {}
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, {
      ...config,
      method: 'PUT',
      path,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    serviceName: string,
    path?: string,
    config: RequestConfig = {}
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, { ...config, method: 'DELETE', path });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    serviceName: string,
    data?: any,
    path?: string,
    config: RequestConfig = {}
  ): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, {
      ...config,
      method: 'PATCH',
      path,
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: Interceptor): void {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: Interceptor): void {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Get circuit breaker for service
   */
  private getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, new CircuitBreaker(this.config.circuitBreaker));
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Build complete URL
   */
  private buildUrl(
    baseUrl: string,
    path?: string,
    params?: Record<string, string | number>
  ): string {
    let url = baseUrl.replace(/\/$/, '');
    
    if (path) {
      url += path.startsWith('/') ? path : `/${path}`;
    }

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    return url;
  }

  /**
   * Parse response body
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType) {
      return undefined as T;
    }

    if (contentType.includes('application/json')) {
      return response.json();
    }

    if (contentType.includes('text/')) {
      return response.text() as unknown as T;
    }

    return response.arrayBuffer() as unknown as T;
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.interceptors.request) {
      if (interceptor.request) {
        processedConfig = await interceptor.request(processedConfig);
      }
    }

    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(
    response: ServiceResponse<T>
  ): Promise<ServiceResponse<T>> {
    let processedResponse = response;

    for (const interceptor of this.interceptors.response) {
      if (interceptor.response) {
        processedResponse = await interceptor.response(processedResponse);
      }
    }

    return processedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: any): Promise<any> {
    let processedError = error;

    for (const interceptor of this.interceptors.response) {
      if (interceptor.error) {
        processedError = await interceptor.error(processedError);
      }
    }

    return processedError;
  }

  /**
   * Setup default interceptors
   */
  private setupDefaultInterceptors(): void {
    // Request logging interceptor
    this.addRequestInterceptor({
      request: (config) => {
        this.logger.debug('Sending request', {
          method: config.method,
          headers: Object.fromEntries(config.headers as any),
          priority: config.priority
        });
        return config;
      }
    });

    // Response logging interceptor
    this.addResponseInterceptor({
      response: (response) => {
        this.logger.debug('Received response', {
          status: response.status,
          responseTime: response.responseTime,
          attempts: response.attempts
        });
        return response;
      }
    });

    // Error handling interceptor
    this.addResponseInterceptor({
      error: async (error) => {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        if (error.message.includes('Circuit breaker is OPEN')) {
          this.logger.warn('Circuit breaker prevented request', { service: this.config.serviceName });
          throw new Error('Service temporarily unavailable');
        }

        throw error;
      }
    });
  }

  /**
   * Get circuit breaker state for all services
   */
  getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    
    this.circuitBreakers.forEach((breaker, serviceName) => {
      states[serviceName] = breaker.getState();
    });

    return states;
  }

  /**
   * Reset circuit breaker for service
   */
  resetCircuitBreaker(serviceName: string): void {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.reset();
      this.logger.info('Circuit breaker reset', { serviceName });
    }
  }
}