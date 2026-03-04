/**
 * Agent Activity Logger for Mission Control
 * 
 * ALL AGENTS MUST USE THIS TO LOG ACTIVITY
 * This ensures real-time visibility in the Mission Control dashboard
 * 
 * Usage:
 *   import { log } from '@/lib/agent-logger'
 *   await log.started('TraderBot', 'honeyalgo', 'Backtest initiated', { strategy: 'momentum' })
 */

import { createClient } from '@supabase/supabase-js'
import { fallbackLog, readFallbackLogs } from './fallback-logger'

// Supabase configuration - use service role key for server-side logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    process.env.SUPABASE_SERVICE_ROLE ||
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    ''

// Create Supabase client only if credentials are available
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export type LogStatus = 'created' | 'started' | 'in-progress' | 'paused' | 'completed' | 'failed'
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical'

export interface LogActivityParams {
  /** Agent name - must match AGENTS.md (TraderBot, ProductBuilder, iOSAppBuilder, Distribution, MemoryManager) */
  agent: string
  /** Project slug (e.g., 'honeyalgo', 'mission-control', 'second-brain') */
  project: string
  /** Current status of the task */
  status: LogStatus
  /** Human-readable description of what happened */
  description: string
  /** Optional: Additional structured data */
  details?: Record<string, unknown>
  /** Optional: Links to repo, deployment, docs, etc. */
  links?: {
    repo?: string
    deployment?: string
    doc?: string
    supabase?: string
    other?: string
  }
  /** Optional: estimated impact for prioritization */
  estimated_impact?: ImpactLevel
  /** Optional: duration in seconds if known */
  duration?: number
  /** Optional: error message if status is 'failed' */
  error?: string
}

export interface LogEntry {
  id: string
  timestamp: string
  agent: string
  project: string
  status: LogStatus
  description: string
  details: Record<string, unknown>
  links: Record<string, string>
  estimated_impact: ImpactLevel
  duration?: number
  error?: string
  created_at: string
}

/**
 * Main logging function - ALL agents use this
 */
export async function logActivity(params: LogActivityParams): Promise<LogEntry | null> {
  // Validate required fields
  if (!params.agent || !params.project || !params.status || !params.description) {
    console.error('[Agent Logger] Missing required fields:', params)
    return null
  }

  const payload = {
    agent: params.agent,
    project: params.project,
    status: params.status,
    description: params.description,
    details: params.details || {},
    links: params.links || {},
    estimated_impact: params.estimated_impact || 'medium',
    duration: params.duration,
    error: params.error,
    timestamp: new Date().toISOString(),
  }

  try {
    // Try Supabase first
    if (supabase) {
      const { data, error } = await supabase
        .from('log_entries')
        .insert([payload])
        .select()
        .single()

      if (!error && data) {
        console.log(`[Mission Control] ${params.agent}: ${params.description}`)
        return data as LogEntry
      }

      // Supabase failed, use fallback
      console.warn('[Agent Logger] Supabase insert failed, using fallback:', error?.message)
    }

    // Fallback to local file logging
    const fallbackEntry = await fallbackLog(
      params.agent,
      params.project,
      params.status,
      params.description,
      params.details,
      params.links,
      params.estimated_impact,
      params.error
    )
    
    return {
      id: fallbackEntry.id,
      created_at: fallbackEntry.timestamp,
      ...payload,
    } as LogEntry

  } catch (err) {
    console.error('[Agent Logger] Error:', err)
    
    // Last resort: console log and file fallback
    console.log('[AGENT ACTIVITY - EMERGENCY FALLBACK]', payload)
    
    await fallbackLog(
      params.agent,
      params.project,
      params.status,
      params.description,
      params.details,
      params.links,
      params.estimated_impact,
      params.error
    )
    
    return {
      id: `emergency-${Date.now()}`,
      created_at: payload.timestamp,
      ...payload,
    } as LogEntry
  }
}

/**
 * Update an existing log entry
 */
export async function updateLogEntry(
  logId: string, 
  updates: Partial<LogActivityParams>
): Promise<LogEntry | null> {
  try {
    if (!supabase) {
      console.warn('[Agent Logger] Supabase not configured, cannot update')
      return null
    }

    const { data, error } = await supabase
      .from('log_entries')
      .update({
        ...updates,
        timestamp: new Date().toISOString(),
      })
      .eq('id', logId)
      .select()
      .single()

    if (error) {
      console.error('[Agent Logger] Update failed:', error)
      return null
    }

    return data as LogEntry
  } catch (err) {
    console.error('[Agent Logger] Update error:', err)
    return null
  }
}

