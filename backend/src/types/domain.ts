// Shared domain types used across services, controllers, and tests.
// Keep framework-agnostic — no Express or DB driver imports here.

export type InvestorRole = 'investor' | 'admin';
export type KycStatus = 'pending' | 'approved' | 'rejected';
export type EntityType = 'individual' | 'family_office' | 'institution' | 'esg_fund';
export type TransactionType = 'distribution' | 'transfer_in' | 'transfer_out' | 'burn';
export type TxStatus = 'pending' | 'confirmed' | 'failed';
export type HoldingPeriod = 'short_term' | 'long_term';

export interface Investor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  entityType: EntityType;
  countryCode: string;
  jurisdiction: string;
  kycStatus: KycStatus;
  role: InvestorRole;
  emailVerified: boolean;
  createdAt: Date;
}

export interface Holdings {
  investorId: string;
  walletAddress: string;
  tokenBalance: number;
  goldGrams: number;
  pricePerGramEur: number;
  currentValueEur: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  investorId: string;
  transactionHash: string | null;
  ledgerIndex: number | null;
  type: TransactionType;
  tokenAmount: number;
  goldGrams: number;
  pricePerToken: number;
  totalCost: number;
  currency: string;
  transactionDate: Date;
  status: TxStatus;
}

export interface TaxLot {
  id: string;
  investorId: string;
  lotNumber: string;
  acquisitionDate: Date;
  tokenQuantity: number;
  tokensRemaining: number;
  costBasisPerToken: number;
  totalCostBasis: number;
  currency: string;
  jurisdiction: string;
  holdingPeriodType: HoldingPeriod;
  unrealizedGainLoss: number;
}

export interface EsgMetrics {
  investorId: string;
  totalRecycledGoldGrams: number;
  forestSavedHectares: number;
  mercuryAvoidedKg: number;
  soilErosionAvoidedM3: number;
  environmentalCostSavedEur: number;
  sustainabilityScore: number;
  lastCalculated: Date;
}

export interface PortfolioSnapshot {
  snapshotDate: string;
  tokenBalance: number;
  portfolioValueEur: number;
}

// Auth
export interface JwtPayload {
  sub: string;       // investor id
  email: string;
  role: InvestorRole;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  token: string;
  investor: Pick<Investor, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderSide   = 'buy' | 'sell';
export type OrderType   = 'market' | 'limit' | 'protected';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export interface Order {
  id:                string;
  investorId:        string;
  side:              OrderSide;
  orderType:         OrderType;
  status:            OrderStatus;
  tokenAmount:       number;
  goldGrams:         number;
  limitPriceEur:     number | null;
  protectedExitEur:  number | null;
  executedPriceEur:  number | null;
  totalEur:          number | null;
  investorNote:      string | null;
  createdAt:         string;
  updatedAt:         string;
  filledAt:          string | null;
  expiresAt:         string | null;
}

export interface CreateOrderInput {
  side:               OrderSide;
  orderType:          OrderType;
  tokenAmount:        number;
  limitPriceEur?:     number;
  protectedExitEur?:  number;
  investorNote?:      string;
}
