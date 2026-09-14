#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE="${1:-}"

if [ -z "$SERVICE" ]; then
    echo "Usage: $0 <backend-service-name>"
    echo "Example: $0 order-service"
    exit 1
fi

cd "$SCRIPT_DIR"
echo "Gracefully restarting $SERVICE..."
docker compose -f docker-compose.backend.yml restart "$SERVICE"
echo "Verifying health..."
sleep 10
if [ -f "./health-check.sh" ]; then
    ./health-check.sh "$SERVICE"
fi
