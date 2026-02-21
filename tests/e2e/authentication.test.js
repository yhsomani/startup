/**
 * Authentication Flow E2E Tests
 * Tests user registration, login, logout, and password recovery
 */

const { test, expect } = require('./setup');

describe('Authentication Flow', () => {
  
  test('User Registration - Job Seeker', async ({ page }) => {
    console.log('🧪 Testing Job Seeker Registration');
    
    // Navigate to registration page
    await page.click('[data-testid="register-button"]');
    await expect(page).toHaveURL(/.*register/);
    
    // Select user type
    await page.click('[data-testid="user-type-jobseeker"]');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
    await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
    await page.fill('[data-testid="confirm-password-input"]', testUsers.jobSeeker.password);
    await page.fill('[data-testid="first-name-input"]', testUsers.jobSeeker.firstName);
    await page.fill('[data-testid="last-name-input"]', testUsers.jobSeeker.lastName);
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Verify successful registration
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Registration successful');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-profile"]')).toContainText(testUsers.jobSeeker.firstName);
    
    console.log('✅ Job Seeker Registration successful');
  });

  test('User Registration - Employer', async ({ page }) => {
    console.log('🧪 Testing Employer Registration');
    
    // Navigate to registration page
    await page.click('[data-testid="register-button"]');
    await expect(page).toHaveURL(/.*register/);
    
    // Select user type
    await page.click('[data-testid="user-type-employer"]');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', testUsers.employer.email);
    await page.fill('[data-testid="password-input"]', testUsers.employer.password);
    await page.fill('[data-testid="confirm-password-input"]', testUsers.employer.password);
    await page.fill('[data-testid="company-input"]', testUsers.employer.company);
    await page.fill('[data-testid="role-input"]', testUsers.employer.role);
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Verify successful registration
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify redirect to employer dashboard
    await expect(page).toHaveURL(/.*employer.*dashboard/);
    await expect(page.locator('[data-testid="company-name"]')).toContainText(testUsers.employer.company);
    
    console.log('✅ Employer Registration successful');
  });

  test('User Login', async ({ page }) => {
    console.log('🧪 Testing User Login');
    
    // Navigate to login page
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*login/);
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
    await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
    
    // Submit login
    await page.click('[data-testid="login-submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-profile"]')).toContainText(testUsers.jobSeeker.firstName);
    
    console.log('✅ User Login successful');
  });

  test('User Logout', async ({ page }) => {
    console.log('🧪 Testing User Logout');
    
    // First login
    await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
    await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Verify successful logout
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Verify user cannot access protected routes
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/.*login/);
    
    console.log('✅ User Logout successful');
  });

  test('Password Recovery', async ({ page }) => {
    console.log('🧪 Testing Password Recovery');
    
    // Navigate to login page
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*login/);
    
    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]');
    await expect(page).toHaveURL(/.*forgot-password/);
    
    // Fill recovery form
    await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
    await page.click('[data-testid="recover-password-submit"]');
    
    // Verify recovery email sent message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Recovery email sent');
    
    console.log('✅ Password Recovery successful');
  });

  test('Invalid Login Attempts', async ({ page }) => {
    console.log('🧪 Testing Invalid Login Attempts');
    
    // Navigate to login page
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*login/);
    
    // Test invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'somepassword');
    await page.click('[data-testid="login-submit"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    
    // Test wrong password
    await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');
    
    console.log('✅ Invalid Login Attempts handled correctly');
  });

  test('Session Management', async ({ page }) => {
    console.log('🧪 Testing Session Management');
    
    // Login
    await page.fill('[data-testid="email-input"]', testUsers.jobSeeker.email);
    await page.fill('[data-testid="password-input"]', testUsers.jobSeeker.password);
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Get session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === 'talentsphere-session');
    expect(sessionCookie).toBeTruthy();
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/.*login/);
    
    console.log('✅ Session Management working correctly');
  });

});