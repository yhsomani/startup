/**
 * TalentSphere End-to-End Test Suite
 * Critical User Journey Testing with Playwright
 */

const { test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:8000';

// Test data
const testUsers = {
  jobSeeker: {
    email: 'jobseeker@talentsphere.test',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe'
  },
  employer: {
    email: 'employer@talentsphere.test',
    password: 'TestPassword123!',
    company: 'TechCorp Inc.',
    role: 'HR Manager'
  },
  admin: {
    email: 'admin@talentsphere.test',
    password: 'AdminPassword123!'
  }
};

const testJobs = {
  softwareEngineer: {
    title: 'Senior Software Engineer',
    description: 'We are looking for a Senior Software Engineer...',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $180,000'
  }
};

// Helper functions
class TestHelpers {
  static async setupTestData() {
    console.log('🔧 Setting up test data...');
    
    // Create test users via API
    await this.createTestUser(testUsers.jobSeeker, 'jobseeker');
    await this.createTestUser(testUsers.employer, 'employer');
    
    console.log('✅ Test data setup complete');
  }

  static async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    // Cleanup test data via API
    await this.cleanupTestUsers();
    await this.cleanupTestJobs();
    
    console.log('✅ Test data cleanup complete');
  }

  static async createTestUser(userData, userType) {
    // Implementation for creating test users via API
    console.log(`Creating ${userType} test user: ${userData.email}`);
  }

  static async cleanupTestUsers() {
    // Implementation for cleaning up test users
    console.log('Cleaning up test users');
  }

  static async cleanupTestJobs() {
    // Implementation for cleaning up test jobs
    console.log('Cleaning up test jobs');
  }

  static async takeScreenshot(page, name) {
    const screenshotPath = path.join(__dirname, '../screenshots', `${name}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  static async waitForAPIResponse(page, urlPattern) {
    return page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === 200
    );
  }
}

// Test fixtures
beforeAll(async () => {
  console.log('🚀 Starting E2E Test Suite');
  
  // Ensure screenshots directory exists
  const screenshotsDir = path.join(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Setup test data
  await TestHelpers.setupTestData();
});

afterAll(async () => {
  console.log('🏁 Ending E2E Test Suite');
  
  // Cleanup test data
  await TestHelpers.cleanupTestData();
});

beforeEach(async ({ page }) => {
  // Set default viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Clear cookies and localStorage
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  
  // Navigate to base URL
  await page.goto(BASE_URL);
});

afterEach(async ({ page }, testInfo) => {
  // Take screenshot on test failure
  if (testInfo.status !== 'passed') {
    await TestHelpers.takeScreenshot(page, `failed-${testInfo.title}`);
  }
});

module.exports = {
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  TestHelpers,
  BASE_URL,
  API_BASE_URL,
  testUsers,
  testJobs
};