"""
Response Caching Utilities

Provides caching decorators for API endpoints using Redis.
"""

import functools
import json
import hashlib
import logging
from typing import Callable, Any, Optional
from flask import request, Response, make_response

logger = logging.getLogger(__name__)

# Try to import redis, handle gracefully if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, caching disabled")


def get_redis_client() -> Optional['redis.Redis']:
    """Get Redis client instance."""
    if not REDIS_AVAILABLE:
        return None
    
    import os
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    try:
        return redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {e}")
        return None


def cache_response(ttl: int = 60, key_prefix: str = '') -> Callable:
    """
    Decorator to cache API responses in Redis.
    
    Args:
        ttl: Time to live in seconds (default: 60)
        key_prefix: Optional prefix for cache key
    
    Usage:
        @app.route('/api/courses')
        @cache_response(ttl=120, key_prefix='courses')
        def list_courses():
            ...
    """
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            redis_client = get_redis_client()
            
            # If Redis not available, just execute the function
            if not redis_client:
                return f(*args, **kwargs)
            
            # Build cache key from request path and query string
            cache_key = _build_cache_key(key_prefix or f.__name__)
            
            try:
                # Try to get from cache
                cached = redis_client.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit: {cache_key}")
                    response = make_response(cached)
                    response.headers['Content-Type'] = 'application/json'
                    response.headers['X-Cache'] = 'HIT'
                    return response
            except Exception as e:
                logger.warning(f"Redis get error: {e}")
            
            # Execute function
            result = f(*args, **kwargs)
            
            # Cache the result if it's a 200 response
            try:
                if isinstance(result, tuple):
                    response_data, status_code = result[0], result[1]
                else:
                    response_data, status_code = result, 200
                
                if status_code == 200:
                    # Handle different response types
                    if hasattr(response_data, 'get_json'):
                        cache_value = json.dumps(response_data.get_json())
                    elif isinstance(response_data, dict):
                        cache_value = json.dumps(response_data)
                    elif isinstance(response_data, str):
                        cache_value = response_data
                    else:
                        cache_value = str(response_data)
                    
                    redis_client.setex(cache_key, ttl, cache_value)
                    logger.debug(f"Cached: {cache_key} (TTL: {ttl}s)")
            except Exception as e:
                logger.warning(f"Redis set error: {e}")
            
            # Add cache miss header
            if isinstance(result, Response):
                result.headers['X-Cache'] = 'MISS'
            
            return result
        return decorated_function
    return decorator


def invalidate_cache(pattern: str) -> int:
    """
    Invalidate cache entries matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., 'courses:*')
    
    Returns:
        Number of keys deleted
    """
    redis_client = get_redis_client()
    if not redis_client:
        return 0
    
    try:
        keys = list(redis_client.scan_iter(match=f"cache:{pattern}"))
        if keys:
            return redis_client.delete(*keys)
    except Exception as e:
        logger.warning(f"Redis invalidate error: {e}")
    
    return 0


def _build_cache_key(prefix: str) -> str:
    """Build cache key from request details."""
    # Include path and sorted query string for uniqueness
    key_parts = [
        prefix,
        request.path,
        request.query_string.decode('utf-8')
    ]
    key_string = ':'.join(key_parts)
    
    # Hash long keys for Redis key size limits
    if len(key_string) > 200:
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"cache:{prefix}:{key_hash}"
    
    return f"cache:{key_string}"
