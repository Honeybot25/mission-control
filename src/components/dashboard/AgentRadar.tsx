'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react'

interface Agent {
  id: string
  name: string
  status: 'online' | 'busy' | 'offline' | 'blocked'
  activity: number // 0-100
  lastActivity: string
  currentTask?: string
}

const agents: Agent[] = [
  { id: 'traderbot', name: 'TraderBot', status: 'online', activity: 75, lastActivity: '2m ago', currentTask: 'Monitoring NVDA momentum' },
  { id: 'productbuilder', name: 'ProductBuilder', status: 'busy', activity: 90, lastActivity: 'just now', currentTask: 'Building Mission Control updates' },
  { id: 'iosappbuilder', name: 'iOSAppBuilder', status: 'online', activity: 30, lastActivity: '1h ago', currentTask: 'Idle - awaiting orders' },
  { id: 'distribution', name: 'Distribution', status: 'online', activity: 45, lastActivity: '15m ago', currentTask: 'Monitoring X mentions' },
  { id: 'memorymanager', name: 'MemoryManager', status: 'offline', activity: 0, lastActivity: '4h ago', currentTask: 'Waiting for 2AM run' },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'busy': return 'bg-amber-500'
    case 'blocked': return 'bg-red-500'
    default: return 'bg-zinc-500'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'online': return CheckCircle
    case 'busy': return Activity
    case 'blocked': return AlertCircle
    default: return Clock
  }
}

export default function AgentRadar() {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const [pulseAgents, setPulseAgents] = useState<string[]>([])

  // Simulate real-time activity pulses
  useEffect(() => {
    const interval = setInterval(() => {
      const activeNow = agents
        .filter(a => a.status === 'busy' || a.status === 'online')
        .map(a => a.id)
      setPulseAgents(activeNow)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-[400px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-white/10">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Radar circles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[100, 150, 200].map((radius, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/5"
            style={{ width: radius * 2, height: radius * 2 }}
          />
        ))}
      </div>

      {/* Scanning line */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[250px] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent origin-left"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/50 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot size={24} className="text-blue-400" />
          </motion.div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-zinc-400 whitespace-nowrap">
            Mission Control
          </div>
        </div>
      </div>

      {/* Agent blips */}
      {agents.map((agent, index) => {
        const angle = (index * 72 - 90) * (Math.PI / 180)
        const radius = 120 + (agent.activity / 100) * 60
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const StatusIcon = getStatusIcon(agent.status)
        const isHovered = hoveredAgent === agent.id
        const isPulsing = pulseAgents.includes(agent.id)

        return (
          <motion.div
            key={agent.id}
            className="absolute cursor-pointer"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setHoveredAgent(agent.id)}
            onMouseLeave={() => setHoveredAgent(null)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Pulse ring for active agents */}
            {isPulsing && (
              <motion.div
                className={`absolute inset-0 rounded-full ${getStatusColor(agent.status)}`}
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            {/* Agent dot */}
            <div className={`relative w-12 h-12 rounded-full ${getStatusColor(agent.status)} border-2 border-white/20 flex items-center justify-center shadow-lg ${isHovered ? 'scale-125' : ''} transition-transform`}>
              <StatusIcon size={20} className="text-white" />
            </div>

            {/* Agent label */}
            <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap transition-opacity ${isHovered ? 'opacity-100' : 'opacity-70'}`}>
              <span className="text-white">{agent.name}</span>
            </div>

            {/* Tooltip on hover */}
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 rounded-lg p-3 min-w-[200px] z-10 shadow-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                  <span className="font-semibold text-white">{agent.name}</span>
                  <span className="text-xs text-zinc-400 ml-auto">{agent.lastActivity}</span>
                </div>
                <p className="text-sm text-zinc-300 mb-1">{agent.currentTask}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Activity size={12} />
                  Activity: {agent.activity}%
                </div>
              </motion.div>
            )}
          </motion.div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-zinc-400">Online</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-zinc-400">Busy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-500" />
          <span className="text-zinc-400">Offline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-zinc-400">Blocked</span>
        </div>
      </div>
    </div>
  )
}
