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
│   ├── backend-springboot/   # Java LMS domain (Courses, Enrollments)
│   ├── backend-dotnet/       # C# Domain (Challenges, Payments, Discussions)
│   ├── backend-flask/        # Python Domain (AI, Data Processing)
│   ├── backend-gamification/ # Python consumer for event-based gamification
│   └── shared/               # Shared libraries, auth middleware, templates
├── frontend/                  # PNPM Monorepo for UI
│   ├── ts-mfe-shell/        # App Shell / Host Application
│   ├── ts-mfe-lms/          # Learning Management System MFE
│   ├── ts-mfe-challenge/    # Coding Challenge MFE
│   └── packages/            # Shared UI components, API clients
├── infrastructure/           # Docker compose and configs
├── k8s/                     # Kubernetes manifests
├── database/                 # Schemas, migrations, optimization scripts
└── scripts/                  # CI/CD, validation, testing scripts
```

---

## 4. Feature-to-Code Mapping

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

## 5. API / Route Documentation

| Path                   | Service            | Port |
| ---------------------- | ------------------ | ---- |
| `/api/v1/auth/*`       | auth-service       | 3001 |
| `/api/v1/jobs/*`       | job-service        | 3002 |
| `/api/v1/courses/*`    | backend-springboot | 3003 |
| `/api/v1/challenges/*` | backend-dotnet     | 3006 |

---

## 5.1 API Gateway Architecture

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
Frontend → API Gateway → [Auth] → [Rate Limit] → [Proxy] → Backend Service
                    ↓
            Correlation ID Injection
```

| `/api/v1/gamification/*` | backend-gamification | 3004 | | `/api/v1/assistant/*` | backend-assistant | 3005 |

**OpenAPI Specifications**: Located in service-specific `/api/` directories. Access Swagger UI via
`/api/swagger-ui.html` when running.

---

## 6. Configuration & Environment Setup

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

3. **Backend Services**: Run `node scripts/start-services.js` to spin up the API gateway and Node services.

4. **Frontend**:
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

---

## 7. Database & External Services

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

## Maintenance Guidelines

1. **SSOT Enforcement**: `docs/SSOT.md` is the only location for system-wide architectural documentation.
2. **PR Review Check**: Add checklist item: _"Does this PR require an update to `docs/SSOT.md`?"_
3. **API Documentation**: Use OpenAPI/Swagger (`/api/openapi.yaml`). Do not manually document API routes.
4. **Bi-weekly Audits**: Review technical debt, specifically duplicate Course/Challenge services.

---

_Last Updated: February 2026_
