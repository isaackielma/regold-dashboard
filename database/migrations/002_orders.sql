-- ReGold Dashboard — Orders table
-- Run after 001_initial_schema.sql
-- psql -d regold_db -f database/migrations/002_orders.sql

CREATE TYPE order_side   AS ENUM ('buy', 'sell');
CREATE TYPE order_type   AS ENUM ('market', 'limit', 'protected');
CREATE TYPE order_status AS ENUM ('pending', 'filled', 'cancelled', 'rejected', 'expired');

CREATE TABLE orders (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id         UUID         NOT NULL REFERENCES investors(id) ON DELETE CASCADE,

  side                order_side   NOT NULL,
  order_type          order_type   NOT NULL DEFAULT 'market',
  status              order_status NOT NULL DEFAULT 'pending',

  token_amount        NUMERIC(20,8) NOT NULL CHECK (token_amount > 0),
  gold_grams          NUMERIC(20,8) NOT NULL DEFAULT 0,
  limit_price_eur     NUMERIC(20,8),
  protected_exit_eur  NUMERIC(20,8),
  executed_price_eur  NUMERIC(20,8),
  total_eur           NUMERIC(20,2),

  investor_note       TEXT,

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  filled_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ
);

CREATE INDEX idx_orders_investor_date   ON orders(investor_id, created_at DESC);
CREATE INDEX idx_orders_investor_status ON orders(investor_id, status);

-- Keep updated_at current (reuses the function from 001_initial_schema.sql)
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- When an order fills: write to transactions table + update holdings.
-- Market orders fill immediately on INSERT (filled_at = NOW()).
-- Limit/Protected orders fill when an external process updates status to 'filled'.
CREATE OR REPLACE FUNCTION fill_order_side_effects()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_tx_type TEXT;
BEGIN
  IF NEW.status = 'filled' AND OLD.status <> 'filled' THEN

    v_tx_type := CASE WHEN NEW.side = 'buy' THEN 'transfer_in' ELSE 'transfer_out' END;

    -- Insert into transactions (appears in Transactions page automatically)
    INSERT INTO transactions (
      investor_id,
      wallet_id,
      transaction_type,
      token_amount,
      gold_grams,
      price_per_token,
      total_cost,
      currency,
      transaction_date,
      status,
      notes
    )
    SELECT
      NEW.investor_id,
      w.id,
      v_tx_type,
      NEW.token_amount,
      NEW.gold_grams,
      NEW.executed_price_eur,
      NEW.total_eur,
      'EUR',
      COALESCE(NEW.filled_at, NOW()),
      'confirmed',
      COALESCE(NEW.investor_note, 'Order ' || NEW.id::text)
    FROM wallets w
    WHERE w.investor_id = NEW.investor_id AND w.is_primary = true
    LIMIT 1;

    -- Update holdings (ESG trigger on holdings fires automatically)
    UPDATE holdings
    SET
      token_balance = token_balance + (CASE WHEN NEW.side = 'buy' THEN  NEW.token_amount ELSE -NEW.token_amount END),
      gold_grams    = gold_grams    + (CASE WHEN NEW.side = 'buy' THEN  NEW.gold_grams   ELSE -NEW.gold_grams   END),
      last_updated  = NOW()
    WHERE investor_id = NEW.investor_id;

  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fill_order_side_effects
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION fill_order_side_effects();

-- For market orders inserted directly as 'filled', fire the side effects on INSERT too.
CREATE OR REPLACE FUNCTION fill_order_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_tx_type TEXT;
BEGIN
  IF NEW.status = 'filled' THEN

    v_tx_type := CASE WHEN NEW.side = 'buy' THEN 'transfer_in' ELSE 'transfer_out' END;

    INSERT INTO transactions (
      investor_id,
      wallet_id,
      transaction_type,
      token_amount,
      gold_grams,
      price_per_token,
      total_cost,
      currency,
      transaction_date,
      status,
      notes
    )
    SELECT
      NEW.investor_id,
      w.id,
      v_tx_type,
      NEW.token_amount,
      NEW.gold_grams,
      NEW.executed_price_eur,
      NEW.total_eur,
      'EUR',
      COALESCE(NEW.filled_at, NOW()),
      'confirmed',
      COALESCE(NEW.investor_note, 'Order ' || NEW.id::text)
    FROM wallets w
    WHERE w.investor_id = NEW.investor_id AND w.is_primary = true
    LIMIT 1;

    UPDATE holdings
    SET
      token_balance = token_balance + (CASE WHEN NEW.side = 'buy' THEN  NEW.token_amount ELSE -NEW.token_amount END),
      gold_grams    = gold_grams    + (CASE WHEN NEW.side = 'buy' THEN  NEW.gold_grams   ELSE -NEW.gold_grams   END),
      last_updated  = NOW()
    WHERE investor_id = NEW.investor_id;

  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fill_order_on_insert
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION fill_order_on_insert();
