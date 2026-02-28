# TalentSphere API Reference

> **Complete API Documentation**

##📋 Overview

This document provides comprehensive API documentation for all TalentSphere services. For architecture and implementation details, see [SSOT.md](docs/SSOT.md).

##🚪 Gateway

All API requests are routed through the central API Gateway at: `http://localhost:8000/api/v1`

### Authentication

Most endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

##🔐 Authentication Service

### User Registration
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt-token-here"
  }
}
```

### User Login
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Token Refresh
```
POST /api/v1/auth/refresh
```

##👤 Profile Service

### Get User Profile
```
GET /api/v1/users/profile/{userId}
```

**Headers:**
```
Authorization: Bearer <jwt-token>
```

### Update Profile
```
PUT /api/v1/users/profile/{userId}
```

**Request Body:**
```json
{
  "bio": "Full-stack developer passionate about cloud technologies",
  "location": "San Francisco, CA",
  "skills": ["JavaScript", "React", "Node.js", "AWS"]
}
```

### Upload Profile Picture
```
POST /api/v1/users/profile/{userId}/avatar
```

**Form Data:**
```
avatar: [file]
```

##💼 Job Listing Service

### Search Jobs
```
GET /api/v1/jobs/search
```

**Query Parameters:**
- `q`: Search query
- `location`: Location filter
- `jobType`: FULL_TIME, PART_TIME, CONTRACT, etc.
- `experienceLevel`: Entry, Mid, Senior, etc.
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Example:**
```
GET /api/v1/jobs/search?q=react+developer&location=Remote&jobType=FULL_TIME
```

### Get Job Details
```
GET /api/v1/jobs/{jobId}
```

### Apply for Job
```
POST /api/v1/jobs/{jobId}/apply
```

##🏢 Company Service

### Get Company Profile
```
GET /api/v1/companies/{companyId}
```

### Search Companies
```
GET /api/v1/companies/search
```

### Get Company Jobs
```
GET /api/v1/companies/{companyId}/jobs
```

##🔍 Search Service

### Global Search
```
GET /api/v1/search
```

**Query Parameters:**
- `q`: Search query
- `type`: USER, JOB, COMPANY, CONTENT
- `filters`: JSON filter object

### Search Users
```
GET /api/v1/search/users
```

### Search Jobs
```
GET /api/v1/search/jobs
```

### Search Companies
```
GET /api/v1/search/companies
```

## 📊 Analytics Service

### Get User Analytics
```
GET /api/v1/analytics/users/{userId}
```

### Get Job Analytics
```
GET /api/v1/analytics/jobs/{jobId}
```

### Get Platform Statistics
```
GET /api/v1/analytics/platform
```

## 📧 Notification Service

### Get Notifications
```
GET /api/v1/notifications
```

**Query Parameters:**
- `type`: MESSAGE, JOB_APPLICATION, CONNECTION_REQUEST, etc.
- `read`: true/false
- `limit`: Number of notifications

### Mark as Read
```
PUT /api/v1/notifications/{notificationId}/read
```

### Delete Notification
```
DELETE /api/v1/notifications/{notificationId}
```

## 📤 Upload Service

### Upload File
```
POST /api/v1/upload
```

**Form Data:**
```
file: [file]
type: RESUME|PROFILE_PICTURE|DOCUMENT
```

##🔧 Endpoints

### Health Check
```
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T10:30:00Z",
  "services": {
    "auth-service": "healthy",
    "user-profile-service": "healthy",
    "job-listing-service": "healthy",
    "database": "healthy"
  }
}
```

### API Status
```
GET /api/v1/status
```

##📱 Rate Limits

API endpoints are rate-limited to prevent abuse:

- **Anonymous requests**: 100 requests/hour
- **Authenticated requests**: 1000 requests/hour
- **File uploads**: 50 uploads/hour

## 📞 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## 🛠️ SDKs and Tools

### Official SDKs
- **JavaScript/TypeScript**: `@talentsphere/sdk`
- **Python**: `talentsphere-sdk`
- **Java**: `talentsphere-java-sdk`

### API Testing
Use the included Postman collection:
```
docs/api/TalentSphere_API.postman_collection.json
```

## 📚 Additional Resources

- [OpenAPI Specification](/api/openapi.yaml)
- [GraphQL Playground](/graphql)
- [WebSocket Documentation](/docs/websockets.md)

---

*For architecture and implementation details, see [SSOT.md](docs/SSOT.md)*