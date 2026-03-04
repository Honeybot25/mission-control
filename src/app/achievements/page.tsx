'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Trophy, Star, Zap, Target, Rocket, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedBy?: string;
  unlockedAt?: string;
  progress?: number;
  total?: number;
}

const achievements: Achievement[] = [
  { id: 'first-deploy', name: 'First Deploy', description: 'Complete your first deployment', emoji: '🚀', unlocked: true, unlockedBy: 'ProductBuilder', unlockedAt: '2026-02-27' },
  { id: 'money-printer', name: 'Money Printer', description: 'Execute a profitable trade', emoji: '💰', unlocked: true, unlockedBy: 'TraderBot', unlockedAt: '2026-02-27' },
  { id: 'bug-slayer', name: 'Bug Slayer', description: 'Fix a critical production issue', emoji: '🐛', unlocked: true, unlockedBy: 'ProductBuilder', unlockedAt: '2026-02-26' },
  { id: 'momentum', name: 'Momentum', description: 'Complete 5 tasks in one day', emoji: '📈', unlocked: true, unlockedBy: 'TraderBot', unlockedAt: '2026-02-27' },
  { id: 'night-owl', name: 'Night Owl', description: 'Work after midnight', emoji: '🌙', unlocked: true, unlockedBy: 'ProductBuilder', unlockedAt: '2026-02-28' },
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Mention 5 different agents', emoji: '🦋', unlocked: false, progress: 3, total: 5 },
  { id: 'master-builder', name: 'Master Builder', description: 'Deploy 10 times', emoji: '👷', unlocked: false, progress: 4, total: 10 },
  { id: 'trading-pro', name: 'Trading Pro', description: 'Execute 20 profitable trades', emoji: '📊', unlocked: false, progress: 12, total: 20 },
];

export default function AchievementsPage() {
  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Award className="w-8 h-8 text-amber-400" />
          Achievements
        </h1>
        <p className="text-zinc-400 mb-8">
          {unlocked.length} of {achievements.length} unlocked • Keep building to earn more!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {unlocked.map(achievement => (
            <Card key={achievement.id} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-4xl">{achievement.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-2">
                    {achievement.name}
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="text-sm text-zinc-400">{achievement.description}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Unlocked by {achievement.unlockedBy} on {achievement.unlockedAt}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-zinc-400" />
          In Progress
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locked.map(achievement => (
            <Card key={achievement.id} className="bg-zinc-900/30 border-zinc-800/50 opacity-75">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="text-4xl opacity-50">{achievement.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold">{achievement.name}</div>
                  <div className="text-sm text-zinc-400">{achievement.description}</div>
                  {achievement.progress !== undefined && achievement.total !== undefined && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress} / {achievement.total}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500/50 rounded-full"
                          style={{ width: `${((achievement.progress ?? 0) / (achievement.total ?? 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
