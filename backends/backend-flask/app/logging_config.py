"""
Logging Configuration for TalentSphere Flask Backend

Provides structured JSON logging for production and readable format for development.
"""

import logging
import logging.handlers
import sys
import os
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import uuid


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: Dict[str, Any] = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add correlation ID if present
        if hasattr(record, 'correlation_id'):
            log_data['correlation_id'] = record.correlation_id
        
        # Add request context if present
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'path'):
            log_data['path'] = record.path
        if hasattr(record, 'method'):
            log_data['method'] = record.method
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra'):
            log_data['extra'] = record.extra
        
        return json.dumps(log_data)


class CorrelationFilter(logging.Filter):
    """Filter that adds correlation ID to log records."""
    
    def __init__(self, default_correlation_id: Optional[str] = None):
        super().__init__()
        self.default_correlation_id = default_correlation_id
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Add correlation_id to record if not present."""
        if not hasattr(record, 'correlation_id'):
            # Try to get from Flask's g object
            try:
                from flask import g, has_request_context
                if has_request_context() and hasattr(g, 'correlation_id'):
                    record.correlation_id = g.correlation_id
                else:
                    record.correlation_id = self.default_correlation_id or str(uuid.uuid4())[:8]
            except ImportError:
                record.correlation_id = self.default_correlation_id or str(uuid.uuid4())[:8]
        return True


def setup_logging(
    app_name: str = 'talentsphere',
    log_level: Optional[str] = None,
    log_format: Optional[str] = None
) -> logging.Logger:
    """
    Configure logging for the application.
    
    Args:
        app_name: Name of the application/service
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Log format ('json' for production, 'text' for development)
    
    Returns:
        Configured logger instance
    """
    # Get configuration from environment if not provided
    log_level = log_level or os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_format = log_format or os.environ.get('LOG_FORMAT', 'text').lower()
    is_production = os.environ.get('FLASK_ENV', 'development') == 'production'
    
    # Default to JSON in production
    if is_production and log_format != 'text':
        log_format = 'json'
    
    # Get the root logger
    logger = logging.getLogger(app_name)
    logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Remove existing handlers
    logger.handlers = []
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Add correlation filter
    correlation_filter = CorrelationFilter()
    console_handler.addFilter(correlation_filter)
    
    # Set formatter based on format preference
    if log_format == 'json':
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(correlation_id)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Add file handler in production
    if is_production:
        log_dir = os.environ.get('LOG_DIR', '/var/log/talentsphere')
        if os.path.exists(log_dir) or os.makedirs(log_dir, exist_ok=True):
            file_handler = logging.handlers.RotatingFileHandler(
                os.path.join(log_dir, f'{app_name}.log'),
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
            file_handler.setLevel(logging.INFO)
            file_handler.addFilter(correlation_filter)
            file_handler.setFormatter(JSONFormatter())
            logger.addHandler(file_handler)
    
    # Suppress noisy loggers
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(f'talentsphere.{name}')


# Request logging middleware
def log_request_info() -> None:
    """Log request information at the start of each request."""
    from flask import request, g
    import time
    
    # Generate correlation ID
    g.correlation_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4())[:8])
    g.request_start_time = time.time()
    
    logger = get_logger('request')
    logger.info(
        f"Request started: {request.method} {request.path}",
        extra={
            'extra': {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.user_agent.string
            }
        }
    )


def log_response_info(response):
    """Log response information at the end of each request."""
    from flask import request, g
    import time
    
    duration = time.time() - getattr(g, 'request_start_time', time.time())
    
    logger = get_logger('request')
    logger.info(
        f"Request completed: {request.method} {request.path} -> {response.status_code}",
        extra={
            'extra': {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2)
            }
        }
    )
    
    # Add correlation ID to response headers
    response.headers['X-Correlation-ID'] = getattr(g, 'correlation_id', 'unknown')
    
    return response
