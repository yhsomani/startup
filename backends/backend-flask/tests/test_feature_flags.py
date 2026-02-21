import pytest
import uuid
from app.feature_flags import FeatureFlags

def test_manual_grading_feature_flag(client, auth_header):
    fake_id = uuid.uuid4()
    endpoint = f'/api/v1/challenges/submissions/{fake_id}/grade'
    
    # 1. Default State: Flag should be False
    FeatureFlags.disable('ENABLE_MANUAL_GRADING') # Ensure it's off
    
    response = client.put(endpoint, json={'score': 90}, headers=auth_header)
    assert response.status_code == 403
    assert response.json['message'] == 'Feature is currently disabled'
    
    # 2. Enabled State
    FeatureFlags.enable('ENABLE_MANUAL_GRADING')
    
    response = client.put(endpoint, json={'score': 90}, headers=auth_header)
    # Should fulfill the request or fail with 404 because ID doesn't exist
    # BUT definitely not 403
    assert response.status_code == 404
    
    # 3. Cleanup (Reset flag)
    FeatureFlags.disable('ENABLE_MANUAL_GRADING')

def test_challenge_management_flags(client, auth_header):
    fake_id = uuid.uuid4()
    update_endpoint = f'/api/v1/challenges/{fake_id}'
    
    # Update: Default OFF
    FeatureFlags.disable('ENABLE_CHALLENGE_MANAGEMENT')
    response = client.put(update_endpoint, json={'title': 'New Title'}, headers=auth_header)
    assert response.status_code == 403
    
    # Update: ON
    FeatureFlags.enable('ENABLE_CHALLENGE_MANAGEMENT')
    response = client.put(update_endpoint, json={'title': 'New Title'}, headers=auth_header)
    # 404 means it passed the flag check and tried to find the ID
    assert response.status_code == 404
    
    # Delete: Default OFF (we just enabled it, so disable again to test logic if separate test, but here we reuse)
    FeatureFlags.disable('ENABLE_CHALLENGE_MANAGEMENT')
    response = client.delete(update_endpoint, headers=auth_header)
    assert response.status_code == 403
    
    # Delete: ON
    FeatureFlags.enable('ENABLE_CHALLENGE_MANAGEMENT')
    response = client.delete(update_endpoint, headers=auth_header)
    assert response.status_code == 404
    
    FeatureFlags.disable('ENABLE_CHALLENGE_MANAGEMENT')

def test_user_history_flag(client, auth_header):
    fake_id = uuid.uuid4()
    endpoint = f'/api/v1/challenges/submissions/user/{fake_id}'
    
    # Default OFF
    FeatureFlags.disable('ENABLE_USER_HISTORY')
    response = client.get(endpoint, headers=auth_header)
    assert response.status_code == 403
    
    # ON
    FeatureFlags.enable('ENABLE_USER_HISTORY')
    response = client.get(endpoint, headers=auth_header)
    assert response.status_code == 200 # Should return empty list []
    assert response.json == []
    
    FeatureFlags.disable('ENABLE_USER_HISTORY')
