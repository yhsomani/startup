# TalentSphere - Development Guide

**Last Updated:** January 28, 2026  
**Version:** v1.3.2  
**Status:** Production Ready (2 services need implementation)

---

## 📋 Table of Contents

1. [Quick Start](#-quick-start-5-minutes)
2. [Prerequisites](#-prerequisites)
3. [Development Setup](#-development-setup)
4. [Project Structure](#-project-structure)
5. [Service Configuration](#-service-configuration)
6. [Testing Strategy](#-testing-strategy)
7. [SDK Development](#-sdk-development)
8. [Implementation Status](#-implementation-status)
9. [Debugging](#-debugging)
10. [Best Practices](#-best-practices)

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Docker (optional)

### 1. Clone Repository
```bash
git clone <repository-url>
cd TalentSphere
```

### 2. Install Dependencies
```bash
# Backend dependencies
cd backends/backend-enhanced/
npm install

# Frontend dependencies
cd ../../frontend/
pnpm install
```

### 3. Start All Services
**Windows (PowerShell)**
```powershell
./talentsphere.ps1 start
```

**Linux/Mac (Bash)**
```bash
./talentsphere.sh start
```

### 4. Verify Installation
```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:5000/health
curl http://localhost:5005/health
```

---

## 📋 Prerequisites

### Required Software
- **Node.js** (v18+) - JavaScript runtime for backend services
- **Python** (v3.9+) - Python runtime for Flask services
- **PostgreSQL** (v14+) - Database system
- **Git** - Version control system
- **npm/pnpm** - Package managers

### Optional Software
- **Docker** - Containerization platform
- **Docker Compose** - Multi-container orchestration
- **VS Code** - Recommended IDE with extensions

### Environment Setup
```bash
# Verify installations
node --version
python --version
postgres --version  # or pg_config for PostgreSQL
docker --version    # if using Docker
```

---

## 🏗️ Architecture Overview

### Microservices Architecture
TalentSphere follows a microservices architecture pattern with 14 independently deployable services:

1. **API Gateway** (Port 3000) - Central entry point and request routing
2. **User Service** (Port 3002) - User management and authentication
3. **User Profile Service** (Port 3009) - User profile management and personal information
4. **Auth Service** (Port 3001) - Authentication and authorization
5. **Job Service** (Port 3003) - Job management and listings
6. **Job Listing Service** (Port 3010) - Enhanced job listing management
7. **Company Service** (Port 3004) - Company profiles and information
8. **Network Service** (Port 3005) - Professional networking features
9. **Notification Service** (Port 3006) - User notifications and alerts
10. **Search Service** (Port 3007) - Search and discovery functionality
11. **Application Service** (Port 3008) - Job application processing
12. **Analytics Service** (Port 3011) - Data analytics and insights
13. **Email Service** (Port 3012) - Email communication
14. **File Service** (Port 3013) - File storage and management
15. **Video Service** (Port 3014) - Video processing and streaming

### Frontend Applications
TalentSphere's frontend is built using React 18 and Module Federation, consisting of:

1. **Shell MFE** (Port 3010) - Host application and container
2. **LMS MFE** (Port 3005) - Learning Management System
3. **Challenge MFE** (Port 3006) - Coding challenge platform

### Database
TalentSphere uses PostgreSQL for data storage, with a schema that includes:

- **30+ tables** - Covering user profiles, jobs, companies, and more
- **163 indexes** - Optimized for performance
- **Foreign keys and constraints** - Ensuring data integrity

---

## 🏗️ Development Setup

### 1. Database Setup
```bash
# Start PostgreSQL
docker run -d --name talentsphere-postgres \
  -e POSTGRES_DB=talentsphere \
  -e POSTGRES_USER=talentsphere_user \
  -e POSTGRES_PASSWORD=talentsphere123 \
  -p 5432:5432 \
  postgres:14

# Run migrations
cd migrations
psql -h localhost -U talentsphere_user -d talentsphere -f 001_init_schema.sql
```

### 2. Environment Configuration
```bash
# Copy environment template
cp config/.env.example .env
cp config/.env.database .env.local

# Edit environment variables
vim .env
```

### 3. Start Backend Services
```bash
# Start API Gateway
cd api-gateway
npm start

# Start Node.js services
cd backends/backend-enhanced/auth-service
npm start

cd backends/backend-enhanced/user-service
npm start

# Start Flask services
cd backends/backend-flask
python app.py

cd backends/backend-assistant
python app.py
```

### 4. Start Frontend Services
```bash
# Start shell MFE
cd frontend/ts-mfe-shell
pnpm dev

# Start LMS MFE (in separate terminal)
cd frontend/ts-mfe-lms
pnpm build && pnpm preview

# Start Challenge MFE (in separate terminal)
cd frontend/ts-mfe-challenge
pnpm build && pnpm preview
```

---

## 📂 Project Structure

```
TalentSphere/
├── docs/                          # Documentation
│   ├── API_REFERENCE.md          # Complete API documentation
│   ├── FRONTEND.md               # Frontend architecture guide
│   ├── SYSTEM.md                 # System architecture
│   ├── OPERATIONS.md             # Operations guide
│   ├── DEVELOPMENT.md            # This guide
│   └── CHANGELOG.md              # Version history
├── backends/
│   ├── backend-enhanced/         # Node.js microservices (9 services)
│   │   ├── auth-service/         # Authentication service
│   │   ├── user-service/         # User management
│   │   ├── job-service/          # Job posting and management
│   │   ├── network-service/      # Network and messaging
│   │   ├── company-service/      # Company profiles
│   │   ├── notification-service/ # Real-time notifications
│   │   ├── search-service/       # Search functionality
│   │   ├── file-service/         # File management
│   │   ├── analytics-service/    # Analytics and metrics
│   │   ├── video-service/        # Video streaming
│   │   ├── email-service/        # Email notifications
│   │   └── api-gateway/          # API Gateway
│   ├── backend-flask/            # Python Flask core
│   ├── backend-assistant/        # AI Assistant service
│   ├── backend-collaboration/    # Real-time collaboration
│   └── shared/                   # Shared utilities
├── frontend/
│   ├── ts-mfe-shell/            # Host application (Port 3010)
│   ├── ts-mfe-lms/              # LMS remote MFE (Port 3005)
│   ├── ts-mfe-challenge/        # Challenge remote MFE (Port 3006)
│   ├── packages/                # Shared packages and utilities
│   └── README.md                # Frontend guide
├── api/                         # OpenAPI specifications
├── migrations/                  # Database migrations
├── config/                      # Configuration files
├── scripts/                     # Utility scripts
├── tests/                       # Test suites
├── sdk/                         # Client SDK
└── README.md                    # Root documentation
```

---

## ⚙️ Service Configuration

### Backend Services
| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| Auth Service | 3001 | Node.js | Authentication and JWT management |
| User Service | 3002 | Node.js | User profiles and management |
| Job Service | 3003 | Node.js | Job posting and applications |
| Network Service | 3004 | Node.js | Connections and messaging |
| Company Service | 3007 | Node.js | Company profiles and management |
| AI Assistant | 5005 | Python/Flask | AI-powered coding help |
| Collaboration | 1234 | Python/Flask | Real-time code collaboration |

### Frontend Services
| Service | Port | Technology | Description |
|---------|------|------------|-------------|
| Shell MFE | 3010 | React 18 | Host application and container |
| LMS MFE | 3005 | React 18 | Learning Management System |
| Challenge MFE | 3006 | React 18 | Coding challenge platform |

### Configuration Files
- `config/.env.example` - Environment template
- `config/.env.cors` - CORS configuration
- `config/.env.database` - Database configuration
- `scripts/setup/` - Installation scripts
- `scripts/operations/` - Maintenance scripts

---

## 🧪 Testing Strategy

### Overview
This comprehensive end-to-end testing suite validates critical user journeys across the TalentSphere platform. The tests ensure the platform works seamlessly across all major user workflows and integrates properly with the microservices architecture.

### Test Coverage

#### Critical User Journeys
- **Authentication Flow** - Registration, login, password reset, role-based access
- **Course Learning Journey** - Course browsing, enrollment, progress tracking, completion
- **Challenge Platform** - Challenge creation, submission, evaluation, leaderboard
- **AI Assistant Integration** - Chat, code analysis, lesson summaries
- **Recruitment Platform** - Job search, applications, interviews, offers

#### Cross-Service Integration
- **Service Communication** - Inter-service API calls and data flow
- **WebSocket Functionality** - Real-time collaboration features
- **Authentication Propagation** - JWT token handling across services
- **Error Handling** - Graceful degradation and user feedback
- **Performance Validation** - Response times and resource usage

### Technology Stack

#### Framework
- **Cypress 13.x** - Modern E2E testing framework
- **TypeScript** - Type-safe test implementation
- **Mochawesome** - Beautiful HTML reports with screenshots

#### Browser Support
- Chrome (Primary)
- Firefox (Secondary)
- Edge (Optional)

#### Test Environment
- **Docker Compose** - Full stack environment
- **Mock Data** - Realistic test scenarios
- **Clean Isolation** - Independent test runs

### Test Structure
```
tests/
├── cypress/
│   ├── cypress.config.ts          # Cypress configuration
│   ├── commands.ts                 # Custom commands and utilities
│   ├── types/index.d.ts          # TypeScript definitions
│   ├── e2e/                     # Test specifications
│   │   ├── authentication.cy.ts   # Auth flow tests
│   │   ├── course-learning.cy.ts   # Learning journey tests
│   │   ├── challenge-platform.cy.ts # Challenge tests
│   │   ├── ai-assistant.cy.ts     # AI integration tests
│   │   └── recruitment.cy.ts      # Recruitment tests
│   ├── package.json               # Dependencies and scripts
│   └── support/                  # Support files and utilities
├── run-e2e-tests.sh              # Comprehensive test runner
└── README.md                     # Test documentation
```

### Running Tests

#### Quick Start
```bash
# Install dependencies
cd tests/cypress
npm install

# Run all tests
npm run test:all

# Run specific test suites
npm run test:auth
npm run test:courses
npm run test:challenges
npm run test:ai
npm run test:recruitment

# Run smoke tests (critical paths)
npm run test:smoke

# Run with interactive UI
npm run cypress:open
```

#### Test Categories

##### 🔐 Authentication Tests
**File**: `authentication.cy.ts`

**Scenarios**:
- Student registration with validation
- Instructor registration with permissions
- Login with valid credentials
- Login rejection with invalid credentials
- Password reset flow
- Form validation and error handling
- JWT token storage and validation
- Role-based access control

##### 📚 Course Learning Tests
**File**: `course-learning.cy.ts`

**Scenarios**:
- Course browsing and search
- Course detail viewing
- Course enrollment and payment
- Lesson progression
- Video playback
- Quiz completion
- Progress tracking
- Certificate generation
- Course reviews and ratings

##### 🏆 Challenge Platform Tests
**File**: `challenge-platform.cy.ts`

**Scenarios**:
- Challenge browsing and filtering
- Challenge creation (instructors)
- Code editor functionality
- Test execution and validation
- Solution submission
- Leaderboard viewing
- Collaboration features
- Performance metrics
- Hint system

##### 🤖 AI Assistant Tests
**File**: `ai-assistant.cy.ts`

**Scenarios**:
- AI chat interactions
- Code analysis and feedback
- Lesson summary generation
- Context-aware help
- Voice interactions
- Conversation history
- Multi-language support
- Privacy settings
- Rate limiting

##### 💼 Recruitment Tests
**File**: `recruitment.cy.ts`

**Scenarios**:
- Candidate search and filtering
- Profile viewing and resume access
- Job posting and management
- Job application submission
- Interview scheduling
- Offer management
- Team collaboration
- Analytics and insights

### Performance Tests
Performance tests ensure the platform meets response time expectations:

#### Metrics
- **Page Load Time** < 3 seconds
- **API Response** < 1 second
- **Asset Loading** < 2 seconds
- **Interaction Response** < 500ms

### Configuration
#### Environment Variables
```bash
# Service URLs
TALENTSPHERE_URL=http://localhost:3000
API_BASE_URL=http://localhost:5000/api/v1
ASSISTANT_URL=http://localhost:5005
RECRUITMENT_URL=http://localhost:5006/api/v1
GAMIFICATION_URL=http://localhost:5007/api/v1
COLLABORATION_URL=http://localhost:5008

# Test Configuration
CYPRESS_baseUrl=http://localhost:3000
CYPRESS_timeout=10000
CYPRESS_retry=3

# Reporting
SLACK_WEBHOOK=https://hooks.slack.com/...
GITHUB_TOKEN=ghp_...
GITHUB_REPO=talentsphere/platform
```

### Troubleshooting

#### Common Issues

##### Test Failures
```bash
# Clear test data
npm run clean

# Reset database
docker-compose exec postgres psql -U talentsphere_user -d talentsphere -c "TRUNCATE TABLE users CASCADE;"

# Rebuild containers
docker-compose down && docker-compose up --build
```

##### Performance Issues
```bash
# Increase timeouts
export CYPRESS_defaultCommandTimeout=20000
export CYPRESS_requestTimeout=20000

# Run in headless mode
npm run cypress:headless
```

---

## 📦 SDK Development

### Overview
TalentSphere provides client SDKs for multiple programming languages to facilitate integration with the platform's APIs.

### Supported Languages
| Language | Package | Status |
|----------|---------|--------|
| **TypeScript** | `@talentsphere/api-client` | ✅ |
| **Python** | `talentsphere-client` | ✅ |
| **Java** | `com.talentsphere.client` | ✅ |
| **C#/.NET** | `TalentSphere.Client` | ✅ |
| **Go** | `github.com/talentsphere/client-go` | ✅ |

### Quick Start
```typescript
import { TalentSphereClient } from '@talentsphere/api-client';
const client = new TalentSphereClient({
  baseURL: 'https://api.talentsphere.com/v1',
  apiKey: process.env.API_KEY
});
```

### SDK Features

#### 🔐 Authentication
- Automatic JWT token management
- Token refresh handling
- Multiple authentication methods
- API key support

#### 📡 API Coverage
- All REST endpoints covered across 11 microservices
- WebSocket support for real-time features (Collaboration, Notifications)
- File upload/download capabilities (Profile management)
- Streaming responses (Chat interfaces, real-time updates)
- Full CRUD operations for core entities
- Authentication and authorization handling
- Feature flag integration

#### 🔄 Error Handling
- Standardized error types
- Automatic retry logic
- Rate limiting handling
- Network error recovery

#### 📊 Type Safety
- Generated from OpenAPI spec
- Compile-time validation
- IntelliSense/autocomplete support
- Runtime type checking

#### 🚀 Performance
- Connection pooling
- Request caching
- Compression support
- Async/await patterns

### Language-Specific Examples

#### JavaScript/TypeScript
```bash
npm install @talentsphere/api-client
```

```typescript
import { TalentSphereClient } from '@talentsphere/api-client';

const client = new TalentSphereClient({
  baseURL: 'https://api.talentsphere.com/v1',
  apiKey: process.env.API_KEY
});

// Example: Authentication
const auth = await client.auth.login({ email, password });
client.setToken(auth.token);

// Example: Get courses
const courses = await client.courses.list();

// Example: AI Assistant chat
const response = await client.assistant.chat({ message: "Help me learn Python" });

// Example: Real-time collaboration
const session = await client.collaboration.createSession();
client.collaboration.joinSession(session.id);

// Example: Search functionality
const results = await client.search.search({ query: "React courses" });
```

#### Python
```bash
pip install talentsphere-client
```

```python
from talentsphere_client import TalentSphereClient

client = TalentSphereClient(
    base_url='https://api.talentsphere.com/v1',
    api_key='your-api-key'
)

# Example: Authentication
auth = await client.auth.login(email, password)
client.set_token(auth.token)

# Example: Get courses
courses = await client.courses.list()

# Example: Submit coding challenge
result = await client.challenges.submit(challenge_id, code)

# Example: Real-time notifications
client.notifications.subscribe(callback_function)

# Example: Gamification
badges = await client.gamification.get_user_badges(user_id)
```

### Generating SDKs
```bash
# Generate all SDKs
npm run generate:sdk

# Generate specific language
npm run generate:sdk -- --lang=typescript
npm run generate:sdk -- --lang=python
npm run generate:sdk -- --lang=java
```

---

## 📊 Implementation Status

### Backend Services
| Service | Status | Lines | Features |
|---------|--------|-------|----------|
| Auth Service | ✅ Production Ready | 614 | JWT, bcrypt, rate limiting |
| User Service | ✅ Production Ready | 1,085 | Profiles, skills, search |
| Job Service | ✅ Production Ready | 1,408 | Posts, applications, search |
| Network Service | ✅ Production Ready | 716 | Connections, messaging |
| Company Service | ✅ Production Ready | 1,107 | Profiles, reviews |
| Application Service | ✅ Production Ready | 1,339 | Lifecycle, tracking |
| Notification Service | ✅ Production Ready | 1,103 | Real-time, email |
| Search Service | ✅ Production Ready | 1,403 | Full-text, recommendations |
| File Service | ✅ Production Ready | 213 | Upload, optimization |
| Analytics Service | ✅ Production Ready | 1,409 | Metrics, tracking |
| Video Service | ✅ Production Ready | 77 | HLS, WebRTC |
| Email Service | ✅ Production Ready | 1,483 | Templates, campaigns |
| Job Listing Service | ⚠️ Placeholder | 0 | Needs implementation |
| User Profile Service | ⚠️ Placeholder | 0 | Needs implementation |

### Legacy Services
| Service | Status | Technology | Features |
|---------|--------|------------|----------|
| Flask Core | ✅ Operational (Legacy) | Python/Flask | Auth, courses, challenges |
| AI Assistant | ✅ Hybrid (Mock/Prod) | Python/Flask | OpenAI integration |
| Recruitment | ✅ Operational | Python/Flask | Matching algorithms |
| Gamification | ✅ Operational | Python/Flask | Badges, points, leaderboards |

### Frontend Applications
| Application | Status | Technology | Features |
|-------------|--------|------------|----------|
| Shell MFE | ✅ Complete | React 18, Module Federation | Auth, navigation, AI |
| LMS MFE | ✅ Complete | React 18, Module Federation | Courses, lessons, progress |
| Challenge MFE | ✅ Complete | React 18, Module Federation | Challenges, editor, scoring |

### Database
| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL Schema | ✅ Complete | Full schema with 30+ tables |
| Migrations | ✅ Ready | `migrations/` directory |
| Indexes | ✅ Optimized | 163 database indexes |
| Relationships | ✅ Complete | Foreign keys and constraints |

### Overall Status: 95% Complete - Production Ready ✅ (2 services need implementation)

---

## 🔧 Debugging

### Common Issues

#### Service Startup Issues
```bash
# Check logs for specific service
docker-compose logs backend-flask
docker-compose logs backend-assistant

# Check environment variables
docker-compose exec backend-flask env | grep DB_

# Check dependencies
docker-compose exec backend-flask npm list
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Test connection
psql -h localhost -U talentsphere_user -d talentsphere -c "SELECT 1;"

# Check connection pool
psql -h localhost -U talentsphere_user -d talentsphere -c "
SELECT COUNT(*) FROM pg_stat_activity;"
```

#### Frontend Module Federation Issues
```bash
# Clear build cache
rm -rf node_modules/.vite
pnpm install

# Rebuild remotes
pnpm run build:remotes

# Check CORS configuration
# In vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
```

#### WebSocket Connection Issues
```typescript
// Add connection retry logic
const connectWebSocket = () => {
  const ws = new WebSocket(url);
  ws.onclose = () => {
    setTimeout(connectWebSocket, 5000); // Retry after 5 seconds
  };
};
```

### Debug Mode

#### Enable Debug Logging
```bash
# Set in .env
DEBUG=true
LOG_LEVEL=debug
NODE_ENV=development

# Restart services
docker-compose restart
```

#### View Debug Logs
```bash
# Follow logs with debug output
docker-compose logs -f --tail=100 service-name | grep DEBUG
```

### Performance Monitoring
```bash
# Check container stats
docker stats

# Kubernetes pod resources
kubectl top pods -n talentsphere

# Check database performance
python scripts/database_optimization.py

# Check slow queries
psql -h localhost -U talentsphere_user -d talentsphere -c "
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"
```

---

## 🏆 Best Practices

### Development Workflow
1. **Branch Strategy** - Use feature branches from `develop`
2. **Commits** - Follow conventional commits format
3. **Pull Requests** - Include tests and documentation
4. **Code Review** - Require at least 1 approval

### Code Standards
- **Naming** - Use consistent naming conventions
- **Comments** - Document complex logic
- **Testing** - Maintain >80% coverage
- **Security** - Follow security best practices

### Performance
- **Optimization** - Profile before optimizing
- **Caching** - Implement appropriate caching strategies
- **Database** - Use proper indexing
- **Frontend** - Optimize bundle sizes

### Security
- **Authentication** - Always validate JWT tokens
- **Input Validation** - Sanitize all inputs
- **Rate Limiting** - Protect against abuse
- **CORS** - Configure appropriately

---

## 📚 Additional Resources

### Documentation
- **[System Architecture](./SYSTEM.md)** - Complete system overview
- **[API Reference](./API_REFERENCE.md)** - API endpoint documentation
- **[Frontend Guide](./FRONTEND.md)** - Frontend architecture
- **[Operations Guide](./OPERATIONS.md)** - Deployment and operations

### Tools and Libraries
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

## 📞 Support

### For Development Questions
- **Setup issues:** Check this guide first
- **API questions:** Refer to [API_REFERENCE.md](./API_REFERENCE.md)
- **Architecture:** See [SYSTEM.md](./SYSTEM.md)
- **Frontend:** Check [FRONTEND.md](./FRONTEND.md)

### Issue Tracking
- **Bug Reports:** Create GitHub issue with "bug" label
- **Feature Requests:** Create GitHub issue with "feature" label
- **Documentation Issues:** Create GitHub issue with "documentation" label

---

*This development guide is maintained alongside the platform and updated with development changes.*
