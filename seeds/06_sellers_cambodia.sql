-- ============================================================================
-- Cambodia Production Seed: Seller Marketplace Service (seller_marketplace_db)
-- ============================================================================

-- 1. Verified Cambodian Sellers
INSERT INTO sellers (
  id, user_id, seller_code, display_name, legal_name, business_name, email, phone, country, status, verification_status, created_at, updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111101'::uuid,
    'usr-s101',
    'SEL-PP-COMP',
    'Phnom Penh Computer Hub',
    'Bunly Computer Trading Co., Ltd.',
    'Phnom Penh Computer Hub',
    'bunly.rithy@phnompenhcomputer.kh',
    '+855 12 901 234',
    'KHM',
    'ACTIVE',
    'VERIFIED',
    NOW(),
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111102'::uuid,
    'usr-s102',
    'SEL-SR-SILK',
    'Angkor Silk & Handicrafts',
    'Angkor Heritage Artisan Enterprise',
    'Angkor Silk & Handicrafts',
    'meng.sreymom@angkorsilk.kh',
    '+855 10 782 119',
    'KHM',
    'ACTIVE',
    'VERIFIED',
    NOW(),
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111103'::uuid,
    'usr-s103',
    'SEL-BB-AGRI',
    'Battambang Agrico Organics',
    'Battambang Organic Farmers Cooperative',
    'Battambang Agrico Organics',
    'ly.rathana@battambangagrico.kh',
    '+855 77 443 892',
    'KHM',
    'ACTIVE',
    'VERIFIED',
    NOW(),
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111104'::uuid,
    'usr-s104',
    'SEL-MK-COFF',
    'Mondulkiri Coffee Roasters',
    'Mondulkiri Highland Roasters Ltd.',
    'Mondulkiri Coffee Roasters',
    'ouk.chanthy@mondulkiriroasters.kh',
    '+855 15 621 804',
    'KHM',
    'ACTIVE',
    'VERIFIED',
    NOW(),
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111105'::uuid,
    'usr-s105',
    'SEL-PP-SOVN',
    'Sovann Mobile Tech',
    'Sovann Telecommunications Co., Ltd.',
    'Sovann Mobile Tech',
    'tep.samnang@sovannmobile.kh',
    '+855 93 519 320',
    'KHM',
    'ACTIVE',
    'VERIFIED',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Seller Stores
INSERT INTO seller_stores (
  id, seller_id, store_name, slug, description, logo_url, banner_url, status, created_at, updated_at
)
VALUES
  (
    '22222222-2222-2222-2222-222222222101'::uuid,
    '11111111-1111-1111-1111-111111111101'::uuid,
    'Phnom Penh Computer Hub',
    'phnom-penh-computer-hub',
    'Official authorized distributor of premium computing equipment and Apple products in Cambodia.',
    'https://cdn.example.kh/stores/pp-computer-logo.webp',
    'https://cdn.example.kh/stores/pp-computer-banner.webp',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222102'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    'Angkor Silk & Handicrafts',
    'angkor-silk-handicrafts',
    'Preserving centuries-old Cambodian handloom silk weaving traditions from Banteay Srei.',
    'https://cdn.example.kh/stores/angkor-silk-logo.webp',
    'https://cdn.example.kh/stores/angkor-silk-banner.webp',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222103'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    'Battambang Agrico Organics',
    'battambang-agrico-organics',
    '100% natural organic rice and PGI Kampot pepper sourced directly from Cambodian growers.',
    'https://cdn.example.kh/stores/btb-agri-logo.webp',
    'https://cdn.example.kh/stores/btb-agri-banner.webp',
    'ACTIVE',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Seller Listings (Linking Catalog Products to Merchants)
INSERT INTO seller_listings (
  id, seller_id, product_id, variant_id, seller_sku, listing_title, condition, price_reference, status, fulfillment_type, created_at, updated_at
)
VALUES
  (
    '33333333-3333-3333-3333-333333333101'::uuid,
    '11111111-1111-1111-1111-111111111101'::uuid,
    'prd-mbp-m3',
    'var-mbp-m3',
    'SKU-MBP-14-M3-SB',
    'Apple MacBook Pro 14" M3 Pro (Space Black) - 1 Yr Official Cambodia Warranty',
    'NEW',
    1999.00,
    'ACTIVE',
    'SELLER',
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333102'::uuid,
    '11111111-1111-1111-1111-111111111105'::uuid,
    'prd-ip15-pro',
    'var-ip15-256',
    'SKU-IP15P-256-NT',
    'Apple iPhone 15 Pro 256GB Natural Titanium (TRC Certified)',
    'NEW',
    1089.00,
    'ACTIVE',
    'SELLER',
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333103'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    'prd-btb-rice',
    'var-btb-5kg',
    'SKU-BTB-RICE-5KG',
    'Battambang Phka Rumduol Organic Jasmine Fragrant Rice 5kg',
    'NEW',
    9.50,
    'ACTIVE',
    'SELLER',
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333104'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    'prd-kpt-pepper',
    'var-kpt-100g',
    'SKU-KPT-PEP-100G',
    'Kampot PGI Whole Black Pepper 100g Sealed Glass Jar',
    'NEW',
    6.25,
    'ACTIVE',
    'SELLER',
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333105'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    'prd-silk-sampot',
    'var-slk-35m',
    'SKU-SLK-SMP-35M',
    'Handmade 100% Raw Golden Silk Sampot Fabric (3.5 Meters)',
    'NEW',
    120.00,
    'ACTIVE',
    'SELLER',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
