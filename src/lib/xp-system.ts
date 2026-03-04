/**
 * XP System - Experience points, levels, and achievements for agents
 * 
 * XP Values:
 * - Task created: 10 XP
 * - Task completed: 25 XP  
 * - Task failed: 5 XP
 * - Achievement unlocked: 100 XP
 * 
 * Level Progression:
 * - L1: 0-100 XP
 * - L2: 100-250 XP
 * - L3: 250-500 XP
 * - L4: 500-1000 XP
 * - L5: 1000-2000 XP
 * - L6: 2000-4000 XP
 * - L7: 4000-8000 XP
 * - L8: 8000-15000 XP
 * - L9: 15000-25000 XP
 * - L10: 25000+ XP
 */

import { supabase } from './supabase-client';

// XP Values
export const XP_VALUES = {
  TASK_CREATED: 10,
  TASK_COMPLETED: 25,
  TASK_FAILED: 5,
  ACHIEVEMENT_UNLOCKED: 100,
  DEPLOY_SUCCESS: 50,
  TRADE_PROFIT: 75,
  BUG_FIXED: 40,
  STREAK_BONUS: 20,
} as const;

// Level thresholds
export const LEVEL_THRESHOLDS = [
  { level: 1, minXP: 0, maxXP: 100, title: 'Rookie' },
  { level: 2, minXP: 100, maxXP: 250, title: 'Apprentice' },
  { level: 3, minXP: 250, maxXP: 500, title: 'Operator' },
  { level: 4, minXP: 500, maxXP: 1000, title: 'Professional' },
  { level: 5, minXP: 1000, maxXP: 2000, title: 'Expert' },
  { level: 6, minXP: 2000, maxXP: 4000, title: 'Veteran' },
  { level: 7, minXP: 4000, maxXP: 8000, title: 'Elite' },
  { level: 8, minXP: 8000, maxXP: 15000, title: 'Master' },
  { level: 9, minXP: 15000, maxXP: 25000, title: 'Grandmaster' },
  { level: 10, minXP: 25000, maxXP: Infinity, title: 'Legend' },
];

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_DEPLOY: {
    key: 'first_deploy',
    name: 'First Deploy',
    emoji: '🚀',
    description: 'Successfully deployed first application',
    condition: (stats: AgentStats) => stats.deployments >= 1,
  },
  MONEY_PRINTER: {
    key: 'money_printer',
    name: 'Money Printer',
    emoji: '💰',
    description: 'Made a profitable trade',
    condition: (stats: AgentStats) => stats.profitableTrades >= 1,
  },
  BUG_SLAYER: {
    key: 'bug_slayer',
    name: 'Bug Slayer',
    emoji: '🐛',
    description: 'Fixed a critical issue',
    condition: (stats: AgentStats) => stats.bugsFixed >= 1,
  },
  MOMENTUM: {
    key: 'momentum',
    name: 'Momentum',
    emoji: '📈',
    description: 'Completed 5 tasks in one day',
    condition: (stats: AgentStats) => stats.dailyCompletions >= 5,
  },
  NIGHT_OWL: {
    key: 'night_owl',
    name: 'Night Owl',
    emoji: '🌙',
    description: 'Completed work after midnight',
    condition: (stats: AgentStats) => stats.nightActivity >= 1,
  },
  EARLY_BIRD: {
    key: 'early_bird',
    name: 'Early Bird',
    emoji: '🌅',
    description: 'Completed work before 6 AM',
    condition: (stats: AgentStats) => stats.earlyActivity >= 1,
  },
  STREAK_WEEK: {
    key: 'streak_week',
    name: '7 Day Streak',
    emoji: '🔥',
    description: 'Active for 7 consecutive days',
    condition: (stats: AgentStats) => stats.streakDays >= 7,
  },
  STREAK_MONTH: {
    key: 'streak_month',
    name: '30 Day Streak',
    emoji: '🌟',
    description: 'Active for 30 consecutive days',
    condition: (stats: AgentStats) => stats.streakDays >= 30,
  },
  MASTER_AGENT: {
    key: 'master_agent',
    name: 'Master Agent',
    emoji: '👑',
    description: 'Reached level 10',
    condition: (stats: AgentStats) => stats.level >= 10,
  },
  TEAM_PLAYER: {
    key: 'team_player',
    name: 'Team Player',
    emoji: '🤝',
    description: 'Helped unblock another agent',
    condition: (stats: AgentStats) => stats.agentsHelped >= 1,
  },
  SPEED_DEMON: {
    key: 'speed_demon',
    name: 'Speed Demon',
    emoji: '⚡',
    description: 'Completed a task in under 5 minutes',
    condition: (stats: AgentStats) => stats.fastCompletions >= 1,
  },
} as const;

