-- ══════════════════════════════════════════════════════════════════
--  003_seed_my_account.sql
--  Run this AFTER registering your account in the app.
--  Replace 'your@email.com' with the email you registered with.
--
--  psql -U isaackiel -d regold_db -f database/seeds/003_seed_my_account.sql
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_investor_id UUID;
  v_wallet_id   UUID;
BEGIN

  -- 1. Find your investor ID from your registered email
  SELECT id INTO v_investor_id
  FROM investors
  WHERE email = 'your@email.com';   -- ← CHANGE THIS to your email

  IF v_investor_id IS NULL THEN
    RAISE EXCEPTION 'Investor not found. Make sure you registered first and the email matches exactly.';
  END IF;

  -- 2. Make sure today's gold price exists (€61.50/gram)
  INSERT INTO gold_prices (price_date, price_per_gram_eur, source)
  VALUES (CURRENT_DATE, 61.50, 'London Bullion Market')
  ON CONFLICT (price_date) DO NOTHING;

  -- 3. Create a wallet for your account (skip if already exists)
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE investor_id = v_investor_id) THEN
    INSERT INTO wallets (investor_id, xrpl_address, wallet_label, is_primary)
    VALUES (v_investor_id, 'rMyReGoldWalletAddressLocalDev1', 'My Primary Wallet', true)
    RETURNING id INTO v_wallet_id;
  ELSE
    SELECT id INTO v_wallet_id FROM wallets WHERE investor_id = v_investor_id LIMIT 1;
  END IF;

  -- 4. Create holdings (500 tokens / 500 grams of gold)
  IF NOT EXISTS (SELECT 1 FROM holdings WHERE investor_id = v_investor_id) THEN
    INSERT INTO holdings (investor_id, wallet_id, token_balance, gold_grams)
    VALUES (v_investor_id, v_wallet_id, 500, 500);
  ELSE
    -- Already has holdings — update to give them tokens to work with
    UPDATE holdings SET token_balance = 500, gold_grams = 500 WHERE investor_id = v_investor_id;
  END IF;

  -- 5. Add a sample transaction so the Transactions page isn't empty
  IF NOT EXISTS (SELECT 1 FROM transactions WHERE investor_id = v_investor_id) THEN
    INSERT INTO transactions (
      investor_id, wallet_id, transaction_hash, transaction_type,
      token_amount, gold_grams, price_per_token, total_cost,
      currency, transaction_date, status, notes
    ) VALUES (
      v_investor_id, v_wallet_id,
      'LOCALDEMO' || replace(v_investor_id::text, '-', ''),
      'distribution',
      500, 500, 61.50, 30750.00,
      'EUR', NOW() - INTERVAL '7 days', 'confirmed',
      'Initial token distribution'
    );
  END IF;

  -- 6. Add a tax lot so the Tax Lots page works
  IF NOT EXISTS (SELECT 1 FROM tax_lots WHERE investor_id = v_investor_id) THEN
    INSERT INTO tax_lots (
      investor_id, lot_number, acquisition_date,
      token_quantity, tokens_remaining,
      cost_basis_per_token, total_cost_basis,
      currency, jurisdiction, holding_period_type
    ) VALUES (
      v_investor_id,
      'LOT-' || to_char(NOW(), 'YYYY-') || substr(v_investor_id::text, 1, 4),
      CURRENT_DATE - 7,
      500, 500,
      61.50, 30750.00,
      'EUR', 'Portugal', 'short_term'
    );
  END IF;

  -- 7. Verify email and approve KYC just in case
  UPDATE investors
  SET email_verified = true, kyc_status = 'approved'
  WHERE id = v_investor_id;

  RAISE NOTICE 'Success! Account seeded for investor %', v_investor_id;

END $$;
