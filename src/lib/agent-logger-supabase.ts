/**
 * MANDATORY: All Agent activity MUST be logged to Supabase
 * 
 * This module ensures every agent task is tracked in the database
 * NO EXCEPTIONS - This is required for Mission Control visibility
 */

import { 
  createAgentRun, 
  updateAgentRun, 
  createAgentEvent,
  getAgentBySlug,
  getAgents
} from './supabase-client'

// Agent name to slug mapping
const AGENT_SLUGS: Record<string, string> = {
  'traderbot': 'traderbot',
  'productbuilder': 'productbuilder',
  'distribution': 'distribution',
  'contentagent': 'content',
  'distributionagent': 'distribution',
  'memorymanager': 'memorymanager',
  'researchagent': 'research',
  'iosappbuilder': 'iosappbuilder',
  'securityagent': 'securityagent',
  // Common aliases
  'trader': 'traderbot',
  'builder': 'productbuilder',
  'content': 'distribution',
  'memory': 'memorymanager',
  'research': 'memorymanager',
  'ios': 'iosappbuilder',
  'security': 'securityagent',
}

/**
 * Get agent ID from name/slug
 */
async function getAgentId(agentName: string): Promise<string | null> {
  const slug = AGENT_SLUGS[agentName.toLowerCase()] || agentName.toLowerCase()
  const agent = await getAgentBySlug(slug)
  return agent?.id || null
}

/**
 * MANDATORY: Log agent run to Supabase
 * 
 * Call this BEFORE starting any agent work
 */
export async function logAgentStarted(
  agentName: string, 
  task: string, 
  triggerType: string = 'manual'
): Promise<string | null> {
  try {
    const agentId = await getAgentId(agentName)
    
    if (!agentId) {
      console.warn(`[Activity Logger] Agent ${agentName} not found in database`)
      return null
    }

    // Create the run
    const run = await createAgentRun(
      agentId,
      triggerType,
      { task },
      { source: 'activity-logger', agent_name: agentName }
    )
    
    if (run) {
      console.log(`[Activity Logger] ✅ Started: ${agentName} - ${task} (${run.id})`)
      
      // Create start event for visibility
      await createAgentEvent(
        run.id,
        'start',
        'info',
        `Task started: ${task}`,
        { agent: agentName, task, trigger: triggerType }
      )
      
      return run.id
    }
    
    return null
  } catch (error) {
    console.error('[Activity Logger] ❌ Failed to log agent start:', error)
    return null
  }
}

/**
 * MANDATORY: Update agent run as completed
 *
 * Call this AFTER agent work finishes
 */
export async function logAgentCompleted(
  runId: string,
  output: string,
  durationMs?: number,
  tokensTotal?: number,
  costUsd?: number
) {
  try {
    const result = await updateAgentRun(runId, {
      status: 'completed',
      output_summary: output,
      end_time: new Date().toISOString(),
      duration_ms: durationMs,
      tokens_total: tokensTotal,
      cost_usd: costUsd,
    })

    if (result) {
      console.log(`[Activity Logger] ✅ Completed: ${runId}`)

      // Create completion event
      await createAgentEvent(
        runId,
        'end',
        'info',
        `Task completed: ${output}`,
        { durationMs, tokensTotal, costUsd }
      )
    }

    return result
  } catch (error) {
    console.error('[Activity Logger] ❌ Failed to log agent completion:', error)
    return null
  }
}

/**
 * MANDATORY: Log agent failure
 *
 * Call this if agent work fails
 */
export async function logAgentFailed(
  runId: string,
  errorMsg: string,
  errorDetails?: Record<string, unknown>
) {
  try {
    const result = await updateAgentRun(runId, {
      status: 'failed',
      output_summary: errorMsg,
      end_time: new Date().toISOString(),
    })

    if (result) {
      console.log(`[Activity Logger] ❌ Failed: ${runId} - ${errorMsg}`)

      // Create error event
      await createAgentEvent(
        runId,
        'error',
        'error',
        `Task failed: ${errorMsg}`,
        errorDetails || {}
      )
    }

    return result
  } catch (err) {
    console.error('[Activity Logger] ❌ Failed to log agent failure:', err)
    return null
  }
}

/**
 * MANDATORY: Log progress update
 * 
 * Call this for long-running tasks
 */
export async function logAgentProgress(
  runId: string,
  message: string,
  progress?: number,
  data?: Record<string, unknown>
) {
  try {
    await createAgentEvent(
      runId,
      'checkpoint',
      'info',
      message,
      { progress, ...data }
    )
    
    console.log(`[Activity Logger] 📊 Progress: ${message}`)
  } catch (error) {
    console.error('[Activity Logger] ❌ Failed to log progress:', error)
  }
}

/**
 * MANDATORY: Use this whenever spawning any agent
 * 
 * Usage:
 *   const runId = await spawnAndLog('TraderBot', 'Analyze NVDA')
 *   try {
 *     // Do work
 *     await logAgentCompleted(runId, 'Found breakout pattern')
 *   } catch (e) {
 *     await logAgentFailed(runId, e.message)
 *   }
 */
export async function spawnAndLog(
  agentName: string, 
  task: string,
  triggerType: string = 'manual'
): Promise<string | null> {
  console.log(`[Activity Logger] 🚀 Spawning ${agentName}: ${task}`)
  return logAgentStarted(agentName, task, triggerType)
}

/**
 * Quick log function - logs a completed activity in one call
 * Use for simple, synchronous tasks
 */
export async function logActivity(
  agentName: string,
  task: string,
  status: 'completed' | 'failed' = 'completed',
  output?: string,
  details?: Record<string, unknown>
) {
  const runId = await logAgentStarted(agentName, task, 'auto')
  if (!runId) return null
  
  if (status === 'completed') {
    return logAgentCompleted(runId, output || task, undefined, undefined, undefined)
  } else {
    return logAgentFailed(runId, output || 'Task failed', details)
  }
}

export default {
  logAgentStarted,
  logAgentCompleted,
  logAgentFailed,
  logAgentProgress,
  spawnAndLog,
  logActivity,
}
