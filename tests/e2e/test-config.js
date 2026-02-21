/**
 * Test Configuration for TalentSphere E2E Tests
 * Environment-specific configuration and settings
 */

const path = require('path');

module.exports = {
  // Base URLs
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.E2E_API_URL || 'http://localhost:8000',
  
  // Test timeouts
  defaultTimeout: 30000,
  navigationTimeout: 60000,
  actionTimeout: 10000,
  
  // Retry configuration
  maxRetries: process.env.CI ? 2 : 0,
  
  // Screenshots
  screenshots: {
    enabled: true,
    onFailure: true,
    onSuccess: false,
    fullPage: true,
    quality: 80,
    format: 'png'
  },
  
  // Videos
  videos: {
    enabled: true,
    onFailure: true,
    onSuccess: false,
    size: { width: 1280, height: 720 }
  },
  
  // Traces
  traces: {
    enabled: true,
    onFailure: true,
    onSuccess: false,
    mode: 'on-first-retry'
  },
  
  // Viewports for responsive testing
  viewports: {
    mobile: { width: 375, height: 667 },      // iPhone SE
    tablet: { width: 768, height: 1024 },     // iPad
    desktop: { width: 1280, height: 720 },    // Standard desktop
    large: { width: 1920, height: 1080 }      // Large desktop
  },
  
  // Performance thresholds (in milliseconds)
  performance: {
    pageLoad: 3000,      // Maximum acceptable page load time
    apiResponse: 2000,   // Maximum acceptable API response time
    fileUpload: 10000,    // Maximum acceptable file upload time
    search: 2000,        // Maximum acceptable search response time
    formSubmit: 5000      // Maximum acceptable form submission time
  },
  
  // Test data
  testData: {
    users: {
      jobSeeker: {
        email: process.env.TEST_JOBSEEKER_EMAIL || 'jobseeker@talentsphere.test',
        password: process.env.TEST_JOBSEEKER_PASSWORD || 'TestPassword123!',
        firstName: process.env.TEST_JOBSEEKER_FIRSTNAME || 'John',
        lastName: process.env.TEST_JOBSEEKER_LASTNAME || 'Doe'
      },
      employer: {
        email: process.env.TEST_EMPLOYER_EMAIL || 'employer@talentsphere.test',
        password: process.env.TEST_EMPLOYER_PASSWORD || 'TestPassword123!',
        company: process.env.TEST_EMPLOYER_COMPANY || 'TechCorp Inc.',
        role: process.env.TEST_EMPLOYER_ROLE || 'HR Manager'
      },
      admin: {
        email: process.env.TEST_ADMIN_EMAIL || 'admin@talentsphere.test',
        password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!'
      }
    },
    
    jobs: {
      softwareEngineer: {
        title: 'Senior Software Engineer',
        description: 'We are looking for a Senior Software Engineer with 5+ years of experience...',
        location: 'San Francisco, CA',
        type: 'Full-time',
        salary: '$120,000 - $180,000',
        category: 'Engineering',
        experienceLevel: 'Senior'
      }
    }
  },
  
  // File paths
  paths: {
    fixtures: path.join(__dirname, '../fixtures'),
    screenshots: path.join(__dirname, '../screenshots'),
    videos: path.join(__dirname, '../videos'),
    traces: path.join(__dirname, '../traces'),
    reports: path.join(__dirname, '../reports'),
    artifacts: path.join(__dirname, '../artifacts')
  },
  
  // Browser configuration
  browsers: {
    chromium: {
      headless: process.env.CI === 'true',
      slowMo: process.env.E2E_SLOW_MO ? parseInt(process.env.E2E_SLOW_MO) : 0,
      devtools: process.env.E2E_DEVTOOLS === 'true',
      args: process.env.E2E_BROWSER_ARGS ? process.env.E2E_BROWSER_ARGS.split(',') : [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    },
    firefox: {
      headless: process.env.CI === 'true',
      slowMo: process.env.E2E_SLOW_MO ? parseInt(process.env.E2E_SLOW_MO) : 0
    },
    webkit: {
      headless: process.env.CI === 'true',
      slowMo: process.env.E2E_SLOW_MO ? parseInt(process.env.E2E_SLOW_MO) : 0
    }
  },
  
  // Network configuration
  network: {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1
  },
  
  // Geolocation
  geolocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 100
  },
  
  // Permissions
  permissions: ['geolocation', 'notifications'],
  
  // Color scheme testing
  colorSchemes: ['light', 'dark'],
  
  // Locales for internationalization testing
  locales: ['en-US', 'es-ES', 'fr-FR', 'de-DE'],
  
  // Accessibility testing
  accessibility: {
    enabled: true,
    violationsToIgnore: [],
    axeOptions: {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa']
      }
    }
  },
  
  // Visual regression testing
  visualRegression: {
    enabled: process.env.E2E_VISUAL_REGRESSION === 'true',
    threshold: 0.2,
    retry: 3,
    prepareScreenshot: (page) => page.addStyleTag({
      content: '* { transition: none !important; animation: none !important; }'
    })
  },
  
  // API testing
  api: {
    timeout: 30000,
    retries: 3,
    validateStatus: true,
    validateHeaders: true
  }
};