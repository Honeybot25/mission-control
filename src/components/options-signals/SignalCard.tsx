'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Activity,
  Clock,
  Percent,
  BarChart3,
  Zap,
  Info
} from 'lucide-react'
import type { OptionsSignal, SignalDirection, SignalType } from '@/types/options-signals'

interface SignalCardProps {
  signal: OptionsSignal
  index?: number
  onClick?: (signal: OptionsSignal) => void
  compact?: boolean
}

const directionConfig: Record<SignalDirection, { 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: React.ReactNode;
  label: string;
}> = {
  BULLISH: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: <TrendingUp size={16} />,
    label: 'Bullish',
  },
  BEARISH: {
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    icon: <TrendingDown size={16} />,
    label: 'Bearish',
  },
  NEUTRAL: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: <Minus size={16} />,
    label: 'Neutral',
  },
}

const typeLabels: Record<SignalType, string> = {
  CALL: 'Call',
  PUT: 'Put',
  STRADDLE: 'Straddle',
  STRANGLE: 'Strangle',
  IRON_CONDOR: 'Iron Condor',
  BUTTERFLY: 'Butterfly',
  CALENDAR_SPREAD: 'Calendar Spread',
  DIAGONAL: 'Diagonal',
  VERTICAL_SPREAD: 'Vertical Spread',
  HOLD: 'Hold',
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-emerald-400'
  if (confidence >= 0.70) return 'text-blue-400'
  if (confidence >= 0.55) return 'text-amber-400'
  return 'text-zinc-400'
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 0.85) return 'bg-emerald-500/20'
  if (confidence >= 0.70) return 'bg-blue-500/20'
  if (confidence >= 0.55) return 'bg-amber-500/20'
  return 'bg-zinc-500/20'
}

export default function SignalCard({ signal, index = 0, onClick, compact = false }: SignalCardProps) {
  const direction = directionConfig[signal.direction]
  const confidenceColor = getConfidenceColor(signal.confidence)
  const confidenceBg = getConfidenceBg(signal.confidence)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onClick?.(signal)}
      className={`
        group relative overflow-hidden rounded-xl border backdrop-blur-sm
        transition-all duration-200 cursor-pointer
        ${direction.bgColor} ${direction.borderColor}
        hover:scale-[1.02] hover:shadow-lg hover:shadow-${signal.direction.toLowerCase()}/10
        ${compact ? 'p-4' : 'p-5'}
      `}
      style={{
        background: `linear-gradient(135deg, ${signal.direction === 'BULLISH' ? 'rgba(16, 185, 129, 0.05)' : signal.direction === 'BEARISH' ? 'rgba(244, 63, 94, 0.05)' : 'rgba(245, 158, 11, 0.05)'} 0%, rgba(10, 10, 15, 0.8) 100%)`
      }}
    >
      {/* Glow effect on hover */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        ${signal.direction === 'BULLISH' ? 'bg-emerald-500/5' : signal.direction === 'BEARISH' ? 'bg-rose-500/5' : 'bg-amber-500/5'}
      `} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Symbol */}
            <div className={`
              px-3 py-1.5 rounded-lg font-bold text-lg tracking-wider
              bg-zinc-900/80 border border-white/10
              ${direction.color}
            `}>
              {signal.symbol}
            </div>
            
            {/* Direction Badge */}
            <div className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
              ${direction.bgColor} ${direction.color} border ${direction.borderColor}
            `}>
              {direction.icon}
              {typeLabels[signal.signal_type]}
            </div>
          </div>
          
          {/* Confidence */}
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
            ${confidenceBg} ${confidenceColor}
          `}>
            <Zap size={14} />
            {Math.round(signal.confidence * 100)}%
          </div>
        </div>
        
        {/* Details Grid */}
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-3'} mb-3`}>
          {signal.strike_price && (
            <div className="flex items-center gap-2 text-sm">
              <Target size={14} className="text-zinc-500" />
              <span className="text-zinc-400">Strike:</span>
              <span className="text-white font-medium">${signal.strike_price.toFixed(2)}</span>
            </div>
          )}
          
          {signal.expiration_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-zinc-500" />
              <span className="text-zinc-400">Exp:</span>
              <span className="text-white font-medium">{formatDate(signal.expiration_date)}</span>
            </div>
          )}
          
          {signal.premium && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign size={14} className="text-zinc-500" />
              <span className="text-zinc-400">Prem:</span>
              <span className="text-white font-medium">${signal.premium.toFixed(2)}</span>
            </div>
          )}
          
          {signal.underlying_price && (
            <div className="flex items-center gap-2 text-sm">
              <Activity size={14} className="text-zinc-500" />
              <span className="text-zinc-400">Spot:</span>
              <span className="text-white font-medium">${signal.underlying_price.toFixed(2)}</span>
            </div>
          )}
          
          {signal.risk_reward_ratio && (
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 size={14} className="text-zinc-500" />
              <span className="text-zinc-400">R:R:</span>
              <span className="text-white font-medium">1:{signal.risk_reward_ratio.toFixed(1)}</span>
            </div>
          )}
          
          {signal.time_to_expiry_days && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-zinc-500" />
              <span className="text-zinc-400">DTE:</span>
              <span className="text-white font-medium">{signal.time_to_expiry_days}d</span>
            </div>
          )}
        </div>
        
        {/* Entry Reason */}
        {signal.entry_reason && !compact && (
          <div className="mb-3 p-3 rounded-lg bg-zinc-900/50 border border-white/5">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-300 line-clamp-2">{signal.entry_reason}</p>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-4">
            {/* Status */}
            <span className={`
              text-xs px-2 py-0.5 rounded-full
              ${signal.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 
                signal.status === 'CLOSED' ? 'bg-zinc-500/20 text-zinc-400' :
                signal.status === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400' :
                'bg-amber-500/20 text-amber-400'}
            `}>
              {signal.status}
            </span>
            
            {/* Source */}
            <span className="text-xs text-zinc-500">
              via {signal.source}
            </span>
          </div>
          
          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock size={12} />
            {formatTimeAgo(signal.created_at)}
          </div>
        </div>
        
        {/* P&L if closed */}
        {signal.pnl !== undefined && signal.pnl !== null && (
          <div className={`
            mt-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between
            ${signal.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}
          `}>
            <span>P&L</span>
            <div className="flex items-center gap-2">
              <span>{signal.pnl >= 0 ? '+' : ''}${signal.pnl.toFixed(2)}</span>
              {signal.pnl_percent && (
                <span className="text-xs opacity-70">
                  ({signal.pnl_percent >= 0 ? '+' : ''}{signal.pnl_percent.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
