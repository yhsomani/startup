# TalentSphere Engineering Master Document (SSOT)

> **Single Source of Truth** - This document is the authoritative reference for all technical architecture and
> development guidelines. All other documentation should link to this document.

---

## Table of Contents

### Part 1: Foundation

1. Project Overview
2. Architecture Overview
3. Folder Structure
4. Shared Libraries
5. Feature-to-Code Mapping
6. API & Service Catalog

### Part 2: Core Patterns

7. Circuit Breaker Pattern
8. Configuration & Environment Setup
9. Database & External Services
10. CDN Architecture
11. Caching Architecture
12. Message Queue Architecture
13. Database Sharding (Citus)

### Part 3: Operations

14. Observability
15. Development Workflow
16. Deployment Instructions
17. Security
18. Known Issues / Technical Debt
19. Service Discovery

### Part 4: Advanced Patterns

20. Code Optimization Status
21. Quick Reference
22. API Versioning
23. Multi-Region Deployment
24. Chaos Engineering
25. Feature Flags
26. Contract Testing
27. Consistent Hashing
28. GraphQL API
29. API Caching
30. Health Checks

### Part 5: Scaling & Resilience

31. Graceful Shutdown
32. Auto Scaling
33. Distributed Locking
34. Service Mesh (Istio)
35. Audit Logging
36. API Response Format
37. Configuration Hot Reloading
38. Final Service Port Map
39. Webhooks
40. Idempotency
41. Batch Processing
42. Retry Mechanism
43. Multi-Tenancy
44. Request Throttling
45. Service Dependency Graph
46. Usage Analytics
47. API Deprecation Manager
48. Circuit Breaker (Advanced)
49. ETag Caching

### Parts 6-9: Extended Topics

50. Implementation Status Summary
51. End-to-End (E2E) Testing
52. Code Coverage Report
53. Development Commands Reference
54. GitHub Actions CI/CD
55. Docker & Kubernetes
56. Environment Configuration
57. Monitoring & Observability
58. Disaster Recovery
59. Business Operations - Financial Planning
60. Business Operations - HR & Team
61. Business Operations - Branding & Marketing
62. Business Operations - Risk Management
63. Business Operations - Legal & Compliance
64. Complete Documentation Index
65. Project Alignment Report Summary
66. Inline TODOs Status
67. Development Phases Summary
68. Project Quality Gates
69. Service Health Status
70. Pull Request Guidelines
71. Contribution Guidelines
72. Version History
73. Support & Resources
74. Glossary
75. Quick Reference Cards
76. API Contract Definitions
77. Data Models
78. Event Schema Definitions
79. Error Codes Reference
80. Database Schema Reference
81. Message Queue Configuration
82. Kubernetes Deployment Specs
83. Security Policies
84. Monitoring Alert Rules
85. CI/CD Workflows
86. Kubernetes Resources
87. Service Mesh & Networking
88. Database Infrastructure
89. Multi-Region Deployment
90. Chaos Engineering
91. Autoscaling Configuration
92. OpenAPI Specifications
93. Feature Flags
94. API Gateway Configuration
95. Service Discovery
96. Circuit Breaker Pattern
97. Load Balancing
98. Service Communication
99. Event-Driven Architecture

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

## 6. API & Service Catalog

The TalentSphere API follows a RESTful design (plus GraphQL alternative) using a central API Gateway for routing,
security, and monitoring.

### 6.1 Core API Gateway (`/api/v1`)

| Path Prefix      | Target Service     | Purpose                 | Primary Port |
| :--------------- | :----------------- | :---------------------- | :----------- |
| `/auth`          | `auth-service`     | Identity & Session Mgmt | 3001         |
| `/profiles`      | `user-profile`     | Professional Profiles   | 3012         |
| `/jobs`          | `job-listing`      | Postings & Discovery    | 3002         |
| `/courses`       | `lms-service`      | Enrollment & Learning   | 8080         |
| `/challenges`    | `challenge-svc`    | Coding Assessments      | 5000         |
| `/payments`      | `payment-svc`      | Subscriptions & Billing | 5000         |
| `/search`        | `search-service`   | Global Content Search   | 3007         |
| `/notifications` | `notification-svc` | Real-time Alerts        | 3010         |
| `/recruitment`   | `recruitment-svc`  | Candidate Sourcing      | 3011         |
| `/gamification`  | `gamification-svc` | Streaks & Badges        | 3004         |

---

### 6.2 Auth Service API (`:3001`)

| Endpoint          | Method | Description                       | Auth Required |
| :---------------- | :----- | :-------------------------------- | :------------ |
| `/register`       | POST   | Create new User/Company account   | No            |
| `/login`          | POST   | Authenticate user & return JWT    | No            |
| `/validate-token` | POST   | Verify if a JWT is still valid    | Yes           |
| `/refresh-token`  | POST   | Issue new JWT using refresh token | No            |
| `/logout`         | POST   | Revoke current session            | Yes           |

### 6.3 Learning Management (LMS) API (`:8080`)

| Endpoint                                        | Method | Description                       |
| :---------------------------------------------- | :----- | :-------------------------------- |
| `/courses`                                      | GET    | List available courses (paged)    |
| `/courses/{id}`                                 | GET    | Get full course syllabus/metadata |
| `/enrollments`                                  | POST   | Enroll current user in a course   |
| `/enrollments/{id}/progress`                    | GET    | Get lesson completion status      |
| `/enrollments/{id}/lessons/{lessonId}/complete` | PUT    | Mark a lesson as finished         |

### 6.4 Coding Challenges API (`:5000`)

| Endpoint                       | Method | Description                   |
| :----------------------------- | :----- | :---------------------------- |
| `/challenges/{id}/submit`      | POST   | Submit source code for eval   |
| `/challenges/{id}/leaderboard` | GET    | Current ranking for challenge |
| `/challenges/evaluate`         | POST   | High-perf code eval stub      |

### 6.5 Payments API (`:5000`)

| Endpoint                          | Method | Description                    |
| :-------------------------------- | :----- | :----------------------------- |
| `/Payments/create-payment-intent` | POST   | Start Stripe payment flow      |
| `/Payments/refund`                | POST   | Process refund for transaction |
| `/Payments/user/subscriptions`    | GET    | Active user subscription plans |
| `/Payments/webhook`               | POST   | Stripe webhook listener        |

### 6.6 Search Service API (`:3007`)

| Endpoint                    | Method | Description                   |
| :-------------------------- | :----- | :---------------------------- |
| `/search`                   | POST   | Complex multi-filter search   |
| `/index`                    | POST   | Manual trigger for reindexing |
| `/recommendations/{userId}` | GET    | Personal AI recommendations   |

---

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

## 8. Configuration & Environment Setup

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

## 9. Database & External Services

| Service             | Purpose                          | Connection                            |
| ------------------- | -------------------------------- | ------------------------------------- |
| **PostgreSQL**      | Primary data store               | `postgresql://user:pass@host:5432/db` |
| **Redis**           | Caching, sessions, rate limiting | `redis://host:6379`                   |
| **RabbitMQ**        | Event-driven communication       | `amqp://guest:guest@host:5672`        |
| **HashiCorp Vault** | Secrets management               | Configured in `vault.hcl`             |
| **CDN**             | Static assets, media delivery    | Configure `CDN_URL` env var           |

## 10. CDN Architecture

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

## 11. Caching Architecture

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

## 12. Message Queue Architecture

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

## 13. Database Sharding (Citus)

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

## 14. Observability

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

## 17. Security

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

## 19. Service Discovery

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

## 15. Development Workflow

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

## 16. Deployment Instructions

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

## 18. Known Issues / Technical Debt

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

## 20. Code Optimization Status

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

## 21. Quick Reference

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

## 22. API Versioning

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

## 23. Multi-Region Deployment

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

## 24. Chaos Engineering

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

## 25. Feature Flags

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

## 26. Contract Testing

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

## 27. Consistent Hashing

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

## 28. GraphQL API

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

## 29. API Caching

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

## 30. Health Checks

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

## 31. Graceful Shutdown

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

## 32. Auto Scaling

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

## 33. Distributed Locking

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

## 34. Service Mesh (Istio)

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

## 35. Audit Logging

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

## 36. API Response Format

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

## 37. Configuration Hot Reloading

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

## 38. Final Service Port Map

| Service | Port | Language | Registry Key |
| :--- | :--- | :--- | :--- |
| API Gateway | 3000 | Node.js | `gateway` |
| Auth Service | 3001 | Node.js | `auth` |
| Job Listing | 3002 | Node.js | `jobs` |
| Gamification| 3004 | Python | `gamification`|
| AI Assistant| 3005 | Python | `assistant` |
| Challenges | 3006 | .NET | `challenges` |
| Search | 3007 | Node.js | `search` |
| File Svc | 3008 | Node.js | `file` |
| Video Svc | 3009 | Node.js | `video` |
| Notification| 3010 | Node.js | `notification`|
| Recruitment | 3011 | Python | `recruitment` |
| Analytics | 3013 | Node.js | `analytics` |
| LMS (Spring) | 8080 | Java | `lms` |
| Payments | 5000 | .NET | `payments` |

---


---

## 39. Webhooks

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

## 40. Idempotency

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

## 41. Batch Processing

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

## 42. Retry Mechanism

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

## 43. Multi-Tenancy

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

## 44. Request Throttling

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

## 45. Service Dependency Graph

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

## 46. Usage Analytics

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

## 47. API Deprecation Manager

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

## 48. Circuit Breaker (Advanced)

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

## 49. ETag Caching

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

## 50. Implementation Status

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

## 51. Project Health Metrics

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

## 52. Business Operations Documentation

Business and operational documentation is maintained in the `business-ops/` directory.

| Document | Description |
|----------|-------------|
| `04_Legal_Registration_Complete.md` | Company registration, incorporation, legal setup |
| `05_Financial_Funding.md` | Financial planning, funding, budget management |
| `07_Team_HR.md` | Team building, HR policies, hiring |
| `08_Branding_Marketing_Sales.md` | Branding, marketing, sales strategies |
| `10_Risks_Compliance_Scaling.md` | Risk management, compliance, scaling plans |

---

## 53. Event Routing Key Taxonomy

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

## 54. Client SDK Documentation

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

## 55. Documentation Index

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

## 56. System Architecture Reference

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

## 57. Backend Services Detail

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

## 58. Technology Stack

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

## 59. Service Interaction Flows

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

## 60. Database Schema

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

## 61. API Gateway

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

## 62. Security Infrastructure

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

## 63. Service Ports Reference

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

## 94. Implementation Status Summary

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

## 95. End-to-End (E2E) Testing

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

## 96. Code Coverage Report

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

## 97. Development Commands Reference

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

## 64. GitHub Actions CI/CD

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

## 65. Docker & Kubernetes

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

## 66. Environment Configuration

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

## 67. Monitoring & Observability

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

## 68. Disaster Recovery

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

## 69. Business Operations - Financial Planning

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

## 70. Business Operations - HR & Team

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

## 71. Business Operations - Branding & Marketing

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

## 72. Business Operations - Risk Management

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

## 73. Business Operations - Legal & Compliance

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

## 74. Complete Documentation Index

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

## 75. Project Alignment Report Summary

### Executive Summary
- **Date:** January 30, 2026
- **Status:** ✅ PRODUCTION READY
- **Version:** v1.4.0 → v1.5.0 (Aligned)

