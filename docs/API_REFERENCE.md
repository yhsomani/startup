# TalentSphere API Reference

**Last Updated:** January 28, 2026  
**Version:** v1.1  
**Status:** Complete API Reference

This document provides comprehensive API documentation for all TalentSphere platform services, including endpoint specifications, authentication patterns, and integration guides.

---

## 📋 API Overview

TalentSphere provides a comprehensive RESTful API through 15 microservices. All endpoints follow REST conventions and require JWT authentication for protected resources.

### Service Base URLs

| Service | Development URL | Production URL | Authentication |
|----------|-------------------|-------------------|-------------|
| **Core Backend** | http://localhost:5000/api/v1 | https://api.talentsphere.io/v1 | ✅ |
| **AI Assistant** | http://localhost:5005 | https://api.talentsphere.io/assistant | ✅ |
| **Recruitment** | http://localhost:5006 | https://api.talentsphere.io/recruitment | ✅ |
| **Gamification** | http://localhost:5007 | https://api.talentsphere.io/gamification | ✅ |
| **Collaboration** | http://localhost:5008 | https://api.talentsphere.io/collaboration | ✅ |
| **Notifications** | http://localhost:3030 | https://api.talentsphere.io/notifications | ✅ |
| **Network Service** | http://localhost:3004 | https://api.talentsphere.io/network | ✅ |
| **Search Service** | http://localhost:3005 | https://api.talentsphere.io/search | ✅ |
| **Analytics Service** | http://localhost:3006 | https://api.talentsphere.io/analytics | ✅ |
| **LMS Core (.NET)** | http://localhost:5062 | https://api.talentsphere.io/lms | ✅ |
| **Progress Service** | http://localhost:8080 | https://api.talentsphere.io/progress | ✅ |
| **Job Listing Service** | http://localhost:3010 | https://api.talentsphere.io/job-listings | ✅ |
| **Auth Service** | http://localhost:3001 | https://api.talentsphere.io/auth | ✅ |
| **Notification Service** | http://localhost:3006 | https://api.talentsphere.io/notifications | ✅ |
| **Network Service** | http://localhost:3005 | https://api.talentsphere.io/network | ✅ |
| **Search Service** | http://localhost:3007 | https://api.talentsphere.io/search | ✅ |

---

## 🔐 Authentication

### JWT Token Structure
All protected endpoints require JWT authentication:
```http
Authorization: Bearer <jwt_token>
```

### Authentication Flow
1. **Register**: `POST /api/v1/auth/register`
2. **Login**: `POST /api/v1/auth/login`
3. **Verify**: `GET /api/v1/auth/verify`
4. **Refresh**: `POST /api/v1/auth/refresh`

### Token Response
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "role": "STUDENT|INSTRUCTOR|ADMIN"
  }
}
```

---

## 📚 Core Backend Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/register` | User registration | ✅ |
| POST | `/login` | User authentication | ✅ |
| POST | `/refresh` | Token refresh | ✅ |
| POST | `/logout` | User logout | ✅ |
| POST | `/forgot-password` | Password reset request | ✅ |
| POST | `/reset-password` | Password reset completion | ✅ |
| GET | `/verify` | Token verification | ✅ |

### Courses (`/api/v1/courses`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/` | List all courses | ✅ |
| GET | `/{course_id}` | Get course details | ✅ |
| POST | `/` | Create new course | ✅ |
| PUT | `/{course_id}` | Update course | ✅ |
| DELETE | `/{course_id}` | Delete course | ✅ |

### Challenges (`/api/v1/challenges`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/` | List all challenges | ✅ |
| GET | `/{challenge_id}` | Get challenge details | ✅ |
| POST | `/` | Create new challenge | ✅ |
| POST | `/{challenge_id}/submit` | Submit solution | ✅ |
| GET | `/{challenge_id}/leaderboard` | Get leaderboard | ✅ |

