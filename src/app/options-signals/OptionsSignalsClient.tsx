'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Target,
  Clock,
  Zap,
  BarChart3,
  CheckCircle,
  Loader2,
  Radio
} from 'lucide-react'
import SignalCard from '@/components/options-signals/SignalCard'
import SignalList from '@/components/options-signals/SignalList'
import SignalFilters from '@/components/options-signals/SignalFilters'
import type { OptionsSignal, SignalFilters as SignalFiltersType, SignalStats } from '@/types/options-signals'

interface OptionsSignalsClientProps {
  initialSignals: OptionsSignal[]
  initialSymbols: string[]
  initialStats: SignalStats | null
}

export default function OptionsSignalsClient({ 
  initialSignals, 
  initialSymbols,
  initialStats 
}: OptionsSignalsClientProps) {
  const [signals, setSignals] = useState<OptionsSignal[]>(initialSignals)
  const [symbols, setSymbols] = useState<string[]>(initialSymbols)
  const [stats, setStats] = useState<SignalStats | null>(initialStats)
  const [filters, setFilters] = useState<SignalFiltersType>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced')
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  
  // Fetch signals from API
  const fetchSignals = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    setSyncStatus('syncing')
    
    try {
      const params = new URLSearchParams()
      params.set('limit', '100')
      
      if (filters.symbol) params.set('symbol', filters.symbol)
      if (filters.direction && filters.direction !== 'ALL') params.set('direction', filters.direction)
      if (filters.signalType && filters.signalType !== 'ALL') params.set('type', filters.signalType)
      if (filters.status && filters.status !== 'ALL') params.set('status', filters.status)
      if (filters.minConfidence) params.set('minConfidence', filters.minConfidence.toString())
      
      const res = await fetch(`/api/options-signals?${params.toString()}`, {
        cache: 'no-store',
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setSignals(data.signals || [])
      setLastUpdated(new Date())
      setSyncStatus('synced')
      setError(null)
    } catch (err) {
      console.error('Failed to fetch signals:', err)
      setSyncStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to fetch signals')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [filters])
  
  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/options-signals?stats=true', {
        cache: 'no-store',
      })
      
      if (!res.ok) return
      
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])
  
  // Initial fetch and polling setup
  useEffect(() => {
    // Only fetch client-side if we don't have initial data
    if (initialSignals.length === 0) {
      fetchSignals(true)
    }
    
    if (initialSymbols.length === 0) {
      fetch('/api/options-signals?symbols=true')
        .then(res => res.json())
        .then(data => setSymbols(data.symbols || []))
        .catch(console.error)
    }
    
    // Set up polling every 30 seconds
    pollingRef.current = setInterval(() => {
      fetchSignals(false)
      fetchStats()
    }, 30000)
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [fetchSignals, fetchStats, initialSignals.length, initialSymbols.length])
  
  // Refetch when filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSignals(true)
    }, 300)
    
    return () => clearTimeout(timeout)
  }, [filters, fetchSignals])
  
  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }
  
  // Count active by direction
  const activeBullish = signals.filter(s => s.status === 'ACTIVE' && s.direction === 'BULLISH').length
  const activeBearish = signals.filter(s => s.status === 'ACTIVE' && s.direction === 'BEARISH').length
  const activeNeutral = signals.filter(s => s.status === 'ACTIVE' && s.direction === 'NEUTRAL').length
  
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-xl font-bold text-white hover:text-indigo-400 transition-colors"
              >
                Mission Control
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">Options Signals</span>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/activity" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Activity
              </Link>
              <Link href="/agents" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Agents
              </Link>
              <Link href="/terminal" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Terminal
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Options Signals</h1>
                <span className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  ${syncStatus === 'synced' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : syncStatus === 'syncing'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}
                `}>
                  {syncStatus === 'synced' && <Radio size={12} className="animate-pulse" />}
                  {syncStatus === 'syncing' && <Loader2 size={12} className="animate-spin" />}
                  {syncStatus === 'error' && <TrendingDown size={12} />}
                  {syncStatus === 'synced' ? 'Live' : syncStatus === 'syncing' ? 'Syncing...' : 'Error'}
                </span>
              </div>
              <p className="text-zinc-400">
                Real-time options trading signals from TraderBot. 
                <span className="ml-2 text-zinc-500">
                  Last updated: {formatTimeAgo(lastUpdated)}
                </span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchSignals(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 
                         border border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800/80
                         transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {/* Total Signals */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Activity size={16} className="text-indigo-400" />
              </div>
              <span className="text-sm text-zinc-400">Total Signals</span>
            </div>
            <p className="text-2xl font-bold">{stats?.total_signals || signals.length}</p>
          </div>
          
          {/* Active Bullish */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <span className="text-sm text-zinc-400">Bullish Active</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{activeBullish}</p>
          </div>
          
          {/* Active Bearish */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <TrendingDown size={16} className="text-rose-400" />
              </div>
              <span className="text-sm text-zinc-400">Bearish Active</span>
            </div>
            <p className="text-2xl font-bold text-rose-400">{activeBearish}</p>
          </div>
          
          {/* Avg Confidence */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap size={16} className="text-amber-400" />
              </div>
              <span className="text-sm text-zinc-400">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {Math.round((stats?.avg_confidence || signals.reduce((acc, s) => acc + s.confidence, 0) / (signals.length || 1)) * 100)}%
            </p>
          </div>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <SignalFilters 
            filters={filters} 
            onChange={setFilters}
            symbols={symbols}
          />
        </motion.div>
        
        {/* Signal List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <SignalList 
            signals={signals}
            filters={filters}
            isLoading={isLoading}
            error={error}
          />
        </motion.div>
      </main>
    </div>
  )
}
