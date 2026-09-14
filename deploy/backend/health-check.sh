#!/usr/bin/env bash

set -Eeuo pipefail

TARGET="${1:-all}"
COMPOSE_FILE="docker-compose.backend.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ALL_SERVICES=(
  "api-gateway"
  "auth-service"
  "user-service"
  "catalog-service"
  "search-service"
  "cart-service"
  "inventory-service"
  "order-service"
  "payment-service"
  "shipping-service"
  "pricing-service"
  "review-service"
  "notification-service"
  "recommendation-service"
  "seller-marketplace-service"
  "admin-service"
)

get_endpoint() {
    case "$1" in
        api-gateway) echo "http://localhost:8000/health" ;;
        auth-service) echo "http://localhost:8001/health" ;;
        user-service) echo "http://localhost:8002/health" ;;
        catalog-service) echo "http://localhost:8003/actuator/health" ;;
        search-service) echo "http://localhost:8004/health" ;;
        cart-service) echo "http://localhost:8005/health" ;;
        inventory-service) echo "http://localhost:8006/actuator/health" ;;
        order-service) echo "http://localhost:8007/actuator/health" ;;
        payment-service) echo "http://localhost:8008/health" ;;
        shipping-service) echo "http://localhost:8009/health" ;;
        pricing-service) echo "http://localhost:8010/health" ;;
        review-service) echo "http://localhost:8011/api/v1/health" ;;
        notification-service) echo "http://localhost:8012/health" ;;
        recommendation-service) echo "http://localhost:8013/health" ;;
        seller-marketplace-service) echo "http://localhost:8014/actuator/health" ;;
        admin-service) echo "http://localhost:8015/health" ;;
        *) echo "" ;;
    esac
}

check_single_service() {
    local svc="$1"
    local url
    url="$(get_endpoint "$svc")"
    echo -n "Checking $svc ... "

    local max_attempts=12
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" ps "$svc" 2>/dev/null | grep -qE "Up|running"; then
            if [ -n "$url" ] && command -v curl >/dev/null 2>&1; then
                if curl -s -f -m 5 "$url" > /dev/null 2>&1; then
                    echo "OK"
                    return 0
                fi
            else
                echo "OK (container up)"
                return 0
            fi
        fi
        sleep 5
        attempt=$((attempt + 1))
    done

    echo "FAILED (service not healthy after 60s)"
    return 1
}

if [ "$TARGET" = "all" ]; then
    for svc in "${ALL_SERVICES[@]}"; do
        check_single_service "$svc" || exit 1
    done
else
    check_single_service "$TARGET" || exit 1
fi

echo "[BACKEND] All specified microservices passed health verification."