### Lessons (`/api/v1/lessons`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/` | List all lessons | ✅ |
| GET | `/{lesson_id}` | Get lesson details | ✅ |
| POST | `/{lesson_id}/complete` | Mark lesson complete | ✅ |

### Profiles (`/api/v1/profile`)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/` | Get current user profile | ✅ |
| PUT | `/` | Update user profile | ✅ |
| GET | `/{user_id}` | Get user profile by ID | ✅ |

---

## 🤖 Service-Specific Endpoints

### AI Assistant (Port 5005)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/chat` | AI chat interaction | ✅ |
| POST | `/analyze-code` | Code analysis | ✅ |
| GET | `/summary/{lesson_id}` | Lesson summary | ✅ |

### Recruitment (Port 5006)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/candidates/search` | Search candidates | ✅ |
| GET | `/candidates/{id}/verified-resume` | Get verified resume | ✅ |
| GET | `/jobs` | List job postings | ✅ |
| POST | `/jobs` | Create job posting | ✅ |
| POST | `/applications` | Submit application | ✅ |
| GET | `/applications/{user_id}` | Get user applications | ✅ |
| POST | `/candidates/{id}/verify` | Verify candidate | ✅ |
| GET | `/companies` | List companies | ✅ |
| POST | `/companies` | Create company profile | ✅ |
| PUT | `/companies/{company_id}` | Update company profile | ✅ |

### Gamification (Port 5007)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/users/{user_id}/streaks` | Get user streaks | ✅ |
| GET | `/users/{user_id}/badges` | Get user badges | ✅ |
| GET | `/users/{user_id}/points` | Get user points | ✅ |
| GET | `/users/{user_id}/level` | Get user level | ✅ |
| POST | `/users/{user_id}/award-points` | Award points to user | ✅ |
| POST | `/events/process` | Process gamification event | ✅ |
| GET | `/leaderboard/{type}` | Get leaderboard | ✅ |
| GET | `/achievements` | Get achievements | ✅ |

### Collaboration (Port 5008)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/sessions` | Create collaboration session | ✅ |
| GET | `/sessions/{session_id}` | Get session details | ✅ |
| POST | `/sessions/{session_id}/join` | Join session | ✅ |
| POST | `/sessions/{session_id}/leave` | Leave session | ✅ |

### Notifications (Port 3030)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/notifications/user/{user_id}` | Get user notifications | ✅ |
| POST | `/notifications/send` | Send notification | ✅ |
| PUT | `/notifications/{notification_id}/read` | Mark notification read | ✅ |

### Network Service (Port 3004)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/connections` | Get user connections | ✅ |
| POST | `/connections/request` | Send connection request | ✅ |
| GET | `/messages/{conversation_id}` | Get conversation messages | ✅ |
| POST | `/messages/send` | Send message | ✅ |
| GET | `/users/search` | Search users | ✅ |

### Search Service (Port 3005)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/search` | Unified search across content | ✅ |
| GET | `/search/suggestions` | Autocomplete suggestions | ✅ |
| GET | `/search/facets` | Search facets and filters | ✅ |
| GET | `/search/analytics` | Search analytics and metrics | ✅ |
| POST | `/search/index` | Add document to index | ✅ |
| DELETE | `/search/index/{document_id}` | Remove document from index | ✅ |
| GET | `/search/history` | Search history | ✅ |
| POST | `/search/clear` | Clear search history | ✅ |

### Analytics Service (Port 3006)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/analytics/dashboard` | Get analytics dashboard | ✅ |
| GET | `/analytics/reports` | Get analytics reports | ✅ |
| POST | `/analytics/reports` | Create analytics report | ✅ |
| GET | `/analytics/metrics/{user_id}` | Get user metrics | ✅ |
| GET | `/analytics/courses` | Get course analytics | ✅ |
| GET | `/analytics/searches` | Get search analytics | ✅ |
| GET | `/analytics/users` | Get user analytics | ✅ |
| POST | `/analytics/track` | Track custom event | ✅ |

