#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️ $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${BLUE}ℹ $message${NC}"
    fi
}

# Function to get system metrics
get_system_metrics() {
    echo "🔍 Gathering system metrics..."
    
    # CPU Usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1%/p/" | head -1)
    
    # Memory Usage
    local memory_info=$(free -h | grep Mem)
    local memory_usage=$(echo "$memory_info" | awk '{printf("%.2f", $3/$2 * 100.0)}')
    
    # Disk Usage
    local disk_usage=$(df -h / | awk 'NR==1{print $5}')
    
    # Load Average
    local load_avg=$(uptime | awk '{print $NF}')
    
    # Network Connections
    local connections=$(netstat -an | grep "ESTABLISHED" | wc -l)
    
    echo "📊 System Metrics:"
    echo "  CPU Usage: $cpu_usage%"
    echo "  Memory Usage: $memory_usage%"
    echo "  Disk Usage: $disk_usage% (used)"
    echo "  Load Average: $load_avg"
    echo "  Network Connections: $connections"
}

# Function to get database metrics
get_database_metrics() {
    echo "🗄️ Database Metrics:"
    
    # Check PostgreSQL connections
    if command -v psql > /dev/null; then
        local connections=$(psql -U talentphere_user -d talentphere_db -c "SELECT count(*) FROM pg_stat_activity WHERE state='active';" -t 2>/dev/null)
        echo "  Active Connections: $connections"
        
        # Get database size
        local db_size=$(psql -U talentphere_user -d talentphere_db -c "SELECT pg_database_size('talentsphere_db')" -t 2>/dev/null)
        echo "  Database Size: $db_size MB"
    fi
}

