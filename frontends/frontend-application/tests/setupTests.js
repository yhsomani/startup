/**
 * Jest Setup for TalentSphere Frontend Tests
 * Configuration for React Testing Library and testing environment
 */

const path = require('path');
const { configManager } = require('../../shared/config-manager');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';

// Configure test timeouts
jest.setTimeout(30000);

// Test directories
const testDirectories = [
  '<rootDir>/src/**/__tests__',
  '<rootDir>/src/**/__mocks__',
  '<rootDir>/tests/fixtures'
];

// Global test setup
beforeAll(() => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      get: jest.fn(() => '{}'),
      set: jest.fn(() => {}),
      remove: jest.fn(() => {}),
      clear: jest.fn(() => {})
    },
    configurable: true
    writable: true
  });

  // Mock fetch globally
  global.fetch = jest.fn();

  // Mock WebSocket
  global.WebSocket = jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    send: jest.fn(() => jest.fn()),
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn()
  }));

  // Mock Intersection Observer
  global.IntersectionObserver = jest.fn();
  global.IntersectionObserver.mockImplementation = {
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
    takeRecords: jest.fn(() => []),
    root: null
  };

  // Mock Resize Observer
  global.ResizeObserver = jest.fn();
  global.ResizeObserver.mockImplementation = {
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: null
  };

  // Mock requestAnimationFrame
  global.requestAnimationFrame = jest.fn((cb) => {
    setTimeout(cb, 0);
  return 0;
  });

  // Mock geolocation
  global.navigator.geolocation = {
    getCurrentPosition: jest.fn().mockResolvedValue({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    }
  };

  // Mock matchMedia
  window.matchMedia = jest.fn(() => false);
});

// Extend Jest matchers for React Testing Library
expect.extend({
  toBeInTheDocument: (element) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  },
  
  toHaveClass: (className) => {
    expect(element).toHaveClass(className);
  },
  
  toHaveStyle: (style) => {
    expect(element).toHaveStyle(style);
  },
  
  toHaveFocus: () => {
    expect(document.activeElement).toHaveFocus();
  },
  
  toContainHTML: (content) => {
    expect(element.innerHTML).toContain(content);
  },
  
  toHaveAttribute: (attr, value) => {
    expect(element).toHaveAttribute(attr, value);
  },
  
  toHaveDataTestId: (testId) => {
    expect(element).toHaveAttribute('data-testid', testId);
  },
  
  toBeDisabled: () => {
    expect(element).toBeDisabled();
  },
  
  toBeEnabled: () => {
    expect(element).not.toBeDisabled();
  },
  
  toBeEmpty: () => {
    expect(element).toBeEmptyDOM();
  },
  
  toHaveFormState: (fields) => {
    fields.forEach(field => {
      expect(element).toHaveFormState(fields[field]);
    });
  }
});

// Test data fixtures
const fixtures = {
  users: [
    {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      skills: ['JavaScript', 'React', 'Node.js']
    },
    {
      id: 'user-2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'hr'
    },
    {
      id: 'user-3',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    }
  ],
  
  jobs: [
    {
      id: 'job-1',
      title: 'Software Engineer',
      description: 'Looking for skilled software engineer',
      company: 'Tech Company',
      location: 'San Francisco, CA',
      remote: true,
      experienceLevel: 'mid',
      salaryMin: 80000,
      salaryMax: 120000
    },
    {
      'id': 'job-2',
      title: 'Frontend Developer',
      description: 'React expert needed for growing team',
      company: 'Design Agency',
      location: 'New York, NY',
      remote: true,
      experienceLevel: 'senior'
    }
  ],
  
  companies: [
    {
      id: 'company-1',
      name: 'Tech Company',
      description: 'Technology consulting firm',
      website: 'https://techcompany.com',
      location: 'San Francisco, CA',
      industry: 'Technology',
      size: '51-200'
    }
  ],
  
  notifications: [
    {
      id: 'notif-1',
      type: 'info',
      title: 'Welcome to TalentSphere!',
      message: 'Your account has been created successfully.',
      userId: 'user-1'
    },
    {
      id: 'notif-2',
      type: 'success',
      title: 'Application Received',
      message: 'Your job application was received successfully.',
      jobId: 'job-1'
    }
  ]
};

