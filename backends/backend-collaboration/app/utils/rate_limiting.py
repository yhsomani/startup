from functools import wraps
from flask import request, jsonify
import time
import logging

logger = logging.getLogger(__name__)

# Simple in-memory rate limiting for development
# In production, use Redis-based rate limiting
_rate_limit_store = {}

def rate_limit(requests=10, window=60):
    """
    Rate limiting decorator
    requests: Maximum number of requests allowed
    window: Time window in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client identifier
            client_ip = request.remote_addr
            endpoint = request.endpoint
            
            # Create rate limit key
            key = f"{client_ip}:{endpoint}"
            
            # Get current time
            current_time = int(time.time())
            window_start = current_time - window
            
            # Clean up old entries
            if key in _rate_limit_store:
                _rate_limit_store[key] = [
                    timestamp for timestamp in _rate_limit_store[key]
                    if timestamp > window_start
                ]
            else:
                _rate_limit_store[key] = []
            
            # Check rate limit
            if len(_rate_limit_store[key]) >= requests:
                logger.warning(f"Rate limit exceeded for {client_ip} on {endpoint}")
                return jsonify({
                    'error': 'RATE_LIMIT_EXCEEDED',
                    'message': f'Rate limit exceeded. Maximum {requests} requests per {window} seconds.'
                }), 429
            
            # Add current request
            _rate_limit_store[key].append(current_time)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def cleanup_rate_limit_store():
    """
    Clean up old rate limit entries (call periodically)
    """
    global _rate_limit_store
    current_time = int(time.time())
    
    for key in list(_rate_limit_store.keys()):
        _rate_limit_store[key] = [
            timestamp for timestamp in _rate_limit_store[key]
            if current_time - timestamp < 3600  # Keep only last hour
        ]
        
        if not _rate_limit_store[key]:
            del _rate_limit_store[key]