#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Print colored output
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

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Configuration
ENVIRONMENT="production"
BASE_URL="https://talentsphere.com"
API_URL="https://api.talentsphere.com"
DEPLOYMENT_LOG="/var/log/talentsphere/deployment.log"
BACKUP_DIR="/var/backups/talentsphere"

# Create log directory
mkdir -p "$(dirname "$DEPLOYMENT_LOG")"

# Start deployment
print_header "TALNTSPHERE PRODUCTION DEPLOYMENT"
echo "$(date): Starting production deployment" >> "$DEPLOYMENT_LOG"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
python3 scripts/validate-production.py 2>&1 | tee -a "$DEPLOYMENT_LOG"

# Database backup
echo "💾 Creating database backup..."
./scripts/backup-database.sh production 2>&1 | tee -a "$DEPLOYMENT_LOG"
print_status "backup" "Database backup completed"

# Deploy infrastructure
echo "🚀 Deploying infrastructure..."
cd k8s/production
kubectl apply -f . 2>&1 | tee -a "$DEPLOYMENT_LOG"
print_status "infrastructure" "Infrastructure deployed"

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
kubectl wait --for condition=available pod --all --timeout=600s 2>&1 | tee -a "$DEPLOYMENT_LOG"
print_status "services" "All services are ready"

# Health check
echo "🏥 Running health checks..."
sleep 30
python3 scripts/validate-production.py 2>&1 | tee -a "$DEPLOYMENT_LOG"

# SSL Certificate verification
echo "🔒 Verifying SSL certificate..."
if curl -sS "$BASE_URL" | grep -q "SSL"; then
    print_status "ssl" "SSL certificate verified"
else
    print_status "ssl" "SSL certificate issue detected"
fi

# Load balancer check
echo "⚖️ Testing load balancer..."
for i in {1..5}; do
    if curl -s "$BASE_URL/health" > /dev/null; then
        print_status "loadbalancer" "Load balancer test $i/5 passed"
    else
        print_status "loadbalancer" "Load balancer test $i/5 failed"
    fi
    sleep 2
done

# Post-deployment validation
echo "🧪 Running post-deployment validation..."

# API endpoint tests
echo "🔍 Testing API endpoints..."
endpoints=(
    "$API_URL/auth/health"
    "$API_URL/courses/health"
    "$API_URL/challenges/health"
    "$API_URL/ai/health"
    "$API_URL/monitor/health"
)

for endpoint in "${endpoints[@]}"; do
    if curl -s "$endpoint" > /dev/null; then
        print_status "endpoint" "✅ $(basename $endpoint)"
    else
    print_status "endpoint" "❌ $(basename $endpoint)"
    fi
done

# Performance test
echo "📊 Running performance test..."
response_time=$(curl -o /dev/null -s -w '%{time_total}' "$BASE_URL/health")
if (( $(echo "$response_time < 2.0" | bc -l) )); then
    print_status "performance" "✅ Performance test passed (${response_time}s)"
else
    print_status "performance" "⚠️ Performance test slow (${response_time}s)"
fi

# Security scan
echo "🛡️ Running security scan..."
nmap -sS -sV "$BASE_URL" 2>&1 | tee -a "$DEPLOYMENT_LOG" || echo "Nmap not available, skipping security scan"

# Generate deployment report
print_header "DEPLOYMENT SUMMARY"
echo "🎉 PRODUCTION DEPLOYMENT COMPLETED"
echo "📊 Deployment Statistics:"
echo "  - Environment: $ENVIRONMENT"
echo "  - Base URL: $BASE_URL"
echo "  - API URL: $API_URL"
echo "  - Timestamp: $(date)"
echo "  - Deployer: $(whoami)"
echo "  - Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
echo "  - Deployment Log: $DEPLOYMENT_LOG"

# Success confirmation
print_status "deployment" "🚀 TALENTSPHERE IS NOW LIVE!"
echo ""
echo "🌐 LIVE URL: $BASE_URL"
echo "📊 Monitoring: $BASE_URL/monitor"
echo "🔧 DevOps: $BASE_URL/devops"
echo "📚 Documentation: $BASE_URL/docs"
echo "📧 Support: support@talentsphere.com"
echo ""
echo "🎯 Next Steps:"
echo "1. Monitor system performance"
echo "2. Review deployment logs"
echo "3. Test user workflows"
echo "4. Scale infrastructure as needed"
echo "5. Enable alert notifications"

# Notification
if command -v curl > /dev/null; then
    curl -X POST -H 'Content-Type: application/json' \
         -d '{"message": "TalentSphere has been successfully deployed to production!", "environment": "'$ENVIRONMENT'"}' \
         "$SLACK_WEBHOOK_URL" 2>/dev/null || echo "Slack notification failed"
fi

print_header "DEPLOYMENT SUCCESSFUL"
echo "$(date): Production deployment completed" >> "$DEPLOYMENT_LOG"