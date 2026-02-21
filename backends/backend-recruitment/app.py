from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt, get_jwt_identity
from functools import wraps
from datetime import datetime
import os
import requests

# Flask Feature Flags API URL
FLASK_FLAGS_URL = os.getenv('FLASK_FLAGS_URL', 'http://flask:5000')

class FeatureFlags:
    @classmethod
    def is_enabled(cls, flag):
        try:
            # Try to get flag from Flask service
            response = requests.get(
                f'{FLASK_FLAGS_URL}/api/v1/flags/is-enabled/{flag}',
                timeout=2
            )
            if response.status_code == 200:
                return response.json()['enabled']
        except Exception:
            # Fallback to environment variables
            pass
        return os.getenv(f'FF_{flag}', 'false').lower() == 'true'

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970')
jwt = JWTManager(app)

def recruiter_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') not in ['RECRUITER', 'ADMIN']:
                return jsonify({'message': 'Recruiter or Admin access required'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# Progress Service configuration
PROGRESS_SERVICE_URL = os.getenv('PROGRESS_SERVICE_URL', 'http://localhost:8080')
USE_MOCK = os.getenv('USE_MOCK_RECRUITMENT', 'false').lower() == 'true'

# Mock data
MOCK_CANDIDATES = [
    {
        "id": 1,
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "skills": ["Python", "React", "AWS"],
        "verified_resume": "https://talentsphere.io/resumes/alice.pdf",
        "skill_scores": {"Python": 85, "React": 90, "AWS": 75},
        "percentile": 92
    },
    {
        "id": 2,
        "name": "Bob Smith",
        "email": "bob@example.com",
        "skills": ["Java", "Spring Boot", "Docker"],
        "verified_resume": "https://talentsphere.io/resumes/bob.pdf",
        "skill_scores": {"Java": 95, "Spring Boot": 88, "Docker": 80},
        "percentile": 88
    }
]

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'recruitment-service',
        'mode': 'MOCK' if USE_MOCK else 'PRODUCTION',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/v1/candidates/search', methods=['GET'])
@recruiter_required()
def search_candidates():
    """Search for candidates by skill and percentile"""
    if not FeatureFlags.is_enabled('ENABLE_RECRUITMENT'):
        return jsonify({'error': 'Recruitment feature is disabled'}), 403
    
    skill = request.args.get('skill', '')
    min_percentile = int(request.args.get('min_percentile', 0))
    
    if USE_MOCK:
       # Mock filtered results
        results = [
            c for c in MOCK_CANDIDATES
            if (not skill or skill.lower() in [s.lower() for s in c['skills']])
            and c['percentile'] >= min_percentile
        ]
        return jsonify({
            'total': len(results),
            'candidates': results,
            'mode': 'MOCK'
        }), 200
    else:
        # Production: Query Progress Service
        try:
            response = requests.get(
                f"{PROGRESS_SERVICE_URL}/api/v1/users/search",
                params={'skill': skill, 'min_percentile': min_percentile},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                return jsonify({
                    'total': len(data.get('users', [])),
                    'candidates': data.get('users', []),
                    'mode': 'PRODUCTION'
                }), 200
            else:
                return jsonify({'error': 'Progress Service unavailable'}), 503
        except requests.RequestException as e:
            return jsonify({'error': f'Service error: {str(e)}'}), 500

@app.route('/api/v1/candidates/<int:candidate_id>/verified-resume', methods=['GET'])
@recruiter_required()
def get_verified_resume(candidate_id):
    """Get blockchain-verified resume/certificates"""
    if not FeatureFlags.is_enabled('ENABLE_RECRUITMENT'):
        return jsonify({'error': 'Recruitment feature is disabled'}), 403
    
    if USE_MOCK:
        candidate = next((c for c in MOCK_CANDIDATES if c['id'] == candidate_id), None)
        if not candidate:
            return jsonify({'error': 'Candidate not found'}), 404
        
        return jsonify({
            'candidate_id': candidate_id,
            'name': candidate['name'],
            'resume_url': candidate['verified_resume'],
            'verified': True,
            'verification_date': '2025-01-15',
            'badges': ['Top 10% Python', 'Clean Code'],
            'mode': 'MOCK'
        }), 200
    else:
        # Production: Get certificates from Progress Service
        try:
            response = requests.get(
                f"{PROGRESS_SERVICE_URL}/api/v1/users/{candidate_id}/certificates",
                timeout=5
            )
            
            if response.status_code == 200:
                return jsonify({
                    **response.json(),
                    'mode': 'PRODUCTION'
                }), 200
            else:
                return jsonify({'error': 'Certificates not found'}), 404
        except requests.RequestException as e:
            return jsonify({'error': f'Service error: {str(e)}'}), 500

# Mock Data for Jobs/Applications
MOCK_JOBS = [
    {"id": "job-1", "title": "Junior Developer", "company": "TechCorp", "location": "Remote"},
    {"id": "job-2", "title": "DevOps Engineer", "company": "CloudSystems", "location": "New York"}
]
MOCK_APPLICATIONS = []

@app.route('/api/v1/jobs', methods=['GET'])
def get_jobs():
    """List all job postings"""
    if not FeatureFlags.is_enabled('ENABLE_RECRUITMENT'):
        return jsonify({'error': 'Recruitment feature is disabled'}), 403
    return jsonify(MOCK_JOBS), 200

@app.route('/api/v1/jobs', methods=['POST'])
@recruiter_required()
def create_job():
    """Create a new job posting"""
    if not FeatureFlags.is_enabled('ENABLE_RECRUITMENT'):
        return jsonify({'error': 'Recruitment feature is disabled'}), 403
    
    data = request.get_json()
    new_job = {
        "id": f"job-{len(MOCK_JOBS)+1}",
        "title": data.get('title'),
        "company": data.get('company'),
        "location": data.get('location')
    }
    MOCK_JOBS.append(new_job)
    return jsonify(new_job), 201

@app.route('/api/v1/applications', methods=['POST'])
@jwt_required()
def submit_application():
    """Submit a job application"""
    if not FeatureFlags.is_enabled('ENABLE_RECRUITMENT'):
        return jsonify({'error': 'Recruitment feature is disabled'}), 403
    
    data = request.get_json()
    application = {
        "id": f"app-{len(MOCK_APPLICATIONS)+1}",
        "userId": get_jwt_identity(),
        "jobId": data.get('jobId'),
        "status": "submitted",
        "submittedAt": datetime.now().isoformat()
    }
    MOCK_APPLICATIONS.append(application)
    return jsonify(application), 201

@app.route('/api/v1/applications/<user_id>', methods=['GET'])
@jwt_required()
def get_user_applications(user_id):
    """Retrieve applications for a specific user"""
    if not FeatureFlags.is_enabled('ENABLE_RECRUITMENT'):
        return jsonify({'error': 'Recruitment feature is disabled'}), 403
        
    current_user_id = get_jwt_identity()
    user_apps = [app for app in MOCK_APPLICATIONS if str(app['userId']) == str(user_id)]
    return jsonify(user_apps), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5006))
    mode_str = 'MOCK' if USE_MOCK else f'PRODUCTION ({PROGRESS_SERVICE_URL})'
    print(f"💼 Recruitment Service")
    print(f"   Mode: {mode_str}")
    print(f"   Port: {port}")
    if USE_MOCK:
        print(f"   💡 Set USE_MOCK_RECRUITMENT=false and PROGRESS_SERVICE_URL for production")
    app.run(host='0.0.0.0', port=port, debug=True)
