/**
 * Options Signals Types
 * 
 * Type definitions for options trading signals from TraderBot
 */

export type SignalType = 
  | 'CALL' 
  | 'PUT' 
  | 'STRADDLE' 
  | 'STRANGLE' 
  | 'IRON_CONDOR' 
  | 'BUTTERFLY' 
  | 'CALENDAR_SPREAD' 
  | 'DIAGONAL' 
  | 'VERTICAL_SPREAD' 
  | 'HOLD';

export type SignalDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export type SignalStatus = 'ACTIVE' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED' | 'CLOSED';

export interface MarketConditions {
  trend?: string;
  volatility?: string;
  volume?: string;
  event?: string;
  [key: string]: unknown;
}

export interface TechnicalIndicators {
  rsi?: number;
  macd?: string;
  sma_50?: number;
  sma_200?: number;
  support?: number;
  resistance?: number;
  fib_618?: number;
  bollinger?: string;
  vix?: number;
  expected_move?: number;
  [key: string]: unknown;
}

export interface Greeks {
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
}

export interface OptionsSignal {
  id: string;
  symbol: string;
  signal_type: SignalType;
  direction: SignalDirection;
  confidence: number;
  strike_price?: number;
  expiration_date?: string;
  premium?: number;
  quantity?: number;
  underlying_price?: number;
  implied_volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  entry_reason?: string;
  exit_target?: number;
  stop_loss?: number;
  risk_reward_ratio?: number;
  max_loss?: number;
  max_profit?: number;
  time_to_expiry_days?: number;
  market_conditions?: MarketConditions;
  technical_indicators?: TechnicalIndicators;
  greeks?: Greeks;
  status: SignalStatus;
  executed_at?: string;
  closed_at?: string;
  pnl?: number;
  pnl_percent?: number;
  source: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SignalFilters {
  symbol?: string;
  direction?: SignalDirection | 'ALL';
  signalType?: SignalType | 'ALL';
  status?: SignalStatus | 'ALL';
  minConfidence?: number;
  maxConfidence?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface SignalStats {
  total_signals: number;
  active_signals: number;
  bullish_signals: number;
  bearish_signals: number;
  neutral_signals: number;
  avg_confidence: number;
  by_symbol: Record<string, number>;
  by_type: Record<string, number>;
}
