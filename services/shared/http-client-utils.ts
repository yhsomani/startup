/**
 * HTTP Client Utilities
 * 
 * Utility functions for working with service clients and HTTP operations.
 */

import { ServiceClient, type ServiceResponse } from './service-client.js';
import { type ServiceRegistry } from './service-registry.js';
import { createLogger, type Logger } from './logger.js';

export interface HttpClientOptions {
  /** Default headers for all requests */
  defaultHeaders?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to automatically retry on failure */
  retry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Simple HTTP client wrapper for common operations
 */
export class HttpClient {
  private readonly client: ServiceClient;
  private readonly logger: Logger;

  constructor(
    clientName: string,
    serviceRegistry: ServiceRegistry,
    tracing: any,
    metrics: any,
    options: HttpClientOptions = {}
  ) {
    this.client = new ServiceClient(
      {
        serviceName: clientName,
        headers: options.defaultHeaders,
        timeout: options.timeout
      },
      serviceRegistry,
      tracing,
      metrics
    );
    
    this.logger = createLogger(`HttpClient:${clientName}`);
  }

  /**
   * Make a request to any service
   */
  async request<T = any>(
    serviceName: string,
    config: Parameters<ServiceClient['request']>[1]
  ): Promise<T> {
    const response = await this.client.request<T>(serviceName, config);
    return response.data;
  }

  /**
   * Get data from service
   */
  async get<T = any>(
    serviceName: string,
    path?: string,
    params?: Record<string, string | number>
  ): Promise<T> {
    const response = await this.client.get<T>(serviceName, path, { params });
    return response.data;
  }

  /**
   * Post data to service
   */
  async post<T = any>(
    serviceName: string,
    data?: any,
    path?: string
  ): Promise<T> {
    const response = await this.client.post<T>(serviceName, data, path);
    return response.data;
  }

  /**
   * Put data to service
   */
  async put<T = any>(
    serviceName: string,
    data?: any,
    path?: string
  ): Promise<T> {
    const response = await this.client.put<T>(serviceName, data, path);
    return response.data;
  }

  /**
   * Delete from service
   */
  async delete<T = any>(
    serviceName: string,
    path?: string
  ): Promise<T> {
    const response = await this.client.delete<T>(serviceName, path);
    return response.data;
  }

  /**
   * Patch data in service
   */
  async patch<T = any>(
    serviceName: string,
    data?: any,
    path?: string
  ): Promise<T> {
    const response = await this.client.patch<T>(serviceName, data, path);
    return response.data;
  }

  /**
   * Get the underlying service client for advanced operations
   */
  getServiceClient(): ServiceClient {
    return this.client;
  }
}

/**
 * Batch request utility for parallel service calls
 */
export class BatchRequest {
  private requests: Array<{
    name: string;
    service: string;
    method: keyof ServiceClient;
    args: any[];
  }> = [];

  private readonly client: ServiceClient;

  constructor(client: ServiceClient) {
    this.client = client;
  }

  /**
   * Add a GET request to the batch
   */
  addGet(name: string, service: string, path?: string, config?: any): this {
    this.requests.push({ name, service, method: 'get', args: [path, config] });
    return this;
  }

  /**
   * Add a POST request to the batch
   */
  addPost(name: string, service: string, data?: any, path?: string, config?: any): this {
    this.requests.push({ name, service, method: 'post', args: [data, path, config] });
    return this;
  }

  /**
   * Add a PUT request to the batch
   */
  addPut(name: string, service: string, data?: any, path?: string, config?: any): this {
    this.requests.push({ name, service, method: 'put', args: [data, path, config] });
    return this;
  }

  /**
   * Execute all requests in parallel
   */
  async execute(): Promise<Record<string, any>> {
    const promises = this.requests.map(async (request) => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Dynamic method call
        const response = await this.client[request.method](...request.args);
        return { name: request.name, data: response.data, success: true };
      } catch (error) {
        return { name: request.name, error: error.message, success: false };
      }
    });

    const results = await Promise.all(promises);
    
