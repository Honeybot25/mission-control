'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bot, Rocket, Megaphone, Brain, Smartphone,
  Activity, CheckCircle, AlertCircle, Clock,
  TrendingUp, TrendingDown, Minus, PlayCircle
} from 'lucide-react'
import Link from 'next/link'

interface AgentStatus {
  status: 'online' | 'offline' | 'busy'
  currentTask: string
  startedAt: string | null
  lastActivity: string
}

interface Agent {
  id: string
  name: string
  code: string
  description: string
  icon: typeof Bot
  color: string
  bgGradient: string
  borderColor: string
  iconBg: string
  iconColor: string
  statusInfo: AgentStatus
  stats: {
    tasksToday: number
    successRate: number
  }
}

const baseAgents = [
  {
    id: 'traderbot',
    name: 'TraderBot',
    code: 'TBT',
    description: 'Autonomous trading with risk management and 24/7 market monitoring.',
    icon: Bot,
    color: 'green',
    bgGradient: 'from-green-500/10 to-green-600/5',
    borderColor: 'border-green-500/20',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-500',
  },
  {
    id: 'productbuilder',
    name: 'ProductBuilder',
    code: 'PBD',
    description: 'Ship products from PRD to production with intelligent automation.',
    icon: Rocket,
    color: 'blue',
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    borderColor: 'border-blue-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
  },
  {
    id: 'iosappbuilder',
    name: 'iOSAppBuilder',
    code: 'IOS',
    description: 'iOS app development and TestFlight deployment pipeline.',
    icon: Smartphone,
    color: 'indigo',
    bgGradient: 'from-indigo-500/10 to-indigo-600/5',
    borderColor: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-500',
  },
  {
    id: 'distribution',
    name: 'Distribution',
    code: 'DST',
    description: 'Auto-drafts, schedules, and optimizes content for maximum engagement.',
    icon: Megaphone,
    color: 'purple',
    bgGradient: 'from-purple-500/10 to-purple-600/5',
    borderColor: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500',
  },
  {
    id: 'memorymanager',
    name: 'MemoryManager',
    code: 'MMR',
    description: 'Automatic consolidation and instant retrieval of your knowledge base.',
    icon: Brain,
    color: 'teal',
    bgGradient: 'from-teal-500/10 to-teal-600/5',
    borderColor: 'border-teal-500/20',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-500',
  },
]

function StatusBadge({ status, currentTask, startedAt }: { status: AgentStatus['status'], currentTask: string, startedAt: string | null }) {
  const config = {
    online: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Online' },
    busy: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Busy' },
    offline: { color: 'text-zinc-400', bg: 'bg-zinc-500/20', label: 'Offline' },
  }
  const c = config[status]
  
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${c.bg} ${c.color} w-fit`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : status === 'busy' ? 'bg-yellow-500' : 'bg-zinc-500'}`} />
        {c.label}
      </span>
      {status === 'busy' && startedAt && (
        <span className="text-xs text-yellow-500/80 flex items-center gap-1">
          <PlayCircle size={10} />
          Started {formatTimeAgo(startedAt)}
        </span>
      )}
    </div>
  )
}

