import { createClient } from '@supabase/supabase-js';

// Environment variables - use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://avpizuhhirbhjudplihy.supabase.co';
// Use service role key for server-side, fallback to anon key for client-side
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SERVICE_ROLE ||
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

// Validate configuration
const isConfigured = supabaseUrl && supabaseKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseKey !== 'placeholder-key';

// Connection state tracking
let connectionState: 'connecting' | 'connected' | 'error' | 'unconfigured' = isConfigured ? 'connecting' : 'unconfigured';
let lastConnectionError: string | null = null;

// Create Supabase client with retry configuration
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Types matching the actual Supabase schema
export type AgentStatus = 'idle' | 'active' | 'paused' | 'error' | 'offline' | 'deprecated';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
export type EventType = 'start' | 'end' | 'checkpoint' | 'decision' | 'tool_call' | 'tool_result' | 'llm_call' | 'llm_response' | 'error' | 'warning' | 'info';
export type EventLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: AgentStatus;
  version: string;
  capabilities: string[];
  tags: string[];
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  last_heartbeat: string | null;
  heartbeat_interval_seconds: number;
  max_concurrent_runs: number;
  daily_run_limit: number;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  status: RunStatus;
  trigger_type: string;
  start_time: string | null;
  end_time: string | null;
  duration_ms: number | null;
  input_summary: string | null;
  output_summary: string | null;
  tokens_total: number | null;
  cost_usd: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  agent?: Agent;
}

export interface AgentEvent {
  id: string;
  run_id: string;
  agent_id: string | null;
  timestamp: string;
  type: string;
  level: string;
  message: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface ScheduledTask {
  id: string;
  agent_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  task_type: string;
  description: string;
  input_payload: Record<string, unknown>;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  agent?: Agent;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(isConfigured && supabase !== null);
}

/**
 * Get current connection state
 */
export function getConnectionState(): { state: typeof connectionState; error: string | null } {
  return { state: connectionState, error: lastConnectionError };
}

/**
 * Test connection to Supabase
 */
export async function testConnection(): Promise<boolean> {
  if (!supabase) {
    connectionState = 'unconfigured';
    return false;
  }

  try {
    connectionState = 'connecting';
    const { error } = await supabase.from('agents').select('count').limit(1).single();
    
    if (error) {
      connectionState = 'error';
      lastConnectionError = error.message;
      console.error('[Supabase] Connection test failed:', error.message);
      return false;
    }
    
    connectionState = 'connected';
    lastConnectionError = null;
    console.log('[Supabase] Connected successfully');
    return true;
  } catch (err) {
    connectionState = 'error';
    lastConnectionError = err instanceof Error ? err.message : String(err);
    console.error('[Supabase] Connection test error:', err);
    return false;
  }
}

/**
 * Execute a Supabase query with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: Error | null }>,
  retries: number = MAX_RETRIES
): Promise<{ data: T | null; error: Error | null }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await operation();
      
      if (!result.error) {
        if (connectionState !== 'connected') {
          connectionState = 'connected';
          lastConnectionError = null;
        }
        return result;
      }
      
      lastError = result.error;
      
      // Don't retry on certain errors
      if (result.error.message?.includes('auth') || 
          result.error.message?.includes('permission') ||
          result.error.message?.includes('not found')) {
        return result;
      }
      
      if (attempt < retries) {
        console.warn(`[Supabase] Attempt ${attempt} failed, retrying in ${RETRY_DELAY * attempt}ms...`);
        await sleep(RETRY_DELAY * attempt);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      if (attempt < retries) {
        console.warn(`[Supabase] Attempt ${attempt} threw error, retrying...`);
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }
  
  connectionState = 'error';
  lastConnectionError = lastError?.message || 'Unknown error';
  return { data: null, error: lastError };
}

/**
 * Get all agents
 */
export async function getAgents(): Promise<Agent[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty agents list');
    return [];
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await supabase!.from('agents').select('*').order('name');
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to fetch agents:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get agent by ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot fetch agent');
    return null;
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await supabase!.from('agents').select('*').eq('id', id).single();
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to fetch agent:', error);
    return null;
  }
  
  return data;
}

/**
 * Get agent by slug
 */
