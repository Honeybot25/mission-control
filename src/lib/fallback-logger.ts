/**
 * Fallback Logger for Mission Control (Server-side only)
 * 
 * When Supabase is unavailable, this logs to local files.
 * For client-side, logs go to console only.
 * 
 * This ensures NO activity is lost even if Supabase fails.
 */

// Only import fs on server side
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs: typeof import('fs/promises') | null = typeof window === 'undefined' ? require('fs/promises') : null
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path: typeof import('path') | null = typeof window === 'undefined' ? require('path') : null

const LOG_FILE = '/Users/Honeybot/.openclaw/workspace/logs/agent-activity.log'

export interface FallbackLogEntry {
  id: string
  timestamp: string
  agent: string
  project: string
  status: string
  description: string
  details?: Record<string, unknown>
  links?: Record<string, string>
  estimated_impact: string
  error?: string
  source: 'fallback'
}

/**
 * Check if we're on server
 */
function isServer(): boolean {
  return typeof window === 'undefined' && fs !== null
}

/**
 * Ensure log directory exists
 */
async function ensureLogDir(): Promise<void> {
  if (!isServer() || !fs || !path) return
  
  try {
    const LOG_DIR = path.dirname(LOG_FILE)
    await fs.mkdir(LOG_DIR, { recursive: true })
  } catch {
    // Directory might already exist
  }
}

/**
 * Write log to local file (server only)
 */
async function writeToFile(entry: FallbackLogEntry): Promise<void> {
  if (!isServer() || !fs) return

  try {
    await ensureLogDir()
    const logLine = JSON.stringify(entry) + '\n'
    await fs.appendFile(LOG_FILE, logLine, 'utf8')
  } catch (err) {
    console.error('[Fallback Logger] Failed to write to file:', err)
  }
}

/**
 * Read all fallback logs (server only)
 */
export async function readFallbackLogs(limit: number = 100): Promise<FallbackLogEntry[]> {
  if (!isServer() || !fs) return []

  try {
    await ensureLogDir()
    const content = await fs.readFile(LOG_FILE, 'utf8')
    const lines = content.trim().split('\n').filter(Boolean)
    const logs = lines.map(line => JSON.parse(line) as FallbackLogEntry)
    return logs.slice(-limit).reverse()
  } catch {
    // File doesn't exist or is empty
    return []
  }
}

/**
 * Clear fallback logs (server only)
 */
export async function clearFallbackLogs(): Promise<void> {
  if (!isServer() || !fs) return

  try {
    await fs.writeFile(LOG_FILE, '', 'utf8')
  } catch {
    // Ignore errors
  }
}

/**
 * Main fallback log function
 */
export async function fallbackLog(
  agent: string,
  project: string,
  status: string,
  description: string,
  details?: Record<string, unknown>,
  links?: Record<string, string>,
  estimated_impact: string = 'medium',
  error?: string
): Promise<FallbackLogEntry> {
  const entry: FallbackLogEntry = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    agent,
    project,
    status,
    description,
    details,
    links,
    estimated_impact,
    error,
    source: 'fallback',
  }

  // Always log to console
  console.log(`[FALLBACK LOG] ${agent} | ${status} | ${description}`)

  // Write to file (server only)
  await writeToFile(entry)

  return entry
}

/**
 * Quick fallback log helpers
 */
export const fallback = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  created: (agent: string, project: string, description: string, details?: Record<string, unknown>, links?: Record<string, string>) =>
    fallbackLog(agent, project, 'created', description, details, links, 'medium'),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  started: (agent: string, project: string, description: string, details?: Record<string, unknown>, links?: Record<string, string>) =>
    fallbackLog(agent, project, 'started', description, details, links, 'medium'),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  progress: (agent: string, project: string, description: string, details?: Record<string, unknown>, links?: Record<string, string>) =>
    fallbackLog(agent, project, 'in-progress', description, details, links, 'medium'),

  paused: (agent: string, project: string, description: string, details?: Record<string, unknown>) =>
    fallbackLog(agent, project, 'paused', description, details, undefined, 'low'),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  completed: (agent: string, project: string, description: string, links?: Record<string, string>, details?: Record<string, unknown>) =>
    fallbackLog(agent, project, 'completed', description, details, links, 'high'),

  failed: (agent: string, project: string, description: string, error: string, details?: Record<string, unknown>) =>
    fallbackLog(agent, project, 'failed', description, details, undefined, 'critical', error),
}

export default fallbackLog
