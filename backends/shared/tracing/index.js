/**
 * Distributed Tracing System for TalentSphere
 * Implements correlation ID tracking, span management, and trace propagation
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class TraceContext {
  constructor(traceId, spanId, parentSpanId = null, baggage = {}) {
    this.traceId = traceId || this.generateTraceId();
    this.spanId = spanId || this.generateSpanId();
    this.parentSpanId = parentSpanId;
    this.baggage = baggage || {};
    this.startTime = Date.now();
    this.tags = {};
    this.logs = [];
    this.status = { code: 0, message: 'OK' };
  }

  generateTraceId() {
    return uuidv4().replace(/-/g, '');
  }

  generateSpanId() {
    return crypto.randomBytes(8).toString('hex');
  }

  addTag(key, value) {
    this.tags[key] = value;
  }

  addLog(level, message, fields = {}) {
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    });
  }

  setStatus(code, message) {
    this.status = { code, message };
  }

  finish() {
    this.duration = Date.now() - this.startTime;
  }

  toJSON() {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      baggage: this.baggage,
      startTime: this.startTime,
      duration: this.duration,
      tags: this.tags,
      logs: this.logs,
      status: this.status
    };
  }
}

class Span {
  constructor(operationName, traceContext) {
    this.operationName = operationName;
    this.traceContext = traceContext;
    this.startTime = Date.now();
    this.finished = false;
  }

  setTag(key, value) {
    this.traceContext.addTag(key, value);
    return this;
  }

  setBaggageItem(key, value) {
    this.traceContext.baggage[key] = value;
    return this;
  }

  getBaggageItem(key) {
    return this.traceContext.baggage[key];
  }

  logEvent(message, fields = {}) {
    this.traceContext.addLog('info', message, fields);
    return this;
  }

  logError(error, fields = {}) {
    this.traceContext.addLog('error', error.message, {
      ...fields,
      stack: error.stack,
      name: error.name
    });
    this.traceContext.setStatus(1, error.message);
    return this;
  }

  finish() {
    if (!this.finished) {
      this.finished = true;
      this.traceContext.finish();
    }
  }

  getContext() {
    return this.traceContext;
  }
}

class DistributedTracer {
  constructor(options = {}) {
    this.options = {
      serviceName: 'unknown',
      samplingRate: 1.0,
      maxSpans: 1000,
      exportInterval: 5000,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      ...options
    };

    this.activeSpans = new Map();
    this.completedSpans = [];
    this.sampler = new Sampler(this.options.samplingRate);
    this.exporter = new TraceExporter(this.options);
    this.propagator = new TracePropagator();

    // Start periodic export
    this.startExportTimer();
  }

  startSpan(operationName, parentContext = null) {
    // Check sampling decision
    if (!this.sampler.shouldSample()) {
      return new NoOpSpan();
    }

    let traceContext;
    if (parentContext) {
      traceContext = new TraceContext(
        parentContext.traceId,
        null, // Generate new span ID
        parentContext.spanId,
        { ...parentContext.baggage }
      );
    } else {
      traceContext = new TraceContext();
    }

    // Add service information
    traceContext.addTag('service.name', this.options.serviceName);
    traceContext.addTag('operation.name', operationName);

    const span = new Span(operationName, traceContext);
    this.activeSpans.set(traceContext.spanId, span);

    return span;
  }

  extractFromHeaders(headers) {
    return this.propagator.extract(headers);
  }

  injectToHeaders(span, headers = {}) {
    const context = span.getContext();
    return this.propagator.inject(context, headers);
  }

  finishSpan(span) {
    span.finish();
    const spanId = span.getContext().spanId;
    this.activeSpans.delete(spanId);
    
    this.completedSpans.push(span.getContext());
    
    // Cleanup old spans
    if (this.completedSpans.length > this.options.maxSpans) {
      this.completedSpans = this.completedSpans.slice(-this.options.maxSpans);
    }
  }

  getActiveSpans() {
    return Array.from(this.activeSpans.values());
  }

  getTraceById(traceId) {
    return this.completedSpans.filter(span => span.traceId === traceId);
  }

  getServiceMetrics() {
    const spans = this.completedSpans;
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentSpans = spans.filter(span => span.startTime > oneHourAgo);
    
    const metrics = {
      totalSpans: recentSpans.length,
      errorRate: 0,
      avgDuration: 0,
      p95Duration: 0,
      p99Duration: 0
    };

    if (recentSpans.length > 0) {
      const errorCount = recentSpans.filter(span => span.status.code !== 0).length;
      metrics.errorRate = (errorCount / recentSpans.length) * 100;

      const durations = recentSpans.map(span => span.duration).sort((a, b) => a - b);
      metrics.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      metrics.p95Duration = durations[Math.floor(durations.length * 0.95)];
      metrics.p99Duration = durations[Math.floor(durations.length * 0.99)];
    }

    return metrics;
  }

  startExportTimer() {
    setInterval(() => {
      if (this.completedSpans.length > 0) {
        this.exporter.export(this.completedSpans.splice(0));
      }
    }, this.options.exportInterval);
  }
}

class Sampler {
  constructor(samplingRate = 1.0) {
    this.samplingRate = Math.max(0, Math.min(1, samplingRate));
  }

  shouldSample() {
    if (this.samplingRate >= 1.0) return true;
    if (this.samplingRate <= 0) return false;
    
    return Math.random() < this.samplingRate;
  }
}

class TracePropagator {
  extract(headers) {
    const traceHeader = headers['x-trace-id'] || headers['traceparent'];
    const baggageHeader = headers['x-baggage'] || headers['baggage'];
    
    if (!traceHeader) return null;

    // Parse traceparent header (W3C Trace Context format)
    // traceparent: version-traceId-parentId-flags
    const parts = traceHeader.split('-');
    if (parts.length < 4) return null;

    const [, traceId, parentSpanId] = parts;
    
    const baggage = {};
    if (baggageHeader) {
      baggageHeader.split(',').forEach(item => {
        const [key, value] = item.split('=');
        if (key && value) {
          baggage[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }

    return new TraceContext(traceId, null, parentSpanId, baggage);
  }

  inject(traceContext, headers = {}) {
    // Use W3C Trace Context format
    headers['traceparent'] = `00-${traceContext.traceId}-${traceContext.spanId}-01`;
    headers['x-trace-id'] = traceContext.traceId;
    headers['x-span-id'] = traceContext.spanId;
    
    if (traceContext.parentSpanId) {
      headers['x-parent-span-id'] = traceContext.parentSpanId;
    }

    // Inject baggage
    if (Object.keys(traceContext.baggage).length > 0) {
      const baggageItems = Object.entries(traceContext.baggage)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join(',');
      headers['baggage'] = baggageItems;
      headers['x-baggage'] = baggageItems;
    }

    return headers;
  }
}

class TraceExporter {
  constructor(options) {
    this.options = options;
  }

  async export(spans) {
    try {
      // Console export
      if (this.options.enableConsole) {
        spans.forEach(span => {
          console.log(`[TRACE] ${span.operationName || 'unknown'}: ${span.duration}ms`, span.toJSON());
        });
      }

      // File export
      if (this.options.enableFile) {
        // Implementation for file-based export
        await this.exportToFile(spans);
      }

      // Remote export (Jaeger, Zipkin, etc.)
      if (this.options.enableRemote) {
        // Implementation for remote export
        await this.exportToRemote(spans);
      }
    } catch (error) {
      console.error('Failed to export traces:', error);
    }
  }

  async exportToFile(spans) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const logFile = path.join(process.cwd(), 'logs', 'traces.json');
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    
    const traceData = spans.map(span => span.toJSON());
    await fs.appendFile(logFile, JSON.stringify(traceData) + '\n');
  }

  async exportToRemote(spans) {
    // Implementation for remote tracing systems
    // This would integrate with Jaeger, Zipkin, OpenTelemetry, etc.
  }
}

class NoOpSpan {
  setTag() { return this; }
  setBaggageItem() { return this; }
  getBaggageItem() { return undefined; }
  logEvent() { return this; }
  logError() { return this; }
  finish() {}
  getContext() { return new TraceContext('noop', 'noop'); }
}

class TraceMiddleware {
  constructor(tracer) {
    this.tracer = tracer;
  }

  express() {
    return (req, res, next) => {
      // Extract trace context from headers
      const parentContext = this.tracer.extractFromHeaders(req.headers);
      
      // Create span for this request
      const span = this.tracer.startSpan(
        `${req.method} ${req.path}`,
        parentContext
      );

      // Add request information
      span.setTag('http.method', req.method);
      span.setTag('http.url', req.url);
      span.setTag('http.user_agent', req.headers['user-agent']);
      span.setTag('http.remote_addr', req.ip || req.connection.remoteAddress);

      // Add correlation ID to request
      req.traceContext = span.getContext();
      req.traceId = span.getContext().traceId;
      req.correlationId = span.getContext().traceId;

      // Inject trace headers for downstream calls
      this.tracer.injectToHeaders(span, req.headers);

      // Override res.end to finish the span
      const originalEnd = res.end;
      res.end = function(...args) {
        span.setTag('http.status_code', res.statusCode);
        
        if (res.statusCode >= 400) {
          span.setStatus(1, `HTTP ${res.statusCode}`);
        }

        span.finish();
        originalEnd.apply(this, args);
      };

      // Handle errors
      res.on('error', (error) => {
        span.logError(error);
        span.finish();
      });

      next();
    };
  }

  async httpCall(options, callback) {
    const span = this.tracer.startSpan(`HTTP ${options.method || 'GET'} ${options.hostname || options.url}`);
    
    span.setTag('http.method', options.method || 'GET');
    span.setTag('http.url', options.url || `${options.protocol}//${options.hostname}${options.path}`);

    // Inject trace headers
    const headers = this.tracer.injectToHeaders(span, options.headers || {});
    options.headers = headers;

    const startTime = Date.now();
    
    try {
      const result = await this.makeHttpRequest(options);
      span.setTag('http.status_code', result.statusCode);
      span.finish();
      return result;
    } catch (error) {
      span.logError(error);
      span.finish();
      throw error;
    }
  }

  makeHttpRequest(options) {
    return new Promise((resolve, reject) => {
      const http = options.protocol === 'https:' ? require('https') : require('http');
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ ...res, data }));
      });
      
      req.on('error', reject);
      req.end(options.body);
    });
  }
}

// Singleton instance
let globalTracer = null;

function initTracer(options = {}) {
  if (!globalTracer) {
    globalTracer = new DistributedTracer(options);
  }
  return globalTracer;
}

function getTracer() {
  return globalTracer || initTracer();
}

module.exports = {
  DistributedTracer,
  TraceContext,
  Span,
  TraceMiddleware,
  Sampler,
  TracePropagator,
  TraceExporter,
  initTracer,
  getTracer
};