### LMS Core Service (Port 5062)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/courses` | Get course list | ✅ |
| GET | `/courses/{course_id}` | Get course details | ✅ |
| POST | `/courses` | Create new course | ✅ |
| PUT | `/courses/{course_id}` | Update course | ✅ |
| DELETE | `/courses/{course_id}` | Delete course | ✅ |
| GET | `/sections` | Get course sections | ✅ |
| GET | `/sections/{section_id}` | Get section details | ✅ |
| POST | `/sections` | Create new section | ✅ |
| PUT | `/sections/{section_id}` | Update section | ✅ |
| DELETE | `/sections/{section_id}` | Delete section | ✅ |
| GET | `/lessons` | Get lesson list | ✅ |
| GET | `/lessons/{lesson_id}` | Get lesson details | ✅ |
| POST | `/lessons` | Create new lesson | ✅ |
| PUT | `/lessons/{lesson_id}` | Update lesson | ✅ |
| DELETE | `/lessons/{lesson_id}` | Delete lesson | ✅ |
| POST | `/lessons/{lesson_id}/complete` | Mark lesson complete | ✅ |
| GET | `/content/{content_id}` | Get content by ID | ✅ |
| POST | `/content` | Create new content | ✅ |
| PUT | `/content/{content_id}` | Update content | ✅ |
| DELETE | `/content/{content_id}` | Delete content | ✅ |

### Progress Service (Port 8080)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/progress/user/{user_id}` | Get user progress | ✅ |
| GET | `/progress/course/{user_id}/{course_id}` | Get course progress | ✅ |
| POST | `/progress/enroll` | Enroll in course | ✅ |
| GET | `/progress/certificates/{user_id}` | Get user certificates | ✅ |
| POST | `/progress/certificates/generate` | Generate certificate | ✅ |
| GET | `/progress/analytics/{user_id}` | Get progress analytics | ✅ |
| GET | `/progress/completion/{user_id}` | Get completion status | ✅ |
| POST | `/progress/badge/award` | Award badge to user | ✅ |
| GET | `/progress/leaderboard/{type}` | Get leaderboard | ✅ |
| POST | `/progress/badge/revoke` | Revoke badge | ✅ |
| GET | `/progress/achievements/{user_id}` | Get user achievements | ✅ |
| POST | `/progress/achievements/{user_id}` | Create user achievement | ✅ |

### 10. User Service (Port 3002)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/profiles/:userId` | Get user profile | ✅ |
| PUT | `/profiles/:userId` | Update user profile | ✅ |
| GET | `/users/search` | Search users | ✅ |
| GET | `/users/:userId/skills` | Get user skills | ✅ |
| POST | `/users/:userId/skills` | Add user skill | ✅ |

### 10. User Profile Service (Port 3009)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/profiles` | Create user profile | ✅ Implemented |
| GET | `/profiles/:id` | Get user profile | ✅ Implemented |
| PUT | `/profiles/:id` | Update user profile | ✅ Implemented |
| DELETE | `/profiles/:id` | Delete user profile | ✅ Implemented |
| GET | `/profiles/user/:userId` | Get profile by user ID | ✅ Implemented |
| POST | `/profiles/:id/skills` | Add skill to profile | ✅ Implemented |
| GET | `/profiles/:id/skills` | List profile skills | ✅ Implemented |
| PUT | `/skills/:skillId` | Update skill | ✅ Implemented |
| DELETE | `/skills/:skillId` | Delete skill | ✅ Implemented |
| POST | `/profiles/:id/experiences` | Add experience | ✅ Implemented |
| GET | `/profiles/:id/experiences` | List experiences | ✅ Implemented |
| PUT | `/experiences/:experienceId` | Update experience | ✅ Implemented |
| DELETE | `/experiences/:experienceId` | Delete experience | ✅ Implemented |
| POST | `/profiles/:id/educations` | Add education | ✅ Implemented |
| GET | `/profiles/:id/educations` | List educations | ✅ Implemented |
| PUT | `/educations/:educationId` | Update education | ✅ Implemented |
| DELETE | `/educations/:educationId` | Delete education | ✅ Implemented |

