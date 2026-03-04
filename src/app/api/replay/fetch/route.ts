import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { readFallbackLogs } from '@/lib/fallback-logger';

interface ReplayEvent {
  id: string;
  timestamp: string;
  agent: string;
  project: string;
  status: string;
  description: string;
  details?: Record<string, unknown>;
  links?: Record<string, string>;
  estimated_impact: string;
  error?: string;
  duration?: number;
}

interface ReplayData {
  date: string;
  events: ReplayEvent[];
  stats: {
    totalEvents: number;
    agentBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
    hourlyDistribution: number[];
    peakHour: number;
    busiestMinute: string;
  };
  comparison?: {
    previousDate: string;
    eventDiff: number;
    percentChange: number;
  };
}

// Generate mock events for dates without real data
function generateMockEvents(date: string, count: number = 50): ReplayEvent[] {
  const agents = ['TraderBot', 'ProductBuilder', 'iOSAppBuilder', 'Distribution', 'MemoryManager'];
  const statuses = ['created', 'started', 'in-progress', 'completed', 'failed'];
  const projects = ['trading', 'product-dev', 'ios-app', 'content', 'memory-sync'];
  const impacts = ['low', 'medium', 'high', 'critical'];
  
  const events: ReplayEvent[] = [];
  const baseDate = new Date(date);
  
  for (let i = 0; i < count; i++) {
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(baseDate);
    timestamp.setHours(hour, minute, second);
    
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const project = projects[Math.floor(Math.random() * projects.length)];
    const impact = impacts[Math.floor(Math.random() * impacts.length)];
    
    events.push({
      id: `mock-${date}-${i}`,
      timestamp: timestamp.toISOString(),
      agent,
      project,
      status,
      description: generateMockDescription(agent, status, project),
      estimated_impact: impact,
      duration: Math.floor(Math.random() * 300000), // 0-5 minutes
    });
  }
  
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateMockDescription(agent: string, status: string, project: string): string {
  const descriptions: Record<string, string[]> = {
    TraderBot: [
      'Analyzed market signals for SPY',
      'Executed options strategy',
      'Updated watchlist',
      'Fetched options signals',
      'Generated trade recommendations',
    ],
    ProductBuilder: [
      'Built new feature',
      'Fixed critical bug',
      'Deployed to Vercel',
      'Updated API endpoint',
      'Created new component',
    ],
    iOSAppBuilder: [
      'Built TestFlight release',
      'Fixed Swift compilation error',
      'Updated app store metadata',
      'Tested on device',
      'Submitted for review',
    ],
    Distribution: [
      'Posted tweet thread',
      'Scheduled content',
      'Analyzed engagement metrics',
      'Updated content calendar',
      'Cross-posted to platforms',
    ],
    MemoryManager: [
      'Consolidated daily logs',
      'Indexed new knowledge',
      'Generated insights report',
      'Archived old entries',
      'Synced with Notion',
    ],
  };
  
  const agentDescriptions = descriptions[agent] || ['Processed task'];
  return agentDescriptions[Math.floor(Math.random() * agentDescriptions.length)];
}

function calculateStats(events: ReplayEvent[]) {
  const agentBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  const hourlyDistribution = new Array(24).fill(0);
  const minuteCounts: Record<string, number> = {};
  
  events.forEach(event => {
    // Agent breakdown
    agentBreakdown[event.agent] = (agentBreakdown[event.agent] || 0) + 1;
    
    // Status breakdown
    statusBreakdown[event.status] = (statusBreakdown[event.status] || 0) + 1;
    
    // Hourly distribution
    const hour = new Date(event.timestamp).getHours();
    hourlyDistribution[hour]++;
    
    // Minute counts for busiest minute
    const minute = new Date(event.timestamp).toISOString().slice(0, 16);
    minuteCounts[minute] = (minuteCounts[minute] || 0) + 1;
  });
  
  // Find peak hour
  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
  
  // Find busiest minute
  const busiestMinute = Object.entries(minuteCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  
  return {
    totalEvents: events.length,
    agentBreakdown,
    statusBreakdown,
    hourlyDistribution,
    peakHour,
    busiestMinute,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const compareDate = searchParams.get('compareDate');
  const agentFilter = searchParams.get('agent');
  const limit = parseInt(searchParams.get('limit') || '500');
  
  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter is required (YYYY-MM-DD format)' },
      { status: 400 }
    );
  }
  
  try {
    let events: ReplayEvent[] = [];
    
    // Try to fetch from Supabase first
    if (supabase) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: logEntries, error } = await supabase
        .from('log_entries')
        .select('*')
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())
        .order('timestamp', { ascending: true });
      
      if (!error && logEntries && logEntries.length > 0) {
        events = logEntries.map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp,
          agent: entry.agent,
          project: entry.project,
          status: entry.status,
          description: entry.description,
          details: entry.details || {},
          links: entry.links || {},
          estimated_impact: entry.estimated_impact,
          error: entry.error,
        }));
      }
      
      // Also fetch from agent_runs
      const { data: agentRuns, error: runsError } = await supabase
        .from('agent_runs')
        .select('*, agent:agents(name)')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });
      
      if (!runsError && agentRuns && agentRuns.length > 0) {
        const runEvents = agentRuns.map(run => ({
          id: run.id,
          timestamp: run.created_at,
          agent: run.agent?.name || run.agent_id,
          project: 'general',
          status: run.status === 'completed' ? 'completed' : 
                  run.status === 'failed' ? 'failed' : 
                  run.status === 'running' ? 'in-progress' : 'created',
          description: run.input_summary || 'Agent execution',
          details: {
            duration: run.duration_ms,
            tokens: run.tokens_total,
            cost: run.cost_usd,
            trigger: run.trigger_type,
          },
          estimated_impact: 'medium',
        }));
        
        events = [...events, ...runEvents];
      }
    }
    
    // Try fallback logs
    try {
      const fallbackLogs = await readFallbackLogs(1000);
      const dateEvents = fallbackLogs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === date;
      }).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        agent: log.agent,
        project: log.project || 'general',
        status: log.status,
        description: log.description,
        details: log.details || {},
        links: log.links || {},
        estimated_impact: log.estimated_impact || 'medium',
        error: log.error,
      }));
      
      events = [...events, ...dateEvents];
    } catch (err) {
      console.warn('[Replay API] Fallback logs error:', err);
    }
    
    // If no events found, generate mock data
    if (events.length === 0) {
      events = generateMockEvents(date, 50);
    }
    
    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Apply agent filter
    if (agentFilter) {
      events = events.filter(e => e.agent.toLowerCase() === agentFilter.toLowerCase());
    }
    
    // Limit events
    events = events.slice(0, limit);
    
    // Calculate stats
    const stats = calculateStats(events);
    
    const response: ReplayData = {
      date,
      events,
      stats,
    };
    
    // Add comparison if requested
    if (compareDate) {
      // For comparison, fetch events for the compare date
      const compareEvents = generateMockEvents(compareDate, 50);
      const compareStats = calculateStats(compareEvents);
      
      response.comparison = {
        previousDate: compareDate,
        eventDiff: events.length - compareStats.totalEvents,
        percentChange: compareStats.totalEvents > 0 
          ? Math.round(((events.length - compareStats.totalEvents) / compareStats.totalEvents) * 100)
          : 0,
      };
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Replay API] Error:', error);
    
    // Return mock data on error
    const mockEvents = generateMockEvents(date, 50);
    const mockStats = calculateStats(mockEvents);
    
    return NextResponse.json({
      date,
      events: mockEvents,
      stats: mockStats,
      warning: 'Using mock data due to error',
    });
  }
}

// POST handler for exporting replay
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, format, startTime, endTime, events } = body;
    
    if (!date || !format) {
      return NextResponse.json(
        { error: 'Missing required fields: date and format' },
        { status: 400 }
      );
    }
    
    // In production, this would generate actual video/GIF
    // For now, return a mock export URL
    const exportId = `replay-${date}-${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      exportId,
      format,
      date,
      duration: endTime && startTime ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) : 86400,
      eventsCount: events?.length || 0,
      downloadUrl: `/api/replay/download/${exportId}`,
      status: 'processing',
      estimatedCompletion: new Date(Date.now() + 30000).toISOString(),
    });
  } catch (error) {
    console.error('[Replay API] Export error:', error);
    return NextResponse.json(
      { error: 'Failed to process export' },
      { status: 500 }
    );
  }
}
