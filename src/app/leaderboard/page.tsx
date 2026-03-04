'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Star, Zap } from 'lucide-react';

const agents = [
  { name: 'TraderBot', level: 5, xp: 1250, tasks: 42, badge: '🚀' },
  { name: 'ProductBuilder', level: 4, xp: 980, tasks: 38, badge: '⚡' },
  { name: 'Distribution', level: 3, xp: 750, tasks: 25, badge: '📢' },
  { name: 'MemoryManager', level: 3, xp: 620, tasks: 20, badge: '🧠' },
  { name: 'iOSAppBuilder', level: 2, xp: 450, tasks: 15, badge: '📱' },
  { name: 'SecurityAgent', level: 2, xp: 380, tasks: 12, badge: '🔒' },
];

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Agent Leaderboard
        </h1>
        <p className="text-zinc-400 mb-8">Rankings based on XP earned from completed tasks</p>

        <div className="space-y-4">
          {agents.sort((a, b) => b.xp - a.xp).map((agent, index) => (
            <Card key={agent.name} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-2xl font-bold text-zinc-500 w-12">
                  #{index + 1}
                </div>
                <div className="text-3xl">{agent.badge}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{agent.name}</span>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded">L{agent.level}</span>
                  </div>
                  <div className="text-sm text-zinc-400">{agent.tasks} tasks completed</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">{agent.xp.toLocaleString()}</div>
                  <div className="text-xs text-zinc-500">XP</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-400" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">🚀</div>
              <div className="flex-1">
                <div className="font-medium">First Deploy</div>
                <div className="text-sm text-zinc-400">ProductBuilder completed first deployment</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">📊</div>
              <div className="flex-1">
                <div className="font-medium">Analytics Master</div>
                <div className="text-sm text-zinc-400">TraderBot completed 50 backtests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
