#!/bin/bash

# SYNOPSIS
# Safely cleans up built artifacts, caches, and dependencies.
# Supports Dry-Run (default) and explicit deletion.

# --- Configuration ---

# Directories to match exactly and prune
TARGET_DIRS=(
  "node_modules" "venv" ".gradle" ".tox" ".mypy_cache" # Dependencies
  "dist" "build" "out" "target" "bin" "obj" ".vs"      # Build outputs & IDE
  ".vscode" ".idea"                                    # Editor Configs
  ".next" ".angular" ".cache"                          # JS Frameworks & Cache
  "__pycache__" ".pytest_cache" "*.egg-info"           # Python
  "coverage"                                           # Testing
)

# Files to match exactly
TARGET_FILES=(
  "*.log" "*.pyc" "*.pyo"
)

LOCK_FILES=(
  "package-lock.json" "yarn.lock" "pnpm-lock.yaml"
)

# --- Argument Parsing ---

DRY_RUN=true
DELETE_LOCKS=false
ROOT_DIR="."

function show_help {
  echo "Usage: ./cleanup.sh [OPTIONS] [DIRECTORY]"
  echo "Options:"
  echo "  --execute       Perform actual deletion (Default is DRY-RUN)"
  echo "  --include-locks Also delete lock files (package-lock.json, etc.)"
  echo "  --help          Show this help"
  echo ""
  echo "Example:"
  echo "  ./cleanup.sh --execute --include-locks ./my-projects"
}

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --execute) DRY_RUN=false ;;
        --include-locks) DELETE_LOCKS=true ;;
        --help) show_help; exit 0 ;;
        -*) echo "Unknown option: $1"; show_help; exit 1 ;;
        *) ROOT_DIR="$1" ;;
    esac
    shift
done

# --- Safety Header ---

echo "Targeting Directory: $ROOT_DIR"
if [ "$DRY_RUN" = true ]; then
    echo -e "\033[1;36m[MODE] DRY-RUN: No files will be deleted.\033[0m"
    echo "Use --execute to permanently delete files."
else
    echo -e "\033[1;31m[MODE] DESTRUCTIVE: Files WILL be deleted.\033[0m"
    echo "WARNING: This operation is irreversible."
    sleep 3 # Safety pause
fi
echo "---------------------------------------------------"

# --- Construction of Find Commands ---

# 1. Build directory prune expression
# -name "dir1" -o -name "dir2" ...
DIR_EXPR=""
for dir in "${TARGET_DIRS[@]}"; do
    if [ -n "$DIR_EXPR" ]; then
        DIR_EXPR="$DIR_EXPR -o -name \"$dir\""
    else
        DIR_EXPR="-name \"$dir\""
    fi
done

# 2. Build file match expression
FILE_EXPR="-name \"*.log\""
if [ "$DELETE_LOCKS" = true ]; then
    for lock in "${LOCK_FILES[@]}"; do
        FILE_EXPR="$FILE_EXPR -o -name \"$lock\""
    done
fi

# --- Execution ---

# Function to process directories
# Logic: Find directories matching target names, prune them (don't descend), and act
if [ "$DRY_RUN" = true ]; then
    # Dry Run: Print directories
    eval "find \"$ROOT_DIR\" -type d \( $DIR_EXPR \) -prune -print | while read line; do echo \"[DRY-RUN] Would delete dir: \$line\"; done"
    
    # Dry Run: Print files
    # We prune the target dirs from the search entirely so we don't look inside them
    eval "find \"$ROOT_DIR\" -type d \( $DIR_EXPR \) -prune -o -type f \( $FILE_EXPR \) -print | grep -v -E \"^$ROOT_DIR/.*($DIR_EXPR)\" | while read line; do echo \"[DRY-RUN] Would delete file: \$line\"; done"

else
    # Execute: Remove directories
    # Check if any directories found first to avoid error on empty xargs
    eval "find \"$ROOT_DIR\" -type d \( $DIR_EXPR \) -prune -print0" | xargs -0 -I {} bash -c 'echo "Deleting dir: {}"; rm -rf "{}"'
    
    # Execute: Remove files
    eval "find \"$ROOT_DIR\" -type d \( $DIR_EXPR \) -prune -o -type f \( $FILE_EXPR \) -print0" | xargs -0 -I {} bash -c 'if [ -f "{}" ]; then echo "Deleting file: {}"; rm -f "{}"; fi'
fi

echo "---------------------------------------------------"
echo "Cleanup complete."
