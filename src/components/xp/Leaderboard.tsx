'use client';

import { useState, useMemo } from 'react';
import { AgentWithXP, Achievement } from '@/lib/xp-system';
import { XPBar, XPBarMini } from './XPBar';
import { AchievementBadge } from './AchievementBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  agents: AgentWithXP[];
  className?: string;
  limit?: number;
}

export function Leaderboard({ agents, className, limit = 10 }: LeaderboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'xp' | 'tasks' | 'achievements'>('xp');

  const rankedAgents = useMemo(() => {
    const sorted = [...agents].sort((a, b) => {
      switch (selectedCategory) {
        case 'xp':
          return b.xp - a.xp;
        case 'tasks':
          return (b.total_tasks_completed || 0) - (a.total_tasks_completed || 0);
        case 'achievements':
          return (b.achievements?.length || 0) - (a.achievements?.length || 0);
        default:
          return 0;
      }
    });
    return sorted.slice(0, limit);
  }, [agents, selectedCategory, limit]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Agent Leaderboard
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="xp">
              <TrendingUp className="w-4 h-4 mr-2" />
              XP
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Activity className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Award className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xp" className="space-y-2">
            {rankedAgents.map((agent, index) => (
              <LeaderboardRow
                key={agent.id}
                rank={index + 1}
                agent={agent}
                rankIcon={getRankIcon(index + 1)}
                rankStyle={getRankStyle(index + 1)}
                metric={agent.xp.toLocaleString()}
                metricLabel="XP"
                showXPBar
              />
            ))}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-2">
            {rankedAgents.map((agent, index) => (
              <LeaderboardRow
                key={agent.id}
                rank={index + 1}
                agent={agent}
                rankIcon={getRankIcon(index + 1)}
                rankStyle={getRankStyle(index + 1)}
                metric={(agent.total_tasks_completed || 0).toString()}
                metricLabel="completed"
                subMetric={`${agent.total_tasks_failed || 0} failed`}
              />
            ))}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-2">
            {rankedAgents.map((agent, index) => (
              <LeaderboardRow
                key={agent.id}
                rank={index + 1}
                agent={agent}
                rankIcon={getRankIcon(index + 1)}
                rankStyle={getRankStyle(index + 1)}
                metric={(agent.achievements?.length || 0).toString()}
                metricLabel="badges"
                showAchievements
              />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface LeaderboardRowProps {
  rank: number;
  agent: AgentWithXP;
  rankIcon: React.ReactNode;
  rankStyle: string;
  metric: string;
  metricLabel: string;
  subMetric?: string;
  showXPBar?: boolean;
  showAchievements?: boolean;
}

function LeaderboardRow({
  rank,
  agent,
  rankIcon,
  rankStyle,
  metric,
  metricLabel,
  subMetric,
  showXPBar,
  showAchievements,
}: LeaderboardRowProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAgentColor = (slug: string) => {
    const colors: Record<string, string> = {
      traderbot: 'bg-green-500',
      productbuilder: 'bg-blue-500',
      distribution: 'bg-purple-500',
      memorymanager: 'bg-teal-500',
      iosappbuilder: 'bg-indigo-500',
      securityagent: 'bg-red-500',
    };
    return colors[slug] || 'bg-gray-500';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border transition-all',
        'hover:shadow-md hover:scale-[1.01]',
        rankStyle
      )}
    >
      <div className="flex-shrink-0">{rankIcon}</div>
      
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className={getAgentColor(agent.slug)}>
          {getInitials(agent.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{agent.name}</span>
          <span className="text-xs text-muted-foreground">L{agent.level}</span>
        </div>
        
        {showXPBar && (
          <XPBarMini xp={agent.xp} level={agent.level} />
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <div className="font-bold">{metric}</div>
        <div className="text-xs text-muted-foreground">
          {metricLabel}
          {subMetric && <span className="ml-1 text-red-400">({subMetric})</span>}
        </div>
      </div>

      {showAchievements && agent.achievements && agent.achievements.length > 0 && (
        <div className="flex -space-x-2 flex-shrink-0">
          {agent.achievements.slice(0, 3).map((achievement, i) => (
            <div
              key={achievement.id}
              className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs"
              style={{ zIndex: 3 - i }}
            >
              {achievement.badge_emoji}
            </div>
          ))}
          {agent.achievements.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
              +{agent.achievements.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;

