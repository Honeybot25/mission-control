'use client';

import { useState } from 'react';
import { Achievement, ACHIEVEMENTS } from '@/lib/xp-system';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showTooltip = true,
  className,
}: AchievementBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  const badgeContent = (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30',
        'border-2 border-amber-300 dark:border-amber-600',
        'shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30',
        'transition-all duration-300 ease-out',
        'hover:scale-110 hover:shadow-xl',
        'cursor-pointer',
        sizeClasses[size],
        isAnimating && 'animate-bounce',
        className
      )}
      onClick={() => setIsAnimating(true)}
      onAnimationEnd={() => setIsAnimating(false)}
    >
      <span className="select-none">{achievement.badge_emoji}</span>
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
    </div>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{achievement.badge_name}</div>
            {achievement.badge_description && (
              <div className="text-xs text-muted-foreground">
                {achievement.badge_description}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Locked achievement badge (grayed out)
export function LockedAchievementBadge({
  badgeKey,
  size = 'md',
}: {
  badgeKey: keyof typeof ACHIEVEMENTS;
  size?: 'sm' | 'md' | 'lg';
}) {
  const badge = ACHIEVEMENTS[badgeKey];
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              'bg-gray-100 dark:bg-gray-800',
              'border-2 border-gray-200 dark:border-gray-700',
              'opacity-50 grayscale',
              'transition-all duration-300',
              'hover:opacity-70',
              sizeClasses[size]
            )}
          >
            <span className="select-none">{badge.emoji}</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gray-400 transform rotate-45" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-semibold text-sm">{badge.name}</div>
            <div className="text-xs text-muted-foreground">{badge.description}</div>
            <div className="text-xs text-amber-500">🔒 Locked</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Achievement showcase/grid
interface AchievementShowcaseProps {
  achievements: Achievement[];
  showLocked?: boolean;
  columns?: 3 | 4 | 5;
}

export function AchievementShowcase({
  achievements,
  showLocked = true,
  columns = 5,
}: AchievementShowcaseProps) {
  const earnedKeys = new Set(achievements.map(a => a.badge_key));
  const allBadgeKeys = Object.keys(ACHIEVEMENTS) as (keyof typeof ACHIEVEMENTS)[];
  const gridCols = columns === 3 ? 'grid-cols-3' : columns === 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Achievements</h3>
      <div className={`grid ${gridCols} gap-4`}>
        {achievements.map((achievement) => (
          <div key={achievement.id} className="flex justify-center">
            <AchievementBadge achievement={achievement} size="lg" />
          </div>
        ))}
        
        {showLocked &&
          allBadgeKeys
            .filter(key => !earnedKeys.has(key))
            .map((key) => (
              <div key={key} className="flex justify-center">
                <LockedAchievementBadge badgeKey={key} size="lg" />
              </div>
            ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        {achievements.length} / {allBadgeKeys.length} unlocked
      </div>
    </div>
  );
}

// New achievement notification
export function NewAchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: Achievement;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-card border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-4">
          <AchievementBadge achievement={achievement} size="lg" showTooltip={false} />
          <div className="flex-1 space-y-1">
            <div className="font-semibold text-sm">Achievement Unlocked!</div>
            <div className="text-lg font-bold">{achievement.badge_name}</div>
            {achievement.badge_description && (
              <div className="text-xs text-muted-foreground">
                {achievement.badge_description}
              </div>
            )}
            <div className="text-xs text-green-500 font-medium">+100 XP</div>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default AchievementBadge;