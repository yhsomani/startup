import pytest
import json
import tempfile
import os
from datetime import datetime
from app import create_app
from app.models import User, Course, Challenge
from app.extensions import db

class TestAuthentication:
    """Authentication system tests"""
    
    def test_user_registration_success(self, client):
        """Test successful user registration"""
        user_data = {
            'email': 'test@example.com',
            'password': 'SecurePassword123!',
            'role': 'STUDENT'
        }
        
        response = client.post('/api/v1/auth/register', json=user_data)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] == True
        assert 'token' in data['data']
        assert 'user' in data['data']
    
    def test_user_registration_duplicate_email(self, client):
        """Test registration with duplicate email"""
        # Create user first
        User(email='existing@example.com', password_hash='test').save()
        db.session.commit()
        
        user_data = {
            'email': 'existing@example.com',
            'password': 'SecurePassword123!',
            'role': 'STUDENT'
        }
        
        response = client.post('/api/v1/auth/register', json=user_data)
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] == False
        assert 'EMAIL_EXISTS' in data['error']['code']
    
    def test_user_login_success(self, client):
        """Test successful user login"""
        # Create test user
        user = User(
            email='login@example.com',
            password_hash='hashed_password',
            role='STUDENT'
        )
        user.save()
        db.session.commit()
        
        login_data = {
            'email': 'login@example.com',
            'password': 'SecurePassword123!'
        }
        
        response = client.post('/api/v1/auth/login', json=login_data)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert 'token' in data['data']
        assert 'refreshToken' in data['data']
    
    def test_user_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        login_data = {
            'email': 'invalid@example.com',
            'password': 'wrongpassword'
        }
        
        response = client.post('/api/v1/auth/login', json=login_data)
        
        assert response.status_code == 401
        data = response.get_json()
        assert data['success'] == False
        assert 'INVALID_CREDENTIALS' in data['error']['code']
    
    def test_rate_limiting(self, client):
        """Test rate limiting functionality"""
        # Make multiple rapid requests
        for _ in range(10):
            client.post('/api/v1/auth/login', json={
                'email': 'test@example.com',
                'password': 'wrongpassword'
            })
        
        # Should hit rate limit
        response = client.post('/api/v1/auth/login', json={
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 429
        data = response.get_json()
        assert 'RATE_LIMIT_EXCEEDED' in data['error']['code']

class TestAPIResponses:
    """API response format tests"""
    
    def test_standard_response_format(self, client):
        """Test that all responses follow standard format"""
        response = client.get('/api/v1/nonexistent')
        
        assert response.status_code == 404
        data = response.get_json()
        
        # Check required fields
        required_fields = ['success', 'data', 'message', 'timestamp', 'requestId']
        for field in required_fields:
            assert field in data
        
        assert data['success'] == False
        assert isinstance(data['timestamp'], int)
        assert isinstance(data['requestId'], str)
    
    def test_error_response_structure(self, client):
        """Test error response structure"""
        response = client.get('/api/v1/nonexistent')
        data = response.get_json()
        
        assert 'error' in data
        error = data['error']
        
        # Check error structure
        required_error_fields = ['code', 'message']
        for field in required_error_fields:
            assert field in error
        
        assert isinstance(error['code'], str)
        assert isinstance(error['message'], str)

class TestChallenges:
    """Challenge system tests"""
    
    def test_get_challenges(self, client):
        """Test retrieving challenges"""
        # Create test challenges
        for i in range(5):
            challenge = Challenge(
                title=f'Challenge {i+1}',
                description=f'Description {i+1}',
                difficulty='easy' if i % 2 == 0 else 'medium',
                points=100,
                is_active=True
            )
            db.session.add(challenge)
        db.session.commit()
        
        response = client.get('/api/v1/challenges')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert isinstance(data['data'], list)
        assert len(data['data']) >= 5
    
    def test_create_challenge(self, client, auth_headers):
        """Test creating a new challenge"""
        challenge_data = {
            'title': 'Test Challenge',
            'description': 'Test Description',
            'difficulty': 'medium',
            'points': 150,
            'testCases': [
                {'input': 'test', 'output': 'expected', 'description': 'Basic test'}
            ]
        }
        
        response = client.post('/api/v1/challenges', 
                           json=challenge_data, 
                           headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['success'] == True
        assert 'id' in data['data']
    
    def test_challenge_validation(self, client, auth_headers):
        """Test challenge creation validation"""
        # Test missing required fields
        incomplete_data = {
            'title': 'Incomplete Challenge'
        }
        
        response = client.post('/api/v1/challenges', 
                           json=incomplete_data, 
                           headers=auth_headers)
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] == False
        assert 'MISSING_FIELDS' in data['error']['code']

class TestUserProfile:
    """User profile tests"""
    
    def test_get_profile(self, client, auth_headers):
        """Test getting user profile"""
        # Create test user
        user = User(
            email='profile@example.com',
            password_hash='hashed_password',
            role='STUDENT'
        )
        user.save()
        db.session.commit()
        
        # Get auth token
        login_response = client.post('/api/v1/auth/login', json={
            'email': 'profile@example.com',
            'password': 'SecurePassword123!'
        })
        token = login_response.get_json()['data']['token']
        
        response = client.get('/api/v1/profile/profile', 
                           headers={'Authorization': f'Bearer {token}'})
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert 'id' in data['data']
        assert 'email' in data['data']
    
    def test_update_profile(self, client, auth_headers):
        """Test updating user profile"""
        # Create and login user
        user = User(
            email='update@example.com',
            password_hash='hashed_password',
            role='STUDENT'
        )
        user.save()
        db.session.commit()
        
        login_response = client.post('/api/v1/auth/login', json={
            'email': 'update@example.com',
            'password': 'SecurePassword123!'
        })
        token = login_response.get_json()['data']['token']
        
        update_data = {
            'firstName': 'John',
            'lastName': 'Doe',
            'bio': 'Software Developer'
        }
        
        response = client.put('/api/v1/profile/profile', 
                           json=update_data,
                           headers={'Authorization': f'Bearer {token}'})
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] == True
        assert data['data']['firstName'] == 'John'
        assert data['data']['lastName'] == 'Doe'

class TestSecurity:
    """Security tests"""
    
    def test_sql_injection_prevention(self, client):
        """Test SQL injection prevention"""
        malicious_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'/*",
            "UNION SELECT * FROM users--"
        ]
        
        for payload in malicious_payloads:
            response = client.post('/api/v1/auth/login', json={
                'email': payload,
                'password': 'test'
            })
            
            # Should not succeed or cause server error
            assert response.status_code in [400, 401, 429]
    
    def test_xss_prevention(self, client):
        """Test XSS prevention"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "'\"><script>alert('xss')</script>"
        ]
        
        for payload in xss_payloads:
            response = client.post('/api/v1/auth/register', json={
                'email': f'{payload}@example.com',
                'password': 'SecurePassword123!'
            })
            
            # Should not succeed or be properly sanitized
            if response.status_code == 201:
                data = response.get_json()
                # Check that payload was sanitized
                assert '<script>' not in data['data']['email']
                assert 'javascript:' not in data['data']['email']

class TestPerformance:
    """Performance tests"""
    
    def test_response_time(self, client):
        """Test API response times"""
        import time
        
        start_time = time.time()
        response = client.get('/api/v1/challenges')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Should respond within reasonable time (2 seconds)
        assert response_time < 2.0
        assert response.status_code == 200
    
    def test_concurrent_requests(self, client):
        """Test handling of concurrent requests"""
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request():
            response = client.get('/api/v1/challenges')
            results.put(response.status_code)
        
        # Make 10 concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        status_codes = []
        while not results.empty():
            status_codes.append(results.get())
        
        # Most requests should succeed
        success_count = status_codes.count(200)
        assert success_count >= 8  # At least 80% success rate

class TestAIAssistant:
    """AI Assistant tests"""
    
    def test_ai_chat_endpoint(self, client, auth_headers, mock_openai):
        """Test AI chat endpoint"""
        with unittest.mock.patch('app.ai.routes.openai_client', mock_openai):
            # Mock OpenAI response
            mock_openai.chat.completions.create.return_value.choices = [
                type('MockChoice', (), {
                    'message': type('MockMessage', (), {
                        'content': 'This is a helpful response'
                    })
                })
            )
            
            response = client.post('/api/v1/ai/chat',
                               json={'message': 'How do I solve this?'},
                               headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] == True
            assert 'response' in data['data']
            assert 'suggestions' in data['data']
    
    def test_ai_code_explanation(self, client, auth_headers, mock_openai):
        """Test AI code explanation endpoint"""
        with unittest.mock.patch('app.ai.routes.openai_client', mock_openai):
            mock_openai.chat.completions.create.return_value.choices = [
                type('MockChoice', (), {
                    'message': type('MockMessage', (), {
                        'content': 'This code creates a variable and prints it...'
                    })
                })
            ]
            
            response = client.post('/api/v1/ai/explain',
                               json={'code': 'x = 5', 'language': 'python'},
                               headers=auth_headers)
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['success'] == True
            assert 'explanation' in data['data']

# Test fixtures
@pytest.fixture
def client():
    """Create test client"""
    app = create_app('testing')
    app.config['TESTING'] = True
    
    with app.app_context():
        db.create_all()
    
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """Create authenticated headers"""
    # Create test user and get token
    user = User(
        email='test@example.com',
        password_hash='hashed_password',
        role='STUDENT'
    )
    user.save()
    db.session.commit()
    
    login_response = client.post('/api/v1/auth/login', json={
        'email': 'test@example.com',
        'password': 'SecurePassword123!'
    })
    token = login_response.get_json()['data']['token']
    
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def mock_openai():
    """Mock OpenAI client"""
    from unittest.mock import Mock
    return Mock()

if __name__ == '__main__':
    pytest.main([__file__])