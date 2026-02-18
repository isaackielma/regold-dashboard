import { Pool } from 'pg';
import { logger } from '../utils/logger';

// Single pool shared across the process lifetime.
// In tests, set DATABASE_URL to a test database.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 3_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

pool.on('connect', () => logger.debug('DB pool: new client connected'));
pool.on('error', (err) => {
  logger.error('DB pool: unexpected error', { error: err.message });
  // Don't crash — pool will retry on next query
});

export default pool;
