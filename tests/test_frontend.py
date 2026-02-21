import pytest
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class TestUserInterface:
    """Frontend UI tests"""
    
    @pytest.fixture(scope="class")
    def driver(self):
        """Setup WebDriver for testing"""
        options = Options()
        options.add_argument('--headless')  # Run in headless mode for CI
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        
        driver = webdriver.Chrome(options=options)
        driver.implicitly_wait(10)
        
        yield driver
        
        driver.quit()
    
    def test_page_loads_successfully(self, driver):
        """Test that main page loads successfully"""
        driver.get("http://localhost:3000")
        
        # Wait for page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        
        # Check page title
        assert "TalentSphere" in driver.title
        
        # Check main navigation exists
        nav = driver.find_element(By.TAG_NAME, "nav")
        assert nav.is_displayed()
    
    def test_user_registration_flow(self, driver):
        """Test complete user registration flow"""
        driver.get("http://localhost:3000")
        
        # Find and click sign up button
        signup_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Sign Up"))
        )
        signup_button.click()
        
        # Fill out registration form
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        email_input.send_keys("test@example.com")
        
        password_input = driver.find_element(By.NAME, "password")
        password_input.send_keys("SecurePassword123!")
        
        role_select = driver.find_element(By.NAME, "role")
        role_select.send_keys("STUDENT")
        
        # Submit form
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_button.click()
        
        # Wait for success message or redirect
        WebDriverWait(driver, 10).until(
            lambda d: "Dashboard" in d.title or d.current_url.endswith("/dashboard")
        )
        
        assert "Dashboard" in driver.title or "/dashboard" in driver.current_url
    
    def test_user_login_flow(self, driver):
        """Test complete user login flow"""
        driver.get("http://localhost:3000")
        
        # Find and click sign in button
        login_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Sign In"))
        )
        login_button.click()
        
        # Fill out login form
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        email_input.send_keys("test@example.com")
        
        password_input = driver.find_element(By.NAME, "password")
        password_input.send_keys("SecurePassword123!")
        
        # Submit form
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_button.click()
        
        # Wait for dashboard redirect
        WebDriverWait(driver, 10).until(
            lambda d: "Dashboard" in d.title
        )
        
        assert "Dashboard" in driver.title
    
    def test_course_catalog_functionality(self, driver):
        """Test course catalog features"""
        # First login
        driver.get("http://localhost:3000")
        self._login(driver, "test@example.com", "SecurePassword123!")
        
        # Navigate to courses
        courses_link = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Courses"))
        )
        courses_link.click()
        
        # Wait for courses to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "course-card"))
        )
        
        # Test search functionality
        search_input = driver.find_element(By.NAME, "search")
        search_input.send_keys("Python")
        search_input.send_keys("\n")  # Submit search
        
        # Wait for search results
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "course-card"))
        )
        
        course_cards = driver.find_elements(By.CLASS_NAME, "course-card")
        assert len(course_cards) > 0
        
        # Verify search results contain "Python"
        for card in course_cards:
            if "Python" in card.text:
                break
        else:
            assert False, "No course cards with 'Python' found in search results"
    
    def test_challenge_functionality(self, driver):
        """Test challenge system"""
        # Login first
        driver.get("http://localhost:3000")
        self._login(driver, "test@example.com", "SecurePassword123!")
        
        # Navigate to challenges
        challenges_link = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Challenges"))
        )
        challenges_link.click()
        
        # Wait for challenges to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "challenge-card"))
        )
        
        # Click on first challenge
        first_challenge = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CLASS_NAME, "challenge-card"))
        )
        first_challenge.click()
        
        # Wait for challenge page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "textarea"))
        )
        
        # Verify code editor is present
        code_editor = driver.find_element(By.TAG_NAME, "textarea")
        assert code_editor.is_displayed()
        
        # Test code submission
        code_editor.send_keys("def test():\n    return 'Hello, World!'")
        
        submit_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Submit')]")
        submit_button.click()
        
        # Wait for results (success or error)
        WebDriverWait(driver, 10).until(
            lambda d: "Results:" in d.page_source or "Error:" in d.page_source
        )
        
        assert "Results:" in driver.page_source or "Error:" in driver.page_source
    
    def test_responsive_design(self, driver):
        """Test responsive design"""
        driver.get("http://localhost:3000")
        
        # Test mobile viewport
        driver.set_window_size(375, 812)
        mobile_nav = driver.find_element(By.TAG_NAME, "nav")
        assert mobile_nav.is_displayed()
        
        # Test tablet viewport
        driver.set_window_size(768, 1024)
        tablet_nav = driver.find_element(By.TAG_NAME, "nav")
        assert tablet_nav.is_displayed()
        
        # Test desktop viewport
        driver.set_window_size(1920, 1080)
        desktop_nav = driver.find_element(By.TAG_NAME, "nav")
        assert desktop_nav.is_displayed()
    
    def test_accessibility_features(self, driver):
        """Test accessibility features"""
        driver.get("http://localhost:3000")
        
        # Check for proper heading structure
        h1 = driver.find_element(By.TAG_NAME, "h1")
        assert h1.is_displayed()
        
        # Check for alt text on images
        images = driver.find_elements(By.TAG_NAME, "img")
        for img in images:
            alt_text = img.get_attribute("alt")
            assert alt_text != "", "Image missing alt text"
        
        # Check form labels
        labels = driver.find_elements(By.TAG_NAME, "label")
        for label in labels:
            for_input = label.get_attribute("for")
            if for_input:
                input_element = driver.find_element(By.ID, for_input)
                assert input_element.is_displayed()
    
    def _login(self, driver, email, password):
        """Helper method for login"""
        # Navigate to login page
        login_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Sign In"))
        )
        login_button.click()
        
        # Fill in login form
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "email"))
        )
        email_input.send_keys(email)
        
        password_input = driver.find_element(By.NAME, "password")
        password_input.send_keys(password)
        
        # Submit form
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        submit_button.click()
        
        # Wait for dashboard redirect
        WebDriverWait(driver, 10).until(
            lambda d: "Dashboard" in d.title
        )

class TestPerformanceMetrics:
    """Frontend performance tests"""
    
    def test_page_load_time(self, driver):
        """Test page load performance"""
        import time
        
        start_time = time.time()
        driver.get("http://localhost:3000")
        
        # Wait for page to fully load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        
        load_time = time.time() - start_time
        
        # Page should load within 3 seconds
        assert load_time < 3.0, f"Page load time too slow: {load_time}s"
    
    def test_javascript_errors(self, driver):
        """Check for JavaScript errors"""
        driver.get("http://localhost:3000")
        
        # Enable JavaScript logging
        driver.execute_script("window.console.error = function(message) { window._jsErrors = window._jsErrors || []; window._jsErrors.push(message); console.error(message); };")
        
        # Navigate through pages
        pages = ["/", "/courses", "/challenges", "/profile"]
        for page in pages:
            driver.get(f"http://localhost:3000{page}")
            time.sleep(2)  # Allow page to load
        
        # Check for JavaScript errors
        js_errors = driver.execute_script("return window._jsErrors || [];")
        
        # Should have no JavaScript errors
        assert len(js_errors) == 0, f"JavaScript errors found: {js_errors}"

if __name__ == '__main__':
    pytest.main([__file__, "-v"])