#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LINES="${1:-100}"

cd "$SCRIPT_DIR"
docker compose -f docker-compose.frontend.yml logs --tail="$LINES" -f frontend
