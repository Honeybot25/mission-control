'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ClipboardList, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  Clock,
  RefreshCw,
  Bot,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface StandupItem {
  agent: string
  avatar: string
  yesterday: string[]
  today: string[]
  blockers: string[]
  lastUpdated: string
}

const mockStandups: StandupItem[] = [
  {
    agent: 'TraderBot',
    avatar: '🤖',
    yesterday: [
      'Ran momentum backtest on NVDA (profit: +2.4%)',
      'Deployed paper trading alerts to #trading-alerts',
      'Tuned RSI thresholds based on last week\'s data'
    ],
    today: [
      'Monitoring SPY breakout signals pre-market',
      'Setting up weekly performance report',
      'Testing new MACD divergence strategy'
    ],
    blockers: [],
    lastUpdated: '10m ago'
  },
  {
    agent: 'ProductBuilder',
    avatar: '🚀',
    yesterday: [
      'Shipped Phase 1 dashboard features (radar, streaks, blockers)',
      'Fixed Supabase TypeScript errors across API routes',
      'Deployed production build to Vercel'
    ],
    today: [
      'Building Auto-Standup generator component',
      'Implementing cross-agent suggestion engine',
      'Planning Phase 3 voice integration'
    ],
    blockers: [],
    lastUpdated: 'just now'
  },
  {
    agent: 'iOSAppBuilder',
    avatar: '📱',
    yesterday: [
      'Researched TestFlight deployment best practices',
      'Created Xcode project template for rapid app builds'
    ],
    today: [
      'Waiting on Apple Developer account setup',
      'Documenting iOS architecture patterns'
    ],
    blockers: [
      'Need Apple Developer Team ID from R'
    ],
    lastUpdated: '1h ago'
  },
  {
    agent: 'Distribution',
    avatar: '📢',
    yesterday: [
      'Monitored X mentions for brand opportunities',
      'Drafted 3 content ideas from recent agent work'
    ],
    today: [
      'Scheduling Mission Control launch thread',
      'Creating content calendar for trading insights'
    ],
    blockers: [],
    lastUpdated: '30m ago'
  },
  {
    agent: 'MemoryManager',
    avatar: '🧠',
    yesterday: [
      'Indexed daily notes from agent activity logs',
      'Archived completed fashion-aesthetics project'
    ],
    today: [
      'Waiting for 2AM nightly consolidation task',
      'Preparing weekly knowledge summary'
    ],
    blockers: [],
    lastUpdated: '4h ago'
  }
]

export default function AutoStandup() {
  const [standups, setStandups] = useState<StandupItem[]>(mockStandups)
  const [loading, setLoading] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string>('2 hours ago')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  const regenerateStandup = () => {
    setLoading(true)
    // Simulate AI generation
    setTimeout(() => {
      setLoading(false)
      setLastGenerated('just now')
    }, 1500)
  }

  const totalBlockers = standups.reduce((acc, s) => acc + s.blockers.length, 0)

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <ClipboardList size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Auto-Standup
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">AI Generated</span>
              </h3>
              <p className="text-sm text-zinc-400">Daily summaries from agent activity logs</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {totalBlockers > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm">
                <AlertCircle size={14} />
                {totalBlockers} blocker{totalBlockers !== 1 ? 's' : ''}
              </div>
            )}
            <div className="text-sm text-zinc-500">
              Generated: {lastGenerated}
            </div>
            <button
              onClick={regenerateStandup}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Regenerate
            </button>
          </div>
        </div>
      </div>

      {/* Standup List */}
      <div className="divide-y divide-white/5">
        {standups.map((standup, index) => {
          const isExpanded = expandedAgent === standup.agent
          const hasBlockers = standup.blockers.length > 0

          return (
            <motion.div
              key={standup.agent}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 hover:bg-white/5 transition-colors ${hasBlockers ? 'border-l-2 border-l-red-500' : ''}`}
            >
              {/* Agent Header */}
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedAgent(isExpanded ? null : standup.agent)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{standup.avatar}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{standup.agent}</span>
                      {hasBlockers && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                          Blocked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock size={12} />
                      {standup.lastUpdated}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-4 text-sm">
                    <span className="text-zinc-500">
                      <span className="text-zinc-300">{standup.yesterday.length}</span> yesterday
                    </span>
                    <span className="text-zinc-500">
                      <span className="text-zinc-300">{standup.today.length}</span> today
                    </span>
                    {hasBlockers && (
                      <span className="text-red-400">
                        <span className="font-bold">{standup.blockers.length}</span> blocker
                      </span>
                    )}
                  </div>
                  <svg 
                    className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pl-11 space-y-4"
                >
                  {/* Yesterday */}
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-green-400" />
                      Yesterday
                    </h4>
                    <ul className="space-y-1.5">
                      {standup.yesterday.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Today */}
                  <div>
                    <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Circle size={12} className="text-blue-400" />
                      Today
                    </h4>
                    <ul className="space-y-1.5">
                      {standup.today.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">○</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Blockers */}
                  {hasBlockers && (
                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <h4 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <AlertCircle size={12} />
                        Blockers
                      </h4>
                      <ul className="space-y-1.5">
                        {standup.blockers.map((blocker, i) => (
                          <li key={i} className="text-sm text-red-300 flex items-start gap-2">
                            <span className="mt-1">🔴</span>
                            {blocker}
                            <Link 
                              href={`/agents?help=${standup.agent}`}
                              className="ml-2 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
                            >
                              Help →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-amber-400" />
            Generated by AI from agent activity logs
          </div>
          <Link href="/activity" className="text-blue-400 hover:text-blue-300">
            View full activity →
          </Link>
        </div>
      </div>
    </div>
  )
}
