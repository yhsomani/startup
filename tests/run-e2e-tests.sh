#!/bin/bash

# TalentSphere E2E Test Runner
# Comprehensive test execution with reporting and monitoring

set -e

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${TEST_DIR}/cypress/results"
REPORTS_DIR="${TEST_DIR}/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-flight checks
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi
    
    # Check if services are running
    log "Checking service availability..."
    
    local services=(
        "http://localhost:5000/api/v1/auth/health"
        "http://localhost:5005/health"
        "http://localhost:5006/health"
        "http://localhost:5007/health"
        "http://localhost:5008/health"
    )
    
    for service in "${services[@]}"; do
        if ! curl -s "$service" | grep -q "healthy"; then
            log_warning "Service not healthy: $service"
            log "Please ensure all services are running before running E2E tests."
        fi
    done
    
    log_success "Prerequisites checked"
}

# Setup test environment
setup_environment() {
    log "Setting up test environment..."
    
    # Create results directories
    mkdir -p "${RESULTS_DIR}"
    mkdir -p "${REPORTS_DIR}"
    
    # Install dependencies
    cd "${TEST_DIR}/cypress"
    npm install
    
    # Set environment variables
    export CYPRESS_baseUrl="${TALENTSPHERE_URL:-http://localhost:3000}"
    export CYPRESS_apiUrl="${API_BASE_URL:-http://localhost:5000/api/v1}"
    export CYPRESS_assistantUrl="${ASSISTANT_URL:-http://localhost:5005}"
    export CYPRESS_recruitmentUrl="${RECRUITMENT_URL:-http://localhost:5006/api/v1}"
    export CYPRESS_gamificationUrl="${GAMIFICATION_URL:-http://localhost:5007/api/v1}"
    export CYPRESS_collaborationUrl="${COLLABORATION_URL:-http://localhost:5008}"
    
    log_success "Environment setup complete"
}

# Run specific test suite
run_test_suite() {
    local test_type="$1"
    local browser="${2:-chrome}"
    local headless="${3:-false}"
    
    log "Running ${test_type} tests..."
    
    cd "${TEST_DIR}/cypress"
    
    local cmd="npm run test:${test_type}"
    
    if [ "$headless" = "true" ]; then
        cmd="npm run cypress:headless"
    fi
    
    # Run tests with timeout
    timeout 600s $cmd || {
        log_error "Test suite timed out or failed: ${test_type}"
        return 1
    }
    
    log_success "${test_type} tests completed"
}

# Run smoke tests
run_smoke_tests() {
    log "Running smoke tests..."
    
    cd "${TEST_DIR}/cypress"
    
    # Run critical path tests only
    npx cypress run \
        --spec "cypress/e2e/authentication.cy.ts,cypress/e2e/course-learning.cy.ts,cypress/e2e/challenge-platform.cy.ts" \
        --browser chrome \
        --reporter cypress-mochawesome-reporter \
        --reporter-options "reportDir=${RESULTS_DIR}/${TIMESTAMP},reportFilename=smoke-tests"
    
    log_success "Smoke tests completed"
}

# Run performance tests
run_performance_tests() {
    log "Running performance tests..."
    
    cd "${TEST_DIR}/cypress"
    
    # Run tests with performance monitoring
    npm run test:performance
    
    log_success "Performance tests completed"
}

# Generate combined report
generate_report() {
    log "Generating test reports..."
    
    cd "${TEST_DIR}/cypress"
    
    # Merge test results
    if [ -f "${RESULTS_DIR}/mochawesome.json" ]; then
        npm run report:merge
        
        # Generate HTML report
        npm run report:generate
        
        log_success "HTML report generated: ${REPORTS_DIR}/mochawesome-report.html"
    fi
    
    # Generate summary
    node "${TEST_DIR}/scripts/generate-summary.js" "${RESULTS_DIR}" "${REPORTS_DIR}"
    
    log_success "Report generation complete"
}

# Cleanup test artifacts
cleanup() {
    log "Cleaning up test artifacts..."
    
    cd "${TEST_DIR}/cypress"
    
    # Remove old results (keep last 5 runs)
    find "${RESULTS_DIR}" -name "mochawesome-*.json" -type f | sort -r | tail -n +6 | xargs rm -f
    find "${RESULTS_DIR}" -name "*.mp4" -type f | sort -r | tail -n +6 | xargs rm -f
    find "${RESULTS_DIR}" -name "*.png" -type f | sort -r | tail -n +6 | xargs rm -f
    
    log_success "Cleanup complete"
}

