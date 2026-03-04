-- Options Signals Table for Mission Control
-- Stores trading signals from TraderBot

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if recreating
DROP TABLE IF EXISTS options_signals CASCADE;

-- Options Signals table
CREATE TABLE options_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL,
  signal_type VARCHAR(50) NOT NULL CHECK (signal_type IN ('CALL', 'PUT', 'STRADDLE', 'STRANGLE', 'IRON_CONDOR', 'BUTTERFLY', 'CALENDAR_SPREAD', 'DIAGONAL', 'VERTICAL_SPREAD', 'HOLD')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  strike_price DECIMAL(10,2),
  expiration_date DATE,
  premium DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  underlying_price DECIMAL(10,2),
  implied_volatility DECIMAL(5,4),
  delta DECIMAL(5,4),
  gamma DECIMAL(5,4),
  theta DECIMAL(8,4),
  vega DECIMAL(8,4),
  entry_reason TEXT,
  exit_target DECIMAL(10,2),
  stop_loss DECIMAL(10,2),
  risk_reward_ratio DECIMAL(5,2),
  max_loss DECIMAL(10,2),
  max_profit DECIMAL(10,2),
  time_to_expiry_days INTEGER,
  market_conditions JSONB DEFAULT '{}',
  technical_indicators JSONB DEFAULT '{}',
  greeks JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXECUTED', 'EXPIRED', 'CANCELLED', 'CLOSED')),
  executed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  pnl DECIMAL(10,2),
  pnl_percent DECIMAL(5,2),
  source VARCHAR(50) DEFAULT 'TraderBot',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_options_signals_symbol ON options_signals(symbol);
CREATE INDEX idx_options_signals_status ON options_signals(status);
CREATE INDEX idx_options_signals_type ON options_signals(signal_type);
CREATE INDEX idx_options_signals_direction ON options_signals(direction);
CREATE INDEX idx_options_signals_created_at ON options_signals(created_at DESC);
CREATE INDEX idx_options_signals_confidence ON options_signals(confidence DESC);
CREATE INDEX idx_options_signals_expiration ON options_signals(expiration_date);

-- Composite indexes for filtered queries
CREATE INDEX idx_options_signals_active_symbol ON options_signals(status, symbol) WHERE status = 'ACTIVE';
CREATE INDEX idx_options_signals_recent ON options_signals(created_at, status) WHERE created_at > NOW() - INTERVAL '7 days';

-- Enable Row Level Security
ALTER TABLE options_signals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now)
CREATE POLICY "Allow all operations on options_signals" 
  ON options_signals 
  FOR ALL 
  TO public 
  USING (true) 
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_options_signals_updated_at 
  BEFORE UPDATE ON options_signals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO options_signals (
  symbol, signal_type, direction, confidence, strike_price, expiration_date, 
  premium, underlying_price, entry_reason, exit_target, stop_loss, 
  risk_reward_ratio, status, market_conditions, technical_indicators
) VALUES 
(
  'AAPL', 'CALL', 'BULLISH', 0.85, 185.00, '2025-03-07',
  3.50, 182.50, 'Breakout above 50-day MA with volume expansion. RSI bullish divergence.',
  195.00, 178.00, 2.5, 'ACTIVE',
  '{"trend": "uptrend", "volatility": "low", "volume": "above_average"}'::jsonb,
  '{"rsi": 62, "macd": "bullish_crossover", "sma_50": 180.20, "sma_200": 175.80}'::jsonb
),
(
  'TSLA', 'PUT', 'BEARISH', 0.78, 175.00, '2025-03-14',
  4.20, 178.00, 'Failed breakout at resistance. Bearish engulfing pattern on daily.',
  165.00, 182.00, 2.1, 'ACTIVE',
  '{"trend": "downtrend", "volatility": "high", "volume": "spike"}'::jsonb,
  '{"rsi": 38, "macd": "bearish_crossover", "support": 170.00, "resistance": 185.00}'::jsonb
),
(
  'NVDA', 'CALL', 'BULLISH', 0.92, 140.00, '2025-03-07',
  2.80, 138.50, 'Strong earnings momentum. AI sector tailwinds. Breakout pattern.',
  150.00, 134.00, 3.2, 'ACTIVE',
  '{"trend": "strong_uptrend", "volatility": "moderate", "volume": "high"}'::jsonb,
  '{"rsi": 68, "macd": "bullish", "sma_50": 132.00, "sma_200": 125.50}'::jsonb
),
(
  'SPY', 'IRON_CONDOR', 'NEUTRAL', 0.72, 595.00, '2025-03-21',
  1.85, 598.00, 'Low volatility environment. Range-bound expected into Fed decision.',
  NULL, NULL, 1.8, 'ACTIVE',
  '{"trend": "sideways", "volatility": "crushing", "volume": "low"}'::jsonb,
  '{"rsi": 52, "vix": 14.5, "expected_move": 8.5}'::jsonb
),
(
  'AMD', 'CALL', 'BULLISH', 0.81, 125.00, '2025-03-07',
  2.15, 122.00, 'Chip sector rotation. Support bounce with volume confirmation.',
  132.00, 118.00, 2.3, 'ACTIVE',
  '{"trend": "uptrend", "volatility": "moderate", "volume": "increasing"}'::jsonb,
  '{"rsi": 58, "macd": "bullish_histogram", "sma_50": 120.50}'::jsonb
),
(
  'META', 'PUT', 'BEARISH', 0.75, 725.00, '2025-03-14',
  8.50, 735.00, 'Overextended technically. Profit taking expected after rally.',
  700.00, 750.00, 2.0, 'ACTIVE',
  '{"trend": "overextended", "volatility": "elevated", "volume": "distribution"}'::jsonb,
  '{"rsi": 72, "macd": "divergence", "fib_618": 720.00}'::jsonb
),
(
  'AMZN', 'CALL', 'BULLISH', 0.88, 210.00, '2025-03-07',
  1.95, 208.00, 'Cloud growth acceleration. Technical breakout above consolidation.',
  220.00, 203.00, 2.7, 'ACTIVE',
  '{"trend": "uptrend", "volatility": "low", "volume": "steady"}'::jsonb,
  '{"rsi": 60, "macd": "bullish", "bollinger": "upper_band_test"}'::jsonb
),
(
  'GOOGL', 'HOLD', 'NEUTRAL', 0.45, NULL, NULL,
  NULL, 185.00, 'Mixed signals. Waiting for clearer directional bias post-earnings.',
  NULL, NULL, NULL, 'ACTIVE',
  '{"trend": "uncertain", "volatility": "elevated", "event": "earnings"}'::jsonb,
  '{"rsi": 50, "macd": "flat"}'::jsonb
);

-- Log the schema creation
INSERT INTO system_audit_log (action, details) 
VALUES ('schema_created', '{"table": "options_signals", "description": "Options trading signals table with sample data"}');
