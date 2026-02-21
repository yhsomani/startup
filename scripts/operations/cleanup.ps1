<#
.SYNOPSIS
    Safely cleans up build artifacts and dependencies for multiple project types.
    Targets React, Angular, Spring Boot, .NET, Python, and JS projects.

.DESCRIPTION
    Recursively scans and removes specific build outputs and dependency folders.
    Defaults to DRY-RUN mode for safety. Use -ForceDelete to actually remove files.

.PARAMETER RootPath
    The directory to start cleaning from. Defaults to current directory.

.PARAMETER DeleteLocks
    Switch to also delete lock files (package-lock.json, yarn.lock, pnpm-lock.yaml).

.PARAMETER ForceDelete
    Switch to bypass dry-run and actually delete files/folders. WARNING: Irreversible.

.EXAMPLE
    .\cleanup.ps1 -RootPath "C:\Projects"
    Runs in Dry-Run mode, listing what would be deleted.

.EXAMPLE
    .\cleanup.ps1 -ForceDelete
    Actually deletes artifacts in the current directory.
#>

param (
    [string]$RootPath = ".",
    [switch]$DeleteLocks,
    [switch]$ForceDelete
)

# --- Configuration ---

# Folders to completely remove
# Folders to completely remove
$TargetFolders = @(
    "node_modules", "venv", ".gradle", ".tox", ".mypy_cache", # Dependencies & Cache
    "dist", "build", "out", "target",                         # Build outputs (JS, Java, etc.)
    "bin", "obj", ".vs", ".vscode", ".idea",                  # .NET & IDE specific
    ".next", ".angular", ".cache",                            # Framework & General caches
    "__pycache__", ".pytest_cache",                           # Python caches
    "coverage"                                                # Test coverage
)

# Folder patterns to remove (wildcards allowed)
$TargetFolderPatterns = @(
    "*.egg-info"
)

# File patterns to remove (e.g. logs)
$TargetFilePatterns = @(
    "*.log", "*.pyc", "*.pyo"
)

# Lock files (optional)
$LockFiles = @(
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml"
)

# --- Safety Checks ---

if (-not $ForceDelete) {
    Write-Host "MODE: DRY-RUN (No files will be deleted)" -ForegroundColor Cyan
    Write-Host "Use -ForceDelete to perform actual deletion." -ForegroundColor Yellow
    Write-Host "Scanning '$RootPath'..." -ForegroundColor Gray
}
else {
    Write-Host "MODE: DESTRUCTIVE (Files WILL be permanently deleted)" -ForegroundColor Red
    Write-Warning "This operation is irreversible."
    Start-Sleep -Seconds 3 # Give user a moment to cancel if run accidentally
}

# --- Cleanup Logic ---

function Remove-Artifacts {
    param (
        [string]$Path
    )

    # Get all items in the current folder, suppressing errors for access denied
    $Items = Get-ChildItem -Path $Path -Force -ErrorAction SilentlyContinue

    foreach ($Item in $Items) {
        # 1. Handle Directories
        if ($Item.PSIsContainer) {
            $IsTarget = $false
            
            # Check exact folder matches
            if ($TargetFolders -contains $Item.Name) {
                $IsTarget = $true
            }
            # Check folder patterns (if not already found)
            if (-not $IsTarget) {
                foreach ($Pattern in $TargetFolderPatterns) {
                    if ($Item.Name -like $Pattern) {
                        $IsTarget = $true
                        break
                    }
                }
            }

            if ($IsTarget) {
                # Found a target directory
                if ($ForceDelete) {
                    Write-Host "Deleting folder: $($Item.FullName)" -ForegroundColor Red
                    Remove-Item -Path $Item.FullName -Recurse -Force -ErrorAction Continue
                }
                else {
                    Write-Host "[DRY-RUN] Would delete folder: $($Item.FullName)" -ForegroundColor Cyan
                }
                # Prune: Do not recurse into deleted/target directories
                continue 
            }
            else {
                # Recurse into non-target directories to clean nested projects
                Remove-Artifacts -Path $Item.FullName
            }
        }
        # 2. Handle Files
        else {
            $ShouldDelete = $false
            
            # Check Patterns (e.g. *.log)
            foreach ($Pattern in $TargetFilePatterns) {
                if ($Item.Name -like $Pattern) {
                    $ShouldDelete = $true
                    break
                }
            }

            # Check Lock Files (if requested)
            if ($DeleteLocks -and ($LockFiles -contains $Item.Name)) {
                $ShouldDelete = $true
            }

            if ($ShouldDelete) {
                if ($ForceDelete) {
                    Write-Host "Deleting file:   $($Item.FullName)" -ForegroundColor Red
                    Remove-Item -Path $Item.FullName -Force -ErrorAction Continue
                }
                else {
                    Write-Host "[DRY-RUN] Would delete file:   $($Item.FullName)" -ForegroundColor Cyan
                }
            }
        }
    }
}

# Execute
try {
    $AbsPath = Resolve-Path $RootPath
    Remove-Artifacts -Path $AbsPath
    Write-Host "`nDone." -ForegroundColor Green
}
catch {
    Write-Error "An error occurred accessing path: $_"
}
