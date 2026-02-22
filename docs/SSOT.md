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

| Path                     | Service              | Port |
| ------------------------ | -------------------- | ---- |
| `/api/v1/auth/*`         | auth-service         | 3001 |
| `/api/v1/jobs/*`         | job-service          | 3002 |
| `/api/v1/courses/*`      | backend-springboot   | 3003 |
| `/api/v1/challenges/*`   | backend-dotnet       | 3006 |
| `/api/v1/gamification/*` | backend-gamification | 3004 |
| `/api/v1/assistant/*`    | backend-assistant    | 3005 |

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

| Issue                       | Description                                                | Status             |
| --------------------------- | ---------------------------------------------------------- | ------------------ |
| **Polyglot Redundancy**     | Courses/Challenges overlap across Spring Boot, .NET, Flask | ⏳ Pending         |
| **EnhancedSecurityManager** | 716-line monolithic class                                  | Low priority       |
| **Legacy Gateways**         | Deprecated gateway files exist                             | ⏳ Pending cleanup |

### Polyglot Domain Overlap Resolution Strategy

#### Current State

| Domain         | Services            | Route                  | Status  |
| -------------- | ------------------- | ---------------------- | ------- |
| **Courses**    | Spring Boot (.java) | `/api/v1/courses/*`    | Active  |
|                | Flask (Python)      | `/api/v1/courses/*`    | Active  |
|                | .NET (C#)           | `/api/courses/*`       | Active  |
| **Challenges** | Flask (Python)      | `/api/v1/challenges/*` | Active  |
|                | .NET (C#)           | `/api/challenges/*`    | Active  |
| **Progress**   | Spring Boot         | `/api/v1/progress/*`   | Primary |
|                | Flask               | `/api/v1/progress/*`   | Active  |

#### Resolution Decision Matrix

| Domain          | Recommended Owner | Rationale                                                                                    | Action                        |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------- | ----------------------------- |
| **Courses**     | Spring Boot       | Java ecosystem better suited for complex domain modeling, ORM (Hibernate), ACID transactions | Deprecate Flask + .NET routes |
| **Lessons**     | Spring Boot       | Tightly coupled to Courses domain                                                            | Deprecate Flask routes        |
| **Enrollments** | Spring Boot       | Part of LMS core domain                                                                      | Deprecate Flask routes        |
| **Challenges**  | .NET              | C# better for code execution sandbox, security                                               | Deprecate Flask routes        |
| **Submissions** | .NET              | Tightly coupled to Challenges                                                                | Keep .NET only                |
| **Progress**    | Spring Boot       | Part of LMS core domain                                                                      | Keep Spring Boot              |

#### Migration Steps

1. **Phase 1: Disable Flask Routes (Courses)**
   - Comment out `/api/v1/courses/*` routes in `backend-flask/app/__init__.py`
   - Update API Gateway to route ALL `/api/v1/courses/*` to Spring Boot
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
