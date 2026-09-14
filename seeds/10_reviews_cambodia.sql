-- ============================================================================
-- Cambodia Production Seed: Review Service (review_db)
-- ============================================================================

-- 1. Reviews
INSERT INTO reviews (
  id, product_id, variant_id, user_id, order_id, rating, title, content, status,
  verified_purchase, helpful_count, report_count, created_at, updated_at, published_at
)
VALUES
  (
    'rev-001',
    'prd-mbp-m3',
    'var-mbp-m3',
    'usr-c001',
    'ord-kh-90214',
    5,
    'Best laptop for software development in Phnom Penh',
    'ទិញពីហាង Phnom Penh Computer Hub ដឹកជញ្ជូនលឿនណាស់ ត្រឹមតែ១ថ្ងៃបានដល់ផ្ទះនៅសែនសុខ។ ម៉ាស៊ីនដើរលឿន ថ្មកាន់បានយូរខ្លាំងណាស់។ Excellent official Apple warranty and fast delivery via J&T!',
    'PUBLISHED'::"ReviewStatus",
    true,
    14,
    0,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    'rev-002',
    'prd-btb-rice',
    'var-btb-5kg',
    'usr-c002',
    'ord-kh-90215',
    5,
    'អង្ករផ្ការំដួលពិតជាក្រអូបឆ្ងាញ់',
    'បាយទន់ ក្រអូបឈ្ងុយ គុណភាពល្អឥតខ្ចោះ។ គ្រួសារខ្ញុំចូលចិត្តខ្លាំងណាស់។ Authentic Battambang rice, nicely vacuum-packed.',
    'PUBLISHED'::"ReviewStatus",
    true,
    8,
    0,
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  ),
  (
    'rev-003',
    'prd-kpt-pepper',
    'var-kpt-100g',
    'usr-c003',
    NULL,
    5,
    'World standard Kampot pepper',
    'ម្រេចកំពតពិតប្រាកដ ក្លិនឈ្ងុយខ្លាំង រសជាតិហឹរស្រទន់។ Great glass bottle packaging with authentic PGI QR verification seal.',
    'PUBLISHED'::"ReviewStatus",
    true,
    5,
    0,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Product Rating Summaries
INSERT INTO product_rating_summaries (
  product_id, total_reviews, rating_sum, average_rating, rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, updated_at
)
VALUES
  ('prd-mbp-m3', 1, 5, 5.0, 0, 0, 0, 0, 1, NOW()),
  ('prd-btb-rice', 1, 5, 5.0, 0, 0, 0, 0, 1, NOW()),
  ('prd-kpt-pepper', 1, 5, 5.0, 0, 0, 0, 0, 1, NOW())
ON CONFLICT (product_id) DO UPDATE SET
  total_reviews = EXCLUDED.total_reviews,
  rating_sum = EXCLUDED.rating_sum,
  average_rating = EXCLUDED.average_rating,
  rating_5_count = EXCLUDED.rating_5_count,
  updated_at = NOW();
