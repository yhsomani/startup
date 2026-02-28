/**
 * Performance and Load Testing E2E Tests
 * Tests system performance under various conditions
 */

const { test, expect, TestHelpers, testUsers, BASE_URL } = require("./setup");

test.describe("Performance and Load Testing", () => {
    test("Page Load Performance - Dashboard", async ({ page }) => {
        console.log("🧪 Testing Dashboard Page Load Performance");

        // Monitor network activity
        const responses = [];
        page.on("response", response => {
            const timing = response.timing ? response.timing() : null;
            responses.push({
                url: response.url(),
                status: response.status(),
                timing: timing,
            });
        });

        // Navigate to dashboard (login first)
        await page.goto(`${BASE_URL}/login`);
        await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
        await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
        await page.click('[data-testid="login-submit"]');

        // Wait for dashboard to fully load
        await page.waitForLoadState("networkidle");

        // Analyze performance metrics
        const loadTime = Date.now() - page.context().startTime;
        console.log(`Dashboard load time: ${loadTime}ms`);

        // Verify load time is acceptable (< 3 seconds)
        expect(loadTime).toBeLessThan(3000);

        // Verify critical resources loaded successfully
        const failedResponses = responses.filter(r => r.status >= 400);
        expect(failedResponses.length).toBe(0);

        console.log("✅ Dashboard Page Load Performance acceptable");
    });

    test("Job Search Performance", async ({ page }) => {
        console.log("🧪 Testing Job Search Performance");

        // Login and navigate to jobs
        await page.goto(`${BASE_URL}/login`);
        await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
        await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
        await page.click('[data-testid="login-submit"]');
        await page.click('[data-testid="jobs-link"]');

        // Measure search response time
        const searchStart = Date.now();
        await page.fill('[data-testid="search-input"]', "Software Engineer");
        await page.click('[data-testid="search-button"]');

        // Wait for search results
        await page.waitForSelector('[data-testid="job-listing"]');
        const searchTime = Date.now() - searchStart;

        console.log(`Job search time: ${searchTime}ms`);

        // Verify search time is acceptable (< 2 seconds)
        expect(searchTime).toBeLessThan(2000);

        // Verify search results are loaded
        await expect(page.locator('[data-testid="job-listing"]')).toHaveCount.greaterThan(0);

        console.log("✅ Job Search Performance acceptable");
    });

    test("Large List Performance - Applications", async ({ page }) => {
        console.log("🧪 Testing Large List Performance");

        // Login as employer
        await page.goto(`${BASE_URL}/login`);
        await page.fill('[data-testid="email-input"]', testUsers.employer.email);
        await page.fill('[data-testid="password-input"]', testUsers.employer.password);
        await page.click('[data-testid="login-submit"]');

        // Navigate to candidates page
        await page.click('[data-testid="nav-candidates"]');

        // Measure list rendering time
        const renderStart = Date.now();
        await page.waitForSelector('[data-testid="application-card"]');
        const renderTime = Date.now() - renderStart;

        console.log(`Applications list render time: ${renderTime}ms`);

        // Verify render time is acceptable (< 2 seconds)
        expect(renderTime).toBeLessThan(2000);

        // Test pagination performance
        if (await page.locator('[data-testid="next-page"]').isVisible()) {
            const paginationStart = Date.now();
            await page.click('[data-testid="next-page"]');
            await page.waitForSelector('[data-testid="application-card"]');
            const paginationTime = Date.now() - paginationStart;

            console.log(`Pagination time: ${paginationTime}ms`);
            expect(paginationTime).toBeLessThan(1500);
        }

        console.log("✅ Large List Performance acceptable");
    });

    test("File Upload Performance", async ({ page }) => {
        console.log("🧪 Testing File Upload Performance");

        // Login as job seeker
        await page.goto(`${BASE_URL}/login`);
        await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
        await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
        await page.click('[data-testid="login-submit"]');

        // Navigate to profile
        await page.click('[data-testid="profile-link"]');

        // Test file upload performance
        const uploadStart = Date.now();
        const fileInput = page.locator('[data-testid="resume-upload"]');

        // Create a test file if it doesn't exist
        await page.evaluate(() => {
            const testContent = "Test resume content for performance testing";
            const blob = new Blob([testContent], { type: "text/plain" });
            const file = new File([blob], "test-resume.txt", { type: "text/plain" });

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const input = document.querySelector('[data-testid="resume-upload"]');
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });

        // Wait for upload completion
        await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({
            timeout: 10000,
        });
        const uploadTime = Date.now() - uploadStart;

        console.log(`File upload time: ${uploadTime}ms`);

        // Verify upload time is acceptable (< 10 seconds)
        expect(uploadTime).toBeLessThan(10000);

        console.log("✅ File Upload Performance acceptable");
    });

    test("Memory Usage During Navigation", async ({ page }) => {
        console.log("🧪 Testing Memory Usage During Navigation");

        // Login
        await page.goto(`${BASE_URL}/login`);
        await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
        await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
        await page.click('[data-testid="login-submit"]');

        // Get initial memory usage
        const initialMemory = await page.evaluate(() => {
            return performance.memory ? performance.memory.usedJSHeapSize : 0;
        });

        // Navigate through multiple pages
        const pages = [
            () => page.click('[data-testid="jobs-link"]'),
            () => page.click('[data-testid="applications-link"]'),
            () => page.click('[data-testid="profile-link"]'),
            () => page.click('[data-testid="saved-jobs-link"]'),
            () => page.goto(`${BASE_URL}/dashboard`),
        ];

        for (const navigation of pages) {
            await navigation();
            await page.waitForLoadState("networkidle");
        }

        // Check final memory usage
        const finalMemory = await page.evaluate(() => {
            return performance.memory ? performance.memory.usedJSHeapSize : 0;
        });

        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

        console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)} MB`);

        // Verify memory increase is reasonable (< 50 MB)
        expect(memoryIncreaseMB).toBeLessThan(50);

        console.log("✅ Memory Usage During Navigation acceptable");
    });

    test("Concurrent User Simulation", async ({ browser }) => {
        console.log("🧪 Testing Concurrent User Simulation");

        // Create multiple browser contexts to simulate concurrent users
        const userPages = [];
        const startTime = Date.now();

        for (let i = 0; i < 3; i++) {
            const userContext = await browser.newContext();
            const userPage = await userContext.newPage();
            userPages.push(userPage);

            // Simulate user login and navigation
            await userPage.goto(`${BASE_URL}/login`);
            await userPage.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
            await userPage.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
            await userPage.click('[data-testid="login-submit"]');
            await userPage.click('[data-testid="jobs-link"]');
        }

        // Wait for all pages to complete navigation
        for (const page of userPages) {
            await page.waitForSelector('[data-testid="job-listing"]');
        }

        const totalTime = Date.now() - startTime;
        console.log(`Concurrent user navigation time: ${totalTime}ms`);

        // Verify system handles concurrent users gracefully (< 5 seconds)
        expect(totalTime).toBeLessThan(5000);

        // Close contexts
        for (const page of userPages) {
            await page.context().close();
        }

        console.log("✅ Concurrent User Simulation successful");
    });

    test("Error Handling Performance", async ({ page }) => {
        console.log("🧪 Testing Error Handling Performance");

        // Navigate to a non-existent page
        const errorStartTime = Date.now();
        await page.goto(`${BASE_URL}/non-existent-page`);

        // Wait for error page to load
        await expect(page.locator('[data-testid="error-page"]')).toBeVisible();
        const errorLoadTime = Date.now() - errorStartTime;

        console.log(`Error page load time: ${errorLoadTime}ms`);

        // Verify error page loads quickly (< 2 seconds)
        expect(errorLoadTime).toBeLessThan(2000);

        // Verify error page contains helpful information
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="home-link"]')).toBeVisible();

        console.log("✅ Error Handling Performance acceptable");
    });

    test("Database Query Performance", async ({ page }) => {
        console.log("🧪 Testing Database Query Performance");

        // Login as employer
        await page.goto(`${BASE_URL}/login`);
        await page.fill('[data-testid="email-input"]', testUsers.employer.email);
        await page.fill('[data-testid="password-input"]', testUsers.employer.password);
        await page.click('[data-testid="login-submit"]');

        // Navigate to analytics (requires database queries)
        const analyticsStartTime = Date.now();
        await page.click('[data-testid="nav-analytics"]');

        // Wait for analytics to load
        await expect(page.locator('[data-testid="job-performance-metrics"]')).toBeVisible();
        const analyticsLoadTime = Date.now() - analyticsStartTime;

        console.log(`Analytics page load time: ${analyticsLoadTime}ms`);

        // Verify analytics load time is acceptable (< 5 seconds for complex queries)
        expect(analyticsLoadTime).toBeLessThan(5000);

        // Verify charts are rendered
        await expect(page.locator('[data-testid="applications-chart"]')).toBeVisible();

        console.log("✅ Database Query Performance acceptable");
    });
});
