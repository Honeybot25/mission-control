-- Supabase SQL for YouTube Market Intelligence Integration
-- Run this in your Supabase SQL Editor

-- Create youtube_analyses table
CREATE TABLE IF NOT EXISTS youtube_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT UNIQUE NOT NULL,
    channel_id TEXT NOT NULL,
    channel_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    transcript TEXT,
    summary TEXT NOT NULL,
    key_points TEXT[] DEFAULT '{}',
    trading_insights JSONB DEFAULT '{}',
    sentiment TEXT CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
    assets TEXT[] DEFAULT '{}',
    duration_seconds INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    added_to_knowledge BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on video_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_video_id ON youtube_analyses(video_id);

-- Create index on published_at for sorting
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_published_at ON youtube_analyses(published_at DESC);

-- Create index on sentiment for filtering
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_sentiment ON youtube_analyses(sentiment);

-- Create index on assets for searching
CREATE INDEX IF NOT EXISTS idx_youtube_analyses_assets ON youtube_analyses USING GIN(assets);

-- Enable Row Level Security
ALTER TABLE youtube_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust for your auth setup)
CREATE POLICY "Enable all operations for youtube_analyses" ON youtube_analyses
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_youtube_analyses_updated_at ON youtube_analyses;
CREATE TRIGGER update_youtube_analyses_updated_at
    BEFORE UPDATE ON youtube_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for youtube_analyses
BEGIN;
  -- Check if the table is already in the publication
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'youtube_analyses'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE youtube_analyses;
    END IF;
  END $$;
COMMIT;

-- Insert sample data for testing (optional, remove in production)
-- INSERT INTO youtube_analyses (
--     video_id, channel_id, channel_name, title, description,
--     thumbnail_url, video_url, published_at, summary, key_points,
--     trading_insights, sentiment, assets, duration_seconds
-- ) VALUES (
--     'sample_video_1',
--     'UCWLXYI27E8vV9xLvCVgXqgw',
--     'FX Evolution',
--     'Sample Analysis: EUR/USD Technical Outlook',
--     'Sample description',
--     'https://i.ytimg.com/vi/sample/maxresdefault.jpg',
--     'https://www.youtube.com/watch?v=sample',
--     NOW() - INTERVAL '1 day',
--     'Bullish outlook for EUR/USD with key support at 1.0850.',
--     ARRAY['Support identified at 1.0850', 'Resistance at 1.0950', 'Bullish trend continuation expected'],
--     '{"sentiment": "bullish", "pairs_analyzed": ["EUR/USD"], "timeframes": ["H4", "D1"], "key_levels": {"support": ["1.0850"], "resistance": ["1.0950"]}, "setups": [], "key_takeaways": ["Wait for breakout confirmation"]}',
--     'bullish',
--     ARRAY['EUR/USD'],
--     900
-- );

-- Verify table creation
SELECT 'youtube_analyses table created successfully' as status;
