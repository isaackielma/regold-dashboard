import { Router, Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as holdings from '../services/holdingsService';
import * as transactions from '../services/transactionsService';
import * as taxLots from '../services/taxLotsService';
import * as esg from '../services/esgService';
import * as exportSvc from '../services/exportService';

// ── Holdings ─────────────────────────────────────────────────────────────────

export const holdingsRouter = Router();

holdingsRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investorId = (req as AuthRequest).investor.sub;
    res.json(await holdings.getHoldings(investorId));
  } catch (err) {
    next(err);
  }
});

holdingsRouter.get(
  '/history',
  requireAuth,
  query('days').optional().isInt({ min: 7, max: 365 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const investorId = (req as AuthRequest).investor.sub;
      const days = parseInt((req.query.days as string) ?? '90', 10);
      res.json(await holdings.getHistory(investorId, days));
    } catch (err) {
      next(err);
    }
  },
);

// ── Transactions ──────────────────────────────────────────────────────────────

export const transactionsRouter = Router();

transactionsRouter.get(
  '/',
  requireAuth,
  query('limit').optional().isInt({ min: 1, max: 200 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const investorId = (req as AuthRequest).investor.sub;
      const limit = parseInt((req.query.limit as string) ?? '50', 10);
      res.json(await transactions.getTransactions(investorId, limit));
    } catch (err) {
      next(err);
    }
  },
);

transactionsRouter.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investorId = (req as AuthRequest).investor.sub;
    res.json(await transactions.getTransaction(req.params.id, investorId));
  } catch (err) {
    next(err);
  }
});

// ── Tax Lots ──────────────────────────────────────────────────────────────────

export const taxLotsRouter = Router();

taxLotsRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investorId = (req as AuthRequest).investor.sub;
    res.json(await taxLots.getTaxLots(investorId));
  } catch (err) {
    next(err);
  }
});

taxLotsRouter.get('/summary', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investorId = (req as AuthRequest).investor.sub;
    res.json(await taxLots.getSummary(investorId));
  } catch (err) {
    next(err);
  }
});

// ── ESG ───────────────────────────────────────────────────────────────────────

export const esgRouter = Router();

esgRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investorId = (req as AuthRequest).investor.sub;
    res.json(await esg.getEsgMetrics(investorId));
  } catch (err) {
    next(err);
  }
});

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsRouter = Router();

reportsRouter.get('/excel', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const investorId = (req as AuthRequest).investor.sub;
    const buf = await exportSvc.exportToExcel(investorId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="regold-report-${investorId}.xlsx"`);
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

reportsRouter.get(
  '/csv/:sheet',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    const sheet = req.params.sheet as 'transactions' | 'tax-lots';
    if (!['transactions', 'tax-lots'].includes(sheet)) {
      res.status(400).json({ error: 'sheet must be "transactions" or "tax-lots"' });
      return;
    }
    try {
      const investorId = (req as AuthRequest).investor.sub;
      const csv = await exportSvc.exportToCsv(investorId, sheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="regold-${sheet}-${investorId}.csv"`);
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);
