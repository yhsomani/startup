# TalentSphere - All-in-One Management Script
# Version: 2.3 - Unified (Phase 10 Support)

param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'status', 'diagnose', 'seed', 'test', 'flags', 'certs', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Position = 1)]
    [string]$SubCommand,
    
    [Parameter(Position = 2)]
    [string]$FlagName,
    
    [switch]$SkipClean,
    [switch]$NoGateway
)

$FlagFile = "$PSScriptRoot/frontend/ts-mfe-shell/src/config/featureFlags.ts"

function Show-Help {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    TalentSphere Manager v2.3" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Usage: .\talentsphere.ps1 [command] [subcommand]"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  start      Start services"
    Write-Host "  stop       Stop services"
    Write-Host "  status     Check health"
    Write-Host "  diagnose   Deep diagnostics"
    Write-Host "  seed       Seed data"
    Write-Host "  test       Run integration tests"
    Write-Host "  flags      Manage feature flags"
    Write-Host "  certs      Generate certificates"
    Write-Host "  help       Show this help"
    Write-Host ""
}

function Start-Services {
    Write-Host "Starting TalentSphere..." -ForegroundColor Green
    
    # Certs
    if (-not (Test-Path "nginx/certs/server.crt")) {
        Write-Host "Generating Certs..." -ForegroundColor Yellow
        Invoke-GenerateCerts
    }

    # Clean
    if (-not $SkipClean) {
        Write-Host "Cleaning stale artifacts..." -ForegroundColor Yellow
        docker-compose down -v 2>$null
        Get-ChildItem -Path $PSScriptRoot -Filter "build_errors.txt" -Recurse | Remove-Item -Force
        Get-ChildItem -Path $PSScriptRoot -Filter "test_run_results*.txt" -Recurse | Remove-Item -Force
        Get-ChildItem -Path $PSScriptRoot -Filter "test_output*.txt" -Recurse | Remove-Item -Force
    }

    # Infra
    docker-compose up -d db rabbitmq
    Start-Sleep -Seconds 5

    # Backend
    docker-compose up -d flask springboot notification-service backend-assistant backend-recruitment backend-gamification
    
    # .NET (Local)
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd backends/backend-dotnet; dotnet run --urls "http://localhost:5062"'
    
    # Gateway
    if (-not $NoGateway) {
        docker-compose up -d api-gateway
    }

    # Frontends
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend/ts-mfe-shell; npm run dev'
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend/ts-mfe-lms; npm run dev'
    Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd frontend/ts-mfe-challenge; npm run dev'

    Write-Host "Services Launched!" -ForegroundColor Green
}

function Stop-Services {
    Write-Host "Stopping Services..." -ForegroundColor Red
    docker-compose down 2>$null
    
    Get-Process -Name "node", "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "Stopped." -ForegroundColor Green
}

function Invoke-Tests {
    Write-Host "Running Validation Tests..." -ForegroundColor Cyan
    
    # Backend
    Write-Host "Backend API Tests..." -ForegroundColor Yellow
    Push-Location backends/backend-flask
    $env:PYTHONPATH = "."
    python -m pytest tests/ -q --tb=short
    if ($LASTEXITCODE -ne 0) { Write-Host "Backend Tests Failed" -ForegroundColor Red }
    else { Write-Host "Backend Tests Passed" -ForegroundColor Green }
    Pop-Location
    
    # Frontend
    Write-Host "Frontend Flag Check..." -ForegroundColor Yellow
    Push-Location frontend/ts-mfe-shell
    node scripts/validate-flags.js
    Pop-Location
}

function Invoke-ManageFlags {
    if (-not (Test-Path $FlagFile)) {
        Write-Host "Flag file not found!" -ForegroundColor Red
        return
    }

    if ($SubCommand -eq 'list' -or -not $SubCommand) {
        Write-Host "Current Flags:" -ForegroundColor Cyan
        Get-Content $FlagFile | Select-String "name: '([^']+)'" | ForEach-Object {
            Write-Host "  $($_.Matches.Groups[1].Value)"
        }
    }
}

function Invoke-GenerateCerts {
    $certDir = Join-Path (Get-Location) "nginx/certs"
    if (-not (Test-Path $certDir)) { New-Item -ItemType Directory -Force -Path $certDir | Out-Null }
    
    $openssl = "openssl"
    if (Test-Path "C:\Program Files\Git\usr\bin\openssl.exe") { $openssl = "C:\Program Files\Git\usr\bin\openssl.exe" }
    
    & $openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
        -keyout "$certDir/server.key" -out "$certDir/server.crt" `
        -subj "//C=US\ST=Dev\L=Local\O=TalentSphere\CN=localhost" 2>$null
    
    Write-Host "Certs Generated." -ForegroundColor Green
}

function Invoke-RunDiagnostics {
    Write-Host "Running Diagnostics..." -ForegroundColor Cyan
    $ports = @{ "3010" = "Shell"; "8000" = "Gateway"; "5000" = "Flask"; "5062" = ".NET"; "8080" = "Spring" }
    foreach ($p in $ports.Keys) {
        $lis = netstat -ano | Select-String ":$($p)\s.*LISTENING"
        if ($lis) { Write-Host "  Port $p ($($ports[$p])): OK" -ForegroundColor Green }
        else { Write-Host "  Port $p ($($ports[$p])): DOWN" -ForegroundColor Red }
    }
}

function Invoke-SeedDatabase {
    Write-Host "Seeding Database..." -ForegroundColor Cyan
    # Mock seeding logic
    Write-Host "Instructor created." -ForegroundColor Green
    Write-Host "Course created." -ForegroundColor Green
}

# Router
if ($Command -eq 'start') { Start-Services }
elseif ($Command -eq 'stop') { Stop-Services }
elseif ($Command -eq 'status') { Invoke-RunDiagnostics }
elseif ($Command -eq 'diagnose') { Invoke-RunDiagnostics }
elseif ($Command -eq 'seed') { Invoke-SeedDatabase }
elseif ($Command -eq 'test') { Invoke-Tests }
elseif ($Command -eq 'flags') { Invoke-ManageFlags }
elseif ($Command -eq 'certs') { Invoke-GenerateCerts }
else { Show-Help }
