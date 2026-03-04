'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, Rocket, Megaphone, Brain, Smartphone,
  Search, Filter, RefreshCw, Clock, ExternalLink,
  CheckCircle, PlayCircle, PauseCircle, Wifi, WifiOff,
  XCircle, Loader2, AtSign
} from 'lucide-react'
import Link from 'next/link'
import ActivityTestInjector from '@/components/activity/ActivityTestInjector'
import { MentionHighlighter, MentionBadge } from '@/components/activity/MentionHighlighter'

const agents = [
  { id: 'all', name: 'All Agents', icon: Bot },
  { id: 'TraderBot', name: 'TraderBot', icon: Bot, color: 'green' },
  { id: 'ProductBuilder', name: 'ProductBuilder', icon: Rocket, color: 'blue' },
  { id: 'iOSAppBuilder', name: 'iOSAppBuilder', icon: Smartphone, color: 'indigo' },
  { id: 'Distribution', name: 'Distribution', icon: Megaphone, color: 'purple' },
  { id: 'MemoryManager', name: 'MemoryManager', icon: Brain, color: 'teal' },
]

const statuses = [
  { id: 'all', name: 'All Statuses', color: 'zinc' },
  { id: 'created', name: 'Created', color: 'blue', icon: Bot },
  { id: 'started', name: 'Started', color: 'blue', icon: PlayCircle },
  { id: 'in-progress', name: 'In Progress', color: 'yellow', icon: Loader2 },
  { id: 'paused', name: 'Paused', color: 'orange', icon: PauseCircle },
  { id: 'completed', name: 'Completed', color: 'green', icon: CheckCircle },
  { id: 'failed', name: 'Failed', color: 'red', icon: XCircle },
]

const impacts = [
  { id: 'all', name: 'All Impact' },
  { id: 'critical', name: 'Critical', color: 'red' },
  { id: 'high', name: 'High', color: 'orange' },
  { id: 'medium', name: 'Medium', color: 'blue' },
  { id: 'low', name: 'Low', color: 'zinc' },
]

