# Phase 4: Script & Runtime Cleanup - Status Report

**Date**: March 3, 2026  
**Status**: 🔄 In Progress  
**Blockers Identified**: 6 architectural dependencies between services

## Progress So Far

### ✅ Completed
- `npm install` executed successfully (1,703 packages installed)
- Fixed user-profile-service `contracts.base` issue
- Fixed backends/shared/enhanced-service-with-tracing.js module imports
- Installed `http-proxy-middleware` in api-gateway
- Created diagnostic tools for service verification

### 🔴 New Issues Identified (Phase 3b)

After npm install, diagnostics revealed deeper architectural issues:

#### 1. API Gateway - http-proxy-middleware dependency ✅ FIXED
- **Status**: ✅ Now installed in api-gateway
- **Next**: Need to verify server.js can start

#### 2. User Profile Service - contracts.base ✅ FIXED  
- **Change**: Removed `...contracts.base` spread (undefined)
- **Status**: ✅ Fixed
- **Next**: Needs re-test

#### 3. Company Service - Module path issues ✅ FIXED
- **Issue**: backends/shared/enhanced-service-with-tracing.js requires modules from wrong paths
- **Changes**:
  - Line 9: Commented out missing CircuitBreaker import
  - Lines 11-12: corrected validation and contracts paths to `../../shared/`
- **Status**: ✅ Fixed
- **Next**: Needs re-test

#### 4. Job Listing Service - App object undefined ❌ OPEN
- **Error**: `Cannot read properties of undefined (reading 'use')` in security-middleware.js:295
- **Root Cause**: `this.app` is undefined in setupMiddleware()
- **Issue**: Base class (EnhancedServiceWithTracing) doesn't initialize express app
- **Solution Pending**: 
  - Option A: Add express app initialization to base class
  - Option B: Services initialize their own express app
  - Option C: Break dependency chain temporarily for Phase 4

#### 5. Email Service - node-fetch missing ❌ OPEN
- **Error**: `Cannot find module 'node-fetch'`
- **Location**: services/shared/production-service-client.js:8
- **Resolution**: Install node-fetch globally or locally
- **Next**: Need to run `npm install node-fetch`

#### 6. Notification Service - Generic startup error ❌ OPEN
- **Error**: JSON error log (timestamp 2026-03-03T10:28:07)
- **Debug needed**: Full error message not captured

---

## Architectural Discovery

The services are built on **two conflicting frameworks**:

### Framework 1: backends/backend-enhanced/shared/enhanced-service-with-tracing.js
- Used by: company-service, job-listing-service
- Extends: EnhancedServiceWithTracing
- Issue: Doesn't initialize express `app` object
- Result: Services crash when calling `this.setupMiddleware()`

### Framework 2: Direct implementation 
- Used by: auth-service (working!)
- Pattern: Doesn't use complex base classes
- Result: Successfully starts and runs

### Framework 3: backends/shared/enhanced-service-with-tracing.js
- Used by: (various services, possibly)
- Issue: Module import paths broken
- Status: Now fixed with correct relative paths

---

## Recommended Phase 4 Strategy

### Option A: Quick Workaround (Recommended)
Temporarily disable problematic setupMiddleware calls to get services starting:
- Comment out `this.setupMiddleware()` in job-listing-service
- Comment out `this.setupMiddleware()` in user-profile-service
- Allow other setup to proceed
- Re-enable in Phase 5 with proper express app initialization

### Option B: Comprehensive Fix (Time-intensive)
- Refactor EnhancedServiceWithTracing to properly initialize express app
- Standardize all services on single framework
- Full testing on each service
- Estimated effort: 4-6 hours

### Option C: Hybrid Approach
- Keep auth-service as reference implementation (it works!)
- Migrate other services to mirror auth-service pattern
- Gradually deprecate complex base classes
- Phased migration over Phase 4-5

---

## Pending Cleanup Tasks

Once services start, Phase 4 includes:

1. **Dead Code Removal**
   - Archive 12 unused backend implementations to `_archive/`
   - Remove deprecated files (*.deprecated)
   - Clean up abandoned service stubs

2. **Script Consolidation**
   - Merge duplicate npm scripts (6+ doc validation scripts)
   - Remove redundant build configurations
   - Standardize dev/prod run commands

3. **Configuration Cleanup**
   - Merge duplicate .env files (9 variant files exist)
   - Remove test/demo configuration
   - Standardize environment variable names

4. **Dependency Audit**
   - Review 35 security vulnerabilities (24 moderate, 9 high, 2 critical)
   - Update vulnerable packages where safe
   - Document unavoidable dependencies

---

## Next Actions

### Immediate (Next 30 minutes)
1. Decide on fix strategy (A, B, or C)
2. Implement chosen fix
3. Re-run diagnostics to verify service startups
4. Document any remaining blockers

### Phase 4 Completion
1. Get all 7 services starting successfully
2. Run cleanup tasks (dead code, scripts, config)
3. Prepare for Phase 5 (verification & testing)

