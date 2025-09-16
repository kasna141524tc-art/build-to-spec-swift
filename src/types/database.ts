export type User = {
  id: string;
  email: string;
  role: 'trader' | 'investor';
  username: string;
  bio?: string;
  currency: 'USD' | 'PHP';
  avatar_url?: string;
  trader_uid?: string;
  bound_trader_id?: string;
  created_at: string;
  updated_at: string;
};

export type TradeCategory = 'spot' | 'futures' | 'defi' | 'dual_investment' | 'liquidity_pool' | 'liquidity_mining';

export type Trade = {
  id: string;
  user_id: string;
  category: TradeCategory;
  asset: string;
  price: number;
  currency: 'USD' | 'PHP';
  quantity: number;
  trade_date: string;
  fees?: number;
  profit_loss?: number;
  details?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type Binding = {
  id: string;
  trader_id: string;
  investor_id: string;
  status: 'pending' | 'approved' | 'revoked';
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  trade_id?: string;
  user_id: string;
  action: 'create' | 'update' | 'delete';
  changes?: Record<string, any>;
  created_at: string;
};

// Trade details types for different categories
export type SpotDetails = {
  buy_sell: 'buy' | 'sell';
};

export type FuturesDetails = {
  buy_sell: 'buy' | 'sell';
  leverage?: number;
  margin?: number;
};

export type DeFiDetails = {
  platform: string;
  apy?: number;
};

export type DualInvestmentDetails = {
  platform: string;
  strike_price?: number;
};

export type LiquidityPoolDetails = {
  platform: string;
  pool_share?: number;
};

export type LiquidityMiningDetails = {
  platform: string;
  rewards_token?: string;
};