function TrendIndicator({ value }: { value: number }) {
  if (value > 90) return <TrendingUp size={16} className="text-green-500" />
  if (value < 70) return <TrendingDown size={16} className="text-red-500" />
  return <Minus size={16} className="text-zinc-500" />
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

export default function AgentsPageClient() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/logs')
        const data = await response.json()
        
        // Combine base agent info with live status
        const agentsWithStatus = baseAgents.map(base => {
          const statusInfo = data.agentStatuses?.[base.name] || {
            status: 'offline',
            currentTask: 'No current task',
            startedAt: null,
            lastActivity: 'No activity'
          }
          
          // Calculate stats from logs
          const agentLogs = data.logs?.filter((log: any) => log.agent === base.name) || []
          const today = new Date().toDateString()
          const tasksToday = agentLogs.filter((log: any) => 
            new Date(log.timestamp).toDateString() === today
          ).length
          
          const completed = agentLogs.filter((log: any) => log.status === 'completed').length
          const failed = agentLogs.filter((log: any) => log.status === 'failed').length
          const total = completed + failed
          const successRate = total > 0 ? Math.round((completed / total) * 100) : 100
          
          return {
            ...base,
            statusInfo,
            stats: { tasksToday, successRate }
          }
        })
        
        setAgents(agentsWithStatus)
        setRecentLogs(data.logs || [])
      } catch (err) {
        console.error('Failed to fetch agent data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

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
              <span className="text-zinc-400">Agents</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/activity" className="text-sm text-zinc-400 hover:text-white transition-colors">Activity</Link>
              <Link href="/agents" className="text-sm text-white">Agents</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Agent Fleet</h1>
          <p className="text-zinc-400 max-w-2xl">
            Monitor and manage all autonomous agents. Each agent logs their activity to Mission Control 
            for real-time visibility.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <Activity size={16} />
              Total Agents
            </div>
            <p className="text-3xl font-bold">{agents.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <CheckCircle size={16} />
              Online
            </div>
            <p className="text-3xl font-bold text-green-500">
              {agents.filter(a => a.statusInfo?.status === 'online').length}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <Clock size={16} />
              Busy
            </div>
            <p className="text-3xl font-bold text-yellow-500">
              {agents.filter(a => a.statusInfo?.status === 'busy').length}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
              <AlertCircle size={16} />
              Offline
            </div>
            <p className="text-3xl font-bold text-zinc-500">
              {agents.filter(a => a.statusInfo?.status === 'offline').length}
            </p>
          </div>
        </motion.div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {agents.map((agent, index) => {
            const Icon = agent.icon
            
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`group bg-gradient-to-br ${agent.bgGradient} ${agent.borderColor} border rounded-2xl p-6 relative overflow-hidden`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${agent.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={28} className={agent.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-semibold">{agent.name}</h3>
                      <span className="text-label text-zinc-500">{agent.code}</span>
                      <StatusBadge 
                        status={agent.statusInfo?.status || 'offline'} 
                        currentTask={agent.statusInfo?.currentTask || ''}
                        startedAt={agent.statusInfo?.startedAt}
                      />
                    </div>
                    <p className="text-zinc-400 text-sm mb-4">{agent.description}</p>

                    {/* Current Task Display */}
                    {agent.statusInfo?.currentTask && (
                      <div className="mb-4 p-3 bg-black/30 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Currently Working On:</p>
                        <p className="text-sm text-white font-medium">{agent.statusInfo.currentTask}</p>
                        {agent.statusInfo.startedAt && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Started: {formatTimeAgo(agent.statusInfo.startedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Tasks Today</p>
                        <p className="text-lg font-semibold">{agent.stats?.tasksToday || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Success Rate</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{agent.stats?.successRate || 100}%</p>
                          <TrendIndicator value={agent.stats?.successRate || 100} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Last Activity</p>
                        <p className="text-sm font-medium text-zinc-300">{agent.statusInfo?.lastActivity || 'No activity'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div className="mt-6 pt-4 border-t border-white/5">
                  <p className="text-xs text-zinc-500 mb-3">Recent Activity</p>
                  {loading ? (
                    <p className="text-sm text-zinc-600">Loading...</p>
                  ) : recentLogs.filter((log: any) => log.agent === agent.name).length === 0 ? (
                    <p className="text-sm text-zinc-600">No recent activity</p>
                  ) : (
                    <div className="space-y-2">
                      {recentLogs
                        .filter((log: any) => log.agent === agent.name)
                        .slice(0, 3)
                        .map((log: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <span className={`w-2 h-2 rounded-full ${
                              log.status === 'completed' ? 'bg-green-500' :
                              log.status === 'failed' ? 'bg-red-500' :
                              log.status === 'in-progress' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <span className="text-zinc-400 truncate flex-1">{log.description}</span>
                            <span className="text-zinc-600 text-xs">{formatTimeAgo(log.timestamp)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
