-- Agent Interactions Table for Collaboration Tracking
CREATE TABLE IF NOT EXISTS agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent VARCHAR(50) NOT NULL,
  to_agent VARCHAR(50) NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('mention', 'handoff', 'dependency', 'block', 'unblock', 'collab_request')),
  session_id VARCHAR(100),
  channel_id VARCHAR(100),
  message_id VARCHAR(100),
  task_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Sessions Table
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'idle', 'paused', 'completed', 'failed')),
  current_task TEXT,
  parent_session_id UUID REFERENCES agent_sessions(id),
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id VARCHAR(100) NOT NULL,
  depends_on_task_id VARCHAR(100) NOT NULL,
  blocking BOOLEAN DEFAULT true,
  agent VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Agent Activity Summary (Materialized View)
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_collaboration_stats AS
SELECT
  from_agent,
  to_agent,
  COUNT(*) as total_interactions,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as interactions_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as interactions_30d,
  MAX(created_at) as last_interaction,
  jsonb_object_agg(type, cnt) FILTER (WHERE cnt > 0) as interaction_types
FROM (
  SELECT from_agent, to_agent, type, created_at,
    COUNT(*) OVER (PARTITION BY from_agent, to_agent, type) as cnt
  FROM agent_interactions
) sub
GROUP BY from_agent, to_agent;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_interactions_from ON agent_interactions(from_agent);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_to ON agent_interactions(to_agent);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_created ON agent_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_interactions_type ON agent_interactions(type);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent ON agent_sessions(agent);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_agent ON task_dependencies(agent);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_status ON task_dependencies(status);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_collaboration_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW agent_collaboration_stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh stats on new interactions
CREATE OR REPLACE FUNCTION trigger_refresh_collab_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('refresh_collab_stats', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refresh_stats_on_interaction ON agent_interactions;
CREATE TRIGGER refresh_stats_on_interaction
  AFTER INSERT ON agent_interactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_collab_stats();
