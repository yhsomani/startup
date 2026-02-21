from functools import wraps
from flask import request, Response, jsonify
import time
import json
import os
from app.utils.response import error_response

# Redis client for rate limiting
try:
    import redis
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', '6379')),
        password=os.getenv('REDIS_PASSWORD'),
        db=0,
        decode_responses=True
    )
    redis_client.ping()
except ImportError:
    redis_client = None

def get_client_ip():
    """Get client IP address"""
    return request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)

def rate_limit(requests=100, window=60):
    """Decorator to implement rate limiting with headers"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not redis_client:
                # Skip rate limiting if Redis is not available
                return f(*args, **kwargs)

            client_ip = get_client_ip()
            key = f"rate_limit:{client_ip}:{request.endpoint or 'default'}"

            current_time = int(time.time())
            window_start = current_time - window

            # Clean old entries and check current count
            pipe = redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zcard(key)
            pipe.zadd(key, {str(current_time): str(current_time)})
            pipe.expire(key, window)
            results = pipe.execute()

            current_requests = results[1]  # zcard result

            # Calculate remaining requests and reset time
            remaining = max(0, requests - current_requests)
            reset_time = current_time + window

            # Create response
            response = f(*args, **kwargs)

            # Handle different response types
            if isinstance(response, tuple):
                data, status_code = response
                response_obj = jsonify(data) if not isinstance(data, Response) else data
            elif isinstance(response, Response):
                response_obj = response
            else:
                response_obj = jsonify(response)
                status_code = 200

            # Add rate limiting headers
            response_obj.headers['X-RateLimit-Limit'] = str(requests)
            response_obj.headers['X-RateLimit-Remaining'] = str(remaining)
            response_obj.headers['X-RateLimit-Reset'] = str(reset_time)

            # Return 429 if rate limit exceeded
            if current_requests >= requests:
                response_obj = error_response(
                    'RATE_LIMIT_EXCEEDED',
                    f'Rate limit exceeded. Maximum {requests} requests per {window} seconds.',
                    {
                        'limit': requests,
                        'window': window,
                        'resetTime': reset_time
                    },
                    status_code=429
                )
                return response_obj, 429

            if isinstance(response, tuple):
                response_obj.status_code = status_code

            return response_obj

        return decorated_function
    return decorator
