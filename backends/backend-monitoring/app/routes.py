from flask import Blueprint, jsonify, current_app
from prometheus_client import Collector, REGISTRY, Gauge, Counter, Histogram, generate_latest
from prometheus_client.exposition import generate_latest
import time
import psutil
import threading
from app.utils.response import standard_response

monitor_bp = Blueprint('monitor', __name__)

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration in seconds', ['method', 'endpoint'])
ACTIVE_USERS = Gauge('active_users_total', 'Total active users')
ERROR_COUNT = Counter('errors_total', 'Total errors', ['type', 'endpoint'])
SYSTEM_CPU = Gauge('system_cpu_usage_percent', 'System CPU usage')
SYSTEM_MEMORY = Gauge('system_memory_usage_bytes', 'System memory usage')
DATABASE_CONNECTIONS = Gauge('database_connections_active', 'Active database connections')
CACHE_HIT_RATE = Gauge('cache_hit_rate', 'Cache hit rate')

class SystemMetrics:
    """System metrics collection"""
    
    def __init__(self):
        self.start_time = time.time()
        self.metrics_data = {}
        
    def collect_system_metrics(self):
        """Collect system-level metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            SYSTEM_CPU.set(cpu_percent)
            
            # Memory usage
            memory = psutil.virtual_memory()
            SYSTEM_MEMORY.set(memory.used)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network I/O
            network = psutil.net_io_counters()
            
            self.metrics_data = {
                'timestamp': time.time(),
                'cpu_percent': cpu_percent,
                'memory_used': memory.used,
                'memory_total': memory.total,
                'memory_percent': (memory.used / memory.total) * 100,
                'disk_used': disk.used,
                'disk_total': disk.total,
                'network_bytes_sent': network.bytes_sent,
                'network_bytes_recv': network.bytes_recv,
                'uptime': time.time() - self.start_time
            }
            
            return self.metrics_data
        except Exception as e:
            print(f"Error collecting system metrics: {e}")
            return None

class AlertManager:
    """Alert management system"""
    
    def __init__(self):
        self.alerts = []
        self.alert_history = []
        
    def check_alert_conditions(self, metrics_data):
        """Check for alert conditions"""
        alerts = []
        
        # CPU usage alert
        if metrics_data and metrics_data.get('cpu_percent', 0) > 80:
            alerts.append({
                'type': 'cpu_high',
                'severity': 'warning',
                'message': f"CPU usage is {metrics_data['cpu_percent']:.1f}%",
                'timestamp': time.time(),
                'value': metrics_data['cpu_percent']
            })
        
        # Memory usage alert
        if metrics_data and metrics_data.get('memory_percent', 0) > 85:
            alerts.append({
                'type': 'memory_high',
                'severity': 'critical',
                'message': f"Memory usage is {metrics_data['memory_percent']:.1f}%",
                'timestamp': time.time(),
                'value': metrics_data['memory_percent']
            })
        
        # Disk space alert
        if metrics_data and metrics_data.get('disk_total', 0) > 0:
            disk_usage_percent = (metrics_data['disk_used'] / metrics_data['disk_total']) * 100
            if disk_usage_percent > 90:
                alerts.append({
                    'type': 'disk_full',
                    'severity': 'critical',
                    'message': f"Disk usage is {disk_usage_percent:.1f}%",
                    'timestamp': time.time(),
                    'value': disk_usage_percent
                })
        
        return alerts
    
    def send_alert(self, alert):
        """Send alert notification"""
        # Store in history
        self.alert_history.append(alert)
        
        # Keep only last 100 alerts
        if len(self.alert_history) > 100:
            self.alert_history = self.alert_history[-100:]
        
        # Log alert
        import logging
        logger = logging.getLogger('alerts')
        logger.warning(f"ALERT: {alert['type']} - {alert['message']}")
        
        # In production, send to external monitoring service
        # Example: Slack webhook, PagerDuty, etc.
        self.send_to_external_service(alert)
    
    def send_to_external_service(self, alert):
        """Send alert to external monitoring service"""
        import requests
        
        webhook_url = current_app.config.get('ALERT_WEBHOOK_URL')
        if not webhook_url:
            return
        
        payload = {
            'text': f"🚨 TalentSphere Alert: {alert['type'].upper()}",
            'attachments': [{
                'color': self._get_alert_color(alert['severity']),
                'fields': [
                    {'title': 'Alert Type', 'value': alert['type'], 'short': True},
                    {'title': 'Severity', 'value': alert['severity'], 'short': True},
                    {'title': 'Message', 'value': alert['message']},
                    {'title': 'Timestamp', 'value': datetime.fromtimestamp(alert['timestamp']).isoformat(), 'short': True}
                ]
            }]
        }
        
        try:
            requests.post(webhook_url, json=payload, timeout=10)
        except Exception as e:
            print(f"Failed to send alert to webhook: {e}")
    
    def _get_alert_color(self, severity):
        """Get color for alert severity"""
        colors = {
            'info': 'good',
            'warning': 'warning',
            'critical': 'danger'
        }
        return colors.get(severity, 'warning')

# Initialize metrics collector
system_metrics = SystemMetrics()
alert_manager = AlertManager()

@monitor_bp.route('/metrics', methods=['GET'])
@standard_response
def get_metrics():
    """Get system metrics"""
    metrics = system_metrics.collect_system_metrics()
    return metrics

@monitor_bp.route('/alerts', methods=['GET'])
@standard_response
def get_alerts():
    """Get recent alerts"""
    return {
        'alerts': alert_manager.alert_history[-20:],  # Last 20 alerts
        'alert_count': len(alert_manager.alert_history)
    }

@monitor_bp.route('/health', methods=['GET'])
@standard_response
def health_check():
    """Comprehensive health check"""
    health_status = {
        'status': 'healthy',
        'timestamp': time.time(),
        'version': '2.3.0',
        'uptime': time.time() - system_metrics.start_time,
        'checks': {}
    }
    
    checks = health_status['checks']
    
    # Database health check
    try:
        from app.extensions import db
        db.engine.execute("SELECT 1")
        checks['database'] = 'healthy'
    except Exception:
        checks['database'] = 'unhealthy'
        health_status['status'] = 'degraded'
    
    # Redis health check
    try:
        from app.utils.rate_limiting import redis_client
        if redis_client:
            redis_client.ping()
            checks['redis'] = 'healthy'
        else:
            checks['redis'] = 'disabled'
    except Exception:
        checks['redis'] = 'unhealthy'
        if health_status['status'] == 'healthy':
            health_status['status'] = 'degraded'
    
    # External service checks
    services = ['openai_api', 'email_service']
    for service in services:
        try:
            if service == 'openai_api':
                # Check OpenAI API key
                import os
                if os.getenv('OPENAI_API_KEY'):
                    checks[service] = 'healthy'
                else:
                    checks[service] = 'misconfigured'
        except:
            checks[service] = 'unhealthy'
    
    return health_status

# Metrics collection middleware
def before_request():
    """Collect metrics for each request"""
    g.start_time = time.time()
    REQUEST_COUNT.labels(method=request.method, endpoint=request.endpoint or 'unknown', status='pending').inc()

def after_request(response):
    """Process metrics after request"""
    if hasattr(g, 'start_time'):
        duration = time.time() - g.start_time
        REQUEST_DURATION.labels(method=request.method, endpoint=request.endpoint or 'unknown').observe(duration)
        
        status = response.status_code
        REQUEST_COUNT.labels(method=request.method, endpoint=request.endpoint or 'unknown', status=str(status)).inc()
        
        if status >= 400:
            ERROR_COUNT.labels(type='http_error', endpoint=request.endpoint or 'unknown').inc()
        
        # Add response headers
        response.headers['X-Response-Time'] = str(duration)
        response.headers['X-Request-ID'] = getattr(g, 'request_id', 'unknown')

# Background metrics collector
def collect_metrics_periodically():
    """Collect metrics periodically in background"""
    while True:
        try:
            metrics = system_metrics.collect_system_metrics()
            alerts = alert_manager.check_alert_conditions(metrics)
            
            for alert in alerts:
                alert_manager.send_alert(alert)
            
            time.sleep(30)  # Check every 30 seconds
            
        except Exception as e:
            print(f"Error in metrics collection: {e}")
            time.sleep(60)  # Wait longer on error

# Start background thread
metrics_thread = threading.Thread(target=collect_metrics_periodically, daemon=True)
metrics_thread.start()

# Expose metrics
@monitor_bp.route('/prometheus', methods=['GET'])
def prometheus_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest(REGISTRY)

# Health check for load balancers
@monitor_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint for load balancers"""
    return jsonify({'status': 'ok', 'timestamp': time.time()})