import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const youtubeSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types for YouTube analysis
export interface YouTubeAnalysis {
  id?: string;
  video_id: string;
  channel_id: string;
  channel_name: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  published_at: string;
  transcript?: string;
  summary: string;
  key_points: string[];
  trading_insights: TradingInsights;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  assets: string[];
  duration_seconds: number;
  view_count: number;
  like_count: number;
  analyzed_at: string;
  added_to_knowledge?: boolean;
}

export interface TradingInsights {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  pairs_analyzed: string[];
  timeframes: string[];
  key_levels: {
    support: string[];
    resistance: string[];
  };
  setups: TradeSetup[];
  key_takeaways: string[];
}

export interface TradeSetup {
  pair: string;
  direction: 'long' | 'short' | 'neutral';
  entry?: string;
  stop?: string;
  target?: string;
  timeframe?: string;
  notes?: string;
}

// Fetch all analyses
export async function getYouTubeAnalyses(limit: number = 20): Promise<YouTubeAnalysis[]> {
  try {
    const { data, error } = await youtubeSupabase
      .from('youtube_analyses')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[YouTube] Fetch error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[YouTube] Get analyses error:', error);
    return [];
  }
}

// Get single analysis by video ID
export async function getYouTubeAnalysis(videoId: string): Promise<YouTubeAnalysis | null> {
  try {
    const { data, error } = await youtubeSupabase
      .from('youtube_analyses')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error) {
      console.error('[YouTube] Fetch single error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[YouTube] Get analysis error:', error);
    return null;
  }
}

// Check if video exists
export async function videoExists(videoId: string): Promise<boolean> {
  try {
    const { data } = await youtubeSupabase
      .from('youtube_analyses')
      .select('video_id')
      .eq('video_id', videoId)
      .single();
    
    return !!data;
  } catch {
    return false;
  }
}

// Store analysis
export async function storeYouTubeAnalysis(analysis: Omit<YouTubeAnalysis, 'id'>): Promise<YouTubeAnalysis | null> {
  try {
    const { data, error } = await youtubeSupabase
      .from('youtube_analyses')
      .upsert([analysis], {
        onConflict: 'video_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[YouTube] Store error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[YouTube] Store analysis error:', error);
    return null;
  }
}

// Update knowledge base link
export async function markAsAddedToKnowledge(videoId: string): Promise<boolean> {
  try {
    const { error } = await youtubeSupabase
      .from('youtube_analyses')
      .update({ added_to_knowledge: true })
      .eq('video_id', videoId);

    if (error) {
      console.error('[YouTube] Update error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[YouTube] Mark as added error:', error);
    return false;
  }
}

// Subscribe to new analyses
export function subscribeToYouTubeAnalyses(callback: (payload: { new: YouTubeAnalysis }) => void) {
  return youtubeSupabase
    .channel('youtube_analyses_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'youtube_analyses' },
      (payload: { new: YouTubeAnalysis }) => {
        callback(payload);
      }
    )
    .subscribe();
}

// Get latest analysis
export async function getLatestAnalysis(): Promise<YouTubeAnalysis | null> {
  try {
    const { data, error } = await youtubeSupabase
      .from('youtube_analyses')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[YouTube] Latest fetch error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[YouTube] Get latest error:', error);
    return null;
  }
}
