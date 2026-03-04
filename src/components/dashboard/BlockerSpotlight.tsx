'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, MessageSquare, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface Blocker {
  id: string
  agent: string
  task: string
  blocker: string
  timeBlocked: string
  priority: 'high' | 'critical'
  Needs?: string
}

const mockBlockers: Blocker[] = [
  {
    id: '1',
    agent: 'iOSAppBuilder',
    task: 'TestFlight deployment pipeline',
    blocker: 'Missing Apple Developer Team ID',
    timeBlocked: '2h ago',
    priority: 'high',
    Needs: 'R to generate app-specific password'
  },
  // Remove this to test empty state: Uncomment to see empty state
]

export default function BlockerSpotlight() {
  const [blockers, setBlockers] = useState<Blocker[]>(mockBlockers)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [lastCheck, setLastCheck] = useState<string>('')

  // Check for blockers every 30 seconds
  useEffect(() => {
    const checkBlockers = () => {
      // In real implementation, this would fetch from API
      setLastCheck(new Date().toLocaleTimeString())
    }

    checkBlockers()
    const interval = setInterval(checkBlockers, 30000)
    return () => clearInterval(interval)
  }, [])

  const dismissBlocker = (id: string) => {
    setDismissed([...dismissed, id])
  }

  const activeBlockers = blockers.filter(b => !dismissed.includes(b.id))

  if (activeBlockers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">All Systems Go</h3>
            <p className="text-sm text-zinc-400">No blockers detected. All agents operational.</p>
          </div>
          <div className="ml-auto text-xs text-zinc-500">
            Last check: {lastCheck || 'just now'}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {activeBlockers.map((blocker, index) => (
          <motion.div
            key={blocker.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-2xl ${
              blocker.priority === 'critical'
                ? 'bg-gradient-to-r from-red-600 to-red-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
          >
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <AlertTriangle size={24} className="text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-bold uppercase">
                      {blocker.priority}
                    </span>
                    <span className="flex items-center gap-1 text-white/80 text-sm">
                      <Clock size={14} />
                      Blocked {blocker.timeBlocked}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {blocker.agent} needs help
                  </h3>

                  <p className="text-white/90 text-lg mb-2">
                    {blocker.blocker}
                  </p>

                  <p className="text-white/70 text-sm mb-4">
                    Task: {blocker.task}
                  </p>

                  {blocker.Needs && (
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-lg px-4 py-2 text-white">
                        <span className="text-white/60 text-sm">Action needed:</span>
                        <p className="font-medium">{blocker.Needs}</p>
                      </div>

                      <Link
                        href={`/agents?help=${blocker.agent}`}
                        className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
                      >
                        <User size={18} />
                        Assist
                      </Link>

                      <button
                        onClick={() => dismissBlocker(blocker.id)}
                        className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
                      >
                        <MessageSquare size={18} />
                        Acknowledge
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => dismissBlocker(blocker.id)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Progress bar at bottom */}
            <motion.div
              className="h-1 bg-white/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 300, ease: 'linear' }} // 5 minute timer
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {activeBlockers.length > 1 && (
        <div className="text-center">
          <span className="text-sm text-zinc-500">
            {activeBlockers.length} blockers need attention
          </span>
        </div>
      )}
    </div>
  )
}
