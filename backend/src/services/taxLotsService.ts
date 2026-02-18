import pool from '../db/pool';
import { TaxLot } from '../types/domain';

export interface TaxSummary {
  totalCostBasis: number;
  totalTokens: number;
  totalUnrealizedGainLoss: number;
  lotCount: number;
}

export async function getTaxLots(investorId: string): Promise<TaxLot[]> {
  const result = await pool.query(
    `SELECT
       tl.id,
       tl.investor_id              AS "investorId",
       tl.lot_number               AS "lotNumber",
       tl.acquisition_date         AS "acquisitionDate",
       tl.token_quantity::float           AS "tokenQuantity",
       tl.tokens_remaining::float         AS "tokensRemaining",
       tl.cost_basis_per_token::float     AS "costBasisPerToken",
       tl.total_cost_basis::float         AS "totalCostBasis",
       tl.currency,
       tl.jurisdiction,
       tl.holding_period_type             AS "holdingPeriodType",
       COALESCE((tl.tokens_remaining * gp.price_per_gram_eur) - tl.total_cost_basis, 0)::float
                                          AS "unrealizedGainLoss"
     FROM tax_lots tl
     LEFT JOIN gold_prices gp ON gp.price_date = CURRENT_DATE
     WHERE tl.investor_id = $1 AND tl.is_closed = false
     ORDER BY tl.acquisition_date ASC`,
    [investorId],
  );

  return result.rows as TaxLot[];
}

export async function getSummary(investorId: string): Promise<TaxSummary> {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int                                                                   AS "lotCount",
       COALESCE(SUM(tl.total_cost_basis), 0)::float                                   AS "totalCostBasis",
       COALESCE(SUM(tl.tokens_remaining), 0)::float                                   AS "totalTokens",
       COALESCE(SUM((tl.tokens_remaining * gp.price_per_gram_eur) - tl.total_cost_basis), 0)::float
                                                                                       AS "totalUnrealizedGainLoss"
     FROM tax_lots tl
     LEFT JOIN gold_prices gp ON gp.price_date = CURRENT_DATE
     WHERE tl.investor_id = $1 AND tl.is_closed = false`,
    [investorId],
  );

  return result.rows[0] as TaxSummary;
}