export type AchievementKey = keyof typeof ACHIEVEMENTS;

// Types
export interface AgentStats {
  deployments: number;
  profitableTrades: number;
  bugsFixed: number;
  dailyCompletions: number;
  nightActivity: number;
  earlyActivity: number;
  streakDays: number;
  level: number;
  agentsHelped: number;
  fastCompletions: number;
  totalXP: number;
}

export interface XPTransaction {
  id: string;
  agent_id: string;
  amount: number;
  reason: string;
  task_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Achievement {
  id: string;
  agent_id: string;
  badge_key: string;
  badge_name: string;
  badge_emoji: string;
  badge_description?: string;
  unlocked_at: string;
  metadata: Record<string, unknown>;
}

export interface AgentWithXP {
  id: string;
  name: string;
  slug: string;
  xp: number;
  level: number;
  total_tasks_created: number;
  total_tasks_completed: number;
  total_tasks_failed: number;
  achievements?: Achievement[];
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].minXP) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

// Get level info
export function getLevelInfo(level: number) {
  return LEVEL_THRESHOLDS.find(l => l.level === level) || LEVEL_THRESHOLDS[0];
}

// Get XP needed for next level
export function getXPToNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === currentLevel + 1);
  if (!nextLevel) return 0; // Max level
  return nextLevel.minXP - currentXP;
}

// Get progress percentage to next level
export function getLevelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const levelInfo = getLevelInfo(currentLevel);
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === currentLevel + 1);
  
  if (!nextLevel) return 100; // Max level
  
  const levelXP = xp - levelInfo.minXP;
  const levelRange = nextLevel.minXP - levelInfo.minXP;
  return Math.min(100, Math.round((levelXP / levelRange) * 100));
}

// Add XP to an agent
export async function addXP(
  agentId: string,
  amount: number,
  reason: string,
  taskId?: string,
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; newXP?: number; newLevel?: number; leveledUp?: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase.rpc('add_agent_xp', {
      p_agent_id: agentId,
      p_amount: amount,
      p_reason: reason,
      p_task_id: taskId || null,
      p_metadata: metadata,
    });

    if (error) throw error;

    return {
      success: true,
      newXP: data.new_xp,
      newLevel: data.new_level,
      leveledUp: data.leveled_up,
    };
  } catch (error) {
    console.error('[XP System] Failed to add XP:', error);
    return { success: false, error: String(error) };
  }
}

// Award XP for task events
export async function awardTaskXP(
  agentId: string,
  taskId: string,
  status: 'created' | 'completed' | 'failed',
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean }> {
  const xpAmount = status === 'created' ? XP_VALUES.TASK_CREATED :
                   status === 'completed' ? XP_VALUES.TASK_COMPLETED :
                   XP_VALUES.TASK_FAILED;
  
  const result = await addXP(
    agentId,
    xpAmount,
    `task_${status}`,
    taskId,
    { ...metadata, originalStatus: status }
  );

  return { success: result.success };
}

// Get agent with XP and achievements
export async function getAgentWithXP(agentId: string): Promise<AgentWithXP | null> {
  if (!supabase) return null;

  try {
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) return null;

    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('agent_id', agentId)
      .order('unlocked_at', { ascending: false });

    return {
      ...agent,
      achievements: achievements || [],
    };
  } catch (error) {
    console.error('[XP System] Failed to get agent:', error);
    return null;
  }
}

