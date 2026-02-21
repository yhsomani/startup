#!/bin/bash
# TalentSphere Database Backup Script
# Usage: bash scripts/database-backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups/talentsphere/database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-talentsphere}"
DB_USER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-password}"

TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
DUMP_FILE="$BACKUP_DIR/talentsphere_backup_$TIMESTAMP.sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

log() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$BACKUP_DIR/backup.log"; }

log "🗄️  TalentSphere Database Backup Starting"
log "📊  Config: $DB_NAME @ $DB_HOST:$DB_PORT | Retention: $RETENTION_DAYS days"

# Check DB connectivity
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    log "❌ Database is not reachable. Aborting."
    exit 1
fi
log "✅ Database reachable"

# Perform dump
log "📦 Creating dump: $DUMP_FILE"
START=$(date +%s)
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --format=plain \
    --file="$DUMP_FILE"

# Compress
gzip -f "$DUMP_FILE"
COMPRESSED="$DUMP_FILE.gz"
END=$(date +%s)
DURATION=$((END - START))
SIZE=$(du -h "$COMPRESSED" | cut -f1)

log "✅ Backup complete: $COMPRESSED ($SIZE in ${DURATION}s)"

# Update latest symlink
ln -sf "$COMPRESSED" "$BACKUP_DIR/latest_backup.sql.gz"
log "🔗 Latest symlink updated"

# Rotate old backups
log "🧹 Rotating backups older than $RETENTION_DAYS days..."
REMOVED=0
while IFS= read -r -d '' f; do
    rm -f "$f"
    log "   Removed: $(basename "$f")"
    REMOVED=$((REMOVED + 1))
done < <(find "$BACKUP_DIR" -name "talentsphere_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -print0)

log "♻️  Rotation complete. Removed $REMOVED old backup(s)."
log "✅ Backup script finished successfully"

unset PGPASSWORD