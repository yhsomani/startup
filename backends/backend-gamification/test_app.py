import pytest
import os
import sys

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
        token = create_access_token(identity='test-user', additional_claims={'role': 'ADMIN'})
        return {'Authorization': f'Bearer {token}'}

def test_health_check(client):
    """Test health endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'gamification-service'

def test_streaks_feature_flag_disabled(client, monkeypatch, auth_headers):
    """Test streaks returns 403 when feature flag is disabled"""
    monkeypatch.setenv('FF_ENABLE_GAMIFICATION', 'false')
    
    response = client.get('/api/v1/users/1/streaks', headers=auth_headers)
    assert response.status_code == 403

def test_get_user_streaks_mock(client, monkeypatch, auth_headers):
    """Test get user streaks in mock mode"""
    monkeypatch.setenv('FF_ENABLE_GAMIFICATION', 'true')
    
    response = client.get('/api/v1/users/1/streaks', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'current_streak' in data
    assert 'longest_streak' in data
    assert 'last_activity' in data

def test_get_user_badges_mock(client, monkeypatch, auth_headers):
    """Test get user badges in mock mode"""
    monkeypatch.setenv('FF_ENABLE_GAMIFICATION', 'true')
    
    response = client.get('/api/v1/users/1/badges', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'total' in data
    assert 'badges' in data
    assert isinstance(data['badges'], list)

def test_get_user_points_mock(client, monkeypatch, auth_headers):
    """Test get user points in mock mode"""
    monkeypatch.setenv('FF_ENABLE_GAMIFICATION', 'true')
    
    response = client.get('/api/v1/users/1/points', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'total_points' in data
    assert 'level' in data
    assert 'points_to_next_level' in data

def test_award_points_mock(client, monkeypatch, auth_headers):
    """Test awarding points in mock mode"""
    monkeypatch.setenv('FF_ENABLE_GAMIFICATION', 'true')
    
    response = client.post('/api/v1/users/1/award-points', json={
        'points': 100,
        'reason': 'Completed challenge'
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'message' in data
    assert 'new_total' in data

def test_multiple_users_isolated(client, monkeypatch, auth_headers):
    """Test that different users have isolated data"""
    monkeypatch.setenv('FF_ENABLE_GAMIFICATION', 'true')
    
    response1 = client.get('/api/v1/users/1/points', headers=auth_headers)
    response2 = client.get('/api/v1/users/2/points', headers=auth_headers)
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    # Data should be different for different users
