-- Flyway Migration V1: Initialize Seller & Marketplace Service Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. sellers table
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL,
    seller_code VARCHAR(32) NOT NULL UNIQUE,
    display_name VARCHAR(128) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    country VARCHAR(3) NOT NULL DEFAULT 'USA',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seller_user_id ON sellers(user_id);
CREATE INDEX idx_seller_status ON sellers(status);
CREATE INDEX idx_seller_code ON sellers(seller_code);

-- 2. seller_stores table
CREATE TABLE seller_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL UNIQUE REFERENCES sellers(id) ON DELETE CASCADE,
    store_name VARCHAR(128) NOT NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    logo_url VARCHAR(512),
    banner_url VARCHAR(512),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_store_slug ON seller_stores(slug);

-- 3. seller_addresses table
CREATE TABLE seller_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL DEFAULT 'BUSINESS',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100),
    country VARCHAR(3) NOT NULL DEFAULT 'USA',
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seller_addr_seller_id ON seller_addresses(seller_id);

-- 4. seller_listings table
CREATE TABLE seller_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL,
    variant_id VARCHAR(64) NOT NULL,
    seller_sku VARCHAR(64) NOT NULL,
    listing_title VARCHAR(255) NOT NULL,
    condition VARCHAR(32) NOT NULL DEFAULT 'NEW',
    price_reference NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    fulfillment_type VARCHAR(32) NOT NULL DEFAULT 'SELLER',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seller_variant UNIQUE (seller_id, variant_id)
);

CREATE INDEX idx_listing_product ON seller_listings(product_id);
CREATE INDEX idx_listing_seller ON seller_listings(seller_id);
CREATE INDEX idx_listing_status ON seller_listings(status);
CREATE INDEX idx_listing_sku ON seller_listings(seller_sku);

-- 5. seller_offers table
CREATE TABLE seller_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES seller_listings(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    price NUMERIC(12, 2) NOT NULL,
    condition VARCHAR(32) NOT NULL DEFAULT 'NEW',
    fulfillment_type VARCHAR(32) NOT NULL DEFAULT 'SELLER',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offer_listing ON seller_offers(listing_id);
CREATE INDEX idx_offer_seller ON seller_offers(seller_id);

-- 6. commission_rules table
CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(64),
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    fixed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comm_category ON commission_rules(category_id);
CREATE INDEX idx_comm_seller ON commission_rules(seller_id);

-- 7. seller_performance table
CREATE TABLE seller_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL UNIQUE REFERENCES sellers(id) ON DELETE CASCADE,
    total_orders INT NOT NULL DEFAULT 0,
    completed_orders INT NOT NULL DEFAULT 0,
    cancelled_orders INT NOT NULL DEFAULT 0,
    returned_orders INT NOT NULL DEFAULT 0,
    late_shipments INT NOT NULL DEFAULT 0,
    average_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    response_time_minutes INT NOT NULL DEFAULT 60,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_perf_seller ON seller_performance(seller_id);

-- 8. product_catalog_reference table (Replicated candidate product info from Kafka)
CREATE TABLE product_catalog_reference (
    product_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(64),
    category_name VARCHAR(128),
    brand VARCHAR(128),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. outbox_events table (Transactional Outbox Pattern)
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_outbox_status_created ON outbox_events(status, created_at);
