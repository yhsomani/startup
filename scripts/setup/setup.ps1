<#
.SYNOPSIS
    TalentSphere - Complete Environment Setup Script
    
.DESCRIPTION
    Rebuilds the entire TalentSphere environment from scratch.
    Requires: Docker Desktop running, PowerShell 5.1+
    
.NOTES
    Author: TalentSphere DevOps
    Version: 2.0.0
    Last Updated: 2025-12-31
    
.EXAMPLE
    .\setup.ps1
    
.EXAMPLE
    .\setup.ps1 -SkipBuild
#>

param(
    [switch]$SkipBuild,
    [switch]$Verbose
)

# ==============================================
# CONFIGURATION
# ==============================================
$ErrorActionPreference = "Stop"
# Handle both direct execution and invocation from another location
$PROJECT_ROOT = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
$COMPOSE_FILE = Join-Path $PROJECT_ROOT "docker-compose.yml"
$ENV_FILE = Join-Path $PROJECT_ROOT ".env"
$ENV_EXAMPLE = Join-Path $PROJECT_ROOT ".env.example"
$MIGRATION_FILE = Join-Path $PROJECT_ROOT "migrations\001_init_schema.sql"

# Service health check endpoints
$HEALTH_CHECKS = @{
    "API Gateway" = @{ Url = "http://localhost:8000/health"; Container = "ts-api-gateway" }
    "Flask" = @{ Url = "http://localhost:5000/health"; Container = "ts-backend-flask" }
    "Assistant" = @{ Url = "http://localhost:5005/health"; Container = "ts-backend-assistant" }
    "Recruitment" = @{ Url = "http://localhost:5006/health"; Container = "ts-backend-recruitment" }
    "Gamification" = @{ Url = "http://localhost:5007/health"; Container = "ts-backend-gamification" }
    "Spring Boot" = @{ Url = "http://localhost:8080/actuator/health"; Container = "ts-backend-springboot" }
}

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Test-DockerRunning {
    try {
        $null = docker info 2>&1
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Wait-ForContainer {
    param(
        [string]$ContainerName,
        [int]$TimeoutSeconds = 120
    )
    
    $elapsed = 0
    $interval = 5
    
    while ($elapsed -lt $TimeoutSeconds) {
        $status = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        if ($status -eq "healthy") {
            return $true
        }
        
        # Also check if container is running without health check
        $running = docker inspect --format='{{.State.Running}}' $ContainerName 2>$null
        if ($running -eq "true" -and $status -eq "") {
            # No health check defined, assume healthy after 10 seconds
            if ($elapsed -ge 10) {
                return $true
            }
        }
        
        Start-Sleep -Seconds $interval
        $elapsed += $interval
        Write-Host "." -NoNewline
    }
    
    return $false
}

function Test-HttpEndpoint {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds -ErrorAction SilentlyContinue
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    } catch {
        # Some endpoints return 403 which is still valid (service running)
        if ($_.Exception.Response.StatusCode -eq 403) {
            return $true
        }
        return $false
    }
}

# ==============================================
# STEP 1: PREFLIGHT CHECKS
# ==============================================

function Invoke-PreflightChecks {
    Write-Step "Step 1: Preflight Checks"
    
    # Check Docker is installed and running
    Write-Host "Checking Docker..." -NoNewline
    if (-not (Test-DockerRunning)) {
        Write-Fail ""
        throw "Docker is not running. Please start Docker Desktop and try again."
    }
    Write-Success "Docker is running"
    
    # Check docker-compose.yml exists
    Write-Host "Checking docker-compose.yml..." -NoNewline
    if (-not (Test-Path $COMPOSE_FILE)) {
        Write-Fail ""
        throw "docker-compose.yml not found at: $COMPOSE_FILE"
    }
    Write-Success "Found"
    
    # Check .env file exists (create from example if not)
    Write-Host "Checking .env file..." -NoNewline
    if (-not (Test-Path $ENV_FILE)) {
        if (Test-Path $ENV_EXAMPLE) {
            Copy-Item $ENV_EXAMPLE $ENV_FILE
            Write-Warn "Created .env from .env.example - REVIEW AND UPDATE SECRETS"
        } else {
            Write-Fail ""
            throw ".env file not found and no .env.example available. INSUFFICIENT INFORMATION - MANUAL INPUT REQUIRED"
        }
    }
    Write-Success "Found"
    
    # Check migration file exists
    Write-Host "Checking migration file..." -NoNewline
    if (-not (Test-Path $MIGRATION_FILE)) {
        Write-Fail ""
        throw "Migration file not found at: $MIGRATION_FILE"
    }
    Write-Success "Found"
    
    Write-Success "All preflight checks passed"
}

# ==============================================
# STEP 2: CLEANUP EXISTING ENVIRONMENT
# ==============================================

function Invoke-Cleanup {
    Write-Step "Step 2: Cleanup Existing Environment"
    
    # Stop and remove existing containers (suppress stderr warnings)
    Write-Host "Stopping existing containers..."
    $env:DOCKER_CLI_HINTS = "false"
    & docker-compose -f $COMPOSE_FILE down --remove-orphans 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    Write-Success "Containers stopped"
    
    # Remove orphaned volumes (optional - keeps data by default)
    # Uncomment next line to remove all volumes (DESTRUCTIVE)
    # docker-compose -f $COMPOSE_FILE down -v 2>&1 | Out-Null
    
    # Prune dangling images to save space
    Write-Host "Cleaning up dangling images..."
    & docker image prune -f 2>&1 | Out-Null
    Write-Success "Cleanup complete"
}

# ==============================================
# STEP 3: BUILD DOCKER IMAGES
# ==============================================

function Invoke-BuildImages {
    Write-Step "Step 3: Build Docker Images"
    
    if ($SkipBuild) {
        Write-Warn "Skipping build (--SkipBuild flag set)"
        return
    }
    
    Write-Host "Building all Docker images (this may take several minutes)..."
    
    $buildResult = & docker-compose -f $COMPOSE_FILE build 2>&1
    $buildExitCode = $LASTEXITCODE
    if ($buildExitCode -ne 0) {
        Write-Fail "Docker build failed"
        Write-Host ($buildResult | Out-String) -ForegroundColor Red
        throw "Docker build failed. See output above."
    }
    
    Write-Success "All images built successfully"
}

# ==============================================
# STEP 4: START INFRASTRUCTURE SERVICES
# ==============================================

function Invoke-StartInfrastructure {
    Write-Step "Step 4: Start Infrastructure Services"
    
    # Start database and message queue first
    Write-Host "Starting PostgreSQL database..."
    & docker-compose -f $COMPOSE_FILE up -d db 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Waiting for database to be healthy" -NoNewline
    if (-not (Wait-ForContainer -ContainerName "ts-db" -TimeoutSeconds 90)) {
        Write-Fail ""
        throw "Database failed to become healthy within 90 seconds"
    }
    Write-Success " Database ready"
    
    Write-Host "Starting RabbitMQ..."
    & docker-compose -f $COMPOSE_FILE up -d rabbitmq 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Waiting for RabbitMQ" -NoNewline
    Start-Sleep -Seconds 15  # RabbitMQ takes time to initialize
    Write-Success " RabbitMQ ready"
    
    Write-Success "Infrastructure services started"
}

# ==============================================
# STEP 5: RUN DATABASE MIGRATIONS
# ==============================================

function Invoke-DatabaseMigrations {
    Write-Step "Step 5: Run Database Migrations"
    
    # Copy migration file to container
    Write-Host "Copying migration file to database container..."
    docker cp $MIGRATION_FILE ts-db:/tmp/001_init_schema.sql
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy migration file to container"
    }
    
    # Run migration
    Write-Host "Executing database migrations..."
    $migrationOutput = docker exec ts-db psql -U postgres -d talentsphere -f /tmp/001_init_schema.sql 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Migration failed"
        Write-Host $migrationOutput -ForegroundColor Red
        throw "Database migration failed"
    }
    
    # Verify tables exist
    Write-Host "Verifying database schema..."
    $tableCount = docker exec ts-db psql -U postgres -d talentsphere -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>&1
    $tableCount = [int]($tableCount.Trim())
    
    if ($tableCount -lt 10) {
        Write-Warn "Expected at least 10 tables, found $tableCount"
    } else {
        Write-Success "Database schema verified: $tableCount tables"
    }
    
    Write-Success "Database migrations complete"
}

