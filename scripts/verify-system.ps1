# TalentSphere System Verification (Windows)

Write-Host "Starting System Verification..." -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# 1. Backend Feature Flags
Write-Host "`n[Test 1] Backend Feature Flags" -ForegroundColor Yellow
if (Test-Path "backends/backend-flask") {
    Push-Location "backends/backend-flask"
    try {
        # Using the dedicated python script we created earlier
        python verify_flags.py
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [PASS] Backend flags verified" -ForegroundColor Green
        }
        else {
            Write-Host "  [FAIL] Backend flags check failed" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "  [FAIL] Error running python script" -ForegroundColor Red
        exit 1
    }
    Pop-Location
}
else {
    Write-Host "  [FAIL] backends/backend-flask directory not found" -ForegroundColor Red
    exit 1
}

# 2. Frontend Feature Flags
Write-Host "`n[Test 2] Frontend Feature Flag Validation" -ForegroundColor Yellow
if (Test-Path "frontend/ts-mfe-shell") {
    Push-Location "frontend/ts-mfe-shell"
    try {
        node "scripts/validate-flags.js"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [PASS] Frontend flags verified" -ForegroundColor Green
        }
        else {
            Write-Host "  [FAIL] Frontend flags check failed" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "  [FAIL] Error running node script" -ForegroundColor Red
        exit 1
    }
    Pop-Location
}
else {
    Write-Host "  [FAIL] frontend/ts-mfe-shell directory not found" -ForegroundColor Red
    exit 1
}

# 3. Documentation
Write-Host "`n[Test 3] Documentation Consistency" -ForegroundColor Yellow
$requiredFiles = @("CHANGELOG.md", "README.md", "FOLLOW.md")

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  [PASS] Found $file" -ForegroundColor Green
    }
    else {
        Write-Host "  [FAIL] Missing $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "ALL SYSTEMS VERIFIED SUCCESSFULLY" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan
