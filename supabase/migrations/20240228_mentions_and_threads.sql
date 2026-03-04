-- Database schema for @mention system and task threads

-- Add parent_task_id to agent_runs table for task threading
ALTER TABLE agent_runs 
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL;

-- Create index for faster thread lookups
CREATE INDEX IF NOT EXISTS idx_agent_runs_parent_task_id ON agent_runs(parent_task_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    sender_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('mention', 'reply', 'task_assigned', 'task_completed', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link_to VARCHAR(500),
    related_task_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    related_comment_id UUID REFERENCES task_comments(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_agent_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related_task ON notifications(related_task_id);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    author_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions TEXT[] DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for task_comments
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON task_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON task_comments(author_agent_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
-- For now, allow all operations (adjust based on your auth setup)
CREATE POLICY "Enable all access" ON notifications
    FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for task_comments
CREATE POLICY "Enable all access" ON task_comments
    FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for the new tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;