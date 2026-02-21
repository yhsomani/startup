/**
 * Job Application Flow E2E Tests
 * Tests job search, application, and status tracking
 */

const { test, expect, TestHelpers } = require('./setup');

describe('Job Application Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as job seeker before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
    await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Job Search and Filtering', async ({ page }) => {
    console.log('🧪 Testing Job Search and Filtering');
    
    // Navigate to jobs page
    await page.click('[data-testid="jobs-link"]');
    await expect(page).toHaveURL(/.*jobs/);
    
    // Verify job listings are displayed
    await expect(page.locator('[data-testid="job-listing"]')).toHaveCount.greaterThan(0);
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'Software Engineer');
    await page.click('[data-testid="search-button"]');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="job-listing"]');
    
    // Verify search results
    const jobListings = page.locator('[data-testid="job-listing"]');
    const count = await jobListings.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify search results contain search term
    for (let i = 0; i < Math.min(count, 3); i++) {
      const jobTitle = await jobListings.nth(i).locator('[data-testid="job-title"]').textContent();
      expect(jobTitle.toLowerCase()).toContain('software engineer'.toLowerCase());
    }
    
    console.log('✅ Job Search and Filtering working correctly');
  });

  test('Advanced Job Filtering', async ({ page }) => {
    console.log('🧪 Testing Advanced Job Filtering');
    
    // Navigate to jobs page
    await page.click('[data-testid="jobs-link"]');
    await expect(page).toHaveURL(/.*jobs/);
    
    // Open advanced filters
    await page.click('[data-testid="advanced-filters"]');
    
    // Set location filter
    await page.selectOption('[data-testid="location-filter"]', 'San Francisco, CA');
    
    // Set job type filter
    await page.selectOption('[data-testid="job-type-filter"]', 'Full-time');
    
    // Set salary range filter
    await page.fill('[data-testid="salary-min"]', '100000');
    await page.fill('[data-testid="salary-max"]', '200000');
    
    // Apply filters
    await page.click('[data-testid="apply-filters"]');
    
    // Wait for filtered results
    await page.waitForSelector('[data-testid="job-listing"]');
    
    // Verify filters are applied
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-location"]')).toContainText('San Francisco');
    await expect(page.locator('[data-testid="filter-job-type"]')).toContainText('Full-time');
    
    console.log('✅ Advanced Job Filtering working correctly');
  });

  test('Job Detail View', async ({ page }) => {
    console.log('🧪 Testing Job Detail View');
    
    // Navigate to jobs page
    await page.click('[data-testid="jobs-link"]');
    await expect(page).toHaveURL(/.*jobs/);
    
    // Click on first job listing
    await page.click('[data-testid="job-listing"]:first-child [data-testid="job-title"]');
    
    // Wait for job detail page
    await expect(page).toHaveURL(/.*jobs\/.*/);
    
    // Verify job details are displayed
    await expect(page.locator('[data-testid="job-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-requirements"]')).toBeVisible();
    await expect(page.locator('[data-testid="company-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="apply-button"]')).toBeVisible();
    
    console.log('✅ Job Detail View working correctly');
  });

  test('Job Application Process', async ({ page }) => {
    console.log('🧪 Testing Job Application Process');
    
    // Navigate to jobs page
    await page.click('[data-testid="jobs-link"]');
    await expect(page).toHaveURL(/.*jobs/);
    
    // Click on first job listing
    await page.click('[data-testid="job-listing"]:first-child [data-testid="job-title"]');
    await expect(page).toHaveURL(/.*jobs\\/.*/);
    
    // Click apply button
    await page.click('[data-testid="apply-button"]');
    
    // Wait for application form
    await expect(page.locator('[data-testid="application-form"]')).toBeVisible();
    
    // Fill application form
    await page.fill('[data-testid="cover-letter"]', 'I am very interested in this position...');
    
    // Upload resume (mock upload)
    const fileInput = page.locator('[data-testid="resume-upload"]');
    await fileInput.setInputFiles('tests/fixtures/sample-resume.pdf');
    
    // Submit application
    await page.click('[data-testid="submit-application"]');
    
    // Wait for API response
    await TestHelpers.waitForAPIResponse(page, '/api/applications');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Application submitted successfully');
    
    // Verify application status
    await expect(page.locator('[data-testid="application-status"]')).toContainText('Under Review');
    
    console.log('✅ Job Application Process working correctly');
  });

  test('Application Status Tracking', async ({ page }) => {
    console.log('🧪 Testing Application Status Tracking');
    
    // Navigate to applications page
    await page.click('[data-testid="applications-link"]');
    await expect(page).toHaveURL(/.*applications/);
    
    // Verify applications are listed
    await expect(page.locator('[data-testid="application-card"]')).toHaveCount.greaterThan(0);
    
    // Click on first application
    await page.click('[data-testid="application-card"]:first-child');
    
    // Verify application details
    await expect(page.locator('[data-testid="application-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="cover-letter-preview"]')).toBeVisible();
    
    // Verify status history
    await expect(page.locator('[data-testid="status-history"]')).toBeVisible();
    
    console.log('✅ Application Status Tracking working correctly');
  });

  test('Save Jobs for Later', async ({ page }) => {
    console.log('🧪 Testing Save Jobs for Later');
    
    // Navigate to jobs page
    await page.click('[data-testid="jobs-link"]');
    await expect(page).toHaveURL(/.*jobs/);
    
    // Find and save first job
    const firstJob = page.locator('[data-testid="job-listing"]:first-child');
    const saveButton = firstJob.locator('[data-testid="save-job-button"]');
    
    // Verify initial state (not saved)
    await expect(saveButton).toContainText('Save Job');
    
    // Save job
    await saveButton.click();
    
    // Wait for API response
    await TestHelpers.waitForAPIResponse(page, '/api/saved-jobs');
    
    // Verify saved state
    await expect(saveButton).toContainText('Saved');
    
    // Navigate to saved jobs
    await page.click('[data-testid="saved-jobs-link"]');
    await expect(page).toHaveURL(/.*saved-jobs/);
    
    // Verify saved job appears
    await expect(page.locator('[data-testid="saved-job-card"]')).toHaveCount(1);
    
    console.log('✅ Save Jobs for Later working correctly');
  });

  test('Job Recommendations', async ({ page }) => {
    console.log('🧪 Testing Job Recommendations');
    
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Scroll to recommendations section
    await page.locator('[data-testid="job-recommendations"]').scrollIntoViewIfNeeded();
    
    // Verify recommendations are displayed
    await expect(page.locator('[data-testid="recommendation-card"]')).toHaveCount.greaterThan(0);
    
    // Click on recommendation
    await page.click('[data-testid="recommendation-card"]:first-child');
    
    // Verify job detail page opens
    await expect(page).toHaveURL(/.*jobs\\/.*/);
    await expect(page.locator('[data-testid="job-title"]')).toBeVisible();
    
    console.log('✅ Job Recommendations working correctly');
  });

});