-- Migration: XP System and AI Intelligence Tables
-- Created: 2024-02-28

-- Add XP and level columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_tasks_created INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_tasks_failed INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;

-- XP Transactions table: Track all XP gains/losses
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  task_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster agent XP queries
CREATE INDEX IF NOT EXISTS idx_xp_transactions_agent_id ON xp_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at);

-- Achievements table: Track unlocked achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  badge_key VARCHAR(100) NOT NULL,
  badge_name VARCHAR(255) NOT NULL,
  badge_emoji VARCHAR(50) NOT NULL,
  badge_description TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(agent_id, badge_key)
);

-- Create index for faster achievement queries
CREATE INDEX IF NOT EXISTS idx_achievements_agent_id ON achievements(agent_id);
CREATE INDEX IF NOT EXISTS idx_achievements_badge_key ON achievements(badge_key);

-- Anomaly Events table: Track detected anomalies
CREATE TABLE IF NOT EXISTS anomaly_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  anomaly_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  context JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(100),
  acknowledged_at TIMESTAMPTZ
);

-- Create indexes for anomaly queries
CREATE INDEX IF NOT EXISTS idx_anomaly_events_agent_id ON anomaly_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_detected_at ON anomaly_events(detected_at);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_severity ON anomaly_events(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_resolved_at ON anomaly_events(resolved_at) WHERE resolved_at IS NULL;

-- Task Dependencies table: Track when agents are blocked
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocking_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  blocked_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  blocking_task_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  blocked_task_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  dependency_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocking ON task_dependencies(blocking_agent_id) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocked ON task_dependencies(blocked_agent_id) WHERE resolved_at IS NULL;

-- Standup Reports table: Store generated daily standups
CREATE TABLE IF NOT EXISTS standup_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  blockers JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  agent_stats JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_standup_reports_date ON standup_reports(report_date);

-- Agent Activity Patterns table: For ML/predictive analysis
CREATE TABLE IF NOT EXISTS agent_activity_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  pattern_type VARCHAR(100) NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence DECIMAL(4,3) DEFAULT 0.0,
  last_observed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_patterns_agent ON agent_activity_patterns(agent_id, pattern_type);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN xp_amount < 100 THEN 1
    WHEN xp_amount < 250 THEN 2
    WHEN xp_amount < 500 THEN 3
    WHEN xp_amount < 1000 THEN 4
    WHEN xp_amount < 2000 THEN 5
    WHEN xp_amount < 4000 THEN 6
    WHEN xp_amount < 8000 THEN 7
    WHEN xp_amount < 15000 THEN 8
    WHEN xp_amount < 25000 THEN 9
    ELSE 10
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add XP to agent
CREATE OR REPLACE FUNCTION add_agent_xp(
  p_agent_id UUID,
  p_amount INTEGER,
  p_reason VARCHAR(100),
  p_task_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_current_xp INTEGER;
BEGIN
  -- Get current state
  SELECT xp, level INTO v_current_xp, v_old_level
  FROM agents WHERE id = p_agent_id;
  
  -- Insert XP transaction
  INSERT INTO xp_transactions (agent_id, amount, reason, task_id, metadata)
  VALUES (p_agent_id, p_amount, p_reason, p_task_id, p_metadata);
  
  -- Update agent XP
  UPDATE agents 
  SET xp = xp + p_amount,
      level = calculate_level(xp + p_amount),
      updated_at = NOW()
  WHERE id = p_agent_id
  RETURNING xp, level INTO v_current_xp, v_new_level;
  
  RETURN QUERY SELECT v_current_xp, v_new_level, (v_new_level > v_old_level);
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievement(
  p_agent_id UUID,
  p_badge_key VARCHAR(100),
  p_badge_name VARCHAR(255),
  p_badge_emoji VARCHAR(50),
  p_badge_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if already has achievement
  IF EXISTS (
    SELECT 1 FROM achievements 
    WHERE agent_id = p_agent_id AND badge_key = p_badge_key
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Award achievement
  INSERT INTO achievements (agent_id, badge_key, badge_name, badge_emoji, badge_description, metadata)
  VALUES (p_agent_id, p_badge_key, p_badge_name, p_badge_emoji, p_badge_description, p_metadata);
  
  -- Also award XP for achievement
  PERFORM add_agent_xp(p_agent_id, 100, 'achievement_unlocked:' || p_badge_key);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Predefined achievement definitions (for reference)
-- These are the valid badge keys for the system
COMMENT ON TABLE achievements IS 'Valid badge_key values: 
  first_deploy (🚀 First Deploy),
  money_printer (💰 Money Printer),
  bug_slayer (🐛 Bug Slayer),
  momentum (📈 Momentum),
  night_owl (🌙 Night Owl),
  early_bird (🌅 Early Bird),
  streak_week (🔥 7 Day Streak),
  streak_month (🌟 30 Day Streak),
  master_agent (👑 Master Agent),
  team_player (🤝 Team Player),
  speed_demon (⚡ Speed Demon)';

-- Insert initial XP for existing agents based on their activity
UPDATE agents SET xp = COALESCE(
  (SELECT COUNT(*) * 25 FROM agent_runs WHERE agent_id = agents.id AND status = 'completed'), 0
) + COALESCE(
  (SELECT COUNT(*) * 10 FROM agent_runs WHERE agent_id = agents.id AND status = 'pending'), 0
) + COALESCE(
  (SELECT COUNT(*) * 5 FROM agent_runs WHERE agent_id = agents.id AND status = 'failed'), 0
);

-- Update levels based on XP
UPDATE agents SET level = calculate_level(xp);

-- Update task counts
UPDATE agents SET 
  total_tasks_created = COALESCE((SELECT COUNT(*) FROM agent_runs WHERE agent_id = agents.id), 0),
  total_tasks_completed = COALESCE((SELECT COUNT(*) FROM agent_runs WHERE agent_id = agents.id AND status = 'completed'), 0),
  total_tasks_failed = COALESCE((SELECT COUNT(*) FROM agent_runs WHERE agent_id = agents.id AND status = 'failed'), 0);

-- Log migration
INSERT INTO system_audit_log (action, details) 
VALUES ('migration_applied', '{"migration": "20240228_xp_and_ai", "description": "XP System and AI Intelligence tables created"}');