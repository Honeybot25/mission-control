-- ============================================================================
-- INNOVATIVE FEATURES - Database Schema
-- Adds 3 new features: AI Strategy Generator, Idea Vault, Revenue Forecasting
-- ============================================================================

-- AI Generated Trading Strategies
CREATE TABLE IF NOT EXISTS ai_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  natural_language_input TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  language VARCHAR(50) DEFAULT 'python',
  performance_metrics JSONB DEFAULT '{
    "win_rate": 0,
    "profit_factor": 0,
    "sharpe_ratio": 0,
    "total_trades": 0,
    "profitable_trades": 0,
    "avg_win": 0,
    "avg_loss": 0,
    "max_drawdown": 0,
    "total_return": 0
  }'::jsonb,
  backtest_results JSONB DEFAULT '{
    "equity_curve": [],
    "trades": []
  }'::jsonb,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft', -- draft, backtested, deployed, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_ai_strategies_status ON ai_strategies(status);
CREATE INDEX IF NOT EXISTS idx_ai_strategies_created_at ON ai_strategies(created_at DESC);

-- Business Ideas Vault with AI Analysis
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'other', -- trading, product, content, automation, research, other
  priority_score INTEGER DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
  status VARCHAR(50) DEFAULT 'ideation', -- ideation, validated, in-progress, implemented, abandoned
  estimated_revenue DECIMAL(12,2),
  effort_level VARCHAR(50) DEFAULT 'medium', -- low, medium, high
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  tags TEXT[] DEFAULT '{}',
  ai_analysis JSONB DEFAULT NULL,
  related_ideas UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_priority ON ideas(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);

-- Revenue Streams for Multi-Stream Forecasting
CREATE TABLE IF NOT EXISTS revenue_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'other', -- trading, product, content, service, other
  description TEXT,
  monthly_actual DECIMAL(12,2) DEFAULT 0,
  monthly_projected DECIMAL(12,2) DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0, -- Monthly growth rate %
  seasonality DECIMAL(4,2)[] DEFAULT ARRAY[1,1,1,1,1,1,1,1,1,1,1,1], -- 12 monthly adjustment factors
  confidence INTEGER DEFAULT 70 CHECK (confidence >= 0 AND confidence <= 100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_streams_type ON revenue_streams(type);
CREATE INDEX IF NOT EXISTS idx_revenue_streams_active ON revenue_streams(is_active);

-- Revenue Goals with Milestone Tracking
CREATE TABLE IF NOT EXISTS revenue_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  deadline DATE,
  current_amount DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMPTZ,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_goals_achieved ON revenue_goals(is_achieved);

-- Enable realtime for all new tables
ALTER PUBLICATION supabase_realtime ADD TABLE ai_strategies;
ALTER PUBLICATION supabase_realtime ADD TABLE ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE revenue_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE revenue_goals;

-- Insert sample revenue streams for demo
INSERT INTO revenue_streams (name, type, description, monthly_actual, monthly_projected, growth_rate, confidence, is_active) VALUES
('Trading Profits', 'trading', 'Automated trading system profits', 800, 1200, 15, 70, true),
('SaaS Product', 'product', 'Monthly subscription revenue', 0, 1500, 25, 60, true),
('Content Revenue', 'content', 'YouTube, sponsorships, affiliates', 200, 500, 20, 65, true),
('Consulting', 'service', 'One-off consulting projects', 500, 800, 5, 80, true)
ON CONFLICT DO NOTHING;

-- Insert default $5K MRR goal
INSERT INTO revenue_goals (name, target_amount, deadline, current_amount, description, milestones) VALUES
('$5K MRR Target', 5000, NOW() + INTERVAL '1 year', 1500, 'Reach $5,000 monthly recurring revenue across all streams', '[
  {"percent": 25, "amount": 1250, "achieved": true, "achieved_at": null},
  {"percent": 50, "amount": 2500, "achieved": false, "achieved_at": null},
  {"percent": 75, "amount": 3750, "achieved": false, "achieved_at": null},
  {"percent": 100, "amount": 5000, "achieved": false, "achieved_at": null}
]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample ideas
INSERT INTO ideas (title, description, category, priority_score, status, estimated_revenue, effort_level, tags, ai_analysis) VALUES
('AI Trading Newsletter', 'Weekly AI-curated trading signals and market analysis newsletter with premium tier', 'content', 85, 'validated', 2000, 'medium', ARRAY['ai', 'content', 'saas'], 
 '{"market_opportunity": "High demand for AI trading insights", "competitive_landscape": "Few AI-native trading newsletters", "risks": ["Content consistency", "Signal accuracy"], "next_steps": ["Create landing page", "Set up email automation", "Draft first 5 issues"], "similar_products": ["Traditional trading newsletters", "Discord signal groups"]}'::jsonb),

('Automated Backtesting Platform', 'Self-service backtesting platform where users upload strategies and get instant results', 'product', 78, 'ideation', 5000, 'high', ARRAY['saas', 'api', 'analytics'],
 '{"market_opportunity": "Traders need fast, affordable backtesting", "competitive_landscape": "Existing tools are expensive or complex", "risks": ["Infrastructure costs", "Data licensing"], "next_steps": ["Validate with 10 traders", "Design MVP", "Research data providers"], "similar_products": ["TradingView", "QuantConnect", "Backtrader"]}'::jsonb),

('Social Media Content Automation', 'Auto-generate and schedule trading-related content across X/Twitter, LinkedIn, and YouTube', 'automation', 72, 'in-progress', 800, 'low', ARRAY['automation', 'content', 'ai'],
 '{"market_opportunity": "Content creation is time-consuming for traders", "competitive_landscape": "Generic social tools lack trading focus", "risks": ["API rate limits", "Content quality"], "next_steps": ["Complete X integration", "Add YouTube support", "Build template library"], "similar_products": ["Buffer", "Hootsuite", "Tweet Hunter"]}'::jsonb)

ON CONFLICT DO NOTHING;

-- Log schema creation
INSERT INTO system_audit_log (action, details) 
VALUES ('innovative_features_created', 
  '{"tables": ["ai_strategies", "ideas", "revenue_streams", "revenue_goals"], "version": "1.0.0"}'::jsonb
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_ai_strategies_updated_at ON ai_strategies;
CREATE TRIGGER update_ai_strategies_updated_at
    BEFORE UPDATE ON ai_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;
CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_revenue_streams_updated_at ON revenue_streams;
CREATE TRIGGER update_revenue_streams_updated_at
    BEFORE UPDATE ON revenue_streams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_revenue_goals_updated_at ON revenue_goals;
CREATE TRIGGER update_revenue_goals_updated_at
    BEFORE UPDATE ON revenue_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();