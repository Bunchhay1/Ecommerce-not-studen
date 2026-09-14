#!/usr/bin/env bash

set -Eeuo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DEPLOY_DIR"

echo "======================================================"
echo "  E-Commerce Microservices Fleet Status"
echo "======================================================"
echo ">>> Backend Microservices & Infrastructure:"
docker compose -f backend/docker-compose.backend.yml ps
echo ""
echo ">>> Frontend Client:"
docker compose -f frontend/docker-compose.frontend.yml ps

echo ""
echo "======================================================"
echo "  Container Resource Usage (Live Snapshot)"
echo "======================================================"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" 2>/dev/null || true