### Major Accomplishments

**1. Complete Testing Infrastructure**
- 38 comprehensive tests across unit, integration, configuration
- 52.99% code coverage on analytics service
- Automated coverage reporting (HTML, LCOV, JSON)
- Professional test framework with Jest, Babel

**2. Service Configuration Standardization**
- Created service package.json template
- Standardized all service configurations
- Fixed dependency version inconsistencies
- Implemented consistent naming conventions

**3. Project Structure Consistency**
- Validated all 11 service directories
- Created missing shared service server.js
- Fixed broken package.json syntax
- Implemented project validation tools

**4. Enhanced Build & Development Workflow**
- Centralized Jest configuration
- Global test setup with mocks
- Automated quality gates (linting, formatting)
- Enhanced npm scripts

### Issues Resolved (Before vs After)
- ❌ Inconsistent package.json versions → ✅ Consistent configurations
- ❌ Missing package.json in shared/test → ✅ Complete package.json + server.js
- ❌ No centralized testing → ✅ Centralized Jest config
- ❌ Broken import paths → ✅ Standardized import paths
- ❌ No project validation → ✅ Automated validation and reporting

---

## 76. Inline TODOs Status

### Frontend TODOs (Completed)
- ✅ **ts-mfe-shell/src/components/ErrorBoundary.tsx:40**: Implement Sentry logging

### Backend TODOs (Completed)
- ✅ **user-profile-service/enhanced-index.js:517**: Add authorization for profile ownership
- ✅ **job-listing-service/enhanced-index.js:612**: Add authorization check for job/company ownership
- ✅ **file-service/index.js:148**: Update user profile via API or Event Bus

---

## 77. Development Phases Summary

### Phase 1: Documentation Updates ✅
- Update all docs to reflect actual service counts
- Update DEVELOPMENT.md with implementation status
- Update OPERATIONS.md with service inventory
- Update API_REFERENCE.md with actual endpoints

### Phase 2: Missing Service Implementation ✅
- job-listing-service: CRUD, search, filtering, recommendations
- user-profile-service: Profile CRUD, skills, experience, education

### Phase 3: Database Schema Updates ✅
- Job listings table
- User profiles table
- Foreign key relationships
- Migration scripts

### Phase 4: Integration and Testing ✅
- Unit tests for new services
- Integration tests
- Test suite documentation

### Phase 5: Performance & Security Enhancements ✅
- Performance monitoring
- Security features
- Caching strategies

### Phase 6: Database & Caching Optimization ✅
- Query optimization
- Connection pooling
- Redis caching

### Phase 7: Advanced Features ✅
- AI-powered features
- Advanced search
- Analytics dashboards

### Phase 8: Critical Bug Fixes ✅
- Sentry logging implementation
- Authorization verification
- Code quality audit

---

## 78. Project Quality Gates

### Code Quality Gates
| Gate | Tool | Status |
|------|------|--------|
| Linting | ESLint | ✅ Enforced |
| Formatting | Prettier | ✅ Enforced |
| Type Checking | TypeScript | ✅ Enforced |
| Pre-commit Hooks | Husky | ✅ Active |

### Test Quality Gates
| Gate | Threshold | Status |
|------|-----------|--------|
| Unit Tests | All passing | ✅ 38 passing |
| Integration Tests | All passing | ✅ Passing |
| Code Coverage | >50% | ✅ 52.99% |
| E2E Tests | Critical paths | ✅ Covered |

### Build Quality Gates
| Gate | Status |
|------|--------|
| Build Success | ✅ |
| Dependency Audit | ✅ |
| Security Scan | ✅ |
| Docker Build | ✅ |

---

## 79. Service Health Status

### Core Services (All Operational)
| Service | Status | Port |
|---------|--------|------|
| auth-service | ✅ | 3001 |
| user-service | ✅ | 3002 |
| job-service | ✅ | 3003 |
| network-service | ✅ | 3004 |
| company-service | ✅ | 3007 |
| search-service | ✅ | 3008 |
| file-service | ✅ | 3009 |
| analytics-service | ✅ | 3010 |
| video-service | ✅ | 3011 |
| notification-service | ✅ | - |
| application-service | ✅ | - |
| email-service | ✅ | - |

### Python Services (All Operational)
| Service | Status | Port |
|---------|--------|------|
| Flask Core | ✅ | 5000 |
| AI Assistant | ✅ | 5005 |
| Recruitment | ✅ | 5006 |
| Gamification | ✅ | 5007 |

### Real-time Services
| Service | Status | Port |
|---------|--------|------|
| Collaboration | ✅ | 1234 |

---

## 80. Pull Request Guidelines

### PR Template

```markdown
## Description
<!-- What does this PR do? -->

## Architectural Changes
<!-- Does this PR affect the system architecture? -->

## Documentation Checklist
- [ ] I have verified that my changes do not conflict with the architectural guidelines.
- [ ] I have updated `docs/SSOT.md` if this PR introduces new APIs, Environment Variables, or infrastructural dependencies.
- [ ] I have NOT added fragmented `.md` files to the root directory.

## Testing
- [ ] Unit tests passed
- [ ] E2E tests passed
```

### PR Requirements
- All tests must pass before merging
- SSOT.md must be updated for architectural changes
- No fragmented markdown files at root
- Code must pass linting
- Coverage must not decrease

---

## 81. Contribution Guidelines

### Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit with descriptive messages
6. Push to your fork
7. Submit a Pull Request

### Code Standards
- Use ESLint for JavaScript/TypeScript
- Use Prettier for code formatting
- Follow existing code patterns
- Write unit tests for new features
- Document public APIs

### Commit Messages
- Use imperative mood
- First line: Short description (50 chars max)
- Body: Detailed explanation
- Reference issues: `Closes #123`

---

## 82. Version History

### Version Scheme
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### Release History
| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | Jan 2026 | Initial release |
| v1.4.0 | Jan 2026 | Alignment updates |
| v1.5.0 | Feb 2026 | SSOT consolidation |

---

## 83. Support & Resources

### Technical Support
- **Documentation**: docs/SSOT.md
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

### External Resources
- Node.js: https://nodejs.org
- React: https://react.dev
- PostgreSQL: https://postgresql.org
- Redis: https://redis.io
- Docker: https://docker.com
- Kubernetes: https://kubernetes.io

### Learning Resources
- Microservices patterns
- Event-driven architecture
- Kubernetes deployment
- CI/CD best practices

---

## 84. Glossary

| Term | Definition |
|------|------------|
| **SSOT** | Single Source of Truth - the authoritative documentation |
| **MFE** | Micro-Frontend - isolated frontend applications |
| **Microservice** | Small, independent service with its own domain |
| **Event Bus** | Message broker for async communication (RabbitMQ) |
| **Circuit Breaker** | Pattern to prevent cascading failures |
| **Rate Limiting** | Control request rates to prevent abuse |
| **Sharding** | Horizontal database partitioning |
| **CDN** | Content Delivery Network for static assets |
| **ETag** | HTTP caching mechanism for conditional requests |
| **JWT** | JSON Web Token for authentication |
| **WebSocket** | Real-time bidirectional communication |
| **CRDT** | Conflict-free Replicated Data Type |
| **OpenTelemetry** | Distributed tracing standard |
| **Prometheus** | Metrics collection and alerting |
| **Grafana** | Metrics visualization |

---

## 85. Quick Reference Cards

### Essential Commands
```bash
# Development
npm run dev          # Start development server
npm run lint        # Run linter
npm run test        # Run tests

# Build & Deploy
npm run build       # Build for production
docker-compose up   # Start all services

# Monitoring
kubectl get pods    # Check pod status
kubectl logs -f    # Stream logs
```

### Port Reference
| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| API Gateway | 8000 | http://localhost:8000 |
| Auth Service | 3001 | http://localhost:3001 |
| User Service | 3002 | http://localhost:3002 |
| Job Service | 3003 | http://localhost:3003 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| RabbitMQ | 5672 | localhost:5672 |

### Environment Variables
```
NODE_ENV=development
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
PORT=3000
```

---

## 86. API Contract Definitions

### Authentication API

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/v1/auth/register` | POST | Register new user | `{email, password, name}` | `{token, user}` |
| `/api/v1/auth/login` | POST | User login | `{email, password}` | `{token, refreshToken}` |
| `/api/v1/auth/verify` | GET | Verify token | - | `{valid: true}` |
| `/api/v1/auth/refresh` | POST | Refresh token | `{refreshToken}` | `{token}` |

### User API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/profile/:userId` | GET | Get user profile |
| `/api/v1/users/profile` | PUT | Update profile |
| `/api/v1/users/skills` | POST | Add skills |
| `/api/v1/users/experience` | POST | Add experience |
| `/api/v1/users/education` | POST | Add education |
| `/api/v1/users/search` | GET | Search users |

### Job API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/jobs` | GET | List jobs |
| `/api/v1/jobs` | POST | Create job |
| `/api/v1/jobs/:id` | GET | Get job |
| `/api/v1/jobs/:id` | PUT | Update job |
| `/api/v1/jobs/:id` | DELETE | Delete job |
| `/api/v1/jobs/:id/apply` | POST | Apply to job |

### Company API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/companies` | GET | List companies |
| `/api/v1/companies` | POST | Register company |
| `/api/v1/companies/:id` | GET | Get company |
| `/api/v1/companies/:id/reviews` | POST | Add review |

---

## 87. Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Profile Model
```typescript
interface Profile {
  userId: string;
  headline: string;
  summary: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}
```

### Job Model
```typescript
interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary: { min: number; max: number };
  type: 'full-time' | 'part-time' | 'contract';
  status: 'open' | 'closed';
  createdAt: Date;
}
```

### Application Model
```typescript
interface Application {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl: string;
  coverLetter: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  appliedAt: Date;
}
```

---

## 88. Event Schema Definitions

### User Events
```typescript
// auth.user.registered
{
  eventType: 'auth.user.registered',
  userId: 'uuid',
  email: 'user@example.com',
  timestamp: '2026-02-23T12:00:00Z'
}

// auth.user.login
{
  eventType: 'auth.user.login',
  userId: 'uuid',
  ipAddress: '192.168.1.1',
  timestamp: '2026-02-23T12:00:00Z'
}
```

### Job Events
```typescript
// jobs.post.created
{
  eventType: 'jobs.post.created',
  jobId: 'uuid',
  companyId: 'uuid',
  title: 'Software Engineer',
  timestamp: '2026-02-23T12:00:00Z'
}

// jobs.application.submitted
{
  eventType: 'jobs.application.submitted',
  applicationId: 'uuid',
  jobId: 'uuid',
  userId: 'uuid',
  timestamp: '2026-02-23T12:00:00Z'
}
```

### LMS Events
```typescript
// lms.course.completed
{
  eventType: 'lms.course.completed',
  userId: 'uuid',
  courseId: 'uuid',
  completionDate: '2026-02-23T12:00:00Z'
}

// lms.enrollment.created
{
  eventType: 'lms.enrollment.created',
  userId: 'uuid',
  courseId: 'uuid',
  timestamp: '2026-02-23T12:00:00Z'
}
```

---

## 89. Error Codes Reference

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |
| 503 | Service Unavailable | Circuit breaker open |

### Custom Error Codes

