<#
.SYNOPSIS
    Completely resets the local Docker environment.

.DESCRIPTION
    WARNING: This is a highly destructive script.
    It stops ALL running containers, and then removes ALL containers,
    images, volumes, and networks. This is irreversible and will
    delete all local Docker data, including database volumes.

    It is designed for a complete "factory reset" of the Docker state.

.PARAMETER Force
    Bypasses the final confirmation prompt. Use with extreme caution.

.EXAMPLE
    .\docker-nuke.ps1
    # Prompts for confirmation before deleting everything.

.EXAMPLE
    .\docker-nuke.ps1 -Force
    # Immediately proceeds with the deletion without a prompt.
#>

param (
    [switch]$Force
)

# Colors for output
function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "    [FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "    $msg" -ForegroundColor White }

# ============================================================================
# BANNER AND WARNING
# ============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Red
Write-Host "                DOCKER ENVIRONMENT NUKE SCRIPT                  " -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red
Write-Host ""
Write-Warn "This script will PERMANENTLY DELETE:"
Write-Warn "  - ALL Docker containers (running and stopped)"
Write-Warn "  - ALL Docker images"
Write-Warn "  - ALL Docker volumes (including database data)"
Write-Warn "  - ALL Docker networks"
Write-Warn "This operation is IRREVERSIBLE and affects your ENTIRE system, not just this project."
Write-Host ""

# ============================================================================
# CONFIRMATION
# ============================================================================
if (-not $Force) {
    $confirmation = Read-Host "Are you absolutely sure you want to continue? Type 'yes' to proceed"
    if ($confirmation -ne 'yes') {
        Write-Info "Operation cancelled by user."
        exit
    }
} else {
    Write-Warn "'-Force' parameter detected. Proceeding without confirmation in 5 seconds..."
    Start-Sleep -Seconds 5
}

# ============================================================================
# STEP 1: Check Docker
# ============================================================================
Write-Step "Checking Docker status..."
try {
    docker info > $null 2>&1
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
# STEP 2: Stop all running containers
# ============================================================================
Write-Step "Stopping all running containers..."
$runningContainers = docker ps -q
if ($runningContainers) {
    Write-Info "Found running containers. Stopping them now..."
    docker stop $runningContainers | Out-Null
    Write-Success "All containers stopped."
}
else {
    Write-Info "No running containers found."
}

# ============================================================================
# STEP 3: Nuke everything
# ============================================================================
Write-Step "Pruning all containers, images, volumes, and networks..."
Write-Info "This may take a while depending on the number of images..."

# -a: remove all unused images, not just dangling ones
# --volumes: remove all unused volumes
# -f: do not prompt for confirmation
docker system prune -a --volumes -f

Write-Success "Docker environment has been completely reset."

Write-Step "Final Status Check"
Write-Info "Verifying that assets have been removed (output should be empty):"
Write-Host "`n--- Containers ---"
docker ps -a
Write-Host "`n--- Images ---"
docker images
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "              DOCKER NUKE COMPLETE                              " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""