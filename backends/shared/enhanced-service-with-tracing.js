/**
 * Enhanced Service Template with Distributed Tracing Integration
 * Integrates tracing with validation, error recovery, and monitoring
 */

const { performance } = require('perf_hooks');
const { v4: uuidv4 } = require('uuid');
const { getTracer, TraceMiddleware } = require('./tracing');
const { CircuitBreaker } = require('./circuit-breaker');
const { ErrorRecovery } = require('./error-recovery');
const { validateRequest, validateResponse } = require('./validation');
const { ServiceContract } = require('./contracts');

class EnhancedServiceWithTracing {
  constructor(config = {}) {
    this.config = {
      serviceName: config.serviceName || 'unknown-service',
      version: config.version || '1.0.0',
      environment: config.environment || 'development',
      port: config.port || 3000,
      // Tracing configuration
      tracing: {
        enabled: true,
        samplingRate: 1.0,
        maxSpans: 1000,
        ...config.tracing
      },
      // Existing configurations
      validation: config.validation || {},
      circuitBreaker: config.circuitBreaker || {},
      errorRecovery: config.errorRecovery || {},
      performance: config.performance || {},
      logging: config.logging || {},
      ...config
    };

    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      traces: 0,
      tracesByOperation: new Map()
    };

    this.startTime = Date.now();

    // Initialize tracing
    this.tracer = null;
    if (this.config.tracing.enabled) {
      this.tracer = getTracer();
      if (!this.tracer) {
        this.tracer = require('./tracing').initTracer({
          serviceName: this.config.serviceName,
          samplingRate: this.config.tracing.samplingRate,
          maxSpans: this.config.tracing.maxSpans,
          enableConsole: true,
          enableFile: this.config.environment === 'production'
        });
      }
    }

    this.traceMiddleware = this.tracer ? new TraceMiddleware(this.tracer) : null;

