import pytest
import asyncio
import httpx
from typing import Dict, Any, Generator
import json
from pathlib import Path

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_client():
    """Create test client for API testing"""
    async with httpx.AsyncClient(
        base_url="http://localhost:8000/v1",
        headers={"Content-Type": "application/json"}
    ) as client:
        yield client

@pytest.fixture
def auth_token():
    """Sample JWT token for testing"""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token"

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "role": "STUDENT"
    }

@pytest.fixture
def sample_course_data():
    """Sample course data for testing"""
    return {
        "title": "Test Course",
        "subtitle": "Test subtitle",
        "description": "Test description",
        "price": 49.99,
        "currency": "USD"
    }

@pytest.fixture
def sample_challenge_data():
    """Sample challenge data for testing"""
    return {
        "title": "Test Challenge",
        "description": "Test challenge description",
        "evaluationMetric": "accuracy",
        "passingScore": 70.0
    }

@pytest.fixture(scope="session")
def load_test_fixtures():
    """Load test fixtures from JSON files"""
    fixtures_dir = Path(__file__).parent / "fixtures"
    fixtures = {}
    
    for fixture_file in fixtures_dir.glob("*.json"):
        with open(fixture_file, 'r') as f:
            fixtures[fixture_file.stem] = json.load(f)
    
    return fixtures

@pytest.fixture
async def authenticated_client(test_client, auth_token):
    """Create authenticated test client"""
    test_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return test_client

# Test configuration
@pytest.fixture(scope="session")
def api_config():
    """API configuration for tests"""
    return {
        "base_url": "http://localhost:8000/v1",
        "timeout": 30.0,
        "retry_attempts": 3,
        "retry_delay": 1.0
    }

# Feature flags for testing
@pytest.fixture
def feature_flags():
    """Feature flags configuration"""
    return {
        "ENABLE_AI_ASSISTANT": True,
        "ENABLE_CODE_EXECUTION": True,
        "ENABLE_MANUAL_GRADING": True,
        "ENABLE_CHALLENGE_MANAGEMENT": True,
        "ENABLE_RECRUITMENT": True,
        "ENABLE_GAMIFICATION": True
    }

# Mock data generators
@pytest.fixture
def generate_test_users():
    """Generate test users with different roles"""
    return [
        {
            "email": f"user{i}@test.com",
            "password": "TestPassword123!",
            "role": role
        }
        for i, role in enumerate(["STUDENT", "INSTRUCTOR", "ADMIN"], 1)
    ]

@pytest.fixture
def create_temp_database():
    """Create temporary database for testing"""
    # This would create a test database
    # Implementation depends on your database setup
    pass

@pytest.fixture
def cleanup_temp_database():
    """Cleanup temporary database after testing"""
    # This would cleanup the test database
    # Implementation depends on your database setup
    pass

# Logging configuration
@pytest.fixture(autouse=True)
def configure_logging():
    """Configure logging for tests"""
    import logging
    logging.basicConfig(level=logging.DEBUG)
    return logging.getLogger(__name__)

# Performance testing fixtures
@pytest.fixture
def performance_config():
    """Configuration for performance tests"""
    return {
        "concurrent_users": 10,
        "requests_per_second": 100,
        "test_duration": 60,  # seconds
        "acceptable_response_time": 2.0  # seconds
    }