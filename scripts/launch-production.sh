# TalentSphere Production Launch Checklist
# Execute in order

echo "🚀 TALENTSPHERE PRODUCTION LAUNCH SEQUENCE"
echo "======================================"
echo "Step 1: System Health Check"
echo "Step 2: Final Security Validation"
echo "Step 3: Production Configuration"
echo "Step 4: Deployment Execution"
echo "Step 5: Post-Launch Validation"
echo "======================================"

# Step 1: System Health Check
echo "🔍 Running comprehensive system health check..."
./scripts/deploy.sh diagnose

# Step 2: Security Validation
echo "🔒 Running final security validation..."
cd security
python security_audit.py --production
python vulnerability_scan.py --full-scan

# Step 3: Production Configuration
echo "⚙️ Loading production configuration..."
export ENVIRONMENT="production"
export DEBUG=false
export LOG_LEVEL="INFO"

# Step 4: Deployment Execution
echo "🚀 Deploying to production environment..."
./scripts/deploy.sh deploy production

# Step 5: Post-Launch Validation
echo "✅ Running post-launch validation..."
./scripts/deploy.sh monitor
python tests/integration/test_smoke.py --production

echo "🎉 TALENTSPHERE PRODUCTION LAUNCH COMPLETE!"
echo "======================================"
echo "🌐 TalentSphere is now LIVE at: https://talentsphere.com"
echo "📊 Monitoring dashboard: https://monitor.talentsphere.com"
echo "🔧 DevOps console: https://devops.talentsphere.com"
echo "📚 Documentation: https://docs.talentsphere.com"