| Code | Meaning |
|------|---------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| AUTH_003 | User already exists |
| USER_001 | Profile not found |
| JOB_001 | Job not found |
| JOB_002 | Job closed |
| JOB_003 | Already applied |
| COMPANY_001 | Company not found |
| COMPANY_002 | Unauthorized access |

---

## 90. Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'jobseeker',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  headline VARCHAR(255),
  summary TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Jobs Table
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB,
  location VARCHAR(255),
  salary_min INTEGER,
  salary_max INTEGER,
  job_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs(location);
```

---

## 91. Message Queue Configuration

### RabbitMQ Exchanges

| Exchange | Type | Purpose |
|----------|------|---------|
| `talentsphere.events` | Topic | Main event bus |
| `talentsphere.auth` | Direct | Auth events |
| `talentsphere.notifications` | Fanout | Notification broadcasts |

### Queue Definitions

| Queue | Exchange | Routing Key |
|-------|----------|-------------|
| `auth.events` | talentsphere.events | auth.* |
| `gamification.events` | talentsphere.events | gamification.* |
| `notification.events` | talentsphere.events | notification.* |
| `analytics.events` | talentsphere.events | analytics.* |

### Consumer Groups

| Service | Queue | Prefetch |
|---------|-------|----------|
| gamification-service | gamification.events | 10 |
| notification-service | notification.events | 5 |
| analytics-service | analytics.events | 20 |

---

## 107. Kubernetes Deployment Specs

### Service Deployment Template
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service-name}
  namespace: talentsphere
spec:
  replicas: 3
  selector:
    matchLabels:
      app: {service-name}
  template:
    metadata:
      labels:
        app: {service-name}
    spec:
      containers:
      - name: {service-name}
        image: talentsphere/{service-name}:{version}
        ports:
        - containerPort: {port}
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: talentsphere-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {service-name}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {service-name}
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 108. Security Policies

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: service-isolation
spec:
  podSelector:
    matchLabels:
      app: talentsphere
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
```

### Kyverno Policies
- Require resource limits
- Disallow privileged containers
- Restrict hostPath volumes
- Require network policies

---

## 109. Monitoring Alert Rules

### Prometheus Alert Rules
```yaml
groups:
- name: talentsphere-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected

  - alert: ServiceDown
    expr: up{job="talentsphere"} == 0
    for: 2m
    labels:
      severity: critical
```

### Alert Routing
| Alert | Channel | Severity |
|-------|---------|----------|
| HighErrorRate | Slack + PagerDuty | Critical |
| ServiceDown | PagerDuty | Critical |
| HighLatency | Slack | Warning |
| DiskSpaceLow | Email | Warning |

---

## 110. CI/CD Workflows

### GitHub Actions Workflows

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `ci.yml` | Main CI pipeline | Push/PR |
| `ci-cd.yml` | CI/CD pipeline | Push to main |
| `code-quality.yml` | Linting, formatting | Push/PR |
| `frontend.yml` | Frontend build/test | Push/PR |
| `security-scan.yml` | Security scanning | Weekly |
| `feature-flags.yml` | Feature flag updates | Manual |

### CI Pipeline Stages
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linting
5. Run tests
6. Build artifacts
7. Upload artifacts

### CD Pipeline Stages
1. Build Docker images
2. Push to registry
3. Deploy to staging
4. Run smoke tests
5. Deploy to production

---

## 92. Kubernetes Resources

### Core Resources

| Resource | File | Purpose |
|----------|------|---------|
| Namespaces | `namespaces.yaml` | Environment isolation |
| ConfigMaps | `configs/configmaps.yaml` | Configuration |
| Secrets | - | Sensitive data |
| Services | Service files | Network exposure |
| Deployments | Service files | Application pods |
| HPA | `hpa.yaml` | Auto-scaling |

### Service Deployments

| Service | File | Replicas |
|---------|------|----------|
| api-gateway | `api-gateway.yaml` | 3 |
| auth-service | `backend-enhanced` | 3 |
| user-service | `backend-enhanced` | 3 |
| job-service | `backend-enhanced` | 3 |
| company-service | `backend-enhanced` | 3 |
| search-service | `backend-enhanced` | 3 |
| analytics-service | `backend-enhanced` | 2 |
| notification-service | `backend-enhanced` | 2 |
| collaboration-service | `collaboration-service.yaml` | 2 |
| Flask Backend | `backend-flask.yaml` | 2 |
| Spring Boot | `backend-springboot.yaml` | 2 |
| .NET | `backend-dotnet.yaml` | 2 |

### Infrastructure Resources

| Resource | File | Purpose |
|----------|------|---------|
| PostgreSQL | `postgres.yaml` | Database |
| Redis | `rabbitmq.yaml` | Cache/Queue |
| RabbitMQ | `rabbitmq.yaml` | Message broker |
| Citus | `citus.yaml` | Distributed DB |

---

## 93. Service Mesh & Networking

### Istio Configuration
- mTLS between services
- Traffic management
- Observability
- Security policies

### Network Policies
- Service isolation
- Ingress control
- Egress rules
- DNS policies

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: talentsphere-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  rules:
  - host: api.talentsphere.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 80
```

---

## 111. Database Infrastructure

### Citus Distributed Database

| Component | Purpose |
|-----------|---------|
| Coordinator | Query routing |
| Worker 1 | Shard 1 |
| Worker 2 | Shard 2 |
| Worker 3 | Shard 3 |

### Sharding Strategy
- User data: Shard by user_id
- Job data: Shard by company_id
- Application data: Shard by job_id

### Replication
- Primary-standby for each shard
- Async replication
- Automatic failover

---

## 112. Multi-Region Deployment

### Region Configuration
| Region | Role | Services |
|--------|------|----------|
| us-east-1 | Primary | All |
| eu-west-1 | Secondary | Read replicas |
| ap-south-1 | Tertiary | Backup |

### Failover Strategy
- DNS failover to secondary
- Read replicas promote to primary
- Data sync via CDC

---

## 113. Chaos Engineering

### Chaos Experiments

| Experiment | Target | Failure Mode |
|------------|--------|--------------|
| pod-kill | Random pod | Pod termination |
| network-loss | Service | Network partition |
| cpu-load | Service | High CPU |
| memory-load | Service | Memory exhaustion |
| disk-fill | Database | Disk full |

### Running Experiments
```bash
kubectl apply -f k8s/chaos-experiments.yaml
```

---

## 114. Autoscaling Configuration

### KEDA Scalers

| Service | Scaler | Metric |
|---------|--------|--------|
| api-gateway | HTTP | Request rate |
| job-service | RabbitMQ | Queue depth |
| search-service | PostgreSQL | Connection count |
| notification-service | Redis | List size |

### HPA Configuration
```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70
- type: Pods
  pods:
    metric:
      name: http_requests_per_second
    target:
      type: AverageValue
      averageValue: 1000
```

---

## 98. OpenAPI Specifications

### API Specifications

| Service | File | Status |
|---------|------|--------|
| Auth | `api/openapi.yaml` | ✅ |
| Search | `api/search-service-openapi.yaml` | ✅ |
| Network | `api/network-service-openapi.yaml` | ✅ |
| Notification | `api/notification-service-openapi.yaml` | ✅ |
| Collaboration | `api/collaboration-openapi.yaml` | ✅ |
| Flask | `api/flask-backend-openapi.yaml` | ✅ |

### OpenAPI Structure
```yaml
openapi: 3.0.0
info:
  title: TalentSphere API
  version: 1.0.0
servers:
  - url: https://api.talentsphere.com/v1
paths:
  /auth/register:
    post:
      summary: Register new user
      tags:
        - Authentication
```

---

## 99. Feature Flags

### Feature Flag System
- Implemented in `shared/feature-flags.js`
- Redis-backed for distributed access
- Dashboard for management

### Active Flags

| Flag | Default | Description |
|------|---------|-------------|
| `new_search_algorithm` | false | AI-powered search |
| `video_interviews` | true | Video interview feature |
| `ai_recommendations` | false | ML job recommendations |
| `dark_mode` | true | Dark theme support |

### Usage
```javascript
const { featureFlags } = require('./shared/feature-flags');

if (await featureFlags.isEnabled('new_search_algorithm')) {
  // New search logic
}
```

---

## 100. Runbooks

### Common Issues & Resolution

**High CPU Usage**
1. Check running processes: `top`
2. Identify heavy pods: `kubectl top pods`
3. Scale horizontally: `kubectl scale deployment`
4. Check logs for errors

**Database Connection Issues**
1. Check PostgreSQL status
2. Verify connection string
3. Check connection pool
4. Review connection limits

**Service Not Responding**
1. Check pod status: `kubectl get pods`
2. View logs: `kubectl logs`
3. Check health endpoint
4. Verify network policies

**Rate Limit Errors**
1. Check Redis rate limiter
2. Identify abusive clients
3. Adjust rate limits

---

## 101. Development Scripts

### Available Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `start-service.js` | `scripts/` | Start individual service |
| `start-services.js` | `scripts/` | Start all services |
| `start-development.js` | `scripts/` | Development mode |
| `start-e2e.js` | `scripts/` | Start E2E tests |
| `validate-project.js` | `scripts/` | Validate project structure |
| `simple-validate.js` | `scripts/` | Quick validation |
| `migrate-database.js` | `scripts/` | Run database migrations |
| `database-backup-manager.js` | `scripts/` | Backup management |
| `generate-secrets.js` | `scripts/` | Generate secrets |
| `config-manager.js` | `scripts/` | Configuration management |
| `alignment-tools/index.js` | `scripts/` | Project alignment |

### Usage Examples

```bash
# Start a service
node scripts/start-service.js --service=auth-service

# Run migrations
node scripts/migrate-database.js --direction=up

# Validate project
node scripts/validate-project.js

