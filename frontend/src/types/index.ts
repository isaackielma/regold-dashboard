export type InvestorRole = 'investor' | 'admin';
export type EntityType = 'individual' | 'family_office' | 'institution' | 'esg_fund';

export interface Investor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: InvestorRole;
}

export interface AuthState {
  token: string | null;
  investor: Investor | null;
}

export interface Holdings {
  walletAddress: string;
  tokenBalance: number;
  goldGrams: number;
  pricePerGramEur: number;
  currentValueEur: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  transactionHash: string | null;
  type: string;
  tokenAmount: number;
  goldGrams: number;
  pricePerToken: number;
  totalCost: number;
  currency: string;
  transactionDate: string;
  status: string;
}

export interface TaxLot {
  id: string;
  lotNumber: string;
  acquisitionDate: string;
  tokensRemaining: number;
  costBasisPerToken: number;
  totalCostBasis: number;
  unrealizedGainLoss: number;
  holdingPeriodType: string;
  jurisdiction: string;
}

export interface TaxSummary {
  lotCount: number;
  totalCostBasis: number;
  totalTokens: number;
  totalUnrealizedGainLoss: number;
}

export interface EsgMetrics {
  totalRecycledGoldGrams: number;
  forestSavedHectares: number;
  mercuryAvoidedKg: number;
  soilErosionAvoidedM3: number;
  environmentalCostSavedEur: number;
  sustainabilityScore: number;
  lastCalculated: string;
}

export interface PortfolioSnapshot {
  snapshotDate: string;
  tokenBalance: number;
  portfolioValueEur: number;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderSide   = 'buy' | 'sell';
export type OrderType   = 'market' | 'limit' | 'protected';
export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export interface Order {
  id:               string;
  investorId:       string;
  side:             OrderSide;
  orderType:        OrderType;
  status:           OrderStatus;
  tokenAmount:      number;
  goldGrams:        number;
  limitPriceEur:    number | null;
  protectedExitEur: number | null;
  executedPriceEur: number | null;
  totalEur:         number | null;
  investorNote:     string | null;
  createdAt:        string;
  updatedAt:        string;
  filledAt:         string | null;
  expiresAt:        string | null;
}

export interface CreateOrderInput {
  side:               OrderSide;
  orderType:          OrderType;
  tokenAmount:        number;
  limitPriceEur?:     number;
  protectedExitEur?:  number;
  investorNote?:      string;
}
