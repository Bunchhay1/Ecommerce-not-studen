#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK_FILE="/tmp/ecommerce-frontend-deploy.lock"

echo "======================================================"
echo "  [FRONTEND] Production Auto-Deploy"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================"

# 1. Acquire Deployment Lock (Portable Linux/macOS)
if command -v flock >/dev/null 2>&1; then
    exec 8>"$LOCK_FILE"
    if ! flock -n 8; then
        echo "ERROR: Another frontend deployment is currently in progress."
        exit 1
    fi
else
    if [ -f "$LOCK_FILE" ] && kill -0 "$(cat "$LOCK_FILE" 2>/dev/null)" 2>/dev/null; then
        echo "ERROR: Another frontend deployment is currently in progress (PID: $(cat "$LOCK_FILE"))."
        exit 1
    fi
    echo $$ > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT INT TERM
fi

cd "$SCRIPT_DIR"

# Ensure shared network exists
docker network inspect ecommerce-net >/dev/null 2>&1 || docker network create ecommerce-net

# 2. Pull or build image
echo "[1/4] Pulling frontend container image..."
docker compose -f docker-compose.frontend.yml pull || {
    echo "Notice: Registry pull unavailable or unauthorized, building frontend image locally..."
    docker compose -f docker-compose.frontend.yml build
}

# 3. Save release manifest for rollback
mkdir -p "$SCRIPT_DIR/releases"
RELEASE_TAG="$(date +"%Y%m%d-%H%M%S")"
cp "${SCRIPT_DIR}/.env.production" "${SCRIPT_DIR}/releases/release-${RELEASE_TAG}.env" 2>/dev/null || true

# 4. Deploy container
echo "[2/4] Deploying frontend container (rolling update)..."
docker compose -f docker-compose.frontend.yml up -d --remove-orphans

# 5. Stabilization window
echo "[3/4] Waiting 15s for Next.js standalone server to start..."
sleep 15

# 6. Health check
echo "[4/4] Executing health check..."
if [ -f "./health-check.sh" ]; then
    if ./health-check.sh; then
        echo "======================================================"
        echo " [FRONTEND] SUCCESS: Deployment verified and LIVE."
        echo "======================================================"
        exit 0
    else
        echo "======================================================"
        echo " [FRONTEND] ALERT: Health check failed! Rolling back..."
        echo "======================================================"
        if [ -f "./rollback.sh" ]; then
            ./rollback.sh
        fi
        exit 1
    fi
fi