export async function getAgentBySlug(slug: string): Promise<Agent | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot fetch agent');
    return null;
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await supabase!.from('agents').select('*').eq('slug', slug).single();
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to fetch agent:', error);
    return null;
  }
  
  return data;
}

/**
 * Create or update an agent
 */
export async function upsertAgent(agent: Partial<Agent>): Promise<Agent | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot upsert agent');
    return null;
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('agents')
      .upsert([agent])
      .select()
      .single();
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to upsert agent:', error);
    return null;
  }
  
  return data;
}

/**
 * Get recent agent runs
 */
export async function getAgentRuns(limit: number = 50, agentId?: string): Promise<AgentRun[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty runs list');
    return [];
  }
  
  let query = supabase
    .from('agent_runs')
    .select('*, agent:agents(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (agentId) {
    query = query.eq('agent_id', agentId);
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await query;
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to fetch agent runs:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get active agent runs (pending or running)
 */
export async function getActiveAgentRuns(): Promise<AgentRun[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty runs list');
    return [];
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('agent_runs')
      .select('*, agent:agents(*)')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false });
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to fetch active agent runs:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new agent run
 */
export async function createAgentRun(
  agentId: string,
  trigger: string,
  inputPayload: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {}
): Promise<AgentRun | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot create run');
    return null;
  }

  // Use only columns that exist in the database
  // Based on testing: agent_id, status, input_summary exist
  // trigger_type, metadata, start_time do NOT exist
  const inputSummary = typeof inputPayload === 'object'
    ? (inputPayload.task as string) || JSON.stringify(inputPayload).slice(0, 500)
    : String(inputPayload);

  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('agent_runs')
      .insert([{
        agent_id: agentId,
        status: 'pending',
        input_summary: inputSummary,
      }])
      .select('*, agent:agents(*)')
      .single();
    return result;
  });

  if (error) {
    console.error('[Supabase] Failed to create agent run:', error);
    return null;
  }

  return data;
}

/**
 * Update agent run status
 */
export async function updateAgentRun(
  runId: string,
  updates: Partial<AgentRun>
): Promise<AgentRun | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot update run');
    return null;
  }

  // Map field names to match DB schema
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.end_time !== undefined) dbUpdates.end_time = updates.end_time;
  if (updates.duration_ms !== undefined) dbUpdates.duration_ms = updates.duration_ms;
  if (updates.output_summary !== undefined) dbUpdates.output_summary = updates.output_summary;
  if (updates.tokens_total !== undefined) dbUpdates.tokens_total = updates.tokens_total;
  if (updates.cost_usd !== undefined) dbUpdates.cost_usd = updates.cost_usd;
  if (updates.metadata) dbUpdates.metadata = updates.metadata;

  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('agent_runs')
      .update(dbUpdates)
      .eq('id', runId)
      .select('*, agent:agents(*)')
      .single();
    return result;
  });

  if (error) {
    console.error('[Supabase] Failed to update agent run:', error);
    return null;
  }

  return data;
}

/**
 * Get recent agent events
 */
export async function getAgentEvents(limit: number = 50, runId?: string): Promise<AgentEvent[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty events list');
    return [];
  }
  
  let query = supabase
    .from('agent_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (runId) {
    query = query.eq('run_id', runId);
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await query;
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to fetch agent events:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new agent event
 */
export async function createAgentEvent(
  runId: string,
  type: EventType,
  level: EventLevel,
  message: string,
  data: Record<string, unknown> = {},
  agentId?: string
): Promise<AgentEvent | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot create event');
    return null;
  }

  const { data: result, error } = await withRetry(async () => {
    const res = await supabase!
      .from('agent_events')
      .insert([{
        run_id: runId,
        agent_id: agentId || null,
        timestamp: new Date().toISOString(),
        type,
        level,
        message,
        data,
      }])
      .select()
      .single();
    return res;
  });

  if (error) {
    console.error('[Supabase] Failed to create agent event:', error);
    return null;
  }

  return result;
}

/**
 * Get scheduled tasks
 */
