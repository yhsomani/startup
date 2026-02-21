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
    # Force mock mode for tests
    import app as app_module
    app_module.USE_MOCK = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def auth_headers(client):
    """Helper to generate JWT headers"""
    with app.app_context():
        token = create_access_token(identity='test-user', additional_claims={'role': 'RECRUITER'})
        return {'Authorization': f'Bearer {token}'}

def test_health_check(client):
    """Test health endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'recruitment-service'

def test_search_feature_flag_disabled(client, monkeypatch, auth_headers):
    """Test search returns 403 when feature flag is disabled"""
    monkeypatch.setenv('FF_ENABLE_RECRUITMENT', 'false')
    
    response = client.get('/api/v1/candidates/search?skill=Python', headers=auth_headers)
    assert response.status_code == 403

def test_search_candidates_by_skill(client, monkeypatch, auth_headers):
    """Test candidate search by skill"""
    monkeypatch.setenv('FF_ENABLE_RECRUITMENT', 'true')
    monkeypatch.setenv('USE_MOCK_RECRUITMENT', 'true')
    
    response = client.get('/api/v1/candidates/search?skill=Python', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'total' in data
    assert 'candidates' in data
    assert data['mode'] == 'MOCK'

def test_search_candidates_by_percentile(client, monkeypatch, auth_headers):
    """Test candidate search by percentile"""
    monkeypatch.setenv('FF_ENABLE_RECRUITMENT', 'true')
    monkeypatch.setenv('USE_MOCK_RECRUITMENT', 'true')
    
    response = client.get('/api/v1/candidates/search?min_percentile=90', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    # Should only return candidates >= 90th percentile
    for candidate in data['candidates']:
        assert candidate['percentile'] >= 90

def test_search_candidates_combined_filters(client, monkeypatch, auth_headers):
    """Test candidate search with skill and percentile"""
    monkeypatch.setenv('FF_ENABLE_RECRUITMENT', 'true')
    monkeypatch.setenv('USE_MOCK_RECRUITMENT', 'true')
    
    response = client.get('/api/v1/candidates/search?skill=Python&min_percentile=85', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data['candidates'], list)

def test_get_verified_resume(client, monkeypatch, auth_headers):
    """Test getting verified resume"""
    monkeypatch.setenv('FF_ENABLE_RECRUITMENT', 'true')
    monkeypatch.setenv('USE_MOCK_RECRUITMENT', 'true')
    
    response = client.get('/api/v1/candidates/1/verified-resume', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'candidate_id' in data
    assert 'resume_url' in data or 'certificates' in data
    assert data['verified'] == True

def test_get_verified_resume_not_found(client, monkeypatch, auth_headers):
    """Test verified resume for non-existent candidate"""
    monkeypatch.setenv('FF_ENABLE_RECRUITMENT', 'true')
    monkeypatch.setenv('USE_MOCK_RECRUITMENT', 'true')
    
    response = client.get('/api/v1/candidates/99999/verified-resume', headers=auth_headers)
    assert response.status_code == 404
