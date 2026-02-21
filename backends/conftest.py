"""
TalentSphere Test Configuration
Central configuration for all Python tests
"""

import os
import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock
from typing import Generator, Any, Dict, List

# Test configuration
TEST_CONFIG = {
    'DATABASE_URL': os.getenv('TEST_DATABASE_URL', 'postgresql://test:test@localhost:5433/talentsphere_test'),
    'REDIS_URL': os.getenv('TEST_REDIS_URL', 'redis://localhost:6380/1'),
    'TEST_MODE': True,
    'LOG_LEVEL': 'DEBUG',
    'API_TIMEOUT': 5,
    'USER_ID': 'test-user-123',
    'COMPANY_USER_ID': 'test-user-456',
    'ADMIN_USER_ID': 'test-admin-789',
}

# Test data generators
class TestDataGenerator:
    """Generate test data for testing"""
    
    @staticmethod
    def generate_user(**overrides) -> Dict[str, Any]:
        """Generate test user data"""
        user_data = {
            'id': TEST_CONFIG['USER_ID'],
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'user',
            'is_active': True,
            'password': 'testpassword123'
        }
        user_data.update(overrides)
        return user_data
    
    @staticmethod
    def generate_company(**overrides) -> Dict[str, Any]:
        """Generate test company data"""
        company_data = {
            'id': 'test-company-123',
            'name': 'Test Company',
            'description': 'A test company for unit testing',
            'website': 'https://test-company.com',
            'industry': 'Technology',
            'size': '11-50',
            'location': 'San Francisco, CA'
        }
        company_data.update(overrides)
        return company_data
    
    @staticmethod
    def generate_job(**overrides) -> Dict[str, Any]:
        """Generate test job data"""
        job_data = {
            'id': 'test-job-123',
            'title': 'Software Engineer',
            'description': 'Test job description',
            'company_id': 'test-company-123',
            'location': 'San Francisco, CA',
            'remote': True,
            'job_type': 'full-time',
            'experience_level': 'mid',
            'salary_min': 80000,
            'salary_max': 120000,
            'skills': ['Python', 'Flask', 'PostgreSQL', 'Redis']
        }
        job_data.update(overrides)
        return job_data
    
    @staticmethod
    def generate_gamification_data(**overrides) -> Dict[str, Any]:
        """Generate test gamification data"""
        gamification_data = {
            'user_id': TEST_CONFIG['USER_ID'],
            'current_streak': 5,
            'longest_streak': 10,
            'total_points': 500,
            'level': 3,
            'badges_earned': ['first_course', 'week_warrior']
        }
        gamification_data.update(overrides)
        return gamification_data

# Mock fixtures and utilities
class MockFixtures:
    """Mock fixtures for testing"""
    
    @staticmethod
    def mock_db_session():
        """Create a mock database session"""
        session = MagicMock()
        session.add = MagicMock()
        session.commit = MagicMock(return_value=None)
        session.rollback = MagicMock(return_value=None)
        session.query = MagicMock()
        session.close = MagicMock(return_value=None)
        return session
    
    @staticmethod
    def mock_redis():
        """Create a mock Redis client"""
        redis = MagicMock()
        redis.get = MagicMock(return_value=None)
        redis.set = MagicMock(return_value=True)
        redis.delete = MagicMock(return_value=True)
        redis.exists = MagicMock(return_value=False)
        redis.ping = MagicMock(return_value=True)
        redis.close = MagicMock(return_value=None)
        return redis
    
    @staticmethod
    def mock_jwt_token(user_id: str = TEST_CONFIG['USER_ID']) -> str:
        """Create a mock JWT token"""
        import jwt
        import datetime
        
        payload = {
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1),
            'iat': datetime.datetime.utcnow()
        }
        
        secret_key = os.getenv('JWT_SECRET', 'test-secret-key')
        return jwt.encode(payload, secret_key, algorithm='HS256')

class DatabaseTestUtils:
    """Database utilities for testing"""
    
    @staticmethod
    def create_test_tables(session):
        """Create test database tables"""
        from models import db
        
        # Create all tables
        db.create_all(session)
        session.commit()
    
    @staticmethod
    def clean_test_tables(session):
        """Clean test database tables"""
        from models import db
        
        # Drop all tables
        db.drop_all(session)
        session.commit()
    
    @staticmethod
    def create_test_user(session, user_data: Dict[str, Any]):
        """Create a test user in the database"""
        from models import User
        
        user = User(**user_data)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user
    
    @staticmethod
    def create_test_job(session, job_data: Dict[str, Any]):
        """Create a test job in the database"""
        from models import Job
        
        job = Job(**job_data)
        session.add(job)
        session.commit()
        session.refresh(job)
        return job

