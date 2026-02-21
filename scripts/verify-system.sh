#!/bin/bash
# System Verification Script
# Tests all components created during autonomous audit

echo "🔍 TalentSphere - System Verification"
echo "======================================"
echo ""

# Test 1: Backend Feature Flags
echo "Test 1: Backend Feature Flags"
cd backends/backend-flask
python3 -c "
from app.feature_flags import FeatureFlags
flags = FeatureFlags._flags
metadata = FeatureFlags.get_flag_metadata()
stale = FeatureFlags.get_stale_flags()
print(f'  ✅ {len(flags)} flags loaded')
print(f'  ✅ {len(metadata)} metadata entries')
print(f'  ✅ {len(stale)} stale flags')
" || { echo "  ❌ FAILED"; exit 1; }
cd ../..

echo ""

# Test 2: Frontend Feature Flags
echo "Test 2: Frontend Feature Flag Validation"
cd frontend/ts-mfe-shell
node scripts/validate-flags.js || { echo "  ❌ FAILED"; exit 1; }
cd ../..

echo ""

# Test 3: Documentation Files
echo "Test 3: Documentation Consistency"
FILES=("CHANGELOG.md" "README.md" "Follow.md")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done

echo ""

# Test 4: CI/CD Workflows
echo "Test 4: CI/CD Workflows"
if [ -f ".github/workflows/feature-flags.yml" ]; then
    echo "  ✅ Feature flag workflow exists"
else
    echo "  ❌ Feature flag workflow missing"
    exit 1
fi

echo ""

# Test 5: Validation Scripts
echo "Test 5: Validation Scripts"
if [ -f "scripts/validate-flags.py" ]; then
    echo "  ✅ Backend validation script exists"
else
    echo "  ❌ Backend validation script missing"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ All System Verification Tests Passed"
echo "======================================"
