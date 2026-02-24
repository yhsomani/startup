/**
 * Global Teardown for Playwright E2E Tests
 * Runs once after all test suites
 */

const fs = require('fs');
const path = require('path');

async function globalTeardown(config) {
  console.log('🧹 Starting Global E2E Test Teardown');

  // Close global browser instance
  if (global.__BROWSER__) {
    await global.__BROWSER__.close();
    console.log('✅ Global browser closed');
  }

  // Generate test summary report
  await generateTestSummary();

  // Cleanup test data if configured
  if (process.env.E2E_CLEANUP_DATA === 'true') {
    console.log('🗄️ Cleaning up test database...');
    await cleanupTestData();
  }

  // Archive test artifacts
  await archiveTestArtifacts();

  // Calculate total test duration
  const startTimeVal = Number(global.__TEST_START_TIME__);
  const totalDurationMs = (!isNaN(startTimeVal) && startTimeVal > 0) ? Date.now() - startTimeVal : 0;
  const durationMinutes = Math.floor(totalDurationMs / 60000);
  const durationSeconds = Math.floor((totalDurationMs % 60000) / 1000);

  console.log(`✅ Global E2E Test Teardown Complete`);
  console.log(`📊 Total test duration: ${durationMinutes}m ${durationSeconds}s`);
}

async function generateTestSummary() {
  console.log('📊 Generating test summary report...');

  const startTime = global.__TEST_START_TIME__ ? new Date(global.__TEST_START_TIME__).toISOString() : new Date().toISOString();
  const totalDuration = global.__TEST_START_TIME__ ? Date.now() - global.__TEST_START_TIME__ : 0;

  const summaryData = {
    testRunId: process.env.TEST_RUN_ID || Date.now().toString(),
    startTime,
    endTime: new Date().toISOString(),
    totalDuration,
    environment: process.env.NODE_ENV || 'test',
    baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
    apiBaseUrl: process.env.E2E_API_URL || 'http://localhost:8000'
  };

  // Read test results if available
  const resultsPath = 'tests/e2e/reports/test-results.json';
  if (fs.existsSync(resultsPath)) {
    const testResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    summaryData.testResults = {
      total: testResults.suites?.reduce((acc, suite) => acc + suite.specs?.length || 0, 0) || 0,
      passed: testResults.suites?.reduce((acc, suite) =>
        acc + suite.specs?.filter(spec => spec.ok)?.length || 0, 0) || 0,
      failed: testResults.suites?.reduce((acc, suite) =>
        acc + suite.specs?.filter(spec => !spec.ok)?.length || 0, 0) || 0
    };
  }

  // Write summary report
  const summaryPath = 'tests/e2e/reports/test-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));

  console.log('✅ Test summary report generated');
}

async function cleanupTestData() {
  console.log('Cleaning up test database...');

  // Implementation for cleaning up test data
  // This would typically involve:
  // - Truncating test tables
  // - Resetting sequences
  // - Cleaning up uploaded files

  return Promise.resolve();
}

async function archiveTestArtifacts() {
  console.log('Archiving test artifacts...');

  const artifactsDir = 'tests/e2e/artifacts';
  const archiveDir = `tests/e2e/archives/test-run-${Date.now()}`;

  if (fs.existsSync(artifactsDir)) {
    const artifacts = fs.readdirSync(artifactsDir);

    if (artifacts.length > 0) {
      // Create archive directory
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // Move artifacts to archive
      for (const artifact of artifacts) {
        const sourcePath = path.join(artifactsDir, artifact);
        const targetPath = path.join(archiveDir, artifact);

        if (fs.statSync(sourcePath).isDirectory()) {
          // Copy directory recursively
          copyDirectory(sourcePath, targetPath);
        } else {
          // Copy file
          fs.copyFileSync(sourcePath, targetPath);
        }
      }

      console.log(`📦 Test artifacts archived to: ${archiveDir}`);
    }
  }

  return Promise.resolve();
}

function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

async function sendTestNotifications() {
  // Send notifications about test results if configured
  if (process.env.E2E_NOTIFICATIONS_ENABLED === 'true') {
    console.log('📧 Sending test notifications...');

    // Implementation for sending notifications
    // This could include:
    // - Email notifications
    // - Slack messages
    // - Teams notifications
    // - Webhook calls
  }

  return Promise.resolve();
}

module.exports = globalTeardown;