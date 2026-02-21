"""
API Response Utilities

Standard API envelope for all Flask services.
Ensures consistent response format across the platform.

Response Format:
{
    "success": true/false,
    "data": {...} or null,
    "error": null or {"code": "...", "message": "..."},
    "meta": {
        "request_id": "uuid",
        "timestamp": "ISO-8601",
        "service": "flask-backend"
    }
}
"""
import uuid
from datetime import datetime
from functools import wraps
from flask import jsonify, request, g
from typing import Any, Dict, Optional, Tuple


# Error code mappings
ERROR_CODES = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
}

SERVICE_NAME = 'flask-backend'


def get_request_id() -> str:
    """Get or generate request ID for correlation."""
    if hasattr(g, 'request_id'):
        return g.request_id

    # Check for correlation ID from gateway
    request_id = request.headers.get('X-Request-ID') or \
                 request.headers.get('X-Correlation-ID') or \
                 str(uuid.uuid4())

    g.request_id = request_id
    return request_id


def build_meta() -> Dict[str, str]:
    """Build metadata for response envelope."""
    return {
        'request_id': get_request_id(),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'service': SERVICE_NAME,
    }


def api_response(
    data: Any = None,
    message: Optional[str] = None,
    status_code: int = 200
) -> Tuple[Dict, int]:
    """
    Create a successful API response.

    Args:
        data: Response payload
        message: Optional success message
        status_code: HTTP status code (default 200)

    Returns:
        Tuple of (response_dict, status_code)
    """
    response = {
        'success': True,
        'data': data,
        'error': None,
        'meta': build_meta(),
    }

    if message:
        response['message'] = message

    return jsonify(response), status_code


def api_error(
    message: str,
    code: Optional[str] = None,
    status_code: int = 400,
    details: Optional[Dict] = None
) -> Tuple[Dict, int]:
    """
    Create an error API response.

    Args:
        message: Human-readable error message
        code: Error code (auto-generated from status if not provided)
        status_code: HTTP status code
        details: Additional error details

    Returns:
        Tuple of (response_dict, status_code)
    """
    error_code = code or ERROR_CODES.get(status_code, 'UNKNOWN_ERROR')

    error_payload = {
        'code': error_code,
        'message': message,
    }

    if details:
        error_payload['details'] = details

    response = {
        'success': False,
        'data': None,
        'error': error_payload,
        'meta': build_meta(),
    }

    return jsonify(response), status_code


def api_created(data: Any, message: Optional[str] = None) -> Tuple[Dict, int]:
    """Shorthand for 201 Created response."""
    return api_response(data, message, status_code=201)


def api_no_content() -> Tuple[str, int]:
    """Shorthand for 204 No Content response."""
    return '', 204


def api_not_found(message: str = 'Resource not found') -> Tuple[Dict, int]:
    """Shorthand for 404 Not Found response."""
    return api_error(message, 'NOT_FOUND', 404)


def api_unauthorized(message: str = 'Authentication required') -> Tuple[Dict, int]:
    """Shorthand for 401 Unauthorized response."""
    return api_error(message, 'UNAUTHORIZED', 401)


def api_forbidden(message: str = 'Permission denied') -> Tuple[Dict, int]:
    """Shorthand for 403 Forbidden response."""
    return api_error(message, 'FORBIDDEN', 403)


def api_validation_error(message: str, details: Optional[Dict] = None) -> Tuple[Dict, int]:
    """Shorthand for 400 Validation Error response."""
    return api_error(message, 'VALIDATION_ERROR', 400, details)


def api_conflict(message: str) -> Tuple[Dict, int]:
    """Shorthand for 409 Conflict response."""
    return api_error(message, 'CONFLICT', 409)


def api_internal_error(message: str = 'An unexpected error occurred') -> Tuple[Dict, int]:
    """Shorthand for 500 Internal Server Error response."""
    return api_error(message, 'INTERNAL_ERROR', 500)


def with_correlation_id(f):
    """
    Decorator to ensure correlation ID is set for the request.
    Also adds correlation ID to response headers.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Ensure request ID is set
        request_id = get_request_id()

        # Execute the handler
        response = f(*args, **kwargs)

        # Add correlation ID to response headers
        if hasattr(response, 'headers'):
            response.headers['X-Request-ID'] = request_id
        elif isinstance(response, tuple) and len(response) >= 1:
            resp_obj, *rest = response
            if hasattr(resp_obj, 'headers'):
                resp_obj.headers['X-Request-ID'] = request_id

        return response

    return decorated_function
