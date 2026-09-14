-- ============================================================================
-- Cambodia Production Seed: Pricing Service (pricing_db)
-- ============================================================================

-- 1. Product Prices (Prices in USD; standard 4 decimals numeric(19,4))
INSERT INTO product_prices (id, product_id, variant_id, currency, base_price, sale_price, status, created_at, updated_at)
VALUES
  ('prc-mbp-m3', 'prd-mbp-m3', 'var-mbp-m3', 'USD', 1999.0000, 1949.0000, 'ACTIVE', NOW(), NOW()),
  ('prc-ip15-256', 'prd-ip15-pro', 'var-ip15-256', 'USD', 1089.0000, 1049.0000, 'ACTIVE', NOW(), NOW()),
  ('prc-btb-5kg', 'prd-btb-rice', 'var-btb-5kg', 'USD', 9.5000, 8.9000, 'ACTIVE', NOW(), NOW()),
  ('prc-kpt-100g', 'prd-kpt-pepper', 'var-kpt-100g', 'USD', 6.2500, 5.7500, 'ACTIVE', NOW(), NOW()),
  ('prc-mdk-250g', 'prd-mdk-coffee', 'var-mdk-250g', 'USD', 7.5000, 6.9900, 'ACTIVE', NOW(), NOW()),
  ('prc-slk-35m', 'prd-silk-sampot', 'var-slk-35m', 'USD', 120.0000, 110.0000, 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Promotions (Cambodia Cultural & Festival Campaigns)
INSERT INTO promotions (
  id, name, code, type, status, priority, discount_value, description,
  start_at, end_at, usage_limit, usage_count, per_user_limit, min_order_amount, max_discount_amount, is_stackable, created_at, updated_at
)
VALUES
  (
    'prm-kny-2026',
    'Khmer New Year Mega Celebration (បុណ្យចូលឆ្នាំថ្មី)',
    'KNY2026',
    'PERCENTAGE',
    'ACTIVE',
    10,
    15.0000,
    'Celebrate Khmer New Year with 15% discount across all categories',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '30 days',
    10000,
    142,
    1,
    30.0000,
    50.0000,
    false,
    NOW(),
    NOW()
  ),
  (
    'prm-pchum-ben',
    'Pchum Ben Ancestor Festival Voucher (បុណ្យភ្ជុំបិណ្ឌ)',
    'PCHUMBEN',
    'FIXED_AMOUNT',
    'ACTIVE',
    20,
    10.0000,
    '$10 voucher on orders above $50 during the Pchum Ben religious season',
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '45 days',
    5000,
    318,
    2,
    50.0000,
    10.0000,
    true,
    NOW(),
    NOW()
  ),
  (
    'prm-water-fest',
    'Water Festival Royal Regatta Sale (បុណ្យអុំទូក)',
    'WATERFEST',
    'FIXED_AMOUNT',
    'ACTIVE',
    5,
    5.0000,
    '$5 shipping subsidy during the Water Festival holiday period',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '60 days',
    20000,
    89,
    3,
    20.0000,
    5.0000,
    false,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Coupons
INSERT INTO coupons (id, promotion_id, code, status, usage_limit, usage_count, per_user_limit, expires_at, created_at, updated_at)
VALUES
  ('cpn-kny', 'prm-kny-2026', 'KNY2026', 'ACTIVE', 10000, 142, 1, NOW() + INTERVAL '30 days', NOW(), NOW()),
  ('cpn-pchum', 'prm-pchum-ben', 'PCHUMBEN', 'ACTIVE', 5000, 318, 2, NOW() + INTERVAL '45 days', NOW(), NOW()),
  ('cpn-water', 'prm-water-fest', 'WATERFEST', 'ACTIVE', 20000, 89, 3, NOW() + INTERVAL '60 days', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
