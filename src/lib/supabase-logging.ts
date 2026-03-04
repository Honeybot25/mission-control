/**
 * Organized Supabase Logging for Mission Control
 * All agents must use this for activity tracking
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://avpizuhhirbhjudplihy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

interface LogEntry {
  agent: string;
  project?: string;
  description: string;
  status?: 'created' | 'started' | 'in-progress' | 'paused' | 'completed' | 'failed';
  estimated_impact?: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, any>;
  links?: Record<string, string>;
  duration?: number;
  error?: string;
}

/**
 * Log an activity to Supabase
 * All agents MUST call this for every significant action
 */
export async function logActivity(entry: LogEntry): Promise<void> {
  const payload = {
    agent: entry.agent,
    project: entry.project || 'mission-control',
    description: entry.description,
    status: entry.status || 'created',
    estimated_impact: entry.estimated_impact || 'medium',
    details: entry.details || {},
    links: entry.links || {},
    duration: entry.duration,
    error: entry.error,
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/log_entries`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
    }
  } catch (err) {
    console.error('Logging error:', err);
  }
}

/**
 * Quick log functions for common statuses
 */
export const log = {
  created: (agent: string, description: string, details?: any) =>
    logActivity({ agent, description, status: 'created', details }),
  
  started: (agent: string, description: string, details?: any) =>
    logActivity({ agent, description, status: 'started', details }),
  
  completed: (agent: string, description: string, details?: any, duration?: number) =>
    logActivity({ agent, description, status: 'completed', details, duration }),
  
  failed: (agent: string, description: string, error: string, details?: any) =>
    logActivity({ agent, description, status: 'failed', error, details }),
  
  highImpact: (agent: string, description: string, status: LogEntry['status'], details?: any) =>
    logActivity({ agent, description, status, estimated_impact: 'high', details }),
};

export default logActivity;
