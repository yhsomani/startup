# TalentSphere Technical Documentation

**Last Updated:** February 2026

---

## Section 1: Optimization Issues

### Fixed Issues (Completed)

| #   | File Path                                       | Issue                          | Status                              |
| --- | ----------------------------------------------- | ------------------------------ | ----------------------------------- |
| 1   | `shared/rate-limiter.js`                        | Unused dead code (781 lines)   | ✅ Archived (`_archive/`)           |
| 2   | `shared/input-validator.js`                     | Unused dead code (753 lines)   | ✅ Archived (`_archive/`)           |
| 3   | `shared/comprehensive-security.js`              | Unused (imports dead code)     | ✅ Archived (`_archive/`)           |
| 4   | `shared/logger-fixed.js`                        | Unused duplicate               | ✅ Archived (`_archive/`)           |
| 5   | `backends/shared/enhanced-security-manager.js`  | Monolithic (716 lines)         | ⏳ Pending (low priority)           |
| 6   | `backends/shared/secure-database-connection.js` | Memory leaks from timers       | ✅ Fixed                            |
| 7   | `services/shared/service-discovery.js`          | Memory leaks from setInterval  | ✅ Fixed                            |
| 8   | `shared/state-management.js`                    | Deprecated `new Buffer()`      | ✅ Not found (already fixed)        |
| 9   | `api-gateway/index.js`                          | No request body limits         | ✅ Already exists (10mb)            |
| 10  | `backends/backend-assistant/app.py`             | Hardcoded JWT secret           | ✅ Fixed                            |
| 11  | `backends/backend-gamification/consumer.py`     | No RabbitMQ prefetch           | ✅ Fixed                            |
| 12  | `services/shared/logger.js`                     | Duplicated logger              | ✅ Consolidated to shared/          |
| 13  | `services/shared/error-handler.js`              | Multiple implementations       | ✅ Consolidated to backends/shared/ |
| 14  | Circuit breaker                                 | Already exists                 | ✅ Exists in api-gateway/           |
| 15  | `shared/redis-cache.js`                         | Pipeline error handling        | ✅ Fixed (added per-command errors) |
| 16  | `backends/shared/auth-middleware.js`            | JWT verification without cache | ✅ Fixed (added in-memory cache)    |

### Remaining Issues

| #   | File Path                                      | Function/Class                  | Problem                                      | Impact                    | Priority |
| --- | ---------------------------------------------- | ------------------------------- | -------------------------------------------- | ------------------------- | -------- |
| 1   | `backends/shared/enhanced-security-manager.js` | `EnhancedSecurityManager` class | **716 lines** - Monolithic security handling | Maintainability, Security | Low      |

### Code Duplication

| #   | Files                                                                        | Duplicated Code                        | Status                  |
| --- | ---------------------------------------------------------------------------- | -------------------------------------- | ----------------------- |
| 1   | `shared/logger.js`, `shared/enhanced-logger.js`, `services/shared/logger.js` | Three separate logging implementations | ✅ Fixed (consolidated) |
| 2   | `shared/rate-limiter.js`, `shared/input-validator.js`                        | Unused God classes                     | ✅ Fixed (archived)     |
| 3   | Multiple `auth-middleware.js` files in different backends                    | JWT verification logic copied          | ⏳ Pending              |
| 4   | Multiple `error-handler.js` files                                            | Different error patterns               | ✅ Fixed (consolidated) |

### Architecture Status

| #   | Issue                       | Status                  |
| --- | --------------------------- | ----------------------- |
| 1   | **Circuit breaker pattern** | ✅ Already exists       |
| 2   | **Unified error handling**  | ✅ Fixed (consolidated) |
| 3   | **Unified logging**         | ✅ Fixed (consolidated) |
| 4   | **Service template**        | ✅ Already exists       |
| 5   | **Health check framework**  | ✅ Already exists       |

---

## Section 2: Feature-to-Code Mapping

### Feature Categories

#### 1. Authentication & Authorization

| Component          | Files                                                                             | Entry Points                    |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------- |
| JWT Auth           | `backends/shared/auth-middleware.js`, `backends/backend-flask/app/auth/routes.py` | `/auth/login`, `/auth/register` |
| OAuth              | `shared/oauth-service.js`                                                         | `/auth/oauth/*`                 |
| Two-Factor Auth    | `shared/two-factor-auth.js`                                                       | `/auth/2fa/*`                   |
| Session Management | `shared/session-store.js`                                                         | Via middleware                  |
| API Keys           | `backends/backend-flask/app/api_key/routes.py`                                    | `/api/keys/*`                   |

**Data Flow**:

