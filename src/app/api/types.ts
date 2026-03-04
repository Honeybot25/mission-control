// TypeScript type definitions for GEX Terminal Trading API

export interface Signal {
  signal_id: string;
  timestamp: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry_price: number;
  strategy: string;
  metadata: {
    momentum_20d?: number;
    gex_level?: 'low' | 'medium' | 'high';
    volume_profile?: string;
    [key: string]: any;
  };
}

export interface Trade {
  trade_id: string;
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  pnl?: number;
  status: 'pending' | 'open' | 'closed';
}

export interface PerformanceMetrics {
  total_trades: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  current_equity: number;
  starting_equity: number;
  total_pnl: number;
}

export interface SignalRequest {
  symbol: string;
  strategy?: string;
}

export interface DiscordAlert {
  title: string;
  message: string;
  trade_data?: Record<string, any>;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  shorting_enabled: boolean;
  long_market_value: string;
  short_market_value: string;
  equity: string;
  last_equity: string;
  multiplier: string;
  initial_margin: string;
  maintenance_margin: string;
  sma: string;
  daytrade_count: number;
  last_maintenance_margin: string;
  last_long_market_value: string;
  last_short_market_value: string;
  last_cash: string;
  last_initial_margin: string;
  last_regt_buying_power: string;
  last_daytrading_buying_power: string;
  last_buying_power: string;
  last_daytrade_count: number;
  clearing_broker: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  status: string;
  extended_hours: boolean;
  legs?: any;
  trail_percent?: string;
  trail_price?: string;
  hwm?: string;
  commission: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
}
