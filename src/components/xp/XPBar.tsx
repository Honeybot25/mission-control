'use client';

import { useMemo } from 'react';
import { getLevelInfo, getXPToNextLevel, getLevelProgress, LEVEL_THRESHOLDS } from '@/lib/xp-system';
import { Progress } from '@/components/ui/progress';

interface XPBarProps {
  xp: number;
  level: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function XPBar({
  xp,
  level,
  showDetails = true,
  size = 'md',
  className = '',
}: XPBarProps) {
  const progress = useMemo(() => getLevelProgress(xp), [xp]);
  const xpToNext = useMemo(() => getXPToNextLevel(xp), [xp]);
  const levelInfo = useMemo(() => getLevelInfo(level), [level]);

  const sizeClasses = {
    sm: 'h-1.5 text-xs',
    md: 'h-2 text-sm',
    lg: 'h-3 text-base',
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        {showDetails && (
          <div className="flex items-center gap-2">
            <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              L{level}
            </span>
            <span className="text-xs text-muted-foreground">
              {levelInfo.title}
            </span>
          </div>
        )}
        {showDetails && (
          <div className="text-xs text-muted-foreground">
            {xp.toLocaleString()} XP
            {xpToNext > 0 && (
              <span className="ml-1">(next: -{xpToNext.toLocaleString()})</span>
            )}
          </div>
        )}
      </div>
      
      <div className={`relative ${sizeClasses[size]}`}>
        <Progress
          value={progress}
          className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-700`}
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full px-2 text-xs text-muted-foreground opacity-0 transition-opacity hover:opacity-100"
          title={`${progress}% to level ${level + 1}`}
        >
          {progress}%
        </div>
      </div>
    </div>
  );
}

// Mini XP Bar for compact displays
export function XPBarMini({ xp, level }: { xp: number; level: number }) {
  const progress = getLevelProgress(xp);
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium">L{level}</span>
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Detailed XP Display
export function XPBarDetailed({ xp, level }: { xp: number; level: number }) {
  const progress = getLevelProgress(xp);
  const xpToNext = getXPToNextLevel(xp);
  const levelInfo = getLevelInfo(level);
  const nextLevelInfo = LEVEL_THRESHOLDS.find(l => l.level === level + 1);

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">Level {level}</div>
          <div className="text-sm text-muted-foreground">{levelInfo.title}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{xp.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total XP</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress to Level {level + 1}</span>
          <span className="text-muted-foreground">
            {xpToNext > 0 ? `${xpToNext.toLocaleString()} XP remaining` : 'Max Level'}
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{levelInfo.minXP.toLocaleString()}</span>
          <span>{(nextLevelInfo?.minXP || levelInfo.minXP).toLocaleString()}</span>
        </div>
      </div>

      {nextLevelInfo && (
        <div className="text-xs text-muted-foreground">
          Next rank: <span className="font-medium">{nextLevelInfo.title}</span>
        </div>
      )}
    </div>
  );
}

export default XPBar;