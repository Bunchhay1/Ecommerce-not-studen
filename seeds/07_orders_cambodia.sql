-- ============================================================================
-- Cambodia Production Seed: Order Service (order_db)
-- ============================================================================

-- 1. Orders
INSERT INTO orders (
  id, order_number, user_id, status, currency, subtotal, discount, shipping_fee, tax, total,
  payment_status, payment_method, payment_reference, shipping_status, reservation_id, idempotency_key,
  notes, created_at, updated_at, completed_at
)
VALUES
  (
    'ord-kh-90214',
    'ORD-2026-09-001',
    'usr-c001',
    'DELIVERED',
    'USD',
    1999.00,
    10.00,
    0.00,
    198.90,
    2187.90,
    'PAID',
    'KHQR_BAKONG',
    'BAKONG-TXN-20260914-884192',
    'DELIVERED',
    'res-77210',
    'chk-9a8f21bc-341e-4001',
    'Call customer upon arrival at Sen Sok house gate',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'ord-kh-90215',
    'ORD-2026-09-002',
    'usr-c002',
    'PROCESSING',
    'USD',
    25.25,
    0.00,
    1.50,
    0.63,
    27.38,
    'PAID',
    'ABA_PAY',
    'ABA-PAY-TXN-9941028',
    'IN_TRANSIT',
    'res-77211',
    'chk-9a8f21bc-341e-4002',
    'Deliver to BKK1 office reception desk',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 hours',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Order Items
INSERT INTO order_items (
  id, order_id, product_id, variant_id, sku, product_name, image_url, quantity, unit_price, discount, subtotal, created_at
)
VALUES
  (
    'itm-90214-01',
    'ord-kh-90214',
    'prd-mbp-m3',
    'var-mbp-m3',
    'SKU-MBP-14-M3-SB',
    'Apple MacBook Pro 14" (Apple M3 Pro, 18GB RAM, 512GB SSD) - Space Black',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    1,
    1999.00,
    10.00,
    1989.00,
    NOW() - INTERVAL '3 days'
  ),
  (
    'itm-90215-01',
    'ord-kh-90215',
    'prd-btb-rice',
    'var-btb-5kg',
    'SKU-BTB-RICE-5KG',
    'Battambang Premium Organic Phka Rumduol Jasmine Rice (5kg Bag)',
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    2,
    9.50,
    0.00,
    19.00,
    NOW() - INTERVAL '1 day'
  ),
  (
    'itm-90215-02',
    'ord-kh-90215',
    'prd-kpt-pepper',
    'var-kpt-100g',
    'SKU-KPT-PEP-100G',
    'Kampot PGI Organic Whole Black Pepper (100g Vacuum Glass Jar)',
    'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=800&q=80',
    1,
    6.25,
    0.00,
    6.25,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Immutable Order Address Snapshots
INSERT INTO order_addresses (
  id, order_id, type, full_name, phone, address_line1, address_line2, city, province, postal_code, country, created_at
)
VALUES
  (
    'ord-addr-01',
    'ord-kh-90214',
    'SHIPPING',
    'Sok Dara',
    '+855 12 884 102',
    '#42, Street 1986',
    'Sangkat Phnom Penh Thmey',
    'Phnom Penh',
    'Sen Sok',
    '120801',
    'Cambodia',
    NOW() - INTERVAL '3 days'
  ),
  (
    'ord-addr-02',
    'ord-kh-90215',
    'SHIPPING',
    'Chea Bopha',
    '+855 10 392 781',
    'Villa 15, Street 288',
    'Sangkat Boeng Keng Kang I',
    'Phnom Penh',
    'Boeng Keng Kang',
    '120102',
    'Cambodia',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;
