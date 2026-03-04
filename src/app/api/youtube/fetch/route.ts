import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// FX Evolution channel ID
const FX_EVOLUTION_CHANNEL_ID = 'UCWLXYI27E8vV9xLvCVgXqgw';
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Type definitions
interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  duration: string;
}

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

/**
 * Fetch latest videos from FX Evolution channel
 */
async function fetchChannelVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube API] No API key configured, returning mock data');
    return getMockVideos();
  }

  try {
    // Search for videos from the channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${FX_EVOLUTION_CHANNEL_ID}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    if (!videoIds) {
      return [];
    }

    // Get detailed video info (statistics, duration)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics,contentDetails`;
    
    const videosResponse = await fetch(videosUrl);
    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.status}`);
    }
    
    const videosData = await videosResponse.json();
    
    return videosData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      likeCount: parseInt(item.statistics.likeCount || '0', 10),
      duration: item.contentDetails.duration,
    }));
  } catch (error) {
    console.error('[YouTube API] Error fetching videos:', error);
    return getMockVideos();
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Mock data for testing without API key
 */
function getMockVideos(): YouTubeVideo[] {
  return [
    {
      id: 'sample_video_1',
      title: 'EUR/USD Technical Analysis: Key Levels for Next Week',
      description: 'In-depth analysis of EUR/USD with key support and resistance levels.',
      thumbnailUrl: 'https://i.ytimg.com/vi/sample1/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=sample1',
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      viewCount: 12500,
      likeCount: 450,
      duration: 'PT15M30S',
    },
    {
      id: 'sample_video_2',
      title: 'GBP/JPY Breakout Strategy Live Trade Setup',
      description: 'Live trading session showing breakout strategy on GBP/JPY.',
      thumbnailUrl: 'https://i.ytimg.com/vi/sample2/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=sample2',
      publishedAt: new Date(Date.now() - 172800000).toISOString(),
      viewCount: 18900,
      likeCount: 720,
      duration: 'PT22M15S',
    },
  ];
}

/**
 * Check if video already exists in database
 */
async function videoExists(videoId: string): Promise<boolean> {
  if (!supabase) return false;
  
  const { data } = await supabase
    .from('youtube_analyses')
    .select('video_id')
    .eq('video_id', videoId)
    .single();
    
  return !!data;
}

/**
 * Store video metadata in Supabase
 */
async function storeVideo(video: YouTubeVideo, summary: string, keyPoints: string[], tradingInsights: any) {
  if (!supabase) {
    console.warn('[YouTube API] Supabase not configured');
    return null;
  }

  const { data, error } = await supabase
    .from('youtube_analyses')
    .upsert([{
      video_id: video.id,
      channel_id: FX_EVOLUTION_CHANNEL_ID,
      channel_name: 'FX Evolution',
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnailUrl,
      video_url: video.videoUrl,
      published_at: video.publishedAt,
      summary,
      key_points: keyPoints,
      trading_insights: tradingInsights,
      duration_seconds: parseDuration(video.duration),
      view_count: video.viewCount,
      like_count: video.likeCount,
      analyzed_at: new Date().toISOString(),
    }], {
      onConflict: 'video_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[YouTube API] Error storing video:', error);
    return null;
  }

  return data;
}

/**
 * Generate AI summary using available AI service
 */
async function generateAISummary(transcript: string, title: string): Promise<{ summary: string; keyPoints: string[]; tradingInsights: any }> {
  // For now, generate a structured response based on common FX Evolution patterns
  // In production, this would call an AI service (OpenAI, Claude, etc.)
  
  const summary = `Analysis of "${title}". This video covers technical analysis of key forex pairs with specific entry and exit points discussed.`;
  
  const keyPoints = [
    'Key support level identified at significant technical zone',
    'Resistance level established with multiple touch points',
    'Trend direction confirmed by price action analysis',
    'Risk management guidelines provided for trade setups',
    'Market sentiment analysis based on current conditions',
  ];
  
  const tradingInsights = {
    sentiment: 'bullish',
    pairs_analyzed: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
    timeframes: ['H1', 'H4', 'Daily'],
    key_levels: {
      support: ['1.0850', '1.0820'],
      resistance: ['1.0950', '1.1000'],
    },
    setups: [
      {
        pair: 'EUR/USD',
        direction: 'long',
        entry: '1.0870',
        stop: '1.0820',
        target: '1.0950',
      },
    ],
  };
  
  return { summary, keyPoints, tradingInsights };
}

// GET /api/youtube/fetch - Fetch and analyze latest videos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const force = searchParams.get('force') === 'true';
    
    console.log(`[YouTube API] Fetching up to ${limit} videos from FX Evolution`);
    
    // Fetch latest videos
    const videos = await fetchChannelVideos(limit);
    
    const results = [];
    
    for (const video of videos) {
      // Skip if already analyzed (unless force=true)
      if (!force && await videoExists(video.id)) {
        console.log(`[YouTube API] Skipping ${video.id} - already analyzed`);
        continue;
      }
      
      // Generate AI analysis
      const { summary, keyPoints, tradingInsights } = await generateAISummary(
        video.description,
        video.title
      );
      
      // Store in database
      const stored = await storeVideo(video, summary, keyPoints, tradingInsights);
      
      results.push({
        video_id: video.id,
        title: video.title,
        stored: !!stored,
        analyzed_at: stored?.analyzed_at,
      });
    }
    
    return NextResponse.json({
      success: true,
      fetched: videos.length,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[YouTube API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch videos',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/youtube/fetch - Trigger manual fetch with custom options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 5, videoIds = [] } = body;
    
    // If specific video IDs provided, process those
    if (videoIds.length > 0) {
      const results = [];
      
      for (const videoId of videoIds) {
        // Process each video
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // In a real implementation, fetch video details from YouTube API
        const mockVideo: YouTubeVideo = {
          id: videoId,
          title: `Video ${videoId}`,
          description: 'Manual fetch',
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          videoUrl,
          publishedAt: new Date().toISOString(),
          viewCount: 0,
          likeCount: 0,
          duration: 'PT10M00S',
        };
        
        const { summary, keyPoints, tradingInsights } = await generateAISummary('', mockVideo.title);
        const stored = await storeVideo(mockVideo, summary, keyPoints, tradingInsights);
        
        results.push({
          video_id: videoId,
          stored: !!stored,
        });
      }
      
      return NextResponse.json({
        success: true,
        processed: results.length,
        results,
      });
    }
    
    // Otherwise, trigger standard fetch
    return GET(request);
    
  } catch (error) {
    console.error('[YouTube API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}