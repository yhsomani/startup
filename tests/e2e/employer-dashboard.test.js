/**
 * Employer Dashboard E2E Tests
 * Tests job posting, candidate management, and analytics
 */

const { test, expect, TestHelpers, testUsers, testJobs, BASE_URL } = require('./setup');

test.describe('Employer Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    // Login as employer before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', testUsers.employer.email);
    await page.fill('[data-testid="password-input"]', testUsers.employer.password);
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/.*employer.*dashboard/);
  });

  test('Dashboard Overview', async ({ page }) => {
    console.log('🧪 Testing Employer Dashboard Overview');

    // Verify dashboard components
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-jobs-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-applications-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-applications-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();

    // Verify navigation menu
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-jobs"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-candidates"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();

    console.log('✅ Employer Dashboard Overview working correctly');
  });

  test('Create Job Posting', async ({ page }) => {
    console.log('🧪 Testing Create Job Posting');

    // Navigate to job creation page
    await page.click('[data-testid="post-job-button"]');
    await expect(page).toHaveURL(/.*jobs\/.*/);

    // Fill job details
    await page.fill('[data-testid="job-title"]', testJobs.softwareEngineer.title);
    await page.fill('[data-testid="job-description"]', testJobs.softwareEngineer.description);
    await page.selectOption('[data-testid="job-category"]', 'Engineering');
    await page.selectOption('[data-testid="job-type"]', 'Full-time');
    await page.selectOption('[data-testid="experience-level"]', 'Senior');
    await page.fill('[data-testid="job-location"]', testJobs.softwareEngineer.location);
    await page.fill('[data-testid="salary-range"]', testJobs.softwareEngineer.salary);

    // Set job requirements
    await page.click('[data-testid="add-requirement"]');
    await page.fill('[data-testid="requirement-0"]', '5+ years of software development experience');
    await page.click('[data-testid="add-requirement"]');
    await page.fill('[data-testid="requirement-1"]', 'Proficiency in JavaScript and React');

    // Set benefits
    await page.click('[data-testid="add-benefit"]');
    await page.fill('[data-testid="benefit-0"]', 'Health insurance');
    await page.click('[data-testid="add-benefit"]');
    await page.fill('[data-testid="benefit-1"]', '401(k) matching');

    // Publish job
    await page.click('[data-testid="publish-job"]');

    // Wait for API response
    await TestHelpers.waitForAPIResponse(page, '/api/jobs');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Job posted successfully');

    // Verify redirect to job management page
    await expect(page).toHaveURL(/.*jobs\/manage/);

    // Verify new job appears in list
    await expect(page.locator('[data-testid="job-card"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('[data-testid="job-title"]')).toContainText(testJobs.softwareEngineer.title);

    console.log('✅ Create Job Posting working correctly');
  });

  test('Edit Job Posting', async ({ page }) => {
    console.log('🧪 Testing Edit Job Posting');

    // Navigate to job management
    await page.click('[data-testid="nav-jobs"]');
    await expect(page).toHaveURL(/.*jobs\/manage/);

    // Click edit on first job
    await page.click('[data-testid="job-card"]:first-child [data-testid="edit-button"]');
    await expect(page).toHaveURL(/.*jobs\/edit\/.*/);

    // Modify job details
    await page.fill('[data-testid="job-title"]', 'Senior Software Engineer (Remote)');
    await page.fill('[data-testid="salary-range"]', '$130,000 - $190,000');

    // Save changes
    await page.click('[data-testid="save-changes"]');

    // Wait for API response
    await TestHelpers.waitForAPIResponse(page, '/api/jobs');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Verify changes are reflected
    await expect(page.locator('[data-testid="job-title"]')).toHaveValue('Senior Software Engineer (Remote)');
    await expect(page.locator('[data-testid="salary-range"]')).toHaveValue('$130,000 - $190,000');

    console.log('✅ Edit Job Posting working correctly');
  });

  test('Candidate Review and Management', async ({ page }) => {
    console.log('🧪 Testing Candidate Review and Management');

    // Navigate to candidates page
    await page.click('[data-testid="nav-candidates"]');
    await expect(page).toHaveURL(/.*candidates/);

    // Verify applications are listed
    await expect(page.locator('[data-testid="application-card"]')).toHaveCount.greaterThan(0);

    // Click on first application
    await page.click('[data-testid="application-card"]:first-child');

    // Verify candidate details
    await expect(page.locator('[data-testid="candidate-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="candidate-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="candidate-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="resume-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="cover-letter"]')).toBeVisible();

    // Test candidate status update
    await page.selectOption('[data-testid="application-status"]', 'Interview');

    // Add interview notes
    await page.fill('[data-testid="interview-notes"]', 'Strong technical skills, good cultural fit');

    // Save status update
    await page.click('[data-testid="update-status"]');

    // Wait for API response
    await TestHelpers.waitForAPIResponse(page, '/api/applications');

    // Verify status is updated
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Interview');

    console.log('✅ Candidate Review and Management working correctly');
  });

  test('Candidate Search and Filtering', async ({ page }) => {
    console.log('🧪 Testing Candidate Search and Filtering');

    // Navigate to candidates page
    await page.click('[data-testid="nav-candidates"]');
    await expect(page).toHaveURL(/.*candidates/);

    // Test search by skills
    await page.fill('[data-testid="skills-search"]', 'JavaScript');
    await page.click('[data-testid="search-candidates"]');

    // Wait for search results
    await page.waitForSelector('[data-testid="application-card"]');

    // Verify search results
    const applications = page.locator('[data-testid="application-card"]');
    const count = await applications.count();
    expect(count).toBeGreaterThan(0);

    // Test status filter
    await page.selectOption('[data-testid="status-filter"]', 'Under Review');
    await page.click('[data-testid="apply-filters"]');

    // Verify filter is applied
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-status"]')).toContainText('Under Review');

    console.log('✅ Candidate Search and Filtering working correctly');
  });

  test('Analytics Dashboard', async ({ page }) => {
    console.log('🧪 Testing Analytics Dashboard');

    // Navigate to analytics page
    await page.click('[data-testid="nav-analytics"]');
    await expect(page).toHaveURL(/.*analytics/);

    // Verify analytics sections
    await expect(page.locator('[data-testid="job-performance-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-funnel"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-to-hire"]')).toBeVisible();
    await expect(page.locator('[data-testid="source-analytics"]')).toBeVisible();

    // Verify charts are rendered
    await expect(page.locator('[data-testid="applications-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="conversion-funnel-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="source-distribution-chart"]')).toBeVisible();

    // Test date range filter
    await page.click('[data-testid="date-range-filter"]');
    await page.click('[data-testid="last-30-days"]');
    await page.click('[data-testid="apply-date-filter"]');

    // Wait for data refresh
    await page.waitForLoadState('networkidle');

    // Verify data is updated
    await expect(page.locator('[data-testid="date-range-display"]')).toContainText('Last 30 days');

    console.log('✅ Analytics Dashboard working correctly');
  });

  test('Interview Scheduling', async ({ page }) => {
    console.log('🧪 Testing Interview Scheduling');

    // Navigate to candidates page
    await page.click('[data-testid="nav-candidates"]');
    await expect(page).toHaveURL(/.*candidates/);

    // Click on first application
    await page.click('[data-testid="application-card"]:first-child');

    // Schedule interview
    await page.click('[data-testid="schedule-interview"]');
    await expect(page.locator('[data-testid="interview-modal"]')).toBeVisible();

    // Fill interview details
    await page.selectOption('[data-testid="interview-type"]', 'Video Call');
    await page.fill('[data-testid="interview-date"]', '2024-02-15');
    await page.fill('[data-testid="interview-time"]', '14:00');
    await page.fill('[data-testid="interview-duration"]', '60');
    await page.fill('[data-testid="interview-notes"]', 'Technical interview with engineering team');

    // Send invitation
    await page.click('[data-testid="send-invitation"]');

    // Wait for API response
    await TestHelpers.waitForAPIResponse(page, '/api/interviews');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Interview invitation sent');

    // Verify interview appears in schedule
    await page.click('[data-testid="interview-schedule"]');
    await expect(page.locator('[data-testid="scheduled-interview"]')).toHaveCount.greaterThan(0);

    console.log('✅ Interview Scheduling working correctly');
  });

  test('Bulk Candidate Actions', async ({ page }) => {
    console.log('🧪 Testing Bulk Candidate Actions');

    // Navigate to candidates page
    await page.click('[data-testid="nav-candidates"]');
    await expect(page).toHaveURL(/.*candidates/);

    // Select multiple candidates
    await page.check('[data-testid="application-card"]:first-child [data-testid="select-candidate"]');
    await page.check('[data-testid="application-card"]:nth-child(2) [data-testid="select-candidate"]');

    // Verify bulk actions appear
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

    // Test bulk status update
    await page.selectOption('[data-testid="bulk-status"]', 'Rejected');
    await page.click('[data-testid="apply-bulk-action"]');

    // Confirm action
    await page.click('[data-testid="confirm-bulk-action"]');

    // Wait for API response
    await TestHelpers.waitForAPIResponse(page, '/api/applications/bulk');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Verify status updates
    await page.reload();
    await expect(page.locator('[data-testid="application-card"]:first-child [data-testid="status-badge"]')).toContainText('Rejected');

    console.log('✅ Bulk Candidate Actions working correctly');
  });

});