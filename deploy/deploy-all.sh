#!/usr/bin/env bash

set -Eeuo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================"
echo "  E-Commerce Full Platform Deployment"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================"

# Step 1: Deploy Backend Fleet
echo ">>> [1/2] Initiating Backend Deployment..."
"$DEPLOY_DIR/backend/deploy.sh" all

# Step 2: Deploy Frontend Client
echo ">>> [2/2] Initiating Frontend Deployment..."
"$DEPLOY_DIR/frontend/deploy.sh"

echo "======================================================"
echo "  ALL PLATFORM SERVICES DEPLOYED SUCCESSFULLY"
echo "======================================================"
