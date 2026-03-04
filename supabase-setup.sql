-- Supabase SQL for Mission Control
-- Run this in your Supabase SQL Editor

-- Create log_entries table
CREATE TABLE IF NOT EXISTS log_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  agent TEXT NOT NULL,
  project TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'started', 'in-progress', 'paused', 'completed', 'failed')),
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  links JSONB DEFAULT '{}',
  estimated_impact TEXT NOT NULL CHECK (estimated_impact IN ('low', 'medium', 'high', 'critical')),
  duration INTEGER,
  error TEXT
);

-- Enable Row Level Security
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo)
CREATE POLICY "Allow all" ON log_entries
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_log_entries_timestamp ON log_entries(timestamp DESC);
CREATE INDEX idx_log_entries_agent ON log_entries(agent);
CREATE INDEX idx_log_entries_status ON log_entries(status);

-- Insert sample data
INSERT INTO log_entries (agent, project, status, description, estimated_impact, duration) VALUES
  ('Honey', 'mission-control', 'completed', 'Deployed Mission Control v2.0 with dark sidebar and stat cards', 'high', 3600),
  ('TraderBot', 'momentum-strategy', 'completed', 'Completed NVDA backtest: 12% alpha over 30 days', 'high', 1800),
  ('AppDevAgent', 'mission-control', 'completed', 'Set up Supabase integration for agent logging', 'high', 1200),
  ('ContentAgent', 'twitter-content', 'completed', 'Drafted thread about trading wins', 'medium', 600),
  ('SecurityAgent', 'security-audit', 'completed', 'Ran security scan on OpenClaw setup', 'high', 900),
  ('ResearchAgent', 'market-research', 'completed', 'Analyzed 3 momentum trading strategies', 'medium', 2400),
  ('Honey', 'company-growth', 'in-progress', 'Setting up growth tracker with daily tasks', 'high', NULL),
  ('TraderBot', 'paper-trading', 'started', 'Initializing paper trading bot', 'high', NULL),
  ('ContentAgent', 'newsletter', 'created', 'Planning weekly recap newsletter', 'medium', NULL);

-- Verify
SELECT * FROM log_entries ORDER BY timestamp DESC LIMIT 10;
