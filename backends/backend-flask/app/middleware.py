"""
Flask Middleware

Global middleware for:
- Correlation ID injection
- Request logging
- Error handling
"""
import logging
import uuid
from flask import request, g
from functools import wraps
from datetime import datetime
from .api_response import api_error, get_request_id

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    """
    Register global error handlers for consistent API responses.
    """
    from flask import jsonify

    @app.errorhandler(400)
    def bad_request_error(error):
        return api_error(
            message=str(error.description) if hasattr(error, 'description') else 'Bad request',
            code='VALIDATION_ERROR',
            status_code=400
        )

    @app.errorhandler(401)
    def unauthorized_error(error):
        return api_error(
            message='Authentication required',
            code='UNAUTHORIZED',
            status_code=401
        )

    @app.errorhandler(403)
    def forbidden_error(error):
        return api_error(
            message='Permission denied',
            code='FORBIDDEN',
            status_code=403
        )

    @app.errorhandler(404)
    def not_found_error(error):
        return api_error(
            message='Resource not found',
            code='NOT_FOUND',
            status_code=404
        )

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        return api_error(
            message='Method not allowed',
            code='METHOD_NOT_ALLOWED',
            status_code=405
        )

    @app.errorhandler(409)
    def conflict_error(error):
        return api_error(
            message=str(error.description) if hasattr(error, 'description') else 'Conflict',
            code='CONFLICT',
            status_code=409
        )

    @app.errorhandler(422)
    def unprocessable_error(error):
        return api_error(
            message=str(error.description) if hasattr(error, 'description') else 'Unprocessable entity',
            code='UNPROCESSABLE_ENTITY',
            status_code=422
        )

    @app.errorhandler(429)
    def rate_limit_error(error):
        return api_error(
            message='Too many requests. Please slow down.',
            code='RATE_LIMITED',
            status_code=429
        )

    @app.errorhandler(500)
    def internal_error(error):
        logger.exception('Internal server error')
        return api_error(
            message='An unexpected error occurred',
            code='INTERNAL_ERROR',
            status_code=500
        )

    @app.errorhandler(Exception)
    def handle_exception(error):
        """Catch-all for unhandled exceptions."""
        logger.exception(f'Unhandled exception: {error}')
        return api_error(
            message='An unexpected error occurred',
            code='INTERNAL_ERROR',
            status_code=500
        )


def register_request_hooks(app):
    """
    Register before/after request hooks for correlation and logging.
    """

    @app.before_request
    def before_request():
        """Inject correlation ID and log request."""
        # Get or generate request ID
        g.request_id = request.headers.get('X-Request-ID') or \
                       request.headers.get('X-Correlation-ID') or \
                       str(uuid.uuid4())

        g.request_start_time = datetime.utcnow()

        # Log request (excluding health checks)
        if not request.path.startswith('/health') and not request.path.startswith('/metrics'):
            logger.info(
                f"REQUEST | {request.method} {request.path} | "
                f"request_id={g.request_id}"
            )

    @app.after_request
    def after_request(response):
        """Add correlation ID to response and log."""
        # Add correlation ID to response
        response.headers['X-Request-ID'] = getattr(g, 'request_id', 'unknown')

        # Calculate request duration
        start_time = getattr(g, 'request_start_time', None)
        if start_time:
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            response.headers['X-Response-Time'] = f'{duration_ms:.2f}ms'

            # Log response (excluding health checks)
            if not request.path.startswith('/health') and not request.path.startswith('/metrics'):
                logger.info(
                    f"RESPONSE | {request.method} {request.path} | "
                    f"status={response.status_code} | "
                    f"duration={duration_ms:.2f}ms | "
                    f"request_id={getattr(g, 'request_id', 'unknown')}"
                )

        return response


def init_middleware(app):
    """
    Initialize all middleware for the Flask app.
    Call this in create_app().
    """
    register_error_handlers(app)
    register_request_hooks(app)

    # Configure logging format
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
