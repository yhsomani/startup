/**
 * Distributed Tracing Middleware for Node.js Services
 *
 * Provides OpenTelemetry-based tracing with Jaeger export.
 * Supports automatic instrumentation for HTTP, Express, and database calls.
 */

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { ExpressInstrumentation } = require("@opentelemetry/instrumentation-express");
const { PgInstrumentation } = require("@opentelemetry/instrumentation-pg");
const { RedisInstrumentation } = require("@opentelemetry/instrumentation-redis-4");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { trace, context, SpanStatusCode } = require("@opentelemetry/api");

class TracingService {
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.sdk = null;
        this.tracer = null;
    }

    initialize(options = {}) {
        const jaegerHost = options.jaegerHost || process.env.JAEGER_HOST || "jaeger-agent";
        const jaegerPort = options.jaegerPort || process.env.JAEGER_PORT || 6831;
        const environment = options.environment || process.env.NODE_ENV || "development";

        const exporter = new JaegerExporter({
            endpoint: `http://${jaegerHost}:${jaegerPort}`,
            agentHost: jaegerHost,
            agentPort: parseInt(jaegerPort),
        });

        this.sdk = new NodeSDK({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
                [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
                [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || "1.0.0",
            }),
            traceExporter: exporter,
            instrumentations: [
                new HttpInstrumentation(),
                new ExpressInstrumentation(),
                new PgInstrumentation(),
                new RedisInstrumentation(),
            ],
        });

        this.sdk.start();

        this.tracer = trace.getTracer(serviceName);

        process.on("SIGTERM", () => {
            this.shutdown();
        });

        console.log(`Tracing initialized for ${this.serviceName}`);
    }

    getTracer() {
        return this.tracer;
    }

    startSpan(name, options = {}) {
        if (!this.tracer) {
            return {
                end: () => {},
                setAttribute: () => {},
                addEvent: () => {},
                setStatus: () => {},
            };
        }

        const span = this.tracer.startSpan(name, {
            kind: options.kind || 0,
            attributes: options.attributes || {},
        });

        return {
            end: endTime => span.end(endTime),
            setAttribute: (key, value) => span.setAttribute(key, value),
            addEvent: (name, attributes) => span.addEvent(name, attributes),
            setStatus: (code, message) => span.setStatus({ code, message }),
            context: () => span.spanContext(),
        };
    }

    withSpan(name, fn, options = {}) {
        if (!this.tracer) {
            return fn();
        }

        return this.tracer.startActiveSpan(name, options, async span => {
            try {
                const result = await fn(span);
                span.setStatus({ code: SpanStatusCode.OK });
                return result;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error.message,
                });
                span.recordException(error);
                throw error;
            } finally {
                span.end();
            }
        });
    }

    addSpanAttribute(key, value) {
        const span = trace.getSpan(context.active());
        if (span) {
            span.setAttribute(key, value);
        }
    }

    addSpanEvent(name, attributes = {}) {
        const span = trace.getSpan(context.active());
        if (span) {
            span.addEvent(name, attributes);
        }
    }

    shutdown() {
        if (this.sdk) {
            return this.sdk.shutdown();
        }
    }
}

const tracingInstances = new Map();

const getTracing = serviceName => {
    if (!tracingInstances.has(serviceName)) {
        tracingInstances.set(serviceName, new TracingService(serviceName));
    }
    return tracingInstances.get(serviceName);
};

const tracingMiddleware = serviceName => {
    const tracing = getTracing(serviceName);

    return (req, res, next) => {
        const span = tracing.startSpan(`${req.method} ${req.path}`, {
            attributes: {
                "http.method": req.method,
                "http.url": req.url,
                "http.target": req.path,
                "http.host": req.headers.host,
                "http.scheme": "http",
                "user_agent.original": req.headers["user-agent"],
                "x-correlation-id": req.headers["x-correlation-id"],
            },
        });

        const originalEnd = res.end;
        res.end = function (...args) {
            span.setAttribute("http.status_code", res.statusCode);

            if (res.statusCode >= 400) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: `HTTP ${res.statusCode}`,
                });
            }

            span.end();
            originalEnd.apply(res, args);
        };

        next();
    };
};

module.exports = {
    TracingService,
    getTracing,
    tracingMiddleware,
};
