-- ReGold Dashboard — PostgreSQL Schema
-- Run once on a fresh database: psql -d regold_db -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Investors ────────────────────────────────────────────────────────────────
CREATE TABLE investors (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                     VARCHAR(255) UNIQUE NOT NULL,
  password_hash             VARCHAR(255) NOT NULL,
  first_name                VARCHAR(100) NOT NULL,
  last_name                 VARCHAR(100) NOT NULL,
  entity_type               VARCHAR(50)  CHECK (entity_type IN ('individual','family_office','institution','esg_fund')),
  country_code              VARCHAR(2),
  jurisdiction              VARCHAR(100),
  kyc_status                VARCHAR(20)  CHECK (kyc_status IN ('pending','approved','rejected')) DEFAULT 'pending',
  role                      VARCHAR(20)  CHECK (role IN ('investor','admin')) DEFAULT 'investor',
  email_verified            BOOLEAN      DEFAULT false,
  email_verification_token  VARCHAR(64),
  created_at                TIMESTAMPTZ  DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  DEFAULT NOW(),
  last_login                TIMESTAMPTZ
);

CREATE INDEX idx_investors_email ON investors(email);

-- ── Wallets ──────────────────────────────────────────────────────────────────
CREATE TABLE wallets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id    UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  xrpl_address   VARCHAR(35) UNIQUE NOT NULL,
  wallet_label   VARCHAR(100),
  is_primary     BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_investor ON wallets(investor_id);

-- ── Holdings ─────────────────────────────────────────────────────────────────
CREATE TABLE holdings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id   UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  wallet_id     UUID NOT NULL REFERENCES wallets(id)   ON DELETE CASCADE,
  token_balance NUMERIC(20,8) NOT NULL DEFAULT 0,
  gold_grams    NUMERIC(20,8) NOT NULL DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_holdings_investor ON holdings(investor_id);

-- ── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id       UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  wallet_id         UUID NOT NULL REFERENCES wallets(id)   ON DELETE CASCADE,
  transaction_hash  VARCHAR(64) UNIQUE,
  ledger_index      BIGINT,
  transaction_type  VARCHAR(20) CHECK (transaction_type IN ('distribution','transfer_in','transfer_out','burn')),
  token_amount      NUMERIC(20,8) NOT NULL,
  gold_grams        NUMERIC(20,8) NOT NULL,
  price_per_token   NUMERIC(20,8),
  total_cost        NUMERIC(20,2),
  currency          VARCHAR(3) DEFAULT 'EUR',
  fee               NUMERIC(20,8) DEFAULT 0,
  transaction_date  TIMESTAMPTZ NOT NULL,
  settlement_date   TIMESTAMPTZ,
  status            VARCHAR(20) CHECK (status IN ('pending','confirmed','failed')) DEFAULT 'confirmed',
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_investor_date ON transactions(investor_id, transaction_date DESC);

-- ── Tax Lots ─────────────────────────────────────────────────────────────────
CREATE TABLE tax_lots (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id          UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  transaction_id       UUID REFERENCES transactions(id),
  lot_number           VARCHAR(50) UNIQUE NOT NULL,
  acquisition_date     DATE NOT NULL,
  token_quantity       NUMERIC(20,8) NOT NULL,
  tokens_remaining     NUMERIC(20,8) NOT NULL,
  cost_basis_per_token NUMERIC(20,8) NOT NULL,
  total_cost_basis     NUMERIC(20,2) NOT NULL,
  currency             VARCHAR(3) DEFAULT 'EUR',
  jurisdiction         VARCHAR(100),
  holding_period_type  VARCHAR(20) CHECK (holding_period_type IN ('short_term','long_term')),
  is_closed            BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  closed_at            TIMESTAMPTZ
);

CREATE INDEX idx_tax_lots_investor ON tax_lots(investor_id, is_closed);

-- ── ESG Metadata ─────────────────────────────────────────────────────────────
CREATE TABLE esg_metadata (
  investor_id                  UUID PRIMARY KEY REFERENCES investors(id) ON DELETE CASCADE,
  total_recycled_gold_grams    NUMERIC(20,8) NOT NULL DEFAULT 0,
  forest_saved_hectares        NUMERIC(20,8) NOT NULL DEFAULT 0,
  mercury_avoided_kg           NUMERIC(20,8) NOT NULL DEFAULT 0,
  soil_erosion_avoided_m3      NUMERIC(20,8) NOT NULL DEFAULT 0,
  environmental_cost_saved_eur NUMERIC(20,2) NOT NULL DEFAULT 0,
  sustainability_score         NUMERIC(5,2)  DEFAULT 0,
  last_calculated              TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Holdings History ─────────────────────────────────────────────────────────
CREATE TABLE holdings_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id         UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  snapshot_date       DATE NOT NULL,
  token_balance       NUMERIC(20,8) NOT NULL,
  gold_grams          NUMERIC(20,8) NOT NULL,
  gold_price_eur      NUMERIC(20,4),
  portfolio_value_eur NUMERIC(20,2),
  UNIQUE (investor_id, snapshot_date)
);

CREATE INDEX idx_holdings_history_investor_date ON holdings_history(investor_id, snapshot_date DESC);

-- ── Gold Prices ──────────────────────────────────────────────────────────────
CREATE TABLE gold_prices (
  price_date        DATE PRIMARY KEY,
  price_per_gram_eur NUMERIC(20,4) NOT NULL,
  price_per_gram_usd NUMERIC(20,4),
  source            VARCHAR(100),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Triggers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_investors_updated_at
  BEFORE UPDATE ON investors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-recalculate ESG whenever holdings change
CREATE OR REPLACE FUNCTION recalculate_esg()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE gold_kg NUMERIC;
BEGIN
  SELECT COALESCE(SUM(gold_grams),0)/1000 INTO gold_kg
  FROM holdings WHERE investor_id = NEW.investor_id;

  INSERT INTO esg_metadata (
    investor_id, total_recycled_gold_grams,
    forest_saved_hectares, mercury_avoided_kg,
    soil_erosion_avoided_m3, environmental_cost_saved_eur,
    sustainability_score
  ) VALUES (
    NEW.investor_id, gold_kg * 1000,
    gold_kg * 7, gold_kg * 2.6,
    gold_kg * 14492.75, gold_kg * 215371.08,
    LEAST(gold_kg * 10, 100)
  )
  ON CONFLICT (investor_id) DO UPDATE SET
    total_recycled_gold_grams    = EXCLUDED.total_recycled_gold_grams,
    forest_saved_hectares        = EXCLUDED.forest_saved_hectares,
    mercury_avoided_kg           = EXCLUDED.mercury_avoided_kg,
    soil_erosion_avoided_m3      = EXCLUDED.soil_erosion_avoided_m3,
    environmental_cost_saved_eur = EXCLUDED.environmental_cost_saved_eur,
    sustainability_score         = EXCLUDED.sustainability_score,
    last_calculated              = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalculate_esg
  AFTER INSERT OR UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION recalculate_esg();