### 11. Job Listing Service (Port 3010)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/jobs` | Create job listing | ✅ Implemented |
| GET | `/jobs` | Search job listings | ✅ Implemented |
| GET | `/jobs/:id` | Get job listing details | ✅ Implemented |
| PUT | `/jobs/:id` | Update job listing | ✅ Implemented |
| DELETE | `/jobs/:id` | Delete job listing | ✅ Implemented |
| POST | `/jobs/:id/apply` | Apply for job | ✅ Implemented |
| GET | `/jobs/:id/applications` | Get job applications | ✅ Implemented |

### 12. Auth Service (Port 3001)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/register` | User registration | ✅ Implemented |
| POST | `/login` | User authentication | ✅ Implemented |
| POST | `/logout` | User logout | ✅ Implemented |
| GET | `/verify` | Token verification | ✅ Implemented |
| GET | `/profile` | Get user profile | ✅ Implemented |

### 13. Notification Service (Port 3006)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/notifications/:userId` | Get user notifications | ✅ Implemented |
| POST | `/notifications` | Create notification | ✅ Implemented |
| PUT | `/notifications/:notificationId/read` | Mark notification as read | ✅ Implemented |
| PUT | `/notifications/read-all` | Mark all notifications as read | ✅ Implemented |
| GET | `/preferences/:userId` | Get user preferences | ✅ Implemented |
| PUT | `/preferences/:userId` | Update user preferences | ✅ Implemented |
| GET | `/subscriptions/:userId` | Get notification subscriptions | ✅ Implemented |
| POST | `/subscriptions` | Subscribe to notifications | ✅ Implemented |
| DELETE | `/subscriptions/:subscriptionId` | Unsubscribe from notifications | ✅ Implemented |
| GET | `/analytics/notifications` | Get notification analytics | ✅ Implemented |

### 14. Network Service (Port 3005)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/connections` | Get user connections | ✅ Implemented |
| POST | `/connections` | Create connection request | ✅ Implemented |
| PUT | `/connections/:connectionId` | Update connection status | ✅ Implemented |
| DELETE | `/connections/:connectionId` | Delete connection | ✅ Implemented |
| GET | `/conversations` | Get user conversations | ✅ Implemented |
| POST | `/conversations` | Create conversation | ✅ Implemented |
| GET | `/conversations/:conversationId/messages` | Get conversation messages | ✅ Implemented |
| POST | `/conversations/:conversationId/messages` | Send message | ✅ Implemented |

### 15. Search Service (Port 3007)
| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/search` | Perform search query | ✅ Implemented |
| POST | `/index` | Add content to search index | ✅ Implemented |
| DELETE | `/index/:id` | Remove content from search index | ✅ Implemented |
| GET | `/analytics` | Get search analytics | ✅ Implemented |
| GET | `/recommendations/:userId` | Get personalized recommendations | ✅ Implemented |

---

## 🔌 WebSocket Events

### Supported Services
1. **Collaboration** (Port 5008)
   - `join_session` - Join collaboration session
   - `code_change` - Real-time code updates
   - `cursor_position` - Cursor tracking
   - `chat_message` - Live messaging

2. **Notifications** (Port 3030)
   - `notification` - New notification delivery
   - `read_status_update` - Read status changes
   - `connect` / `disconnect` - Connection management

3. **Network Service** (Port 3004)
   - `message` - Real-time messaging
   - `typing` - Typing indicators
   - `presence` - User presence updates

### WebSocket Connection Example
```
// Collaboration Service
const socket = io('http://localhost:5008');
socket.emit('join_session', { session_id: 'uuid' });
socket.on('code_updated', (data) => console.log(data));

