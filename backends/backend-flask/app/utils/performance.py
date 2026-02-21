"""
Performance optimization utilities for TalentSphere Flask application
"""
from functools import wraps
import json
import hashlib
import os
from datetime import datetime, timedelta

try:
    import redis
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', '6379')),
        password=os.getenv('REDIS_PASSWORD'),
        db=0,
        decode_responses=True,
        socket_timeout=5,
        retry_on_timeout=True,
        socket_keepalive=True,
        max_connections=20
    )
    REDIS_AVAILABLE = True
except ImportError:
    redis_client = None
    REDIS_AVAILABLE = False


def create_cache_key(endpoint: str, **kwargs) -> str:
    """Create consistent cache key"""
    # Sort kwargs to ensure consistent key generation
    sorted_kwargs = sorted(kwargs.items())
    key_parts = [endpoint] + [f"{value}" for key, value in sorted_kwargs]
    return ":".join(key_parts)


def rate_limit_key(user_id: str) -> str:
    """Generate rate limit key for user"""
    return f"rate_limit:{user_id}"


def cache_response(timeout: int = 300):
    """Decorator to cache API responses with proper error handling"""
    def decorator(func):
        @wraps(func)
        def decorated_function(*args, **kwargs):
            if not REDIS_AVAILABLE:
                # If Redis is not available, just execute the function
                return func(*args, **kwargs)
                
            try:
                # Create cache key from request data
                cache_key = create_cache_key(func.__name__, **kwargs)
                
                # Try to get from cache
                cached = redis_client.get(cache_key)
                if cached:
                    return cached
                
                # If not in cache, proceed with function and cache result
                result = func(*args, **kwargs)
                try:
                    # Convert to JSON for storage
                    json_result = json.dumps(result, default=str)
                    # Store in Redis with expiration
                    redis_client.setex(cache_key, json_result, ex=timeout)
                    return result
                except (TypeError, ValueError):
                    # Can't serialize result - return as-is
                    return result
                    
            except Exception as e:
                # Log cache error but don't break the application
                import logging
                logging.error(f"Cache error for {func.__name__}: {e}")
                return result if 'result' in locals() else func(*args, **kwargs)
                
        return decorated_function
    return decorator


def get_db():
    """Get database session"""
    from app.extensions import db
    return db.session


def rate_limit(requests: int = 100, window: int = 3600):
    """Rate limiting decorator"""
    def decorator(func):
        @wraps(func)
        def decorated_function(*args, **kwargs):
            if not REDIS_AVAILABLE:
                return func(*args, **kwargs)
                
            # Implementation would go here for rate limiting
            # This is a placeholder for now
            return func(*args, **kwargs)
        return decorated_function
    return decorator


class PerformanceMonitor:
    """Monitor and log performance metrics"""
    
    def __init__(self):
        self.metrics = {}
    
    def record_request_time(self, endpoint: str, duration: float):
        """Record request duration"""
        if endpoint not in self.metrics:
            self.metrics[endpoint] = {
                'count': 0,
                'total_time': 0,
                'avg_time': 0,
                'max_time': 0,
                'min_time': float('inf')
            }
        
        metrics = self.metrics[endpoint]
        metrics['count'] += 1
        metrics['total_time'] += duration
        metrics['avg_time'] = metrics['total_time'] / metrics['count']
        metrics['max_time'] = max(metrics['max_time'], duration)
        metrics['min_time'] = min(metrics['min_time'], duration)
    
    def get_metrics(self) -> dict:
        """Get performance metrics"""
        return self.metrics


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


def track_performance(func):
    """Decorator to track function performance"""
    @wraps(func)
    def decorated_function(*args, **kwargs):
        start_time = datetime.now()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            performance_monitor.record_request_time(func.__name__, duration)
    return decorated_function


def optimize_query(query, limit: int = 1000, offset: int = 0):
    """Optimize database query with pagination"""
    if hasattr(query, 'limit'):
        return query.limit(limit).offset(offset)
    return query


class CacheManager:
    """Manage caching operations"""
    
    def __init__(self):
        self.redis_available = REDIS_AVAILABLE
        self.redis_client = redis_client
    
    def get(self, key: str) -> any:
        """Get value from cache"""
        if not self.redis_available:
            return None
        try:
            return self.redis_client.get(key)
        except Exception:
            return None
    
    def set(self, key: str, value: any, timeout: int = 300) -> bool:
        """Set value in cache"""
        if not self.redis_available:
            return False
        try:
            json_value = json.dumps(value, default=str)
            return self.redis_client.setex(key, json_value, ex=timeout)
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.redis_available:
            return False
        try:
            return bool(self.redis_client.delete(key))
        except Exception:
            return False
    
    def clear_pattern(self, pattern: str) -> bool:
        """Clear keys matching pattern"""
        if not self.redis_available:
            return False
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return bool(self.redis_client.delete(*keys))
            return True
        except Exception:
            return False


# Global cache manager instance
cache_manager = CacheManager()