# Generate secrets
node scripts/generate-secrets.js
```

---

## 102. Testing Infrastructure

### Test Types

| Type | Location | Framework | Purpose |
|------|----------|-----------|---------|
| Unit | `tests/unit/` | Jest | Component testing |
| Integration | `tests/integration/` | Jest | Service integration |
| E2E | `tests/e2e/` | Playwright | Full flow testing |
| Contract | `tests/contract/` | Pact | API contracts |
| Load | `tests/load/` | k6 | Performance testing |
| Sanity | `tests/unit/` | Jest | Quick smoke tests |

### Load Testing (k6)

| File | Purpose |
|------|---------|
| `k6-load.js` | Load testing |
| `k6-stress.js` | Stress testing |
| `k6-smoke.js` | Smoke testing |

### Test Configuration

| File | Purpose |
|------|---------|
| `jest.config.json` | Jest configuration |
| `playwright.config.js` | Playwright config |
| `tests/setup.js` | Test setup |
| `tests/fixtures/` | Test data |

---

## 103. Service Communication Patterns

### Synchronous Communication
- REST API calls between services
- HTTP/gRPC for direct calls
- Used for: User profile lookup, job data fetch

### Asynchronous Communication
- RabbitMQ message broker
- Event-driven architecture
- Used for: Notifications, analytics, gamification

### Service Discovery
- Registry-based discovery
- Health check integration
- Dynamic routing

### Circuit Breaker Pattern
- Implemented in API Gateway
- States: CLOSED, OPEN, HALF_OPEN
- Prevents cascade failures

---

## 104. Frontend Architecture

### Micro-Frontends (MFE)

| Application | Framework | Purpose |
|-------------|-----------|---------|
| ts-mfe-shell | React + Vite | App shell/host |
| ts-mfe-lms | React + Vite | Learning management |
| ts-mfe-challenge | React + Vite | Coding challenges |

### Shared Packages

| Package | Purpose |
|---------|---------|
| `packages/ui` | Reusable UI components |
| `packages/api` | API client library |
| `packages/state` | State management |

### MFE Configuration

```javascript
// Module Federation in webpack
new ModuleFederationPlugin({
  name: 'ts-mfe-shell',
  remotes: {
    lms: 'ts_mfe_lms@http://localhost:3001/remoteEntry.js',
    challenge: 'ts_mfe_challenge@http://localhost:3002/remoteEntry.js'
  }
})
```

---

## 105. Backend Technologies

### Node.js Services
- Express.js framework
- ioredis for Redis
- pg for PostgreSQL
- Socket.io for WebSocket

### Python Services
- Flask framework
- SQLAlchemy ORM
- Celery for background tasks

### Java Services
- Spring Boot
- Maven build system

### .NET Services
- ASP.NET Core
- NuGet packages

---

## 106. Configuration Management

### Environment-Specific Config

| Environment | Variables |
|-------------|-----------|
| Development | `NODE_ENV=development` |
| Staging | `NODE_ENV=staging` |
| Production | `NODE_ENV=production` |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Local development |
| `.env.example` | Template |
| `configmaps.yaml` | K8s config |
| `secrets` | Sensitive data |

### Hot Reloading
- Nodemon for development
- Config reloader for runtime changes

---

## 120. Performance Optimization

### Backend Optimizations
- Connection pooling (PostgreSQL)
- Redis caching layer
- Gzip compression
- ETags for caching

### Database Optimizations
- Indexes on frequently queried columns
- Query result caching
- Connection reuse
- Sharding for scale

### Frontend Optimizations
- Code splitting
- Lazy loading
- Image optimization
- CDN for static assets

---

## 121. Logging Strategy

### Log Levels

| Level | Usage |
|-------|-------|
| ERROR | Critical failures |
| WARN | Warning conditions |
| INFO | General info |
| DEBUG | Debugging |
| HTTP | HTTP requests |

### Log Aggregation
- Winston for application logging
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Structured JSON logging
- Correlation IDs for tracing

---

## 122. Backup & Recovery

### Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full DB | Daily | 30 days |
| Incremental | Hourly | 7 days |
| Config | Weekly | 90 days |
| Snapshots | Weekly | 30 days |

### Recovery Procedures

1. **Database Restore**
   ```bash
   psql -U talentsphere < backup.sql
   ```

2. **Service Recovery**
   - Deploy from last known good
   - Verify health checks
   - Run smoke tests

---

## 115. Onboarding Checklist

### New Developer Setup

- [ ] Clone repository
- [ ] Install Node.js 18+
- [ ] Install Docker & Docker Compose
- [ ] Copy `.env.example` to `.env`
- [ ] Run `docker-compose up -d`
- [ ] Run database migrations
- [ ] Start development server
- [ ] Verify health endpoints
- [ ] Run local tests
- [ ] Read SSOT documentation

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests included
- [ ] No security issues
- [ ] Documentation updated
- [ ] No console.log/debug

---

## 116. Infrastructure Scripts

### Database Scripts

| Script | Purpose |
|--------|---------|
| `citus-init.sh` | Initialize Citus distributed database |
| `database-backup.sh` | Backup database |
| `database-backup-config.sh` | Configure backup |
| `migrate.sh` | Run migrations |
| `migrate-database.sh` | Database migration |

### Deployment Scripts

| Script | Purpose |
|--------|---------|
| `deploy.sh` | Deploy to environment |
| `deploy-production.sh` | Production deployment |
| `launch-production.sh` | Launch production |
| `monitor-production.sh` | Monitor production |

### Operations Scripts

| Script | Purpose |
|--------|---------|
| `verify-system.sh` | System verification |
| `cleanup.sh` | Cleanup operations |
| `continuous-monitoring.sh` | Continuous monitoring |
| `monitor-dashboard.sh` | Dashboard monitoring |

### SSL & Security Scripts

| Script | Purpose |
|--------|---------|
| `generate-ssl-certs.sh` | Generate SSL certificates |

---

## 117. Analytics & Monitoring Scripts

### Analytics Scripts

| Script | Purpose |
|--------|---------|
| `analyze-engagement.sh` | Analyze user engagement |
| `collect-user-analytics.sh` | Collect user analytics |
| `implement-personalization.sh` | Implement personalization |

### Performance Scripts

| Script | Purpose |
|--------|---------|
| `performance-optimizer.sh` | Optimize performance |
| `optimize-performance.sh` | Optimize system |
| `optimization-success.sh` | Verify optimization |

---

## 118. API Gateway Configuration

### Gateway Features

| Feature | Implementation |
|---------|----------------|
| Routing | http-proxy-middleware |
| Rate Limiting | Redis-backed |
| Authentication | JWT validation |
| Circuit Breaker | Custom implementation |
| CORS | Middleware |
| Compression | gzip |

### Gateway Endpoints

| Path | Target Service |
|------|----------------|
| `/api/v1/auth/*` | auth-service:3001 |
| `/api/v1/users/*` | user-service:3002 |
| `/api/v1/jobs/*` | job-service:3003 |
| `/api/v1/companies/*` | company-service:3007 |
| `/api/v1/search/*` | search-service:3008 |

---

## 119. Redis Implementation

### Redis Use Cases

| Use Case | Key Pattern |
|----------|-------------|
| Rate Limiting | `ratelimit:{userId}` |
| Session Cache | `session:{userId}` |
| API Cache | `cache:{endpoint}` |
| Feature Flags | `feature:{flagName}` |
| Distributed Lock | `lock:{resource}` |

### Redis Configuration

```javascript
{
  host: 'localhost',
  port: 6379,
  maxRetries: 3,
  retryDelay: 100,
  enableReadyCheck: true,
  connectTimeout: 10000
}
```

---

## 126. Message Queue Events

### Event Types

| Event | Domain | Description |
|-------|--------|-------------|
| `auth.user.registered` | Auth | New user signup |
| `auth.user.login` | Auth | User login |
| `jobs.post.created` | Jobs | New job posting |
| `jobs.application.submitted` | Jobs | Job application |
| `lms.course.completed` | LMS | Course completion |
| `challenges.submitted` | Challenges | Code submission |
| `gamification.points.awarded` | Gamification | Points earned |

### Event Format

```javascript
{
  eventType: 'auth.user.registered',
  eventId: 'uuid',
  timestamp: 'ISO8601',
  payload: {
    userId: 'uuid',
    email: 'user@example.com'
  },
  metadata: {
    correlationId: 'uuid',
    source: 'auth-service'
  }
}
```

---

## 130. Authentication & Authorization

### Authentication Methods

| Method | Implementation |
|--------|----------------|
| JWT | Access + Refresh tokens |
| OAuth 2.0 | Google, GitHub, LinkedIn |
| SAML 2.0 | Enterprise SSO |
| 2FA | TOTP |
| Magic Link | Email-based |

### Authorization Model

| Model | Implementation |
|-------|----------------|
| RBAC | Role-based access control |
| ABAC | Attribute-based access |
| Resource-based | Owner verification |

### Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access |
| Employer | Jobs, applications |
| Jobseeker | Profile, applications |
| Guest | Read-only |

---

## 131. CORS Configuration

### Allowed Origins

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://talentsphere.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};
```

### CORS Headers

| Header | Value |
|--------|-------|
| Access-Control-Allow-Origin | Dynamic |
| Access-Control-Allow-Methods | GET, POST, PUT, DELETE |
| Access-Control-Allow-Headers | Content-Type, Authorization |
| Access-Control-Allow-Credentials | true |

---

## 132. Rate Limiting Configuration

### Rate Limit Tiers

| Tier | Requests | Window | Description |
|------|----------|--------|-------------|
| Free | 100 | 1 hour | Basic tier |
| Standard | 1000 | 1 hour | Standard tier |
| Premium | 10000 | 1 hour | Premium tier |
| Enterprise | Unlimited | - | Custom |

### Rate Limit Headers

| Header | Description |
|--------|-------------|
| X-RateLimit-Limit | Total requests allowed |
| X-RateLimit-Remaining | Requests remaining |
| X-RateLimit-Reset | Reset timestamp |

---

## 133. SSL/TLS Configuration

### Certificate Management
- Auto-generated self-signed for development
- Let's Encrypt for staging/production
- Certificate rotation every 90 days

### TLS Versions
- Minimum: TLS 1.2
- Preferred: TLS 1.3

### Security Headers

| Header | Value |
|--------|-------|
| Strict-Transport-Security | max-age=31536000 |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Content-Security-Policy | Custom per environment |

---

## 123. Database Migration Strategy

### Migration Workflow

1. Create migration file
2. Review SQL changes
3. Test in staging
4. Backup production
5. Run migration
6. Verify data integrity
7. Rollback if needed

### Migration Commands

```bash
# Create migration
npm run migrate:create -- --name add_users_table

# Run migrations
npm run migrate:up

# Rollback
npm run migrate:down
```

---

## 124. Docker Containerization

### Service Dockerfiles

| Service | Dockerfile | Base Image |
|---------|------------|------------|
| Node.js Backend | `Dockerfile.backend` | node:18-alpine |
| Flask Backend | `backend-flask/Dockerfile` | python:3.11-slim |
| Spring Boot | `backend-springboot/Dockerfile` | openjdk:17-slim |
| .NET | `backend-dotnet/Dockerfile` | mcr.microsoft.com/dotnet/aspnet:7.0 |
| Frontend MFE | `ts-mfe-*/Dockerfile` | node:18-alpine |
| Nginx | `nginx/Dockerfile` | nginx:alpine |

### Docker Best Practices

- Use multi-stage builds
- Minimize image size with Alpine
- Don't run as root
- Use .dockerignore
- Layer caching optimization
- Health check instructions

### Docker Compose Services

| Service | Image | Ports |
|---------|-------|-------|
| postgres | postgres:14 | 5432 |
| redis | redis:7-alpine | 6379 |
| rabbitmq | rabbitmq:3-management | 5672, 15672 |
| elasticsearch | elasticsearch:8 | 9200 |

---

## 125. Container Orchestration

### Kubernetes Architecture

```
┌─────────────────────────────────────────┐
│              Ingress                     │
│         (api.talentsphere.com)          │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│            API Gateway                   │
│         (api-gateway)                    │
└─────────────────────────────────────────┘
                    │
    ┌───────────┬───┴────┬───────────┐
    ▼           ▼         ▼           ▼
Service A   Service B  Service C   Service D
```

### Namespace Strategy

| Namespace | Purpose |
|-----------|---------|
| production | Live services |
| staging | Pre-production testing |
| development | Development environments |
| monitoring | Observability stack |

### Resource Limits

| Resource | Request | Limit |
|----------|---------|-------|
| Memory | 256Mi | 512Mi |
| CPU | 250m | 500m |
| Storage | 1Gi | 10Gi |

---

## 127. Service Dependencies

### Dependency Graph

```
API Gateway
    ├── Auth Service
    │   └── PostgreSQL
    ├── User Service
    │   ├── PostgreSQL
    │   └── Redis
    ├── Job Service
    │   ├── PostgreSQL
    │   └── RabbitMQ
    ├── Search Service
    │   ├── Elasticsearch
    │   └── PostgreSQL
    ├── Notification Service
    │   ├── Redis
    │   └── RabbitMQ
    └── Analytics Service
        ├── PostgreSQL
        └── Redis
