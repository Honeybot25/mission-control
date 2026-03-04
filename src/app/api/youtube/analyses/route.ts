import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// GET /api/youtube/analyses - Get all analyzed videos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const pair = searchParams.get('pair') || undefined;
    const sentiment = searchParams.get('sentiment') || undefined;
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    let query = supabase
      .from('youtube_analyses')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    // Filter by pair if specified
    if (pair) {
      query = query.contains('assets', [pair]);
    }

    // Filter by date range
    if (days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('published_at', cutoff);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API Analyses] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analyses', details: error.message },
        { status: 500 }
      );
    }

    // Filter by sentiment in memory (since it's a column now)
    let analyses = data || [];
    if (sentiment) {
      analyses = analyses.filter(a => a.sentiment === sentiment);
    }

    return NextResponse.json({
      success: true,
      count: analyses.length,
      analyses
    });

  } catch (error) {
    console.error('[API Analyses] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
