'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  AlertCircle, 
  LayoutGrid, 
  List,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import SignalCard from './SignalCard'
import type { OptionsSignal, SignalFilters as SignalFiltersType } from '@/types/options-signals'

type SortField = 'created_at' | 'confidence' | 'symbol' | 'direction'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

interface SignalListProps {
  signals: OptionsSignal[]
  filters: SignalFiltersType
  isLoading?: boolean
  error?: string | null
  onSignalClick?: (signal: OptionsSignal) => void
}

export default function SignalList({ 
  signals, 
  filters, 
  isLoading = false, 
  error = null,
  onSignalClick 
}: SignalListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [visibleCount, setVisibleCount] = useState(20)
  
  // Filter and sort signals
  const filteredAndSortedSignals = useMemo(() => {
    let result = [...signals]
    
    // Apply filters
    if (filters.symbol) {
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(filters.symbol!.toLowerCase())
      )
    }
    
    if (filters.direction && filters.direction !== 'ALL') {
      result = result.filter(s => s.direction === filters.direction)
    }
    
    if (filters.signalType && filters.signalType !== 'ALL') {
      result = result.filter(s => s.signal_type === filters.signalType)
    }
    
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(s => s.status === filters.status)
    }
    
    if (filters.minConfidence !== undefined) {
      result = result.filter(s => s.confidence >= filters.minConfidence!)
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter(s => new Date(s.created_at) >= fromDate)
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter(s => new Date(s.created_at) <= toDate)
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'confidence':
          comparison = a.confidence - b.confidence
          break
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol)
          break
        case 'direction':
          const dirOrder = { BULLISH: 0, NEUTRAL: 1, BEARISH: 2 }
          comparison = dirOrder[a.direction] - dirOrder[b.direction]
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [signals, filters, sortField, sortOrder])
  
  // Paginate
  const visibleSignals = filteredAndSortedSignals.slice(0, visibleCount)
  const hasMore = visibleSignals.length < filteredAndSortedSignals.length
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }
  
  const loadMore = () => {
    setVisibleCount(prev => prev + 20)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-zinc-500 text-sm">Loading signals...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertCircle size={24} className="text-rose-500" />
          </div>
          <h3 className="text-lg font-semibold text-white">Failed to Load Signals</h3>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }
  
  if (filteredAndSortedSignals.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
            <AlertCircle size={24} className="text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Signals Found</h3>
          <p className="text-zinc-500 text-sm">
            {signals.length === 0 
              ? "No options signals available yet. They'll appear here when TraderBot generates them."
              : "No signals match your current filters. Try adjusting your search criteria."}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">
            Showing <span className="text-white font-medium">{visibleSignals.length}</span> of{' '}
            <span className="text-white font-medium">{filteredAndSortedSignals.length}</span> signals
          </span>
          
          {/* Sort Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white 
                             bg-zinc-900/50 border border-white/10 rounded-lg transition-colors">
              <ArrowUpDown size={14} />
              Sort by {sortField.replace('_', ' ')}
              {sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            
            <div className="absolute top-full left-0 mt-1 w-40 py-1 bg-zinc-900 border border-white/10 
                          rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 
                          group-hover:visible transition-all z-50">
              {[
                { field: 'created_at' as SortField, label: 'Date' },
                { field: 'confidence' as SortField, label: 'Confidence' },
                { field: 'symbol' as SortField, label: 'Symbol' },
                { field: 'direction' as SortField, label: 'Direction' },
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`
                    w-full px-4 py-2 text-left text-sm transition-colors
                    ${sortField === field ? 'text-white bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {label}
                  {sortField === field && (
                    <span className="float-right">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-zinc-900/50 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`
              p-1.5 rounded-md transition-colors
              ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}
            `}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`
              p-1.5 rounded-md transition-colors
              ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}
            `}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>
      
      {/* Signals Grid/List */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
          : 'space-y-3'}
      `}>
        <AnimatePresence mode="popLayout">
          {visibleSignals.map((signal, index) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              index={index}
              onClick={onSignalClick}
              compact={viewMode === 'list'}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            className="px-6 py-2.5 bg-zinc-900/80 border border-white/10 rounded-lg 
                     text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/80
                     transition-all"
          >
            Load More ({filteredAndSortedSignals.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  )
}