```

### Startup Order

1. Infrastructure (DB, Redis, MQ)
2. Core Services (Auth, User)
3. Business Services (Job, Company)
4. Feature Services (Search, Analytics)
5. API Gateway

---

## 128. Health Check Implementation

### Health Check Types

| Type | Endpoint | Purpose |
|------|----------|---------|
| Liveness | `/health/live` | Container alive |
| Readiness | `/health/ready` | Service ready |
| Startup | `/health/startup` | Startup complete |

### Health Check Response

```json
{
  "status": "healthy",
  "uptime": 3600,
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy"
  },
  "version": "1.0.0"
}
```

---

## 129. Log Management

### Log Collection

| Component | Tool | Purpose |
|-----------|------|---------|
| Application | Winston | Structured logging |
| Container | Docker logs | Stdout capture |
| Aggregation | Fluentd | Log forwarding |
| Storage | Elasticsearch | Log storage |
| Visualization | Kibana | Log analysis |

### Log Format

```json
{
  "timestamp": "2026-02-23T12:00:00Z",
  "level": "info",
  "message": "Request processed",
  "service": "auth-service",
  "correlationId": "abc123",
  "userId": "user123",
  "duration": 45
}
```

---

## 138. Metrics Collection

### Prometheus Metrics

| Metric Type | Example | Purpose |
|-------------|---------|---------|
| Counter | http_requests_total | Request count |
| Gauge | active_connections | Current state |
| Histogram | request_duration_seconds | Latency distribution |
| Summary | request_size_bytes | Request size |

### Custom Metrics

| Metric | Service | Labels |
|--------|---------|--------|
| job_applications_total | job-service | status, company |
| user_logins_total | auth-service | method |
| search_queries_total | search-service | type |

---

## 139. Distributed Tracing

### Trace Context

| Header | Purpose |
|--------|---------|
| X-Trace-ID | Overall trace ID |
| X-Span-ID | Current span ID |
| X-Parent-Span-ID | Parent span |

### Jaeger Configuration

```javascript
const tracing = {
  serviceName: 'auth-service',
  sampler: {
    type: 'const',
    param: 1
  },
  reporter: {
    logSpans: true,
    agentEndpoint: 'jaeger:6831'
  }
};
```

---

## 140. API Versioning Strategy

### Versioning Approaches

| Approach | Example | Pros | Cons |
|----------|---------|------|------|
| URL Path | /v1/users | Clear | URL pollution |
| Header | Accept: v1 | Clean | Complex |
| Query | ?version=1 | Simple | Caching issues |

### Version Lifecycle

| Phase | Duration | Support |
|-------|----------|---------|
| Active | Current | Full |
| Deprecated | 6 months | Security only |
| sunset | 3 months | Returns 410 |
| Removed | After sunset | Not available |

---

## 141. WebSocket Implementation

### Socket.io Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| connect | Client→Server | Establish connection |
| disconnect | Server→Client | Connection closed |
| notification | Server→Client | Push notification |
| message | Bidirectional | Real-time chat |

### Connection Management

- Heartbeat every 30 seconds
- Reconnection with exponential backoff
- Room-based message routing
- Authentication via JWT

---

## 134. File Upload Handling

### Upload Flow

1. Client requests pre-signed URL
2. Server validates auth, returns URL
3. Client uploads directly to S3
4. Client confirms upload to server
5. Server processes file (resize, scan)
6. Returns file URL to client

### File Types Supported

| Type | Max Size | Processing |
|------|----------|------------|
| Images (jpg, png) | 10MB | Resize, compress |

---

## 135. Docker Compose Configurations

### Environment-Specific Compose

| File | Environment | Purpose |
|------|-------------|---------|
| `docker-compose.yml` | Development | Local dev stack |
| `docker-compose.dev.yml` | Dev | Development |
| `docker-compose.staging.yml` | Staging | Pre-production |
| `docker-compose.production.yml` | Production | Live environment |
| `docker-compose.prod.yml` | Production | Production alt |
| `docker-compose.redis.yml` | All | Redis caching |
| `docker-compose.vault.yml` | All | Secrets management |
| `docker-compose.citus.yml` | All | Distributed DB |
| `docker-compose.infrastructure.yml` | All | Core infrastructure |
| `docker-compose.devops.yml` | DevOps | DevOps tools |

### Core Services in Compose

| Service | Image | Ports |
|---------|-------|-------|
| postgres | postgres:14 | 5432 |
| redis | redis:7-alpine | 6379 |
| rabbitmq | rabbitmq:3-management | 5672, 15672 |
| elasticsearch | elasticsearch:8 | 9200 |
| vault | vault:1.12 | 8200 |
| prometheus | prometheus:v2.40 | 9090 |
| grafana | grafana:9.4 | 3000 |
| jaeger | jaegertracing/all-in-one | 16686 |

---

## 136. Secrets Management

### HashiCorp Vault

| Secret Engine | Purpose |
|---------------|---------|
| KV v2 | Generic secrets |
| Database | DB credentials |
| PKI | Certificate management |
| Transit | Encryption as service |

### Secret Injection

```yaml
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: talentsphere-secrets
      key: database-url
```

### Secrets Rotation
- Database: Every 30 days
- API Keys: Every 90 days
- SSL Certificates: Every 60 days

---

## 137. Multi-Tenancy Architecture

### Tenant Isolation

| Approach | Implementation |
|----------|----------------|
| Database | Separate schema per tenant |
| Shared DB | Tenant ID column |
| Application | Tenant context middleware |

### Tenant Context

```javascript
// Middleware to extract tenant
app.use((req, res, next) => {
  req.tenantId = req.headers['x-tenant-id'];
  next();
});
```

### Tenant Configuration

| Feature | Implementation |
|---------|----------------|
| Routing | Host-based or header |
| Data isolation | Row-level security |
| Billing | Per-tenant tracking |
| Limits | Tenant-specific quotas |

---

## 142. Data Archiving Strategy

### Archive Policy

| Data Type | Hot Storage | Cold Storage | Retention |
|-----------|------------|--------------|-----------|
| User Activity | 30 days | 2 years | 7 years |
| Transaction Logs | 90 days | 5 years | 7 years |
| Analytics | 7 days | 3 years | 5 years |
| Attachments | 90 days | 2 years | 10 years |

### Archive Implementation

- Use S3 Lifecycle policies
- Glacier for cold storage
-定期验证存档完整性

---

## 143. API Rate Limiting Algorithms

### Token Bucket

```
┌─────────────┐
│   Bucket    │
│  ┌───────┐  │
│  │Tokens │  │
│  └───────┘  │
└─────────────┘
     ↓ refills at rate
```

### Sliding Window

| Algorithm | Use Case | Pros |
|-----------|----------|------|
| Token Bucket | General | Smooth |
| Leaky Bucket | Outbound | Consistent |
| Sliding Window | High traffic | Accurate |
| Fixed Window | Simple | Easy |

### Implementation

```javascript
const rateLimiter = new TokenBucket({
  capacity: 100,
  refillRate: 10 // per second
});
```

---

## 144. Cache Invalidation Strategies

### Invalidation Methods

| Method | Use Case | TTL |
|--------|----------|-----|
| Time-based | General | 5-60 min |
| Event-based | Real-time | Instant |
| Manual | Admin | On-demand |
| LRU | Memory | Auto |

### Cache Patterns

```javascript
// Write-through
await cache.set(key, value);
await db.save(key, value);

// Write-back
await cache.set(key, value);
// Async db.save(key, value);

// Cache-aside
const data = await cache.get(key);
if (!data) {
  data = await db.get(key);
  await cache.set(key, data);
}
```

---

## 145. Disaster Recovery Procedures

### RTO/RPO Targets

| Tier | RTO | RPO |
|------|-----|-----|
| Critical | 15 min | 5 min |
| Standard | 1 hour | 1 hour |
| Batch | 4 hours | 24 hours |

### Recovery Steps

1. **Detection**: Monitor alerts trigger
2. **Assessment**: Determine impact scope
3. **Decision**: Activate DR plan
4. **Recovery**: Bring up services
5. **Verification**: Validate integrity
6. **Communication**: Stakeholder update

### DR Locations

| Site | Role | Distance |
|------|------|----------|
| Primary | Production | - |
| Secondary | Failover | 100+ km |
| Tertiary | Backup | 500+ km |

---

## 190. Capacity Planning

### Resource Planning

| Metric | Current | 6 months | 12 months |
|--------|---------|----------|-----------|
| Users | 10K | 50K | 200K |
| Requests/day | 100K | 500K | 2M |
| Storage | 50GB | 200GB | 1TB |
| Compute | 4 cores | 16 cores | 64 cores |

### Scaling Triggers

| Resource | Threshold | Action |
|----------|-----------|--------|
| CPU | >70% | Scale up |
| Memory | >80% | Scale up |
| Disk | >85% | Add storage |
| Requests | >10K/min | Scale out |

---

## 191. Compliance & Audit

### Compliance Standards

| Standard | Scope | Status |
|----------|-------|--------|
| GDPR | EU users | Implemented |
| SOC 2 | Security | In progress |
| HIPAA | Health data | Planned |
| PCI DSS | Payments | Not applicable |

### Audit Logging

| Event | Retention |
|-------|-----------|
| Authentication | 2 years |
| Data access | 1 year |
| Configuration | 5 years |
| Security events | 3 years |

### Audit Fields

```json
{
  "timestamp": "2026-02-23T12:00:00Z",
  "actor": "user123",
  "action": "READ",
  "resource": "profile",
  "result": "SUCCESS",
  "ip": "192.168.1.1"
}
```

---

## 146. Incident Response

### Severity Levels

| Level | Response Time | Examples |
|-------|---------------|----------|
| P1 | 15 min | Full outage |
| P2 | 1 hour | Feature broken |
| P3 | 4 hours | Minor issue |
| P4 | 24 hours | Cosmetic |

### Response Process

1. **Identify**: Alert triggers
2. **Triage**: Assess severity
3. **Mitigate**: Stop bleeding
4. **Resolve**: Fix root cause
5. **Review**: Post-mortem
6. **Prevent**: Add monitoring

---

## 147. Database Migrations

### Migration Files

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Initial schema |
| `001_initial_schema_rollback.sql` | Rollback initial |
| `002_gamification_and_collaboration.sql` | Gamification tables |
| `002_add_performance_indexes.sql` | Performance indexes |
| `003_fix_schema_inconsistencies.sql` | Schema fixes |
| `003_optimize_indexes.sql` | Index optimization |
| `008_implement_sharding.sql` | Sharding implementation |

### Migration Schema

```sql
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 148. Performance Monitoring

### Monitoring Stack

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection |
| Grafana | Visualization |
| Jaeger | Distributed tracing |
| ELK Stack | Log aggregation |
| P95 | Uptime monitoring |

