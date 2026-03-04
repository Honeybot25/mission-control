-- Create missing tables for Mission Control
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(50) DEFAULT 'idle',
  version VARCHAR(50) DEFAULT '1.0.0',
  capabilities TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent runs table
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
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent events table
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

-- System audit log
CREATE TABLE IF NOT EXISTS system_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  performed_by VARCHAR(100) DEFAULT 'honey',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 6 core agents
INSERT INTO agents (name, slug, description, status, capabilities, tags, metadata) VALUES
('TraderBot', 'traderbot', 'Autonomous trading with risk management', 'idle', 
 ARRAY['trading', 'backtesting', 'market-analysis'], ARRAY['trading', 'finance'], 
 '{"discord_channel": "trading-alerts", "color": "green"}'),
('ProductBuilder', 'productbuilder', 'Ship products from PRD to production', 'idle',
 ARRAY['building', 'deployment', 'coding'], ARRAY['development'],
 '{"discord_channel": "build-updates", "color": "blue"}'),
('Distribution', 'distribution', 'Auto-drafts and schedules content', 'idle',
 ARRAY['content-creation', 'social-media'], ARRAY['content'],
 '{"discord_channel": "content-alerts", "color": "purple"}'),
('MemoryManager', 'memorymanager', 'Automatic knowledge consolidation', 'idle',
 ARRAY['research', 'knowledge-management'], ARRAY['research'],
 '{"discord_channel": "research-daily", "color": "teal"}'),
('iOSAppBuilder', 'iosappbuilder', 'iOS app development pipeline', 'idle',
 ARRAY['ios-development', 'testflight'], ARRAY['mobile'],
 '{"discord_channel": "build-updates", "color": "indigo"}'),
('SecurityAgent', 'securityagent', 'Security scanning and auditing', 'idle',
 ARRAY['security-scanning'], ARRAY['security'],
 '{"discord_channel": "security-alerts", "color": "red"}')
ON CONFLICT (slug) DO NOTHING;

-- Log this schema creation
INSERT INTO system_audit_log (action, details) 
VALUES ('schema_created', '{"tables": ["agents", "agent_runs", "agent_events", "system_audit_log"]}');
