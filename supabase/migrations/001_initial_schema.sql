-- Mission Control Database Schema
-- Production-ready Supabase schema for agent fleet management
-- Created: 2026-02-25

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search on tags/content

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Agent status enum
CREATE TYPE agent_status AS ENUM (
  'idle',
  'active',
  'paused',
  'error',
  'offline',
  'deprecated'
);

-- Run status enum
CREATE TYPE run_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout'
);

-- Event type enum
CREATE TYPE event_type AS ENUM (
  'start',
  'end',
  'checkpoint',
  'decision',
  'tool_call',
  'tool_result',
  'llm_call',
  'llm_response',
  'error',
  'warning',
  'info'
);

-- Event level enum
CREATE TYPE event_level AS ENUM (
  'debug',
  'info',
  'warning',
  'error',
  'critical'
);

-- Knowledge artifact type enum
CREATE TYPE artifact_type AS ENUM (
  'note',
  'research',
  'decision',
  'insight',
  'code_snippet',
  'link',
  'document',
  'image',
  'video'
);

-- Integration type enum
CREATE TYPE integration_type AS ENUM (
  'webhook',
  'slack',
  'discord',
  'email',
  'sms',
  'github',
  'notion',
  'telegram',
  'custom'
);

-- Integration status enum
CREATE TYPE integration_status AS ENUM (
  'active',
  'inactive',
  'error',
  'pending_setup'
);

-- ============================================================================
-- TABLE: agents
-- Fleet registry for all agent instances
-- ============================================================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Status and version
  status agent_status NOT NULL DEFAULT 'idle',
  version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  
  -- Capabilities and categorization
  capabilities TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Configuration and metadata
  config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Heartbeat tracking
  last_heartbeat TIMESTAMPTZ,
  heartbeat_interval_seconds INTEGER DEFAULT 60,
  
  -- Resource limits and quotas
  max_concurrent_runs INTEGER DEFAULT 1,
  daily_run_limit INTEGER DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE agents IS 'Registry of all agent instances in the fleet';
COMMENT ON COLUMN agents.id IS 'Unique identifier for the agent';
COMMENT ON COLUMN agents.name IS 'Human-readable agent name';
COMMENT ON COLUMN agents.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN agents.status IS 'Current operational status';
COMMENT ON COLUMN agents.version IS 'Agent software version';
COMMENT ON COLUMN agents.capabilities IS 'Array of capability strings';
COMMENT ON COLUMN agents.tags IS 'Array of categorization tags';
COMMENT ON COLUMN agents.config IS 'Agent-specific configuration (JSONB)';
COMMENT ON COLUMN agents.metadata IS 'Flexible metadata storage (JSONB)';
COMMENT ON COLUMN agents.last_heartbeat IS 'Timestamp of last health check';

-- Indexes
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_slug ON agents(slug);
CREATE INDEX idx_agents_tags ON agents USING GIN(tags);
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);
CREATE INDEX idx_agents_heartbeat ON agents(last_heartbeat) WHERE last_heartbeat IS NOT NULL;

-- ============================================================================
-- TABLE: agent_runs
-- Execution tracking for agent runs
-- ============================================================================
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Execution status
  status run_status NOT NULL DEFAULT 'pending',
  trigger VARCHAR(100) NOT NULL, -- 'manual', 'scheduled', 'webhook', 'api', etc
  
  -- Execution details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER, -- Calculated on completion
  
  -- Input/Output
  input_payload JSONB DEFAULT '{}',
  output_payload JSONB DEFAULT '{}',
  
  -- Token usage and cost tracking
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
  cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
  
  -- Context and chain
  parent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  session_id UUID, -- Groups related runs
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE agent_runs IS 'Execution log for all agent runs';
COMMENT ON COLUMN agent_runs.agent_id IS 'Reference to the executing agent';
COMMENT ON COLUMN agent_runs.status IS 'Current execution status';
COMMENT ON COLUMN agent_runs.trigger IS 'What initiated this run';
COMMENT ON COLUMN agent_runs.duration_ms IS 'Total execution time in milliseconds';
COMMENT ON COLUMN agent_runs.tokens_total IS 'Auto-calculated total tokens used';
COMMENT ON COLUMN agent_runs.cost_usd IS 'Estimated cost in USD';
COMMENT ON COLUMN agent_runs.parent_run_id IS 'For sub-runs/chained executions';

