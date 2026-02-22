# TalentSphere Engineering Master Document (SSOT)

> **Single Source of Truth** - This document is the authoritative reference for all technical architecture and
> development guidelines. All other documentation should link to this document.

---

## 1. Project Overview

TalentSphere is a high-growth edtech platform designed to seamlessly integrate learning management, coding challenges,
professional networking, and recruitment. The system leverages a polyglot microservices backend and a Micro-Frontend
(MFE) architecture to allow isolated scaling and rapid feature delivery.

---

## 2. Architecture Overview

The platform operates on an event-driven, microservices architecture:

| Layer              | Technology                         | Purpose                                           |
| ------------------ | ---------------------------------- | ------------------------------------------------- |
| **Frontend**       | React + TypeScript + Vite          | Micro-Frontends via pnpm workspaces               |
| **Backend**        | Node.js, Spring Boot, .NET, Python | Polyglot microservices mesh                       |
| **API Gateway**    | Express + Nginx                    | Central ingress, rate limiting, routing           |
| **Event Bus**      | RabbitMQ                           | Async communication (gamification, notifications) |
| **Data**           | PostgreSQL, Redis, Elasticsearch   | Relational data, caching, search                  |
| **Infrastructure** | Docker, Kubernetes, Vault          | Containerization and secrets management           |

---

## 3. Folder Structure

```
/
├── backends/                  # Polyglot backend microservices
│   ├── api-gateway/          # Central ingress, rate limiting, routing
│   ├── backend-enhanced/     # Core Node.js services (Auth, Network, Jobs, Video)
│   ├── backend-springboot/  # Java LMS domain (Courses, Enrollments)
│   ├── backend-dotnet/       # C# Domain (Challenges, Payments, Discussions)
│   ├── backend-flask/        # Python Domain (AI, Data Processing)
│   ├── backend-gamification/ # Python consumer for event-based gamification
│   └── shared/              # Shared libraries, auth middleware, templates
├── frontend/                 # PNPM Monorepo for UI
│   ├── ts-mfe-shell/        # App Shell / Host Application
│   ├── ts-mfe-lms/          # Learning Management System MFE
│   ├── ts-mfe-challenge/    # Coding Challenge MFE
│   └── packages/            # Shared UI components, API clients
├── infrastructure/           # Docker compose and configs
├── k8s/                     # Kubernetes manifests
├── database/                 # Schemas, migrations, optimization scripts
├── shared/                   # Shared Node.js utilities
└── scripts/                  # CI/CD, validation, testing scripts
```

---

## 4. Shared Libraries (`shared/`)

| File                          | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `logger.js`                   | Winston-based structured logging        |
| `error-handler.js`            | Centralized error handling              |
| `metrics.js`                  | Prometheus metrics collection           |
| `tracing.js`                  | OpenTelemetry distributed tracing       |
| `health-check.js`             | Health check endpoints                  |
| `graceful-shutdown.js`        | SIGTERM handling                        |
| `cache-middleware.js`         | Redis API caching                       |
| `rate-limiter.js`             | Token bucket rate limiting              |
| `request-throttler.js`        | Request throttling with delay           |
| `consistent-hashing.js`       | Hash ring for stateful routing          |
| `database-sharding.js`        | Application-level DB sharding           |
| `citus-connection.js`         | Citus distributed database client       |
| `feature-flags.js`            | Feature flag service                    |
| `api-versioner.js`            | API versioning middleware               |
| `version-manager.js`          | Version lifecycle management            |
| `validation-middleware.js`    | Input validation & sanitization         |
| `distributed-lock.js`         | Redis distributed locking               |
| `audit-logger.js`             | API audit trail                         |
| `api-response.js`             | Standardized response wrapper           |
| `config-reloader.js`          | Hot config reloading                    |
| `webhook-handler.js`          | Outbound webhooks with retry            |
| `idempotency-middleware.js`   | Duplicate request prevention            |
| `batch-handler.js`            | Batch request processing                |
| `retry-handler.js`            | Exponential backoff retry               |
| `multi-tenancy.js`            | Tenant isolation for SaaS               |
| `service-dependency-graph.js` | Service dependency visualization        |
| `usage-analytics.js`          | API usage tracking                      |
| `deprecation-manager.js`      | API deprecation tracking                |
| `advanced-circuit-breaker.js` | Circuit breaker with half-open          |
| `etag-cache.js`               | HTTP ETag caching                       |
| `graphql/`                    | GraphQL service, resolvers, datasources |
| `service-registry.js`         | Service discovery                       |
| `security.js`                 | Security utilities                      |

```
└── scripts/ # CI/CD, validation, testing scripts

```

---

## 5. Feature-to-Code Mapping

| Feature                       | Frontend MFE       | Backend Service(s)                                | Primary Data Entities           |
| ----------------------------- | ------------------ | ------------------------------------------------- | ------------------------------- |
| **User Authentication**       | `ts-mfe-shell`     | `backend-enhanced/auth-service`                   | Users, RefreshTokens            |
| **Learning Management (LMS)** | `ts-mfe-lms`       | `backend-springboot` (Primary)                    | Course, Lesson, Enrollment      |
| **Coding Challenges**         | `ts-mfe-challenge` | `backend-dotnet` (Primary)                        | Challenge, Submission           |
| **Networking & Jobs**         | `ts-mfe-shell`     | `backend-enhanced/network-service`, `job-service` | Connections, Jobs, Applications |
| **Gamification**              | `ts-mfe-shell`     | `backend-gamification` (Event Consumer)           | Leaderboard, Points             |
| **Video & Interviews**        | `ts-mfe-shell`     | `backend-enhanced/video-service`                  | Video VOD, WebRTC Sessions      |
| **AI Assistant**              | `ts-mfe-lms`       | `backend-flask`, `backend-assistant`              | AI Conversations                |
| **Payments**                  | `ts-mfe-shell`     | `backend-dotnet` (Stripe)                         | Subscriptions, Invoices         |
| **Analytics**                 | `ts-mfe-shell`     | `backend-analytics`                               | Events, Metrics                 |

---

## 6. API / Route Documentation

| Path                   | Service            | Port |
| ---------------------- | ------------------ | ---- |
| `/api/v1/auth/*`       | auth-service       | 3001 |
| `/api/v1/jobs/*`       | job-service        | 3002 |
| `/api/v1/courses/*`    | backend-springboot | 3003 |
| `/api/v1/challenges/*` | backend-dotnet     | 3006 |

---

## 6.1 API Gateway Architecture

The API Gateway (`api-gateway/index.js`) is the single entry point for all frontend requests.

### Features

| Feature             | Implementation                                        |
| ------------------- | ----------------------------------------------------- |
| **Routing**         | http-proxy-middleware to backend services             |
| **Authentication**  | JWT validation, strips token, adds `x-user-id` header |
| **Rate Limiting**   | Redis-backed (distributed)                            |
| **CORS**            | Centralized CORS middleware                           |
| **Correlation IDs** | `x-correlation-id` header for distributed tracing     |
| **Circuit Breaker** | Implemented in `api-gateway/circuit-breaker.js`       |
| **Security**        | Helmet.js, compression                                |

### Routing by Domain

| Path Pattern           | Target Service          | Domain     |
| ---------------------- | ----------------------- | ---------- |
| `/api/v1/auth/*`       | auth-service:3001       | Identity   |
| `/api/v1/jobs/*`       | job-service:3002        | Jobs       |
| `/api/v1/courses/*`    | backend-springboot:8080 | LMS        |
| `/api/v1/challenges/*` | backend-dotnet:5000     | Challenges |
| `/api/v1/ai/*`         | backend-flask:5000      | AI         |

### Request Flow

```

Frontend → API Gateway → [Auth] → [Rate Limit] → [Circuit Breaker] → [Proxy] → Backend Service ↓ Correlation ID
Injection

```

---

## 7. Circuit Breaker Pattern

The system uses Circuit Breaker to prevent cascading failures.

### API Gateway (Node.js)

- Implementation: `api-gateway/circuit-breaker.js`
- Library: Custom implementation with state machine (CLOSED, OPEN, HALF_OPEN)
- Config: failureThreshold: 5, resetTimeout: 60s, timeout: 5s

### Spring Boot (Java)

- Implementation: Resilience4j
- Dependency: `resilience4j-spring-boot3`
- Configuration: `application.properties`

### .NET (C#)

- Implementation: Polly
- Package: `Microsoft.Extensions.Http.Polly`

### Best Practices

- Timeout separation: HTTP timeout < Circuit Breaker timeout
- Do NOT apply to async queues (RabbitMQ)
- Fallback responses for degraded service

| `/api/v1/gamification/*` | backend-gamification | 3004 | | `/api/v1/assistant/*` | backend-assistant | 3005 |

**OpenAPI Specifications**: Located in service-specific `/api/` directories. Access Swagger UI via
`/api/swagger-ui.html` when running.

---

## 7.1 Configuration & Environment Setup

### Prerequisites

- Docker & Docker Compose
- Node.js (v18+) & `pnpm`
- Java 17 (for Spring Boot)
- .NET 8 SDK
- Python 3.10+

### Local Setup Steps

1. **Environment Variables**: Copy `.env.example` to `.env`. Run `node scripts/generate-secrets.js` to populate secure
   keys.

