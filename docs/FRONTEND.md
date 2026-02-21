# TalentSphere Frontend Architecture Guide

**Last Updated:** January 28, 2026  
**Version:** v1.1  
**Status:** Production Ready

Complete guide to TalentSphere's micro-frontend architecture, development, and deployment.

---

## 🏗️ Architecture Overview

### Micro-Frontend Structure
```
frontend/
├── ts-mfe-shell/          # Host application (Port 3010)
├── ts-mfe-lms/            # LMS remote MFE (Port 3005)
├── ts-mfe-challenge/      # Challenge remote MFE (Port 3006)
├── packages/              # Shared packages and utilities
└── README.md              # This guide
```

### Technology Stack
| Technology | Purpose | Version |
|------------|---------|---------|
| React 18 | UI Framework | 18.x |
| TypeScript | Type Safety | 5.x |
| Vite | Build Tool | 5.x |
| Module Federation | MFE Architecture | 2.x |
| Tailwind CSS | Styling | 3.x |
| React Router | Navigation | 6.x |
| Zustand | State Management | 4.x |

---

## 🎯 Component Responsibilities

### Shell MFE (`ts-mfe-shell/`)
**Port:** 3010  
**Role:** Host application and platform container

**Features:**
- Authentication (Login/Register with JWT)
- Navigation & Routing (React Router with lazy-loaded remotes)
- AI Assistant Integration (Personal tutor chatbot)
- Gamification Dashboard (Streaks, badges, points)
- Recruiter Dashboard (B2B candidate search - Admin only)
- Notification System (Real-time WebSocket notifications)

**Key Files:**
- `src/App.tsx` - Main application component
- `src/federation.ts` - Module federation configuration
- `src/router/index.tsx` - Route definitions
- `src/store/` - Global state management

### LMS MFE (`ts-mfe-lms/`)
**Port:** 3005  
**Role:** Learning Management System

**Features:**
- Course browsing and enrollment
- Lesson progression and video playback
- Quiz completion and assessments
- Progress tracking and certificates
- Course reviews and ratings

**Key Files:**
- `src/App.tsx` - LMS application root
- `src/components/CourseCard.tsx` - Course display component
- `src/pages/CourseDetail.tsx` - Course detail view
- `src/hooks/useCourses.ts` - Course data management

### Challenge MFE (`ts-mfe-challenge/`)
**Port:** 3006  
**Role:** Coding challenge platform

**Features:**
- Challenge browsing and filtering
- Code editor with syntax highlighting
- Test execution and validation
- Solution submission and scoring
- Leaderboard and achievements

**Key Files:**
- `src/App.tsx` - Challenge application root
- `src/components/CodeEditor.tsx` - Code editing interface
- `src/pages/ChallengeDetail.tsx` - Challenge detail view
- `src/hooks/useChallenges.ts` - Challenge data management

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- pnpm package manager
- Modern web browser

### Quick Start (5 Minutes)

#### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

#### 2. Start All MFEs
**Important:** Module Federation requires preview mode for remote MFEs, not dev mode.

Open **3 separate terminals:**

```bash
# Terminal 1: Shell (can use dev mode)
cd ts-mfe-shell && pnpm dev

# Terminal 2: LMS (MUST use preview)
cd ts-mfe-lms && pnpm build && pnpm preview

# Terminal 3: Challenge (MUST use preview)
cd ts-mfe-challenge && pnpm build && pnpm preview
```

#### 3. Access Applications
- **Shell:** http://localhost:3010
- **LMS:** http://localhost:3005
- **Challenge:** http://localhost:3006

---

## 🔧 Configuration

### Module Federation Setup

#### Shell MFE Configuration
```typescript
// ts-mfe-shell/vite.config.ts
export default defineConfig({
  plugins: [
    federation({
      name: 'shell',
      remotes: {
        lms: 'http://localhost:3005/assets/remoteEntry.js',
        challenge: 'http://localhost:3006/assets/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
      },
    }),
  ],
});
```

#### Remote MFE Configuration
```typescript
// ts-mfe-lms/vite.config.ts
export default defineConfig({
  plugins: [
    federation({
      name: 'lms',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
        './CourseCard': './src/components/CourseCard.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
});
```

