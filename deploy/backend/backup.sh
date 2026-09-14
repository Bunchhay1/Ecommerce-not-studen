#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../../backups"
DATE=$(date +"%Y%m%d-%H%M%S")
FILENAME="ecommerce-db-$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating compressed PostgreSQL snapshot..."
if docker compose -f "$SCRIPT_DIR/docker-compose.backend.yml" ps postgres 2>/dev/null | grep -qE "Up|running"; then
    docker compose -f "$SCRIPT_DIR/docker-compose.backend.yml" exec -T postgres \
      pg_dumpall -U postgres | gzip > "$BACKUP_DIR/$FILENAME"
    echo "Database backup created: $BACKUP_DIR/$FILENAME"
else
    echo "Notice: Postgres container not active, skipping database dump."
fi

# Clean up backups older than 7 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete 2>/dev/null || true
