"""
Security utilities and middleware for TalentSphere Flask application
"""
from functools import wraps
from flask import request, jsonify, g, session
import time
import secrets
import json
import re
from typing import Optional
from app.utils.response import error_response


class SecurityMiddleware:
    """Security middleware for rate limiting and input validation"""
    
    def __init__(self, app=None):
        self.app = app
        self.rate_limit_store = {}  # In-memory store for development
        
    def rate_limit_by_user(self, requests=100, window=3600):
        """Rate limiting by user ID with sliding window"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                user_id = getattr(g, 'user_id', None)

                if not user_id:
                    return f(*args, **kwargs)

                # Check rate limit with sliding window
                if self._is_rate_limited(user_id, requests, window):
                    return jsonify({
                        'error': 'RATE_LIMIT_EXCEEDED',
                        'message': f'Rate limit exceeded. Max {requests} per {window}s.',
                        'retry_after': window,
                        'reset_time': int(time.time()) + window
                    }), 429

                # Record this request
                self._record_request(user_id, window)

                return f(*args, **kwargs)
            return decorated_function
        return decorator
    
    def _is_rate_limited(self, user_id: str, max_requests: int, window: int) -> bool:
        """Check if user has exceeded rate limit with sliding window"""
        current_time = time.time()
        window_start = current_time - window
        
        # Clean old entries outside sliding window
        if user_id not in self.rate_limit_store:
            self.rate_limit_store[user_id] = []
        
        # Remove old requests outside sliding window
        self.rate_limit_store[user_id] = [
            req_time for req_time in self.rate_limit_store[user_id] 
            if req_time > window_start
        ]
        
        # Check if limit exceeded
        return len(self.rate_limit_store[user_id]) >= max_requests
    
    def _record_request(self, user_id: str, window: int):
        """Record a user request with timestamp"""
        current_time = time.time()
        if user_id not in self.rate_limit_store:
            self.rate_limit_store[user_id] = []
        
        self.rate_limit_store[user_id].append(current_time)
        
    def validate_input(self, data, max_length=None):
        """Validate input data against common attacks"""
        if not data:
            return None

        # Validate data length
        if max_length:
            json_str = json.dumps(data)
            if len(json_str) > max_length:
                return error_response(
                    'INPUT_TOO_LARGE',
                    f'Input exceeds max length of {max_length}',
                    {'max_length': max_length, 'actual_length': len(json_str)}
                ), 413

        # Validate against injection
        if self._contains_injection_attempts(data):
            return error_response('INVALID_INPUT', 'Invalid input detected'), 400

        return None
        
    def _contains_injection_attempts(self, data):
        """Check for common injection patterns"""
        if not isinstance(data, (str, dict)):
            return False

        # Convert to string for analysis
        data_str = json.dumps(data) if isinstance(data, dict) else str(data)

        # SQL Injection patterns
        sql_patterns = [
            r'(?i)\b(select|insert|update|delete|drop|union|exec|script)\b',
            r'(?i)(\'|\"|;|--|\/\*|\*)',
            r'(?i)(or|and)\s+\d+\s*=\s*\d+'
        ]

        # XSS patterns
        xss_patterns = [
            r'(?i)<script[^>]*>.*?</script>',
            r'(?i)javascript:',
            r'(?i)on\w+\s*='
        ]

        # Check all patterns
        all_patterns = sql_patterns + xss_patterns

        for pattern in all_patterns:
            if re.search(pattern, data_str):
                return True

        return False

    def encrypt_data(data: str, key: str) -> str:
        """Encrypt data with proper error handling"""
        try:
            from cryptography.fernet import Fernet  # type: ignore
            f = Fernet(key.encode())
            encrypted_data = f.encrypt(data.encode())
            return encrypted_data.decode()
        except ImportError:
            # Fallback to simple encoding if cryptography not available
            try:
                import base64
                return base64.b64encode(data.encode()).decode()
            except Exception:
                return ""

    def decrypt_data(encrypted_data: str, key: str) -> str:
        """Decrypt data with proper error handling"""
        try:
            from cryptography.fernet import Fernet  # type: ignore
            f = Fernet(key.encode())
            decrypted_data = f.decrypt(encrypted_data.encode())
            return decrypted_data.decode()
        except ImportError:
            # Fallback to simple decoding if cryptography not available
            try:
                import base64
                result = base64.b64decode(encrypted_data.encode()).decode()
                return result if result else ""
            except Exception:
                return ""


def generate_csrf_token() -> str:
    """Generate CSRF token"""
    return secrets.token_urlsafe(32)


def validate_csrf_token(token: str) -> bool:
    """Validate CSRF token"""
    session_token = session.get('csrf_token')
    return bool(session_token and token == session_token)


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Secure password hashing"""
    import hashlib
    import secrets

    if salt is None:
        salt = secrets.token_hex(16)

    # Use SHA-256 for password hashing
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return password_hash, salt


# Global security middleware instance
security_middleware = SecurityMiddleware()