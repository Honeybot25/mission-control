import { NextRequest, NextResponse } from 'next/server';
import { storeYouTubeAnalysis, videoExists, getLatestAnalysis } from '@/lib/youtube-analytics';
import { 
  analyzeMarketVideo, 
  fetchYouTubeTranscript, 
  isMarketRelated,
  FX_EVOLUTION_CHANNEL_ID 
} from '@/lib/analyze-market-video';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

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

/**
 * Fetch latest videos from FX Evolution channel
 */
async function fetchChannelVideos(maxResults: number = 10): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn('[YouTube Monitor] No API key configured');
    return [];
  }

  try {
    // Search for videos from the channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${FX_EVOLUTION_CHANNEL_ID}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`;
    
    const searchResponse = await fetch(searchUrl, { next: { revalidate: 0 } });
    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    // Get detailed video info (statistics, duration)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics,contentDetails`;
    
    const videosResponse = await fetch(videosUrl, { next: { revalidate: 0 } });
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
    console.error('[YouTube Monitor] Error fetching videos:', error);
    return [];
  }
}

/**
 * Send notification to Discord trading-alerts channel
 */
async function notifyDiscord(analysis: any) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_TRADING_ALERTS;
    if (!webhookUrl) {
      console.warn('[YouTube Monitor] No Discord webhook configured');
      return;
    }

    const sentimentEmoji = analysis.sentiment === 'bullish' ? '🟢' : 
                          analysis.sentiment === 'bearish' ? '🔴' : '⚪';
    
    const embed = {
      title: `📺 New FX Evolution Analysis: ${analysis.title}`,
      url: analysis.video_url,
      color: analysis.sentiment === 'bullish' ? 0x22c55e : 
             analysis.sentiment === 'bearish' ? 0xef4444 : 0x6b7280,
      thumbnail: { url: analysis.thumbnail_url },
      fields: [
        {
          name: `${sentimentEmoji} Sentiment`,
          value: analysis.sentiment.toUpperCase(),
          inline: true
        },
        {
          name: '📊 Assets',
          value: analysis.assets.slice(0, 3).join(', ') || 'N/A',
          inline: true
        },
        {
          name: '🕐 Published',
          value: new Date(analysis.published_at).toLocaleDateString(),
          inline: true
        },
        {
          name: '📝 Key Points',
          value: analysis.key_points.slice(0, 3).map((p: string) => `• ${p}`).join('\n') || 'N/A'
        }
      ],
      footer: {
        text: `Analyzed at ${new Date(analysis.analyzed_at).toLocaleString()}`
      }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    console.log('[YouTube Monitor] Discord notification sent');
  } catch (error) {
    console.error('[YouTube Monitor] Discord notification failed:', error);
  }
}

/**
 * Check for and process new videos
 */
async function checkForNewVideos(limit: number = 5): Promise<{
  checked: number;
  new: number;
  analyses: any[];
}> {
  console.log('[YouTube Monitor] Checking for new videos...');
  
  // Fetch latest videos from channel
  const videos = await fetchChannelVideos(limit);
  
  if (videos.length === 0) {
    console.log('[YouTube Monitor] No videos found');
    return { checked: 0, new: 0, analyses: [] };
  }

  const results = [];
  let newCount = 0;

  for (const video of videos) {
    // Skip non-market videos
    if (!isMarketRelated(video.title, video.description)) {
      console.log(`[YouTube Monitor] Skipping non-market video: ${video.title}`);
      continue;
    }

    // Check if already analyzed
    const exists = await videoExists(video.id);
    if (exists) {
      console.log(`[YouTube Monitor] Video already analyzed: ${video.id}`);
      continue;
    }

    console.log(`[YouTube Monitor] New video found: ${video.title}`);
    newCount++;

    // Fetch transcript
    const transcript = await fetchYouTubeTranscript(video.id);

    // Analyze with AI
    const analysis = await analyzeMarketVideo({
      ...video,
      transcript: transcript || undefined
    });

    // Store in database
    const stored = await storeYouTubeAnalysis(analysis as any);
    
    if (stored) {
      results.push(stored);
      
      // Notify Discord
      await notifyDiscord(stored);
      
      console.log(`[YouTube Monitor] Stored analysis for: ${video.id}`);
    }
  }

  return {
    checked: videos.length,
    new: newCount,
    analyses: results
  };
}

// GET /api/youtube/monitor - Check for new videos and analyze them
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const dryRun = searchParams.get('dryRun') === 'true';

    console.log(`[YouTube Monitor] GET request - limit: ${limit}, dryRun: ${dryRun}`);

    if (dryRun) {
      // Return current status without processing
      const latest = await getLatestAnalysis();
      return NextResponse.json({
        success: true,
        dryRun: true,
        lastAnalyzed: latest?.published_at || null,
        message: 'Dry run - no videos processed'
      });
    }

    // Check for and process new videos
    const result = await checkForNewVideos(limit);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      videosChecked: result.checked,
      newVideos: result.new,
      analyses: result.analyses.map(a => ({
        video_id: a.video_id,
        title: a.title,
        sentiment: a.sentiment,
        assets: a.assets
      }))
    });

  } catch (error) {
    console.error('[YouTube Monitor] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to monitor YouTube videos',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST /api/youtube/monitor - Manual trigger with options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      videoId, 
      force = false,
      notify = true 
    } = body;

    // If specific video ID provided, analyze just that video
    if (videoId) {
      console.log(`[YouTube Monitor] Manual analysis requested for: ${videoId}`);

      // Check if exists (unless force=true)
      if (!force) {
        const exists = await videoExists(videoId);
        if (exists) {
          return NextResponse.json({
            success: false,
            error: 'Video already analyzed',
            message: 'Use force=true to re-analyze'
          }, { status: 409 });
        }
      }

      // Fetch video details from YouTube API
      if (!YOUTUBE_API_KEY) {
        return NextResponse.json({
          success: false,
          error: 'YouTube API key not configured'
        }, { status: 500 });
      }

      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoId}&part=snippet,statistics,contentDetails`;
      const response = await fetch(videoUrl, { next: { revalidate: 0 } });
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Video not found'
        }, { status: 404 });
      }

      const item = data.items[0];
      const video = {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(item.statistics.viewCount || '0', 10),
        likeCount: parseInt(item.statistics.likeCount || '0', 10),
        duration: item.contentDetails.duration,
      };

      // Fetch transcript
      const transcript = await fetchYouTubeTranscript(video.id);

      // Analyze
      const analysis = await analyzeMarketVideo({
        ...video,
        transcript: transcript || undefined
      });

      // Store
      const stored = await storeYouTubeAnalysis(analysis as any);

      // Notify if requested
      if (notify && stored) {
        await notifyDiscord(stored);
      }

      return NextResponse.json({
        success: true,
        videoId,
        analyzed: !!stored,
        analysis: stored
      });
    }

    // Otherwise, run standard check
    return GET(request);

  } catch (error) {
    console.error('[YouTube Monitor] POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
