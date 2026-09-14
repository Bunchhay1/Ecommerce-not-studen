CREATE TABLE IF NOT EXISTS order_addresses (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL DEFAULT 'SHIPPING',
    full_name VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(64) NOT NULL,
    province VARCHAR(64),
    postal_code VARCHAR(32),
    country VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_addresses_order_id ON order_addresses(order_id);
