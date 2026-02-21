<#
.SYNOPSIS
    TalentSphere Platform Restart Script
    Stops all containers, cleans up, and restarts the entire platform.

.DESCRIPTION
    This script performs a complete restart of the TalentSphere microservices platform:
    1. Stops all running containers
    2. Removes stopped containers and orphaned volumes (optional)
    3. Rebuilds all Docker images
    4. Starts all services
    5. Waits for health checks
    6. Displays final status

.PARAMETER Clean
    If specified, removes all containers and volumes before rebuild (fresh start)

.PARAMETER SkipBuild
    If specified, skips the build step and just restarts containers

.EXAMPLE
    .\restart-platform.ps1
    # Normal restart with rebuild

.EXAMPLE
    .\restart-platform.ps1 -Clean
    # Full clean restart (removes volumes - WARNING: deletes database data!)

.EXAMPLE
    .\restart-platform.ps1 -SkipBuild
    # Quick restart without rebuilding images
#>

param(
    [switch]$Clean,
    [switch]$SkipBuild
)

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ErrorActionPreference = "Continue"

# Colors for output
function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "    [FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "    $msg" -ForegroundColor White }

# Banner
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "           TalentSphere Platform Restart Script                 " -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""

# Change to project root
Set-Location $ProjectRoot
Write-Info "Working directory: $ProjectRoot"

# ============================================================================
# STEP 1: Check Docker
# ============================================================================
Write-Step "Checking Docker status..."

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Docker is not running! Please start Docker Desktop first."
        exit 1
    }
    Write-Success "Docker is running"
}
catch {
    Write-Err "Docker command failed: $_"
    exit 1
}

# ============================================================================
# STEP 2: Stop Running Containers
# ============================================================================
Write-Step "Stopping all TalentSphere containers..."

$containers = docker ps -q --filter "name=ts-" 2>$null
if ($containers) {
    docker stop $containers 2>$null | Out-Null
    Write-Success "Stopped running containers"
}
else {
    Write-Info "No running containers found"
}

# ============================================================================
# STEP 3: Clean Up (Optional)
# ============================================================================
if ($Clean) {
    Write-Step "Performing full cleanup..."
    
    # Stop and remove all project containers
    docker-compose down -v --remove-orphans 2>$null
    
    # Remove any dangling images
    $danglingImages = docker images -f "dangling=true" -q 2>$null
    if ($danglingImages) {
        docker rmi $danglingImages 2>$null | Out-Null
        Write-Success "Removed dangling images"
    }
    
    # Prune unused networks
    docker network prune -f 2>$null | Out-Null
    
    Write-Success "Cleanup complete"
    Write-Warn "Database data has been removed. Fresh start!"
}
else {
    Write-Step "Removing stopped containers..."
    docker-compose down --remove-orphans 2>$null
    Write-Success "Containers removed (data preserved)"
}

# ============================================================================
# STEP 4: Build Images
# ============================================================================
if (-not $SkipBuild) {
    Write-Step "Building Docker images..."
    
    $buildStart = Get-Date
    
    # Build all images
    docker-compose build --parallel 2>&1 | ForEach-Object {
        if ($_ -match "Successfully built|Built|Pulled") {
            Write-Success $_
        }
        elseif ($_ -match "error|Error|ERROR|failed|Failed") {
            Write-Err $_
        }
        else {
            Write-Host "    $_" -ForegroundColor DarkGray
        }
    }
    
    $buildDuration = (Get-Date) - $buildStart
    $seconds = $buildDuration.TotalSeconds.ToString("F1")
    Write-Success "Build completed in $seconds seconds"
}
else {
    Write-Info "Skipping build step"
}

# ============================================================================
# STEP 5: Start Services
# ============================================================================
Write-Step "Starting all services..."

# Start infrastructure first
Write-Info "Starting infrastructure..."
docker-compose up -d db rabbitmq 2>$null
Start-Sleep -Seconds 5

# Wait for database to be healthy
Write-Info "Waiting for database to be ready..."
$dbReady = $false
$maxWait = 30
$waited = 0
while (-not $dbReady -and $waited -lt $maxWait) {
    $health = docker inspect --format="{{.State.Health.Status}}" ts-db 2>$null
    if ($health -eq "healthy") {
        $dbReady = $true
    }
    else {
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline
    }
}
Write-Host ""
if ($dbReady) {
    Write-Success "Database is healthy"
}
else {
    Write-Warn "Database health check timed out"
}

# Start remaining services
Write-Info "Starting application services..."
docker-compose up -d 2>$null

Write-Success "All services started"

# ============================================================================
# STEP 6: Health Check
# ============================================================================
Write-Step "Running health checks..."

Start-Sleep -Seconds 5  # Give services time to initialize

$services = @(
    @{Name = "API Gateway"; Url = "http://localhost:8000/health" },
    @{Name = "Auth Service"; Url = "http://localhost:8000/api/v1/auth/health" },
    @{Name = "Flask Direct"; Url = "http://localhost:5000/api/v1/auth/health" },
    @{Name = "DotNet Direct"; Url = "http://localhost:5062/health" }
)

$allHealthy = $true
foreach ($svc in $services) {
    try {
        $response = Invoke-WebRequest -Uri $svc.Url -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "$($svc.Name): OK"
        }
        else {
            Write-Warn "$($svc.Name): $($response.StatusCode)"
            $allHealthy = $false
        }
    }
    catch {
        Write-Err "$($svc.Name): Failed to connect"
        $allHealthy = $false
    }
}

# ============================================================================
# STEP 7: Display Status
# ============================================================================
Write-Step "Final Status"

Write-Host ""
Write-Host "Running Containers:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}" --filter "name=ts-"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
if ($allHealthy) {
    Write-Host "              Platform is HEALTHY and READY!                    " -ForegroundColor Green
}
else {
    Write-Host "       Platform started with some warnings. Check logs.         " -ForegroundColor Yellow
}
Write-Host "================================================================" -ForegroundColor Green

Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  - API Gateway:    http://localhost:8000"
Write-Host "  - RabbitMQ Admin: http://localhost:15672 (guest/guest)"
Write-Host "  - Grafana:        http://localhost:3000"
Write-Host "  - Prometheus:     http://localhost:9090"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  - View logs:      docker-compose logs -f [service-name]"
Write-Host "  - Stop all:       docker-compose down"
Write-Host "  - Check health:   .\scripts\verify-system.ps1"
Write-Host ""
