import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param } from 'express-validator';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as orders from '../services/ordersService';
import * as holdings from '../services/holdingsService';

export const ordersRouter = Router();

// ── GET /api/orders ───────────────────────────────────────────────────────────
ordersRouter.get(
  '/',
  requireAuth,
  query('limit').optional().isInt({ min: 1, max: 200 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const investorId = (req as AuthRequest).investor.sub;
      const limit = parseInt((req.query.limit as string) ?? '50', 10);
      res.json(await orders.getOrders(investorId, limit));
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
ordersRouter.get(
  '/:id',
  requireAuth,
  param('id').isUUID(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const investorId = (req as AuthRequest).investor.sub;
      res.json(await orders.getOrder(req.params.id, investorId));
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /api/orders ──────────────────────────────────────────────────────────
ordersRouter.post(
  '/',
  requireAuth,
  body('side').isIn(['buy', 'sell']),
  body('orderType').isIn(['market', 'limit', 'protected']),
  body('tokenAmount').isFloat({ gt: 0 }),
  body('limitPriceEur').optional().isFloat({ gt: 0 }),
  body('protectedExitEur').optional().isFloat({ gt: 0 }),
  body('investorNote').optional().isString().isLength({ max: 200 }).trim(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const investorId = (req as AuthRequest).investor.sub;
      // Use the live gold price from holdings as the execution price
      const h = await holdings.getHoldings(investorId);
      const order = await orders.createOrder(investorId, req.body, h.pricePerGramEur);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /api/orders/:id/cancel ─────────────────────────────────────────────
ordersRouter.patch(
  '/:id/cancel',
  requireAuth,
  param('id').isUUID(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const investorId = (req as AuthRequest).investor.sub;
      res.json(await orders.cancelOrder(req.params.id, investorId));
    } catch (err) {
      next(err);
    }
  },
);
