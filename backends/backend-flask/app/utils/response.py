from functools import wraps
from flask import jsonify, request
import uuid
import time

def standard_response(f):
    """Decorator to standardize API responses"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Generate request ID
        request_id = str(uuid.uuid4())
        timestamp = int(time.time())

        try:
            result = f(*args, **kwargs)

            # Handle different response types
            if isinstance(result, tuple):
                data, status_code = result
                success = 200 <= status_code < 300
            else:
                data = result
                status_code = 200
                success = True

            # Return standardized response
            response_data = {
                'success': success,
                'data': data,
                'message': 'Operation completed successfully' if success else 'Operation failed',
                'timestamp': timestamp,
                'requestId': request_id
            }

            response = jsonify(response_data)
            response.status_code = status_code
            response.headers['X-Request-ID'] = request_id
            return response

        except Exception as e:
            # Handle errors
            error_data = {
                'success': False,
                'data': None,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': str(e)
                },
                'message': 'An internal error occurred',
                'timestamp': timestamp,
                'requestId': request_id
            }

            response = jsonify(error_data)
            response.status_code = 500
            response.headers['X-Request-ID'] = request_id
            return response

    return decorated_function

def error_response(code, message, details=None, status_code=400):
    """Create standardized error response"""
    timestamp = int(time.time())
    request_id = str(uuid.uuid4())

    error_data = {
        'success': False,
        'data': None,
        'error': {
            'code': code,
            'message': message,
            'details': details or {}
        },
        'message': message,
        'timestamp': timestamp,
        'requestId': request_id
    }

    response = jsonify(error_data)
    response.status_code = status_code
    response.headers['X-Request-ID'] = request_id
    return response
