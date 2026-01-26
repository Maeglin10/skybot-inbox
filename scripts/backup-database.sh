#!/bin/bash
set -e

# Database Backup Script for SkyBot-Inbox
# Usage: ./scripts/backup-database.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "🗄️  Starting database backup..."
echo "📁 Backup location: ${BACKUP_FILE}"

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL}" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Perform the backup using pg_dump
echo "⏳ Dumping database..."
pg_dump "${DATABASE_URL}" > "${BACKUP_FILE}"

# Compress the backup
echo "📦 Compressing backup..."
gzip "${BACKUP_FILE}"

# Get the size of the compressed backup
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)

echo "✅ Backup completed successfully!"
echo "📊 Backup size: ${BACKUP_SIZE}"
echo "📄 File: ${BACKUP_FILE}.gz"

# Optional: Clean up old backups (keep last 7 days)
if [ "${CLEANUP_OLD_BACKUPS}" = "true" ]; then
    echo "🧹 Cleaning up backups older than 7 days..."
    find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +7 -delete
    echo "✅ Cleanup completed"
fi

echo "✨ Database backup process finished"