```
Request → Auth Middleware → JWT Verify → Load User → Attach to Request → Route Handler
```

#### 2. Job Listings & Recruitment

| Component        | Files                                            | Entry Points          |
| ---------------- | ------------------------------------------------ | --------------------- |
| Job CRUD         | `backends/backend-enhanced/job-service/index.js` | `/api/jobs/*`         |
| Company Profiles | `backends/backend-enhanced/company-service/*`    | `/api/companies/*`    |
| Applications     | `backends/backend-recruitment/app.py`            | `/api/applications/*` |
| Search           | `backends/backend-search/index.js`               | `/api/search/*`       |

#### 3. Learning Management System (LMS)

| Component         | Files                                                          | Entry Points         |
| ----------------- | -------------------------------------------------------------- | -------------------- |
| Courses           | `backends/backend-dotnet/Controllers/CoursesController.cs`     | `/api/courses/*`     |
| Progress Tracking | `backends/backend-dotnet/Services/ProgressService.cs`          | `/api/progress/*`    |
| Enrollments       | `backends/backend-dotnet/Controllers/EnrollmentsController.cs` | `/api/enrollments/*` |
| Lessons           | `backends/backend-dotnet/Controllers/LessonsController.cs`     | `/api/lessons/*`     |

#### 4. Gamification

| Component     | Files                                             | Entry Points             |
| ------------- | ------------------------------------------------- | ------------------------ |
| Points/Badges | `backends/backend-gamification/app.py`            | `/api/gamification/*`    |
| Leaderboards  | `backends/backend-gamification/models.py`         | Via gamification service |
| Challenges    | `backends/backend-flask/app/challenges/routes.py` | `/api/challenges/*`      |

#### 5. Real-Time Collaboration

| Component        | Files                                                   | Entry Points           |
| ---------------- | ------------------------------------------------------- | ---------------------- |
| WebSocket Server | `backends/backend-collaboration/app/session_manager.py` | WS `/ws/collaboration` |
| Document Editing | `backends/collaboration-service/*`                      | Yjs CRDT-based         |

#### 6. Notifications

| Component          | Files                                         | Entry Points           |
| ------------------ | --------------------------------------------- | ---------------------- |
| Push Notifications | `backends/backend-node/*`                     | `/api/notifications/*` |
| Email              | `backends/backend-flask/app/email_service.py` | Internal service       |
| In-App             | `shared/notification-handler.js`              | Via event bus          |

#### 7. Analytics & Monitoring

| Component     | Files                                 | Entry Points        |
| ------------- | ------------------------------------- | ------------------- |
| Analytics     | `backends/backend-analytics/index.js` | `/api/analytics/*`  |
| Monitoring    | `backends/backend-monitoring/*`       | `/api/monitoring/*` |
| Health Checks | `shared/health-checks.js`             | `/health`           |

#### 8. AI/ML Services

| Component      | Files                                               | Entry Points        |
| -------------- | --------------------------------------------------- | ------------------- |
| AI Assistant   | `backends/backend-assistant/app.py`                 | `/api/assistant/*`  |
| AI Features    | `backends/backend-ai/app/routes.py`                 | `/api/ai/*`         |
| Code Execution | `backends/backend-flask/app/challenges/executor.py` | Sandboxed execution |

#### 9. Payments (Stripe)

| Component          | Files                                                       | Entry Points           |
| ------------------ | ----------------------------------------------------------- | ---------------------- |
| Payment Processing | `backends/backend-dotnet/Services/PaymentService.cs`        | `/api/payments/*`      |
| Webhooks           | `backends/backend-dotnet/Controllers/PaymentsController.cs` | `/api/webhooks/stripe` |

#### 10. File Storage

| Component     | Files                             | Entry Points   |
| ------------- | --------------------------------- | -------------- |
| S3 Upload     | `services/shared/file-service.js` | `/api/files/*` |
| Local Storage | `shared/upload-handler.js`        | Fallback       |

---

## Section 3: Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Shell    │  │ LMS      │  │Challenge│  │ Performance     │  │
│  │ (MFE)    │  │ (MFE)   │  │ (MFE)   │  │ Dashboard       │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬────────┘  │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                  │
        └─────────────┴──────┬──────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx Gateway  │
                    │  (API Gateway)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐    ┌────────▼────────┐   ┌─────▼─────┐
