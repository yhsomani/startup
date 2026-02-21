"""
Role-based access control decorators for Flask routes.
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(*allowed_roles):
    """
    Decorator that requires the current user to have one of the specified roles.

    Usage:
        @app.route('/api/admin')
        @role_required('ADMIN')
        def admin_endpoint():
            return jsonify({'message': 'Admin only'})

        @app.route('/api/instructor')
        @role_required('INSTRUCTOR', 'ADMIN')
        def instructor_endpoint():
            return jsonify({'message': 'Instructors and admins'})
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get('role', '').upper()

            # ADMIN has access to everything
            if user_role == 'ADMIN':
                return fn(*args, **kwargs)

            # Check if user has one of the allowed roles
            allowed_upper = [r.upper() for r in allowed_roles]
            if user_role not in allowed_upper:
                return jsonify({
                    'message': 'Access denied. Required role: ' + ', '.join(allowed_roles),
                    'currentRole': user_role
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator

def instructor_required(fn):
    """Shortcut decorator for instructor-only routes."""
    return role_required('INSTRUCTOR', 'ADMIN')(fn)

def admin_required(fn):
    """Shortcut decorator for admin-only routes."""
    return role_required('ADMIN')(fn)

def recruiter_required(fn):
    """Shortcut decorator for recruiter-only routes."""
    return role_required('RECRUITER', 'ADMIN')(fn)

def student_required(fn):
    """Shortcut decorator for student-only routes."""
    return role_required('STUDENT', 'ADMIN')(fn)
