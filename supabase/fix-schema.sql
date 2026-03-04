-- Run this SQL in Supabase to fix missing tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(50) DEFAULT 'idle',
  version VARCHAR(50) DEFAULT '1.0.0',
  capabilities TEXT[],
  tags TEXT[],
  config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id),
  status VARCHAR(50) DEFAULT 'pending',
  trigger_type VARCHAR(50) DEFAULT 'manual',
  input_summary TEXT,
  output_summary TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  tokens_total INTEGER,
  cost_usd DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES agent_runs(id),
  agent_id UUID REFERENCES agents(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  type VARCHAR(100),
  level VARCHAR(50) DEFAULT 'info',
  message TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO agents (name, slug, description, status, capabilities, tags, metadata) VALUES
('TraderBot', 'traderbot', 'Autonomous trading with risk management', 'idle', ARRAY['trading', 'backtesting'], ARRAY['trading'], '{"color": "green"}'),
('ProductBuilder', 'productbuilder', 'Ship products from PRD to production', 'idle', ARRAY['building', 'deployment'], ARRAY['dev'], '{"color": "blue"}'),
('Distribution', 'distribution', 'Auto-drafts and schedules content', 'idle', ARRAY['content', 'social'], ARRAY['content'], '{"color": "purple"}'),
('MemoryManager', 'memorymanager', 'Automatic knowledge consolidation', 'idle', ARRAY['research'], ARRAY['research'], '{"color": "teal"}'),
('iOSAppBuilder', 'iosappbuilder', 'iOS app development', 'idle', ARRAY['ios', 'mobile'], ARRAY['mobile'], '{"color": "indigo"}'),
('SecurityAgent', 'securityagent', 'Security scanning', 'idle', ARRAY['security'], ARRAY['security'], '{"color": "red"}')
ON CONFLICT (slug) DO NOTHING;