class AsyncTestUtils:
    """Async utilities for testing"""
    
    @staticmethod
    async def create_async_session():
        """Create an async test session"""
        import asyncio
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        
        engine = create_async_engine(TEST_CONFIG['DATABASE_URL'])
        session = AsyncSession(engine)
        return session
    
    @staticmethod
    async def cleanup_database():
        """Clean up test database"""
        engine = create_async_engine(TEST_CONFIG['DATABASE_URL'])
        
        try:
            # Drop all tables
            from models import Base
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
        finally:
            await engine.dispose()

# Pytest fixtures
@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def mock_db_session():
    """Provide a mock database session for testing"""
    session = MockFixtures.mock_db_session()
    yield session
    session.reset_mock()

@pytest.fixture(scope="function")
def mock_redis():
    """Provide a mock Redis client for testing"""
    redis = MockFixtures.mock_redis()
    yield redis
    redis.reset_mock()

@pytest.fixture(scope="function")
def sample_user():
    """Provide a sample user for testing"""
    return TestDataGenerator.generate_user()

@pytest.fixture(scope="function")
def sample_company():
    """Provide a sample company for testing"""
    return TestDataGenerator.generate_company()

@pytest.fixture(scope="function")
def sample_job():
    """Provide a sample job for testing"""
    return TestDataGenerator.generate_job()

@pytest.fixture(scope="function")
def sample_gamification():
    """Provide a sample gamification data for testing"""
    return TestDataGenerator.generate_gamification_data()

@pytest.fixture(scope="function")
def auth_headers():
    """Provide authorization headers for testing"""
    token = MockFixtures.mock_jwt_token()
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture(scope="function")
def admin_headers():
    """Provide admin authorization headers for testing"""
    token = MockFixtures.mock_jwt_token(TEST_CONFIG['ADMIN_USER_ID'])
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture(autouse=True)
def test_environment(monkeypatch):
    """Set up test environment variables"""
    # Mock environment variables
    monkeypatch.setenv('TEST_MODE', 'true')
    monkeypatch.setenv('DATABASE_URL', TEST_CONFIG['DATABASE_URL'])
    monkeypatch.setenv('REDIS_URL', TEST_CONFIG['REDIS_URL'])
    monkeypatch.setenv('JWT_SECRET', 'test-secret-key')
    monkeypatch.setenv('FLASK_ENV', 'testing')

# Async fixtures for testing with async/await
@pytest.fixture(scope="function")
async def async_session():
    """Provide an async database session"""
    async with DatabaseTestUtils.create_async_session() as session:
        yield session

# Test assertion helpers
class TestAssertions:
    """Custom assertion helpers for testing"""
    
    @staticmethod
    def assert_valid_user(user_data: Dict[str, Any]):
        """Assert that user data is valid"""
        required_fields = ['id', 'email', 'first_name', 'last_name', 'role']
        for field in required_fields:
            assert field in user_data, f"Missing required field: {field}"
    
    @staticmethod
    def assert_valid_job(job_data: Dict[str, Any]):
        """Assert that job data is valid"""
        required_fields = ['id', 'title', 'description', 'company_id']
        for field in required_fields:
            assert field in job_data, f"Missing required field: {field}"
    
    @staticmethod
    def assert_api_response(response: Dict[str, Any], 
                          expected_status: int = 200,
                          should_have_data: bool = True):
        """Assert that API response is valid"""
        assert 'status' in response, "Response missing status"
        assert response['status'] == expected_status, f"Expected status {expected_status}, got {response['status']}"
        
        if should_have_data:
            assert 'data' in response or 'message' in response, "Response missing data or message"
    
    @staticmethod
    def assert_error_response(response: Dict[str, Any], 
                           expected_error: str = None):
        """Assert that error response is valid"""
        assert response['status'] >= 400, f"Expected error status >= 400, got {response['status']}"
        assert 'error' in response, "Response missing error field"
        
        if expected_error:
            assert response['error'] == expected_error, f"Expected error {expected_error}, got {response['error']}"

# Test markers for better organization
def unit_test():
    """Mark test as unit test"""
    return pytest.mark.unit

def integration_test():
    """Mark test as integration test"""
    return pytest.mark.integration

def api_test():
    """Mark test as API test"""
    return pytest.mark.api

def security_test():
    """Mark test as security test"""
    return pytest.mark.security

def performance_test():
    """Mark test as performance test"""
    return pytest.mark.performance

def slow_test():
    """Mark test as slow running test"""
    return pytest.mark.slow

def external_service_test():
    """Mark test that requires external services"""
    return pytest.mark.external

# Export all utilities for use in test files
__all__ = [
    'TEST_CONFIG',
    'TestDataGenerator',
    'MockFixtures',
    'DatabaseTestUtils',
    'AsyncTestUtils',
    'TestAssertions',
    'unit_test',
    'integration_test',
    'api_test',
    'security_test',
    'performance_test',
    'slow_test',
    'external_service_test'
]