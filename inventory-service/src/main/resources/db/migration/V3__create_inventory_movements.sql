CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(36) PRIMARY KEY,
    inventory_id VARCHAR(36) NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    variant_id VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    quantity INT NOT NULL,
    previous_total INT NOT NULL,
    new_total INT NOT NULL,
    previous_reserved INT NOT NULL,
    new_reserved INT NOT NULL,
    previous_available INT NOT NULL,
    new_available INT NOT NULL,
    reference_type VARCHAR(64),
    reference_id VARCHAR(64),
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_movements_inventory_id ON inventory_movements(inventory_id);
CREATE INDEX idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
