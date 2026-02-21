/**
 * Global Setup for Playwright E2E Tests
 * Runs once before all test suites
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function globalSetup(config) {
  console.log('🚀 Starting Global E2E Test Setup');
  
  // Ensure required directories exist
  const directories = [
    'tests/e2e/reports',
    'tests/e2e/artifacts',
    'tests/e2e/screenshots',
    'tests/e2e/traces',
    'tests/e2e/videos'
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Setup test database if needed
  if (process.env.E2E_SETUP_DATABASE === 'true') {
    console.log('🗄️ Setting up test database...');
    await setupTestDatabase();
  }
  
  // Start test services if needed
  if (process.env.E2E_START_SERVICES === 'true') {
    console.log('🔧 Starting test services...');
    await startTestServices();
  }
  
  // Create test data fixtures
  console.log('📝 Creating test data fixtures...');
  await createTestDataFixtures();
  
  // Wait for services to be ready
  console.log('⏳ Waiting for services to be ready...');
  await waitForServices();
  
  // Create global browser instance for shared state
  const browser = await chromium.launch();
  
  // Store global state
  global.__BROWSER__ = browser;
  global.__TEST_START_TIME__ = Date.now();
  
  console.log('✅ Global E2E Test Setup Complete');
  
  return browser;
}

async function setupTestDatabase() {
  // Implementation for setting up test database
  console.log('Setting up test database with fixtures...');
  
  // This would typically involve:
  // - Creating test database schema
  // - Running migrations
  // - Loading seed data
  
  return Promise.resolve();
}

async function startTestServices() {
  console.log('Starting test services...');
  
  // This would typically involve:
  // - Starting API server
  // - Starting database services
  // - Starting message queues
  // - Starting external service mocks
  
  return Promise.resolve();
}

async function createTestDataFixtures() {
  console.log('Creating test data fixtures...');
  
  // Create sample files for upload tests
  const fixturesDir = 'tests/fixtures';
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }
  
  // Create sample resume file
  const sampleResume = path.join(fixturesDir, 'sample-resume.pdf');
  if (!fs.existsSync(sampleResume)) {
    // This would create a real PDF file
    fs.writeFileSync(sampleResume, Buffer.from('Sample resume content'));
  }
  
  // Create sample profile image
  const sampleImage = path.join(fixturesDir, 'sample-profile.jpg');
  if (!fs.existsSync(sampleImage)) {
    // This would create a real image file
    fs.writeFileSync(sampleImage, Buffer.from('Sample image content'));
  }
  
  return Promise.resolve();
}

async function waitForServices() {
  console.log('Waiting for services to be ready...');
  
  const services = [
    {
      name: 'Frontend',
      url: process.env.E2E_BASE_URL || 'http://localhost:3000',
      timeout: 30000
    },
    {
      name: 'API',
      url: process.env.E2E_API_URL || 'http://localhost:8000',
      timeout: 30000
    }
  ];
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, { 
        method: 'GET',
        timeout: service.timeout 
      });
      
      if (response.ok) {
        console.log(`✅ ${service.name} is ready`);
      } else {
        console.warn(`⚠️ ${service.name} responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ ${service.name} is not ready:`, error.message);
      throw new Error(`Service ${service.name} is not available`);
    }
  }
  
  return Promise.resolve();
}

module.exports = globalSetup;