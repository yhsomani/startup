# TalentSphere End-to-End Test Suite

This directory contains comprehensive E2E tests for the TalentSphere platform using Playwright.

## 🎯 Test Coverage

### Critical User Journeys
- ✅ **Authentication Flow** - Registration, login, logout, password recovery
- ✅ **Job Application Process** - Search, apply, track applications, save jobs
- ✅ **Employer Dashboard** - Job posting, candidate management, analytics
- ✅ **Performance Testing** - Load times, responsiveness, concurrent users

### Browser Coverage
- 🌐 Chromium (Chrome/Edge)
- 🦊 Firefox
- 🍎 WebKit (Safari)
- 📱 Mobile devices (iOS/Android)
- 📊 Tablet devices
- 🌓 Dark/Light mode
- 🖥️ Responsive design

## 🚀 Getting Started

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure test environment variables
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:8000
TEST_JOBSEEKER_EMAIL=jobseeker@talentsphere.test
TEST_EMPLOYER_EMAIL=employer@talentsphere.test
```

### Running Tests

#### All Tests (All Browsers)
```bash
npm run test:e2e
```

#### Specific Browser
```bash
# Chrome only
npx playwright test --project=chromium-desktop

# Mobile testing
npx playwright test --project=mobile-chrome
```

#### Headed Mode (Watch Browser)
```bash
npm run test:e2e:headed
```

#### Debug Mode
```bash
npm run test:e2e:debug
```

#### Interactive UI Mode
```bash
npm run test:e2e:ui
```

## 📊 Test Reports

### HTML Report
```bash
npm run test:e2e:report
```

Reports are generated in:
- `tests/e2e/reports/html/index.html` - Interactive HTML report
- `tests/e2e/reports/test-results.json` - JSON results
- `tests/e2e/reports/test-results.xml` - JUnit format

### Artifacts
- **Screenshots** - `tests/e2e/screenshots/`
- **Videos** - `tests/e2e/videos/`
- **Traces** - `tests/e2e/traces/`
- **Archives** - `tests/e2e/archives/`

## 🎭 Test Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `E2E_BASE_URL` | `http://localhost:3000` | Frontend base URL |
| `E2E_API_URL` | `http://localhost:8000` | API base URL |
| `NODE_ENV` | `test` | Test environment |
| `CI` | `false` | Running in CI/CD |
| `E2E_SLOW_MO` | `0` | Slow motion delay (ms) |
| `E2E_HEADLESS` | `true` in CI | Headless browser mode |
| `E2E_SETUP_DATABASE` | `false` | Setup test database |
| `E2E_CLEANUP_DATA` | `false` | Cleanup test data after run |

### Performance Thresholds
| Metric | Threshold |
|--------|-----------|
| Page Load | < 3 seconds |
| API Response | < 2 seconds |
| Search | < 2 seconds |
| File Upload | < 10 seconds |
| Form Submit | < 5 seconds |

## 🔧 Test Structure

### Directory Layout
```
tests/e2e/
├── setup.js                 # Global test setup and helpers
├── authentication.test.js    # User authentication tests
├── job-application.test.js    # Job application flow tests
├── employer-dashboard.test.js # Employer functionality tests
├── performance.test.js       # Performance and load tests
├── test-config.js           # Test configuration
├── global-setup.js          # Global setup (before all tests)
├── global-teardown.js       # Global teardown (after all tests)
├── fixtures/                # Test data files
├── reports/                 # Test reports
├── screenshots/             # Test screenshots
├── videos/                 # Test videos
├── traces/                 # Test traces
└── artifacts/               # Other test artifacts
```

### Test Organization
- **Setup** - Global configuration and helpers in `setup.js`
- **User Flows** - Complete user journey tests
- **Component Tests** - Specific component interaction tests
- **Performance** - Load time and responsiveness tests
- **Accessibility** - WCAG compliance tests

## 📱 Mobile Testing

### Viewport Coverage
- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1280x720 (Standard)
- **Large**: 1920x1080 (Large desktop)

### Device Testing
```bash
# Test specific devices
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
npx playwright test --project=tablet-chrome
```

## 🌓 Theme Testing

### Dark Mode
```bash
npx playwright test --project=dark-mode
```

### High DPI Display
```bash
npx playwright test --project=high-dpi
```

## 📈 Performance Testing

### Metrics Collection
- Page load times
- API response times
- Memory usage
- Network performance
- Concurrent user handling

### Run Performance Tests
```bash
npx playwright test tests/e2e/performance.test.js
```

## 🔍 Debugging

### Debug Mode
```bash
# Step-by-step debugging
npm run test:e2e:debug

# With browser visible
npx playwright test --debug --headed
```

### VS Code Integration
Install the Playwright VS Code extension for:
- Test discovery
- Running individual tests
- Debugging integration
- Test result visualization

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: |
    npx playwright install --with-deps
    npm run test:e2e
  env:
    E2E_BASE_URL: ${{ steps.deployment.outputs.url }}
```

### Docker Testing
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx playwright install --with-deps
CMD ["npm", "run", "test:e2e"]
```

## 🔧 Custom Test Development

### Adding New Tests
1. Create test file: `tests/e2e/new-feature.test.js`
2. Import test setup: `const { test, expect } = require('./setup');`
3. Write test functions using Playwright API
4. Run tests: `npx playwright test new-feature.test.js`

### Test Data Management
- Use test fixtures in `tests/fixtures/`
- Environment-specific test users
- Mock data for external services
- Cleanup hooks for test isolation

### Best Practices
- ✅ Use descriptive test names
- ✅ Group related tests in `describe` blocks
- ✅ Use data-testid attributes for element selection
- ✅ Handle async operations properly
- ✅ Clean up test data after each test
- ✅ Test both positive and negative scenarios
- ✅ Include accessibility checks
- ✅ Test on multiple viewports

## 🔗 Related Documentation

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TalentSphere API Documentation](../api/README.md)
- [Frontend Testing Guide](../frontend/README.md)
- [CI/CD Pipeline Documentation](../docs/ci-cd.md)

## 🤝 Contributing

When adding new E2E tests:

1. Follow existing test patterns
2. Include performance assertions
3. Test on multiple viewports
4. Add accessibility checks
5. Update documentation
6. Run tests locally before submitting

## 📞 Support

For E2E testing questions:
- Check test results in HTML report
- Review Playwright trace files
- Check test logs in CI/CD
- Contact the QA team for complex scenarios