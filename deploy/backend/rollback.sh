#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-all}"
RELEASES_DIR="$SCRIPT_DIR/releases"

echo "======================================================"
echo "  [BACKEND] EMERGENCY ROLLBACK INITIATED: $TARGET"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================"

cd "$SCRIPT_DIR"

PREVIOUS_ENV=$(ls -1dt "$RELEASES_DIR"/release-*.env 2>/dev/null | sed -n '2p' || true)

if [ -z "$PREVIOUS_ENV" ]; then
    echo "WARNING: No previous release manifest found in $RELEASES_DIR. Attempting container restart..."
    docker compose -f docker-compose.backend.yml restart "$TARGET"
    exit 0
fi

echo "Restoring environment configuration from $PREVIOUS_ENV..."
cp "$PREVIOUS_ENV" "$SCRIPT_DIR/.env.production"

echo "Rolling back backend containers..."
if [ "$TARGET" = "all" ]; then
    docker compose -f docker-compose.backend.yml up -d
else
    docker compose -f docker-compose.backend.yml up -d --no-deps "$TARGET"
fi

echo "Verifying restored state..."
sleep 15
if [ -f "./health-check.sh" ]; then
    ./health-check.sh "$TARGET"
fi

echo "[BACKEND] Rollback successfully completed."
