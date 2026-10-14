#!/usr/bin/env bash

# ==============================================================================
# Cambodia Production Marketplace Data Seeder
# Populates all microservice databases with realistic Cambodian seed records
# ==============================================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEEDS_DIR="${PROJECT_ROOT}/seeds"

echo "======================================================================"
echo "  [CAMBODIA MARKETPLACE] Production-Grade Database Seeder"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================================"

# 1. Verify PostgreSQL Container
if ! docker ps --filter "name=ecommerce-postgres" --format '{{.Names}}' | grep -q "ecommerce-postgres"; then
    echo "ERROR: PostgreSQL container 'ecommerce-postgres' is not running."
    echo "Please start the infrastructure fleet first: docker compose up -d postgres"
    exit 1
fi

echo "✓ PostgreSQL container detected and running."

# 2. Helper function to execute SQL against a specific database
exec_seed() {
    local db_name="$1"
    local sql_file="$2"
    local desc="$3"

    echo -n "Seeding [${db_name}] with ${desc}... "
    if [ ! -f "${SEEDS_DIR}/${sql_file}" ]; then
        echo "FAILED (File not found: ${sql_file})"
        exit 1
    fi

    if docker exec -i ecommerce-postgres psql -U postgres -d "${db_name}" < "${SEEDS_DIR}/${sql_file}" > /dev/null 2>&1; then
        echo "OK"
    else
        echo "FAILED (Database execution error)"
        exit 1
    fi
}

# 3. Execute Seeding Sequence Across Microservice Databases
exec_seed "auth_db" "01_auth_cambodia.sql" "Cambodian Users & Roles (Sok Dara, Chea Bopha...)"
exec_seed "user_db" "02_users_cambodia.sql" "Cambodian Profiles, Sangkat Addresses & Preferences"
exec_seed "user_db" "02_cambodia_locations.sql" "Administrative Hierarchy (All 25 Provinces, Sangkats, GPS) + 50 Addresses"
exec_seed "catalog_db" "03_catalog_cambodia.sql" "Categories, Brands & Cambodian Products"
exec_seed "catalog_db" "03_catalog_200_products.sql" "200 Production Catalog Products Across 7 Major Categories"
exec_seed "pricing_db" "04_pricing_cambodia.sql" "Base/Sale Prices & Festival Promotions (KNY2026, PCHUMBEN)"
exec_seed "pricing_db" "04_pricing_200_products.sql" "200 Product Prices with USD/KHR Dual-Currency Standards"
exec_seed "inventory_db" "05_inventory_cambodia.sql" "Sen Sok & Meanchey Warehouses + SKU Stock Allocations"
exec_seed "inventory_db" "05_inventory_200_products.sql" "200 SKU Inventory Allocations Across 4 Regional Warehouses"
exec_seed "seller_marketplace_db" "06_sellers_cambodia.sql" "Verified Merchants, Stores & Listings (PP Computer Hub...)"
exec_seed "seller_marketplace_db" "06_sellers_200_products.sql" "12 Verified Cambodian Merchants & 200 Active Marketplace Listings"
exec_seed "order_db" "07_orders_cambodia.sql" "Completed Customer Orders & Immutable Address Snapshots"
exec_seed "payment_db" "08_payments_cambodia.sql" "Bakong KHQR & ABA PAYWAY Captured Transactions"
exec_seed "shipping_db" "09_shipping_cambodia.sql" "VET Logistics & J&T Express Parcels with Tracking"
exec_seed "review_db" "10_reviews_cambodia.sql" "Bilingual Khmer/English Verified Reviews & Ratings"

echo ""
echo "======================================================================"
echo "  Seeding Verification Summary (Live Counts)"
echo "======================================================================"

USERS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d auth_db -t -c "SELECT count(*) FROM users;")
PRODUCTS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d catalog_db -t -c "SELECT count(*) FROM products;")
SELLERS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d seller_marketplace_db -t -c "SELECT count(*) FROM sellers;")
LISTINGS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d seller_marketplace_db -t -c "SELECT count(*) FROM seller_listings;")
ORDERS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d order_db -t -c "SELECT count(*) FROM orders;")
PAYMENTS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d payment_db -t -c "SELECT count(*) FROM payments;")
SHIPMENTS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d shipping_db -t -c "SELECT count(*) FROM shipments;")
REVIEWS_COUNT=$(docker exec ecommerce-postgres psql -U postgres -d review_db -t -c "SELECT count(*) FROM reviews;")

echo "  • Users Seeded:           $(echo $USERS_COUNT | xargs)"
echo "  • Catalog Products:       $(echo $PRODUCTS_COUNT | xargs)"
echo "  • Verified Sellers:       $(echo $SELLERS_COUNT | xargs)"
echo "  • Active Listings:        $(echo $LISTINGS_COUNT | xargs)"
echo "  • Orders in Pipeline:     $(echo $ORDERS_COUNT | xargs)"
echo "  • Payments Captured:      $(echo $PAYMENTS_COUNT | xargs)"
echo "  • Shipments Dispatched:   $(echo $SHIPMENTS_COUNT | xargs)"
echo "  • Verified Reviews:       $(echo $REVIEWS_COUNT | xargs)"

echo "======================================================================"
echo "  SUCCESS: Cambodia Production Dataset is LIVE and operational!"
echo "======================================================================"
