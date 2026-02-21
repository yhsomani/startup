export interface ServiceConfig {
    name: string;
    host: string;
    port: number;
    protocol?: string;
    healthCheck?: string;
    timeout?: number;
    retryAttempts?: number;
}

export interface ServiceRegistry {
    services: Map<string, ServiceConfig>;
    register(service: ServiceConfig): void;
    getService(name: string): ServiceConfig | undefined;
    getAllServices(): ServiceConfig[];
    removeService(name: string): boolean;
}

export interface RequestContext {
    correlationId: string;
    userId?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    resetTimeout: number;
}

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
}

export interface ErrorResponse {
    error: string;
    message: string;
    code?: string;
    correlationId?: string;
    details?: any;
}

export interface SuccessResponse<T = any> {
    data: T;
    message?: string;
    correlationId?: string;
}

export interface LogEntry {
    level: "debug" | "info" | "warn" | "error";
    message: string;
    timestamp: number;
    service: string;
    correlationId?: string;
    metadata?: Record<string, any>;
}

export interface HealthCheckResult {
    status: "healthy" | "unhealthy" | "degraded";
    checks: Record<string, { status: string; message?: string }>;
    timestamp: number;
    duration: number;
}

export interface CacheOptions {
    ttl: number;
    prefix?: string;
    enableCompression?: boolean;
}

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    maxConnections?: number;
    idleTimeoutMs?: number;
    connectionTimeoutMs?: number;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    tls?: boolean;
}

export interface RabbitMQConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    vhost?: string;
    prefetch?: number;
}

export interface JWTConfig {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer?: string;
    audience?: string;
}

export interface AuthUser {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    iat?: number;
    exp?: number;
}
