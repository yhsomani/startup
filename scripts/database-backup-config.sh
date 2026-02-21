# TalentSphere Database Backup Configuration
BACKUP_DIR="/backups/talentsphere/database"
RETENTION_DAYS=30
RETENTION_COPIES=12
COMPRESSION="gzip"
TIMESTAMP_FORMAT=$(date +"%Y-%m-%d %H:%M:%S")

# Database Configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-talentsphere}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-your-password}"

# Email Configuration for notifications
BACKUP_EMAIL_SERVICE="ses"
BACKUP_EMAIL_REGION="us-east-1"
BACKUP_EMAIL_FROM="talentsphere-backups@amazonaws.com"
BACKUP_EMAIL_TO="admin@talentsphere.com"
BACKUP_SUCCESS_SUBJECT="✅ Database Backup Successful"
BACKUP_FAILURE_SUBJECT="❌ Database Backup Failed"

# S3 Configuration
S3_BUCKET="talentsphere-backups"
S3_REGION="us-east-1"
S3_ACCESS_KEY="${AWS_ACCESS_KEY}"
S3_SECRET_KEY="${AWS_SECRET_KEY}"