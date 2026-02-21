import json
from app.models import User, Course
from app.extensions import db

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

# --- AUTH TESTS ---

def test_register_user(client):
    response = client.post('/api/v1/auth/register', json={
        "email": "new@example.com",
        "password": "password123",
        "role": "student"
    })
    assert response.status_code == 201
    assert 'accessToken' in response.json

def test_register_duplicate_email(client):
    client.post('/api/v1/auth/register', json={
        "email": "dup@example.com",
        "password": "pass", 
        "role": "student"
    })
    # Retry
    response = client.post('/api/v1/auth/register', json={
        "email": "dup@example.com",
        "password": "pass"
    })
    assert response.status_code == 400
    assert "already exists" in response.json['message']

def test_login_success(client):
    # Setup
    client.post('/api/v1/auth/register', json={"email":"login@test.com", "password":"123", "role":"student"})
    
    response = client.post('/api/v1/auth/login', json={
        "email": "login@test.com",
        "password": "123"
    })
    assert response.status_code == 200
    assert 'accessToken' in response.json

def test_login_invalid_credentials(client):
    client.post('/api/v1/auth/register', json={"email":"inv@test.com", "password":"123", "role":"student"})
    response = client.post('/api/v1/auth/login', json={
        "email": "inv@test.com", 
        "password": "WRONG"
    })
    assert response.status_code == 401

# --- COURSE TESTS ---

def test_get_courses_empty(client):
    response = client.get('/api/v1/courses') # Without slash
    assert response.status_code == 200
    assert response.json['data'] == []

def test_create_and_get_course(client, app):
    # Create instructor
    with app.app_context():
        u = User(email="inst@test.com", role="instructor")
        u.set_password("p")
        db.session.add(u)
        db.session.commit()
        # Create course directly (since we don't have course creation endpoint in flask, it's a retrieval service mostly or shared DB)
        # Actually Backend-Flask has Course Routes? 
        # routes.py: @courses_bp.route('/', methods=['GET'])
        # It READS courses. It assumes they exist. 
        # Let's verify if Flask has CREATE course logic.
        # Based on previous file reads, it seemed to only have LIST/GET.
        # I'll create one via DB.
        c = Course(
            instructor_id=u.id,
            title="Python 101",
            price=10.0,
            is_published=True
        )
        db.session.add(c)
        db.session.commit()

    response = client.get('/courses')
    assert response.status_code == 200
    assert len(response.json['courses']) == 1
    assert response.json['courses'][0]['title'] == "Python 101"

def test_get_course_404(client):
    response = client.get('/api/v1/courses/00000000-0000-0000-0000-000000000000')
    assert response.status_code == 404

# --- CHALLENGE TESTS ---

def test_submit_solution_no_file(client, auth_header):
    # We need a challenge first
    # Skipping DB setup for brevity, expecting 404 if challenge not found or 400 if file missing
    # But route checks file first.
    # Url needs challenge_id
    id = "00000000-0000-0000-0000-000000000000"
    response = client.post(f'/api/v1/challenges/{id}/submit', headers=auth_header)
    assert response.status_code == 400 # No file part

