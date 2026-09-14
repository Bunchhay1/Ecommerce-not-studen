#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================"
echo "  [BACKEND] Microservices Fleet Status"
echo "======================================================"
docker compose -f docker-compose.backend.yml ps

echo ""
echo "======================================================"
echo "  [BACKEND] Resource Quota & Usage Snapshot"
echo "======================================================"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" 2>/dev/null || true