/**
 * Get recent activity for an agent
 */
export async function getAgentActivity(
  agent: string, 
  limit: number = 20
): Promise<LogEntry[]> {
  try {
    if (!supabase) {
      return []
    }

    const { data, error } = await supabase
      .from('log_entries')
      .select('*')
      .eq('agent', agent)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Agent Logger] Fetch failed:', error)
      return []
    }

    return data as LogEntry[]
  } catch (err) {
    console.error('[Agent Logger] Fetch error:', err)
    return []
  }
}

/**
 * Get all recent activity (from Supabase + fallback)
 */
export async function getRecentActivity(limit: number = 50): Promise<LogEntry[]> {
  const logs: LogEntry[] = []

  // Try Supabase first
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('log_entries')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (!error && data) {
        logs.push(...data as LogEntry[])
      } else {
        console.warn('[Agent Logger] Supabase fetch failed:', error?.message)
      }
    }
  } catch (err) {
    console.warn('[Agent Logger] Supabase fetch error:', err)
  }

  // Get fallback logs
  try {
    const fallbackLogs = await readFallbackLogs(limit)
    const convertedFallbackLogs: LogEntry[] = fallbackLogs.map(fb => ({
      id: fb.id,
      timestamp: fb.timestamp,
      agent: fb.agent,
      project: fb.project,
      status: fb.status as LogStatus,
      description: fb.description,
      details: fb.details || {},
      links: fb.links || {},
      estimated_impact: fb.estimated_impact as ImpactLevel,
      duration: undefined,
      error: fb.error,
      created_at: fb.timestamp,
    }))
    logs.push(...convertedFallbackLogs)
  } catch (err) {
    console.warn('[Agent Logger] Fallback fetch error:', err)
  }

  // Sort by timestamp and limit
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

/**
 * Subscribe to real-time updates
 */
export function subscribeToActivity(
  callback: (payload: { new: LogEntry; old: LogEntry | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Agent Logger] Supabase not configured, realtime disabled')
    return { unsubscribe: () => {} }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePayload = (payload: { new: LogEntry; old: LogEntry | null; event: string }) => {
    callback(payload)
  }

  return supabase
    .channel('log_entries_channel')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'log_entries' }, handlePayload as any)
    .subscribe()
}

/**
 * Quick log helpers - USE THESE!
 * 
 * Example:
 *   log.started('TraderBot', 'honeyalgo', 'Backtest running')
 *   log.completed('ProductBuilder', 'mission-control', 'Dashboard deployed', { deployment: 'https://...' })
 *   log.failed('Distribution', 'content', 'Tweet failed', 'Rate limited')
 */
export const log = {
  /** Log when a task is created/planned */
  created: (agent: string, project: string, description: string, details?: Record<string, unknown>, links?: Record<string, string>) =>
    logActivity({ agent, project, status: 'created', description, details, links, estimated_impact: 'medium' }),

  /** Log when work starts */
  started: (agent: string, project: string, description: string, details?: Record<string, unknown>, links?: Record<string, string>) =>
    logActivity({ agent, project, status: 'started', description, details, links, estimated_impact: 'medium' }),

  /** Log in-progress updates */
  progress: (agent: string, project: string, description: string, details?: Record<string, unknown>, links?: Record<string, string>) =>
    logActivity({ agent, project, status: 'in-progress', description, details, links, estimated_impact: 'medium' }),

  /** Log when work is paused */
  paused: (agent: string, project: string, description: string, details?: Record<string, unknown>) =>
    logActivity({ agent, project, status: 'paused', description, details, estimated_impact: 'low' }),

  /** Log successful completion */
  completed: (agent: string, project: string, description: string, links?: Record<string, string>, details?: Record<string, unknown>) =>
    logActivity({ agent, project, status: 'completed', description, links, details, estimated_impact: 'high' }),

  /** Log failures */
  failed: (agent: string, project: string, description: string, error: string, details?: Record<string, unknown>) =>
    logActivity({ agent, project, status: 'failed', description, error, details, estimated_impact: 'critical' }),
}

export default logActivity
