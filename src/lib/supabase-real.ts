import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://avpizuhhirbhjudplihy.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

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
  
  return { data: null, error: lastError };
}

// Types matching Supabase schema
export type AgentStatus = 'idle' | 'active' | 'paused' | 'error' | 'offline' | 'deprecated'
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout'

export interface Agent {
  id: string
  name: string
  slug: string
  description: string | null
  status: AgentStatus
  version: string | null
  capabilities: string[] | null
  tags: string[] | null
  config: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  last_heartbeat: string | null
  heartbeat_interval_seconds: number | null
  max_concurrent_runs: number | null
  daily_run_limit: number | null
  created_at: string
  updated_at: string | null
}

export interface AgentRun {
  id: string
  agent_id: string
  status: RunStatus
  trigger_type: string
  input_summary: string | null
  output_summary: string | null
  start_time: string | null
  end_time: string | null
  duration_ms: number | null
  tokens_total: number | null
  cost_usd: number | null
  created_at: string
  agent?: Agent
}

export interface AgentEvent {
  id: string
  run_id: string
  agent_id: string
  timestamp: string
  type: string
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  message: string
  data: Record<string, unknown> | null
  created_at: string
}

// ============================================
// AGENTS API
// ============================================

/**
 * Get all agents from Supabase
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[Supabase] Failed to fetch agents:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getAgents error:', error)
    return []
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[Supabase] Failed to fetch agent:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] getAgentById error:', error)
    return null
  }
}

/**
 * Get agent by slug
 */
export async function getAgentBySlug(slug: string): Promise<Agent | null> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('[Supabase] Failed to fetch agent by slug:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] getAgentBySlug error:', error)
    return null
  }
}

/**
 * Create a new agent
 */
export async function createAgent(agent: Partial<Agent>): Promise<Agent | null> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Failed to create agent:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] createAgent error:', error)
    return null
  }
}

/**
 * Update an agent
 */
export async function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
  try {
    const { data, error } = await supabase
      .from('agents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Failed to update agent:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] updateAgent error:', error)
    return null
  }
}

// ============================================
// AGENT RUNS API
// ============================================

/**
 * Get agent runs from Supabase
 */
export async function getAgentRuns(limit: number = 50, agentId?: string): Promise<AgentRun[]> {
  try {
    let query = supabase
      .from('agent_runs')
      .select('*, agent:agents(*)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (agentId) {
      query = query.eq('agent_id', agentId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Supabase] Failed to fetch agent runs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getAgentRuns error:', error)
    return []
  }
}

/**
 * Get active agent runs (pending or running)
 */
export async function getActiveAgentRuns(): Promise<AgentRun[]> {
  try {
    const { data, error } = await supabase
      .from('agent_runs')
      .select('*, agent:agents(*)')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Supabase] Failed to fetch active runs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getActiveAgentRuns error:', error)
    return []
  }
}

/**
 * Get runs in the last 24 hours for an agent
 */
export async function getAgentRuns24h(agentId: string): Promise<AgentRun[]> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('agent_id', agentId)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Supabase] Failed to fetch 24h runs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getAgentRuns24h error:', error)
    return []
  }
}

/**
 * Create a new agent run
 */
