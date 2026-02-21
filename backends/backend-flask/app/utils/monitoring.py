"""
Monitoring dashboard configuration for TalentSphere
"""
import time
from typing import Dict, List, Any
from dataclasses import dataclass, asdict


@dataclass
class MetricsData:
    """Metrics data structure"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    error_rate: float = 0.0
    active_users: int = 0
    system_cpu: float = 0.0
    system_memory: float = 0.0


class MetricsCollector:
    """Collect and aggregate application metrics"""
    
    def __init__(self):
        self.metrics = MetricsData()
        self.request_times: List[float] = []
        self.error_log: List[str] = []
        
    def record_request(self, success: bool, response_time: float):
        """Record a request"""
        self.metrics.total_requests += 1
        if success:
            self.metrics.successful_requests += 1
        else:
            self.metrics.failed_requests += 1
        
        self.request_times.append(response_time)
        
        # Update calculated metrics
        self._update_calculated_metrics()
    
    def _update_calculated_metrics(self):
        """Update calculated metrics"""
        if self.request_times:
            self.metrics.average_response_time = sum(self.request_times) / len(self.request_times)
        
        if self.metrics.total_requests > 0:
            self.metrics.error_rate = (
                self.metrics.failed_requests / self.metrics.total_requests
            ) * 100
    
    def record_error(self, error_message: str):
        """Record an error"""
        self.error_log.append(error_message)
        # Keep only last 100 errors
        if len(self.error_log) > 100:
            self.error_log = self.error_log[-100:]
    
    def update_system_metrics(self, cpu: float, memory: float):
        """Update system metrics"""
        self.metrics.system_cpu = cpu
        self.metrics.system_memory = memory
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get metrics summary"""
        return asdict(self.metrics)
    
    def get_health_status(self) -> str:
        """Get health status based on metrics"""
        if self.metrics.error_rate > 5:  # 5% error rate
            return "DEGRADED"
        elif self.metrics.error_rate > 2:  # 2% error rate
            return "WARNING"
        else:
            return "HEALTHY"


# Global metrics collector
metrics_collector = MetricsCollector()


def track_endpoint_performance(endpoint_name: str):
    """Decorator to track endpoint performance"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            success = False
            response_time = 0
            
            try:
                result = func(*args, **kwargs)
                success = True
                return result
            except Exception as e:
                # Log error
                metrics_collector.record_error(f"{endpoint_name}: {str(e)}")
                raise
            finally:
                response_time = time.time() - start_time
                metrics_collector.record_request(success, response_time)
                
            return wrapper
        return wrapper
    return decorator


def create_health_dashboard() -> Dict[str, Any]:
    """Create health dashboard data"""
    metrics = metrics_collector.get_metrics_summary()
    health_status = metrics_collector.get_health_status()
    
    return {
        'status': health_status,
        'timestamp': time.time(),
        'metrics': metrics,
        'recommendations': _get_recommendations(health_status, metrics)
    }


def _get_recommendations(status: str, metrics: Dict[str, Any]) -> List[str]:
    """Get system recommendations based on metrics"""
    recommendations = []
    
    if status == "DEGRADED":
        recommendations.extend([
            "Investigate increased error rate",
            "Check system resources",
            "Review recent error logs"
        ])
    elif status == "WARNING":
        recommendations.extend([
            "Monitor system performance",
            "Review application logs",
            "Consider scaling if trends continue"
        ])
    
    if metrics.get('average_response_time', 0) > 2.0:
        recommendations.append("Optimize slow endpoints")
    
    if metrics.get('system_cpu', 0) > 80:
        recommendations.append("Scale CPU resources")
    
    if metrics.get('system_memory', 0) > 90:
        recommendations.append("Scale memory resources")
    
    return recommendations


def log_metrics_to_file():
    """Log metrics to file for analysis"""
    import json
    dashboard_data = create_health_dashboard()
    
    try:
        with open('metrics.json', 'w') as f:
            json.dump(dashboard_data, f, indent=2)
    except Exception:
        pass  # Fail gracefully


if __name__ == "__main__":
    # Test metrics collection
    metrics_collector.record_request(True, 0.5)
    metrics_collector.record_request(True, 1.2)
    metrics_collector.record_request(False, 0.3)
    metrics_collector.record_error("Test error message")
    
    dashboard = create_health_dashboard()
    print("Health Dashboard Data:")
    print(json.dumps(dashboard, indent=2))