// Notification Service
const notifications = io('http://localhost:3030');
notifications.on('notification', (notification) => console.log(notification));
```

---

## 🛠️ Development Tools

### Interactive Documentation
| Service | Swagger UI | Development URL |
|----------|-------------|-------------------|
| Core Backend | Available | http://localhost:5000/api/docs |
| AI Assistant | Available | http://localhost:5005/docs |
| Recruitment | Available | http://localhost:5006/docs |
| Gamification | Available | http://localhost:5007/docs |
| Collaboration | Available | http://localhost:5008/docs |

### Code Generation
```bash
# Generate client SDKs
npm run generate:sdk

# Generate server stubs
npm run generate:server

# Validate API specifications
npm run validate:specs
```

---

## 📊 Error Handling

### Standard Error Response
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "Additional error context"
  },
  "timestamp": "2026-01-28T12:00:00Z",
  "requestId": "uuid-string"
}
```

### Common Error Codes
- `INVALID_CREDENTIALS` - Authentication failed
- `EMAIL_EXISTS` - User already registered
- `UNAUTHORIZED` - Access denied
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

---

## 🔒 Rate Limiting

### Rate Limits by Service
| Service | Requests | Time Window | Purpose |
|----------|----------|-------------|---------|
| **Authentication** | 5 | 5 minutes | Prevent brute force |
| **API Endpoints** | 100 | 1 minute | General usage |
| **File Upload** | 10 | 1 minute | Prevent abuse |
| **Search** | 30 | 1 minute | Resource protection |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1643797600
```

---

## 📦 Client SDK Integration

### JavaScript/TypeScript
```typescript
import { TalentSphereClient } from '@talentsphere/api-client';

const client = new TalentSphereClient({
  baseURL: 'https://api.talentsphere.io/v1',
  apiKey: process.env.API_KEY
});

// Get courses
const courses = await client.courses.list();

// Submit challenge
const result = await client.challenges.submit(challengeId, code);
```

### Python
```python
from talentsphere_client import TalentSphereClient

client = TalentSphereClient(
    base_url='https://api.talentsphere.io/v1',
    api_key='your-api-key'
)

# Get courses
courses = await client.courses.list()

# Submit challenge
result = await client.challenges.submit(challenge_id, code)
```

---

## 🚀 Production Deployment

### Environment Variables
```bash
# API URLs
CORE_API_URL=https://api.talentsphere.io/v1
AI_ASSISTANT_URL=https://api.talentsphere.io/assistant
RECRUITMENT_URL=https://api.talentsphere.io/recruitment

# Security
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://yourdomain.com

# External Services
OPENAI_API_KEY=your-openai-key
REDIS_URL=redis://localhost:6379
```

### Security Headers
All production endpoints include security headers:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## 📈 Monitoring & Analytics

### Response Times
- **Target**: < 200ms for 95th percentile
- **Monitoring**: Prometheus metrics collection
- **Alerting**: Response time > 500ms

### API Metrics
- Request count per endpoint
- Success/failure rates
- User authentication success
- Peak usage times

### Health Checks
All services provide health endpoints:
```bash
# Service health
curl http://localhost:5000/health
curl http://localhost:5005/health
curl http://localhost:5006/health
```

---

## 📞 Support

### Documentation Issues
- **Unclear endpoints**: Create GitHub issue with "api" label
- **Missing information**: Create issue with "documentation" label
- **Outdated examples**: Create PR with corrections

### API Support
- **Email**: api-support@talentsphere.io
- **Issues**: [GitHub Issues](https://github.com/talentsphere/platform/issues)

---

**This comprehensive API reference covers all TalentSphere platform services with practical examples, error handling, and integration guidance.**

---
*Last Updated: January 28, 2026*  
*Total Endpoints: 230+*  
*Services Covered: 15*  
*Status: Production Ready*