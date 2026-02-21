from flask import request, jsonify
from . import profile_bp
from app.models import User
from app.extensions import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.response import standard_response, error_response
from app.utils.rate_limiting import rate_limit

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
@rate_limit(requests=100, window=60)
@standard_response
def get_profile():
    """Get current user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return error_response('USER_NOT_FOUND', 'User not found'), 404

    return {
        'id': str(user.id),
        'email': user.email,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'bio': user.bio,
        'profilePictureUrl': user.profile_picture_url,
        'phone': user.phone,
        'location': user.location,
        'website': user.website,
        'linkedin': user.linkedin,
        'github': user.github,
        'role': user.role,
        'isActive': user.is_active,
        'learningPreferences': user.learning_preferences or {},
        'createdAt': user.created_at.isoformat() if user.created_at else None,
        'updatedAt': user.updated_at.isoformat() if user.updated_at else None
    }

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
@rate_limit(requests=50, window=60)
@standard_response
def update_profile():
    """Update user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return error_response('USER_NOT_FOUND', 'User not found'), 404

    data = request.get_json()

    # Update allowed fields
    if 'firstName' in data:
        user.first_name = data['firstName']
    if 'lastName' in data:
        user.last_name = data['lastName']
    if 'bio' in data:
        user.bio = data['bio']
    if 'profilePictureUrl' in data:
        user.profile_picture_url = data['profilePictureUrl']
    if 'phone' in data:
        user.phone = data['phone']
    if 'location' in data:
        user.location = data['location']
    if 'website' in data:
        user.website = data['website']
    if 'linkedin' in data:
        user.linkedin = data['linkedin']
    if 'github' in data:
        user.github = data['github']
    if 'learningPreferences' in data:
        user.learning_preferences = data['learningPreferences']

    db.session.commit()

    return {
        'id': str(user.id),
        'email': user.email,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'bio': user.bio,
        'profilePictureUrl': user.profile_picture_url,
        'phone': user.phone,
        'location': user.location,
        'website': user.website,
        'linkedin': user.linkedin,
        'github': user.github,
        'role': user.role,
        'isActive': user.is_active,
        'learningPreferences': user.learning_preferences or {},
        'createdAt': user.created_at.isoformat() if user.created_at else None,
        'updatedAt': user.updated_at.isoformat() if user.updated_at else None
    }

@profile_bp.route('/preferences', methods=['GET'])
@jwt_required()
@rate_limit(requests=100, window=60)
@standard_response
def get_preferences():
    """Get user learning preferences"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return error_response('USER_NOT_FOUND', 'User not found'), 404

    return user.learning_preferences or {}

@profile_bp.route('/preferences', methods=['PUT'])
@jwt_required()
@rate_limit(requests=50, window=60)
@standard_response
def update_preferences():
    """Update user learning preferences"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return error_response('USER_NOT_FOUND', 'User not found'), 404

    data = request.get_json()
    preferences = data.get('preferences', {})

    # Validate preferences structure
    valid_preferences = {
        'languages': [],
        'topics': [],
        'difficultyLevel': 'beginner',
        'notifications': True,
        'theme': 'light'
    }

    # Merge with valid structure
    user.learning_preferences = {**valid_preferences, **preferences}
    db.session.commit()

    return user.learning_preferences
