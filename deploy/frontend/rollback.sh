#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELEASES_DIR="$SCRIPT_DIR/releases"

echo "======================================================"
echo "  [FRONTEND] EMERGENCY ROLLBACK"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================"

cd "$SCRIPT_DIR"

PREVIOUS_ENV=$(ls -1dt "$RELEASES_DIR"/release-*.env 2>/dev/null | sed -n '2p' || true)

if [ -n "$PREVIOUS_ENV" ]; then
    echo "Restoring previous release manifest from $PREVIOUS_ENV..."
    cp "$PREVIOUS_ENV" "$SCRIPT_DIR/.env.production"
fi

echo "Rolling back frontend container..."
docker compose -f docker-compose.frontend.yml up -d

echo "Verifying restored frontend state..."
sleep 10
if [ -f "./health-check.sh" ]; then
    ./health-check.sh
fi

echo "[FRONTEND] Rollback completed successfully."
