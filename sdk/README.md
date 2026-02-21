# 📦 TalentSphere Client SDK

> **📋 For complete API specifications, see [docs/API_REFERENCE.md](../docs/API_REFERENCE.md)**

## Supported Languages

| Language | Package | Status |
|----------|---------|--------|
| **TypeScript** | `@talentsphere/api-client` | ✅ |
| **Python** | `talentsphere-client` | ✅ |
| **Java** | `com.talentsphere.client` | ✅ |
| **C#/.NET** | `TalentSphere.Client` | ✅ |
| **Go** | `github.com/talentsphere/client-go` | ✅ |

## Quick Start

```typescript
import { TalentSphereClient } from '@talentsphere/api-client';
const client = new TalentSphereClient({
  baseURL: 'https://api.talentsphere.com/v1',
  apiKey: process.env.API_KEY
});
```

*For complete API contracts and specifications, see [docs/API_REFERENCE.md](../docs/API_REFERENCE.md)*

## 🎯 Supported Languages

### **1. JavaScript/TypeScript**
- **Package Name:** `@talentsphere/api-client`
- **Framework:** Axios-based HTTP client
- **Features:**
  - TypeScript definitions
  - Promise-based API
  - Automatic JWT token handling
  - Retry logic
  - Request/response interceptors

### **2. Python**
- **Package Name:** `talentsphere-client`
- **Framework:** httpx/requests
- **Features:**
  - Type hints support
  - Async/await support
  - Automatic token refresh
  - Pagination helpers
  - Error handling

### **3. Java**
- **Package Name:** `com.talentsphere.client`
- **Framework:** Retrofit/OkHttp
- **Features:**
  - Reactive programming support
  - Automatic serialization
  - Token management
  - Error handling
  - Android compatibility

### **4. C#/.NET**
- **Package Name:** `TalentSphere.Client`
- **Framework:** HttpClient/Refit
- **Features:**
  - Dependency injection support
  - Task-based async
  - Strongly typed models
  - Automatic token refresh
  - .NET Standard support

### **5. Go**
- **Package Name:** `github.com/talentsphere/client-go`
- **Framework:** Standard HTTP client
- **Features:**
  - Context support
  - Structured logging
  - Concurrent requests
  - Automatic retries
  - Go modules

---

## 🚀 Quick Start

### **JavaScript/TypeScript**
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

### **Python**
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

### **Java**
```xml
<dependency>
    <groupId>com.talentsphere</groupId>
    <artifactId>client</artifactId>
    <version>1.0.0</version>
</dependency>
```

```java
TalentSphereClient client = new TalentSphereClient.Builder()
    .baseUrl("https://api.talentsphere.com/v1")
    .apiKey("your-api-key")
    .build();

// Example: Get courses
List<Course> courses = client.courses().list().execute();
```

---

## 🔧 SDK Features

### **🔐 Authentication**
- Automatic JWT token management
- Token refresh handling
- Multiple authentication methods
- API key support

### **📡 API Coverage**
- All REST endpoints covered across 11 microservices
- WebSocket support for real-time features (Collaboration, Notifications)
- File upload/download capabilities (Profile management)
- Streaming responses (Chat interfaces, real-time updates)
- Full CRUD operations for core entities
- Authentication and authorization handling
- Feature flag integration

### **🔄 Error Handling**
- Standardized error types
- Automatic retry logic
- Rate limiting handling
- Network error recovery

### **📊 Type Safety**
- Generated from OpenAPI spec
- Compile-time validation
- IntelliSense/autocomplete support
- Runtime type checking

### **🚀 Performance**
- Connection pooling
- Request caching
- Compression support
- Async/await patterns

---

## 📚 Documentation

Each SDK includes:
- Getting started guide
- API reference documentation
- Code examples
- Error handling guide
- Best practices

---

## 🔧 Development

### **Generating SDKs**
```bash
# Generate all SDKs
npm run generate:sdk

# Generate specific language
npm run generate:sdk -- --lang=typescript
npm run generate:sdk -- --lang=python
npm run generate:sdk -- --lang=java
```

### **Custom Templates**
SDK templates are located in `templates/` directory for customization.

### **Testing**
```bash
# Run SDK tests
npm run test:sdk

# Run tests for specific language
npm run test:sdk -- --lang=typescript
```

---

## 📋 Roadmap

### **Version 1.1**
- [ ] Swift SDK for iOS/macOS
- [ ] Kotlin SDK for Android
- [ ] PHP SDK
- [ ] Ruby SDK

### **Version 1.2**
- [ ] Dart SDK for Flutter
- [ ] Rust SDK
- [ ] C++ SDK
- [ ] Elixir SDK

---

## 🤝 Contributing

SDK contributions are welcome! See `CONTRIBUTING.md` for guidelines.

---

## 📞 Support

- **Documentation:** https://docs.talentsphere.com/sdk
- **Issues:** https://github.com/talentsphere/sdk/issues
- **Community:** https://discord.gg/talentsphere