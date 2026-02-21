import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models import User
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "test-secret"
    
    # Override database options for SQLite
    SQLALCHEMY_ENGINE_OPTIONS = {}

@pytest.fixture
def app():
    app = create_app(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def auth_header(client):
    # Create test user
    user = User(email="test@example.com", role="student")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Login to get token
    response = client.post('/api/v1/auth/login', json={
        "email": "test@example.com",
        "password": "password123"
    })
    token = response.json['accessToken']
    return {'Authorization': f'Bearer {token}'}