### Key Metrics

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU Usage | >80% | Alert |
| Memory | >85% | Alert |
| Response Time P99 | >2s | Investigate |
| Error Rate | >1% | Alert |
| Availability | <99.9% | Alert |

---

## 149. Error Handling Patterns

### Error Response Format

```json
{
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "details": {},
    "traceId": "abc123"
  }
}
```

### Error Categories

| Category | HTTP Code | Handling |
|----------|-----------|----------|
| Validation | 400 | Return errors |
| Auth | 401 | Redirect login |
| Forbidden | 403 | Show message |
| Not Found | 404 | Show 404 page |
| Server | 500 | Log, generic msg |

---

## 150. Pagination Strategies

### Offset Pagination

```sql
SELECT * FROM jobs LIMIT 20 OFFSET 40;
```

### Cursor Pagination

```sql
SELECT * FROM jobs
WHERE id > cursor
ORDER BY id
LIMIT 20;
```

### Comparison

| Approach | Pros | Cons |
|----------|------|------|
| Offset | Simple | Slow on large pages |
| Cursor | Fast | No random access |
| Keyset | Very fast | Limited sorting |

---

## 151. Search Implementation

### Search Features

| Feature | Implementation |
|---------|----------------|
| Full-text | PostgreSQL tsvector |
| Filters | Multiple criteria |
| Autocomplete | Prefix matching |
| Faceted | Aggregations |
| Relevance | BM25 ranking |

### Search Optimization

- Index frequently queried columns
- Use covering indexes
- Cache results
- Limit result set
- Async reindexing

---

## 154. Caching Architecture

### Cache Layers

| Layer | Technology | TTL |
|-------|------------|-----|
| CDN | CloudFlare | 1 day |
| API Gateway | Redis | 5 min |
| Application | Redis/In-memory | 1 min |
| Database | Query cache | 30 sec |

### Cache Headers

```
Cache-Control: public, max-age=300
ETag: "abc123"
Last-Modified: Mon, 23 Feb 2026 12:00:00Z
```

---

## 155. Webhook System

### Webhook Configuration

```javascript
const webhook = new WebhookHandler({
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
  secret: process.env.WEBHOOK_SECRET
});
```

### Webhook Events

| Event | Payload | Retry |
|-------|---------|-------|
| user.created | User data | 3x |
| job.posted | Job data | 3x |
| payment.completed | Payment data | 5x |
| subscription.renewed | Subscription | 5x |

---

## 156. Idempotency Implementation

### Idempotency Key

```javascript
// Request with idempotency key
POST /api/v1/payments
Idempotency-Key: unique-key-123
{
  "amount": 100,
  "currency": "USD"
}
```

### Implementation

```javascript
const result = await idempotency.execute(
  'payment-123',
  () => processPayment(data)
);
```

### Key Storage

- Redis with 24h TTL
- Composite key: `${method}:${path}:${idempotencyKey}`

---

## 157. Batch Processing

### Batch Endpoints

| Endpoint | Batch Size | Timeout |
|----------|------------|---------|
| /users/import | 1000 | 5 min |
| /jobs/bulk-update | 500 | 2 min |
| /notifications/send | 10000 | 10 min |

### Processing Strategy

- Queue-based processing
- Progress tracking
- Partial failure handling
- Retry failed items

---

## 152. API Design Principles

### RESTful Guidelines

| Principle | Implementation |
|-----------|----------------|
| Resource naming | Nouns, plural: /users |
| HTTP verbs | GET/POST/PUT/DELETE |
| Status codes | 200/201/204/400/401/404/500 |
| Versioning | URL: /v1/ |
| Pagination | ?page=1&limit=20 |

### Best Practices

- Consistent response format
- Versioned API
- Rate limiting

---

## 153. Database Schema Files

### Main Schema Files

| File | Location | Purpose |
|------|----------|---------|
| `database-schema.sql` | `database/schema/` | Core schema |
| `database-indexes.sql` | `database/indexes/` | Performance indexes |
| `database-optimization.sql` | `scripts/` | Query optimization |

### Service-Specific Migrations

| Service | Migration Files |
|---------|----------------|
| Auth | `001_create_users_table.sql` |
| User | `001_create_user_tables.sql` |
| Job | `001_create_job_tables.sql` |
| Company | `migration.sql`, `migration-corrected.sql` |
| Network | `004_create_network_tables.sql` |
| Notifications | `005_create_notifications_table.sql` |
| Analytics | `migration.sql` |

### Additional Migrations

| File | Purpose |
|------|---------|
| `000_initial_schema.sql` | Initial backend schema |
| `001_init_schema.sql` | Root migrations |
| `002_schema_standardization.sql` | Schema standardization |
| `003_fix_missing_columns.sql` | Column fixes |
| `004_job_listing_service.sql` | Job listing service |
| `005_user_profile_service.sql` | User profile service |
| `006_create_performance_indexes.sql` | Performance indexes |
| `007_create_refresh_token_tables.sql` | Refresh tokens |

---

## 158. Service Database Migrations

### Auth Service Migrations
- `001_create_users_table.sql` - User authentication tables

### Backend Enhanced Migrations

| Service | Path |
|---------|------|
| User Service | `backends/backend-enhanced/user-service/migrations/` |
| Job Service | `backends/backend-enhanced/job-service/migrations/` |
| Company Service | `backends/backend-enhanced/company-service/` |

### Spring Boot Migrations

| Version | Purpose |
|---------|---------|
| V3 | Create Certificates Table |

---

## 159. Query Optimization

### Optimization Techniques

| Technique | Description |
|-----------|-------------|
| Indexing | B-tree for equality, GIN for text |
| Query Planning | EXPLAIN ANALYZE |
| Connection Pooling | pgBouncer |
| Caching | Redis layer |
| Partitioning | Range partitioning by date |

### Slow Query Analysis

```sql
-- Enable timing
\timing on

-- Analyze slow query
EXPLAIN ANALYZE
SELECT * FROM jobs
WHERE status = 'open'
AND created_at > '2026-01-01';
```

### Index Types

| Type | Use Case |
|------|----------|
| B-tree | Equality, range queries |
| GIN | Full-text search, JSONB |
| Hash | Simple equality |
| BRIN | Time-series data |

---

## 160. Data Validation

### Validation Layers

| Layer | Implementation |
|--------|---------------|
| Client | JavaScript validation |
| API | Joi/Zod schemas |
| Database | Constraints, triggers |

### Constraint Types

| Constraint | Usage |
|------------|-------|
| NOT NULL | Required fields |
| UNIQUE | Duplicate prevention |
| CHECK | Value validation |
| FOREIGN KEY | Referential integrity |
| DEFAULT | Default values |

---

## 161. Event Sourcing

### Event Store

| Component | Purpose |
|-----------|---------|
| Events Table | Store all events |
| Snapshots | Performance optimization |
| Projections | Read models |

### Event Structure

```javascript
{
  eventId: 'uuid',
  aggregateId: 'user123',
  type: 'UserCreated',
  payload: { name: 'John', email: 'john@example.com' },
  metadata: { correlationId: 'abc', causationId: 'xyz' },
  timestamp: '2026-02-23T12:00:00Z'
}
```

---

## 162. CQRS Pattern

### Command Model

| Operation | Handler |
|-----------|---------|
| CreateUser | CommandHandler |
| UpdateJob | CommandHandler |
| DeleteApplication | CommandHandler |

### Query Model

| Query | Handler |
|-------|---------|
| GetUserById | QueryHandler |
| ListJobs | QueryHandler |
| SearchProfiles | QueryHandler |

---

## 163. Microservices Patterns

### Communication Patterns

| Pattern | Implementation |
|---------|---------------|
| API Gateway | Central entry point |
| Service Mesh | Istio |
| Sidecar | Envoy proxies |

### Design Patterns

| Pattern | Purpose |
|---------|---------|
| Database per service | Isolation |
| Event sourcing | Audit trail |
| CQRS | Performance |
| Saga | Distributed transactions |

---

## 164. Service Mesh

### Istio Features

| Feature | Benefit |
|---------|---------|
| mTLS | Secure communication |
| Traffic management | Canary deployments |
| Observability | Tracing, metrics |
| Policy enforcement | Access control |

### Traffic Splitting

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: job-service
spec:
  hosts:
  - job-service
  http:
  - route:
    - destination:
        host: job-service
        subset: v1
      weight: 90
    - destination:
        host: job-service
        subset: v2
      weight: 10
```

---

## 165. API Gateway Patterns

### Gateway Responsibilities

| Responsibility | Implementation |
|---------------|----------------|
| Request routing | Path-based |
| Composition | GraphQL Federation |
| Protocol translation | REST to gRPC |
| Authentication | JWT validation |
| Rate limiting | Redis |
| Circuit breaker | Custom |

### GraphQL Federation

```graphql
type Job @key(fields: "id") {
  id: ID!
  title: String!
  company: Company @external
}
```

---

## 166. Testing Strategy

### Test Pyramid

```
        /\
       /E2E\
      /------\
     /Integration\
    /------------\
   /    Unit     \
  /________________\
```

### Testing Ratios

| Level | Percentage | Speed |
|-------|-----------|-------|
| Unit | 70% | Fast |
| Integration | 20% | Medium |
| E2E | 10% | Slow |

### Testing Tools

| Type | Tool | Purpose |
|-------|------|---------|
| Unit | Jest | Component testing |
| Integration | Supertest | API testing |
| E2E | Playwright | Browser testing |
| Contract | Pact | API contracts |

---

## 167. Configuration Management

### Config Files

| File | Purpose |
|------|---------|
| `config.js` | Main configuration |
| `config-reloader.js` | Hot config reload |
| `config-manager.js` | Config management |
| `config-validator.js` | Validation |

### Configuration Pattern

```javascript
const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    pool: { min: 2, max: 10 }
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  server: {
    port: parseInt(process.env.PORT) || 3000
  }
};
```

---

## 168. Environment Setup

### Required Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 3000 |
| DATABASE_URL | PostgreSQL connection | - |
| REDIS_URL | Redis connection | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_REFRESH_SECRET | Refresh token secret | - |

### Optional Variables

| Variable | Description |
|----------|-------------|
| OPENAI_API_KEY | OpenAI for AI features |
| AWS_ACCESS_KEY | S3 file storage |
| STRIPE_SECRET | Payment processing |
| SENDGRID_API_KEY | Email delivery |

---

## 169. Security Patterns

### Authentication Flow

```
User → Login → Auth Service → Validate → JWT Token
                                    ↓
                              Refresh Token (stored)
