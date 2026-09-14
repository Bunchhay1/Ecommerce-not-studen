-- ============================================================================
-- Cambodia Production Seed: Payment Service (payment_db)
-- ============================================================================

-- Create tables matching EF Core PaymentDbContext
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'MOCK',
    provider_payment_id VARCHAR(255),
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY,
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL DEFAULT 'Payment',
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    error_message VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_idempotencies (
    id UUID PRIMARY KEY,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    payment_id UUID NOT NULL,
    response_payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Payment Records
INSERT INTO payments (
  id, payment_number, order_id, user_id, amount, currency, payment_method, status, provider, provider_payment_id, created_at, updated_at
)
VALUES
  (
    '55555555-5555-5555-5555-555555555001'::uuid,
    'PAY-2026-09-001',
    'ord-kh-90214',
    'usr-c001',
    2187.90,
    'USD',
    'QR_CODE',
    'CAPTURED',
    'BAKONG_KHQR',
    'BAKONG-TXN-20260914-884192',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  ),
  (
    '55555555-5555-5555-5555-555555555002'::uuid,
    'PAY-2026-09-002',
    'ord-kh-90215',
    'usr-c002',
    27.38,
    'USD',
    'DIGITAL_WALLET',
    'CAPTURED',
    'ABA_PAYWAY',
    'ABA-PAY-TXN-9941028',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;
