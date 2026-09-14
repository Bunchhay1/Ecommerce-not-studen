-- ============================================================================
-- Cambodia Production Seed: Shipping Service (shipping_db)
-- ============================================================================

-- 1. Shipments
INSERT INTO shipments (
  id, shipment_number, order_id, user_id, status, shipping_method, carrier, tracking_number,
  shipping_fee, currency, created_at, updated_at, shipped_at, delivered_at
)
VALUES
  (
    'shp-kh-33019',
    'SHP-2026-09-001',
    'ord-kh-90214',
    'usr-c001',
    'DELIVERED'::"ShipmentStatus",
    'EXPRESS'::"ShippingMethod",
    'VET_LOGISTICS',
    'KH-VET-88391204',
    0.00,
    'USD',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'shp-kh-33020',
    'SHP-2026-09-002',
    'ord-kh-90215',
    'usr-c002',
    'IN_TRANSIT'::"ShipmentStatus",
    'STANDARD'::"ShippingMethod",
    'JNT_EXPRESS',
    'KH-JNT-49210488',
    1.50,
    'USD',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '12 hours',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Destination Addresses
INSERT INTO shipment_addresses (
  id, shipment_id, recipient_name, phone, address_line1, address_line2, city, district, province, country, postal_code, created_at
)
VALUES
  (
    'shp-addr-01',
    'shp-kh-33019',
    'Sok Dara',
    '+855 12 884 102',
    '#42, Street 1986',
    'Sangkat Phnom Penh Thmey',
    'Phnom Penh',
    'Sen Sok',
    'Phnom Penh',
    'Cambodia',
    '120801',
    NOW() - INTERVAL '3 days'
  ),
  (
    'shp-addr-02',
    'shp-kh-33020',
    'Chea Bopha',
    '+855 10 392 781',
    'Villa 15, Street 288',
    'Sangkat Boeng Keng Kang I',
    'Phnom Penh',
    'Boeng Keng Kang',
    'Phnom Penh',
    'Cambodia',
    '120102',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Tracking Timeline Events
INSERT INTO tracking_events (
  id, shipment_id, status, location, description, created_at
)
VALUES
  (
    'trk-01',
    'shp-kh-33019',
    'PICKED_UP'::"ShipmentStatus",
    'Sen Sok Hub, Phnom Penh',
    'Package picked up from Phnom Penh Central Distribution Center',
    NOW() - INTERVAL '2 days'
  ),
  (
    'trk-02',
    'shp-kh-33019',
    'IN_TRANSIT'::"ShipmentStatus",
    'Sorting Facility Chamkarmon',
    'Package sorted and dispatched to local delivery vehicle',
    NOW() - INTERVAL '36 hours'
  ),
  (
    'trk-03',
    'shp-kh-33019',
    'DELIVERED'::"ShipmentStatus",
    'Sen Sok, Phnom Penh',
    'Delivered and signed by recipient: Sok Dara',
    NOW() - INTERVAL '1 day'
  ),
  (
    'trk-04',
    'shp-kh-33020',
    'IN_TRANSIT'::"ShipmentStatus",
    'Meanchey Transit Hub',
    'Package in transit to BKK1 delivery route',
    NOW() - INTERVAL '4 hours'
  )
ON CONFLICT (id) DO NOTHING;
