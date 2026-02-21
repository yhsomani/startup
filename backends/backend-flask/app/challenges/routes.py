from flask import Blueprint, request, jsonify
from app.decorators import role_required
from app.models import Challenge
from app.extensions import db
from app.utils.security import validate_input, SecurityMiddleware


challenges_bp = Blueprint('challenges', __name__)


@challenges_bp.route('/', methods=['POST'])
@role_required('instructor', 'admin')
def create_challenge():
    data = request.get_json()
    challenge = Challenge(
        title=data.get('title'),
        description=data.get('description'),
        evaluationMetric=data.get('evaluationMetric', 'accuracy'),
        dataset_url=data.get('datasetUrl'),
        passing_score=data.get('passingScore', 70.0),
        test_cases=data.get('testCases'),
        language=data.get('language', 'python')
    )
    db.session.add(challenge)
    db.session.commit()
    
    return jsonify({
        'id': challenge.id,
        'title': challenge.title,
        'testCases': challenge.test_cases,
        'language': challenge.language
    }), 201
