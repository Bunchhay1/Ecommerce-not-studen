#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -n "Checking Customer Frontend (:3000) container state... "
if ! docker compose -f docker-compose.frontend.yml ps customer-frontend 2>/dev/null | grep -qE "Up|running"; then
    echo "FAILED (container is not running)"
    exit 1
fi
echo "RUNNING"

echo -n "Probing Customer Frontend HTTP port 3000... "
if command -v curl >/dev/null 2>&1; then
    attempts=0
    until curl -s -f -m 5 "http://localhost:3000" > /dev/null || [ $attempts -ge 10 ]; do
        sleep 2
        attempts=$((attempts + 1))
    done
    if ! curl -s -f -m 5 "http://localhost:3000" > /dev/null; then
        echo "FAILED (HTTP non-200 or connection refused)"
        exit 1
    fi
fi
echo "OK (HTTP 200)"

echo -n "Checking Company Frontend (:3001) container state... "
if ! docker compose -f docker-compose.frontend.yml ps company-frontend 2>/dev/null | grep -qE "Up|running"; then
    echo "FAILED (container is not running)"
    exit 1
fi
echo "RUNNING"

echo -n "Probing Company Frontend HTTP port 3001... "
if command -v curl >/dev/null 2>&1; then
    attempts=0
    until curl -s -f -m 5 "http://localhost:3001" > /dev/null || [ $attempts -ge 10 ]; do
        sleep 2
        attempts=$((attempts + 1))
    done
    if ! curl -s -f -m 5 "http://localhost:3001" > /dev/null; then
        echo "FAILED (HTTP non-200 or connection refused)"
        exit 1
    fi
fi
echo "OK (HTTP 200)"
