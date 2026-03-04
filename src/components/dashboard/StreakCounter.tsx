'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Rocket, Calendar, TrendingUp } from 'lucide-react'

interface StreakData {
  project: string
  currentStreak: number
  longestStreak: number
  lastDeploy: string
  totalDeploys: number
  thisWeek: number
}

const streakData: StreakData[] = [
  { project: 'Mission Control', currentStreak: 3, longestStreak: 5, lastDeploy: '2h ago', totalDeploys: 12, thisWeek: 4 },
  { project: 'Fashion Radar', currentStreak: 1, longestStreak: 3, lastDeploy: '5h ago', totalDeploys: 8, thisWeek: 2 },
  { project: 'Trading Bots', currentStreak: 7, longestStreak: 12, lastDeploy: '1d ago', totalDeploys: 45, thisWeek: 7 },
]

function getStreakColor(streak: number) {
  if (streak >= 7) return 'from-orange-500 to-red-500'
  if (streak >= 3) return 'from-amber-500 to-orange-500'
  return 'from-blue-500 to-cyan-500'
}

function getStreakEmoji(streak: number) {
  if (streak >= 7) return '🔥'
  if (streak >= 3) return '⚡'
  return '🚀'
}

export default function StreakCounter() {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setTimeout(() => setAnimated(true), 500)
  }, [])

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <Flame size={24} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Deployment Streaks</h3>
            <p className="text-sm text-zinc-400">Consecutive days with ships</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Calendar size={14} />
          Last 7 days
        </div>
      </div>

      <div className="space-y-4">
        {streakData.map((project, index) => (
          <motion.div
            key={project.project}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getStreakEmoji(project.currentStreak)}</span>
                <span className="font-medium text-white">{project.project}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-400">
                  Last: <span className="text-zinc-300">{project.lastDeploy}</span>
                </span>
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getStreakColor(project.currentStreak)} text-white font-bold text-sm`}>
                  {project.currentStreak} day{project.currentStreak !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Streak bar */}
            <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getStreakColor(project.currentStreak)} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: animated ? `${Math.min((project.currentStreak / 14) * 100, 100)}%` : 0 }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
              {/* Goal marker */}
              <div className="absolute top-0 bottom-0 w-0.5 bg-white/20" style={{ left: '50%' }}>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500">7 days</div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-2 text-xs text-zinc-500">
              <div className="flex items-center gap-1">
                <TrendingUp size={12} />
                Longest: <span className="text-zinc-300">{project.longestStreak} days</span>
              </div>
              <div className="flex items-center gap-1">
                <Rocket size={12} />
                Total: <span className="text-zinc-300">{project.totalDeploys} deploys</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                This week: <span className="text-zinc-300">{project.thisWeek}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Team streak summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {streakData.slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${getStreakColor(p.currentStreak)} border-2 border-zinc-900 flex items-center justify-center text-xs font-bold text-white`}
                >
                  {p.currentStreak}
                </div>
              ))}
            </div>
            <span className="text-sm text-zinc-400 ml-2">Team shipping</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {streakData.reduce((acc, p) => acc + p.thisWeek, 0)}
            </div>
            <div className="text-xs text-zinc-500">deploys this week</div>
          </div>
        </div>
      </div>
    </div>
  )
}
