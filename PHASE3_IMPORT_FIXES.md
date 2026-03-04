# Phase 3 Import Fix Guide

## Services to Fix

### 1. user-profile-service
**File**: `backends/backend-enhanced/user-profile-service/enhanced-index.js`  
**Line**: 15  
**Current**: `const auth = require('../../../shared/middleware/auth');`  
**Fixed**: `const auth = require('../../../shared/auth-middleware');`  
**Available in shared**: `shared/auth-middleware.js` ✅

### 2. job-listing-service  
**File**: `backends/backend-enhanced/job-listing-service/enhanced-index.js`  
**Line**: 60  
**Current**: `...contracts.base,`  
**Issue**: `contracts` is undefined  
**Need**: Import contracts object properly  
**Available in shared**: `shared/contracts.js` ✅ / `shared/contracts/` (folder) ✅

**Fix This**:
```javascript
// Line 1-20, add:
const { contracts } = require('../../../shared/contracts');
// or
const contracts = require('../../../shared/contracts');
```

### 3. company-service
**File**: `backends/shared/enhanced-service-with-tracing.js`  
**Issue**: Requires `./circuit-breaker` which doesn't exist in backends/shared/  
**Available in shared**: `shared/advanced-circuit-breaker.js` ✅

**Fix This**:
```javascript
// Change from:
const { CircuitBreaker } = require('./circuit-breaker');

// To:
const { CircuitBreaker } = require('../../shared/advanced-circuit-breaker');
```

### 4. api-gateway
**File**: `api-gateway/server.js`  
**Issue**: Missing `http-proxy-middleware` npm module  
**Status**: Listed in `api-gateway/package.json` but not installed  
**Fix**: Run `npm install` in root or api-gateway directory

### 5. email-service
**Issue**: Similar npm module not found  
**Fix**: Verify package.json and run `npm install`

### 6. analytics-service
**File**: `server.js` (root)  
**Line**: 18 (approximately)  
**Issue**: Path references `backends/backend-enhanced/analytics-service/index.js` but file doesn't exist  
**Check**: Is analytics-service implemented?
**Fix**: Either create analytics-service or remove from startup list

## Import Path Mapping

| Service | Wrong Path | Correct Path | Available |
|---------|-----------|--------------|-----------|
| user-profile | `../../../shared/middleware/auth` | `../../../shared/auth-middleware` | ✅ |
| job-listing | Undefined `contracts` | `../../../shared/contracts` | ✅ |
| company (via tracing) | `./circuit-breaker` | `../../shared/advanced-circuit-breaker` | ✅ |
| API Gateway | Missing npm module | Install `http-proxy-middleware` | ✅ package.json has it |
| Analytics | File doesn't exist | Create or remove from startup | ❌ Missing |