    const response: Record<string, any> = {};
    results.forEach(result => {
      response[result.name] = result.success ? result.data : { error: result.error };
    });

    return response;
  }

  /**
   * Execute all requests with fail-fast behavior
   */
  async executeFailFast(): Promise<Record<string, any>> {
    const promises = this.requests.map(async (request) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Dynamic method call
      return this.client[request.method](...request.args);
    });

    const results = await Promise.all(promises);
    
    const response: Record<string, any> = {};
    results.forEach((result, index) => {
      const request = this.requests[index];
      response[request.name] = result.data;
    });

    return response;
  }

  /**
   * Clear all requests
   */
  clear(): this {
    this.requests = [];
    return this;
  }

  /**
   * Get number of requests in batch
   */
  size(): number {
    return this.requests.length;
  }
}

/**
 * Request builder for fluent API
 */
export class RequestBuilder {
  private config: any = {};

  constructor(private readonly client: ServiceClient) {}

  /**
   * Set service name
   */
  to(service: string): this {
    this.config.serviceName = service;
    return this;
  }

  /**
   * Set HTTP method
   */
  method(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): this {
    this.config.method = method;
    return this;
  }

  /**
   * Set path
   */
  path(path: string): this {
    this.config.path = path;
    return this;
  }

  /**
   * Set data
   */
  data(data: any): this {
    this.config.data = data;
    return this;
  }

  /**
   * Set query parameters
   */
  params(params: Record<string, string | number>): this {
    this.config.params = params;
    return this;
  }

  /**
   * Set headers
   */
  headers(headers: Record<string, string>): this {
    this.config.headers = headers;
    return this;
  }

  /**
   * Set priority
   */
  priority(priority: 'low' | 'normal' | 'high'): this {
    this.config.priority = priority;
    return this;
  }

  /**
   * Bypass circuit breaker
   */
  bypassCircuitBreaker(bypass = true): this {
    this.config.bypassCircuitBreaker = bypass;
    return this;
  }

  /**
   * Execute the request
   */
  async execute<T = any>(): Promise<T> {
    const { serviceName, method, path, data, params, headers, priority, bypassCircuitBreaker } = this.config;

    if (!serviceName) {
      throw new Error('Service name is required');
    }

    let response: ServiceResponse<T>;

    switch (method) {
      case 'GET':
        response = await this.client.get<T>(serviceName, path, { params, headers, priority, bypassCircuitBreaker });
        break;
      case 'POST':
        response = await this.client.post<T>(serviceName, data, path, { headers, priority, bypassCircuitBreaker });
        break;
      case 'PUT':
        response = await this.client.put<T>(serviceName, data, path, { headers, priority, bypassCircuitBreaker });
        break;
      case 'DELETE':
        response = await this.client.delete<T>(serviceName, path, { headers, priority, bypassCircuitBreaker });
        break;
      case 'PATCH':
        response = await this.client.patch<T>(serviceName, data, path, { headers, priority, bypassCircuitBreaker });
        break;
      default:
        response = await this.client.request<T>(serviceName, {
          method,
          path,
          body: data ? JSON.stringify(data) : undefined,
          params,
          headers,
          priority,
          bypassCircuitBreaker
        });
    }

    return response.data;
  }
}

/**
 * Utility functions for common HTTP operations
 */
export const HttpUtils = {
  /**
   * Create a batch request
   */
  batch(client: ServiceClient): BatchRequest {
    return new BatchRequest(client);
  },

  /**
   * Create a request builder
   */
  build(client: ServiceClient): RequestBuilder {
    return new RequestBuilder(client);
  },

  /**
   * Retry a function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    initialDelay = 1000,
    factor = 2,
    maxDelay = 10000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },

  /**
   * Create simple HTTP client
   */
  create(
    clientName: string,
    serviceRegistry: ServiceRegistry,
    tracing: any,
    metrics: any,
    options: HttpClientOptions = {}
  ): HttpClient {
    return new HttpClient(clientName, serviceRegistry, tracing, metrics, options);
  }
};