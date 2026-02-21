from functools import wraps
from flask import jsonify
import logging

logger = logging.getLogger(__name__)

def standard_response(f):
    """
    Decorator to standardize API responses
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            
            if isinstance(result, tuple) and len(result) == 2:
                data, status_code = result
            else:
                data = result
                status_code = 200
            
            # Standard response format
            response = {
                'success': status_code < 400,
                'data': data,
                'timestamp': __import__('datetime').datetime.utcnow().isoformat()
            }
            
            if status_code >= 400:
                response['success'] = False
                if isinstance(data, dict) and 'error' in data:
                    response['error'] = data['error']
                    response['message'] = data.get('message', 'Request failed')
                else:
                    response['error'] = 'UNKNOWN_ERROR'
                    response['message'] = 'An unknown error occurred'
            
            return jsonify(response), status_code
            
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'An internal server error occurred',
                'timestamp': __import__('datetime').datetime.utcnow().isoformat()
            }), 500
    
    return decorated_function

def error_response(error_code, message, status_code=400):
    """
    Create standardized error response
    """
    return {
        'error': error_code,
        'message': message
    }, status_code

def success_response(data, message=None):
    """
    Create standardized success response
    """
    response_data = {'data': data}
    if message:
        response_data['message'] = message
    
    return response_data, 200