```

### Security Headers

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

---

## 170. Rate Limiting Implementation

### Redis Rate Limiter

```javascript
const rateLimiter = new RateLimiterRedis({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  max: 100,
  windowMs: 60 * 1000
});
```

### Custom Rate Limiter

```javascript
const customLimiter = {
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests'
    });
  }
};
```

---

## 171. Data Encryption

### Encryption at Rest

| Data Type | Method |
|-----------|--------|
| Passwords | bcrypt (hashed) |
| API Keys | AES-256 |
| Personal Data | AES-256 |
| Backup | Encrypted archives |

### Encryption in Transit

- TLS 1.3 for all connections
- Certificate pinning for mobile
- HSTS headers

---

## 172. Access Control

### Role-Based Access

```javascript
const roles = {
  admin: ['*'],
  employer: ['jobs:read', 'jobs:write', 'applications:read'],
  jobseeker: ['profile:read', 'profile:write', 'applications:write'],
  guest: ['jobs:read']
};
```

### Middleware Implementation

```javascript
const authorize = (allowedRoles) => (req, res, next) => {
  const userRole = req.user.role;
  if (allowedRoles.includes(userRole) || userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
};
```

---

## 173. Data Export/Import

### Export Formats

| Format | Use Case |
|--------|---------|
| CSV | Spreadsheet compatibility |
| JSON | API integration |
| XML | Legacy systems |
| PDF | Reports |

### Import Processing

```javascript
const processImport = async (file) => {
  const records = await parseCSV(file);
  const validation = await validateRecords(records);
  if (validation.valid) {
    await bulkInsert(validation.data);
    return { success: true, count: records.length };
  }
  return { success: false, errors: validation.errors };
};
```

---

## 174. Background Jobs

### Job Queue

| Queue | Priority | Processing |
|-------|----------|------------|
| default | Normal | Sync |
| high | High | Immediate |
| low | Low | Batch |
| mail | Normal | Async |

### Job Processors

```javascript
const jobProcessor = async (job) => {
  switch (job.name) {
    case 'sendEmail':
      await sendEmail(job.data);
      break;
    case 'processPayment':
      await processPayment(job.data);
      break;
    case 'generateReport':
      await generateReport(job.data);
      break;
  }
};
```

---

## 175. Notification System

### Notification Channels

| Channel | Use Case |
|---------|----------|
| Email | Important updates |
| In-app | Real-time alerts |
| Push | Mobile notifications |
| SMS | Urgent alerts |

### Notification Events

| Event | Channels |
|-------|----------|
| New Application | Email, In-app |
| Job Status Change | Email, Push |
| Message Received | In-app, Push |
| Profile View | In-app |

---

## 176. Payment Integration

### Stripe Integration

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const createPayment = async (amount, currency, customerId) => {
  const payment = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency,
    customer: customerId
  });
  return payment;
};
```

### Webhook Handling

```javascript
app.post('/webhooks/stripe', (req, res) => {
  const event = req.body;
  switch (event.type) {
    case 'payment_intent.succeeded':
      handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      handlePaymentFailure(event.data.object);
      break;
  }
  res.json({ received: true });
});
```

---

## 177. Email Service

### Email Providers

| Provider | Use Case | Status |
|----------|---------|--------|
| SendGrid | Primary | Configurable |
| Mailgun | Secondary | Configurable |
| SES | AWS | Planned |
| SMTP | Custom | Supported |

### Email Templates

| Template | Purpose |
|----------|---------|
| welcome | New user registration |
| password_reset | Password recovery |
| job_alert | New job matching |
| application_status | Application updates |
| newsletter | Marketing emails |

---

## 178. Search Service

### Elasticsearch Integration

| Index | Documents | Purpose |
|-------|-----------|---------|
| users | User profiles | People search |
| jobs | Job postings | Job search |
| companies | Company profiles | Company search |
| courses | Learning content | LMS search |

### Search Features

| Feature | Implementation |
|---------|----------------|
| Autocomplete | Completion suggester |
| Fuzzy matching | Edit distance |
| Filters | Boolean queries |
| Aggregations | Faceted search |
| Highlighting | Match highlighting |

---

## 179. Video Service

### Video Processing

| Feature | Implementation |
|---------|----------------|
| Upload | Direct to S3 |
| Transcoding | FFmpeg to HLS |
| Storage | S3 + CloudFront |
| Player | Video.js |

### WebRTC for Interviews

```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

---

## 180. Analytics Service

### Event Tracking

| Event | Description |
|-------|-------------|
| page_view | Page navigation |
| button_click | User interactions |
| search_query | Search terms |
| job_view | Job views |
| application_submit | Applications |

### Metrics

| Metric | Calculation |
|--------|-------------|
| DAU | Unique users per day |
| MAU | Unique users per month |
| Conversion | Applications / Views |
| Retention | Day 1/7/30 retention |

---

## 181. Logging Standards

### Log Structure

```javascript
{
  "timestamp": "2026-02-23T12:00:00Z",
  "level": "info",
  "service": "auth-service",
  "message": "User login",
  "context": {
    "userId": "user123",
    "ip": "192.168.1.1",
    "correlationId": "abc123"
  }
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| error | Exceptions, errors |
| warn | Warnings |
| info | Important events |
| debug | Debug info |
| http | HTTP requests |

---

## 184. Performance Budgets

### Frontend Budgets

| Metric | Budget |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Bundle Size | < 200KB |
| API Response | < 500ms |

### Backend Budgets

| Metric | Budget |
|--------|--------|
| P50 Latency | < 100ms |
| P95 Latency | < 500ms |
| P99 Latency | < 1s |
| Error Rate | < 0.1% |
| Uptime | > 99.9% |

---

## 185. API Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## 186. GraphQL Implementation

### Schema Types

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  profile: Profile
  jobs: [Job]
}

type Query {
  user(id: ID!): User
  users(filter: UserFilter): [User]
}

type Mutation {
  createUser(input: CreateUserInput!): User
  updateUser(id: ID!, input: UpdateUserInput!): User
}
```

### Resolver Pattern

```javascript
const resolvers = {
  Query: {
    user: (_, { id }) => getUserById(id),
    users: (_, { filter }) => searchUsers(filter)
  },
  Mutation: {
    createUser: (_, { input }) => createUser(input)
  },
  User: {
    profile: (user) => getProfile(user.id)
  }
};
```

---

## 187. WebSocket Events

### Connection Events

| Event | Direction | Data |
|-------|-----------|------|
| connect | Client→Server | auth token |
| disconnect | Server→Client | reason |
| auth_error | Server→Client | error message |

### Application Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| notification | Server→Client | Push notifications |
| message | Bidirectional | Chat messages |
| typing | Bidirectional | Typing indicators |
| presence | Server→Client | Online status |

---

## 182. API Deprecation

### Deprecation Headers

```
Deprecation: true
Sunset: Sat, 01 Jun 2026 00:00:00 GMT
Link: <https://api.example.com/v2/users>; rel="alternate"
```

---

## 183. Service Catalog

### Service Metadata

| Service | Owner | Tier | SLA |
|---------|-------|------|-----|
| auth-service | Platform Team | Critical | 99.99% |
| user-service | Platform Team | Critical | 99.99% |
| job-service | Jobs Team | High | 99.9% |
| search-service | Platform Team | High | 99.9% |

### Service Tiers

| Tier | Uptime | Support |
|------|--------|---------|
| Critical | 99.99% | 24/7 |
| High | 99.9% | Business hours |
| Medium | 99.5% | Business hours |
| Low | 99% | Best effort |

---

## 188. Feature Flags System

### Flag Types

| Type | Purpose |
|------|---------|
| Release | Enable/Disable features |
| Experiment | A/B testing |
| Operational | Kill switches |
| Permission | User-specific |

### Flag Configuration

```javascript
{
  "feature": {
    "name": "new_search",
    "enabled": true,
    "rollout": 100,
    "targeting": {
      "userTypes": ["premium", "enterprise"]
    }
  }
}
```

---

## 189. Load Balancing

### Load Balancer Types

| Type | Use Case |
|------|----------|
| Layer 4 (L4) | TCP/UDP |
| Layer 7 (L7) | HTTP/HTTPS |
| DNS | Geographic |
| Client-side | Application |

### Algorithms

| Algorithm | Description |
|-----------|-------------|
| Round Robin | Sequential |
| Least Connections | Fewest active |
| IP Hash | Session affinity |
| Weighted | Custom distribution |

---

## 184. Circuit Breaker

### States

| State | Behavior |
|-------|----------|
| CLOSED | Normal operation |
| OPEN | Reject requests |
| HALF_OPEN | Test recovery |

### Configuration

```javascript
const circuitBreaker = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000,
  volumeThreshold: 10
};
```

---

## 185. Retry Policy

### Retry Strategy

| Strategy | Use Case |
|----------|----------|
| Immediate | Non-critical |
| Linear | Normal |
| Exponential | Critical |

### Configuration

```javascript
const retryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoff: 'exponential'
};
```

---

## 186. Timeout Handling

### Timeout Values

| Operation | Timeout |
|-----------|---------|
| API Request | 30s |
| Database Query | 10s |
| External API | 15s |
| File Upload | 60s |
| Background Job | 5min |

### Implementation

```javascript
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
};
```

---

## 198. Request Validation

### Validation Libraries

| Library | Use |
|---------|-----|
| Joi | Schema validation |
| Zod | TypeScript validation |
| Yup | Form validation |

### Schema Example

```javascript
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('user', 'admin')
});
```

---

## 199. Response Caching

### Cache Strategies

| Strategy | TTL | Use Case |
|----------|-----|----------|
| Cache-Aside | 5-60min | Read-heavy |
| Write-Through | - | Data consistency |
| Write-Behind | Async | Write-heavy |

### Cache Headers

| Header | Purpose |
|--------|---------|
| Cache-Control | Caching policy |
| ETag | Version identifier |
| Vary | Variant selection |
| Age | Object age |

---

## 200. Database Transactions

### Transaction Types

| Type | Use |
|------|-----|
| ACID | Financial transactions |
| Read Committed | Default |
| Serializable | Strict consistency |

### Implementation

```javascript
const transaction = async (client) => {
  await client.query('BEGIN');
  try {
    await client.query('INSERT INTO...');
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
};
```

---

## 192. Error Monitoring

### Monitoring Tools

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking |
| LogRocket | Session replay |
| Bugsnag | Error aggregation |

### Error Categories

| Category | Example |
|----------|---------|
| Runtime | NullReference |
| Network | Timeout |
| Validation | Invalid input |

---

## 193. API Versioning

### Version Strategies

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URL Path | /v1/users | Clear | Duplication |
| Header | Accept: v1 | Clean | Complex |
| Query | ?v=1 | Simple | Caching |

### Version Lifecycle

| Phase | Duration |
|-------|----------|
| Current | Active |
| Deprecated | 6 months |
| Sunset | 3 months |
| Removed | After sunset |

---

## 194. Response Compression

### Compression Methods

| Method | Ratio | CPU |
|--------|-------|-----|
| gzip | High | Medium |
| Brotli | Highest | High |
| Deflate | Medium | Low |

### Configuration

```javascript
app.use(compression({
  threshold: 1024,
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

---

## 195. Connection Pooling

### Pool Configuration

```javascript
const pool = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};
```

### Monitoring

| Metric | Alert |
|--------|-------|
| Active connections | >80% |
| Wait time | >100ms |
| Idle connections | <2 |

---

## 196. Database Connections

### Connection Types

| Type | Use |
|------|-----|
| Pooled | Web requests |
| Dedicated | Batch jobs |
| Read replica | Read queries |

### Failover

- Automatic reconnection
- Connection string failover
- Health check before use

---

## 197. API Throttling

### Throttling Levels

| Level | Requests | Period |
|-------|----------|--------|
| Free | 100 | Hour |
| Basic | 1000 | Hour |
| Pro | 10000 | Hour |
| Enterprise | Unlimited | - |

### Implementation

```javascript
const throttle = {
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
};
```

---

## 201. Health Checks

### Check Types

| Type | Frequency | Purpose |
|------|-----------|---------|
| Liveness | 10s | Container alive |
| Readiness | 30s | Service ready |
| Startup | 60s | Startup complete |

### Check Response

```json
{
  "status": "healthy",
  "checks": {
    "database": "pass",
    "redis": "pass",
    "external_api": "fail"
  }
}
```

---

## 202. Graceful Shutdown

### Shutdown Sequence

1. Stop accepting new requests
2. Wait for in-flight requests
3. Close database connections
4. Flush logs
5. Exit process

### Implementation

```javascript
process.on('SIGTERM', async () => {
  server.close(() => {
    await pool.end();
    logger.info('Shutdown complete');
    process.exit(0);
  });
});
```

---

## 203. Data Sanitization

### Sanitization Rules

| Input | Action |
|-------|--------|
| SQL | Parameterized queries |
| XSS | HTML escape |
| CSRF | Token validation |
| Input length | Truncation |

---

## 204. Session Management

### Session Storage

| Storage | Use |
|---------|-----|
| Redis | Production |
| Memory | Development |
| Database | Fallback |

### Session Config

```javascript
const session = {
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true }
};
```

---

## 200. API Authentication

### Auth Methods

| Method | Use Case |
|--------|----------|
| JWT | API access |
| API Key | Service-to-service |
| OAuth 2.0 | Third-party |
| Basic Auth | Legacy |

### Token Types

| Token | Expiry | Use |
|-------|--------|-----|
| Access | 15 min | API calls |

---

## 201. Two-Factor Authentication

### 2FA Methods

| Method | Implementation |
|--------|---------------|
| TOTP | Authenticator apps |
| SMS | Phone verification |
| Email | Code verification |
| Hardware | Security keys |

### Implementation

```javascript
const generateTOTP = (secret) => {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32'
  });
};
```

---

## 202. Password Security

### Requirements

| Rule | Value |
|------|-------|
| Minimum length | 8 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Number | At least 1 |
| Special char | At least 1 |

### Hashing

- Algorithm: bcrypt
- Salt rounds: 12
- Max attempts: 5

---

## 203. SQL Injection Prevention

### Prevention Methods

| Method | Implementation |
|--------|---------------|
| Parameterized | Prepared statements |
| ORM | Query builder |
| Validation | Input sanitization |
| Escaping | Escape functions |

---

## 204. XSS Prevention

### Prevention

| Type | Protection |
|------|------------|
| Reflected | Output encoding |
| Stored | Input validation |
| DOM | Context-aware encoding |

### Headers

```
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
```

---

## 205. CSRF Protection

### Implementation

- CSRF tokens
- SameSite cookies
- Origin validation

### Token Flow

```
Server → Form → Token → Submit → Verify
```

---

## 206. CORS Configuration

### Default Policy

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true
};
```

---

## 207. Security Headers

### Headers List

| Header | Value |
|--------|-------|
| Strict-Transport-Security | max-age=31536000 |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |

---

## 208. File Upload Security

### Restrictions

| Rule | Value |
|------|-------|
| Max size | 25MB |
| Allowed types | jpg, png, pdf, docx |
| Scanning | Virus scan |
| Storage | S3 with ACL |

---

## 209. API Rate Limiting

### Rate Limits

| Tier | Limit | Window |
|------|-------|--------|
| Anonymous | 60 | 1 hour |
| Authenticated | 1000 | 1 hour |
| Premium | 10000 | 1 hour |

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## 210. IP Allowlist

### Configuration

```javascript
const ipWhitelist = [
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16'
];
```

### Middleware

```javascript
const whitelistMiddleware = (req, res, next) => {
  const clientIP = req.ip;
  if (isWhitelisted(clientIP)) {
    next();
  } else {
    res.status(403).json({ error: 'IP not allowed' });
  }
};
```

---

## 211. Audit Logging

### Events to Log

| Event | Category |
|-------|----------|
| Login/Logout | Authentication |
| Data access | Data |
| Configuration changes | Admin |
| Permission changes | Security |

### Log Format

```json
{
  "timestamp": "2026-02-23T12:00:00Z",
  "actor": "user123",
  "action": "READ",
  "resource": "profile",
  "ip": "192.168.1.1"
}
```

---

## 212. Compliance Requirements

### Standards

| Standard | Status |
|----------|--------|
| GDPR | Implemented |
| SOC 2 | In Progress |
| HIPAA | Planned |
| PCI DSS | Not Applicable |

---

## 213. Backup Strategy

### Backup Types

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full | Daily | 30 days |
| Incremental | Hourly | 7 days |
| Logs | Continuous | 90 days |

---

## 214. Disaster Recovery

### Recovery Plan

| Step | Action |
|------|--------|
| 1 | Assess impact |
| 2 | Notify team |
| 3 | Activate DR |
| 4 | Restore services |
| 5 | Verify |

---

## 215. Deployment Strategy

### Strategy

| Type | Description |
|------|-------------|
| Blue-Green | Two identical environments |
| Canary | Gradual rollout |
| Rolling | Incremental updates |

---

## 216. Zero Downtime Deployment

### Requirements

- Health checks
- Graceful shutdown
- Load balancer updates
- Database migrations (non-blocking)

---

## 217. Database Migrations

### Best Practices

- Test on staging
- Backup before
- Small batches
- Rollback plan

---

## 218. API Contracts

### Contract Testing

```javascript
const verifyContract = async (provider, consumer) => {
  const result = await pact.verifyPacts(provider, consumer);
  return result;
};
```

---

## 219. Chaos Engineering

### Experiments

| Experiment | Target |
|------------|--------|
| pod-failure | Service |
| network-latency | Gateway |
| cpu-stress | Database |

---

## 220. Performance Testing

### Types

| Type | Tool | Purpose |
|------|------|---------|
| Load | k6 | Capacity |
| Stress | k6 | Breaking point |
| Endurance | k6 | Long-running |
| Spike | k6 | Sudden load |

---

## 221. AI/ML Integration

### AI Assistant Service
- OpenAI GPT-4 integration for code assistance
- Fallback to mock mode when API key not configured
- Code analysis, explanation, debugging support

### ML Pipeline
- Feature extraction for job recommendations
- User behavior clustering
- Resume matching algorithms

### Implementation
```javascript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function analyzeCode(code) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: `Analyze this code: ${code}` }]
  });
  return response.choices[0].message;
}
```

---

## 222. Cost Optimization

### Compute Optimization
- Right-sizing: Match instance sizes to actual usage
- Spot instances for non-critical workloads
- Auto-scaling to zero for development environments

### Database Optimization
- Connection pooling optimization
- Query caching strategies
- Read replicas for read-heavy workloads

### Cost Monitoring
- AWS Cost Explorer / GCP Billing
- Daily/weekly cost alerts
- Resource tagging for accountability

### Best Practices
| Area | Action |
|------|--------|
| Compute | Use spot + savings plans |
| Storage | Lifecycle policies for S3 |
| Network | CloudFront caching |
| Database | Reserved instances |

---

## 223. Edge Computing

### Edge Use Cases
- CDN for static assets
- Edge functions for A/B testing
- Regional data processing

### Implementation
```javascript
// Edge function example
export default function handler(request) {
  const country = request.geo.country;
  const content = getLocalizedContent(country);
  return new Response(content, {
    headers: { 'Cache-Control': 'public, max-age=3600' }
  });
}
```

### Edge Providers
| Provider | Use Case |
|----------|----------|
| CloudFlare Workers | A/B testing, redirects |
| AWS Lambda@Edge | Request/response modification |
| Vercel Edge | SSR, personalization |

---

## 224. Serverless Patterns

### When to Use Serverless
- Event-driven workloads
- Infrequent/periodic tasks
- Burst capacity needs
- Cost optimization for variable load

### Implemented Serverless
- Lambda for image processing
- Step Functions for workflows
- Event-driven triggers

### Architecture
```
Event (S3, SQS, DynamoDB)
    ↓
