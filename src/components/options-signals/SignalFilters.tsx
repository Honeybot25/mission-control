'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  X,
  ChevronDown,
  SlidersHorizontal,
  Calendar
} from 'lucide-react'
import type { SignalDirection, SignalType, SignalStatus, SignalFilters as SignalFiltersType } from '@/types/options-signals'

interface SignalFiltersProps {
  filters: SignalFiltersType
  onChange: (filters: SignalFiltersType) => void
  symbols: string[]
  className?: string
}

const directions: { value: SignalDirection | 'ALL'; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'ALL', label: 'All', icon: <SlidersHorizontal size={14} />, color: 'text-zinc-400' },
  { value: 'BULLISH', label: 'Bullish', icon: <TrendingUp size={14} />, color: 'text-emerald-400' },
  { value: 'BEARISH', label: 'Bearish', icon: <TrendingDown size={14} />, color: 'text-rose-400' },
  { value: 'NEUTRAL', label: 'Neutral', icon: <Minus size={14} />, color: 'text-amber-400' },
]

const signalTypes: { value: SignalType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Types' },
  { value: 'CALL', label: 'Call' },
  { value: 'PUT', label: 'Put' },
  { value: 'STRADDLE', label: 'Straddle' },
  { value: 'STRANGLE', label: 'Strangle' },
  { value: 'IRON_CONDOR', label: 'Iron Condor' },
  { value: 'BUTTERFLY', label: 'Butterfly' },
  { value: 'VERTICAL_SPREAD', label: 'Vertical Spread' },
  { value: 'HOLD', label: 'Hold' },
]

const statuses: { value: SignalStatus | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL', label: 'All Status', color: 'text-zinc-400' },
  { value: 'ACTIVE', label: 'Active', color: 'text-emerald-400' },
  { value: 'EXECUTED', label: 'Executed', color: 'text-blue-400' },
  { value: 'CLOSED', label: 'Closed', color: 'text-zinc-400' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'text-rose-400' },
  { value: 'EXPIRED', label: 'Expired', color: 'text-amber-400' },
]

export default function SignalFilters({ filters, onChange, symbols, className = '' }: SignalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<SignalFiltersType>(filters)
  
  // Sync local filters with prop filters
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])
  
  const updateFilter = useCallback(<K extends keyof SignalFiltersType>(
    key: K, 
    value: SignalFiltersType[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onChange(newFilters)
  }, [localFilters, onChange])
  
  const clearFilters = useCallback(() => {
    const emptyFilters: SignalFiltersType = {}
    setLocalFilters(emptyFilters)
    onChange(emptyFilters)
  }, [onChange])
  
  const hasActiveFilters = Object.keys(localFilters).length > 0 && 
    Object.values(localFilters).some(v => v !== undefined && v !== 'ALL')
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search symbol (e.g., AAPL, TSLA)..."
            value={localFilters.symbol || ''}
            onChange={(e) => updateFilter('symbol', e.target.value.toUpperCase() || undefined)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-lg 
                       text-white placeholder-zinc-500 text-sm
                       focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20
                       transition-all"
          />
          {localFilters.symbol && (
            <button
              onClick={() => updateFilter('symbol', undefined)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Quick Direction Filters */}
        <div className="flex items-center gap-1 bg-zinc-900/80 border border-white/10 rounded-lg p-1">
          {directions.slice(0, 4).map((dir) => (
            <button
              key={dir.value}
              onClick={() => updateFilter('direction', dir.value === 'ALL' ? undefined : dir.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${localFilters.direction === dir.value || (dir.value === 'ALL' && !localFilters.direction)
                  ? 'bg-white/10 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <span className={localFilters.direction === dir.value || (dir.value === 'ALL' && !localFilters.direction) ? dir.color : ''}>
                {dir.icon}
              </span>
              {dir.label}
            </button>
          ))}
        </div>
        
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
            ${isExpanded 
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
              : 'bg-zinc-900/80 border border-white/10 text-zinc-300 hover:text-white'}
          `}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
              {Object.values(localFilters).filter(v => v !== undefined && v !== 'ALL').length}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Clear Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
      
      {/* Expanded Filters */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-zinc-900/50 border border-white/10 rounded-xl space-y-4"
        >
          {/* Signal Type */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
              Signal Type
            </label>
            <div className="flex flex-wrap gap-2">
              {signalTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateFilter('signalType', type.value === 'ALL' ? undefined : type.value)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${localFilters.signalType === type.value || (type.value === 'ALL' && !localFilters.signalType)
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Status */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => updateFilter('status', status.value === 'ALL' ? undefined : status.value)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium transition-all
                    ${localFilters.status === status.value || (status.value === 'ALL' && !localFilters.status)
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'bg-zinc-800/50 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}
                  `}
                >
                  <span className={localFilters.status === status.value || (status.value === 'ALL' && !localFilters.status) ? status.color : ''}>
                    ●
                  </span>{' '}
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Confidence Range */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
              Minimum Confidence: {Math.round((localFilters.minConfidence || 0) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localFilters.minConfidence || 0}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                updateFilter('minConfidence', value > 0 ? value : undefined)
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                From Date
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-white/10 rounded-lg 
                             text-white text-sm
                             focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                To Date
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-white/10 rounded-lg 
                             text-white text-sm
                             focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>
          
          {/* Quick Symbols */}
          {symbols.length > 0 && (
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
                Quick Select Symbol
              </label>
              <div className="flex flex-wrap gap-2">
                {symbols.slice(0, 15).map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => updateFilter('symbol', symbol)}
                    className={`
                      px-2.5 py-1 rounded-md text-xs font-medium transition-all
                      ${localFilters.symbol === symbol
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}
                    `}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