function getStatusConfig(status: string) {
  return statuses.find(s => s.id === status) || statuses[0]
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

function formatFullDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

interface LogEntry {
  id: string
  timestamp: string
  agent: string
  project: string
  status: string
  description: string
  details?: Record<string, unknown>
  links?: Record<string, string>
  estimated_impact: string
  error?: string
}

interface ActivityPageClientProps {
  initialLogs?: LogEntry[]
}

export default function ActivityPageClient({ initialLogs = [] }: ActivityPageClientProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(initialLogs)
  const [loading, setLoading] = useState(initialLogs.length === 0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedImpact, setSelectedImpact] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>(initialLogs.length > 0 ? 'synced' : 'syncing')
  const [agentMap, setAgentMap] = useState<Map<string, { name: string; slug: string }>>(new Map())

  const fetchLogs = useCallback(async () => {
    setSyncStatus('syncing')
    try {
      const response = await fetch('/api/logs')
      const data = await response.json()
      setLogs(data.logs || [])
      setLastUpdated(data.lastUpdated)
      
      // Build agent map for mention highlighting
      if (data.agents) {
        const map = new Map<string, { name: string; slug: string }>()
        data.agents.forEach((agent: { name: string; slug: string }) => {
          map.set(agent.slug, { name: agent.name, slug: agent.slug })
        })
        setAgentMap(map)
      }
      
      setSyncStatus('synced')
    } catch (err) {
      console.error('Failed to fetch logs:', err)
      setSyncStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch client-side if we don't have initial data
    if (initialLogs.length === 0) {
      fetchLogs()
    }
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [fetchLogs, initialLogs.length])

  // Filter logs
  useEffect(() => {
    let filtered = logs

    if (selectedAgent !== 'all') {
      filtered = filtered.filter(log => log.agent === selectedAgent)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.status === selectedStatus)
    }

    if (selectedImpact !== 'all') {
      filtered = filtered.filter(log => log.estimated_impact === selectedImpact)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(query) ||
        log.agent.toLowerCase().includes(query) ||
        log.project.toLowerCase().includes(query) ||
        (log.error && log.error.toLowerCase().includes(query))
      )
    }

    setFilteredLogs(filtered)
  }, [logs, selectedAgent, selectedStatus, selectedImpact, searchQuery])

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
                Mission Control
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">Activity</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/activity" className="text-sm text-white">Activity</Link>
              <Link href="/agents" className="text-sm text-zinc-400 hover:text-white transition-colors">Agents</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Activity Feed</h1>
              <p className="text-zinc-400">
                Complete log of all agent activity. {logs.length} entries total.
                {lastUpdated && (
                  <span className="ml-2 text-zinc-500">
                    Last updated: {formatTimeAgo(lastUpdated)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync status */}
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                syncStatus === 'synced' 
                  ? 'bg-green-500/20 text-green-400'
                  : syncStatus === 'syncing'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {syncStatus === 'syncing' && (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Syncing...
                  </>
                )}
                {syncStatus === 'synced' && (
                  <>
                    <CheckCircle size={14} />
                    Live
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <XCircle size={14} />
                    Error
                  </>
                )}
              </span>

              <button
                onClick={fetchLogs}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <RefreshCw size={16} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Test Injector - Remove in production */}
        <ActivityTestInjector />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="text"
              placeholder="Search activity, projects, errors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-3">
            {/* Agent Filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              <Filter size={14} className="text-zinc-500 ml-2" />
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    selectedAgent === agent.id 
                      ? 'bg-white/10 text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {agent.name}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              {statuses.map(status => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.id)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    selectedStatus === status.id 
                      ? 'bg-white/10 text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {status.name}
                </button>
              ))}
            </div>

            {/* Impact Filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              {impacts.map(impact => (
                <button
                  key={impact.id}
                  onClick={() => setSelectedImpact(impact.id)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    selectedImpact === impact.id 
                      ? 'bg-white/10 text-white' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {impact.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <p className="text-lg mb-2">No activity found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredLogs.map((log, index) => {
                const statusConfig = getStatusConfig(log.status)
                const StatusIcon = statusConfig.icon || Bot

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    className="group bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={`w-10 h-10 rounded-lg bg-${statusConfig.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon size={20} className={`text-${statusConfig.color}-500`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-semibold text-white">{log.agent}</span>
                          <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-white/5">
                            {log.project}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`}>
                            {log.status}
                          </span>
                          {log.estimated_impact === 'critical' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                              CRITICAL
                            </span>
                          )}
                          <span className="text-xs text-zinc-500 ml-auto flex items-center gap-1" title={formatFullDate(log.timestamp)}>
                            <Clock size={12} />
                            {formatTimeAgo(log.timestamp)}
                          </span>
                        </div>

                        <p className="text-zinc-300 mb-2">
                          <MentionHighlighter text={log.description} agentMap={agentMap} />
                          <MentionBadge text={log.description} agentMap={agentMap} />
                        </p>

                        {/* Error */}
                        {log.error && (
                          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2 mb-2">
                            {log.error}
                          </p>
                        )}

                        {/* Links */}
                        {log.links && Object.keys(log.links).length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {log.links.repo && (
                              <a href={log.links.repo} target="_blank" rel="noopener noreferrer"
                                 className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                Repo <ExternalLink size={10} />
                              </a>
                            )}
                            {log.links.deployment && (
                              <a href={log.links.deployment} target="_blank" rel="noopener noreferrer"
                                 className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                Live <ExternalLink size={10} />
                              </a>
                            )}
                            {log.links.doc && (
                              <a href={log.links.doc} target="_blank" rel="noopener noreferrer"
                                 className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                Docs <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Details */}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 text-xs text-zinc-500 bg-white/5 rounded-lg p-2">
                            {Object.entries(log.details).map(([key, value]) => (
                              <span key={key} className="inline-block mr-3">
                                <span className="text-zinc-400">{key}:</span> {JSON.stringify(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </main>
    </div>
  )
}