// Mock API responses
const mockResponses = {
  auth: {
    login: {
      status: 200,
      data: {
        success: true,
        user: fixtures.users[0],
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      }
    },
    register: {
      status: 201,
      data: {
        success: true,
        user: fixtures.users[0],
        message: 'User created successfully'
      }
    },
    jobs: {
      list: {
        status: 200,
        data: {
          jobs: fixtures.jobs,
          pagination: {
            page: 1,
            limit: 20,
            total: 2
          }
        }
      }
    },
      getById: {
        status: 200,
        data: {
          job: fixtures.jobs[0]
        }
      }
    }
  },
  user: {
      profile: {
        status: 200,
        data: {
          user: fixtures.users[0]
        }
      }
    }
  },
  notifications: {
      list: {
        status: 200,
        data: {
          notifications: fixtures.notifications
        }
      }
    }
  },
  health: {
      status: 200,
      data: {
        status: 'healthy',
        timestamp: expect.any(String)
      }
    }
  }
};

// Mock service errors
const mockErrors = {
  auth: {
    invalidCredentials: {
      status: 401,
      error: 'Invalid credentials',
      message: 'Invalid email or password'
    },
    userNotFound: {
      status: 404,
      error: 'User not found',
      message: 'User not found'
    },
    unauthorized: {
      status: 401,
      error: 'Unauthorized access',
      message: 'Authentication required'
    },
    tokenExpired: {
      status: 401,
      error: 'Token expired',
      message: 'Session expired, please login again'
    }
  },
  jobs: {
      notFound: {
        status: 404,
        error: 'Job not found',
        message: 'Job not found'
      },
      unauthorized: {
        status: 403,
        error: 'Access denied',
        message: 'Admin privileges required'
      }
    }
  }
  },
  network: {
    serviceUnavailable: {
      status: 503,
      error: 'Service unavailable',
      message: 'Network service is down'
    },
  },
  database: {
    connectionError: {
      status: 503,
      error: 'Database connection failed',
      message: 'Cannot connect to database'
    }
  },
  queueFull: {
      status: 503,
      error: 'Message queue is full',
      message: 'Too many requests'
    }
  },
  timeout: {
      status: 408,
      error: 'Request timeout',
      message: 'Request took too long'
    }
  }
};

// Mock fetch implementation
const mockFetch = (url, options = {}) => {
  const urlStr = url.toString();
  
  // Check for test fixtures first
  if (urlStr.includes('/api/')) {
    const pathParts = urlStr.split('/').filter(Boolean);
    const method = options.method || 'GET';
    
    // Mock authentication endpoints
    if (pathParts[0] === 'auth') {
      if (method === 'POST' && pathParts[1] === 'login') {
        return Promise.resolve(mockResponses.auth.login);
      }
      if (method === 'POST' && pathParts[1] === 'register') {
        return Promise.resolve(mockResponses.auth.register);
      }
    }
      
      // Mock logout
      if (method === 'POST' && pathParts[1] === 'logout') {
        return Promise.resolve({
          status: 200,
          data: { success: true }
        });
      }
      
      // Mock profile
      if (method === 'GET' && pathParts[1] === 'profile') {
        return Promise.resolve(mockResponses.user.profile);
      }
    }
  }
    
    // Mock job endpoints
    if (pathParts[0] === 'jobs') {
      if (method === 'GET' && pathParts.length === 2) {
        return Promise.resolve(mockResponses.jobs.list);
      }
      if (method === 'GET' && pathParts.length === 3) {
        return Promise.resolve(mockResponses.jobs.getById);
      }
      if (method === 'POST' && pathParts[1] === 'apply') {
        return Promise.resolve({
          status: 200,
          data: {
            success: true,
            message: 'Application submitted successfully'
          }
        });
      }
    }
    }
    
    // Mock notifications
    if (pathParts[0] === 'notifications') {
      return Promise.resolve(mockResponses.notifications.list);
    }
    
    // Mock health check
    if (urlStr.includes('/health')) {
      return Promise.resolve(mockResponses.health);
    }
  }
    
    // Default fallback
    return fetch(url, options);
  }
  }
