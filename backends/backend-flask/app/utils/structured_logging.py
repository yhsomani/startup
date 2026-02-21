"""
Structured logging configuration for TalentSphere
"""
import logging
import json
import sys
from datetime import datetime
from typing import Dict, Any


class StructuredLogger:
    """Structured logger for consistent log formatting"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup log handlers"""
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(self._get_formatter())
        self.logger.addHandler(console_handler)
        
        # File handler (in production)
        try:
            file_handler = logging.FileHandler('talentsphere.log')
            file_handler.setFormatter(self._get_formatter())
            self.logger.addHandler(file_handler)
        except Exception:
            pass  # Fail gracefully if file logging not possible
    
    def _get_formatter(self) -> logging.Formatter:
        """Get log formatter"""
        return logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    def info(self, message: str, **kwargs):
        """Log info message with optional context"""
        context = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'INFO',
            'message': message,
            **kwargs
        }
        self.logger.info(json.dumps(context))
    
    def error(self, message: str, error: Exception = None, **kwargs):
        """Log error message with optional context"""
        context = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'ERROR',
            'message': message,
            'error_type': type(error).__name__ if error else None,
            'error_message': str(error) if error else None,
            **kwargs
        }
        self.logger.error(json.dumps(context))
    
    def warning(self, message: str, **kwargs):
        """Log warning message with optional context"""
        context = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'WARNING',
            'message': message,
            **kwargs
        }
        self.logger.warning(json.dumps(context))
    
    def debug(self, message: str, **kwargs):
        """Log debug message with optional context"""
        context = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': 'DEBUG',
            'message': message,
            **kwargs
        }
        self.logger.debug(json.dumps(context))


def setup_app_logging(app_name: str = 'talentsphere') -> StructuredLogger:
    """Setup application logging"""
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    return StructuredLogger(app_name)


def log_request(method: str, path: str, status_code: int, 
                response_time: float = 0, user_id: str = None):
    """Log HTTP request"""
    logger = StructuredLogger('request')
    
    logger.info('HTTP Request', 
               method=method, 
               path=path, 
               status_code=status_code,
               response_time=response_time,
               user_id=user_id)


def log_error(endpoint: str, error: Exception, user_id: str = None):
    """Log application error"""
    logger = StructuredLogger('error')
    
    logger.error('Application Error',
                endpoint=endpoint,
                error_type=type(error).__name__,
                error_message=str(error),
                user_id=user_id)


def log_performance(operation: str, duration: float, metadata: Dict[str, Any] = None):
    """Log performance metrics"""
    logger = StructuredLogger('performance')
    
    logger.info('Performance Metric',
                operation=operation,
                duration=duration,
                metadata=metadata or {})


# Create default logger instance
default_logger = StructuredLogger('talentsphere')