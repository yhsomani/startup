#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
MONITORING_INTERVAL=300  # 5 minutes
LOG_FILE="/var/log/talentsphere/monitoring.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
DISCORD_WEBHOOK_URL="$DISCORD_WEBHOOK_URL"
SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Function to check system metrics
check_system_metrics() {
    log_message "INFO" "Checking system metrics..."
    
    # CPU Usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1%/p/" | head -1)
    log_message "INFO" "CPU Usage: $CPU_USAGE%"
    
    # Memory Usage
    MEMORY_INFO=$(free | grep Mem)
    MEMORY_USAGE=$(echo "$MEMORY_INFO" | awk '{printf("%.2f", $3/$2 * 100.0)}')
    log_message "INFO" "Memory Usage: $MEMORY_USAGE%"
    
    # Disk Usage
    DISK_USAGE=$(df -h / | awk 'NR==1{print $5}' | sed 's/%//')
    log_message "INFO" "Disk Usage: $DISK_USAGE%"
    
    # Check thresholds
    check_thresholds "$CPU_USAGE" "$MEMORY_USAGE" "$DISK_USAGE"
}

# Function to check thresholds and send alerts
check_thresholds() {
    local cpu=$1
    local memory=$2
    local disk=$3
    
    local alert_message=""
    local alert_level="warning"
    
    # Check CPU threshold
    if (( $(echo "$cpu > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        alert_message="$alert_message🔴 CPU Usage High: $cpu%\n"
        alert_level="critical"
    fi
    
    # Check Memory threshold
    if (( $(echo "$memory > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        alert_message="$alert_message🔴 Memory Usage High: $memory%\n"
        alert_level="critical"
    fi
    
    # Check Disk threshold
    if (( $(echo "$disk > $ALERT_THRESHOLD_DISK" | bc -l) )); then
        alert_message="$alert_message🔴 Disk Usage High: $disk%\n"
        alert_level="critical"
    fi
    
    # Send alert if needed
    if [ -n "$alert_message" ]; then
        log_message "ALERT" "Threshold exceeded - $alert_level"
        send_alert "$alert_message" "$alert_level"
    fi
}

# Function to send alerts to multiple channels
send_alert() {
    local message=$1
    local level=$2
    
    local full_message="🚨 TalentSphere Alert [$level]\n$message"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log the alert
    log_message "ALERT" "$message"
    
    # Send to Slack
    if [ -n "$SLACK_WEBHOOK_URL" ] && [ "$level" = "critical" ]; then
        curl -X POST -H 'Content-Type: application/json' \
             -d "{\"text\": \"$full_message\", \"attachments\": [{\"color\": \"danger\", \"title\": \"🚨 Critical Alert\", \"text\": \"$message\", \"timestamp\": \"$timestamp\"}]}" \
             "$SLACK_WEBHOOK_URL" 2>/dev/null && \
            log_message "INFO" "Slack alert sent successfully"
    fi
    
    # Send to Discord
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-Type: application/json' \
             -d "{\"content\": \"$full_message\", \"embeds\": [{\"title\": \"🚨 TalentSphere Alert\", \"description\": \"$message\", \"color\": \"$([ "$level" = "critical" ] && echo "16711680" || echo "16776960")\" \"timestamp\": \"$timestamp\"}]}" \
             "$DISCORD_WEBHOOK_URL" 2>/dev/null && \
            log_message "INFO" "Discord alert sent successfully"
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    
    if curl -s "$url" > /dev/null; then
        log_message "INFO" "$service_name: Healthy"
        return 0
    else
        log_message "ERROR" "$service_name: Unhealthy"
        send_alert "🔴 Service $service_name is not responding\nService URL: $url" "critical"
        return 1
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    log_message "INFO" "Checking API endpoints..."
    
    local endpoints=(
        "https://api.talentsphere.com/auth/health"
        "https://api.talentsphere.com/courses/health"
        "https://api.talentsphere.com/challenges/health"
        "https://api.talentsphere.com/ai/health"
        "https://api.talentsphere.com/monitor/health"
    )
    
    local unhealthy_count=0
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -s "$endpoint" > /dev/null; then
            unhealthy_count=$((unhealthy_count + 1))
            log_message "ERROR" "Unhealthy endpoint: $(basename $endpoint)"
        fi
    done
    
    if [ $unhealthy_count -gt 0 ]; then
        send_alert "🔴 $unhealthy_count API endpoints are unhealthy\nCheck logs for details" "critical"
    fi
    
    log_message "INFO" "API health check completed. Unhealthy endpoints: $unhealthy_count"
}

# Function to check application performance
check_performance() {
    log_message "INFO" "Checking application performance..."
    
    # Test response times
    local endpoints=(
        "https://talentsphere.com"
        "https://api.talentsphere.com/auth/health"
        "https://api.talentsphere.com/courses/health"
    )
    
    local slow_responses=0
    
    for endpoint in "${endpoints[@]}"; do
        local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$endpoint")
        log_message "INFO" "Response time for $(basename $endpoint): ${response_time}s"
        
        # Consider slow if > 2 seconds
        if (( $(echo "$response_time > 2.0" | bc -l) )); then
            slow_responses=$((slow_responses + 1))
            log_message "WARNING" "Slow response time: $(basename $endpoint) - ${response_time}s"
        fi
    done
    
    if [ $slow_responses -gt 0 ]; then
        send_alert "⚠️ Performance issues detected\n$slow_responses endpoints have slow response times" "warning"
    fi
    
    log_message "INFO" "Performance check completed. Slow endpoints: $slow_responses"
}

# Function to generate daily report
generate_daily_report() {
    local report_file="/var/log/talentsphere/daily_report_$(date +%Y-%m-%d).txt"
    
    log_message "INFO" "Generating daily report..."
    
    {
        echo "📊 TalentSphere Daily Report - $(date +%Y-%m-%d)"
        echo "=================================="
        echo ""
        echo "System Metrics:"
        check_system_metrics | tail -10
        echo ""
        echo "Service Health:"
        check_service_health "TalentSphere" "https://talentsphere.com"
        check_api_endpoints | tail -10
        echo ""
        echo "Performance Metrics:"
        check_performance | tail -10
        echo ""
        echo "Alert Summary (24h):"
        grep "ALERT" "$LOG_FILE" | tail -20 || echo "No alerts in last 24 hours"
        echo ""
        echo "Generated at: $(date)"
    } > "$report_file"
    
    log_message "INFO" "Daily report generated: $report_file"
    
    # Send report via email
    if command -v mail > /dev/null; then
        cat "$report_file" | mail -s "TalentSphere Daily Report" team@talentsphere.com
        log_message "INFO" "Daily report sent via email"
    fi
}

# Function to check for stale sessions
check_stale_sessions() {
    log_message "INFO" "Checking for stale sessions..."
    
    # This would typically connect to Redis or database
    # For now, simulate the check
    local stale_sessions=$(find /tmp -name "ts_session_*" -mtime +1 -mtime -1 2>/dev/null | wc -l)
    
    if [ $stale_sessions -gt 100 ]; then
        log_message "WARNING" "High number of stale sessions detected: $stale_sessions"
        send_alert "⚠️ Maintenance required: $stale_sessions stale sessions found" "warning"
    else
        log_message "INFO" "Stale sessions check completed: $stale_sessions"
    fi
}

# Main monitoring loop
start_monitoring() {
    log_message "INFO" "Starting production monitoring..."
    log_message "INFO" "Monitoring interval: ${MONITORING_INTERVAL}s"
    
    while true; do
        # Run all checks
        check_system_metrics
        check_api_endpoints
        check_performance
        check_stale_sessions
        
        # Generate daily report at midnight
        if [ "$(date +%H%M)" = "0000" ]; then
            generate_daily_report
        fi
        
        # Wait for next iteration
        sleep "$MONITORING_INTERVAL"
    done
}

# Function to handle graceful shutdown
cleanup() {
    log_message "INFO" "Monitoring service shutting down gracefully..."
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Check command line arguments
case "${1:-start}" in
    "start")
        start_monitoring
        ;;
    "check")
        check_system_metrics
        check_api_endpoints
        check_performance
        ;;
    "report")
        generate_daily_report
        ;;
    *)
        echo "Usage: $0 {start|check|report}"
        echo "  start  - Start continuous monitoring"
        echo "  check   - Run one-time health check"
        echo "  report  - Generate daily report"
        exit 1
        ;;
esac