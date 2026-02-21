#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$1"
    tput sgr0
}

# Function to print status
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "success" ]; then
        print_color "$GREEN" "✓ $message"
    elif [ "$status" = "warning" ]; then
        print_color "$YELLOW" "⚠ $message"
    elif [ "$status" = "error" ]; then
        print_color "$RED" "❌ $message"
    else
        print_color "$BLUE" "ℹ $message"
    fi
}

# Function to print step
print_step() {
    print_color "$BLUE" "→ $1"
    print_color "$NC" "  $2"
}

# Function to print success
print_success() {
    print_color "$GREEN" "✅ $1"
}

# Function to print error
print_error() {
    print_color "$RED" "❌ $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
check_prerequisites() {
    echo "Checking prerequisites..."
    
    # Check for Node.js
    if ! command_exists node; then
        print_error "Node.js is required but not installed. Please install Node.js >= 18."
        return 1
    fi
    
    # Check for npm/pnpm
    if ! command_exists npm && ! command_exists pnpm; then
        print_error "npm or pnpm is required but neither is installed."
        return 1
    fi
    
    # Check for Python
    if ! command_exists python3; then
        print_error "Python 3.9+ is required but not installed."
        return 1
    fi
    
    # Check for Docker
    if ! command_exists docker; then
        print_error "Docker is required but not installed."
        return 1
    fi
    
    # Check for kubectl
    if ! command_exists kubectl; then
        print_error "kubectl is required but not installed."
        return 1
    fi
    
    # Check for Git
    if ! command_exists git; then
        print_error "Git is required but not installed."
        return 1
    fi
    
    print_success "All required tools are installed"
    return 0
}

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=$3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if command_exists nc; then
            if nc -z localhost "$port" -w1 2>/dev/null; then
                print_success "$service_name is running on port $port"
                return 0
            else
                print_error "Port $port is not available for $service_name"
            fi
        elif command_exists curl; then
            if curl -s http://localhost:"$port" -o /dev/null 2>/dev/null; then
                print_success "$service_name is running on port $port"
                return 0
            else
                print_error "Port $port is not available for $service_name"
            fi
        else
            print_error "Neither nc nor curl is available for port checking"
            return 1
        fi
        
        attempt=$((attempt + 1))
    done
    
    print_color "$YELLOW" "⚠ $service_name is not responding (attempt $attempt/$max_attempts)"
    return 1
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local timeout=$3
    
    print_step "Waiting for $service_name to be ready on port $port..."
    
    local elapsed=0
    local max_wait=$timeout
    
    while [ $elapsed -lt $max_wait ]; do
        if check_service "$service_name" "$port"; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        sleep 1
        elapsed=$((elapsed + 1))
    done
    
    print_color "$RED" "⏰ Timeout waiting for $service_name to be ready"
    return 1
}

# Function to get current user
get_current_user() {
    command -v '$1' 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "$(whoami)"
    else
        echo "unknown"
    fi
}

# Function to get IP address
get_ip_address() {
    # Try different methods to get IP
    if command_exists hostname; then
        hostname -I | head -1 | awk '{print $1}'
    elif command_exists ip; then
        ip addr show | grep -Eo 'inet ' | head -1 | awk '{print $2}'
    elif command_exists curl; then
        curl -s ifconfig.me 2>/dev/null | grep -Eo 'inet ' | head -1 | awk '{print $2}'
    else
        echo "127.0.0.1"
    fi
}

# Function to check Docker containers
check_docker_containers() {
    echo "Checking Docker containers..."
    
    if command_exists docker; then
        # Check running containers
        docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_error "Docker is not running or not available"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    echo "Checking database connectivity..."
    
    if check_service "PostgreSQL" 5432; then
        print_success "PostgreSQL is accessible"
    else
        print_error "PostgreSQL is not accessible"
        return 1
    fi
    
    if check_service "Redis" 6379; then
        print_success "Redis is accessible"
    else
        print_error "Redis is not accessible"
        return 1
    fi
}

