import pool from '../db/pool';
import { Transaction } from '../types/domain';
import { AppError } from '../middleware/errorHandler';

export async function getTransactions(investorId: string, limit: number): Promise<Transaction[]> {
  const result = await pool.query(
    `SELECT
       t.id,
       t.investor_id              AS "investorId",
       t.transaction_hash         AS "transactionHash",
       t.ledger_index             AS "ledgerIndex",
       t.transaction_type         AS "type",
       t.token_amount::float      AS "tokenAmount",
       t.gold_grams::float        AS "goldGrams",
       COALESCE(t.price_per_token, 0)::float AS "pricePerToken",
       COALESCE(t.total_cost, 0)::float      AS "totalCost",
       t.currency,
       t.transaction_date         AS "transactionDate",
       t.status
     FROM transactions t
     WHERE t.investor_id = $1
     ORDER BY t.transaction_date DESC
     LIMIT $2`,
    [investorId, limit],
  );

  return result.rows as Transaction[];
}

export async function getTransaction(id: string, investorId: string): Promise<Transaction> {
  const result = await pool.query(
    `SELECT
       t.id,
       t.investor_id              AS "investorId",
       t.transaction_hash         AS "transactionHash",
       t.ledger_index             AS "ledgerIndex",
       t.transaction_type         AS "type",
       t.token_amount::float      AS "tokenAmount",
       t.gold_grams::float        AS "goldGrams",
       COALESCE(t.price_per_token, 0)::float AS "pricePerToken",
       COALESCE(t.total_cost, 0)::float      AS "totalCost",
       t.currency,
       t.transaction_date         AS "transactionDate",
       t.status
     FROM transactions t
     WHERE t.id = $1 AND t.investor_id = $2`,
    [id, investorId],
  );

  if (!result.rowCount) {
    throw new AppError(404, 'Transaction not found');
  }

  return result.rows[0] as Transaction;
}
