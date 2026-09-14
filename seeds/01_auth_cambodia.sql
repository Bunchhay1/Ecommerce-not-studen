-- ============================================================================
-- Cambodia Production Seed: Auth Service (auth_db)
-- ============================================================================

-- Ensure roles exist
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES 
  ('role-customer', 'CUSTOMER', 'Customer role with shopping and purchasing permissions', NOW(), NOW()),
  ('role-seller', 'SELLER', 'Seller role with merchant and catalog management permissions', NOW(), NOW()),
  ('role-admin', 'ADMIN', 'Super administrator role with platform control permissions', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Valid BCrypt hash for "Password123!"
-- Generated with cost 12: $2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O

-- Customers
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, is_verified, created_at, updated_at)
VALUES
  ('usr-c001', 'sok.dara@synth-mail.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Dara', 'Sok', true, true, NOW(), NOW()),
  ('usr-c002', 'chea.bopha@synth-mail.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Bopha', 'Chea', true, true, NOW(), NOW()),
  ('usr-c003', 'chan.vanna@synth-mail.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Vanna', 'Chan', true, true, NOW(), NOW()),
  ('usr-c004', 'keo.pich@synth-mail.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Pich', 'Keo', true, true, NOW(), NOW()),
  ('usr-c005', 'heng.sovann@synth-mail.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Sovann', 'Heng', true, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  is_verified = true;

-- Assign Customer Roles dynamically
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM (VALUES ('usr-c001'), ('usr-c002'), ('usr-c003'), ('usr-c004'), ('usr-c005')) AS u(id)
CROSS JOIN roles r
WHERE r.name = 'CUSTOMER'
ON CONFLICT DO NOTHING;

-- Sellers
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, is_verified, created_at, updated_at)
VALUES
  ('usr-s101', 'bunly.rithy@phnompenhcomputer.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Rithy', 'Bunly', true, true, NOW(), NOW()),
  ('usr-s102', 'meng.sreymom@angkorsilk.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Sreymom', 'Meng', true, true, NOW(), NOW()),
  ('usr-s103', 'ly.rathana@battambangagrico.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Rathana', 'Ly', true, true, NOW(), NOW()),
  ('usr-s104', 'ouk.chanthy@mondulkiriroasters.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Chanthy', 'Ouk', true, true, NOW(), NOW()),
  ('usr-s105', 'tep.samnang@sovannmobile.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Samnang', 'Tep', true, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  is_verified = true;

-- Assign Seller Roles dynamically
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM (VALUES ('usr-s101'), ('usr-s102'), ('usr-s103'), ('usr-s104'), ('usr-s105')) AS u(id)
CROSS JOIN roles r
WHERE r.name = 'SELLER'
ON CONFLICT DO NOTHING;

-- Administrator
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, is_verified, created_at, updated_at)
VALUES
  ('usr-a001', 'admin.boran@marketplace.kh', '$2b$12$8KiqaWk9cmWyfQEwJjLBP.BT9SPpqwbOoL1Xs/rE08G32rX37iR6O', 'Boran', 'Chhay', true, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_active = true,
  is_verified = true;

-- Assign Admin Role dynamically
INSERT INTO user_roles (user_id, role_id)
SELECT 'usr-a001', r.id
FROM roles r
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;
