#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE="${1:-api-gateway}"
LINES="${2:-100}"

cd "$SCRIPT_DIR"
docker compose -f docker-compose.backend.yml logs --tail="$LINES" -f "$SERVICE"