# Upload results to external services
upload_results() {
    if [ -n "$SLACK_WEBHOOK" ]; then
        log "Uploading results to Slack..."
        
        # Generate summary for Slack
        local summary=$(node "${TEST_DIR}/scripts/slack-summary.js" "${REPORTS_DIR}/test-summary.json")
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$summary" \
            "$SLACK_WEBHOOK"
        
        log_success "Results uploaded to Slack"
    fi
    
    if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPO" ]; then
        log "Uploading results to GitHub..."
        
        # Upload test artifacts
        gh upload "${RESULTS_DIR}" --repo "$GITHUB_REPO" \
            --tag "e2e-tests-${TIMESTAMP}" \
            --pattern "*.json,*.html,*.mp4" \
            --message "E2E Test Results - $(date)"
        
        log_success "Results uploaded to GitHub"
    fi
}

# Main execution
main() {
    local test_type="${1:-all}"
    local browser="${2:-chrome}"
    local headless="${3:-false}"
    local skip_cleanup="${4:-false}"
    
    log "Starting TalentSphere E2E Test Runner"
    log "Test Type: ${test_type}"
    log "Browser: ${browser}"
    log "Headless: ${headless}"
    echo "========================================"
    
    # Pre-flight checks
    check_prerequisites
    
    # Setup environment
    setup_environment
    
    # Run tests based on type
    case "$test_type" in
        "auth")
            run_test_suite "auth" "$browser" "$headless"
            ;;
        "courses")
            run_test_suite "courses" "$browser" "$headless"
            ;;
        "challenges")
            run_test_suite "challenges" "$browser" "$headless"
            ;;
        "ai")
            run_test_suite "ai" "$browser" "$headless"
            ;;
        "recruitment")
            run_test_suite "recruitment" "$browser" "$headless"
            ;;
        "smoke")
            run_smoke_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "critical")
            run_test_suite "critical" "$browser" "$headless"
            ;;
        "all")
            run_test_suite "all" "$browser" "$headless"
            ;;
        *)
            log_error "Unknown test type: $test_type"
            echo "Available types: auth, courses, challenges, ai, recruitment, smoke, performance, critical, all"
            exit 1
            ;;
    esac
    
    # Generate reports
    generate_report
    
    # Upload results if configured
    upload_results
    
    # Cleanup if not skipped
    if [ "$skip_cleanup" = "false" ]; then
        cleanup
    fi
    
    # Exit with appropriate code
    if [ -f "${REPORTS_DIR}/test-summary.json" ]; then
        local failed_tests=$(node -e "
            const summary = require('${REPORTS_DIR}/test-summary.json');
            console.log(summary.failedTests || 0);
        ")
        
        if [ "$failed_tests" -gt 0 ]; then
            log_error "Tests completed with failures: $failed_tests"
            exit 1
        fi
    fi
    
    log_success "All tests completed successfully!"
    log "View detailed report: ${REPORTS_DIR}/mochawesome-report.html"
}

# Help function
show_help() {
    echo "TalentSphere E2E Test Runner"
    echo ""
    echo "Usage: $0 [TEST_TYPE] [BROWSER] [HEADLESS] [SKIP_CLEANUP]"
    echo ""
    echo "TEST_TYPE:"
    echo "  auth         - Authentication tests"
    echo "  courses      - Course learning tests"
    echo "  challenges   - Challenge platform tests"
    echo "  ai           - AI Assistant tests"
    echo "  recruitment  - Recruitment platform tests"
    echo "  smoke        - Critical path tests"
    echo "  performance  - Performance tests"
    echo "  critical     - Critical user journey tests"
    echo "  all          - Run all tests (default)"
    echo ""
    echo "BROWSER:"
    echo "  chrome       - Chrome browser (default)"
    echo "  firefox      - Firefox browser"
    echo "  edge         - Edge browser"
    echo ""
    echo "HEADLESS:"
    echo "  true         - Run in headless mode"
    echo "  false        - Run in headed mode (default)"
    echo ""
    echo "SKIP_CLEANUP:"
    echo "  true         - Skip cleanup of test artifacts"
    echo "  false        - Cleanup test artifacts (default)"
    echo ""
    echo "Environment Variables:"
    echo "  TALENTSPHERE_URL     - Base URL for the application"
    echo "  API_BASE_URL         - API base URL"
    echo "  ASSISTANT_URL        - AI Assistant service URL"
    echo "  RECRUITMENT_URL      - Recruitment service URL"
    echo "  GAMIFICATION_URL      - Gamification service URL"
    echo "  COLLABORATION_URL    - Collaboration service URL"
    echo "  SLACK_WEBHOOK        - Slack webhook for notifications"
    echo "  GITHUB_TOKEN          - GitHub token for artifact upload"
    echo "  GITHUB_REPO           - GitHub repository name"
}

# Check for help flag
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Execute main function
main "$@"