2. **Infrastructure**:

   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis rabbitmq vault
   ```

````

3. **Backend Services**: Run `node scripts/start-services.js` to spin up the API gateway and Node services.

4. **Frontend**:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

---

## 8. Database & External Services

| Service             | Purpose                          | Connection                            |
| ------------------- | -------------------------------- | ------------------------------------- |
| **PostgreSQL**      | Primary data store               | `postgresql://user:pass@host:5432/db` |
| **Redis**           | Caching, sessions, rate limiting | `redis://host:6379`                   |
| **RabbitMQ**        | Event-driven communication       | `amqp://guest:guest@host:5672`        |
| **HashiCorp Vault** | Secrets management               | Configured in `vault.hcl`             |
| **CDN**             | Static assets, media delivery    | Configure `CDN_URL` env var           |

## 7.2 CDN Architecture

The system uses **Push/Pull Edge Caching Pattern** for static and dynamic content.

### Frontend Static Assets (Push Pattern)

- Configure `CDN_URL` environment variable in `.env`
- MFEs configured with CDN base URL in `vite.config.ts`:
  ```env
  CDN_URL=https://cdn.talentsphere.com/ts-mfe-shell/
  ```
- Vite builds use content hashes for cache-busting: `main-a3b4c.js`

### User-Generated Media (Pull Pattern)

- File service uploads to cloud storage (S3/GCS)
- Returns CDN URL: `https://media.talentsphere.com/{path}`
- Append timestamp/hash to user uploads to prevent stale cache

### Nginx Edge Caching

- Static assets: `Cache-Control: public, max-age=31536000, immutable`
- API routes: `Cache-Control: no-store, no-cache, must-revalidate`
- CORS headers configured for CDN domain

## 7.1 Caching Architecture

The system uses **Distributed Cache-Aside Pattern** with Redis.

### Node.js Services

- Use `services/shared/talentsphere-cache.js` or `backends/backend-enhanced/shared/redis-client.js`
- Default TTL: 300s (5 minutes)
- Key naming: `{service}:{entity}:{id}` (e.g., `jobs:job:123`)

### Spring Boot (LMS)

- Configure in `application.properties`:
  ```properties
  spring.cache.type=redis
  spring.data.redis.host=${REDIS_HOST}
  spring.cache.redis.time-to-live=3600000
  ```
- Use `@EnableCaching` annotation on main class
- Use `@Cacheable(value = "courses", key = "#id")` on service methods
- Use `@CacheEvict` to invalidate on updates

---

## 7.2 Message Queue Architecture

The system uses **Transactional Outbox Pattern** with RabbitMQ.

### Exchange Structure

- **Exchange**: `talentsphere.events` (topic)
- **Queues**: `gamification.queue`, `notification.queue`, etc.
- **DLQ**: `gamification.dlq`, etc.

### Publisher (Spring Boot)

- Uses `OutboxEvent` entity to save events atomically with business data
- `OutboxProcessor` reads pending events and publishes to RabbitMQ

### Consumer (Python/Node/.NET)

- Uses idempotency check (message ID tracking)
- DLQ support for failed messages (max 3 retries)
- Explicit ACK after successful processing

### Event Contracts

- Defined in `shared-contracts/events/`
- JSON Schema for: `UserRegistered`, `UserLogin`, `CourseCompleted`, `LessonCompleted`, `ChallengeSubmitted`
- All events include `messageId` (UUID) and `timestamp`

### Pub/Sub Architecture

The system uses **Topic Exchange** (`talentsphere.events`) for Pub/Sub.

**Publisher Pattern:**

- Use `EventPublisher` class to publish to exchange (not queue)
- Format: `{ eventId, timestamp, data }`
- Persistent messages with delivery mode 2

**Subscriber Pattern:**

- Each service creates dedicated queue
- Bind to exchange with routing keys (e.g., `user.*`, `lms.course.*`)
- Use wildcards for multiple events

### Routing Keys

| Event               | Routing Key            | Format                       |
| ------------------- | ---------------------- | ---------------------------- |
| User Registered     | `auth.user.registered` | `<domain>.<entity>.<action>` |
| User Login          | `auth.user.login`      | `<domain>.<entity>.<action>` |
| Course Completed    | `lms.course.completed` | `<domain>.<entity>.<action>` |
| Lesson Completed    | `lms.lesson.completed` | `<domain>.<entity>.<action>` |
| Challenge Submitted | `challenges.submitted` | `<domain>.<entity>.<action>` |

### Routing Key Taxonomy

See `shared-contracts/ROUTING_KEY_TAXONOMY.md` for complete list.

---

## 7.3 Database Sharding (Citus)

The system uses **Citus** for horizontal scaling of PostgreSQL.

### Cluster Architecture

| Node Type   | Name                 | Purpose                             |
| ----------- | -------------------- | ----------------------------------- |
| Coordinator | `citus-coordinator`  | Query routing, distributed planning |
| Worker 1-3  | `citus-worker-0/1/2` | Data storage and parallel execution |

### Sharding Strategy

| Table Type          | Shard Key    | Shard Count | Reason                               |
| ------------------- | ------------ | ----------- | ------------------------------------ |
| **Users**           | `id` (UUID)  | 32          | User-centric joins, high cardinality |
| **User Profiles**   | `user_id`    | Colocated   | Always join with users               |
| **Experiences**     | `user_id`    | Colocated   | User-centric lookups                 |
| **Education**       | `user_id`    | Colocated   | User-centric lookups                 |
| **Job Listings**    | `company_id` | 16          | Company-centric queries              |
| **Events**          | `timestamp`  | 64          | Time-range queries                   |
| **User Activities** | `timestamp`  | 64          | Time-series analysis                 |

### Reference Tables (Replicated)

These small tables are replicated to all workers for fast joins:

- `skills`, `languages`, `companies`

### Migration

Run the sharding migration after base schema:

```bash
psql -h citus-coordinator -U talentsphere -f database/migrations/008_implement_sharding.sql
```

### Query Rules (CRITICAL)

**MUST include shard key in WHERE clause:**

```javascript
// ✅ GOOD - Routes to single shard
const user = await db.query("SELECT * FROM users WHERE id = $1", [userId]);

// ✅ GOOD - Time-range query
const events = await db.query("SELECT * FROM events WHERE timestamp > $1", [startDate]);

// ❌ BAD - Broadcasts to ALL shards (slow)
const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
```

For non-shard-key queries, use Elasticsearch or aggregate offline.

### Constraints

1. **UUIDs Required**: All distributed tables must use UUID primary keys (not auto-increment)
2. **No Cross-Shard Joins**: Don't join tables with different distribution keys
3. **Global Aggregations**: Use RabbitMQ + Elasticsearch for cross-shard analytics

### Kubernetes Deployment

```bash
kubectl apply -f k8s/citus.yaml
```

### Initialization

```bash
# Run sharding setup
./scripts/citus-init.sh
```

### Connection

All services connect to the coordinator node:

```javascript
const { getCitusConnection } = require("./shared/citus-connection");
const db = getCitusConnection();
await db.initialize();
```

### Monitoring

```sql
-- Check cluster health
SELECT * FROM citus_get_active_worker_nodes();

-- View shard distribution
SELECT * FROM citus_shards;
```

---

## 9. Observability

The system uses **Prometheus + Grafana + Jaeger** for metrics, logging, and distributed tracing.

### Metrics (Prometheus)

Deploy Prometheus:

```bash
kubectl apply -f k8s/prometheus.yaml
```

**Available Metrics:** | Metric | Type | Description | |--------|------|-------------| | `http_request_duration_seconds`
| Histogram | HTTP request latency | | `http_requests_total` | Counter | Total HTTP requests | |
`http_requests_in_flight` | Gauge | Active requests | | `db_query_duration_seconds` | Histogram | Database query latency
| | `cache_hits_total` / `cache_misses_total` | Counter | Cache performance | | `queue_messages_processed_total` |
Counter | Queue processing |

**Use in Node.js:**

```javascript
const { getMetrics } = require("./shared/metrics");

const metrics = getMetrics("my-service");
app.use(metrics.middleware());

// Track custom metrics
const dbTracker = metrics.trackDbQuery("SELECT", "users");
await db.query("SELECT * FROM users");
dbTracker.end();
```

### Alerts

Deploy alert rules:

```bash
kubectl apply -f k8s/prometheus-alerts.yaml
```

**Critical Alerts:**

- `ServiceDown` - Service instance down
- `HighErrorRate` - 5xx errors > 5%
- `CriticalLatencyP95` - P95 > 5s
- `CircuitBreakerOpen` - Circuit breaker open

### Dashboards (Grafana)

Import `k8s/grafana-dashboard.json` into Grafana.

**Panels:**

- Requests/sec (gauge)
- P95 Latency (gauge)
- Success Rate (gauge)
- Requests by Route (timeseries)
- Database Query Latency (timeseries)
- Cache Hit Rate (timeseries)
- Memory/CPU Usage (timeseries)

### Distributed Tracing (Jaeger)

Deploy Jaeger:

```bash
kubectl apply -f k8s/jaeger.yaml
```

Access UI: `http://jaeger:16686`

**Use in Node.js:**

```javascript
const { getTracing, tracingMiddleware } = require("./shared/tracing");

const tracing = getTracing("my-service");
tracing.initialize();

app.use(tracingMiddleware("my-service"));
```

