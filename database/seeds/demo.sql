-- Seed data for development and demo purposes
-- Passwords are all: Demo#2024

INSERT INTO gold_prices (price_date, price_per_gram_eur, source) VALUES
  (CURRENT_DATE - 90, 58.42, 'London Bullion Market'),
  (CURRENT_DATE - 60, 59.15, 'London Bullion Market'),
  (CURRENT_DATE - 30, 60.23, 'London Bullion Market'),
  (CURRENT_DATE,      61.50, 'London Bullion Market');

INSERT INTO investors (id, email, password_hash, first_name, last_name, entity_type, country_code, jurisdiction, kyc_status, role, email_verified) VALUES
  ('11111111-1111-1111-1111-111111111111','jean.dupont@familyoffice.fr',  '$2b$12$seed_hash_placeholder','Jean',   'Dupont',  'family_office','FR','France',      'approved','investor',true),
  ('22222222-2222-2222-2222-222222222222','maria.silva@esgfund.pt',       '$2b$12$seed_hash_placeholder','Maria',  'Silva',   'esg_fund',     'PT','Portugal',    'approved','investor',true),
  ('33333333-3333-3333-3333-333333333333','hans.mueller@institution.de',  '$2b$12$seed_hash_placeholder','Hans',   'Müller',  'institution',  'DE','Germany',     'approved','investor',true),
  ('44444444-4444-4444-4444-444444444444','sophie.martin@private.ch',     '$2b$12$seed_hash_placeholder','Sophie', 'Martin',  'individual',   'CH','Switzerland', 'approved','investor',true),
  ('99999999-9999-9999-9999-999999999999','admin@rebijoux.com',           '$2b$12$seed_hash_placeholder','Admin',  'Rebijoux','institution',  'PT','Portugal',    'approved','admin',   true);

INSERT INTO wallets (id, investor_id, xrpl_address, wallet_label) VALUES
  ('a1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','rN7n7otQDd6FczFgLdSampleAddress1','Primary Custody Wallet'),
  ('a2222222-2222-2222-2222-222222222222','22222222-2222-2222-2222-222222222222','rN7n7otQDd6FczFgLdSampleAddress2','ESG Fund Main Wallet'),
  ('a3333333-3333-3333-3333-333333333333','33333333-3333-3333-3333-333333333333','rN7n7otQDd6FczFgLdSampleAddress3','Institutional Vault'),
  ('a4444444-4444-4444-4444-444444444444','44444444-4444-4444-4444-444444444444','rN7n7otQDd6FczFgLdSampleAddress4','Private Banking Wallet');

INSERT INTO transactions (investor_id, wallet_id, transaction_hash, ledger_index, transaction_type, token_amount, gold_grams, price_per_token, total_cost, transaction_date, status) VALUES
  ('11111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111','ABC123DEF456GHI789JKL012MNO34501',85123456,'distribution',1000,1000,58.42,58420, NOW()-INTERVAL'90 days','confirmed'),
  ('22222222-2222-2222-2222-222222222222','a2222222-2222-2222-2222-222222222222','ABC123DEF456GHI789JKL012MNO34502',85223456,'distribution', 500, 500,59.15,29575, NOW()-INTERVAL'60 days','confirmed'),
  ('22222222-2222-2222-2222-222222222222','a2222222-2222-2222-2222-222222222222','ABC123DEF456GHI789JKL012MNO34503',85323456,'distribution', 750, 750,60.23,45173, NOW()-INTERVAL'30 days','confirmed'),
  ('33333333-3333-3333-3333-333333333333','a3333333-3333-3333-3333-333333333333','ABC123DEF456GHI789JKL012MNO34504',85423456,'distribution',5000,5000,61.50,307500,NOW()-INTERVAL'45 days','confirmed'),
  ('44444444-4444-4444-4444-444444444444','a4444444-4444-4444-4444-444444444444','ABC123DEF456GHI789JKL012MNO34505',85523456,'distribution', 250, 250,60.23,15058, NOW()-INTERVAL'20 days','confirmed');

INSERT INTO holdings (investor_id, wallet_id, token_balance, gold_grams) VALUES
  ('11111111-1111-1111-1111-111111111111','a1111111-1111-1111-1111-111111111111',1000,1000),
  ('22222222-2222-2222-2222-222222222222','a2222222-2222-2222-2222-222222222222',1250,1250),
  ('33333333-3333-3333-3333-333333333333','a3333333-3333-3333-3333-333333333333',5000,5000),
  ('44444444-4444-4444-4444-444444444444','a4444444-4444-4444-4444-444444444444', 250, 250);

INSERT INTO tax_lots (investor_id, lot_number, acquisition_date, token_quantity, tokens_remaining, cost_basis_per_token, total_cost_basis, jurisdiction, holding_period_type) VALUES
  ('11111111-1111-1111-1111-111111111111','LOT-2024-001',CURRENT_DATE-90, 1000,1000,58.42, 58420,'France',     'short_term'),
  ('22222222-2222-2222-2222-222222222222','LOT-2024-002',CURRENT_DATE-60,  500, 500,59.15, 29575,'Portugal',   'short_term'),
  ('22222222-2222-2222-2222-222222222222','LOT-2024-003',CURRENT_DATE-30,  750, 750,60.23, 45173,'Portugal',   'short_term'),
  ('33333333-3333-3333-3333-333333333333','LOT-2024-004',CURRENT_DATE-45, 5000,5000,61.50,307500,'Germany',    'short_term'),
  ('44444444-4444-4444-4444-444444444444','LOT-2024-005',CURRENT_DATE-20,  250, 250,60.23, 15058,'Switzerland','short_term');
