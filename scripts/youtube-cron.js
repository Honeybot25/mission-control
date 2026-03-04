#!/usr/bin/env node
/**
 * YouTube Market Intelligence Cron Job
 * Runs every 6 hours to check for new FX Evolution videos
 * 
 * Usage: node scripts/youtube-cron.js
 * Or: npx ts-node scripts/youtube-cron.ts
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_TRADING_ALERTS_WEBHOOK;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const FX_EVOLUTION_CHANNEL_ID = 'UCWLXYI27E8vV9xLvCVgXqgw';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  publishedAt: string;
}

interface AnalysisResult {
  video_id: string;
  title: string;
  summary: string;
  sentiment: string;
  setups: number;
  pairs: string[];
}

/**
 * Log with timestamp
 */
function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Fetch latest videos from FX Evolution
 */
async function fetchLatestVideos(maxResults: number = 5): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    log('WARNING: No YouTube API key configured');
    return [];
  }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${FX_EVOLUTION_CHANNEL_ID}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch (error) {
    log(`Error fetching videos: ${error}`);
    return [];
  }
}

/**
 * Check if video already exists in database
 */
async function videoExists(videoId: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/youtube_analyses?video_id=eq.${videoId}&select=video_id`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.length > 0;
  } catch (error) {
    log(`Error checking video existence: ${error}`);
    return false;
  }
}

/**
 * Generate AI analysis for video
 */
async function generateAnalysis(video: YouTubeVideo): Promise<AnalysisResult> {
  // Simple rule-based analysis (replace with AI call in production)
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'XAU/USD'].filter(
    pair => video.title.includes(pair) || video.description.includes(pair)
  );

  const sentiment = /bullish|long|buy|rally/i.test(video.title) ? 'bullish' :
                    /bearish|short|sell|drop/i.test(video.title) ? 'bearish' : 'neutral';

  return {
    video_id: video.id,
    title: video.title,
    summary: `Analysis of ${video.title}. Covers technical levels and potential trade setups.`,
    sentiment,
    setups: pairs.length > 0 ? 1 : 0,
    pairs: pairs.length > 0 ? pairs : ['EUR/USD'],
  };
}

/**
 * Store analysis in Supabase
 */
async function storeAnalysis(video: YouTubeVideo, analysis: AnalysisResult): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('WARNING: Supabase not configured');
    return false;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/youtube_analyses`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        video_id: video.id,
        channel_id: FX_EVOLUTION_CHANNEL_ID,
        channel_name: 'FX Evolution',
        title: video.title,
        description: video.description,
        thumbnail_url: video.thumbnailUrl,
        video_url: video.videoUrl,
        published_at: video.publishedAt,
        summary: analysis.summary,
        key_points: ['Technical analysis provided', 'Trade setups discussed'],
        trading_insights: {
          sentiment: { overall: analysis.sentiment, confidence: 70, catalysts: [] },
          setups: [],
          levels: [],
          timeframes: ['H4', 'D1'],
          pairs_analyzed: analysis.pairs,
        },
        duration_seconds: 0,
        view_count: 0,
        like_count: 0,
        analyzed_at: new Date().toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    log(`Error storing analysis: ${error}`);
    return false;
  }
}

/**
 * Send Discord notification
 */
async function sendDiscordNotification(analysis: AnalysisResult, videoUrl: string): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    log('WARNING: Discord webhook not configured');
    return;
  }

  const sentimentEmoji = analysis.sentiment === 'bullish' ? '🟢' : 
                        analysis.sentiment === 'bearish' ? '🔴' : '⚪';

  const embed = {
    title: '📊 New FX Evolution Analysis',
    description: analysis.title,
    url: videoUrl,
    color: analysis.sentiment === 'bullish' ? 0x22c55e : 
           analysis.sentiment === 'bearish' ? 0xef4444 : 0x6b7280,
    fields: [
      {
        name: 'Sentiment',
        value: `${sentimentEmoji} ${analysis.sentiment.toUpperCase()}`,
        inline: true,
      },
      {
        name: 'Pairs',
        value: analysis.pairs.join(', ') || 'N/A',
        inline: true,
      },
      {
        name: 'Trade Setups',
        value: analysis.setups.toString(),
        inline: true,
      },
      {
        name: 'Summary',
        value: analysis.summary,
      },
    ],
    footer: {
      text: 'Mission Control | Market Intelligence',
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    log('Discord notification sent');
  } catch (error) {
    log(`Error sending Discord notification: ${error}`);
  }
}

/**
 * Main cron job function
 */
async function main() {
  log('Starting YouTube Market Intelligence cron job...');

  try {
    // Fetch latest videos
    const videos = await fetchLatestVideos(5);
    log(`Found ${videos.length} recent videos`);

    let newVideosCount = 0;

    for (const video of videos) {
      // Check if already processed
      if (await videoExists(video.id)) {
        log(`Skipping ${video.id} - already analyzed`);
        continue;
      }

      log(`Processing new video: ${video.title}`);

      // Generate analysis
      const analysis = await generateAnalysis(video);

      // Store in database
      const stored = await storeAnalysis(video, analysis);
      if (stored) {
        log(`Stored analysis for ${video.id}`);
        newVideosCount++;

        // Send Discord notification
        await sendDiscordNotification(analysis, video.videoUrl);
      }
    }

    log(`Cron job complete. Processed ${newVideosCount} new videos.`);

    // Log to activity feed
    if (newVideosCount > 0 && SUPABASE_URL && SUPABASE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/system_audit_log`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'youtube_cron_completed',
          details: { new_videos: newVideosCount, total_checked: videos.length },
          performed_by: 'cron',
        }),
      });
    }

  } catch (error) {
    log(`Cron job error: ${error}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().then(() => process.exit(0));
}

export { main };