-- Indexes
CREATE INDEX idx_agent_runs_agent_id ON agent_runs(agent_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX idx_agent_runs_session_id ON agent_runs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_agent_runs_parent_id ON agent_runs(parent_run_id) WHERE parent_run_id IS NOT NULL;
CREATE INDEX idx_agent_runs_trigger ON agent_runs(trigger);

-- Partial indexes for active runs
CREATE INDEX idx_agent_runs_active ON agent_runs(agent_id, status) 
  WHERE status IN ('pending', 'running');

-- ============================================================================
-- TABLE: agent_events
-- Detailed event traces for debugging and auditing
-- ============================================================================
CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  
  -- Event classification
  type event_type NOT NULL,
  level event_level NOT NULL DEFAULT 'info',
  
  -- Event content
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Distributed tracing
  span_id VARCHAR(32),
  parent_span_id VARCHAR(32),
  trace_id VARCHAR(32),
  
  -- Source location (if applicable)
  source_file VARCHAR(500),
  source_line INTEGER,
  source_function VARCHAR(255),
  
  -- Performance metrics for this event
  duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE agent_events IS 'Detailed event log for debugging agent execution';
COMMENT ON COLUMN agent_events.run_id IS 'Reference to parent run';
COMMENT ON COLUMN agent_events.type IS 'Category of event';
COMMENT ON COLUMN agent_events.level IS 'Severity/importance level';
COMMENT ON COLUMN agent_events.span_id IS 'Distributed tracing span identifier';
COMMENT ON COLUMN agent_events.trace_id IS 'End-to-end trace identifier';

-- Indexes
CREATE INDEX idx_agent_events_run_id ON agent_events(run_id);
CREATE INDEX idx_agent_events_type ON agent_events(type);
CREATE INDEX idx_agent_events_level ON agent_events(level);
CREATE INDEX idx_agent_events_created_at ON agent_events(created_at DESC);
CREATE INDEX idx_agent_events_span ON agent_events(span_id) WHERE span_id IS NOT NULL;
CREATE INDEX idx_agent_events_trace ON agent_events(trace_id) WHERE trace_id IS NOT NULL;

-- Composite for filtering events by run and type
CREATE INDEX idx_agent_events_run_type ON agent_events(run_id, type);

-- ============================================================================
-- TABLE: agent_metrics_daily
-- Aggregated daily statistics for performance tracking
-- ============================================================================
CREATE TABLE agent_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Date (agent-specific timezone handled at application level)
  date DATE NOT NULL,
  
  -- Run statistics
  total_runs INTEGER NOT NULL DEFAULT 0,
  successful_runs INTEGER NOT NULL DEFAULT 0,
  failed_runs INTEGER NOT NULL DEFAULT 0,
  cancelled_runs INTEGER NOT NULL DEFAULT 0,
  
  -- Calculated metrics
  success_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_runs > 0 THEN (successful_runs::DECIMAL / total_runs) * 100
      ELSE 0
    END
  ) STORED,
  
  -- Performance metrics
  avg_duration_ms INTEGER,
  min_duration_ms INTEGER,
  max_duration_ms INTEGER,
  p95_duration_ms INTEGER,
  p99_duration_ms INTEGER,
  
  -- Token and cost aggregation
  total_tokens_input INTEGER DEFAULT 0,
  total_tokens_output INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (total_tokens_input + total_tokens_output) STORED,
  total_cost_usd DECIMAL(12, 6) DEFAULT 0.000000,
  
  -- Error aggregation
  total_errors INTEGER DEFAULT 0,
  unique_error_types INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_agent_date UNIQUE (agent_id, date)
);

-- Comments
COMMENT ON TABLE agent_metrics_daily IS 'Daily aggregated metrics for performance monitoring';
COMMENT ON COLUMN agent_metrics_daily.success_rate IS 'Auto-calculated success percentage';
COMMENT ON COLUMN agent_metrics_daily.p95_duration_ms IS '95th percentile latency';
COMMENT ON COLUMN agent_metrics_daily.p99_duration_ms IS '99th percentile latency';

-- Indexes
CREATE INDEX idx_agent_metrics_agent_id ON agent_metrics_daily(agent_id);
CREATE INDEX idx_agent_metrics_date ON agent_metrics_daily(date DESC);
CREATE INDEX idx_agent_metrics_agent_date ON agent_metrics_daily(agent_id, date DESC);

