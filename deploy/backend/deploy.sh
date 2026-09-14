#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SERVICE="${1:-all}"
LOCK_FILE="/tmp/ecommerce-backend-deploy.lock"

echo "======================================================"
echo "  [BACKEND] Production Microservices Deploy"
echo "  Target: $TARGET_SERVICE"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================"

# 1. Acquire Deployment Lock (Portable Linux/macOS)
if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
        echo "ERROR: Another backend deployment is currently in progress."
        exit 1
    fi
else
    if [ -f "$LOCK_FILE" ] && kill -0 "$(cat "$LOCK_FILE" 2>/dev/null)" 2>/dev/null; then
        echo "ERROR: Another backend deployment is currently in progress (PID: $(cat "$LOCK_FILE"))."
        exit 1
    fi
    echo $$ > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT INT TERM
fi

cd "$SCRIPT_DIR"

# Ensure network exists
docker network inspect ecommerce-net >/dev/null 2>&1 || docker network create ecommerce-net

# 2. Database Snapshot Prior to Deployment
echo "[1/6] Generating database backup..."
if [ -f "./backup.sh" ]; then
    ./backup.sh || echo "Warning: Backup reported issues, continuing..."
fi

# 3. Pull Registry Images (with local build fallback)
echo "[2/6] Pulling updated backend images..."
if [ "$TARGET_SERVICE" = "all" ]; then
    docker compose -f docker-compose.backend.yml pull || {
        echo "Notice: Registry pull unavailable or unauthorized, building images locally..."
        docker compose -f docker-compose.backend.yml build
    }
else
    docker compose -f docker-compose.backend.yml pull "$TARGET_SERVICE" || {
        echo "Notice: Registry pull unavailable for $TARGET_SERVICE, building image locally..."
        docker compose -f docker-compose.backend.yml build "$TARGET_SERVICE"
    }
fi

# 4. Save Release Manifest for Rollback
mkdir -p "$SCRIPT_DIR/releases"
RELEASE_TAG="$(date +"%Y%m%d-%H%M%S")"
cp "${SCRIPT_DIR}/.env.production" "${SCRIPT_DIR}/releases/release-${RELEASE_TAG}.env" 2>/dev/null || true

# 5. Deploy / Rolling Update Containers
echo "[3/6] Deploying backend containers with zero-downtime rolling restart..."
if [ "$TARGET_SERVICE" = "all" ]; then
    docker compose -f docker-compose.backend.yml up -d --remove-orphans
else
    docker compose -f docker-compose.backend.yml up -d --no-deps "$TARGET_SERVICE"
fi

# 6. Service Stabilization Window
echo "[4/6] Waiting 20s for service stabilization..."
sleep 20

# 7. Automated Health Probing
echo "[5/6] Executing backend health checks..."
if [ -f "./health-check.sh" ]; then
    if ./health-check.sh "$TARGET_SERVICE"; then
        echo "======================================================"
        echo " [BACKEND] SUCCESS: All services verified and LIVE."
        echo "======================================================"
        exit 0
    else
        echo "======================================================"
        echo " [BACKEND] ALERT: Health check failed! Rolling back..."
        echo "======================================================"
        if [ -f "./rollback.sh" ]; then
            ./rollback.sh "$TARGET_SERVICE"
        fi
        exit 1
    fi
fi
