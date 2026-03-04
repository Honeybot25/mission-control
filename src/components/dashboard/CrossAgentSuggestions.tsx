'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Lightbulb, 
  ArrowRight,
  Bot,
  Zap,
  TrendingUp,
  Megaphone,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'

interface Suggestion {
  id: string
  type: 'collaboration' | 'content' | 'product' | 'insight'
  fromAgent: string
  toAgent: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionLink: string
}

const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    type: 'collaboration',
    fromAgent: 'TraderBot',
    toAgent: 'ProductBuilder',
    title: 'Trading insights → Dashboard feature',
    description: 'TraderBot\'s momentum scanner data could power a new "Market Sentiment" widget for Mission Control.',
    impact: 'high',
    actionLink: '/agents?spawn=productbuilder&task=Build market sentiment widget'
  },
  {
    id: '2',
    type: 'content',
    fromAgent: 'ProductBuilder',
    toAgent: 'Distribution',
    title: 'Ship celebration post',
    description: 'ProductBuilder just shipped Phase 1. Distribution could craft a "Meet your AI team" Twitter thread.',
    impact: 'medium',
    actionLink: '/agents?spawn=distribution&task=Draft ship celebration thread'
  },
  {
    id: '3',
    type: 'product',
    fromAgent: 'Distribution',
    toAgent: 'iOSAppBuilder',
    title: 'Content ideas app?',
    description: 'Distribution has been manually tracking content ideas. Suggest iOSAppBuilder build a "Content Vault" app.',
    impact: 'medium',
    actionLink: '/agents?spawn=ios-app-builder&task=Research content ideas app'
  },
  {
    id: '4',
    type: 'insight',
    fromAgent: 'MemoryManager',
    toAgent: 'TraderBot',
    title: 'Pattern detected',
    description: 'Trading bots perform 23% better on Tuesdays. Consider increasing position sizes mid-week.',
    impact: 'high',
    actionLink: '/agents?spawn=traderbot&task=Analyze Tuesday performance pattern'
  }
]

function getTypeIcon(type: string) {
  switch (type) {
    case 'collaboration': return Zap
    case 'content': return Megaphone
    case 'product': return Smartphone
    case 'insight': return TrendingUp
    default: return Lightbulb
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'collaboration': return 'from-amber-500 to-yellow-500'
    case 'content': return 'from-purple-500 to-pink-500'
    case 'product': return 'from-blue-500 to-cyan-500'
    case 'insight': return 'from-green-500 to-emerald-500'
    default: return 'from-zinc-500 to-gray-500'
  }
}

function getImpactBadge(impact: string) {
  switch (impact) {
    case 'high': return '🔥 High Impact'
    case 'medium': return '⚡ Medium Impact'
    case 'low': return '💡 Low Impact'
    default: return ''
  }
}

export default function CrossAgentSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions)
  const [dismissed, setDismissed] = useState<string[]>([])

  const dismissSuggestion = (id: string) => {
    setDismissed([...dismissed, id])
  }

  const activeSuggestions = suggestions.filter(s => !dismissed.includes(s.id))

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <Lightbulb size={24} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Cross-Agent Suggestions
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">AI Powered</span>
            </h3>
            <p className="text-sm text-zinc-400">Opportunities for agents to collaborate</p>
          </div>
        </div>
        
        <div className="text-sm text-zinc-500">
          {activeSuggestions.length} suggestion{activeSuggestions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {activeSuggestions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
          <p>No suggestions right now.</p>
          <p className="text-sm">Agents are working independently or already collaborating!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeSuggestions.map((suggestion, index) => {
            const TypeIcon = getTypeIcon(suggestion.type)
            
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(suggestion.type)} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon size={20} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 capitalize">
                        {suggestion.type}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {getImpactBadge(suggestion.impact)}
                      </span>
                    </div>

                    <h4 className="font-semibold text-white mb-1">
                      {suggestion.title}
                    </h4>

                    <p className="text-sm text-zinc-400 mb-3">
                      {suggestion.description}
                    </p>

                    {/* Agent Flow */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5">
                        <Bot size={12} />
                        {suggestion.fromAgent}
                      </div>
                      <ArrowRight size={14} className="text-zinc-600" />
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400">
                        <Bot size={12} />
                        {suggestion.toAgent}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={suggestion.actionLink}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
                      >
                        <Zap size={14} />
                        Act on it
                      </Link>
                      <button
                        onClick={() => dismissSuggestion(suggestion.id)}
                        className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hover decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Pattern insight */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-start gap-3 text-sm">
          <TrendingUp size={16} className="text-green-400 mt-0.5" />
          <div>
            <span className="text-zinc-300">Pattern detected:</span>
            <span className="text-zinc-400 ml-1">
              TraderBot and ProductBuilder have collaborated 4 times this week — 
              <Link href="/activity" className="text-blue-400 hover:text-blue-300 ml-1">
                view collaboration history →
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