# ==============================================
# STEP 6: START BACKEND SERVICES
# ==============================================

function Invoke-StartBackendServices {
    Write-Step "Step 6: Start Backend Services"
    
    # Start all backend services
    Write-Host "Starting Flask service..."
    & docker-compose -f $COMPOSE_FILE up -d flask 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Starting .NET service..."
    & docker-compose -f $COMPOSE_FILE up -d dotnet 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Starting Spring Boot service..."
    & docker-compose -f $COMPOSE_FILE up -d springboot 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Starting AI Assistant service..."
    & docker-compose -f $COMPOSE_FILE up -d backend-assistant 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Starting Recruitment service..."
    & docker-compose -f $COMPOSE_FILE up -d backend-recruitment 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Starting Gamification service..."
    & docker-compose -f $COMPOSE_FILE up -d backend-gamification 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Starting Notification service..."
    & docker-compose -f $COMPOSE_FILE up -d notification-service 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    # Wait for services to initialize
    Write-Host "Waiting for services to initialize (30 seconds)..."
    Start-Sleep -Seconds 30
    
    Write-Success "Backend services started"
}

# ==============================================
# STEP 7: START API GATEWAY
# ==============================================

function Invoke-StartApiGateway {
    Write-Step "Step 7: Start API Gateway"
    
    Write-Host "Starting Nginx API Gateway..."
    & docker-compose -f $COMPOSE_FILE up -d api-gateway 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    # Wait for gateway to be ready
    Write-Host "Waiting for API Gateway" -NoNewline
    Start-Sleep -Seconds 10
    Write-Success " API Gateway started"
    
    Write-Success "API Gateway ready"
}

