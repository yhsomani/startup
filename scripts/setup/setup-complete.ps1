# TalentSphere Complete Setup Script
# Idempotent setup from clean state to fully operational system
# Run from project root: .\setup-complete.ps1

param(
    [switch]$SkipBuild,
    [switch]$CleanStart
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== TalentSphere Full Stack Setup ===" -ForegroundColor Cyan
Write-Host "Started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Prerequisites check
Write-Host "`n[Prerequisites] Checking required tools..." -ForegroundColor Yellow

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is required. Install Docker Desktop and retry."
    exit 1
}
Write-Host "  Docker: OK" -ForegroundColor Green

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Error "docker-compose is required."
    exit 1
}
Write-Host "  docker-compose: OK" -ForegroundColor Green

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required for frontend."
    exit 1
}
Write-Host "  Node.js: OK ($(node --version))" -ForegroundColor Green

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "  pnpm: Not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
}
Write-Host "  pnpm: OK" -ForegroundColor Green

# Step 1: Clean previous state (if requested)
if ($CleanStart) {
    Write-Host "`n[1/7] Cleaning previous containers and volumes..." -ForegroundColor Yellow
    docker-compose down -v --remove-orphans 2>$null
    Write-Host "  Cleaned" -ForegroundColor Green
} else {
    Write-Host "`n[1/7] Skipping clean (use -CleanStart to force)" -ForegroundColor Gray
}

# Step 2: Build and start backend services
Write-Host "`n[2/7] Building and starting Docker services..." -ForegroundColor Yellow
if ($SkipBuild) {
    docker-compose up -d
} else {
    docker-compose up -d --build
}

# Step 3: Wait for database health
Write-Host "`n[3/7] Waiting for database to be healthy..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
do {
    Start-Sleep -Seconds 2
    $dbStatus = docker inspect --format='{{.State.Health.Status}}' ts-db 2>$null
    $retryCount++
    Write-Host "  Attempt $retryCount/$maxRetries - Status: $dbStatus" -ForegroundColor Gray
} while ($dbStatus -ne "healthy" -and $retryCount -lt $maxRetries)

if ($dbStatus -ne "healthy") {
    Write-Error "Database failed to become healthy after $maxRetries attempts"
    docker logs ts-db --tail 50
    exit 1
}
Write-Host "  Database is HEALTHY" -ForegroundColor Green

# Wait for Flask to be ready
Write-Host "`n[4/7] Waiting for Flask service..." -ForegroundColor Yellow
$flaskReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $flaskReady = $true
            break
        }
    } catch {
        Write-Host "  Waiting... ($i/15)" -ForegroundColor Gray
    }
}

if (-not $flaskReady) {
    Write-Host "  Warning: API Gateway health check failed, continuing..." -ForegroundColor Yellow
}

# Step 5: Seed database
Write-Host "`n[5/7] Seeding database..." -ForegroundColor Yellow
try {
    docker exec ts-backend-flask python seed_challenges.py 2>&1 | Out-Null
    Write-Host "  Challenges seeded" -ForegroundColor Green
} catch {
    Write-Host "  Challenge seed skipped (may already exist)" -ForegroundColor Gray
}

try {
    docker exec ts-backend-flask python seed_courses.py 2>&1
    Write-Host "  Courses seeded" -ForegroundColor Green
} catch {
    Write-Host "  Course seed skipped (may already exist)" -ForegroundColor Gray
}

# Step 6: Install frontend dependencies
Write-Host "`n[6/7] Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location frontend
pnpm install --frozen-lockfile 2>&1 | Out-Null
Pop-Location
Write-Host "  Dependencies installed" -ForegroundColor Green

# Step 7: Build MFEs for federation
Write-Host "`n[7/7] Building MFEs for preview mode..." -ForegroundColor Yellow

Push-Location frontend/ts-mfe-lms
pnpm build 2>&1 | Out-Null
Pop-Location
Write-Host "  LMS MFE built" -ForegroundColor Green

Push-Location frontend/ts-mfe-challenge
pnpm build 2>&1 | Out-Null
Pop-Location
Write-Host "  Challenge MFE built" -ForegroundColor Green

# Verification
Write-Host "`n=== Verification ===" -ForegroundColor Cyan

# Check Docker containers
$containers = docker ps --format "{{.Names}}" | Sort-Object
Write-Host "Running containers: $($containers.Count)" -ForegroundColor Green

# Check API
try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/courses" -UseBasicParsing -TimeoutSec 10
    $data = $apiResponse.Content | ConvertFrom-Json
    Write-Host "Courses API: OK ($($data.data.Count) courses)" -ForegroundColor Green
} catch {
    Write-Host "Courses API: FAILED" -ForegroundColor Red
}

# Final summary
Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host @"

To start the frontend (run in separate terminals):

  Terminal 1: cd frontend && pnpm run dev:shell
  Terminal 2: cd frontend/ts-mfe-lms && pnpm preview
  Terminal 3: cd frontend/ts-mfe-challenge && pnpm preview

Access points:
  - Frontend Shell:     http://localhost:3010
  - API Gateway:        http://localhost:8000
  - Grafana:            http://localhost:3001
  - RabbitMQ Dashboard: http://localhost:15672 (guest/guest)
  - Prometheus:         http://localhost:9090

Finished at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

"@ -ForegroundColor White