│ Node.js     │    │ Python/Flask    │   │ .NET      │
│ Services    │    │ Services        │   │ Services  │
│             │    │                  │   │           │
│ - Gateway   │    │ - Auth          │   │ - Courses │
│ - Analytics │    │ - Gamification  │   │ - Payments│
│ - Search    │    │ - Recruitment   │   │ - LMS     │
│ - Network   │    │ - AI Assistant  │   │           │
└──────┬──────┘    └────────┬────────┘   └─────┬─────┘
       │                    │                   │
       └────────────────────┼───────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐       ┌─────▼─────┐    ┌─────▼─────┐
    │PostgreSQL│       │  Redis    │    │ RabbitMQ  │
    └─────────┘       └───────────┘    └───────────┘
```

### Folder Structure

```
TalentSphere/
├── api-gateway/          # Nginx/API Gateway config
├── backends/             # All backend services
│   ├── backend-node/     # Node.js service template
│   ├── backend-flask/    # Python Flask (Auth, Main API)
│   ├── backend-dotnet/   # .NET (LMS, Payments)
│   ├── backend-springboot/ # Java (Progress tracking)
│   ├── backend-enhanced/ # Enhanced Node.js services
│   └── shared/           # Shared backend utilities
├── frontend/             # Micro-frontend apps
│   ├── ts-mfe-shell/     # Shell application
│   ├── ts-mfe-lms/       # LMS micro-frontend
│   ├── ts-mfe-challenge/ # Challenge platform
│   └── packages/         # Shared packages (@talentsphere/*)
├── shared/               # Shared Node.js utilities
├── services/shared/      # Shared service utilities
├── infrastructure/       # Docker, K8s configs
├── k8s/                   # Kubernetes manifests
├── monitoring/           # Monitoring dashboards
├── nginx/               # Nginx configurations
├── scripts/            # Dev/ops scripts
├── tests/              # Integration tests
└── tools/              # Development tools
```

### Design Patterns Used

| Pattern             | Implementation                  | Location                                       |
| ------------------- | ------------------------------- | ---------------------------------------------- |
| **Microservices**   | Independent deployable services | `/backends/*`                                  |
| **API Gateway**     | Nginx + Express routing         | `/api-gateway/`                                |
| **Event-Driven**    | RabbitMQ message bus            | Throughout                                     |
| **Circuit Breaker** | Enhanced service template       | `backends/shared/enhanced-service-template.js` |
| **Repository**      | Database abstraction            | `backends/backend-enhanced/*/repository.js`    |
| **CQRS**            | Separate read/write models      | .NET services                                  |
| **Factory**         | Service creation                | `shared/*-factory.js`                          |
| **Middleware**      | Request/response pipeline       | All backends                                   |
| **Singleton**       | Database pools, loggers         | `shared/database-pool.js`                      |

### Anti-Patterns & Issues

| Issue                           | Description                             | Status / Remediation                        |
| ------------------------------- | --------------------------------------- | ------------------------------------------- |
| **God Classes**                 | RateLimiter, InputValidator > 700 lines | ✅ Fixed (archived)                         |
| **Inconsistent Error Handling** | Each service has own pattern            | ✅ Fixed (consolidated)                     |
| **Multiple Redis Clients**      | 6+ separate instantiations              | ⏳ Pending                                  |
| **Overlapping setIntervals**    | Service discovery, health checks        | ✅ Fixed                                    |
| **Synchronous File Operations** | 69 uses of readFileSync/writeFileSync   | ⏳ Consider async alternatives in hot paths |
| **No Connection Pooling**       | Some services create DB per request     | Use PgBouncer consistently                  |

### Additional Optimization Opportunities

| #   | Category            | Issue                                      | Files Found | Priority |
| --- | ------------------- | ------------------------------------------ | ----------- | -------- |
| 1   | Synchronous I/O     | Heavy use of fs.readFileSync/writeFileSync | 69 files    | Medium   |
| 2   | SQL Injection       | String concatenation in queries            | 0 found     | ✅ Safe  |
| 3   | XSS Vulnerabilities | Template strings with user input           | 0 found     | ✅ Safe  |
| 4   | N+1 Queries         | Potential in repository classes            | Some files  | Medium   |
| 5   | Missing Indexes     | Database queries without proper indexes    | Unknown     | Low      |

---

## Section 4: Refactoring Roadmap

### Completed Phases

| Phase                   | Status  | Notes                                                  |
| ----------------------- | ------- | ------------------------------------------------------ |
| Phase 1: Critical Fixes | ✅ Done | Memory leaks, JWT, RabbitMQ, security                  |
| Phase 2: Code Quality   | ✅ Done | Consolidated logger, error-handler, archived dead code |
| Phase 3: Architecture   | ✅ Done | Circuit breaker exists, JWT caching added              |

### Remaining Work

| Task                                 | Files                   | Effort | Priority |
| ------------------------------------ | ----------------------- | ------ | -------- |
| Split EnhancedSecurityManager (716l) | `backends/shared/`      | High   | Low      |
| Consolidate Redis clients            | Multiple files          | Medium | Medium   |
| Add async alternatives for file I/O  | Scripts, test utilities | Medium | Low      |
| Database query optimization          | Repository classes      | Medium | Medium   |

---

## Quick Reference

### Entry Points

| Service      | Port | Endpoint Prefix  |
| ------------ | ---- | ---------------- |
| API Gateway  | 3000 | /api/v1/\*       |
| Auth Service | 3001 | /auth/\*         |
| Job Service  | 3002 | /jobs/\*         |
| LMS (.NET)   | 3003 | /courses/\*      |
| Gamification | 3004 | /gamification/\* |
| AI Assistant | 3005 | /assistant/\*    |

### Database Connections

| Service    | Connection String Pattern             |
| ---------- | ------------------------------------- |
| PostgreSQL | `postgresql://user:pass@host:5432/db` |
| Redis      | `redis://host:6379`                   |
| RabbitMQ   | `amqp://guest:guest@host:5672`        |

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

## Section 4: Refactoring Roadmap

### Phase 1: Critical Security & Stability (Week 1-2)

| Task                                  | Files                                                                                   | Effort |
| ------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| 1.1 Fix memory leaks (timer cleanup)  | `backends/shared/secure-database-connection.js`, `services/shared/service-discovery.js` | Medium |
| 1.2 Add request body size limits      | `api-gateway/index.js`                                                                  | Low    |
| 1.3 Replace deprecated `new Buffer()` | `shared/state-management.js`                                                            | Low    |
| 1.4 Add RabbitMQ prefetch limits      | `backends/backend-gamification/consumer.py`                                             | Low    |
| 1.5 Fix bare except clauses           | `backends/backend-flask/app.py`, `backends/backend-assistant/app.py`                    | Medium |

### Phase 2: Code Quality (Week 3-4)

| Task                                    | Files                                           | Effort |
| --------------------------------------- | ----------------------------------------------- | ------ |
| 2.1 Split RateLimiter class             | `shared/rate-limiter.js`                        | High   |
| 2.2 Split InputValidator                | `shared/input-validator.js`                     | High   |
| 2.3 Split EnhancedSecurityManager       | `backends/shared/enhanced-security-manager.js`  | High   |
| 2.4 Consolidate logging implementations | `shared/logger.js`, `shared/enhanced-logger.js` | Medium |
| 2.5 Consolidate database connections    | `shared/database*.js`                           | Medium |

### Phase 3: Architecture Improvements (Week 5-6)

| Task                                        | Files                                 | Effort |
| ------------------------------------------- | ------------------------------------- | ------ |
| 3.1 Create unified service template         | `backends/shared/service-template.js` | Medium |
| 3.2 Standardize error handling middleware   | All backends                          | Medium |
| 3.3 Implement circuit breaker in shared lib | `backends/shared/`                    | Medium |
| 3.4 Add unified health check endpoint       | All services                          | Low    |
| 3.5 Configure circuit breaker defaults      | All services                          | Low    |

### Phase 4: Performance Optimization (Week 7-8)

| Task                                | Files                                | Effort |
| ----------------------------------- | ------------------------------------ | ------ |
| 4.1 Add JWT caching                 | `backends/shared/auth-middleware.js` | Low    |
| 4.2 Consolidate Redis clients       | All services                         | Medium |
| 4.3 Add rate limiting to AI service | `backends/backend-assistant/app.py`  | Medium |
| 4.4 Optimize N+1 queries            | Repository classes                   | Medium |
| 4.5 Add database query caching      | Services                             | Medium |

### Phase 5: Documentation & Testing (Week 9-10)

| Task                              | Files                 | Effort |
| --------------------------------- | --------------------- | ------ |
| 5.1 Add API documentation         | OpenAPI specs         | Medium |
| 5.2 Increase test coverage        | Test files            | High   |
| 5.3 Document deployment processes | `/docs/deployment.md` | Low    |
| 5.4 Create runbooks               | `/docs/runbooks/`     | Medium |

---

## Quick Wins Summary

### Can Be Fixed Immediately ( < 1 hour each):

1. **Add request body limits** - `api-gateway/index.js`
2. **Fix RabbitMQ prefetch** - `backends/backend-gamification/consumer.py`
3. **Replace Buffer()** - `shared/state-management.js`
4. **Clean up bare except** - `backends/backend-flask/app.py`

### High Impact (1-2 days each):

1. **Memory leak fixes** - Timer cleanup
2. **Rate limiter split** - Reduce from 781 lines
3. **Redis client consolidation** - Single shared client
4. **JWT caching** - Significant performance improvement