export async function createAgentRun(
  agentId: string,
  triggerType: string = 'manual',
  inputSummary?: string,
  metadata?: Record<string, unknown>
): Promise<AgentRun | null> {
  try {
    // Build insert data with only columns that exist in the database
    const insertData: Record<string, unknown> = {
      agent_id: agentId,
      status: 'pending',
      input_summary: typeof inputSummary === 'string' ? inputSummary : JSON.stringify(inputSummary),
    }

    // Add any additional metadata fields that might exist
    if (metadata && typeof metadata === 'object') {
      Object.assign(insertData, metadata)
    }

    const { data, error } = await supabase
      .from('agent_runs')
      .insert([insertData])
      .select('*, agent:agents(*)')
      .single()

    if (error) {
      console.error('[Supabase] Failed to create agent run:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] createAgentRun error:', error)
    return null
  }
}

/**
 * Update agent run status
 */
export async function updateAgentRun(
  runId: string,
  updates: Partial<AgentRun>
): Promise<AgentRun | null> {
  try {
    const { data, error } = await supabase
      .from('agent_runs')
      .update(updates)
      .eq('id', runId)
      .select('*, agent:agents(*)')
      .single()

    if (error) {
      console.error('[Supabase] Failed to update agent run:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] updateAgentRun error:', error)
    return null
  }
}

// ============================================
// AGENT EVENTS API
// ============================================

/**
 * Get agent events from Supabase
 */
export async function getAgentEvents(limit: number = 50, runId?: string): Promise<AgentEvent[]> {
  try {
    let query = supabase
      .from('agent_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (runId) {
      query = query.eq('run_id', runId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Supabase] Failed to fetch agent events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getAgentEvents error:', error)
    return []
  }
}

/**
 * Create a new agent event
 */
export async function createAgentEvent(
  runId: string,
  agentId: string,
  type: string,
  level: AgentEvent['level'],
  message: string,
  data?: Record<string, unknown>
): Promise<AgentEvent | null> {
  try {
    const { data: result, error } = await supabase
      .from('agent_events')
      .insert([{
        run_id: runId,
        agent_id: agentId,
        timestamp: new Date().toISOString(),
        type,
        level,
        message,
        data: data || {},
      }])
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Failed to create agent event:', error)
      return null
    }

    return result
  } catch (error) {
    console.error('[Supabase] createAgentEvent error:', error)
    return null
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to real-time agent runs updates
 */
export function subscribeToAgentRuns(
  callback: (payload: { new: AgentRun | null; old: AgentRun | null; event: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) {
  const channel = supabase
    .channel('agent_runs_realtime')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'agent_runs',
      },
      (payload: { new: AgentRun | null; old: AgentRun | null; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => {
        callback({
          new: payload.new,
          old: payload.old,
          event: payload.eventType,
        })
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Agent runs subscription: ${status}`)
    })

  return {
    unsubscribe: () => {
      channel.unsubscribe()
    },
  }
}

/**
 * Subscribe to real-time agent updates
 */
export function subscribeToAgents(
  callback: (payload: { new: Agent | null; old: Agent | null; event: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) {
  const channel = supabase
    .channel('agents_realtime')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'agents',
      },
      (payload: { new: Agent | null; old: Agent | null; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => {
        callback({
          new: payload.new,
          old: payload.old,
          event: payload.eventType,
        })
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Agents subscription: ${status}`)
    })

  return {
    unsubscribe: () => {
      channel.unsubscribe()
    },
  }
}

/**
 * Subscribe to real-time agent events
 */
export function subscribeToAgentEvents(
  callback: (payload: { new: AgentEvent | null; old: AgentEvent | null; event: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) {
  const channel = supabase
    .channel('agent_events_realtime')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'agent_events',
      },
      (payload: { new: AgentEvent | null; old: AgentEvent | null; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => {
        callback({
          new: payload.new,
          old: payload.old,
          event: payload.eventType,
        })
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Agent events subscription: ${status}`)
    })

  return {
    unsubscribe: () => {
      channel.unsubscribe()
    },
  }
}

// ============================================
// STATS HELPERS
// ============================================

export interface AgentStats {
  runs24h: number
  successRate: number
  avgLatency: number
  totalTokens: number
  errorRate: number
}

/**
 * Calculate stats for an agent from its runs
 */
export async function getAgentStats(agentId: string): Promise<AgentStats> {
  const runs = await getAgentRuns24h(agentId)
  
  if (runs.length === 0) {
    return {
      runs24h: 0,
      successRate: 100,
      avgLatency: 0,
      totalTokens: 0,
      errorRate: 0,
    }
  }

  const completed = runs.filter(r => r.status === 'completed').length
  const failed = runs.filter(r => r.status === 'failed').length
  const total = runs.length

  const avgLatency = runs
    .filter(r => r.duration_ms)
    .reduce((acc, r) => acc + (r.duration_ms || 0), 0) / runs.length

  const totalTokens = runs.reduce((acc, r) => acc + (r.tokens_total || 0), 0)

  return {
    runs24h: total,
    successRate: total > 0 ? Math.round((completed / total) * 100) : 100,
    avgLatency: Math.round(avgLatency),
    totalTokens,
    errorRate: total > 0 ? failed / total : 0,
  }
}

export default supabase