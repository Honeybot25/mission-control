/**
 * Options Signals Database Functions
 * 
 * Supabase queries for options trading signals
 */

import { supabase } from './supabase-real'
import type { OptionsSignal, SignalFilters, SignalStats } from '@/types/options-signals'

// ============================================
// OPTIONS SIGNALS API
// ============================================

/**
 * Get all options signals with optional filters
 */
export async function getOptionsSignals(filters?: SignalFilters, limit: number = 100): Promise<OptionsSignal[]> {
  try {
    let query = supabase
      .from('options_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (filters?.symbol) {
      query = query.ilike('symbol', `%${filters.symbol}%`)
    }

    if (filters?.direction && filters.direction !== 'ALL') {
      query = query.eq('direction', filters.direction)
    }

    if (filters?.signalType && filters.signalType !== 'ALL') {
      query = query.eq('signal_type', filters.signalType)
    }

    if (filters?.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status)
    }

    if (filters?.minConfidence !== undefined) {
      query = query.gte('confidence', filters.minConfidence)
    }

    if (filters?.maxConfidence !== undefined) {
      query = query.lte('confidence', filters.maxConfidence)
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Supabase] Failed to fetch options signals:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getOptionsSignals error:', error)
    return []
  }
}

/**
 * Get active options signals
 */
export async function getActiveOptionsSignals(limit: number = 50): Promise<OptionsSignal[]> {
  try {
    const { data, error } = await supabase
      .from('options_signals')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Supabase] Failed to fetch active signals:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getActiveOptionsSignals error:', error)
    return []
  }
}

/**
 * Get options signal by ID
 */
export async function getOptionsSignalById(id: string): Promise<OptionsSignal | null> {
  try {
    const { data, error } = await supabase
      .from('options_signals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[Supabase] Failed to fetch signal by ID:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] getOptionsSignalById error:', error)
    return null
  }
}

/**
 * Get recent options signals (last 24 hours)
 */
export async function getRecentOptionsSignals(hours: number = 24): Promise<OptionsSignal[]> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('options_signals')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Supabase] Failed to fetch recent signals:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Supabase] getRecentOptionsSignals error:', error)
    return []
  }
}

/**
 * Create a new options signal
 */
export async function createOptionsSignal(
  signal: Omit<OptionsSignal, 'id' | 'created_at' | 'updated_at'>
): Promise<OptionsSignal | null> {
  try {
    const { data, error } = await supabase
      .from('options_signals')
      .insert([signal])
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Failed to create options signal:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] createOptionsSignal error:', error)
    return null
  }
}

/**
 * Update an options signal
 */
export async function updateOptionsSignal(
  id: string,
  updates: Partial<OptionsSignal>
): Promise<OptionsSignal | null> {
  try {
    const { data, error } = await supabase
      .from('options_signals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Supabase] Failed to update options signal:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Supabase] updateOptionsSignal error:', error)
    return null
  }
}

/**
 * Close an options signal with P&L
 */
export async function closeOptionsSignal(
  id: string,
  pnl: number,
  pnlPercent: number
): Promise<OptionsSignal | null> {
  return updateOptionsSignal(id, {
    status: 'CLOSED',
    closed_at: new Date().toISOString(),
    pnl,
    pnl_percent: pnlPercent,
  })
}

/**
 * Get signal statistics
 */
export async function getOptionsSignalStats(): Promise<SignalStats> {
  try {
    // Get counts by direction
    const { data: directionData, error: directionError } = await supabase
      .from('options_signals')
      .select('direction, count')
      .not('direction', 'is', null)

    if (directionError) {
      console.error('[Supabase] Failed to fetch direction stats:', directionError)
    }

    // Get counts by type
    const { data: typeData, error: typeError } = await supabase
      .from('options_signals')
      .select('signal_type, count')
      .not('signal_type', 'is', null)

    if (typeError) {
      console.error('[Supabase] Failed to fetch type stats:', typeError)
    }

    // Get total counts and averages
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_options_signal_stats')

    if (statsError) {
      console.error('[Supabase] Failed to fetch signal stats:', statsError)
    }

    // Calculate stats from data
    const { data: allSignals } = await supabase
      .from('options_signals')
      .select('direction, signal_type, symbol, confidence, status')

    const stats: SignalStats = {
      total_signals: allSignals?.length || 0,
      active_signals: allSignals?.filter(s => s.status === 'ACTIVE').length || 0,
      bullish_signals: allSignals?.filter(s => s.direction === 'BULLISH').length || 0,
      bearish_signals: allSignals?.filter(s => s.direction === 'BEARISH').length || 0,
      neutral_signals: allSignals?.filter(s => s.direction === 'NEUTRAL').length || 0,
      avg_confidence: allSignals?.length 
        ? allSignals.reduce((acc, s) => acc + (s.confidence || 0), 0) / allSignals.length 
        : 0,
      by_symbol: {},
      by_type: {},
    }

    // Count by symbol
    allSignals?.forEach(signal => {
      stats.by_symbol[signal.symbol] = (stats.by_symbol[signal.symbol] || 0) + 1
      stats.by_type[signal.signal_type] = (stats.by_type[signal.signal_type] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('[Supabase] getOptionsSignalStats error:', error)
    return {
      total_signals: 0,
      active_signals: 0,
      bullish_signals: 0,
      bearish_signals: 0,
      neutral_signals: 0,
      avg_confidence: 0,
      by_symbol: {},
      by_type: {},
    }
  }
}

/**
 * Get unique symbols from signals
 */
export async function getSignalSymbols(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('options_signals')
      .select('symbol')
      .order('symbol')

    if (error) {
      console.error('[Supabase] Failed to fetch symbols:', error)
      return []
    }

    // Get unique symbols
    const symbols = [...new Set(data?.map(d => d.symbol) || [])]
    return symbols
  } catch (error) {
    console.error('[Supabase] getSignalSymbols error:', error)
    return []
  }
}

/**
 * Subscribe to real-time options signal updates
 */
export function subscribeToOptionsSignals(
  callback: (payload: { new: OptionsSignal | null; old: OptionsSignal | null; event: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) {
  const channel = supabase
    .channel('options_signals_realtime')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'options_signals',
      },
      (payload: { new: OptionsSignal | null; old: OptionsSignal | null; eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => {
        callback({
          new: payload.new,
          old: payload.old,
          event: payload.eventType,
        })
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Options signals subscription: ${status}`)
    })

  return {
    unsubscribe: () => {
      channel.unsubscribe()
    },
  }
}
