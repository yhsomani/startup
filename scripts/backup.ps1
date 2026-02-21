#!/usr/bin/env pwsh
<#
.SYNOPSIS
    TalentSphere Database Backup Script (Windows/Cross-platform PowerShell)
.DESCRIPTION
    Backs up the TalentSphere PostgreSQL database with timestamped, compressed dumps.
    Rotates backups older than $RetentionDays. Logs all activity.
.EXAMPLE
    .\scripts\backup.ps1
    .\scripts\backup.ps1 -RetentionDays 15 -BackupDir "D:\backups"
#>

param(
    [string]$BackupDir    = $env:BACKUP_DIR    ?? ".\backups\database",
    [int]   $RetentionDays= [int]($env:RETENTION_DAYS ?? 30),
    [string]$DbHost       = $env:POSTGRES_HOST  ?? "localhost",
    [string]$DbPort       = $env:POSTGRES_PORT  ?? "5432",
    [string]$DbName       = $env:POSTGRES_DB    ?? "talentsphere",
    [string]$DbUser       = $env:POSTGRES_USER  ?? "postgres",
    [string]$DbPassword   = $env:POSTGRES_PASSWORD ?? "password"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Setup ──────────────────────────────────────────────────────────────────────
$Timestamp  = Get-Date -Format "yyyy-MM-dd_HHmmss"
$LogFile    = Join-Path $BackupDir "backup.log"
$DumpFile   = Join-Path $BackupDir "talentsphere_backup_$Timestamp.sql"
$CompressedFile = "$DumpFile.gz"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $entry = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [$Level] $Message"
    Write-Host $entry
    Add-Content -Path $LogFile -Value $entry
}

Write-Log "🗄️  TalentSphere Database Backup Starting"
Write-Log "📊  Config: $DbName @ $DbHost:$DbPort | Retention: $RetentionDays days"

# ── Pre-flight: check pg_dump ──────────────────────────────────────────────────
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Log "pg_dump not found. Install PostgreSQL client tools." "ERROR"
    exit 1
}

# ── Check DB connectivity ──────────────────────────────────────────────────────
$env:PGPASSWORD = $DbPassword
try {
    $null = & pg_isready -h $DbHost -p $DbPort -U $DbUser -d $DbName 2>&1
    if ($LASTEXITCODE -ne 0) { throw "pg_isready returned $LASTEXITCODE" }
    Write-Log "✅  Database reachable"
} catch {
    Write-Log "❌  Cannot connect to database: $_" "ERROR"
    exit 1
}

# ── Perform Backup ─────────────────────────────────────────────────────────────
$StartTime = Get-Date
Write-Log "📦  Creating dump: $DumpFile"

try {
    & pg_dump `
        --host=$DbHost `
        --port=$DbPort `
        --username=$DbUser `
        --dbname=$DbName `
        --format=plain `
        --no-owner `
        --no-acl `
        --file=$DumpFile 2>&1

    if ($LASTEXITCODE -ne 0) { throw "pg_dump exited with $LASTEXITCODE" }

    # Compress
    Write-Log "🗜️   Compressing..."
    if (Get-Command gzip -ErrorAction SilentlyContinue) {
        & gzip -f $DumpFile
        $FinalFile = $CompressedFile
    } else {
        # Fallback: PowerShell native compression
        $FinalFile = "$DumpFile.zip"
        Compress-Archive -Path $DumpFile -DestinationPath $FinalFile -Force
        Remove-Item $DumpFile -Force
    }

    $Duration = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 1)
    $SizeMB   = [math]::Round((Get-Item $FinalFile).Length / 1MB, 2)
    Write-Log "✅  Backup complete: $FinalFile ($SizeMB MB in ${Duration}s)"

    # ── Symlink / latest marker ────────────────────────────────────────────────
    $LatestPath = Join-Path $BackupDir "latest_backup"
    Set-Content -Path $LatestPath -Value $FinalFile
    Write-Log "🔗  Latest marker updated"

} catch {
    Write-Log "❌  Backup FAILED: $_" "ERROR"
    if (Test-Path $DumpFile) { Remove-Item $DumpFile -Force }
    exit 1
}

# ── Rotate old backups ─────────────────────────────────────────────────────────
Write-Log "🧹  Rotating backups older than $RetentionDays days..."
$Cutoff = (Get-Date).AddDays(-$RetentionDays)
$OldFiles = Get-ChildItem -Path $BackupDir -Filter "talentsphere_backup_*" |
              Where-Object { $_.LastWriteTime -lt $Cutoff }
foreach ($f in $OldFiles) {
    Remove-Item $f.FullName -Force
    Write-Log "   Removed: $($f.Name)"
}
Write-Log "♻️   Rotation complete. Removed $($OldFiles.Count) old backup(s)."

# ── Summary ────────────────────────────────────────────────────────────────────
$AllBackups = Get-ChildItem -Path $BackupDir -Filter "talentsphere_backup_*" |
                Sort-Object LastWriteTime -Descending
Write-Log "📂  Total backups retained: $($AllBackups.Count)"
Write-Log "✅  Backup script finished successfully"

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