-- ============================================================================
-- TABLE: agent_errors
-- Structured error tracking and analysis
-- ============================================================================
CREATE TABLE agent_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Error classification
  error_type VARCHAR(100) NOT NULL, -- 'api_error', 'timeout', 'validation', etc
  error_code VARCHAR(50), -- Provider-specific error code
  
  -- Error content
  message TEXT NOT NULL,
  stacktrace TEXT,
  
  -- Context
  context JSONB DEFAULT '{}', -- Request params, state snapshot, etc
  metadata JSONB DEFAULT '{}',
  
  -- Resolution tracking
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Grouping for error analysis
  fingerprint VARCHAR(64), -- Hash for grouping similar errors
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE agent_errors IS 'Structured error tracking for analysis and alerting';
COMMENT ON COLUMN agent_errors.error_type IS 'High-level error category';
COMMENT ON COLUMN agent_errors.fingerprint IS 'Hash for grouping identical errors';
COMMENT ON COLUMN agent_errors.occurrence_count IS 'Number of times this error has occurred';

-- Indexes
CREATE INDEX idx_agent_errors_run_id ON agent_errors(run_id) WHERE run_id IS NOT NULL;
CREATE INDEX idx_agent_errors_agent_id ON agent_errors(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_agent_errors_type ON agent_errors(error_type);
CREATE INDEX idx_agent_errors_fingerprint ON agent_errors(fingerprint);
CREATE INDEX idx_agent_errors_created_at ON agent_errors(created_at DESC);
CREATE INDEX idx_agent_errors_unresolved ON agent_errors(is_resolved, created_at) WHERE is_resolved = FALSE;
CREATE INDEX idx_agent_errors_first_seen ON agent_errors(first_seen_at DESC);

-- ============================================================================
-- TABLE: knowledge_artifacts
-- Second brain storage for insights, research, and tacit knowledge
-- ============================================================================
CREATE TABLE knowledge_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content classification
  type artifact_type NOT NULL DEFAULT 'note',
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  
  -- Full-text search vector (populated by trigger)
  search_vector tsvector,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  
  -- Relationships
  related_entities JSONB DEFAULT '[]', -- Array of {type, id, name} objects
  related_artifact_ids UUID[] DEFAULT '{}',
  parent_artifact_id UUID REFERENCES knowledge_artifacts(id) ON DELETE SET NULL,
  
  -- Source attribution
  source_url TEXT,
  source_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  source_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE knowledge_artifacts IS 'Second brain storage for insights and knowledge';
COMMENT ON COLUMN knowledge_artifacts.search_vector IS 'PostgreSQL full-text search index';
COMMENT ON COLUMN knowledge_artifacts.related_entities IS 'Linked entities: [{type: "agent|run|error", id: "uuid", name: "..."}]';

-- Indexes
CREATE INDEX idx_knowledge_artifacts_type ON knowledge_artifacts(type);
CREATE INDEX idx_knowledge_artifacts_tags ON knowledge_artifacts USING GIN(tags);
CREATE INDEX idx_knowledge_artifacts_category ON knowledge_artifacts(category);
CREATE INDEX idx_knowledge_artifacts_created_at ON knowledge_artifacts(created_at DESC);
CREATE INDEX idx_knowledge_artifacts_parent ON knowledge_artifacts(parent_artifact_id) WHERE parent_artifact_id IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_knowledge_artifacts_search ON knowledge_artifacts USING GIN(search_vector);

-- Trigram index for fuzzy text search
CREATE INDEX idx_knowledge_artifacts_title_trgm ON knowledge_artifacts USING GIN(title gin_trgm_ops);
CREATE INDEX idx_knowledge_artifacts_content_trgm ON knowledge_artifacts USING GIN(content gin_trgm_ops);

-- ============================================================================
-- TABLE: integrations
-- External service connections (webhooks, Slack, etc.)
-- ============================================================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  type integration_type NOT NULL,
  description TEXT,
  
  -- Configuration (encrypted values handled at application level)
  config JSONB NOT NULL DEFAULT '{}',
  secrets_encrypted TEXT, -- Encrypted credentials
  
  -- Status
  status integration_status NOT NULL DEFAULT 'pending_setup',
  last_used_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  
  -- Webhook-specific fields
  webhook_url TEXT,
  webhook_secret TEXT,
  webhook_events TEXT[] DEFAULT '{}', -- ['run.completed', 'error.critical', etc]
  
  -- Associations
  agent_ids UUID[] DEFAULT '{}', -- Which agents can use this integration
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE integrations IS 'External service connections and webhooks';
COMMENT ON COLUMN integrations.config IS 'Non-sensitive configuration (JSONB)';
COMMENT ON COLUMN integrations.secrets_encrypted IS 'Encrypted credentials (application-level encryption)';
COMMENT ON COLUMN integrations.webhook_events IS 'Events that trigger webhook calls';
COMMENT ON COLUMN integrations.agent_ids IS 'Agents authorized to use this integration';

-- Indexes
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_agent_ids ON integrations USING GIN(agent_ids);
CREATE INDEX idx_integrations_webhook_events ON integrations USING GIN(webhook_events);
CREATE INDEX idx_integrations_created_at ON integrations(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_runs_updated_at
  BEFORE UPDATE ON agent_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_metrics_daily_updated_at
  BEFORE UPDATE ON agent_metrics_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_errors_updated_at
  BEFORE UPDATE ON agent_errors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_artifacts_updated_at
  BEFORE UPDATE ON knowledge_artifacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Full-text search update function for knowledge_artifacts
CREATE OR REPLACE FUNCTION update_knowledge_artifacts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_artifacts_search_vector
  BEFORE INSERT OR UPDATE ON knowledge_artifacts
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_artifacts_search_vector();

-- Function to calculate run duration on completion
CREATE OR REPLACE FUNCTION calculate_run_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_run_duration
  BEFORE UPDATE OF completed_at ON agent_runs
  FOR EACH ROW EXECUTE FUNCTION calculate_run_duration();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - implement specific rules based on auth setup)
-- These are templates that should be customized based on your auth strategy

-- Agents policies
CREATE POLICY "Allow full access to authenticated users" ON agents
  FOR ALL USING (true) WITH CHECK (true);

-- Agent runs policies
CREATE POLICY "Allow full access to authenticated users" ON agent_runs
  FOR ALL USING (true) WITH CHECK (true);

-- Agent events policies
CREATE POLICY "Allow full access to authenticated users" ON agent_events
  FOR ALL USING (true) WITH CHECK (true);

-- Agent metrics policies
CREATE POLICY "Allow full access to authenticated users" ON agent_metrics_daily
  FOR ALL USING (true) WITH CHECK (true);

-- Agent errors policies
CREATE POLICY "Allow full access to authenticated users" ON agent_errors
  FOR ALL USING (true) WITH CHECK (true);

-- Knowledge artifacts policies
CREATE POLICY "Allow full access to authenticated users" ON knowledge_artifacts
  FOR ALL USING (true) WITH CHECK (true);

-- Integrations policies
CREATE POLICY "Allow full access to authenticated users" ON integrations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active agents view
CREATE VIEW v_active_agents AS
SELECT 
  a.*,
  COALESCE(r.recent_runs, 0) as recent_runs,
  COALESCE(r.success_rate, 0) as recent_success_rate
FROM agents a
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as recent_runs,
    ROUND(AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100, 2) as success_rate
  FROM agent_runs
  WHERE agent_id = a.id
  AND created_at > NOW() - INTERVAL '24 hours'
) r ON true
WHERE a.status IN ('idle', 'active');

-- Recent errors view
CREATE VIEW v_recent_errors AS
SELECT 
  e.*,
  a.name as agent_name,
  a.slug as agent_slug
FROM agent_errors e
LEFT JOIN agents a ON e.agent_id = a.id
WHERE e.is_resolved = FALSE
ORDER BY e.created_at DESC;

-- Knowledge search summary view
CREATE VIEW v_knowledge_summary AS
SELECT 
  id,
  type,
  title,
  tags,
  category,
  created_at,
  updated_at,
  LEFT(content, 200) as content_preview
FROM knowledge_artifacts
ORDER BY updated_at DESC;

-- ============================================================================
-- INITIAL SETUP COMPLETE
-- ============================================================================

-- Add schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');

-- Create indexes for common query patterns
-- These cover the most frequent access patterns for Mission Control dashboard

ANALYZE agents;
ANALYZE agent_runs;
ANALYZE agent_events;
ANALYZE agent_metrics_daily;
ANALYZE agent_errors;
ANALYZE knowledge_artifacts;
ANALYZE integrations;