-- Scheduled Tasks Table for Mission Control Task Queue System
-- Run this in your Supabase SQL Editor

-- Create scheduled_tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  task_type TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  input_payload JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo/development)
CREATE POLICY "Allow all" ON scheduled_tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_agent_id ON scheduled_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_priority ON scheduled_tasks(priority DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_for ON scheduled_tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_created_at ON scheduled_tasks(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_scheduled_tasks_updated_at ON scheduled_tasks;
CREATE TRIGGER set_scheduled_tasks_updated_at
  BEFORE UPDATE ON scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_tasks_updated_at();

-- Create realtime publication for scheduled_tasks
-- (if not already exists, modify based on your Supabase setup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'scheduled_tasks'
  ) THEN
    -- Add table to existing supabase_realtime publication if it exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_tasks;
    END IF;
  END IF;
END;
$$;

-- Insert sample tasks for testing (optional)
-- Only insert if agents table exists and has data
DO $$
DECLARE
  first_agent_id UUID;
BEGIN
  -- Get the first available agent
  SELECT id INTO first_agent_id FROM agents LIMIT 1;
  
  IF first_agent_id IS NOT NULL THEN
    -- Only insert if no tasks exist yet
    IF NOT EXISTS (SELECT 1 FROM scheduled_tasks LIMIT 1) THEN
      INSERT INTO scheduled_tasks (agent_id, description, status, priority, task_type, input_payload)
      VALUES
        (first_agent_id, 'Review trading strategy performance', 'pending', 'high', 'review', '{"project": "trading", "duration": "weekly"}'),
        (first_agent_id, 'Analyze market trends for next week', 'pending', 'medium', 'analysis', '{"project": "research", "market": "crypto"}'),
        (first_agent_id, 'Update documentation', 'completed', 'low', 'documentation', '{"project": "docs"}');
    END IF;
  END IF;
END;
$$;

-- Verify table was created
SELECT 
  'scheduled_tasks table created successfully' as message,
  COUNT(*) as task_count
FROM scheduled_tasks;
