#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo "Starting database backup..."
pg_dump $DATABASE_URL > $BACKUP_FILE

echo "Compressing backup..."
gzip $BACKUP_FILE

echo "Backup completed: ${BACKUP_FILE}.gz"
