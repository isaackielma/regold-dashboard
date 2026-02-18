# ReGold Dashboard

Institutional investor dashboard for the **ReGold MPToken** on XRPL — a claim over allocated, recycled physical gold reserves.

Built for Family Offices · Private Banking · ESG Funds · Institutional Investors

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (React)                             │
│                                                                     │
│  /login  /register  /verify-email          (public routes)          │
│  /dashboard  /transactions  /tax-lots                               │
│  /esg  /reports                             (protected routes)      │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTPS + JWT Bearer token
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Node.js API  (:5001)                             │
│                                                                     │
│  POST /api/auth/register       POST /api/auth/login                 │
│  GET  /api/auth/verify-email                                        │
│  GET  /api/holdings            GET  /api/holdings/history           │
│  GET  /api/transactions        GET  /api/transactions/:id           │
│  GET  /api/tax-lots            GET  /api/tax-lots/summary           │
│  GET  /api/esg                                                      │
│  GET  /api/reports/excel       GET  /api/reports/csv/:sheet         │
└──────────────┬───────────────────────────┬──────────────────────────┘
               │ pg                        │ (stub → replace)
               ▼                           ▼
┌──────────────────────┐       ┌──────────────────────────┐
│   PostgreSQL 14+     │       │   XRPL Ledger            │
│                      │       │                          │
│  investors           │       │  getInvestorTokenBalance │
│  wallets             │       │  getLedgerTxHistory      │
│  holdings            │       │  validateTokenIntegrity  │
│  transactions        │       │                          │
│  tax_lots            │       │  Testnet / Mainnet       │
│  esg_metadata        │       └──────────────────────────┘
│  holdings_history    │
│  gold_prices         │
└──────────────────────┘
```

### Data flow — token distribution

```
Rebijoux issues ReGold MPToken on XRPL
        │
        ▼
Token distributed to investor XRPL wallet
        │
        ▼
XRPL stub (or real xrpl.js) reads balance + tx history
        │
        ▼
Backend writes to holdings + transactions + tax_lots tables
        │
        ▼
DB trigger auto-calculates esg_metadata
        │
        ▼
Dashboard displays holdings, ESG, P&L, reports
```

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### 1 · Database

```bash
createdb regold_db
psql -d regold_db -f database/migrations/001_initial_schema.sql
psql -d regold_db -f database/seeds/demo.sql   # optional demo data
```

### 2 · Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in DATABASE_URL and JWT_SECRET
npm run dev
```

API available at `http://localhost:5001`

### 3 · Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Dashboard available at `http://localhost:3000`

---

## Secrets management

### Development

Copy `.env.example` → `.env` and fill in values locally. `.env` is git-ignored.

### Production

**Never store secrets in environment files committed to git.**

Recommended options:

| Platform | Tool |
|---|---|
| AWS | Secrets Manager or Parameter Store |
| GCP | Secret Manager |
| Heroku | Config Vars (encrypted at rest) |
| Any | [Doppler](https://doppler.com) — works everywhere |
| Team | [1Password Secrets Automation](https://developer.1password.com/docs/connect) |

At minimum, generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Running tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# With coverage
cd backend && npm run test:coverage
```

CI runs automatically on push via `.github/workflows/ci.yml`.

---

## API reference

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create investor account |
| GET | `/api/auth/verify-email?token=` | Verify email address |
| POST | `/api/auth/login` | Obtain JWT |
| GET | `/api/holdings` | Current token balance + value |
| GET | `/api/holdings/history?days=90` | Portfolio snapshots |
| GET | `/api/transactions?limit=50` | Transaction history |
| GET | `/api/transactions/:id` | Single transaction |
| GET | `/api/tax-lots` | Open tax lots |
| GET | `/api/tax-lots/summary` | Aggregated cost basis |
| GET | `/api/esg` | ESG impact metrics |
| GET | `/api/reports/excel` | Full Excel report download |
| GET | `/api/reports/csv/transactions` | Transactions CSV |
| GET | `/api/reports/csv/tax-lots` | Tax lots CSV |

---

## XRPL integration

Stubs live in `backend/src/xrpl/mptHandler.ts`. They return mock data and log calls.

To connect a real XRPL node:

```bash
cd backend && npm install xrpl
```

Then replace the stub bodies following the comments in that file.

> **Always test on Testnet before Mainnet.**
> Testnet: `wss://s.altnet.rippletest.net:51233`
> Mainnet: `wss://xrplcluster.com`

---

## Project structure

```
regold-dashboard/
├── .github/
│   └── workflows/ci.yml          CI pipeline
├── backend/
│   ├── src/
│   │   ├── db/pool.ts            PostgreSQL connection pool
│   │   ├── middleware/           Auth + error handling
│   │   ├── routes/               Express route handlers
│   │   ├── services/             Business logic (auth, holdings, ESG…)
│   │   ├── types/domain.ts       Shared TypeScript interfaces
│   │   ├── utils/logger.ts       Winston logger
│   │   ├── xrpl/mptHandler.ts   XRPL stub (replace for production)
│   │   └── index.ts              App entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── migrations/001_initial_schema.sql
│   └── seeds/demo.sql
├── frontend/
│   ├── src/
│   │   ├── assets/styles/        Tailwind CSS
│   │   ├── components/
│   │   │   ├── layout/           AppShell, ProtectedRoute
│   │   │   └── ui/               Button, Input, StatCard, Alert, Spinner
│   │   ├── hooks/                useAuth, useAsync
│   │   ├── pages/
│   │   │   ├── auth/             Login, Register, VerifyEmail
│   │   │   └── dashboard/        Dashboard, Transactions, TaxLots, ESG, Reports
│   │   ├── services/api.ts       Typed API client
│   │   ├── types/index.ts        TypeScript interfaces
│   │   ├── utils/format.ts       Currency, date, number formatters
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
└── README.md
```

---

## Deployment

### Frontend — Vercel (recommended)

```bash
cd frontend && npm run build
# push to GitHub, connect repo in Vercel
# set REACT_APP_API_URL env var in Vercel dashboard
```

### Backend — Railway / Render / Heroku

```bash
cd backend && npm run build
# set all .env vars in platform dashboard
# start command: node dist/index.js
```

### Database — Neon / Supabase / AWS RDS

Create a managed PostgreSQL instance, run the migration, set `DATABASE_URL` with SSL.

---

## ESG methodology

Impact factors from [Conservation Strategy Fund Mining Calculator](https://miningcalculator.conservation-strategy.org/):

| Per 1 kg recycled gold | Prevented impact |
|---|---|
| Forest | 7 hectares deforestation |
| Mercury | 2.6 kg pollution |
| Soil erosion | 14,492.75 m³ |
| Environmental cost | €215,371.08 |

Sustainability score = `min(gold_kg × 10, 100)`

---

## License

Proprietary · Rebijoux UPDF