### Environment Variables
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_WS_URL=ws://localhost:3030
VITE_AI_ASSISTANT_URL=http://localhost:5005
VITE_ENVIRONMENT=development
```

---

## 📦 Build and Deployment

### Development Build
```bash
# Build specific MFE
cd ts-mfe-shell && pnpm build

# Build all MFEs
pnpm run build:all
```

### Production Build
```bash
# Production build with optimizations
pnpm run build:prod

# Build and serve preview
pnpm run build:preview
```

### Docker Deployment
```dockerfile
# Dockerfile for Shell MFE
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --prod
COPY . .
RUN pnpm build
EXPOSE 3010
CMD ["pnpm", "preview"]
```

---

## 🔄 State Management

### Global State (Zustand)
```typescript
// src/store/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (credentials) => {
    const response = await authAPI.login(credentials);
    set({ user: response.user, token: response.token });
  },
  logout: () => set({ user: null, token: null }),
}));
```

### Cross-MFE Communication
```typescript
// Shared event bus for MFE communication
const eventBus = new EventTarget();

// Shell MFE
eventBus.dispatchEvent(new CustomEvent('user-login', { detail: user }));

// Remote MFE
eventBus.addEventListener('user-login', (event) => {
  // Handle user login
});
```

---

## 🎨 Styling and Theming

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
```

### Shared Components
```typescript
// packages/ui/src/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  onClick,
}) => {
  return (
    <button
      className={cn(
        'base-button-styles',
        variantStyles[variant],
        sizeStyles[size]
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

---

## 🔌 API Integration

### HTTP Client Configuration
```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

### WebSocket Integration
```typescript
// src/hooks/useWebSocket.ts
export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      setConnected(true);
      setSocket(ws);
    };
    
    ws.onclose = () => {
      setConnected(false);
      setSocket(null);
    };
    
    return () => ws.close();
  }, [url]);

  return { socket, connected };
};
```

---

## 🧪 Testing

### Unit Testing (Vitest)
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// src/__tests__/App.integration.test.tsx
import { render, screen } from '@testing-library/react';
import { App } from '../App';

describe('App Integration', () => {
  it('renders navigation and routes correctly', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
```

### E2E Testing (Playwright)
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can login and logout', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login-button]');
  
  await expect(page.locator('[data-testid=user-menu]')).toBeVisible();
  
  await page.click('[data-testid=logout-button]');
  await expect(page.locator('[data-testid=login-form]')).toBeVisible();
});
```

---

## 📊 Performance Optimization

### Code Splitting
```typescript
// Lazy loading for routes
const CourseDetail = lazy(() => import('./pages/CourseDetail'));

// Usage in router
<Route path="/course/:id" element={
  <Suspense fallback={<div>Loading...</div>}>
    <CourseDetail />
  </Suspense>
} />
```

### Bundle Analysis
```bash
# Analyze bundle sizes
pnpm run analyze

# Check for unused dependencies
pnpm run check:deps
```

### Caching Strategy
```typescript
// Service Worker for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

---

## 🐛 Troubleshooting

### Common Issues

#### Module Federation Errors
```bash
# Clear build cache
rm -rf node_modules/.vite
pnpm install

# Rebuild remotes
pnpm run build:remotes
```

#### CORS Issues
```javascript
// vite.config.ts
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

---

## 📈 Monitoring and Analytics

### Error Tracking
```typescript
// Error boundary for MFEs
class MFEErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('MFE Error:', error, errorInfo);
    // Send to error tracking service
  }
}
```

### Performance Monitoring
```typescript
// Performance metrics
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Bundle size optimized
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] CDN configuration updated

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify WebSocket connections
- [ ] Test cross-browser compatibility
- [ ] Validate API integrations

---

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Module Federation](https://module-federation.io/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools and Libraries
- [React Router](https://reactrouter.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Query](https://tanstack.com/query/latest)
- [Playwright](https://playwright.dev/)

---

**This guide provides comprehensive documentation for TalentSphere's frontend architecture.**

---
*Last Updated: January 28, 2026*  
*Architecture: Micro-Frontend with Module Federation*  
*Status: Production Ready*