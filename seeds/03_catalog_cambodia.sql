-- ============================================================================
-- Cambodia Production Seed: Catalog Service (catalog_db)
-- ============================================================================

-- 1. Brands
INSERT INTO brands (id, name, slug, description, website_url, status, created_at, updated_at)
VALUES
  ('brd-apple', 'Apple', 'apple', 'Global premium consumer electronics and computing', 'https://www.apple.com/kh', 'ACTIVE', NOW(), NOW()),
  ('brd-angkor-harvest', 'Angkor Harvest', 'angkor-harvest', 'Premium organic agricultural produce from Battambang', 'https://angkorharvest.kh', 'ACTIVE', NOW(), NOW()),
  ('brd-kampot-origin', 'Kampot Origin', 'kampot-origin', 'Geographical Indication (PGI) certified Kampot pepper estate', 'https://kampotorigin.kh', 'ACTIVE', NOW(), NOW()),
  ('brd-mondulkiri', 'Mondulkiri Roasters', 'mondulkiri-roasters', 'Artisanal high-altitude shade-grown Cambodian Arabica coffee', 'https://mondulkiricoffee.kh', 'ACTIVE', NOW(), NOW()),
  ('brd-sovann-silk', 'Sovann Silk', 'sovann-silk', 'Authentic Cambodian golden silk handwoven in Siem Reap', 'https://sovannsilk.kh', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Categories
INSERT INTO categories (id, parent_id, name, slug, description, status, created_at, updated_at)
VALUES
  ('cat-elec', NULL, 'Electronics & Computers', 'electronics-computers', 'Laptops, mobile devices, and computer hardware', 'ACTIVE', NOW(), NOW()),
  ('cat-elec-laptop', 'cat-elec', 'Laptops & Notebooks', 'laptops-notebooks', 'High-performance laptops and ultrabooks', 'ACTIVE', NOW(), NOW()),
  ('cat-elec-phone', 'cat-elec', 'Smartphones & Tablets', 'smartphones-tablets', 'Mobile smartphones, cellular tablets, and gadgets', 'ACTIVE', NOW(), NOW()),
  
  ('cat-grocery', NULL, 'Cambodian Produce & Groceries', 'cambodian-produce-groceries', 'Authentic local agricultural commodities and organic delicacies', 'ACTIVE', NOW(), NOW()),
  ('cat-grocery-rice', 'cat-grocery', 'Jasmine Rice & Grains', 'jasmine-rice-grains', 'Phka Rumduol and premium long-grain fragrant rice', 'ACTIVE', NOW(), NOW()),
  ('cat-grocery-pepper', 'cat-grocery', 'Kampot Pepper (PGI)', 'kampot-pepper-pgi', 'World-renowned black, red, and white Kampot pepper', 'ACTIVE', NOW(), NOW()),
  ('cat-grocery-coffee', 'cat-grocery', 'Highland Coffee & Tea', 'highland-coffee-tea', 'Mondulkiri and Ratanakiri mountain grown roasts', 'ACTIVE', NOW(), NOW()),

  ('cat-apparel', NULL, 'Khmer Heritage & Fashion', 'khmer-heritage-fashion', 'Traditional silk garments, krama scarves, and modern fashion', 'ACTIVE', NOW(), NOW()),
  ('cat-apparel-silk', 'cat-apparel', 'Handwoven Golden Silk', 'handwoven-golden-silk', 'Pure Cambodian raw golden silk sampots and textiles', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO products (id, name, slug, description, brand_id, category_id, status, created_at, updated_at)
VALUES
  (
    'prd-mbp-m3',
    'Apple MacBook Pro 14" (Apple M3 Pro, 18GB RAM, 512GB SSD) - Space Black',
    'apple-macbook-pro-14-m3-pro-space-black',
    'High-performance laptop featuring Apple M3 Pro chip, Liquid Retina XDR display, up to 18 hours battery life. Official 1-year Cambodia distributor warranty included.',
    'brd-apple',
    'cat-elec-laptop',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'prd-ip15-pro',
    'Apple iPhone 15 Pro 256GB - Natural Titanium',
    'apple-iphone-15-pro-256gb-natural-titanium',
    'A17 Pro chip with 6-core GPU, titanium design with textured matte glass back, Action button, USB-C connector with USB 3 speeds. Cambodia TRC certified.',
    'brd-apple',
    'cat-elec-phone',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'prd-btb-rice',
    'Battambang Premium Organic Phka Rumduol Jasmine Rice (5kg Bag)',
    'battambang-premium-organic-phka-rumduol-jasmine-rice-5kg',
    'World-award-winning premium fragrant long-grain rice cultivated organically in Battambang province. Naturally soft, sweet-scented, and nutrient rich.',
    'brd-angkor-harvest',
    'cat-grocery-rice',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'prd-kpt-pepper',
    'Kampot PGI Organic Whole Black Pepper (100g Vacuum Glass Jar)',
    'kampot-pgi-organic-whole-black-pepper-100g',
    'Geographical Indication (PGI) certified whole black peppercorns from Kampot foothills. Renowned internationally for intense aroma, subtle citrus floral notes, and lingering warmth.',
    'brd-kampot-origin',
    'cat-grocery-pepper',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'prd-mdk-coffee',
    'Mondulkiri Highlands Peaberry Arabica Coffee Beans (250g Whole Bean)',
    'mondulkiri-highlands-peaberry-arabica-coffee-beans-250g',
    '100% shade-grown mountain Arabica peaberry beans harvested at 800m altitude in Sen Monorom, Mondulkiri. Medium-dark roast with chocolate, hazelnut, and caramel finish.',
    'brd-mondulkiri',
    'cat-grocery-coffee',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'prd-silk-sampot',
    'Handwoven Siem Reap Golden Silk Hol Sampot (Fabric Length 3.5m)',
    'handwoven-siem-reap-golden-silk-hol-sampot-3-5m',
    'Traditional Cambodian royal pattern handwoven using natural raw yellow golden silk threads dyed with natural plant extracts in Banteay Srei, Siem Reap.',
    'brd-sovann-silk',
    'cat-apparel-silk',
    'ACTIVE',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Product Variants
INSERT INTO product_variants (id, product_id, sku, status, created_at, updated_at)
VALUES
  ('var-mbp-m3', 'prd-mbp-m3', 'SKU-MBP-14-M3-SB', 'ACTIVE', NOW(), NOW()),
  ('var-ip15-256', 'prd-ip15-pro', 'SKU-IP15P-256-NT', 'ACTIVE', NOW(), NOW()),
  ('var-btb-5kg', 'prd-btb-rice', 'SKU-BTB-RICE-5KG', 'ACTIVE', NOW(), NOW()),
  ('var-kpt-100g', 'prd-kpt-pepper', 'SKU-KPT-PEP-100G', 'ACTIVE', NOW(), NOW()),
  ('var-mdk-250g', 'prd-mdk-coffee', 'SKU-MDK-COF-250G', 'ACTIVE', NOW(), NOW()),
  ('var-slk-35m', 'prd-silk-sampot', 'SKU-SLK-SMP-35M', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Product Images
INSERT INTO product_images (id, product_id, image_url, url, sort_order, is_primary, alt_text, created_at)
VALUES
  ('img-mbp-01', 'prd-mbp-m3', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 1, true, 'MacBook Pro 14 Front View', NOW()),
  ('img-ip15-01', 'prd-ip15-pro', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 1, true, 'iPhone 15 Pro Titanium', NOW()),
  ('img-rice-01', 'prd-btb-rice', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80', 1, true, 'Organic Jasmine Rice Raw Grains', NOW()),
  ('img-pep-01', 'prd-kpt-pepper', 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80', 1, true, 'Whole Black Peppercorns', NOW()),
  ('img-cof-01', 'prd-mdk-coffee', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80', 1, true, 'Roasted Coffee Beans', NOW()),
  ('img-slk-01', 'prd-silk-sampot', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80', 1, true, 'Handwoven Golden Silk Textile', NOW())
ON CONFLICT (id) DO NOTHING;
