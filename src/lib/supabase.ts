import { createClient } from '@supabase/supabase-js';

// Use dummy values for static build - these get replaced at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types
type AgentStatus = 'created' | 'started' | 'in-progress' | 'paused' | 'completed' | 'failed';
type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LogEntry {
  id?: string;
  timestamp: string;
  agent: string;
  project: string;
  status: AgentStatus;
  description: string;
  details?: Record<string, unknown>;
  links?: Record<string, string>;
  estimated_impact: ImpactLevel;
  duration?: number;
  error?: string;
}

// Hook agents use to log activity
export async function logActivity(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
  try {
    const { data, error } = await supabase
      .from('log_entries')
      .insert([
        {
          ...entry,
          timestamp: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Mission Control] Failed to log activity:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Mission Control] Logging error:', error);
    return { success: false, error };
  }
}

// Get recent logs
export async function getRecentLogs(limit: number = 50, agent?: string) {
  try {
    let query = supabase
      .from('log_entries')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (agent) {
      query = query.eq('agent', agent);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Mission Control] Fetch error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Mission Control] Get logs error:', error);
    return [];
  }
}

// Subscribe to realtime updates
export function subscribeToActivity(callback: (payload: LogEntry) => void) {
  return supabase
    .channel('log_entries_channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'log_entries' },
      (payload: { new: LogEntry }) => {
        callback(payload.new);
      }
    )
    .subscribe();
}
