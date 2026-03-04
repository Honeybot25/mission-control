-- Migration: Add scheduled_tasks table for task management system
-- Created: 2026-02-25

-- Create scheduled_tasks table
CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Task status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Priority levels
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Task details
  task_type VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  input_payload JSONB DEFAULT '{}',
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Result tracking
  result JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE scheduled_tasks IS 'Task queue for agent task scheduling';
COMMENT ON COLUMN scheduled_tasks.agent_id IS 'Reference to the agent that will execute this task';
COMMENT ON COLUMN scheduled_tasks.status IS 'Current status: pending, running, completed, failed, cancelled';
COMMENT ON COLUMN scheduled_tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN scheduled_tasks.task_type IS 'Type of task (e.g., spawn, execute, monitor)';
COMMENT ON COLUMN scheduled_tasks.scheduled_for IS 'When the task should be executed';

-- Indexes
CREATE INDEX idx_scheduled_tasks_agent_id ON scheduled_tasks(agent_id);
CREATE INDEX idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX idx_scheduled_tasks_priority ON scheduled_tasks(priority);
CREATE INDEX idx_scheduled_tasks_scheduled_for ON scheduled_tasks(scheduled_for);
CREATE INDEX idx_scheduled_tasks_created_at ON scheduled_tasks(created_at DESC);

-- Composite index for querying pending tasks by priority
CREATE INDEX idx_scheduled_tasks_pending_priority ON scheduled_tasks(status, priority, scheduled_for) 
  WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_tasks_updated_at
  BEFORE UPDATE ON scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Allow full access to authenticated users" ON scheduled_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- View for pending tasks ordered by priority
CREATE VIEW v_pending_tasks AS
SELECT 
  st.*,
  a.name as agent_name,
  a.slug as agent_slug,
  a.status as agent_status
FROM scheduled_tasks st
JOIN agents a ON st.agent_id = a.id
WHERE st.status = 'pending'
ORDER BY st.priority DESC, st.scheduled_for ASC;

-- Update schema version
INSERT INTO schema_migrations (version) VALUES ('002_scheduled_tasks');
