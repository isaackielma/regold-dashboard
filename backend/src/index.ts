import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import {
  holdingsRouter,
  transactionsRouter,
  taxLotsRouter,
  esgRouter,
  reportsRouter,
} from './routes/index';
import { ordersRouter } from './routes/orders';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — please try again later' },
  }),
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'regold-api', ts: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/holdings',     holdingsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/tax-lots',     taxLotsRouter);
app.use('/api/esg',          esgRouter);
app.use('/api/reports',      reportsRouter);
app.use('/api/orders',       ordersRouter);

// ── Errors ───────────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const port = parseInt(process.env.PORT ?? '5001', 10);
  app.listen(port, () => {
    logger.info(`ReGold API running on :${port}  [${process.env.NODE_ENV ?? 'development'}]`);
  });
}

export default app; // exported for supertest
