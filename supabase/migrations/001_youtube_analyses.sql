-- YouTube Market Intelligence Schema
-- Adds table for storing FX Evolution video analyses

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- YouTube video analyses table
CREATE TABLE IF NOT EXISTS youtube_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id VARCHAR(50) NOT NULL UNIQUE,
  channel_id VARCHAR(100) NOT NULL DEFAULT 'UCWLXYI27E8vV9xLvCVgXqgw',
  channel_name VARCHAR(255) NOT NULL DEFAULT 'FX Evolution',
  title VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  video_url VARCHAR(500) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  transcript TEXT,
  summary TEXT NOT NULL,
  key_points JSONB DEFAULT '[]',
  trading_insights JSONB DEFAULT '{}',
  sentiment VARCHAR(20) DEFAULT 'neutral',
  assets JSONB DEFAULT '[]',
  transcript_url VARCHAR(500),
  duration_seconds INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  added_to_knowledge BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_published_at ON youtube_analyses(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_channel_id ON youtube_analyses(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_analyzed_at ON youtube_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_sentiment ON youtube_analyses(sentiment);

-- GIN index for JSONB key_points and assets queries
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_key_points ON youtube_analyses USING GIN(key_points);
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_trading_insights ON youtube_analyses USING GIN(trading_insights);
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_assets ON youtube_analyses USING GIN(assets);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_youtube_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_youtube_analyses_updated_at ON youtube_analyses;
CREATE TRIGGER trigger_youtube_analyses_updated_at
  BEFORE UPDATE ON youtube_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_youtube_analyses_updated_at();

-- Log schema creation
INSERT INTO system_audit_log (action, details) 
VALUES ('schema_created', '{"table": "youtube_analyses", "purpose": "YouTube Market Intelligence - FX Evolution video analyses"}')
ON CONFLICT DO NOTHING;