"""
Request Validation Decorators

Provides consistent validation for API endpoints using Marshmallow schemas.
"""

from functools import wraps
from flask import request, jsonify
from marshmallow import ValidationError
from typing import Type, Callable, Any
from marshmallow import Schema


def validate_json(schema_class: Type[Schema]) -> Callable:
    """
    Decorator that validates request JSON against a Marshmallow schema.
    
    Usage:
        @app.route('/api/users', methods=['POST'])
        @validate_json(UserCreateSchema)
        def create_user():
            data = request.validated_data  # Validated and deserialized data
            ...
    
    Args:
        schema_class: Marshmallow Schema class to validate against
    
    Returns:
        Decorated function
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            schema = schema_class()
            json_data = request.get_json()
            
            if json_data is None:
                return jsonify({
                    'error': {
                        'code': 'INVALID_REQUEST',
                        'message': 'Request body must be valid JSON'
                    }
                }), 400
            
            try:
                # Validate and deserialize
                validated_data = schema.load(json_data)
                # Attach to request for use in handler
                request.validated_data = validated_data
            except ValidationError as err:
                return jsonify({
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Request validation failed',
                        'details': err.messages
                    }
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def validate_query_params(schema_class: Type[Schema]) -> Callable:
    """
    Decorator that validates query parameters against a Marshmallow schema.
    
    Usage:
        @app.route('/api/courses', methods=['GET'])
        @validate_query_params(CourseListQuerySchema)
        def list_courses():
            params = request.validated_params
            ...
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            schema = schema_class()
            
            try:
                # Convert ImmutableMultiDict to regular dict
                query_dict = request.args.to_dict()
                validated_params = schema.load(query_dict)
                request.validated_params = validated_params
            except ValidationError as err:
                return jsonify({
                    'error': {
                        'code': 'INVALID_QUERY_PARAMS',
                        'message': 'Query parameter validation failed',
                        'details': err.messages
                    }
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_fields(*fields: str) -> Callable:
    """
    Simple decorator to require specific fields in JSON request.
    
    Usage:
        @app.route('/api/login', methods=['POST'])
        @require_fields('email', 'password')
        def login():
            ...
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            json_data = request.get_json() or {}
            
            missing = [field for field in fields if not json_data.get(field)]
            
            if missing:
                return jsonify({
                    'error': {
                        'code': 'MISSING_FIELDS',
                        'message': f'Missing required fields: {", ".join(missing)}',
                        'missing_fields': missing
                    }
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
