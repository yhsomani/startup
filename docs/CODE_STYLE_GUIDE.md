# TalentSphere Code Style Guide

**Last Updated:** January 29, 2026  
**Version:** 1.0

This document defines coding standards and best practices for the TalentSphere project to ensure consistency, maintainability, and quality across all services.

## 📋 Table of Contents

- [General Principles](#general-principles)
- [JavaScript Standards](#javascript-standards)
- [TypeScript Standards (Future)](#typescript-standards)
- [Code Organization](#code-organization)
- [Error Handling](#error-handling)
- [Logging Standards](#logging-standards)
- [Security Guidelines](#security-guidelines)
- [Performance Guidelines](#performance-guidelines)
- [Testing Standards](#testing-standards)

---

## General Principles

### 🎯 Core Values

1. **Readability First**: Code should be written for humans to read, with optimization as secondary concern
2. **Consistency**: Follow established patterns across the entire codebase
3. **Maintainability**: Write code that can be easily modified and extended
4. **Security**: Always consider security implications
5. **Performance**: Write efficient code without premature optimization

### 📏 Formatting Standards

- Use **Prettier** for automatic formatting
- Maximum line length: **100 characters**
- Use **spaces** for indentation (4 spaces)
- Use **double quotes** for strings
- Include **semicolons** at end of statements
- Use **LF** line endings

---

## JavaScript Standards

### 🔤 Variable Naming

```javascript
// ✅ Good
const userSession = createSession();
let isActive = true;
const MAX_RETRY_COUNT = 3;

// ❌ Bad
const us = createSession();
let a = true;
const max = 3;
```

**Rules:**
- Use **camelCase** for variables and functions
- Use **UPPER_SNAKE_CASE** for constants
- Use **descriptive names** that indicate purpose
- Avoid **single letter variables** except for loop counters
- Use **meaningful names** that describe the data/functionality

### 📁 File Naming

```javascript
// ✅ Good
user-service.js
analytics-api.js
error-handler.js
config-validator.js

// ❌ Bad
usersrv.js
analyticsAPI.js
errHandler.js
configValidator.js
```

**Rules:**
- Use **kebab-case** for file names
- Be **descriptive** of the file's purpose
- Group related files with prefixes (e.g., `auth-service.js`, `auth-middleware.js`)

### 🔧 Function Standards

```javascript
// ✅ Good function example
class UserService {
    constructor(database, logger) {
        this.db = database;
        this.logger = logger;
    }

    async createUser(userData) {
        this.logger.info('Creating new user', { email: userData.email });

        try {
            // Validate input
            this.validateUserData(userData);
            
            // Create user
            const user = await this.db.users.create(userData);
            
            this.logger.businessEvent('user_created', user.id, {
                email: userData.email,
                role: userData.role
            });

            return {
                success: true,
                data: user,
                message: 'User created successfully'
            };
        } catch (error) {
            this.logger.error('Failed to create user', { 
                email: userData.email,
                error: error.message 
            }, error);

            throw this.createError('E_USER_CREATION_FAILED', error.message);
        }
    }

    validateUserData(userData) {
        if (!userData.email || !userData.email.includes('@')) {
            throw this.createValidationError('email', 'Valid email is required');
        }
        
        if (!userData.password || userData.password.length < 8) {
            throw this.createValidationError('password', 'Password must be at least 8 characters');
        }
    }

    createError(code, message) {
        return new Error(`${code}: ${message}`);
    }

    createValidationError(field, message) {
        return this.createError('E_VALIDATION_ERROR', `${field}: ${message}`);
    }
}
```

**Rules:**
- Use **classes** for complex functionality
- Keep functions **small** (max 50 lines)
- Maximum **5 parameters** per function
- Use **async/await** for asynchronous operations
- Always **handle errors** properly
- Include **JSDoc** comments for public methods

### 🏗️ Class and Module Structure

```javascript
// ✅ Good module structure
const { createLogger } = require('../shared/logger');
const { createErrorHandler } = require('../shared/error-handler');

class NotificationService {
    constructor(options = {}) {
        // 1. Dependencies first
        this.logger = createLogger('notification-service');
        this.errorHandler = createErrorHandler('notification-service');
        
        // 2. Configuration
        this.options = {
            port: options.port || 8080,
            maxConnections: options.maxConnections || 1000,
            ...options
        };
        
        // 3. State
        this.connections = new Map();
        this.isRunning = false;
        
        // 4. Initialize
        this.initialize();
    }

    // Public methods
    async start() { /* implementation */ }
    async stop() { /* implementation */ }
    
    // Private methods
    initialize() { /* implementation */ }
    handleConnection() { /* implementation */ }
}

module.exports = NotificationService;
```

**Rules:**
- Import **dependencies at the top**
- Use **constructor** for initialization
- Keep **private methods** prefixed with `_` or clearly marked
- Export **single class/function** as module default
- Include **error handling** in all public methods

---

## TypeScript Standards (Future)

### 🔷 Type Definitions

```typescript
// ✅ Good TypeScript
interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'moderator';
    createdAt: Date;
    lastLoginAt?: Date;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
}

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: ValidationError[];
    };
    timestamp: string;
}
```

**Rules:**
- Use **interfaces** for object shapes
- Use **union types** for specific values
- Use **generics** for reusable types
- Use **optional properties** (`?`) when appropriate
- Avoid **`any`** type when possible

---

## Code Organization

### 📁 Directory Structure

```
services/
├── shared/                    # Shared utilities and middleware
│   ├── logger.js             # Structured logging
│   ├── error-handler.js      # Error handling middleware
│   ├── config-validator.js    # Configuration validation
│   └── database-connection.js # Database utilities
├── service-name/              # Individual service
│   ├── package.json          # Service dependencies
│   ├── server.js            # Service entry point
│   ├── api.js              # REST API routes
│   ├── service.js          # Business logic
│   ├── models/              # Data models
│   └── tests/               # Service tests
```

### 📦 Module Dependencies

```javascript
// ✅ Good dependency management
const express = require('express');                    // Core framework
const { createLogger } = require('../shared/logger');     // Shared utility
const { v4: uuidv4 } = require('uuid');           // Specific utility
const UserService = require('./user-service');           // Internal service

// ❌ Bad dependency management
const express = require('express');
const logger = require('../logger');  // Not clear which logger
const uuid = require('uuid');
const service = require('./service'); // Not descriptive
```

**Rules:**
- Import **framework libraries** first
- Then **shared utilities** with clear paths
- Finally **internal services** with descriptive names
- Avoid **circular dependencies**

---

## Error Handling

### 🚨 Standardized Error Pattern

```javascript
// ✅ Good error handling
async function updateUser(userId, updateData) {
    try {
        // Validate input
        if (!userId || !updateData) {
            throw createError('E_VALIDATION_ERROR', 'User ID and update data are required');
        }

        // Check if user exists
        const existingUser = await database.users.findById(userId);
        if (!existingUser) {
            throw createNotFoundError('user', userId);
        }

        // Update user
        const updatedUser = await database.users.update(userId, updateData);
        
        logger.businessEvent('user_updated', userId, updateData);
        return updatedUser;

    } catch (error) {
        logger.error('Failed to update user', { userId, error: error.message }, error);
        throw error; // Re-throw with context
    }
}
```

### 📋 Error Code Standards

- Use **consistent error codes** with prefixes:
  - `E_` for general errors
  - `E_VALIDATION_ERROR` for input validation
  - `E_NOT_FOUND` for missing resources
  - `E_UNAUTHORIZED` for authentication
  - `E_FORBIDDEN` for authorization
  - `E_RATE_LIMIT_EXCEEDED` for rate limiting
  - `E_DATABASE_ERROR` for database issues
  - `E_EXTERNAL_SERVICE_ERROR` for external services

---

## Logging Standards

### 📝 Structured Logging Pattern

```javascript
// ✅ Good logging
const logger = createLogger('user-service');

async function createUser(userData) {
    // Request start
    logger.info('User creation requested', { 
        endpoint: '/users',
        email: userData.email 
    });

    try {
        // Business event
        logger.businessEvent('user_created', userId, {
            email: userData.email,
            role: userData.role
        });

        // Error with context
        logger.error('Database constraint violation', { 
            user_id: userId,
            constraint: 'unique_email',
            attempt: userData.email 
        }, databaseError);

    } catch (error) {
        logger.error('Unexpected error in user creation', { 
            email: userData.email,
            error_code: error.code 
        }, error);
    }
}
```

**Rules:**
- Use **structured logging** with consistent format
- Include **context** (request IDs, user IDs)
- Mask **sensitive data** automatically
- Use appropriate **log levels** (ERROR, WARN, INFO, DEBUG)
- Log **business events** separately

---

## Security Guidelines

### 🔒 Secure Coding Practices

```javascript
// ✅ Good security practices
class AuthService {
    async validateToken(token) {
        try {
            // Input validation
            if (!token || typeof token !== 'string') {
                throw createValidationError('token', 'Valid token is required');
            }

            // Secure operations
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Log security events
            if (decoded.isBlacklisted) {
                logger.securityEvent('blacklisted_token_used', 'high', {
                    user_id: decoded.userId,
                    ip_address: req.ip
                });
                throw createUnauthorizedError('Token is blacklisted');
            }

            return decoded;

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                logger.securityEvent('invalid_token_used', 'medium', {
                    error: error.message,
                    ip_address: req.ip
                });
            }
            throw createUnauthorizedError('Invalid authentication token');
        }
    }
}
```

**Rules:**
- Always **validate inputs**
- Use **parameterized queries** to prevent SQL injection
- **Never log passwords** or sensitive tokens
- Implement **rate limiting**
- Use **HTTPS** in production
- Validate **file uploads** for type and size
- Implement **CORS** properly

---

## Performance Guidelines

### ⚡ Performance Best Practices

```javascript
// ✅ Good performance practices
class AnalyticsService {
    constructor() {
        // Connection pooling
        this.dbPool = createConnectionPool({
            min: 2,
            max: 10,
            idle: 30000
        });

        // Caching
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getUserStats(userId, options = {}) {
        // Check cache first
        const cacheKey = `user_stats_${userId}_${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        // Use connection from pool
        const connection = await this.dbPool.getConnection();
        
        try {
            // Efficient query with limits
            const stats = await connection.query(
                'SELECT * FROM user_stats WHERE user_id = $1 LIMIT $2',
                [userId, options.limit || 100]
            );

            // Cache result
            this.cache.set(cacheKey, {
                data: stats,
                timestamp: Date.now()
            });

            return stats;

        } finally {
            // Always return connection to pool
            this.dbPool.releaseConnection(connection);
        }
    }
}
```

**Rules:**
- Use **connection pooling** for databases
- Implement **caching** for frequently accessed data
- Add **database indexes** for query optimization
- Use **pagination** for large result sets
- **Monitor performance** and optimize bottlenecks
- Avoid **blocking operations** in main thread

---

## Testing Standards

### 🧪 Test Structure

```javascript
// ✅ Good test structure
describe('UserService', () => {
    let userService;
    let mockDatabase;

    beforeEach(() => {
        // Setup test environment
        mockDatabase = createMockDatabase();
        userService = new UserService(mockDatabase, mockLogger);
    });

    afterEach(() => {
        // Cleanup test environment
        mockDatabase.clear();
    });

    describe('createUser', () => {
        it('should create user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'securepassword123'
            };

            const result = await userService.createUser(userData);

            expect(result.success).toBe(true);
            expect(result.data.email).toBe(userData.email);
            expect(result.data.password).toBeUndefined(); // Password should be hashed
        });

        it('should throw validation error with invalid email', async () => {
            const userData = {
                email: 'invalid-email',
                name: 'Test User',
                password: 'securepassword123'
            };

            await expect(userService.createUser(userData))
                .rejects.toThrow('E_VALIDATION_ERROR: email: Valid email is required');
        });

        it('should handle database errors gracefully', async () => {
            mockDatabase.users.create.mockRejectedValueOnce(
                new Error('Database connection failed')
            );

            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                password: 'securepassword123'
            };

            await expect(userService.createUser(userData))
                .rejects.toThrow('E_DATABASE_ERROR');
        });
    });
});
```

**Rules:**
- Write **unit tests** for all public methods
- Test **error conditions** as well as success cases
- Use **mocks** for external dependencies
- Maintain **high test coverage** (>80%)
- Use **descriptive test names**
- Test **edge cases** and boundary conditions

---

## 🔧 Development Workflow

### 📋 Pre-commit Checklist

Before committing code, ensure:

- [ ] **Code runs without errors**
- [ ] **All tests pass** (`npm test`)
- [ ] **Linting passes** (`npm run lint`)
- [ ] **Code is formatted** (`npm run format`)
- [ ] **No sensitive data** in logs or error messages
- [ ] **Error handling** is comprehensive
- [ ] **Documentation updated** for new features

### 🚀 CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Code Quality
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Check formatting
        run: npm run format:check
      
      - name: Check types (TypeScript)
        run: npm run type-check
```

---

## 📚 Additional Resources

### 📖 Recommended Reading

- **Clean Code** by Robert C. Martin
- **JavaScript: The Good Parts** by Douglas Crockford
- **You Don't Know JS Yet** by Kyle Simpson
- **Node.js Best Practices** (Node.js official docs)

### 🔗 Useful Tools

- **ESLint**: Code linting and quality checks
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Jest**: Testing framework
- **SonarQube**: Code quality analysis
- **ESLint Plugin Security**: Security vulnerability detection

---

## 📞 Enforcement

### ⚡ Automated Enforcement

1. **Pre-commit hooks** using Husky
2. **CI/CD pipeline** validation
3. **Automated code reviews**
4. **Quality gates** for merges

### 👥 Manual Review Process

1. **Peer review** required for all changes
2. **Senior developer** approval for critical changes
3. **Security review** for authentication/authorization changes
4. **Performance review** for database/algorithm changes

---

**Last Reviewed:** January 29, 2026  
**Next Review Due:** April 29, 2026