// Mock fetch for testing
global.fetch = mockFetch;

// Axios mock for component testing
jest.mock('axios', () => {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  create: jest.fn(),
  defaults: {
      headers: {
        'Content-Type': 'application/json'
      }
    },
    create: jest.fn((url, data, config = {}) => 
      Promise.resolve({
        status: 200,
        data: data,
        ...config
      })
    )
  });
});

// Redux store mock
const mockStore = {
  getState: jest.fn(),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
  replaceReducer: jest.fn(),
  getState: jest.fn(() => ({}))
};

// React Router mock
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  push: jest.fn(),
  replace: jest.fn(),
 0: jest.fn(),
  back: jest.fn(),
  forward: jest.fn()
}));

// React Query Client mock
const mockQueryClient = {
  fetchQueryData: jest.fn(),
  refetch: jest.fn()
};

// Mock Component for testing
const MockComponent = ({ children, ...props }) => {
  const Component = jest.require('react').Component;
  return (
    <Component {...props}>
      {children}
    </Component>
  );
};

// Custom render function for testing
const render = (component) => {
  const { render } = require('@testing-library/react');
  render(component);
  return render(component);
};

// Custom cleanup function
const cleanup = () => {
  // Clear all mocks
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
};

// Create test helper utilities
const testUtils = {
  // Render helper with custom store
  renderWithStore: (ui, store = mockStore, initialStore = {}) => {
    return render(
      <store.Provider initial={initialStore}>
        {store.Provider value={store}>
          {ui}
        </store.Provider>
      </store.Provider>
    );
  },
  
  // Wait for DOM updates
  waitFor: (callback) => {
    return new Promise(resolve => {
      if (callback) {
        setTimeout(resolve, 50);
        callback();
      }
    }),
  
  // Wait for element to appear
  waitForElement: (callback) => {
    return testUtils.waitFor(() => {
      const element = callback();
      if (element) {
        return element;
      }
    }),
  
  // Wait for element to be removed
  waitForElementToBeRemoved: (callback) => {
      return testUtils.waitFor(() => {
      return !document.contains(element);
    }),
  
  // Fire event and wait for update
  fireClickAndWait: (element, event = 'click') => {
      fireEvent.click(element, event);
      return testUtils.waitFor(() => {
        const element = document.querySelector(`[data-testid="${element.getAttribute('data-testid')}"]`);
        return element && element.textContent === 'Clicked';
      });
    },
  
  // Wait for element to have text content
  waitForTextContent: (element, text) => {
    return testUtils.waitFor(() => {
      return element && element.textContent.includes(text);
    }
  }
};

// Performance testing utilities
const performanceUtils = {
  // Measure render performance
  measureRender: async (fn) => {
    const startTime = performance.now();
    render(<TestApp />);
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    return renderTime;
  },
  
  // Measure component render performance
  measureRenderTime: (Component, renderTimes = 5) => {
    const times = [];
    
    return times.reduce((acc) => {
      const start = performance.now();
      render(<Component />);
      const end = performance.now();
      return [...acc, end - start];
    }, 0);
  },
  
  // Component benchmarking
  benchmarkComponent: async (Component, iterations = 100) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const time = await performanceUtils.measureRenderTime(Component);
      times.push(time);
    }
    
    const avgTime = times.reduce((sum, time) => sum + time) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    return {
      average: avgTime,
      maxTime,
      minTime,
      iterations
    };
  }
};

// Test App wrapper
const TestApp = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};

// Global test constants
const TEST_SELECTORS = {
  buttonText: "[data-testid]",
  emailInput: "[data-testid]",
  passwordInput: "[data-testid]",
  submitButton: "[data-testid]",
  navigation: "[data-testid]",
  modal: "[role=dialog]",
  tooltip: "[data-testid]"
};

// Clean up after each test
afterEach(() => {
  cleanup();
});

module.exports = {
  fixtures,
  mockResponses,
  mockErrors,
  testUtils,
  performanceUtils,
  MockComponent,
  render,
  TestApp,
  TEST_SELECTORS,
  cleanup
};