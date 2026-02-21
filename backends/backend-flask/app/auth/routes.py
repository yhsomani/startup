from flask import request, jsonify, Response
from . import auth_bp
from app.models import User
from app.extensions import db, jwt
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta
import secrets
import base64
import re
import logging
from typing import Dict, Any, Tuple, Union
from app.events import publish_event
from app.email_service import email_service
from app.utils.response import standard_response, error_response
from app.utils.rate_limiting import rate_limit

logger = logging.getLogger(__name__)
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

@auth_bp.route('/health', methods=['GET'])
def health_check() -> Tuple[Response, int]:
    return jsonify({'status': 'healthy'}), 200

@auth_bp.route('/register', methods=['POST'])
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
def register() -> Union[Dict[str, Any], Tuple[Dict[str, Any], int]]:
    data = request.get_json()
    
    # Input validation
    if not data.get('email') or not EMAIL_REGEX.match(data['email']):
        return error_response('INVALID_EMAIL', 'Valid email address is required'), 400
    if not data.get('password') or len(data['password']) < 8:
        return error_response('WEAK_PASSWORD', 'Password must be at least 8 characters'), 400
    
    if User.query.filter_by(email=data['email']).first():
        return error_response('EMAIL_EXISTS', 'Email already exists'), 400

    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=data.get('role', 'STUDENT')
    )
    db.session.add(user)
    db.session.commit()

    publish_event('user.registered', {'userId': user.id, 'email': user.email, 'role': user.role})

    # Send welcome email
    try:
        email_sent = email_service.send_welcome_email(user.email, user.email.split('@')[0])
        if not email_sent:
            logger.warning(f"Failed to send welcome email to {user.email}")
    except Exception as e:
        logger.error(f"Error sending welcome email: {str(e)}")

    access_token = create_access_token(identity=user.id, additional_claims={'role': user.role, 'email': user.email}, expires_delta=timedelta(hours=1))
    refresh_token = create_refresh_token(identity=user.id, expires_delta=timedelta(days=30))

    return {
        'token': access_token,
        'refreshToken': refresh_token,
        'expiresIn': 3600,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'role': user.role
        }
    }, 201

@auth_bp.route('/login', methods=['POST'])
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
def login() -> Union[Dict[str, Any], Tuple[Response, int]]:
    data = request.get_json()
    
    # Input validation
    if not data:
        return error_response('INVALID_REQUEST', 'Request body is required'), 400
    if not data.get('email') or not EMAIL_REGEX.match(data['email']):
        return error_response('INVALID_EMAIL', 'Valid email address is required'), 400
    if not data.get('password'):
        return error_response('INVALID_PASSWORD', 'Password is required'), 400
    
    user = User.query.filter_by(email=data['email']).first()

    if not user or not check_password_hash(user.password_hash, data['password']):
        return error_response('INVALID_CREDENTIALS', 'Invalid email or password', status_code=401), 401

    access_token = create_access_token(identity=user.id, additional_claims={'role': user.role, 'email': user.email}, expires_delta=timedelta(hours=1))
    refresh_token = create_refresh_token(identity=user.id, expires_delta=timedelta(days=30))

    # Create response with httpOnly cookie for refresh token
    from flask import make_response
    import os
    
    response_data = {
        'token': access_token,
        'expiresIn': 3600,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'role': user.role
        }
    }
    
    response = make_response(jsonify(response_data))
    
    # Set refresh token as httpOnly cookie (secure in production)
    is_production = os.environ.get('FLASK_ENV') == 'production'
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=is_production,  # Only HTTPS in production
        samesite='Lax',
        max_age=30 * 24 * 60 * 60,  # 30 days
        path='/auth'  # Only sent to auth endpoints
    )
    
    # Also include in response body for backwards compatibility
    response_data['refreshToken'] = refresh_token
    
    return response, 200

@auth_bp.route('/internal/verify', methods=['POST'])
@jwt_required()
def verify_token() -> Tuple[Response, int]:
    """Internal endpoint for microservices to verify tokens"""
    claims = get_jwt()
    return jsonify({
        'valid': True,
        'user_id': get_jwt_identity(),
        'role': claims.get('role'),
        'email': claims.get('email')
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout() -> Tuple[Response, int]:
    """Logout user and clear refresh token cookie"""
    from flask import make_response
    
    response = make_response(jsonify({'message': 'Logged out successfully'}))
    
    # Clear the refresh token cookie
    response.set_cookie(
        'refresh_token',
        '',
        httponly=True,
        secure=True,
        samesite='Lax',
        expires=0,  # Expire immediately
        path='/auth'
    )
    
    return response, 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return success to prevent email enumeration attacks
    if not user:
        return jsonify({'message': 'If an account with that email exists, a password reset link has been sent.'}), 200

    # Generate reset token
    reset_token = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')
    reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)

    # Save reset token
    user.password_reset_token = reset_token
    user.password_reset_expires = reset_expires
    user.password_reset_sent = datetime.now(timezone.utc)
    db.session.commit()

    # Send password reset email
    try:
        email_sent = email_service.send_password_reset_email(user.email, reset_token, user.email.split('@')[0])
        if not email_sent:
            logger.warning(f"Failed to send password reset email to {email}")
    except Exception as e:
        logger.error(f"Error sending password reset email: {str(e)}")

    # Publish event for tracking
    publish_event('password.reset.requested', {
        'userId': user.id,
        'email': user.email,
        'resetToken': reset_token,
        'expiresAt': reset_expires.isoformat()
    })

    return jsonify({'message': 'If an account with that email exists, a password reset link has been sent.'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({'message': 'Token and password are required'}), 400

    # Find user by reset token
    user = User.query.filter_by(password_reset_token=token).first()

    if not user:
        return jsonify({'message': 'Invalid or expired reset token'}), 400

    # Check if token is expired
    if user.password_reset_expires and user.password_reset_expires < datetime.now(timezone.utc):
        return jsonify({'message': 'Reset token has expired'}), 400

    # Validate password strength
    if len(new_password) < 8:
        return jsonify({'message': 'Password must be at least 8 characters long'}), 400

    # Update password
    user.password_hash = generate_password_hash(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.password_reset_sent = None
    user.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    # Publish event
    publish_event('password.reset.completed', {
        'userId': user.id,
        'email': user.email
    })

    return jsonify({'message': 'Password has been reset successfully'}), 200

@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if reset token is valid"""
    data = request.get_json()
    token = data.get('token')

    if not token:
        return jsonify({'valid': False, 'message': 'Token is required'}), 400

    user = User.query.filter_by(password_reset_token=token).first()

    if not user:
        return jsonify({'valid': False, 'message': 'Invalid token'}), 400

    # Check if token is expired
    if user.password_reset_expires and user.password_reset_expires < datetime.now(timezone.utc):
        return jsonify({'valid': False, 'message': 'Token has expired'}), 400

    return jsonify({
        'valid': True,
        'email': user.email,
        'expires_at': user.password_reset_expires.isoformat() if user.password_reset_expires else None
    }), 200