export async function getScheduledTasks(
  status?: string,
  limit: number = 50
): Promise<ScheduledTask[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty tasks list');
    return [];
  }
  
  let query = supabase
    .from('scheduled_tasks')
    .select('*, agent:agents(*)')
    .order('priority', { ascending: false })
    .order('scheduled_for', { ascending: true })
    .limit(limit);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await query;
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to fetch scheduled tasks:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a scheduled task
 */
export async function createScheduledTask(
  agentId: string,
  taskType: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  scheduledFor?: string,
  inputPayload: Record<string, unknown> = {}
): Promise<ScheduledTask | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot create task');
    return null;
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('scheduled_tasks')
      .insert([{
        agent_id: agentId,
        task_type: taskType,
        description,
        priority,
        scheduled_for: scheduledFor || new Date().toISOString(),
        input_payload: inputPayload,
        status: 'pending',
      }])
      .select('*, agent:agents(*)')
      .single();
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to create scheduled task:', error);
    return null;
  }
  
  return data;
}

/**
 * Update scheduled task
 */
export async function updateScheduledTask(
  taskId: string,
  updates: Partial<ScheduledTask>
): Promise<ScheduledTask | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot update task');
    return null;
  }
  
  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('scheduled_tasks')
      .update(updates)
      .eq('id', taskId)
      .select('*, agent:agents(*)')
      .single();
    return result;
  }
  );
  
  if (error) {
    console.error('[Supabase] Failed to update scheduled task:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete scheduled task
 */
export async function deleteScheduledTask(taskId: string): Promise<boolean> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot delete task');
    return false;
  }
  
  const { error } = await withRetry(async () => {
    const result = await supabase!.from('scheduled_tasks').delete().eq('id', taskId);
    return result;
  });
  
  if (error) {
    console.error('[Supabase] Failed to delete scheduled task:', error);
    return false;
  }
  
  return true;
}

/**
 * Subscribe to realtime agent events
 */
export function subscribeToAgentEvents(
  callback: (payload: { new: AgentEvent; old: AgentEvent | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }
  
  return supabase
    .channel('agent_events_channel')
    .on(
      'postgres_changes' as any,
      { 
        event: '*', 
        schema: 'public', 
        table: 'agent_events' 
      },
      (payload: { new: AgentEvent; old: AgentEvent | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Agent events subscription status: ${status}`);
    });
}

/**
 * Subscribe to realtime agent runs
 */
export function subscribeToAgentRuns(
  callback: (payload: { new: AgentRun; old: AgentRun | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }
  
  return supabase
    .channel('agent_runs_channel')
    .on(
      'postgres_changes' as any,
      { 
        event: '*', 
        schema: 'public', 
        table: 'agent_runs' 
      },
      (payload: { new: AgentRun; old: AgentRun | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Agent runs subscription status: ${status}`);
    });
}

/**
 * Subscribe to realtime agent updates
 */
export function subscribeToAgents(
  callback: (payload: { new: Agent; old: Agent | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }
  
  return supabase
    .channel('agents_channel')
    .on(
      'postgres_changes' as any,
      { 
        event: '*', 
        schema: 'public', 
        table: 'agents' 
      },
      (payload: { new: Agent; old: Agent | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Agents subscription status: ${status}`);
    });
}

/**
 * Subscribe to realtime scheduled tasks
 */
export function subscribeToScheduledTasks(
  callback: (payload: { new: ScheduledTask; old: ScheduledTask | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }
  
  return supabase
    .channel('scheduled_tasks_channel')
    .on(
      'postgres_changes' as any,
      { 
        event: '*', 
        schema: 'public', 
        table: 'scheduled_tasks' 
      },
      (payload: { new: ScheduledTask; old: ScheduledTask | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Scheduled tasks subscription status: ${status}`);
    });
}

/**
 * Convert AgentRun to legacy LogEntry format for compatibility
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  project: string;
  status: 'created' | 'started' | 'in-progress' | 'paused' | 'completed' | 'failed';
  description: string;
  details?: Record<string, unknown>;
  links?: Record<string, string>;
  estimated_impact: ImpactLevel;
  created_at: string;
}

export function agentRunToLogEntry(run: AgentRun): LogEntry {
  const statusMap: Record<RunStatus, LogEntry['status']> = {
    'pending': 'created',
    'running': 'in-progress',
    'completed': 'completed',
    'failed': 'failed',
    'cancelled': 'failed',
    'timeout': 'failed',
  };
  
  // Use input_summary which exists in the database
  // input_payload, metadata, and trigger do NOT exist
  const project = 'general';
  const runAny = run as unknown as Record<string, unknown>;
  const description = run.input_summary ||
                      (runAny.trigger_type as string) ||
                      'Agent execution';

  return {
    id: run.id,
    timestamp: run.created_at,
    agent: run.agent?.name || run.agent_id,
    project,
    status: statusMap[run.status] || 'created',
    description,
    details: {
      duration: run.duration_ms,
      tokens: run.tokens_total,
      cost: run.cost_usd,
    },
    links: {},
    estimated_impact: 'medium',
    created_at: run.created_at,
  };
}

// ============================================================================
// YouTube Market Intelligence Types & Functions
// ============================================================================

export interface YouTubeAnalysis {
  id: string;
  video_id: string;
  channel_id: string;
  channel_name: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  published_at: string;
  summary: string;
  key_points: string[];
  trading_insights: Record<string, unknown>;
  transcript_text: string | null;
  transcript_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  like_count: number;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all YouTube video analyses
 */
export async function getYouTubeAnalyses(
  limit: number = 50,
  pair?: string,
  days: number = 30
): Promise<YouTubeAnalysis[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty analyses list');
    return [];
  }

  let query = supabase
    .from('youtube_analyses')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (pair) {
    query = query.contains('trading_insights', { pairs_analyzed: [pair] });
  }

  if (days > 0) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('published_at', cutoff);
  }

  const { data, error } = await withRetry(async () => {
    const result = await query;
    return result;
  });

  if (error) {
    console.error('[Supabase] Failed to fetch YouTube analyses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single YouTube analysis by video ID
 */
export async function getYouTubeAnalysisByVideoId(videoId: string): Promise<YouTubeAnalysis | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot fetch analysis');
    return null;
  }

  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('youtube_analyses')
      .select('*')
      .eq('video_id', videoId)
      .single();
    return result;
  });

  if (error) {
    console.error('[Supabase] Failed to fetch YouTube analysis:', error);
    return null;
  }

  return data;
}