Lambda Function
    ↓
Data Processing
    ↓
Result Storage
```

---

## 225. WebAssembly (WASM)

### Use Cases
- Performance-critical computations
- Browser-based video editing
- Image processing in edge

### Implementation
```rust
#[no_mangle]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2)
    }
}
```

### Integration
- Compile to WASM with wasm-pack
- Load in Node.js or browser
- Performance: ~10-20x faster than JS

---

## 226. Real-time Collaboration (CRDT)

### Yjs Integration
- Conflict-free replicated data types
- Real-time document editing
- Cursor awareness

### Architecture
```
Client A ←── Yjs Sync ──→ Client B
    ↓                           ↓
Document State ←──→ Document State
```

### Implementation
```javascript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
const provider = new WebsocketProvider('wss://collab.example.com', 'room-id', doc);
const yText = doc.getText('content');

yText.observe(event => {
  console.log('Document changed:', yText.toString());
});
```

---

## 227. Data Privacy (GDPR)

### Compliance Measures
- Data encryption at rest and in transit
- Right to deletion (GDPR Art. 17)
- Data portability (GDPR Art. 20)
- Consent management

### Implementation
```javascript
// Delete user data
async function deleteUserData(userId) {
  await db.users.where('id').equals(userId).delete();
  await db.profiles.where('userId').equals(userId).delete();
  await auditLog.info('USER_DATA_DELETED', { userId, timestamp: new Date() });
}
```

### Data Subject Rights
| Right | Implementation |
|-------|----------------|
| Access | Export all user data as JSON |
| Rectification | Update profile API |
| Erasure | Deletion with cascade |
| Portability | JSON export endpoint |

---

## 228. Incident Response

### Severity Levels
| Level | Response Time | Examples |
|-------|---------------|----------|
| P1 | 15 min | Complete outage |
| P2 | 1 hour | Major feature down |
| P3 | 4 hours | Minor issue |
| P4 | 24 hours | Cosmetic |

### Runbook Structure
1. **Detection**: Monitoring alerts
2. **Triage**: Assess impact
3. **Mitigation**: Stop bleeding
4. **Resolution**: Fix root cause
5. **Post-mortem**: Document learnings

### On-Call
- PagerDuty rotation
- Escalation policy
- Status page updates

---

## 229. API Monetization

### Pricing Tiers
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 100 API calls/day |
| Pro | $29/mo | 10K calls/day |
| Enterprise | Custom | Unlimited + SLA |

### Implementation
```javascript
async function checkRateLimit(userId, plan) {
  const limits = {
    free: 100,
    pro: 10000,
    enterprise: Infinity
  };

  const usage = await getDailyUsage(userId);
  if (usage >= limits[plan]) {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## 230. Documentation Standards

### Code Documentation
- JSDoc for public APIs
- README.md for each service
- OpenAPI specs for APIs

### Architecture Decisions
- ADRs (Architecture Decision Records)
- Location: `docs/adr/`
- Template: Context, Decision, Consequences

### Runbooks
- Service-specific runbooks
- On-call guides
- Post-mortem templates

---

## Maintenance Guidelines

1. **SSOT Enforcement**: `docs/SSOT.md` is the only location for system-wide architectural documentation.
2. **PR Review Check**: Add checklist item: _"Does this PR require an update to `docs/SSOT.md`?"_
3. **API Documentation**: Use OpenAPI/Swagger (`/api/openapi.yaml`). Do not manually document API routes.
4. **Bi-weekly Audits**: Review technical debt, specifically duplicate Course/Challenge services.

---

_Last Updated: February 2026_
````
