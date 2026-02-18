import pool from '../db/pool';
import { Order, CreateOrderInput, OrderStatus } from '../types/domain';
import { AppError } from '../middleware/errorHandler';

const GRAMS_PER_TOKEN = 1;

const ORDER_SELECT = `
  id,
  investor_id               AS "investorId",
  side,
  order_type                AS "orderType",
  status,
  token_amount::float       AS "tokenAmount",
  gold_grams::float         AS "goldGrams",
  limit_price_eur::float    AS "limitPriceEur",
  protected_exit_eur::float AS "protectedExitEur",
  executed_price_eur::float AS "executedPriceEur",
  total_eur::float          AS "totalEur",
  investor_note             AS "investorNote",
  created_at                AS "createdAt",
  updated_at                AS "updatedAt",
  filled_at                 AS "filledAt",
  expires_at                AS "expiresAt"
`;

export async function getOrders(investorId: string, limit = 50): Promise<Order[]> {
  const result = await pool.query(
    `SELECT ${ORDER_SELECT} FROM orders WHERE investor_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [investorId, limit],
  );
  return result.rows as Order[];
}

export async function getOrder(id: string, investorId: string): Promise<Order> {
  const result = await pool.query(
    `SELECT ${ORDER_SELECT} FROM orders WHERE id = $1 AND investor_id = $2`,
    [id, investorId],
  );
  if (!result.rowCount) throw new AppError(404, 'Order not found');
  return result.rows[0] as Order;
}

export async function createOrder(
  investorId: string,
  input: CreateOrderInput,
  currentPriceEur: number,
): Promise<Order> {
  if (input.orderType === 'market' && (input.limitPriceEur || input.protectedExitEur)) {
    throw new AppError(400, 'Market orders cannot have a limit or protected exit price');
  }
  if (input.orderType !== 'market' && !input.limitPriceEur) {
    throw new AppError(400, 'Limit and protected orders require a limit price');
  }
  if (input.orderType === 'protected' && !input.protectedExitEur) {
    throw new AppError(400, 'Protected orders require a protected exit price');
  }

  const isMarket:  boolean      = input.orderType === 'market';
  const execPrice: number|null  = isMarket ? currentPriceEur : null;
  const totalEur:  number|null  = isMarket ? input.tokenAmount * currentPriceEur : null;
  const goldGrams: number       = input.tokenAmount * GRAMS_PER_TOKEN;
  const newStatus: OrderStatus  = isMarket ? 'filled' : 'pending';

  const result = await pool.query(
    `INSERT INTO orders (
       investor_id, side, order_type, status,
       token_amount, gold_grams,
       limit_price_eur, protected_exit_eur,
       executed_price_eur, total_eur,
       investor_note,
       filled_at
     ) VALUES (
       $1, $2, $3, $4,
       $5, $6,
       $7, $8,
       $9, $10,
       $11,
       ${isMarket ? 'NOW()' : 'NULL'}
     )
     RETURNING ${ORDER_SELECT}`,
    [
      investorId,
      input.side,
      input.orderType,
      newStatus,
      input.tokenAmount,
      goldGrams,
      input.limitPriceEur    ?? null,
      input.protectedExitEur ?? null,
      execPrice,
      totalEur,
      input.investorNote     ?? null,
    ],
  );

  return result.rows[0] as Order;
}

export async function cancelOrder(id: string, investorId: string): Promise<Order> {
  const order = await getOrder(id, investorId);
  if (order.status !== 'pending') {
    throw new AppError(400, `Cannot cancel an order with status "${order.status}"`);
  }

  const result = await pool.query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND investor_id = $2
     RETURNING ${ORDER_SELECT}`,
    [id, investorId],
  );
  return result.rows[0] as Order;
}