/**
 * Create or update a YouTube analysis
 */
export async function upsertYouTubeAnalysis(
  analysis: Partial<YouTubeAnalysis>
): Promise<YouTubeAnalysis | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot upsert analysis');
    return null;
  }

  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('youtube_analyses')
      .upsert([analysis])
      .select()
      .single();
    return result;
  });

  if (error) {
    console.error('[Supabase] Failed to upsert YouTube analysis:', error);
    return null;
  }

  return data;
}

/**
 * Check if a video has been analyzed
 */
export async function isVideoAnalyzed(videoId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data } = await supabase
    .from('youtube_analyses')
    .select('video_id')
    .eq('video_id', videoId)
    .single();

  return !!data;
}

/**
 * Get unique currency pairs from all analyses
 */
export async function getAnalyzedPairs(): Promise<string[]> {
  if (!supabase) return [];

  const { data, error } = await withRetry(async () => {
    const result = await supabase!
      .from('youtube_analyses')
      .select('trading_insights');
    return result;
  });

  if (error) {
    console.error('[Supabase] Failed to fetch pairs:', error);
    return [];
  }

  const pairs = new Set<string>();
  data?.forEach((item: any) => {
    const itemPairs = item.trading_insights?.pairs_analyzed;
    if (Array.isArray(itemPairs)) {
      itemPairs.forEach((p: string) => pairs.add(p));
    }
  });

  return Array.from(pairs).sort();
}

/**
 * Subscribe to realtime YouTube analysis updates
 */
export function subscribeToYouTubeAnalyses(
  callback: (payload: { new: YouTubeAnalysis; old: YouTubeAnalysis | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }

  return supabase
    .channel('youtube_analyses_channel')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'youtube_analyses'
      },
      (payload: { new: YouTubeAnalysis; old: YouTubeAnalysis | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] YouTube analyses subscription status: ${status}`);
    });
}

export default supabase;