# Function to clean up
cleanup() {
    echo "Cleaning up..."
    
    # Stop Docker containers if running
    if command_exists docker; then
        echo "Stopping Docker containers..."
        docker-compose -f ../docker-compose.yml -p
    
    # Remove temporary files
    echo "Removing temporary files..."
    rm -f /tmp/talentsphere-*
    
    print_success "Cleanup completed"
}

# Function to install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    # Update system packages
    if command_exists apt-get; then
        sudo apt-get update -y
        sudo apt-get install -y curl wget build-essential
        
        # Install Node.js 18+
        if ! command_exists node; then
            echo "Installing Node.js 18..."
            curl -fsSL https://nodejs.org/dist/v18.18.1/node-v18.18.1-linux-x64.tar.xz | tar -xzf - -C /usr/local
            sudo ln -s /usr/local/node-v18.18.1-linux-x64/bin/node /usr/local/bin/node
            
            # Remove old Node.js versions
            sudo apt-get remove -y nodejs npm
    fi
    
    print_success "Dependencies installed"
}

# Main function
main() {
    local action=${1:-help}
    local service=${2:-all}
    local force=${3:-false}
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                action=$1
                shift
                ;;
        esac
    done
    
    # Handle help
    if [ "$action" = "help" ]; then
        show_usage
        exit 0
    fi
    
    # Handle service management
    if [ "$action" = "services" ]; then
        echo "=== Service Status ==="
        echo ""
        
        # Check individual services
        echo "Frontend Services:"
        check_service "Shell MFE" 3000
        check_service "LMS MFE" 3001
        check_service "Challenge MFE" 3002
        
        echo ""
        echo "Backend Services:"
        check_service "Auth Service" 5000
        check_service "Courses Service" 5000
        check_service "Challenges Service" 5000
        check_service "Progress Service" 8080
        check_service "Video Service" 5062
        check_service "AI Assistant" 5005
        check_service "Collaboration Service" 1234
        check_service "Notification Service" 3030
        
        echo ""
        echo "Supporting Services:"
        echo "  - PostgreSQL Database: $(check_service "PostgreSQL" 5432 && echo "Running" || echo "Stopped")"
        echo "  - Redis Cache: $(check_service "Redis" 6379 && echo "Running" || echo "Stopped")"
        echo "  - Message Queue: $(check_service "RabbitMQ" 5672 && echo "Running" || echo "Stopped")"
        
        exit 0
    fi
    
    # Handle deployment
    if [ "$action" = "deploy" ]; then
        echo "=== Deployment ==="
        echo ""
        
        # Check environment
        if [ "$force" != "--force" ]; then
            echo "Checking environment readiness..."
            check_prerequisites
            if [ $? -ne 0 ]; then
                exit 1
            fi
            
            check_docker_containers
            if [ $? -ne 0 ]; then
                exit 1
            fi
            
            check_database
            if [ $? -neq 0 ]; then
                exit 1
            fi
        fi
        
        # Start deployment
        echo "Starting deployment..."
        
        if [ "$service" = "staging" ] || [ "$service" = "all" ]; then
            echo "Deploying to staging environment..."
            if [ -f "k8s/staging" ]; then
                kubectl apply -f k8s/staging/
                kubectl rollout status deployment/talentsphere-app
                wait_for_service "Deployment" 30000
                print_success "Staging deployment completed"
            else
                print_error "Staging configuration not found"
            fi
        
        elif [ "$service" = "production" ]; then
            echo "Deploying to production environment..."
            if [ -f "k8s/production" ]; then
                kubectl apply -f k8s/production/
                kubectl rollout status deployment/talentsphere-app
                wait_for_service "Deployment" 30000
                
                # Run smoke tests
                echo "Running production smoke tests..."
                ./tests/integration/test_smoke.sh https://talentsphere.com --duration 30s --concurrent 10
                
                if [ $? -eq 0 ]; then
                    print_success "Production deployment completed and verified"
                else
                    print_error "Production smoke tests failed"
                fi
            else
                print_error "Production configuration not found"
            fi
        else
            print_error "Unknown deployment target: $service"
            show_usage
            exit 1
        fi
        
        exit 0
    fi
    
    # Handle cleanup
    if [ "$action" = "cleanup" ]; then
        cleanup
        exit 0
    fi
    
    # Handle diagnostics
    if [ "$action" = "diagnose" ]; then
        echo "=== System Diagnostics ==="
        echo ""
        
        check_prerequisites
        if [ $? -neq 0 ]; then
            exit 1
        fi
        
        echo "System Information:"
        echo "  OS: $(uname -s)"
        echo "  User: $(get_current_user)"
        echo "  IP: $(get_ip_address)"
        echo "  Memory: $(free -h)"
        echo "  Disk: $(df -h /)"
        echo ""
        
        check_docker_containers
        echo ""
        
        check_database
        echo ""
        
        # Check application logs
        echo "Recent application logs:"
        if [ -f /var/log/talentsphere/ ]; then
            echo "  Frontend logs:"
            tail -n 20 /var/log/talentsphere/frontend/
            
            echo "  Backend logs:"
            tail -n 20 /var/log/talentsphere/backend/
            
            echo "  System logs:"
            tail -n 20 /var/log/syslog
        else
            print_error "Log directory not found"
        fi
        
        echo ""
        echo "Network connectivity:"
        
        # Test external connectivity
        if curl -s https://www.google.com --max-time 5 --connect-timeout 5 --output /dev/null 2>&1; then
            echo "  ✓ Internet connectivity"
        else
            echo "  ✗ Internet connectivity"
        fi
        
        exit 0
    fi
    
    # Handle monitoring
    if [ "$action" = "monitor" ]; then
        echo "=== System Monitoring ==="
        echo ""
        
        # Start metrics collection in background
        echo "Starting metrics collection..."
        
        # Show current metrics
        echo "Current System Metrics:"
        echo "  CPU: $(top -bn1 | head -1 | awk '{print $1}')%"
        echo "  Memory: $(free -m | awk 'NR==1{printf "%.2f", $3 * 100 / $2}%}')GB"
        echo "  Disk: $(df -h / | awk 'NR==1{print $5} / $2 / 1024}')% used'"
        echo ""
        
        echo "Service Status:"
        check_service "API Gateway" 80
        check_service "Shell MFE" 3000
        check_service "LMS MFE" 3001
        check_service "Challenge MFE" 3002
        
        exit 0
    fi
    
    # Default: show usage
    show_usage
}

# Function to show usage
show_usage() {
    echo "TalentSphere Deployment and Management Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Actions:"
    echo "  services     - Check status of all services"
    echo "  deploy <target> - Deploy to environment (staging|production)"
    echo "  cleanup     - Clean up temporary files and stop services"
    echo "  diagnose   - Run system diagnostics"
    echo "  monitor     - Start system monitoring"
    echo "  help        - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  POSTGRES_DB - PostgreSQL database name"
    echo "  POSTGRES_USER - PostgreSQL username"
    echo "  POSTGRES_PASSWORD - PostgreSQL password"
    echo "  REDIS_HOST - Redis host (default: localhost:6379)"
    echo "  KUBECONFIG - Kubernetes config file path"
    echo "  DOCKER_COMPOSE - Docker Compose file path"
    echo ""
    echo "Examples:"
    echo "  $0 services           # Check all service status"
    echo "  $0 deploy staging     # Deploy to staging"
    echo "  $0 deploy production # Deploy to production"
    echo "  $0 cleanup           # Clean up temporary files"
    echo "  $0 diagnose           # Run system diagnostics"
    echo "  $0 monitor           # Start system monitoring"
}

# Execute main
main "$@"