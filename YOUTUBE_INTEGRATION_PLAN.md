# YouTube Market Intelligence Integration

## Source
**Channel:** @fxevolutionvideo (FX Evolution)
**Focus:** Professional trading analysis, technical analysis, market breakdowns

## New Dashboard Tab: /market-intelligence

## Features

### 1. Video Monitoring
- Auto-check @fxevolutionvideo every 6 hours
- Detect new uploads
- Download video transcripts
- Store in Supabase

### 2. AI Analysis
Extract from each video:
- Market commentary summary
- Key support/resistance levels
- Trade setups mentioned
- Risk management tips
- Overall sentiment (bullish/bearish)
- Asset focus (forex, crypto, stocks)

### 3. Display in Mission Control
- Video cards with thumbnails
- AI-generated summary (3-5 bullet points)
- Key levels highlighted
- Link to full video
- Published date
- "Add to Knowledge Base" button

### 4. Notifications
- New video detected → #trading-alerts
- Summary posted with link
- Relevant trade ideas highlighted

### 5. Knowledge Integration
- Videos linked to knowledge artifacts
- TraderBot can reference analysis
- Searchable in second brain

## Technical Stack
- YouTube Data API v3
- youtube-transcript-api
- OpenAI analysis (summarization)
- Supabase for storage
- Cron job for monitoring
- Next.js page + components

## Database Schema
```sql
CREATE TABLE youtube_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id VARCHAR(100) UNIQUE,
  channel_id VARCHAR(100),
  title TEXT,
  description TEXT,
  published_at TIMESTAMPTZ,
  thumbnail_url TEXT,
  transcript TEXT,
  summary TEXT,
  key_points JSONB,
  sentiment VARCHAR(50),
  assets TEXT[],
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Status
- [ ] YouTube API integration
- [ ] Transcript extraction
- [ ] AI analysis pipeline
- [ ] Mission Control page
- [ ] Cron monitoring job
- [ ] Discord notifications
- [ ] Knowledge base linking
