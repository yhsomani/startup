#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TalentSphere Database Restore Script
.DESCRIPTION
    Lists available backups and restores a selected one to PostgreSQL.
.EXAMPLE
    .\scripts\restore.ps1
    .\scripts\restore.ps1 -BackupFile "path\to\backup.sql.gz"
#>

param(
    [string]$BackupDir = "",
    [string]$BackupFile = "",
    [string]$DbHost = "",
    [string]$DbPort = "",
    [string]$DbName = "",
    [string]$DbUser = "",
    [SecureString]$DbPassword = $null
)

# Resolve defaults from environment (PS5 compatible — no ?? operator)
if (-not $BackupDir) { $BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR }         else { ".\backups\database" } }
if (-not $DbHost) { $DbHost = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST }       else { "localhost" } }
if (-not $DbPort) { $DbPort = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT }       else { "5432" } }
if (-not $DbName) { $DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB }         else { "talentsphere" } }
if (-not $DbUser) { $DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER }       else { "postgres" } }
if (-not $DbPassword) {
    $rawPass = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "password" }
    $DbPassword = ConvertTo-SecureString $rawPass -AsPlainText -Force
}

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Level] $Msg"
}

Write-Log "TalentSphere Database Restore"

# Select backup file
if (-not $BackupFile) {
    $Backups = Get-ChildItem -Path $BackupDir -Filter "talentsphere_backup_*" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending
    if ($Backups.Count -eq 0) {
        Write-Log "No backups found in $BackupDir" "ERROR"
        exit 1
    }

    Write-Host "`nAvailable backups:"
    for ($i = 0; $i -lt [Math]::Min($Backups.Count, 20); $i++) {
        $b = $Backups[$i]
        $sizeMB = [math]::Round($b.Length / 1MB, 2)
        Write-Host "  [$i] $($b.Name)  ($sizeMB MB, $($b.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))"
    }

    $choice = Read-Host "`nEnter number to restore (or q to quit)"
    if ($choice -eq 'q') { exit 0 }
    $BackupFile = $Backups[[int]$choice].FullName
}

if (-not (Test-Path $BackupFile)) {
    Write-Log "Backup file not found: $BackupFile" "ERROR"
    exit 1
}

Write-Log "Selected: $BackupFile"
Write-Host ""
Write-Host "WARNING: This will RESTORE the database '$DbName' on ${DbHost}:${DbPort}" -ForegroundColor Yellow
Write-Host "   All existing data will be replaced." -ForegroundColor Yellow
$confirm = Read-Host "Type 'yes' to confirm"
if ($confirm -ne 'yes') { Write-Log "Restore cancelled."; exit 0 }

# Decompress if needed
$SqlFile = $BackupFile
if ($BackupFile.EndsWith('.gz')) {
    Write-Log "Decompressing..."
    $SqlFile = $BackupFile -replace '\.gz$', ''
    if (Get-Command gzip -ErrorAction SilentlyContinue) {
        Copy-Item $BackupFile "$SqlFile.tmp"
        & gzip -d -f "$SqlFile.tmp"
        if (Test-Path "$SqlFile.tmp") { Move-Item "$SqlFile.tmp" $SqlFile -Force }
    }
    else {
        Expand-Archive -Path $BackupFile -DestinationPath (Split-Path $BackupFile) -Force
    }
}
elseif ($BackupFile.EndsWith('.zip')) {
    Write-Log "Decompressing ZIP..."
    Expand-Archive -Path $BackupFile -DestinationPath (Split-Path $BackupFile) -Force
    $SqlFile = $BackupFile -replace '\.zip$', ''
}

# Restore
# Decrypt SecureString to plain text only at the last moment (required by psql via env var)
$env:PGPASSWORD = [System.Net.NetworkCredential]::new('', $DbPassword).Password
Write-Log "Restoring to ${DbName} @ ${DbHost}:${DbPort}..."
$StartTime = Get-Date

try {
    & psql `
        "--host=$DbHost" `
        "--port=$DbPort" `
        "--username=$DbUser" `
        "--dbname=$DbName" `
        "--file=$SqlFile" 2>&1

    if ($LASTEXITCODE -ne 0) { throw "psql exited with $LASTEXITCODE" }

    $Duration = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 1)
    Write-Log "Restore complete in ${Duration}s"
}
catch {
    Write-Log "Restore FAILED: $_" "ERROR"
    exit 1
}
finally {
    if ($BackupFile -ne $SqlFile -and (Test-Path $SqlFile)) {
        Remove-Item $SqlFile -Force
    }
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