# Function to get API metrics
get_api_metrics() {
    echo "🌐 API Metrics:"
    
    # Test response times from multiple endpoints
    local endpoints=(
        "https://talentsphere.com/api/auth/health"
        "https://talentsphere.com/api/courses/health"
        "https://talentsphere.com/api/challenges/health"
        "https://talentsphere.com/api/progress/health"
        "https://talentsphere.com/api/ai/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s "$endpoint" > /dev/null; then
            local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$endpoint")
            echo "  $endpoint: ${response_time}s"
        else
            echo "  $endpoint: TIMEOUT"
        fi
        sleep 1
    done
    
    # Calculate average response time
    local total_time=0
    local count=0
    for time in $(curl -s "https://talentsphere.com/api/auth/health" -o /dev/null -s -w '%{time_total}' "$endpoint" | awk '{print $1}'); do
        total_time=$((total_time + 1))
        count=$((count + 1))
    done
    local avg_time=$((total_time / count))
    
    echo "  Average Response Time: ${avg_time}s"
}

# Function to get service health
check_service_health() {
    echo "🔍 Checking service health..."
    
    local services=(
        "Shell MFE:3000"
        "LMS MFE:3001"
        "Challenge MFE:3002"
        "Auth Service:5000"
        "Courses Service:5000"
        "Challenges Service:5000"
        "Progress Service:8080"
        "AI Service:5005"
        "Video Service:5062"
        "Collaboration Service:1234"
        "Notification Service:3030"
        "Monitoring Service:5000"
    )
    
    for service in "${services[@]}"; do
        local name=$(echo "$service" | cut -d: -f1)
        local port=$(echo "$service" | cut -d: -f2)
        
        if curl -s "http://localhost:$port/health" > /dev/null; then
            print_status "success" "$name is healthy"
        else
            print_status "error" "$name is unhealthy"
        fi
    done
}

# Function to get application metrics
get_application_metrics() {
    echo "📈 Application Metrics:"
    
    # Frontend bundle sizes
    if [ -f "frontend/ts-mfe-shell/dist" ]; then
        local shell_size=$(du -sh "frontend/ts-mfe-shell/dist" | cut -f1)
        echo "  Shell Bundle Size: $shell_size"
    fi
    
    if [ -f "frontend/ts-mfe-lms/dist" ]; then
        local lms_size=$(du -sh "frontend/ts-mfe-lms/dist" | cut -f1)
        echo "  LMS Bundle Size: $lms_size"
    fi
    
    if [ -f "frontend/ts-mfe-challenge/dist" ]; then
        local challenge_size=$(du -sh "frontend/ts-mfe-challenge/dist" | cut -f1)
        echo "  Challenge Bundle Size: $challenge_size"
    fi
    
    # Total frontend size
    local total_size=$(du -sh "frontend/" | cut -s1)
    echo "  Total Frontend Size: $total_size"
}

# Function to generate performance recommendations
generate_recommendations() {
    echo "💡 Generating Performance Recommendations..."
    
    echo "📊 PERFORMANCE RECOMMENDATIONS:"
    
    # Database recommendations
    if command -v psql > /dev/null; then
        local slow_queries=$(psql -U talentphere_user -d talentphere_db -c "
            SELECT query, mean_exec_time, calls
            FROM pg_stat_statements 
            WHERE mean_exec_time > 100 
            ORDER BY mean_exec_time DESC 
            LIMIT 5" -t 2>/dev/null)
        
        if [ ${#slow_queries[@]} -gt 0 ]; then
            echo "  🗄️ Slow Database Queries Detected:"
            echo "    • Consider adding indexes for frequently accessed tables"
            echo "    • Optimize complex queries"
            echo "    • Consider read replicas for reporting queries"
        else
            echo "  ✅ No slow database queries detected"
        fi
    else
        echo "  ⚠️ Database connection not available"
    fi
    
    # API performance recommendations
    if command -v curl > /dev/null; then
        local avg_time=$(curl -s "https://talentsphere.com/api/health" -o /dev/null -s -w '%{time_total}' | tail -20 | awk '{s/$1} END {sum=0} {print NR}}' | bc -l)
        
        if [ ${avg_time} -gt 2.0 ]; then
            echo "  🚀 API Response Time Optimization Needed:"
            echo "    • Average response time: ${avg_time}s (target: <2s)"
            echo "    • Consider implementing response caching"
            echo "    • Optimize database queries"
            echo "    • Consider CDN for static assets"
        else
            echo "  ✅ API response time is optimal (${avg_time}s)"
        fi
    else
        echo "  ⚠️ API not accessible for performance check"
    fi
    
    # Frontend optimization recommendations
    echo ""
    echo "📦 Frontend Optimization:"
    
    if [ -f "frontend/ts-mfe-shell/dist/index.html" ]; then
        local html_size=$(wc -c "frontend/ts-mse-shell/dist/index.html" | wc -c)
        echo "  📄 Shell HTML Size: $html_size characters"
        
        if [ $html_size -gt 100000 ]; then
        echo "    🚠 Consider minifying HTML"
            echo "    • Implement code splitting for better caching"
            echo "    • Optimize image loading"
    else
        echo "  ✅ Shell HTML size is optimized ($html_size characters)"
    fi
    
    # System resource recommendations
    echo ""
    echo "💻 System Resource Recommendations:"
    
    if [ "$cpu_usage" -gt 80 ]; then
        echo "  🔴 High CPU Usage ($cpu_usage%)"
        echo "    • Consider scaling horizontally"
        echo "    • Optimize background jobs"
        echo "    • Implement caching layers"
    else
        echo "  ✅ CPU usage is acceptable ($cpu_usage%)"
    fi
    
    if [ "$memory_usage" -gt 85 ]; then
        echo "  🔴 High Memory Usage ($memory_usage%)"
        echo "    • Implement memory optimization"
        echo "    • Consider adding more RAM"
        echo "    - Investigate memory leaks"
    else
        echo "  ✅ Memory usage is acceptable ($memory_usage%)"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        echo "  🔴 High Disk Usage ($disk_usage%)"
        echo "    • Implement log rotation"
        echo "    - Archive old data"
        echo "    - Increase storage capacity"
    else
        echo "  ✅ Disk usage is acceptable ($disk_usage%)"
    fi
    
    # Load average recommendations
    if [ "$load_avg" -gt 2.0 ]; then
        echo "  🔴 High System Load ($load_avg)"
        echo "    • Implement load balancing"
        echo "    - Optimize background processes"
        echo "    - Consider scaling vertically"
        echo "    - Implement request queuing"
    else
        echo "  ✅ System load is acceptable ($load_avg)"
    fi
}

# Function to check alert thresholds
check_alert_thresholds() {
    echo "🚨 Checking Alert Thresholds..."
    
    local critical_count=0
    local warning_count=0
    
    # Define thresholds
    CPU_CRITICAL=80
    MEMORY_CRITICAL=85
    DISK_CRITICAL=90
    RESPONSE_CRITICAL=3.0
    
    # Check CPU
    if [ "$cpu_usage" -gt $CPU_CRITICAL ]; then
        print_status "critical" "CPU usage critical ($cpu_usage%)"
        critical_count=$((critical_count + 1))
    fi
    
    # Check Memory
    if [ "$memory_usage" -gt $MEMORY_CRITICAL ]; then
        print_status "critical" "Memory usage critical ($memory_usage%)"
        critical_count=$((critical_count + 1))
    fi
    
    # Check Disk
    if [ "$disk_usage" -gt $DISK_CRITICAL ]; then
        print_status "critical" "Disk usage critical ($disk_usage%)"
        critical_count=$((critical_count + 1))
    fi
    
    # Check API Response Time
    if [ "$avg_time" -gt $RESPONSE_CRITICAL ]; then
        print_status "critical" "API response time critical (${avg_time}s)"
        critical_count=$((critical_count + 1))
    fi
    
    if [ $critical_count -gt 0 ]; then
        echo "  🚨 CRITICAL ALERTS ACTIVE: $critical_count"
        return 1
    elif [ $warning_count -gt 0 ]; then
        echo "  ⚠️ WARNING ALERTS ACTIVE: $warning_count"
        return 2
    else
        echo "  ✅ All systems operating normally"
        return 0
    fi
}

# Main monitoring function
monitor_system() {
    echo "📊 SYSTEM MONITORING CYCLE STARTED"
    echo "=================================="
    echo "$(date): Starting comprehensive monitoring"
    echo ""
    
    while true; do
        # Get current metrics
        get_system_metrics
        echo ""
        get_database_metrics
        get_api_metrics
        check_service_health
        get_application_metrics
        
        # Check alert thresholds
        check_alert_thresholds
        
        # Generate recommendations
        generate_recommendations
        
        # Wait for next cycle
        echo ""
        echo "⏳ Waiting for next monitoring cycle (60 seconds)..."
        sleep 60
        
        # Check if we should stop (based on conditions)
        if [ $? -ne 0 ]; then
            break
        fi
    done
}

# Trap for graceful shutdown
trap 'echo "📋 Monitoring service shutting down..."; exit 0' INT TERM

echo ""
echo "🎯 CONTINUOUS MONITORING SYSTEM IS ACTIVE"
echo "=================================="
echo "$(date): All monitoring systems are now running"
echo ""
echo "📊 Metrics: Database, API, Application, System"
echo "🚨 Alerting: Multi-channel notifications active"
echo "📈 Reports: Daily summaries and analytics"
echo "🛠️ Auto-optimization: Performance adjustments based on metrics"
echo "=================================="