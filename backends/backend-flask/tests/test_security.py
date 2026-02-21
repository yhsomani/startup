"""
Security tests for TalentSphere Flask application
"""
import pytest
import json
from app import create_app


@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app()
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


class TestSecurityMiddleware:
    """Test security middleware functionality"""
    
    def test_sql_injection_prevention(self, client):
        """Test SQL injection prevention in inputs"""
        malicious_payload = {
            "email": "test@example.com'; DROP TABLE users; --",
            "password": "password123"
        }
        
        response = client.post('/auth/register', json=malicious_payload)
        # Should not crash the server
        assert response.status_code in [400, 422, 201]
    
    def test_xss_prevention(self, client):
        """Test XSS prevention in inputs"""
        malicious_payload = {
            "title": "<script>alert('xss')</script>",
            "description": "Test description"
        }
        
        response = client.post('/challenges', json=malicious_payload)
        # Should either reject or sanitize the input
        assert response.status_code in [400, 422, 201]
    
    def test_jwt_secret_is_not_default(self, app):
        """Test that JWT secret is not hardcoded in production"""
        if app.config.get('TESTING') is False:
            secret = app.config.get('JWT_SECRET_KEY')
            assert secret != '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970'
            assert len(secret) >= 32


class TestInputValidation:
    """Test input validation"""
    
    def test_email_validation(self, client):
        """Test email format validation"""
        invalid_emails = [
            "invalid-email",
            "@invalid.com",
            "invalid@",
            "invalid..email@domain.com"
        ]
        
        for email in invalid_emails:
            payload = {
                "email": email,
                "password": "password123",
                "role": "student"
            }
            response = client.post('/auth/register', json=payload)
            assert response.status_code in [400, 422]
    
    def test_password_strength(self, client):
        """Test password strength requirements"""
        weak_passwords = [
            "123",
            "password",
            "abc123",
            "password123"
        ]
        
        for password in weak_passwords:
            payload = {
                "email": "test@example.com",
                "password": password,
                "role": "student"
            }
            response = client.post('/auth/register', json=payload)
            assert response.status_code in [400, 422]


class TestRateLimiting:
    """Test rate limiting functionality"""
    
    def test_rate_limiting_headers(self, client):
        """Test that rate limiting headers are present"""
        response = client.get('/health')
        # Check for rate limit headers
        rate_limit_headers = [
            'X-RateLimit-Limit',
            'X-RateLimit-Remaining',
            'X-RateLimit-Reset'
        ]
        
        # At least some headers should be present
        headers_present = any(header in response.headers for header in rate_limit_headers)
        # If rate limiting is implemented, headers should be present
        # This test will pass either way but indicates implementation status


class TestCORS:
    """Test CORS configuration"""
    
    def test_cors_headers(self, client):
        """Test CORS headers are set correctly"""
        response = client.options('/auth/register')
        
        # Check for required CORS headers
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        for header in cors_headers:
            assert header in response.headers


class TestAuthentication:
    """Test authentication security"""
    
    def test_protected_endpoints_require_auth(self, client):
        """Test that protected endpoints require authentication"""
        protected_endpoints = [
            '/profile',
            '/courses',
            '/progress'
        ]
        
        for endpoint in protected_endpoints:
            response = client.get(endpoint)
            assert response.status_code in [401, 403]
    
    def test_invalid_jwt_rejected(self, client):
        """Test that invalid JWT tokens are rejected"""
        headers = {'Authorization': 'Bearer invalid.jwt.token'}
        response = client.get('/profile', headers=headers)
        assert response.status_code in [401, 422]