**Auto-instrumented:**

- HTTP requests/responses
- Express routes
- PostgreSQL queries
- Redis operations

**Manual spans:**

```javascript
const span = tracing.startSpan("my-operation", {
  attributes: { "custom.key": "value" },
});
// ... do work ...
span.end();
```

---

## 10. Security

The system uses defense-in-depth with multiple security layers.

### Kubernetes Security Policies (Kyverno)

Deploy policies:

```bash
kubectl apply -f k8s/kyverno-policies.yaml
```

**Enforced Policies:** | Policy | Description | |--------|-------------| | `require-non-root-user` | Containers must run
as non-root (UID > 10000) | | `disallow-privileged-containers` | No privileged containers | | `disallow-capabilities` |
Drop all capabilities | | `require-readonly-rootfs` | Read-only root filesystem | | `restrict-host-path` | No host path
mounts | | `require-labels` | Require environment/team labels |

### Network Policies

Deploy network isolation:

```bash
kubectl apply -f k8s/network-policies.yaml
```

**Policy Structure:**

- Deny all ingress/egress by default
- Allow API Gateway → Backend
- Allow Backend → Database/Cache
- Allow Backend → RabbitMQ

### CI/CD Security Scanning

The security scanning workflow runs on every push:

```bash
# Triggered on:
# - push to main/develop
# - pull_request to main
# - schedule (daily at 2 AM)
```

**Scans Performed:** | Tool | Target | Severity | |------|--------|----------| | TruffleHog | Secrets in code | All | |
npm audit | Dependencies | Moderate+ | | Snyk | Dependencies/Code | Medium+ | | CodeQL | Code analysis | Security | |
Trivy | Container images | Critical/High | | Kubescape | K8s manifests | Medium+ |

### API Security

The API Gateway includes:

- Helmet.js security headers
- Rate limiting (100 req/15min default)
- Stricter limits for auth endpoints (10 req/15min)
- JWT token validation
- CORS configuration

---

## 11. Service Discovery

The system uses **Kubernetes Native Discovery** (recommended).

### Kubernetes CoreDNS (Server-Side Discovery)

All services define K8s Services which register in CoreDNS:

| Service     | K8s Service Name    | DNS                                                |
| ----------- | ------------------- | -------------------------------------------------- |
| Spring Boot | `lms-service`       | `lms-service.talentsphere.svc.cluster.local`       |
| .NET        | `challenge-service` | `challenge-service.talentsphere.svc.cluster.local` |
| Flask       | `flask-service`     | `flask-service.talentsphere.svc.cluster.local`     |
| Node.js     | `auth-service`      | `auth-service.talentsphere.svc.cluster.local`      |

### Custom Registry (Alternative)

For non-K8s environments, use Redis-backed registry:

- Implementation: `services/shared/service-registry.js`
- Self-registration on startup
- Heartbeat every 15 seconds
- TTL: 30 seconds

### Best Practices

- Use K8s DNS names in API Gateway routing
- Inter-service communication via DNS names
- No hardcoded IPs

---

### .NET (Challenges)

- Configure `IDistributedCache` in `Program.cs`
- Use `IDistributedCache` with `SetSlidingExpiration`

### Cache Invalidation Strategy

- Use reasonable TTL (never cache permanently)
- Publish events via RabbitMQ for cross-service invalidation

---

## 8. Development Workflow

### Branching Strategy

- **GitFlow**: Feature branches off `develop`, merge to `main` for production
- **Commits**: Enforced via `commitlint.config.js` and Husky hooks

### Code Quality

| Layer    | Tool              | Config                        |
| -------- | ----------------- | ----------------------------- |
| Frontend | ESLint + Prettier | `.eslintrc.js`, `.prettierrc` |
| Node.js  | ESLint            | `.eslintrc.js`                |
| Python   | flake8, black     | `setup.cfg`, `pyproject.toml` |
| .NET     | ReSharper         | Solution-level config         |

### Testing

- **E2E**: Playwright (`frontend/ts-mfe-shell/playwright.config.ts`)
- **Unit**: Jest (Node), PyTest (Python), xUnit (.NET)

---

## 9. Deployment Instructions

### CI/CD Pipeline

GitHub Actions (`.github/workflows/ci-cd-pipeline.yml`) builds Docker images on merges to `main`.

### Kubernetes Deployment