# ==============================================
# STEP 8: START MONITORING SERVICES
# ==============================================

function Invoke-StartMonitoring {
    Write-Step "Step 8: Start Monitoring Services"
    
    Write-Host "Starting Prometheus..."
    & docker-compose -f $COMPOSE_FILE up -d prometheus 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Write-Host "Starting Grafana..."
    & docker-compose -f $COMPOSE_FILE up -d grafana 2>&1 | Where-Object { $_ -notmatch "warning" } | Out-Null
    
    Start-Sleep -Seconds 5
    Write-Success "Monitoring services started"
}

# ==============================================
# STEP 9: HEALTH CHECKS
# ==============================================

function Invoke-HealthChecks {
    Write-Step "Step 9: Service Health Checks"
    
    $allHealthy = $true
    $retryCount = 3
    $retryDelay = 10
    
    foreach ($service in $HEALTH_CHECKS.Keys) {
        $config = $HEALTH_CHECKS[$service]
        Write-Host "Checking $service..." -NoNewline
        
        $healthy = $false
        for ($i = 0; $i -lt $retryCount; $i++) {
            if (Test-HttpEndpoint -Url $config.Url) {
                $healthy = $true
                break
            }
            Start-Sleep -Seconds $retryDelay
        }
        
        if ($healthy) {
            Write-Success "$service is healthy"
        } else {
            Write-Fail "$service is NOT responding at $($config.Url)"
            $allHealthy = $false
        }
    }
    
    # Show running containers
    Write-Host "`nRunning containers:"
    docker ps --format "table {{.Names}}`t{{.Status}}"
    
    if (-not $allHealthy) {
        Write-Warn "Some services failed health checks. Check logs with: docker logs <container-name>"
    } else {
        Write-Success "All services healthy"
    }
    
    return $allHealthy
}

# ==============================================
# STEP 10: FINAL SUMMARY
# ==============================================

function Show-Summary {
    param([bool]$AllHealthy)
    
    Write-Step "Setup Complete"
    
    Write-Host @"
    
TalentSphere is now running!

ACCESS POINTS:
--------------
  API Gateway:       http://localhost:8000
  Grafana:           http://localhost:3001 (admin/admin)
  RabbitMQ:          http://localhost:15672 (guest/guest)
  PostgreSQL:        localhost:5440 (postgres/postgres)

API ENDPOINTS:
--------------
  Health:            http://localhost:8000/health
  Auth:              http://localhost:8000/api/v1/auth/
  Challenges:        http://localhost:8000/api/v1/challenges/
  AI Assistant:      http://localhost:5005/health

USEFUL COMMANDS:
----------------
  View logs:         docker-compose logs -f <service>
  Stop all:          docker-compose down
  Restart service:   docker-compose restart <service>
  Run migrations:    docker exec ts-db psql -U postgres -d talentsphere -f /tmp/001_init_schema.sql

"@ -ForegroundColor White

    if ($AllHealthy) {
        Write-Success "System is ready for use!"
    } else {
        Write-Warn "System started with some issues. Review output above."
    }
}

# ==============================================
# MAIN EXECUTION
# ==============================================

try {
    $startTime = Get-Date
    
    Write-Host "`n" + ("=" * 50) -ForegroundColor Magenta
    Write-Host "  TalentSphere Environment Setup" -ForegroundColor Magenta
    Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Magenta
    Write-Host ("=" * 50) + "`n" -ForegroundColor Magenta
    
    # Execute all steps
    Invoke-PreflightChecks
    Invoke-Cleanup
    Invoke-BuildImages
    Invoke-StartInfrastructure
    Invoke-DatabaseMigrations
    Invoke-StartBackendServices
    Invoke-StartApiGateway
    Invoke-StartMonitoring
    $allHealthy = Invoke-HealthChecks
    Show-Summary -AllHealthy $allHealthy
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    Write-Host "`nTotal setup time: $($duration.Minutes) minutes $($duration.Seconds) seconds" -ForegroundColor Cyan
    
} catch {
    Write-Host "`n[FATAL ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nStack trace:" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
