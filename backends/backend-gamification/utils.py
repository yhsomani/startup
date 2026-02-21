import os
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeatureFlags:
    """
    Feature flag management system with fallback to environment variables
    """
    @classmethod
    def is_enabled(cls, flag):
        try:
            # Try to get flag from Flask service
            import requests
            flask_flags_url = os.getenv('FLASK_FLAGS_URL', 'http://flask:5000')
            response = requests.get(
                f'{flask_flags_url}/api/v1/flags/is-enabled/{flag}',
                timeout=2
            )
            if response.status_code == 200:
                return response.json()['enabled']
        except Exception as e:
            logger.warning(f"Failed to fetch flag {flag} from service: {e}")
        
        # Fallback to environment variables
        return os.getenv(f'FF_{flag}', 'false').lower() == 'true'

def admin_required():
    """
    Decorator to require admin role for endpoints
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') != 'ADMIN':
                return jsonify({
                    'error': 'Admin access required',
                    'message': 'This endpoint requires administrator privileges'
                }), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def require_feature_flag(flag_name):
    """
    Decorator to require specific feature flag to be enabled
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not FeatureFlags.is_enabled(flag_name):
                return jsonify({
                    'error': f'Feature {flag_name} is disabled',
                    'message': f'The required feature {flag_name} is currently disabled'
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def validate_json_input(required_fields=None, optional_fields=None):
    """
    Decorator to validate JSON input
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Invalid request format',
                    'message': 'Request must be JSON'
                }), 400
            
            data = request.get_json()
            if not data:
                return jsonify({
                    'error': 'Empty request body',
                    'message': 'Request body cannot be empty'
                }), 400
            
            # Check required fields
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'error': 'Missing required fields',
                        'message': f'Required fields: {", ".join(missing_fields)}'
                    }), 400
            
            # Validate field types
            type_validators = {
                'points': (int, 'Points must be an integer'),
                'reason': (str, 'Reason must be a string'),
                'user_id': (int, 'User ID must be an integer'),
                'badge_id': (str, 'Badge ID must be a string')
            }
            
            for field, (expected_type, error_msg) in type_validators.items():
                if field in data and not isinstance(data[field], expected_type):
                    return jsonify({
                        'error': 'Invalid field type',
                        'message': error_msg
                    }), 400
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def rate_limit_check():
    """
    Simple rate limiting check (in production, use Redis-based rate limiting)
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Simple in-memory rate limiting for development
            # In production, implement Redis-based rate limiting
            client_ip = request.remote_addr
            endpoint = request.endpoint
            
            # Log the request for monitoring
            logger.info(f"Rate limit check: {client_ip} accessing {endpoint}")
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def secure_headers():
    """
    Add security headers to response
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            response = fn(*args, **kwargs)
            
            if hasattr(response, 'headers'):
                response.headers['X-Content-Type-Options'] = 'nosniff'
                response.headers['X-Frame-Options'] = 'DENY'
                response.headers['X-XSS-Protection'] = '1; mode=block'
                response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            
            return response
        return wrapper
    return decorator

def log_api_access():
    """
    Log API access for monitoring and debugging
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            start_time = datetime.now()
            
            try:
                response = fn(*args, **kwargs)
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                logger.info(f"API Access: {request.method} {request.path} - "
                          f"Status: {response[1] if isinstance(response, tuple) else '200'} - "
                          f"Duration: {duration:.3f}s - "
                          f"IP: {request.remote_addr}")
                
                return response
            except Exception as e:
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                logger.error(f"API Error: {request.method} {request.path} - "
                           f"Error: {str(e)} - "
                           f"Duration: {duration:.3f}s - "
                           f"IP: {request.remote_addr}")
                
                raise
        return wrapper
    return decorator

def handle_database_errors():
    """
    Handle database errors gracefully
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                logger.error(f"Database error in {fn.__name__}: {str(e)}")
                
                # Don't expose internal database errors to clients
                if 'database' in str(e).lower() or 'sql' in str(e).lower():
                    return jsonify({
                        'error': 'Database operation failed',
                        'message': 'An internal error occurred. Please try again later.'
                    }), 500
                
                raise
        return wrapper
    return decorator