```bash
kubectl apply -f k8s/namespaces.yaml
kubectl apply -f k8s/configs/configmaps.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## 10. Known Issues / Technical Debt

| Issue                       | Description                                                | Status                              |
| --------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| **Polyglot Redundancy**     | Courses/Challenges overlap across Spring Boot, .NET, Flask | ✅ Done                             |
| **EnhancedSecurityManager** | 716-line monolithic class                                  | Low priority                        |
| **Legacy Gateways**         | Deprecated gateway files exist                             | ✅ Done (no deprecated files found) |

### Polyglot Domain Overlap Resolution Strategy

#### Completed Actions

| Domain          | Owner       | Action Taken                                      |
| --------------- | ----------- | ------------------------------------------------- |
| **Courses**     | Spring Boot | ✅ Deleted Flask routes, Deleted .NET controllers |
| **Lessons**     | Spring Boot | ✅ Deleted Flask routes, Deleted .NET controllers |
| **Enrollments** | Spring Boot | ✅ Deleted .NET controllers                       |
| **Sections**    | Spring Boot | ✅ Deleted .NET controllers                       |

#### Domain Ownership (Post-Migration)

| Domain          | Owner       | Route                   |
| --------------- | ----------- | ----------------------- |
| **Courses**     | Spring Boot | `/api/v1/courses/*`     |
| **Lessons**     | Spring Boot | `/api/v1/lessons/*`     |
| **Enrollments** | Spring Boot | `/api/v1/enrollments/*` |
| **Challenges**  | .NET        | `/api/v1/challenges/*`  |
| **Progress**    | Spring Boot | `/api/v1/progress/*`    |

---

- Test with existing clients

2. **Phase 2: Disable .NET Routes (Courses)**
   - Comment out `/api/courses/*` in `backend-dotnet`
   - Update API Gateway routing
   - Verify no data corruption

3. **Phase 3: Disable Flask Routes (Challenges)**
   - Comment out `/api/v1/challenges/*` in Flask
   - Route to .NET only
   - Migrate any unique Flask features to .NET

4. **Phase 4: Remove Dead Code**
   - Delete deprecated routes from Flask and .NET
   - Remove duplicate database models
   - Update SSOT to reflect single owner per domain

#### API Gateway Routing (Post-Migration)

```yaml
/api/v1/courses/*    -> backend-springboot:8080 /api/v1/lessons/*    -> backend-springboot:8080 /api/v1/enrollments/* ->
backend-springboot:8080 /api/v1/progress/*   -> backend-springboot:8080 /api/v1/challenges/* -> backend-dotnet:3006
/api/v1/submissions/* -> backend-dotnet:3006
```

---

## 11. Code Optimization Status

### Fixed Issues

| #   | File                                            | Issue                          | Status      |
| --- | ----------------------------------------------- | ------------------------------ | ----------- |
| 1   | `shared/rate-limiter.js`                        | Unused dead code (781 lines)   | ✅ Archived |
| 2   | `shared/input-validator.js`                     | Unused dead code (753 lines)   | ✅ Archived |
| 3   | `backends/shared/secure-database-connection.js` | Memory leaks from timers       | ✅ Fixed    |
| 4   | `services/shared/service-discovery.js`          | Memory leaks from setInterval  | ✅ Fixed    |
| 5   | `backends/backend-gamification/consumer.py`     | No RabbitMQ prefetch           | ✅ Fixed    |
| 6   | `shared/redis-cache.js`                         | Pipeline error handling        | ✅ Fixed    |
| 7   | `backends/shared/auth-middleware.js`            | JWT verification without cache | ✅ Fixed    |

### Security Status

- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities
- ✅ JWT secrets properly handled
- ✅ Circuit breaker pattern implemented

---

## 12. Quick Reference

### Service Ports

| Service           | Port |
| ----------------- | ---- |
| API Gateway       | 3000 |
| Auth Service      | 3001 |
| Job Service       | 3002 |
| LMS (.NET)        | 3003 |
| Gamification      | 3004 |
| AI Assistant      | 3005 |
| Challenges (.NET) | 3006 |

### Key Dependencies

| Package      | Version | Purpose           |
| ------------ | ------- | ----------------- |
| express      | ^4.x    | Web framework     |
| ioredis      | ^5.x    | Redis client      |
| pg           | ^8.x    | PostgreSQL client |
| jsonwebtoken | ^9.x    | JWT handling      |
| helmet       | ^7.x    | Security headers  |
| winston      | ^3.x    | Logging           |

---

## 12. API Versioning

The API supports multiple versioning strategies.

### Versioning Strategies

| Strategy               | Example                | Config               |
| ---------------------- | ---------------------- | -------------------- |
| **Path** (recommended) | `/api/v1/users`        | `strategy: 'path'`   |
| Header                 | `Accept-Version: v1`   | `strategy: 'header'` |
| Query                  | `/api/users?version=1` | `strategy: 'query'`  |

### Version Lifecycle

| Version | Status     | Released   | Deprecated | Sunset     |
| ------- | ---------- | ---------- | ---------- | ---------- |
| v1      | Deprecated | 2024-01-01 | 2025-01-01 | 2025-06-01 |
| v2      | Active     | 2025-01-01 | -          | -          |

### Usage

```javascript
const { versioner } = require("./shared/api-versioner");

app.use(versioner.middleware());
```

### Response Headers

```
API-Version: v2
X-API-Version: v2
Deprecation: api="2025-01-01"
Sunset: 2025-06-01
```

---

## 13. Multi-Region Deployment

### Architecture

```
Region: us-east-1 (Primary)
├── API Gateway (3+ replicas)
├── Citus Coordinator
├── Citus Workers (3x)
├── Redis Cluster
└── RabbitMQ

Region: eu-west-1 (Secondary - Read Replica)
├── API Gateway
├── Citus Replica
└── Redis Replica

Region: ap-southeast-1 (Tertiary - DR)
├── API Gateway
└── Citus Replica
```

### Deployment

```bash
# Apply multi-region config
kubectl apply -f k8s/multi-region.yaml
kubectl apply -f k8s/db-replication.yaml

# Schedule backups
kubectl apply -f k8s/db-replication.yaml  # Contains CronJob
```

### Traffic Routing

- Use AWS Global Accelerator or CloudFlare for latency-based routing
- Primary region handles 100% write traffic
- Secondary/tertiary handle read traffic
- Automatic failover on health check failure

---

## 14. Chaos Engineering

The system uses **LitmusChaos** for resilience testing.

### Experiments

| Experiment         | Target      | Purpose                  |
| ------------------ | ----------- | ------------------------ |
| `pod-delete`       | API Gateway | Test pod restarts        |
| `pod-network-loss` | Backend     | Test network resilience  |
| `pod-cpu-hog`      | Backend     | Test CPU stress handling |
| `pod-delete`       | Database    | Test failover            |

### Deploy Chaos

```bash
# Install LitmusChaos
kubectl apply -f k8s/chaos-experiments.yaml

# Run experiment
kubectl apply -f k8s/chaos-experiments.yaml  # ChaosEngine CRDs
```

### Running Chaos

```bash
# Trigger pod delete chaos
kubectl apply -f - <<EOF
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosRun
metadata:
  name: gateway-chaos-run
  namespace: talentsphere
spec:
  appinfo:
    appns: talentsphere
    applabel: "app=api-gateway"
  chaosServiceAccount: litmus-admin
  experiments:
  - name: pod-delete
EOF
```

---

## 15. Feature Flags

The system uses feature flags for gradual rollouts and A/B testing.

### Usage

```javascript
const { featureFlags } = require("./shared/feature-flags");

await featureFlags.initialize();

// Check if feature is enabled
if (featureFlags.isEnabled("new-dashboard", userId)) {
  // Show new dashboard
}

// A/B testing variant
const variant = featureFlags.getVariant("checkout-redesign", userId, {
  control: "old-checkout",
  variant_a: "new-checkout-v1",
  variant_b: "new-checkout-v2",
});
```

### Configuration

| Flag                 | Enabled | Rollout | Purpose                |
| -------------------- | ------- | ------- | ---------------------- |
| `new-dashboard`      | false   | 0%      | Beta dashboard         |
| `ai-recommendations` | true    | 100%    | AI job recommendations |
| `dark-mode`          | true    | 50%     | Dark mode theme        |
| `new-checkout`       | true    | 10%     | New checkout flow      |

### Features

- **Percentage Rollouts**: Gradually expose to X% of users
- **User Targeting**: Whitelist/blacklist specific users
- **Redis Backend**: Flags stored in Redis for dynamic updates
- **Middleware**: Express middleware for easy integration

---

## 16. Contract Testing

The system uses **Pact** for consumer-driven contract testing.

### Architecture

```
┌─────────────┐     Contract      ┌─────────────┐
│  Consumer   │ ────────────────► │   Provider  │
│ (Frontend)  │                   │ (Backend)   │
└─────────────┘                   └─────────────┘
       │                                 │
       ▼                                 ▼
   /pacts/                      Verify Contracts
```

### Running Tests

```bash
# Run consumer contract tests
npm run test:contract:consumer

# Verify provider contracts
npm run test:contract:provider
```

### Consumer Test Example

```javascript
provider.addInteraction({
  state: "user is authenticated",
  uponReceiving: "a request for current user",
  withRequest: {
    method: "GET",
    path: "/api/v1/users/me",
    headers: { Authorization: "Bearer token" },
  },
  willRespondWith: {
    status: 200,
    body: {
      id: "uuid",
      email: "user@example.com",
    },
  },
});
```

---

## 17. Consistent Hashing

The system uses **Consistent Hashing** for stateful routing at the API Gateway.

### Use Cases

| Service       | Routing Key | Purpose                            |
| ------------- | ----------- | ---------------------------------- |
| Collaboration | `roomId`    | Pin users in same room to same pod |
| Video         | `roomId`    | WebRTC room affinity               |
| Whiteboard    | `boardId`   | Real-time collaborative boards     |

### Architecture

```
                    ┌─────────────────┐
                    │  API Gateway    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         ┌─────────┐   ┌─────────┐   ┌─────────┐
         │ Pod A   │   │ Pod B   │   │ Pod C   │
         │ (Room 1)│   │ (Room 2)│   │ (Room 3)│
         └─────────┘   └─────────┘   └─────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │ Hash Ring       │
                    │ (150 vnodes)    │
                    └─────────────────┘
```

### Usage

```javascript
const { ConsistentHashRing, StatefulServiceRouter } = require("./shared/consistent-hashing");

// Basic ring
const ring = new ConsistentHashRing({ vnodes: 100 });
ring.addNode("pod-1:3000");
ring.addNode("pod-2:3000");
ring.addNode("pod-3:3000");

// Get node for key
const targetPod = ring.getNode("room-123");

// Stateful router with auto-discovery
const router = new StatefulServiceRouter({
  serviceName: "collaboration-service",
  routingKey: "roomId",
});
router.setNodes(["pod-1:3000", "pod-2:3000"]);

// In Express middleware
app.use("/api/v1/collaboration", (req, res, next) => {
  const target = router.getRouteUrl(req);
  req.statefulTarget = target;
  next();
});
```

### Key Features

- **Virtual Nodes (Vnodes)**: 100-150 vnodes per physical node for even distribution
- **Minimal Remapping**: Adding/removing nodes only affects ~1/N of keys
- **Service Registry Integration**: Auto-discovers healthy pods via Redis
- **Health-Aware**: Only routes to healthy instances

### State Rehydration

When a pod crashes and users are reassigned:

1. New pod receives request for `Room A`
2. Pod checks Redis for cached room state
3. Hydrates in-memory state from Redis
4. Continues handling requests

---

## 18. GraphQL API

The system provides a GraphQL API as an alternative to REST for flexible queries.

### Endpoint

```
POST /graphql
WebSocket: /graphql (for subscriptions)
```

### Features

- **Schema-First**: Type-safe API definition
- **Federated**: Schema stitching across polyglot services
- **Subscriptions**: Real-time updates via WebSocket
- **Caching**: Integrated with Redis

### Schema

```graphql
type Query {
  me: User
  job(id: ID!): Job
  jobs(filter: JobFilter): [Job!]!
  courses(category: String): [Course!]!
  search(query: String!): SearchResults!
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!
  createJob(input: JobInput!): Job!
  enrollCourse(courseId: ID!): Enrollment!
  submitChallenge(challengeId: ID!, code: String!): Submission!
}

type Subscription {
  jobUpdated(jobId: ID!): Job!
  newJobAlert: Job!
  leaderboardUpdated(challengeId: ID!): LeaderboardEntry!
}
```

### Data Sources

GraphQL interfaces with existing microservices:

| Domain         | Service           | Port |
| -------------- | ----------------- | ---- |
| Users/Auth     | user-service      | 3001 |
| Jobs/Companies | job-service       | 3002 |
| Courses/LMS    | lms-service       | 3003 |
| Challenges     | challenge-service | 3006 |

### Usage

```javascript
const { graphqlService } = require("./shared/graphql/service");

await graphqlService.initialize(httpServer);
app.use("/graphql", graphqlService.getMiddleware());
```

---

## 19. API Caching

The system uses Redis for API response caching.

### Usage

```javascript
const { cacheMiddleware } = require("./shared/cache-middleware");

cacheMiddleware.setRedisClient(redisClient);
app.use(cacheMiddleware.middleware());

// Invalidate by pattern
await cacheMiddleware.invalidate("/api/v1/users*");

// Invalidate by tag
await cacheMiddleware.cacheTag("users", cacheKey);
await cacheMiddleware.invalidateByTag("users");
```

### Features

- Automatic GET request caching
- Configurable TTL (default 300s)
- Stale-while-revalidate support
- Cache tags for targeted invalidation
- X-Cache headers (HIT/MISS/STALE)

---

## 20. Health Checks

### Endpoints

| Endpoint       | Purpose            | K8s Probe |
| -------------- | ------------------ | --------- |
| `/health`      | Basic liveness     | Liveness  |
| `/ready`       | Dependencies ready | Readiness |
| `/health/deep` | Full diagnostics   | -         |

### Usage

```javascript
const { healthCheck } = require("./shared/health-check");

healthCheck.registerDatabaseCheck("postgres", dbPool);
healthCheck.registerRedisCheck("redis", redisClient);

app.use(healthCheck.middleware());
```

### Response

```json
{
  "status": "ok",
  "service": "user-service",
  "checks": {
    "postgres": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

---

## 21. Graceful Shutdown

Ensures clean shutdown of all connections.

### Usage

```javascript
const { gracefulShutdown } = require("./shared/graceful-shutdown");

gracefulShutdown.registerServer(server);
gracefulShutdown.registerDatabase(dbPool);
gracefulShutdown.registerRedis(redisClient);

gracefulShutdown.start(server);
```

### Handles

- SIGTERM / SIGINT signals
- Uncaught exceptions
- Unhandled promise rejections
- HTTP server close
- Database pool drain
- Redis connection close

---

## 22. Auto Scaling

The system uses **Horizontal Pod Autoscaler (HPA)** for HTTP services and **KEDA** for event-driven workers.

### HPA (HTTP Services)

| Service             | Min Replicas | Max Replicas | CPU Threshold |
| ------------------- | ------------ | ------------ | ------------- |
| API Gateway         | 2            | 20           | 70%           |
| Backend Spring Boot | 2            | 8            | 75%           |
| Backend .NET        | 2            | 8            | 75%           |
| Backend Flask       | 2            | 6            | 70%           |

### KEDA (Event-Driven Workers)

| Worker           | Queue               | Scale Threshold | Max Replicas |
| ---------------- | ------------------- | --------------- | ------------ |
| Gamification     | gamification_events | 50              | 15           |
| Notifications    | notifications       | 100             | 10           |
| Email            | email_queue         | 200             | 5            |
| Video Processing | video_processing    | 10              | 8            |
| Analytics        | analytics_events    | 500             | 10           |

### Resource Requests

All services define requests/limits:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Graceful Shutdown

All services handle SIGTERM for scale-down:

```javascript
process.on("SIGTERM", () => {
  server.close(() => {
    dbPool.end();
    redisClient.quit();
    process.exit(0);
  });
});
```

### Readiness Probes

Prevent traffic to starting pods:

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## 23. Distributed Locking

The system uses Redis-based distributed locks for preventing race conditions.

### Usage

```javascript
const { distributedLock } = require("./shared/distributed-lock");

// Acquire lock
const lock = await distributedLock.acquire("job:process:123", { ttl: 30000 });
try {
  // Process job
} finally {
  await lock.release();
}

// Middleware for endpoint locking
app.post(
  "/api/v1/jobs",
  distributedLock.middleware({
    keyFn: req => `job:create:${req.body.companyId}`,
    ttl: 5000,
  }),
  handler
);
```

### Features

- Auto-release on TTL expiry
- Lua script for atomic release
- Retry mechanism
- Middleware support

---

## 24. Service Mesh (Istio)

The system uses Istio for service mesh capabilities.

### Features

| Feature             | Implementation                     |
| ------------------- | ---------------------------------- |
| **mTLS**            | STRICT mode PeerAuthentication     |
| **Authorization**   | AuthorizationPolicy per service    |
| **Traffic Routing** | VirtualService with canary support |
| **Circuit Breaker** | DestinationRule outlierDetection   |
| **Observability**   | Telemetry with Jaeger/Prometheus   |

### Configuration

```bash
kubectl apply -f k8s/istio-config.yaml
```

### Traffic Management

```yaml
# Canary deployment
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
spec:
  http:
    - name: canary
      match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: api-gateway
            subset: canary
```

---

## 25. Audit Logging

Comprehensive API audit logging for compliance and security.

### Usage

```javascript
const { auditLogger } = require("./shared/audit-logger");

app.use(auditLogger.middleware());

// Log security events
auditLogger.logSecurityEvent({ type: "LOGIN_FAILED", email: "user@example.com" });

// Log data changes
auditLogger.logChange("User", userId, adminUser, oldValue, newValue);
```

### Features

- Request/response tracking
- User identification (IP, agent)
- Sensitive data redaction
- Slow request detection
- Change history

### Redacted Fields

```
password, token, secret, apiKey, authorization, creditCard, ssn
```

---

## 26. API Response Format

Standardized API response wrapper.

### Response Types

```javascript
const { ApiResponse, responseMiddleware } = require('./shared/api-response');

app.use(responseMiddleware);

// Success
res.apiSuccess({ user: {...} });

// Created
res.apiCreated({ id: '123' }, '/api/users/123');

// Paginated
res.apiPaginated(users, { page: 1, limit: 10, total: 100 });

// Errors
res.apiError('Invalid input', 'INVALID_INPUT');
res.apiValidationError([{ field: 'email', message: 'Required' }]);
res.apiNotFound('User');
res.apiUnauthorized();
res.apiForbidden();
res.apiTooManyRequests(60);
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-22T12:00:00Z"
  }
}

{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

---

## 27. Configuration Hot Reloading

Runtime configuration updates without service restart.

### Usage

```javascript
const { configReloader } = require("./shared/config-reloader");

configReloader.loadConfig();
configReloader.watch();

configReloader.onReload((newConfig, oldConfig) => {
  if (oldConfig.redis.host !== newConfig.redis.host) {
    reconnectRedis(newConfig.redis);
  }
});

const currentValue = configReloader.get("database.pool.max");
```

### Features

- JSON config file watching
- Environment variable fallback
- Debounced reload
- Change callbacks

---

## 28. Service Catalog

Kubernetes Service definitions for all microservices.

### Services

| Service              | Port | Tier          | Language |
| -------------------- | ---- | ------------- | -------- |
| api-gateway          | 3000 | gateway       | Node.js  |
| auth-service         | 3001 | backend       | Node.js  |
| job-service          | 3002 | backend       | Node.js  |
| lms-service          | 3003 | backend       | Java     |
| challenge-service    | 3006 | backend       | .NET     |
| notification-service | 3010 | worker        | Node.js  |
| gamification-service | 3004 | worker        | Python   |
| citus-coordinator    | 5432 | database      | -        |
| redis                | 6379 | cache         | -        |
| rabbitmq-service     | 5672 | message-queue | -        |

### Deploy

```bash
kubectl apply -f k8s/service-catalog.yaml
```

---

## 29. Webhooks

Outbound webhooks for external system integration.

### Usage

```javascript
const { webhookHandler } = require('./shared/webhook-handler');

await webhookHandler.send({
    url: 'https://external.com/webhook',
    secret: process.env.WEBHOOK_SECRET,
    event: 'user.created'
}, {
    userId: '123',
    email: 'user@example.com'
});
```

### Features

- HMAC signature verification
- Automatic retry with exponential backoff
- Request timeout
- Duplicate event detection

### Signature Verification

```javascript
const isValid = webhookHandler.verifySignature(payload, signature, secret);
```

---

## 30. Idempotency

Prevents duplicate processing of critical requests.

### Usage

```javascript
const { idempotencyMiddleware } = require('./shared/idempotency-middleware');

app.post('/api/v1/payments',
    idempotencyMiddleware.middleware({ ttl: 86400 }),
    paymentController.process
);
```

### Headers

```
Idempotency-Key: <unique-key>
```

### Response

```json
{
  "transactionId": "txn_123",
  "_idempotent": true,
  "requestId": "req_456"
}
```

---

## 31. Batch Processing

Process multiple API requests in a single call.

### Usage

```javascript
const { batchHandler } = require('./shared/batch-handler');

app.post('/api/batch', batchHandler.middleware(async (req) => {
    return await processRequest(req);
}));

// Request
{
    "requests": [
        { "id": "1", "method": "GET", "path": "/api/users/1" },
        { "id": "2", "method": "POST", "path": "/api/jobs", "body": {...} }
    ]
}

// Response
{
    "results": [...],
    "meta": { "total": 2, "successful": 2, "failed": 0, "duration": 150 }
}
```

### Features

- Concurrent batch processing (10 at a time)
- Per-request timeout
- Result ordering
- Error handling per request

---

## 32. Retry Mechanism

Exponential backoff for failed operations.

### Usage

```javascript
const { retryHandler } = require('./shared/retry-handler');

await retryHandler.execute(async () => {
    return await externalService.call();
}, { logger });
```

### Configuration

```javascript
const retry = new RetryHandler({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
});
```

### Retryable

- Network errors: ECONNRESET, ETIMEDOUT, ECONNREFUSED
- Status codes: 408, 429, 500, 502, 503, 504

---

## 33. Multi-Tenancy

SaaS tenant isolation support.

### Usage

```javascript
const { multiTenancy } = require('./shared/multi-tenancy');

app.use(multiTenancy.middleware({ defaultTenant: 'acme' }));

// In database queries
const { query, params } = multiTenancy.wrapQuery(
    'SELECT * FROM users WHERE id = $1',
    [userId],
    req.tenant.id
);
```

### Resolution Methods

| Method | Example |
|--------|---------|
| Subdomain | `acme.talentsphere.com` |
| Header | `X-Tenant-ID: acme` |

### Features

- Tenant ID in headers
- Row-level security filter
- Schema isolation option

---

## 34. Request Throttling

Adds artificial delay to throttle aggressive clients.

### Usage

```javascript
const { requestThrottler } = require('./shared/request-throttler');

app.use(requestThrottler.middleware({
    delayMs: 100,
    windowMs: 1000,
    maxRequests: 10
}));
```

---

## 35. Service Dependency Graph

Generates visualization of service dependencies.

### Usage

```javascript
const { dependencyGraph } = require('./shared/service-dependency-graph');

dependencyGraph.addService('my-service', {
    type: 'backend',
    dependencies: ['database', 'redis']
});

// Get Mermaid diagram
const mermaid = dependencyGraph.toMermaid();

// Get JSON
const json = dependencyGraph.toJSON();

// Check circular dependencies
const circular = dependencyGraph.findCircularDependencies();

// Get startup order
const order = dependencyGraph.getTopologicalOrder();
```

---

## 36. Usage Analytics

Track API usage for analytics and billing.

### Usage

```javascript
const { usageAnalytics } = require('./shared/share/usage-analytics');

app.use(usageAnalytics.middleware());

// Get today's stats
const stats = await usageAnalytics.getStats();

// Get daily usage for 30 days
const daily = await usageAnalytics.getDailyUsage(30);
```

### Tracked Metrics

- Total requests
- Response time
- HTTP methods
- Status codes
- Top users
- Top endpoints

---

## 37. API Deprecation Manager

Tracks and communicates API deprecation to consumers.

### Usage

```javascript
const { deprecationManager } = require('./shared/deprecation-manager');

deprecationManager.register('/api/v1/users', 'v2', '2025-06-01', '/api/v2/users');
app.use(deprecationManager.middleware());
```

### Headers

```
Deprecation: api="v2"
Sunset: Sat, 01 Jun 2025 00:00:00 GMT
Link: <https://api.talentsphere.com/api/v2/users>; rel="alternate"
```

### Response (when expired)

```json
{
  "error": "Gone",
  "message": "API /api/v1/users has been deprecated and removed"
}
```

---

## 38. Circuit Breaker (Advanced)

Circuit breaker with CLOSED → OPEN → HALF_OPEN states.

### States

| State | Description |
|-------|-------------|
| CLOSED | Normal operation |
| OPEN | Failing, rejecting requests |
| HALF_OPEN | Testing recovery |

### Usage

```javascript
const { CircuitBreaker } = require('./shared/advanced-circuit-breaker');

const breaker = new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000
});

breaker.onStateChange((state) => {
    console.log(`Circuit breaker: ${state}`);
});

await breaker.execute(async () => {
    return await riskyCall();
});
```

---

## 39. ETag Caching

HTTP conditional request support with ETags.

### Usage

```javascript
const { etagCache } = require('./shared/etag-cache');

app.use(etagCache.middleware());
```

### Headers

```
ETag: "abc123"
Last-Modified: 2025-02-23T12:00:00Z
Cache-Control: public, max-age=3600
```

### Conditional Requests

- `If-None-Match`: Returns 304 if ETag matches
- `If-Modified-Since`: Returns 304 if not modified

---

## 40. Implementation Status

### Implemented Services (16/16)

| Service | Status | Description |
|---------|--------|-------------|
| analytics-service | ✅ Complete | Full analytics with 52.99% coverage |
| api-gateway | ✅ Complete | Central ingress, rate limiting |
| application-service | ✅ Complete | Job application management |
| auth-service | ✅ Complete | Authentication & JWT |
| company-service | ✅ Complete | Company management |
| email-service | ✅ Complete | Email notifications |
| file-service | ✅ Complete | File upload/storage |
| job-service | ✅ Complete | Job CRUD operations |
| network-service | ✅ Complete | Professional networking |
| notification-service | ✅ Complete | Real-time notifications |
| search-service | ✅ Complete | Elasticsearch integration |
| user-service | ✅ Complete | User management |
| video-service | ✅ Complete | Video streaming |
| job-listing-service | ✅ Complete | Job listings & recommendations |
| user-profile-service | ✅ Complete | User profiles & skills |
| performance-monitoring | ✅ Complete | APM & metrics |
| messaging-service | ✅ Complete | Real-time messaging |

### Overall Completion: 100% (16/16 services implemented)

### Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Documentation Updates |
| Phase 2 | ✅ Complete | job-listing-service Implementation |
| Phase 3 | ✅ Complete | user-profile-service Implementation |
| Phase 4 | ✅ Complete | Integration and Testing |
| Phase 5 | ✅ Complete | Performance & Security Enhancements |
| Phase 6 | ✅ Complete | Database & Caching Optimization |
| Phase 7 | ✅ Complete | Advanced Features & Improvements |
| Phase 8 | ✅ Complete | Critical Bug Fixes & Inline TODOs |

---

## 41. Project Health Metrics

### Testing Coverage

| Metric | Value |
|--------|-------|
| Test Suites | 4 passing, 0 failed |
| Tests | 38 passing, 0 failed |
| Code Coverage | 52.99% (analytics service) |
| Report Formats | HTML + LCOV + JSON + Badge + Markdown |

### Code Quality

| Tool | Status |
|------|--------|
| ESLint | ✅ Professional standards enforced |
| Prettier | ✅ Automated code style |
| Pre-commit hooks | ✅ Quality gates implemented |
| Babel transformation | ✅ ES6+ module support |
| Jest | ✅ Comprehensive test framework |

### Build & Deployment

| Status | Description |
|--------|-------------|
| ✅ | All services build without errors |
| ✅ | Dependencies resolved correctly |
| ✅ | No broken imports or references |
| ✅ | Configuration validation passes |
| ✅ | Docker-ready service structure |

---

## 42. Business Operations Documentation

Business and operational documentation is maintained in the `business-ops/` directory.

| Document | Description |
|----------|-------------|
| `04_Legal_Registration_Complete.md` | Company registration, incorporation, legal setup |
| `05_Financial_Funding.md` | Financial planning, funding, budget management |
| `07_Team_HR.md` | Team building, HR policies, hiring |
| `08_Branding_Marketing_Sales.md` | Branding, marketing, sales strategies |
| `10_Risks_Compliance_Scaling.md` | Risk management, compliance, scaling plans |

---

## 43. Event Routing Key Taxonomy

All routing keys follow the pattern: `<domain>.<entity>.<action>`

### Domain: Auth (`auth`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `auth.user.registered` | Node.js Auth Service | Gamification, Notification, Analytics | New user registration |
| `auth.user.login` | Node.js Auth Service | Analytics, Security | User login event |
| `auth.user.logout` | Node.js Auth Service | Analytics | User logout event |
| `auth.user.password.changed` | Node.js Auth Service | Notification | Password updated |
| `auth.user.deleted` | Node.js Auth Service | All services | Account deletion |

### Domain: LMS (`lms`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `lms.course.completed` | Spring Boot | Gamification, Notification, Analytics | Course completion |
| `lms.lesson.completed` | Spring Boot | Gamification, Analytics | Lesson completion |
| `lms.enrollment.created` | Spring Boot | Notification, Analytics | New enrollment |
| `lms.enrollment.cancelled` | Spring Boot | Notification, Analytics | Enrollment cancellation |
| `lms.certificate.issued` | Spring Boot | Notification | Certificate earned |
| `lms.progress.updated` | Spring Boot | Analytics | Learning progress update |

### Domain: Challenges (`challenges`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `challenges.submitted` | .NET | Gamification, Analytics | Challenge submission |
| `challenges.approved` | .NET | Notification, Analytics | Challenge approved |
| `challenges.rejected` | .NET | Notification | Challenge rejected |
| `challenges.testcase.passed` | .NET | Analytics | Test case passed |
| `challenges.testcase.failed` | .NET | Analytics | Test case failed |

### Domain: Jobs (`jobs`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `jobs.post.created` | Node.js Job Service | Analytics, Notification | New job posted |
| `jobs.post.updated` | Node.js Job Service | Analytics | Job updated |
| `jobs.post.closed` | Node.js Job Service | Analytics | Job closed |
| `jobs.application.submitted` | Node.js Application Service | Notification, Analytics | Job application |
| `jobs.application.viewed` | Node.js Application Service | Analytics | Application viewed |

### Domain: Network (`network`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `network.connection.requested` | Node.js Network Service | Notification | Connection request |
| `network.connection.accepted` | Node.js Network Service | Analytics | Connection accepted |
| `network.message.sent` | Node.js Network Service | Notification | Direct message sent |

### Domain: Payments (`payments`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `payments.subscription.created` | .NET | Notification, Analytics | New subscription |
| `payments.subscription.cancelled` | .NET | Notification, Analytics | Subscription cancelled |
| `payments.invoice.paid` | .NET | Notification, Analytics | Invoice paid |
| `payments.payment.failed` | .NET | Notification | Payment failed |

### Domain: Gamification (`gamification`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `gamification.points.awarded` | Python | Analytics, Notification | Points awarded |
| `gamification.badge.earned` | Python | Notification, Analytics | Badge earned |
| `gamification.level.up` | Python | Notification | User leveled up |

### Domain: Notification (`notification`)

| Routing Key | Publisher | Subscribers | Description |
| ----------- | --------- | ----------- | ----------- |
| `notification.sent` | Node.js | Analytics | Notification sent |
| `notification.read` | Node.js Analytics | Analytics | Notification read |

---

## 44. Client SDK Documentation

TalentSphere provides multi-language SDKs for easy API integration.

### Supported Languages

| Language | Package | Status |
|----------|---------|--------|
| **TypeScript** | `@talentsphere/api-client` | ✅ |
| **Python** | `talentsphere-client` | ✅ |
| **Java** | `com.talentsphere.client` | ✅ |
| **C#/.NET** | `TalentSphere.Client` | ✅ |
| **Go** | `github.com/talentsphere/client-go` | ✅ |

### Quick Start (TypeScript)

```typescript
import { TalentSphereClient } from '@talentsphere/api-client';
const client = new TalentSphereClient({
  baseURL: 'https://api.talentsphere.com/v1',
  apiKey: process.env.API_KEY
});
```

### SDK Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Automatic JWT token management, token refresh handling |
| **API Coverage** | All REST endpoints across 16 microservices |
| **WebSocket** | Real-time features (Collaboration, Notifications) |
| **Error Handling** | Standardized error types, automatic retry logic |
| **Type Safety** | Generated from OpenAPI spec, compile-time validation |
| **Performance** | Connection pooling, request caching, async/await |

### Generating SDKs

```bash
npm run generate:sdk
npm run generate:sdk -- --lang=typescript
npm run generate:sdk -- --lang=python
```

---

## 45. Documentation Index

Complete list of all documentation files and their locations:

| Document | Location | Description |
|----------|----------|-------------|
| **SSOT (This File)** | `docs/SSOT.md` | Single Source of Truth - all architecture |
| API Reference | `docs/API_REFERENCE.md` | API endpoints specification |
| Development Guide | `docs/DEVELOPMENT.md` | Development setup and practices |
| System Architecture | `docs/SYSTEM.md.bak` | System design and components |
| Operations Guide | `docs/ops/` | Deployment and operations |
| **Routing Taxonomy** | `shared-contracts/ROUTING_KEY_TAXONOMY.md` | Event routing keys |
| **SDK Documentation** | `sdk/README.md` | Client SDK guides |
| **Testing** | `tests/README.md` | Testing documentation |
| **Project Status** | `Task.md` | Implementation TODO list |
| **Alignment Report** | `PROJECT_ALIGNMENT_REPORT.md` | Project health report |
| **Business Ops** | `business-ops/` | Legal, financial, marketing docs |

---

## 46. System Architecture Reference

### Executive Summary

TalentSphere is a comprehensive talent acquisition and professional networking platform built with modern microservices architecture. The platform connects job seekers with employers through intelligent matching, real-time collaboration, and data-driven insights.

### Summary Statistics

| Metric | Count |
|--------|-------|
| Total Backend Services | 17+ |
| Node.js Microservices | 12+ |
| Python Flask Services | 4+ |
| Real-time Services | 1+ |
| Frontend Applications | 2+ |
| Total API Endpoints | 150+ |
| Database Tables | 30+ |
| Database Indexes | 163 |
| Total Lines of Backend Code | 14,000+ |

---

## 47. Backend Services Detail

### Node.js/Express Services (in `backends/backend-enhanced/`)

| Service | Port | Key Endpoints | Features |
|---------|------|---------------|----------|
| Auth Service | 3001 | `/auth/register`, `/auth/login`, `/auth/verify` | JWT, bcrypt, rate limiting |
| User Service | 3002 | `/users/profile`, `/users/skills`, `/users/search` | Profile management, skills |
| Job Service | 3003 | `/jobs`, `/jobs/:id/apply` | Job CRUD, applications |
| Network Service | 3004 | `/network/connections`, `/network/messages` | Connections, messaging |
| Company Service | 3007 | `/companies/:id`, `/companies/register` | Company profiles, reviews |
| Application Service | - | `/applications`, `/applications/:id` | Application lifecycle |
| Notification Service | - | `/notifications` | Real-time WebSocket |
| Search Service | 3008 | `/search`, `/search/recommendations` | Full-text search |
| File Service | 3009 | `/upload/profile-picture`, `/upload/resume` | S3, image processing |
| Analytics Service | 3010 | `/analytics/track`, `/analytics/dashboard` | Event tracking |
| Video Service | 3011 | `/vod/upload`, `/interview/rooms` | HLS streaming, WebRTC |
| Email Service | - | `/email/send`, `/email/templates` | Nodemailer, templates |

### Python/Flask Services

| Service | Port | Purpose |
|---------|------|---------|
| Flask Core | 5000 | Legacy auth, courses, challenges |
| AI Assistant | 5005 | GPT-4 integration (with mock fallback) |
| Recruitment | 5006 | Candidate management, job matching |
| Gamification | 5007 | Badges, points, leaderboards |

### Real-time Collaboration Service

| Port | Technology | Features |
|------|------------|----------|
| 1234 | Flask-SocketIO + Yjs (CRDT) | Collaborative editing, cursor sync |

---

## 48. Technology Stack

### Frontend
- React 18, Material-UI, Redux, React Query
- React + TypeScript + Vite (MFE architecture)

### Backend
- Node.js + Express.js
- Python + Flask
- .NET Core (Challenges, Payments)
- Spring Boot (LMS)

### Database & Cache
- PostgreSQL 14+ (163 indexes, full-text search)
- Redis (caching, rate limiting)
- Elasticsearch (search)

### Real-time
- WebSocket / Socket.io
- Yjs CRDT for collaboration

### Security
- JWT with refresh tokens
- bcrypt password hashing
- Helmet.js security headers

---

## 49. Service Interaction Flows

### User Registration & Authentication
```
Client → API Gateway → Auth Service → Database
                 ↓
          Generate JWT Token
                 ↓
          Return to Client
```

### Job Application Flow
```
Client → API Gateway → Job Service → Database
                 ↓
          Application Service → Database
                 ↓
          Notification Service → User
                 ↓
          Email Service → User Email
```

### Real-time Collaboration Flow
```
Client → WebSocket → Collaboration Service → Yjs CRDT
                                      ↓
                                Sync to All Clients
```

---

## 50. Database Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `profiles` | User profile information |
| `jobs` | Job postings |
| `applications` | Job applications |
| `companies` | Company profiles |
| `skills` | Skills catalog |
| `user_skills` | User skill associations |
| `experiences` | Work experience |
| `education` | Educational background |
| `connections` | Professional connections |
| `messages` | Direct messages |
| `notifications` | User notifications |
| `files` | Uploaded files metadata |
| `analytics_events` | Analytics event tracking |

---

## 51. API Gateway

| Component | Port | Technology |
|-----------|------|------------|
| API Gateway | 8000 | Express + http-proxy |

### Features
- Service routing to all backend services
- CORS configuration
- Rate limiting (Redis-backed)
- Health checks
- Load balancing ready

---

## 52. Security Infrastructure

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT with refresh tokens |
| Password Hashing | bcrypt |
| Rate Limiting | Redis-backed distributed |
| Input Validation | Joi schema validation |
| CORS Protection | Configurable origins |
| Security Headers | Helmet.js |
| SQL Injection | Prepared statements |
| XSS Protection | Input sanitization |

---

## 53. Service Ports Reference

| Service | Port | Status |
|---------|------|--------|
| Flask Core | 5000 | ✅ |
| Auth Service | 3001 | ✅ |
| User Service | 3002 | ✅ |
| Job Service | 3003 | ✅ |
| Network Service | 3004 | ✅ |
| AI Assistant | 5005 | ✅ |
| Recruitment | 5006 | ✅ |
| Gamification | 5007 | ✅ |
| Company Service | 3007 | ✅ |
| Search Service | 3008 | ✅ |
| File Service | 3009 | ✅ |
| Analytics Service | 3010 | ✅ |
| Video Service | 3011 | ✅ |
| Collaboration | 1234 | ✅ |

---

## 54. Implementation Status Summary

### Completion Metrics

| Component | Status | Completion |
|-----------|--------|------------|
| Backend Enhanced Services | 12/12 Operational | 100% ✅ |
| Legacy Flask Services | 4/4 Operational | 100% ✅ |
| Collaboration Service | 1/1 Complete | 100% ✅ |
| Frontend Applications | 2/2 Complete | 100% ✅ |
| Database | Complete Schema | 100% ✅ |
| Security | Enterprise-Grade | 95% ✅ |
| API Gateway | Fully Functional | 100% ✅ |

### Remaining Work

**High Priority (Configuration Only):**
1. OpenAI API Key Configuration - Enable production AI Assistant mode
2. Email Service Provider Integration - Configure SendGrid/Mailgun
3. S3 Bucket Configuration - Set up AWS S3 for file uploads

**Medium Priority:**
1. Load Testing - Performance testing at scale
2. Advanced Search Enhancement - Optional Elasticsearch integration

**Low Priority:**
1. Documentation Refinement - Continuous updates
2. Additional Integrations - LinkedIn, GitHub

---

## Maintenance Guidelines

1. **SSOT Enforcement**: `docs/SSOT.md` is the only location for system-wide architectural documentation.
2. **PR Review Check**: Add checklist item: _"Does this PR require an update to `docs/SSOT.md`?"_
3. **API Documentation**: Use OpenAPI/Swagger (`/api/openapi.yaml`). Do not manually document API routes.
4. **Bi-weekly Audits**: Review technical debt, specifically duplicate Course/Challenge services.

---

## 55. End-to-End (E2E) Testing

### Test Coverage

**Critical User Journeys:**
- ✅ Authentication Flow - Registration, login, logout, password recovery
- ✅ Job Application Process - Search, apply, track applications, save jobs
- ✅ Employer Dashboard - Job posting, candidate management, analytics
- ✅ Performance Testing - Load times, responsiveness, concurrent users

### Browser Coverage
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile devices (iOS/Android)
- Tablet devices
- Dark/Light mode
- Responsive design

### Getting Started

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npm run test:e2e

# Run headed mode (watch browser)
npm run test:e2e:headed

# Generate HTML report
npm run test:e2e:report
```

### Performance Thresholds

| Metric | Threshold |
|--------|-----------|
| Page Load | < 3 seconds |
| API Response | < 2 seconds |
| Search | < 2 seconds |
| File Upload | < 10 seconds |
| Form Submit | < 5 seconds |

### Test Structure

```
tests/e2e/
├── setup.js                 # Global test setup
├── authentication.test.js    # User authentication tests
├── job-application.test.js  # Job application flow tests
├── employer-dashboard.test.js # Employer functionality tests
├── performance.test.js      # Performance tests
├── reports/                 # Test reports
├── screenshots/             # Test screenshots
├── videos/                  # Test videos
└── traces/                  # Test traces
```

### Mobile Testing Viewports
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1280x720
- Large: 1920x1080

---

## 56. Code Coverage Report

### Overall Coverage (analytics-service)

| Metric | Covered | Total | Percentage |
|--------|---------|-------|------------|
| Statements | 248 | 779 | 31.8% |
| Branches | 124 | 400 | 31.0% |
| Functions | 32 | 146 | 21.9% |

### Coverage Status: 🔴 Needs Improvement

### File Coverage

| File | Statements | Branches | Functions |
|------|------------|----------|-----------|
| analytics-service.js | 53.0% | 39.4% | 41.0% |
| api.js | 0.0% | 0.0% | 0.0% |
| server.js | 0.0% | 0.0% | 0.0% |

### Coverage Quality
- **High Coverage (>80%)**: 0 files
- **Medium Coverage (60-80%)**: 0 files
- **Low Coverage (<60%)**: 4 files

### Recommendations
- Aim for at least 80% coverage
- Add tests for low coverage files
- Focus on branch coverage for conditional logic

---

## 57. Development Commands Reference

### Package Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start production server |
| `npm run dev` | Start development server |
| `npm run build` | Build TypeScript |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format with Prettier |
| `npm run test` | Run Jest tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run security:audit` | Run npm audit |

---

## 58. GitHub Actions CI/CD

### Workflows

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Continuous Integration |
| `deploy.yml` | Deployment pipeline |
| `security-scan.yml` | Security scanning |

### CI Pipeline
- Code checkout
- Install dependencies
- Lint and format check
- TypeScript compilation
- Unit tests
- Integration tests
- Build verification

---

## 59. Docker & Kubernetes

### Docker Compose Services
- PostgreSQL database
- Redis cache
- RabbitMQ message broker
- Elasticsearch
- All microservices

### Kubernetes Resources
- Deployments for each service
- Services and Ingress
- ConfigMaps and Secrets
- Horizontal Pod Autoscaling (HPA)
- Service mesh (Istio)

---

## 60. Environment Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (development/production) |
| `PORT` | Server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `OPENAI_API_KEY` | OpenAI API key |

---

## 61. Monitoring & Observability

### Tools
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: Jaeger
- **Alerting**: Prometheus Alerts

### Dashboards
- Service health dashboard
- Performance metrics
- Error rates
- Resource utilization

---

## 62. Disaster Recovery

### Backup Strategy
- Daily automated database backups
- Weekly full system snapshots
- Off-site backup storage
- Backup encryption

### Recovery Procedures
- Database restore procedure
- Service recovery steps
- Rollback procedures
- Communication plan

---

## 65. Business Operations - Financial Planning

### Startup Costs (India)

#### Initial Setup (₹52K - ₹1.45L)

| Expense | Amount (₹) |
|---------|-----------|
| Pvt Ltd Registration | 10,000 - 20,000 |
| DSC (2 directors) | 2,000 - 4,000 |
| Virtual Office | 5,000 - 15,000 |
| Logo & Branding | 5,000 - 25,000 |
| Website & Domain | 5,000 - 20,000 |
| Accounting Software | 300 - 500/month |
| Legal Docs | 5,000 - 15,000 |
| CA Fees | 10,000 - 25,000 |

#### Monthly Operating Costs

**Bootstrap (₹19K - ₹60K/month):**
- Co-working: ₹5-15K
- Internet/Phone: ₹1-2K
- Marketing: ₹5-20K
- Tools: ₹2-5K

**Funded Startup (₹3.15L - ₹8.95L/month):**
- Office: ₹15-50K
- Salaries (3-5 people): ₹2-5L
- Tools: ₹10-25K
- Marketing: ₹50K-2L

---

## 66. Business Operations - HR & Team

### Salary Benchmarks (India 2025)

| Role | Experience | Monthly CTC (₹) | Annual (LPA) |
|------|------------|-----------------|--------------|
| Junior Dev | 0-2 yrs | 30-50K | 4-6L |
| Developer | 2-4 yrs | 50-80K | 6-10L |
| Senior Dev | 4-7 yrs | 80K-1.5L | 10-18L |
| Lead/Manager | 7-10 yrs | 1.2-2L | 15-25L |
| CTO | 10+ yrs | 2-5L | 25-60L |
| Assoc PM | 0-2 yrs | 40-70K | 5-8L |
| PM | 2-5 yrs | 70K-1.3L | 8-15L |
| UI/UX | 0-2 yrs | 25-45K | 3-5.5L |

### City Adjustments
- **Tier 1** (Bengaluru, Mumbai, Delhi): Full salary
- **Tier 2** (Jaipur, Ahmedabad): -20-30%
- **Tier 3/Remote**: -30-40%

### EPF & ESI (Statutory)
- **EPF**: 12% employee + 12% employer contribution
- **ESI**: Applicable for 10+ employees

---

## 67. Business Operations - Branding & Marketing

### Brand Identity Basics

**A brand includes:**
- Visual identity (logo, colors, typography)
- Voice and messaging
- Values and personality
- Customer experience
- Reputation and trust

### Why Branding Matters
- **Differentiation:** Stand out in crowded markets
- **Trust:** Professional branding builds credibility
- **Premium Pricing:** Strong brands can charge more
- **Recognition:** Easier for customers to remember
- **Team Pride:** Employees want to work for brands they're proud of

### Brand Positioning Statement Template
```
For [target customer]
Who [need/opportunity]
[Brand name] is the [category]
That [key benefit/differentiation]
Unlike [competitors]
We [unique value]
```

---

## 68. Business Operations - Risk Management

### Market Risks

**Risk: No Market Need**
- #1 reason startups fail (42%)
- Warning Signs: Low conversion, high churn, lukewarm feedback
- Mitigation: Validate with 50-100 customer interviews, get pre-sales

**Risk: Market Too Small**
- Warning Signs: TAM <$1B, limited growth potential
- Mitigation: Expand market, pivot strategy

### Risk Management Framework
1. Identify risks (team, legal, product, financial)
2. Assess probability and impact
3. Develop mitigation strategies
4. Monitor and review regularly

### Scaling Stages
1. Founder-led sales
2. Early team building
3. Departmental organization
4. Mature company structure

### Exit Strategies
- Acquisition
- IPO
- Bootstrap
- Aquihire
- Shutdown

---

## 69. Business Operations - Legal & Compliance

### Company Registration (India)
- **Pvt Ltd**: Most common for startups
- **LLP**: For service businesses
- **OPC**: For single founder

### Required Registrations
- GST Registration
- EPF Registration
- ESI Registration (10+ employees)
- Professional Tax
- Shop & Establishment Act

### Compliance Checklist
- Annual ROC filings
- Tax returns (GST, Income Tax)
- Statutory audits
- Board meetings (4/year)
- Financial statements

---

## 70. Complete Documentation Index

All documentation files in the TalentSphere project:

| Category | Document | Location |
|----------|---------|----------|
| **Architecture (SSOT)** | Single Source of Truth | `docs/SSOT.md` |
| **Business Ops** | Financial Planning | `business-ops/05_Financial_Funding.md` |
| **Business Ops** | Team & HR | `business-ops/07_Team_HR.md` |
| **Business Ops** | Branding & Marketing | `business-ops/08_Branding_Marketing_Sales.md` |
| **Business Ops** | Risks & Compliance | `business-ops/10_Risks_Compliance_Scaling.md` |
| **Business Ops** | Legal Registration | `business-ops/04_Legal_Registration_Complete.md` |
| **Events** | Routing Taxonomy | `shared-contracts/ROUTING_KEY_TAXONOMY.md` |
| **SDK** | Client SDK Docs | `sdk/README.md` |
| **Testing** | E2E Tests | `tests/e2e/README.md` |
| **Testing** | Test Suite | `tests/README.md` |
| **Coverage** | Coverage Reports | `services/analytics-service/coverage-reports/COVERAGE.md` |
| **Project** | Task List | `Task.md` |
| **Project** | Alignment Report | `PROJECT_ALIGNMENT_REPORT.md` |
| **GitHub** | PR Template | `.github/PULL_REQUEST_TEMPLATE.md` |

---

_Last Updated: February 2026_
````