// Get all agents with XP for leaderboard
export async function getLeaderboard(limit: number = 10): Promise<AgentWithXP[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('xp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[XP System] Failed to get leaderboard:', error);
    return [];
  }
}

// Check and award achievements
export async function checkAchievements(agentId: string): Promise<Achievement[]> {
  if (!supabase) return [];

  const newAchievements: Achievement[] = [];

  try {
    // Get agent stats
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (!agent) return [];

    // Get agent stats from data
    const stats: AgentStats = {
      deployments: agent.total_tasks_completed || 0,
      profitableTrades: 0, // Would come from trading data
      bugsFixed: 0,
      dailyCompletions: 0,
      nightActivity: 0,
      earlyActivity: 0,
      streakDays: agent.streak_days || 0,
      level: agent.level || 1,
      agentsHelped: 0,
      fastCompletions: 0,
      totalXP: agent.xp || 0,
    };

    // Check each achievement
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (achievement.condition(stats)) {
        const { data: awarded } = await supabase.rpc('check_and_award_achievement', {
          p_agent_id: agentId,
          p_badge_key: achievement.key,
          p_badge_name: achievement.name,
          p_badge_emoji: achievement.emoji,
          p_badge_description: achievement.description,
        });

        if (awarded) {
          newAchievements.push({
            id: `new-${key}`,
            agent_id: agentId,
            badge_key: achievement.key,
            badge_name: achievement.name,
            badge_emoji: achievement.emoji,
            badge_description: achievement.description,
            unlocked_at: new Date().toISOString(),
            metadata: {},
          });
        }
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('[XP System] Failed to check achievements:', error);
    return [];
  }
}

// Get agent's achievements
export async function getAgentAchievements(agentId: string): Promise<Achievement[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('agent_id', agentId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[XP System] Failed to get achievements:', error);
    return [];
  }
}

// Get XP transaction history
export async function getXPTransactions(
  agentId: string,
  limit: number = 50
): Promise<XPTransaction[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[XP System] Failed to get transactions:', error);
    return [];
  }
}

// Format XP amount with sign
export function formatXP(amount: number): string {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount} XP`;
}

// Get XP reason display text
export function getXPReasonText(reason: string): string {
  const reasonMap: Record<string, string> = {
    'task_created': 'Task created',
    'task_completed': 'Task completed',
    'task_failed': 'Task attempted',
    'achievement_unlocked': 'Achievement unlocked',
    'deploy_success': 'Successful deployment',
    'trade_profit': 'Profitable trade',
    'bug_fixed': 'Bug fixed',
    'streak_bonus': 'Daily streak bonus',
  };
  
  return reasonMap[reason] || reason;
}

// Award deployment XP
export async function awardDeploymentXP(agentId: string, taskId: string): Promise<void> {
  await addXP(agentId, XP_VALUES.DEPLOY_SUCCESS, 'deploy_success', taskId);
  await checkAchievements(agentId);
}

// Award trading XP
export async function awardTradingXP(agentId: string, profit: number, taskId: string): Promise<void> {
  const xpAmount = Math.min(XP_VALUES.TRADE_PROFIT, Math.floor(profit / 10));
  await addXP(agentId, xpAmount, 'trade_profit', taskId, { profit });
  await checkAchievements(agentId);
}

export default {
  XP_VALUES,
  LEVEL_THRESHOLDS,
  ACHIEVEMENTS,
  calculateLevel,
  getLevelInfo,
  getXPToNextLevel,
  getLevelProgress,
  addXP,
  awardTaskXP,
  getAgentWithXP,
  getLeaderboard,
  checkAchievements,
  getAgentAchievements,
  getXPTransactions,
  formatXP,
  getXPReasonText,
  awardDeploymentXP,
  awardTradingXP,
};