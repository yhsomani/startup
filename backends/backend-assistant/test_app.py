import pytest
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app

from flask_jwt_extended import create_access_token

@pytest.fixture
def client():
    """Test client fixture"""
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970'
    with app.test_client() as client:
        yield client

@pytest.fixture
def auth_headers(client):
    """Helper to generate JWT headers"""
    with app.app_context():
        token = create_access_token(identity='test-user')
        return {'Authorization': f'Bearer {token}'}

def test_health_check(client):
    """Test health endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'assistant-service'

def test_chat_feature_flag_disabled(client, monkeypatch, auth_headers):
    """Test chat returns 403 when feature flag is disabled"""
    # Mock feature flag to be disabled
    monkeypatch.setenv('FF_ENABLE_AI_ASSISTANT', 'false')
    
    response = client.post('/api/v1/assistant/chat', json={
        'message': 'Hello'
    }, headers=auth_headers)
    assert response.status_code == 403
    data = response.get_json()
    assert 'disabled' in data['error'].lower()

def test_chat_requires_message(client, monkeypatch, auth_headers):
    """Test chat requires message field"""
    monkeypatch.setenv('FF_ENABLE_AI_ASSISTANT', 'true')
    
    response = client.post('/api/v1/assistant/chat', json={}, headers=auth_headers)
    assert response.status_code == 400
    data = response.get_json()
    assert 'required' in data['error'].lower()

def test_chat_mock_mode(client, monkeypatch, auth_headers):
    """Test chat works in mock mode"""
    monkeypatch.setenv('FF_ENABLE_AI_ASSISTANT', 'true')
    
    response = client.post('/api/v1/assistant/chat', json={
        'message': 'Explain Python variables'
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'response' in data
    assert data['source'] == 'mock-ai-model'
    assert data['mode'] == 'MOCK'

def test_chat_with_context(client, monkeypatch, auth_headers):
    """Test chat accepts context"""
    monkeypatch.setenv('FF_ENABLE_AI_ASSISTANT', 'true')
    
    response = client.post('/api/v1/assistant/chat', json={
        'message': 'Help with this code',
        'context': {
            'course': 'Python 101',
            'code': 'def foo(): pass'
        }
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'response' in data

def test_analyze_code_requires_code(client, monkeypatch, auth_headers):
    """Test code analysis requires code field"""
    monkeypatch.setenv('FF_ENABLE_AI_ASSISTANT', 'true')
    
    response = client.post('/api/v1/assistant/analyze-code', json={}, headers=auth_headers)
    assert response.status_code == 400

def test_analyze_code_mock_mode(client, monkeypatch, auth_headers):
    """Test code analysis in mock mode"""
    monkeypatch.setenv('FF_ENABLE_AI_ASSISTANT', 'true')
    
    response = client.post('/api/v1/assistant/analyze-code', json={
        'code': 'def hello(): print("world")',
        'language': 'python'
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'quality_score' in data or 'feedback' in data
    assert data['mode'] == 'MOCK'
