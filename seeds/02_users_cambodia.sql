-- ============================================================================
-- Cambodia Production Seed: User Service (user_db)
-- ============================================================================

-- Create tables if not exist
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    theme VARCHAR(20) NOT NULL DEFAULT 'system',
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Profiles
INSERT INTO profiles (id, user_id, first_name, last_name, phone, avatar_url, created_at, updated_at)
VALUES
  ('prof-c001', 'usr-c001', 'Dara', 'Sok', '+855 12 884 102', 'https://cdn.example.kh/avatars/sok-dara.webp', NOW(), NOW()),
  ('prof-c002', 'usr-c002', 'Bopha', 'Chea', '+855 10 392 781', 'https://cdn.example.kh/avatars/chea-bopha.webp', NOW(), NOW()),
  ('prof-c003', 'usr-c003', 'Vanna', 'Chan', '+855 77 651 902', 'https://cdn.example.kh/avatars/chan-vanna.webp', NOW(), NOW()),
  ('prof-c004', 'usr-c004', 'Pich', 'Keo', '+855 16 710 439', 'https://cdn.example.kh/avatars/keo-pich.webp', NOW(), NOW()),
  ('prof-c005', 'usr-c005', 'Sovann', 'Heng', '+855 98 420 563', 'https://cdn.example.kh/avatars/heng-sovann.webp', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Addresses
INSERT INTO addresses (id, user_id, label, recipient_name, phone, address_line1, address_line2, city, province, country, postal_code, is_default, created_at, updated_at)
VALUES
  ('addr-pp-01', 'usr-c001', 'Home', 'Sok Dara', '+855 12 884 102', '#42, Street 1986', 'Sangkat Phnom Penh Thmey', 'Phnom Penh', 'Sen Sok', 'Cambodia', '120801', true, NOW(), NOW()),
  ('addr-pp-02', 'usr-c002', 'Office', 'Chea Bopha', '+855 10 392 781', 'Villa 15, Street 288', 'Sangkat Boeng Keng Kang I', 'Phnom Penh', 'Boeng Keng Kang', 'Cambodia', '120102', true, NOW(), NOW()),
  ('addr-sr-01', 'usr-c003', 'Storefront', 'Chan Vanna', '+855 77 651 902', '#108, Charles de Gaulle Blvd', 'Sangkat Svay Dangkum', 'Siem Reap', 'Krong Siem Reap', 'Cambodia', '17252', true, NOW(), NOW()),
  ('addr-bb-01', 'usr-c004', 'Home', 'Keo Pich', '+855 16 710 439', '#55, Street 3', 'Sangkat Ratanak', 'Battambang', 'Krong Battambang', 'Cambodia', '02302', true, NOW(), NOW()),
  ('addr-sh-01', 'usr-c005', 'Condo', 'Heng Sovann', '+855 98 420 563', 'Unit 12B, Ekareach Street', 'Sangkat 4', 'Preah Sihanouk', 'Krong Preah Sihanouk', 'Cambodia', '18204', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed User Preferences (Dual-Currency: USD default, Khmer/English support)
INSERT INTO user_preferences (id, user_id, language, currency, email_notifications, sms_notifications, push_notifications, created_at, updated_at)
VALUES
  ('pref-c001', 'usr-c001', 'km', 'USD', true, true, true, NOW(), NOW()),
  ('pref-c002', 'usr-c002', 'en', 'USD', true, false, true, NOW(), NOW()),
  ('pref-c003', 'usr-c003', 'km', 'KHR', true, true, true, NOW(), NOW()),
  ('pref-c004', 'usr-c004', 'km', 'USD', true, false, true, NOW(), NOW()),
  ('pref-c005', 'usr-c005', 'en', 'USD', true, true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
