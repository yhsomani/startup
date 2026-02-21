/**
 * Playwright Configuration for TalentSphere E2E Tests
 * Production-ready E2E testing setup with multiple browsers and devices
 */

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',

  // Global timeout for each test
  timeout: 30 * 1000,

  // Global timeout for the entire test run
  globalTimeout: 60 * 60 * 1000, // 1 hour

  // Run tests in parallel
  fullyParallel: true,

  // Number of workers (use all available CPU cores)
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports/html' }],
    ['json', { outputFile: 'tests/e2e/reports/test-results.json' }],
    ['junit', { outputFile: 'tests/e2e/reports/test-results.xml' }],
    ['list'],
    ['line'],
    // Custom reporter for console output
    ['dot']
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown.js'),

  // Test artifacts
  use: {
    // Base URL for tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Record video only when retrying a test for the first time
    video: 'retain-on-failure',

    // Take screenshot on failure
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },

    // Ignore HTTPS errors for development
    ignoreHTTPSErrors: process.env.NODE_ENV !== 'production',

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // User agent
    userAgent: 'TalentSphere-E2E-Testing/1.0.0',

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Device scale factor (for retina displays)
    deviceScaleFactor: 1,

    // Is mobile
    isMobile: false,

    // Has touch
    hasTouch: false,

    // Color scheme
    colorScheme: 'light',

    // Locale
    locale: 'en-US',

    // Timezone ID
    timezoneId: 'America/New_York',

    // Geolocation
    geolocation: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    permissions: ['geolocation'],

    // HTTP credentials
    httpCredentials: process.env.E2E_HTTP_CREDENTIALS ?
      JSON.parse(process.env.E2E_HTTP_CREDENTIALS) : undefined,

    // Extra HTTP headers
    extraHTTPHeaders: {
      'X-Testing-Environment': 'e2e',
      'X-Test-Run-ID': process.env.TEST_RUN_ID || Date.now().toString()
    },

    // Service workers
    serviceWorkers: 'block'
  },

  // Projects for different browsers and devices
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet devices
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },

    // Responsive design testing
    {
      name: 'small-screen',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 }, // iPhone SE
      },
    },

    {
      name: 'large-screen',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }, // Large desktop
      },
    },

    // Dark mode testing
    {
      name: 'dark-mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },

    // High DPI display testing
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        viewport: { width: 2560, height: 1440 },
      },
    }
  ],

  // Test files to include/exclude
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js'
  ],

  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**'
  ],

  // Retry configuration
  retries: process.env.CI ? 2 : 0, // Retry twice in CI, no retries locally

  // Metadata for test organization
  metadata: {
    'Test Environment': process.env.NODE_ENV || 'test',
    'Test Run ID': process.env.TEST_RUN_ID || Date.now().toString(),
    'Base URL': process.env.E2E_BASE_URL || 'http://localhost:3000',
    'API URL': process.env.E2E_API_URL || 'http://localhost:8000'
  },

  // Output directory for test artifacts
  outputDir: 'tests/e2e/artifacts',

  // Web server configuration (for running tests against local dev server)
  webServer: {
    command: 'node scripts/start-e2e.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe'
  },

  // Development server configuration
  devServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },

  // Environment variables for tests
  env: {
    NODE_ENV: 'test',
    E2E_TESTING: 'true',
    API_BASE_URL: process.env.E2E_API_URL || 'http://localhost:8000'
  }
});