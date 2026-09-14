-- ============================================================================
-- Cambodia Production Seed: Inventory Service (inventory_db)
-- ============================================================================

-- 1. Warehouses across key Cambodian logistics centers
INSERT INTO warehouses (id, code, name, address, city, country, is_active, created_at, updated_at)
VALUES
  ('wh-pp-main', 'WH-PP-SENSOK', 'Phnom Penh Central Distribution Center', '#88 Street 1986, Sangkat Phnom Penh Thmey, Khan Sen Sok', 'Phnom Penh', 'Cambodia', true, NOW(), NOW()),
  ('wh-pp-south', 'WH-PP-MEANCHEY', 'Phnom Penh South Hub', 'National Road 2, Sangkat Chak Angre, Khan Meanchey', 'Phnom Penh', 'Cambodia', true, NOW(), NOW()),
  ('wh-sr-hub', 'WH-SR-CENTRAL', 'Siem Reap Regional Hub', 'Sivutha Blvd, Sangkat Svay Dangkum, Krong Siem Reap', 'Siem Reap', 'Cambodia', true, NOW(), NOW()),
  ('wh-bb-hub', 'WH-BB-AGRI', 'Battambang Agro Logistics Center', 'National Road 5, Sangkat Ratanak, Krong Battambang', 'Battambang', 'Cambodia', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Inventory Items
INSERT INTO inventory_items (id, product_id, variant_id, sku, total_quantity, reserved_quantity, available_quantity, low_stock_threshold, status, created_at, updated_at)
VALUES
  ('inv-mbp-m3', 'prd-mbp-m3', 'var-mbp-m3', 'SKU-MBP-14-M3-SB', 25, 2, 23, 5, 'IN_STOCK', NOW(), NOW()),
  ('inv-ip15-256', 'prd-ip15-pro', 'var-ip15-256', 'SKU-IP15P-256-NT', 40, 4, 36, 8, 'IN_STOCK', NOW(), NOW()),
  ('inv-btb-5kg', 'prd-btb-rice', 'var-btb-5kg', 'SKU-BTB-RICE-5KG', 500, 20, 480, 50, 'IN_STOCK', NOW(), NOW()),
  ('inv-kpt-100g', 'prd-kpt-pepper', 'var-kpt-100g', 'SKU-KPT-PEP-100G', 300, 15, 285, 30, 'IN_STOCK', NOW(), NOW()),
  ('inv-mdk-250g', 'prd-mdk-coffee', 'var-mdk-250g', 'SKU-MDK-COF-250G', 150, 10, 140, 20, 'IN_STOCK', NOW(), NOW()),
  ('inv-slk-35m', 'prd-silk-sampot', 'var-slk-35m', 'SKU-SLK-SMP-35M', 20, 1, 19, 3, 'IN_STOCK', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Warehouse Stock Distribution
INSERT INTO warehouse_stock (id, warehouse_id, variant_id, quantity, reserved_quantity, available_quantity, created_at, updated_at)
VALUES
  ('ws-mbp-pp', 'wh-pp-main', 'var-mbp-m3', 25, 2, 23, NOW(), NOW()),
  ('ws-ip15-pp', 'wh-pp-main', 'var-ip15-256', 40, 4, 36, NOW(), NOW()),
  ('ws-rice-bb', 'wh-bb-hub', 'var-btb-5kg', 500, 20, 480, NOW(), NOW()),
  ('ws-pep-pp', 'wh-pp-main', 'var-kpt-100g', 300, 15, 285, NOW(), NOW()),
  ('ws-cof-pp', 'wh-pp-south', 'var-mdk-250g', 150, 10, 140, NOW(), NOW()),
  ('ws-slk-sr', 'wh-sr-hub', 'var-slk-35m', 20, 1, 19, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