    // Initialize existing components
    this.circuitBreaker = new CircuitBreaker(this.config.serviceName, this.config.circuitBreaker);
    this.errorRecovery = new ErrorRecovery(this.config.errorRecovery);
    this.performanceMonitor = require('./monitoring');
    this.logger = require('./logger');
    this.serviceContract = new ServiceContract(this.config.serviceName);
  }

  async executeWithTracing(operationName, fn, options = {}) {
    if (!this.tracer) {
      return this.executeWithoutTracing(fn, options);
    }

    const span = this.tracer.startSpan(operationName, options.parentSpan);

    // Add operation metadata
    span.setTag('service.name', this.config.serviceName);
    span.setTag('service.version', this.config.version);
    span.setTag('environment', this.config.environment);
    span.setTag('operation.options', JSON.stringify(options));

    // Update metrics
    this.metrics.traces++;
    this.metrics.tracesByOperation.set(
      operationName,
      (this.metrics.tracesByOperation.get(operationName) || 0) + 1
    );

    const startTime = performance.now();

    try {
      // Add input validation to trace
      if (options.input) {
        span.setTag('validation.input.size', JSON.stringify(options.input).length);
        span.logEvent('Input validation started');
      }

      // Execute with circuit breaker and error recovery
      const result = await this.circuitBreaker.execute(async () => {
        return this.errorRecovery.executeWithRecovery(
          fn,
          options.errorRecoveryOptions
        );
      });

      // Add success metrics to trace
      const duration = performance.now() - startTime;
      span.setTag('execution.duration_ms', Math.round(duration * 100) / 100);
      span.setTag('execution.success', true);

      if (options.outputSchema) {
        span.setTag('validation.output.applied', true);
      }

      span.logEvent('Operation completed successfully', {
        result_size: JSON.stringify(result || {}).length
      });

      this.tracer.finishSpan(span);
      return result;

    } catch (error) {
      // Add error details to trace
      const duration = performance.now() - startTime;
      span.setTag('execution.duration_ms', Math.round(duration * 100) / 100);
      span.setTag('execution.success', false);
      span.setTag('error.type', error.constructor.name);
      span.setTag('error.code', error.code || 'UNKNOWN');

      span.logError(error, {
        operation: operationName,
        options: JSON.stringify(options)
      });

      this.tracer.finishSpan(span);
      throw error;

    } finally {
      // Update service metrics
      const totalDuration = performance.now() - startTime;
      this.updateMetrics(operationName, totalDuration);
    }
  }

  async executeWithoutTracing(fn, options) {
    return this.circuitBreaker.execute(async () => {
      return this.errorRecovery.executeWithRecovery(fn, options.errorRecoveryOptions);
    });
  }

  async executeWithFullTracing(operationName, request, options = {}) {
    return this.executeWithTracing(operationName, async () => {
      // 1. Validate input
      if (options.validateInput !== false && options.inputSchema) {
        const validationResult = await validateRequest(request, options.inputSchema, {
          serviceName: this.config.serviceName,
          operationName
        });

        if (!validationResult.valid) {
          throw new Error(`Input validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      // 2. Execute operation
      const result = await this.executeOperation(request, options);

      // 3. Validate output
      if (options.validateOutput !== false && options.outputSchema) {
        const validationResult = await validateResponse(result, options.outputSchema, {
          serviceName: this.config.serviceName,
          operationName
        });

        if (!validationResult.valid) {
          throw new Error(`Output validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      return result;
    }, {
      parentSpan: options.parentSpan,
      input: request,
      errorRecoveryOptions: options.errorRecoveryOptions
    });
  }

  async executeOperation(request, options) {
    // This should be overridden by specific service implementations
    throw new Error('executeOperation must be implemented by subclass');
  }

  async executeDownstreamCall(serviceName, operationName, request, options = {}) {
    const operationFullName = `${serviceName}.${operationName}`;

    return this.executeWithTracing(`downstream.${operationFullName}`, async () => {
      // Create HTTP client with tracing
      const httpClient = this.createTracedHttpClient();

      // Make downstream call with propagated trace context
      const response = await httpClient.post(`http://${serviceName}/${operationName}`, {
        body: JSON.stringify(request),
        headers: options.headers || {}
      });

      return response.data;
    }, {
      parentSpan: options.parentSpan,
      input: request,
      errorRecoveryOptions: {
        timeout: options.timeout || 30000,
        maxRetries: options.maxRetries || 3
      }
    });
  }

  createTracedHttpClient() {
    if (!this.traceMiddleware) {
      // Return basic HTTP client without tracing
      return require('axios');
    }

    // Create HTTP client with tracing middleware
    const tracedClient = {
      async post(url, options = {}) {
        const parsedUrl = new URL(url);
        const httpOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: options.body
        };

        return this.traceMiddleware.httpCall(httpOptions);
      },

      async get(url, options = {}) {
        const parsedUrl = new URL(url);
        const httpOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: options.headers || {}
        };

        return this.traceMiddleware.httpCall(httpOptions);
      }
    };

    return tracedClient;
  }

  getTracingMiddleware() {
    return this.traceMiddleware ? this.traceMiddleware.express() : (req, res, next) => next();
  }

  async handleRequestWithTracing(req, res, operationName, options = {}) {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const correlationId = req.headers['x-correlation-id'] || req.traceId || uuidv4();

    // Extract parent span from headers
    const parentSpan = this.tracer ? this.tracer.extractFromHeaders(req.headers) : null;

    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('x-request-id', requestId);

    return this.executeWithFullTracing(operationName, {
      headers: req.headers,
      query: req.query,
      body: req.body,
      params: req.params,
      correlationId,
      requestId
    }, {
      parentSpan,
      ...options,
      errorRecoveryOptions: {
        timeout: options.timeout || this.config.performance.timeout,
        maxRetries: options.maxRetries || this.config.errorRecovery.maxRetries,
        ...options.errorRecoveryOptions
      }
    }).then(result => {
      // Inject trace headers for response
      if (this.traceMiddleware && this.tracer) {
        const span = this.tracer.getActiveSpans().find(s => s.getContext().spanId === parentSpan?.spanId);
        if (span) {
          this.tracer.injectToHeaders(span, res.headers);
        }
      }

      res.json({
        success: true,
        data: result,
        meta: {
          requestId,
          correlationId,
          timestamp: new Date().toISOString(),
          service: this.config.serviceName,
          version: this.config.version
        }
      });

    }).catch(error => {
      this.logger.error('Request failed', {
        error: error.message,
        stack: error.stack,
        requestId,
        correlationId,
        operationName,
        service: this.config.serviceName
      });

      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An internal error occurred'
        },
        meta: {
          requestId,
          correlationId,
          timestamp: new Date().toISOString(),
          service: this.config.serviceName
        }
      });
    });
  }

  updateMetrics(operationName, duration) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += duration;

    // Update operation-specific metrics
    const operationKey = `operation.${operationName}`;
    if (!this.metrics[operationKey]) {
      this.metrics[operationKey] = {
        count: 0,
        totalTime: 0,
        avgTime: 0
      };
    }

    this.metrics[operationKey].count++;
    this.metrics[operationKey].totalTime += duration;
    this.metrics[operationKey].avgTime = this.metrics[operationKey].totalTime / this.metrics[operationKey].count;
  }

  getTracingMetrics() {
    const baseMetrics = this.getMetrics();

    if (!this.tracer) {
      return {
        ...baseMetrics,
        tracing: {
          enabled: false,
          message: 'Tracing is disabled'
        }
      };
    }

    const tracerMetrics = this.tracer.getServiceMetrics();
    const activeSpans = this.tracer.getActiveSpans();

    return {
      ...baseMetrics,
      tracing: {
        enabled: true,
        serviceName: this.config.serviceName,
        samplingRate: this.config.tracing.samplingRate,
        totalTraces: this.metrics.traces,
        tracesByOperation: Object.fromEntries(this.metrics.tracesByOperation),
        activeSpans: activeSpans.length,
        tracerMetrics,
        recentSpans: activeSpans.map(span => ({
          operationName: span.operationName,
          traceId: span.getContext().traceId,
          spanId: span.getContext().spanId,
          duration: Date.now() - span.getContext().startTime,
          tags: span.getContext().tags
        }))
      }
    };
  }

  async getTraceById(traceId) {
    if (!this.tracer) {
      return null;
    }

    return this.tracer.getTraceById(traceId);
  }

  async getServiceHealth() {
    const baseHealth = {
      service: this.config.serviceName,
      version: this.config.version,
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    if (!this.tracer) {
      return {
        ...baseHealth,
        tracing: {
          status: 'disabled',
          message: 'Distributed tracing is not enabled'
        }
      };
    }

    const tracerMetrics = this.tracer.getServiceMetrics();

    return {
      ...baseHealth,
      tracing: {
        status: 'healthy',
        enabled: true,
        serviceName: this.config.serviceName,
        activeSpans: this.tracer.getActiveSpans().length,
        completedSpans: tracerMetrics.totalSpans,
        errorRate: tracerMetrics.errorRate,
        avgDuration: tracerMetrics.avgDuration,
        samplingRate: this.config.tracing.samplingRate
      }
    };
  }
}

module.exports = {
  EnhancedServiceWithTracing
};