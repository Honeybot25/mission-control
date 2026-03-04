import { supabase } from './supabase-client';

export interface RevenueStream {
  id: string;
  name: string;
  type: 'trading' | 'product' | 'content' | 'service' | 'other';
  description: string | null;
  monthly_actual: number;
  monthly_projected: number;
  growth_rate: number; // Monthly growth rate %
  seasonality: number[]; // 12 monthly adjustment factors
  confidence: number; // 0-100
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RevenueScenario {
  id: string;
  name: string;
  type: 'conservative' | 'realistic' | 'optimistic';
  description: string | null;
  growth_multiplier: number;
  risk_adjustment: number;
  assumptions: string[];
  projections: {
    month: string;
    revenue: number;
    cumulative: number;
  }[];
  created_at: string;
}

export interface RevenueGoal {
  id: string;
  name: string;
  target_amount: number;
  deadline: string;
  current_amount: number;
  description: string | null;
  is_achieved: boolean;
  achieved_at: string | null;
  milestones: {
    percent: number;
    amount: number;
    achieved: boolean;
    achieved_at: string | null;
  }[];
  created_at: string;
  updated_at: string;
}

export interface MonthlyProjection {
  month: string;
  monthLabel: string;
  conservative: number;
  realistic: number;
  optimistic: number;
  actual?: number;
}

// Default $5K MRR goal
export const DEFAULT_REVENUE_GOAL = {
  name: '$5K MRR Target',
  target_amount: 5000,
  description: 'Reach $5,000 monthly recurring revenue across all streams'
};

// Calculate projections for all scenarios
export function calculateProjections(
  streams: RevenueStream[],
  months: number = 12
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const now = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthIndex = date.getMonth();
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    let conservativeTotal = 0;
    let realisticTotal = 0;
    let optimisticTotal = 0;
    
    for (const stream of streams.filter(s => s.is_active)) {
      const monthsElapsed = i;
      const growthFactor = Math.pow(1 + stream.growth_rate / 100, monthsElapsed);
      const seasonalityFactor = stream.seasonality[monthIndex] || 1;
      
      const baseProjection = stream.monthly_projected * growthFactor * seasonalityFactor;
      
      conservativeTotal += baseProjection * 0.7 * stream.confidence / 100;
      realisticTotal += baseProjection * stream.confidence / 100;
      optimisticTotal += baseProjection * 1.3 * (stream.confidence / 100 + 0.2);
    }
    
    projections.push({
      month: date.toISOString().split('T')[0],
      monthLabel,
      conservative: Math.round(conservativeTotal),
      realistic: Math.round(realisticTotal),
      optimistic: Math.round(optimisticTotal)
    });
  }
  
  return projections;
}

// Calculate goal progress
export function calculateGoalProgress(
  goal: RevenueGoal,
  streams: RevenueStream[]
): {
  percentComplete: number;
  monthlyNeeded: number;
  monthsRemaining: number;
  onTrack: boolean;
  projectedAchievement: string | null;
} {
  const totalCurrent = streams
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + s.monthly_actual, 0);
  
  const percentComplete = (totalCurrent / goal.target_amount) * 100;
  
  const deadline = new Date(goal.deadline);
  const now = new Date();
  const monthsRemaining = Math.max(0, 
    (deadline.getFullYear() - now.getFullYear()) * 12 + 
    (deadline.getMonth() - now.getMonth())
  );
  
  const remaining = goal.target_amount - totalCurrent;
  const monthlyNeeded = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
  
  // Check if on track based on projections
  const projections = calculateProjections(streams, monthsRemaining);
  const finalProjection = projections[projections.length - 1]?.realistic || 0;
  const onTrack = finalProjection >= goal.target_amount;
  
  // Estimate when goal will be reached
  let projectedAchievement: string | null = null;
  for (const proj of projections) {
    if (proj.realistic >= goal.target_amount) {
      projectedAchievement = proj.month;
      break;
    }
  }
  
  return {
    percentComplete: Math.round(percentComplete * 10) / 10,
    monthlyNeeded: Math.round(monthlyNeeded),
    monthsRemaining,
    onTrack,
    projectedAchievement
  };
}

// Database operations
export async function getRevenueStreams(): Promise<RevenueStream[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning sample streams');
    return getDefaultStreams();
  }

  const { data, error } = await supabase
    .from('revenue_streams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch revenue streams:', error);
    return getDefaultStreams();
  }

  return data || getDefaultStreams();
}

export async function createRevenueStream(
  stream: Omit<RevenueStream, 'id' | 'created_at' | 'updated_at'>
): Promise<RevenueStream | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot create stream');
    return null;
  }

  const { data, error } = await supabase
    .from('revenue_streams')
    .insert([stream])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create revenue stream:', error);
    return null;
  }

  return data;
}

export async function updateRevenueStream(
  id: string,
  updates: Partial<RevenueStream>
): Promise<RevenueStream | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot update stream');
    return null;
  }

  const { data, error } = await supabase
    .from('revenue_streams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to update revenue stream:', error);
    return null;
  }

  return data;
}

export async function deleteRevenueStream(id: string): Promise<boolean> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot delete stream');
    return false;
  }

  const { error } = await supabase
    .from('revenue_streams')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Failed to delete revenue stream:', error);
    return false;
  }

  return true;
}

export async function getRevenueGoals(): Promise<RevenueGoal[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning default goal');
    return [createDefaultGoal()];
  }

  const { data, error } = await supabase
    .from('revenue_goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch revenue goals:', error);
    return [createDefaultGoal()];
  }

  return data?.length ? data : [createDefaultGoal()];
}

export async function createRevenueGoal(
  goal: Omit<RevenueGoal, 'id' | 'created_at' | 'updated_at' | 'milestones'>
): Promise<RevenueGoal | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot create goal');
    return null;
  }

  const milestones = [25, 50, 75, 100].map(percent => ({
    percent,
    amount: Math.round((goal.target_amount * percent) / 100),
    achieved: false,
    achieved_at: null
  }));

  const { data, error } = await supabase
    .from('revenue_goals')
    .insert([{ ...goal, milestones }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create revenue goal:', error);
    return null;
  }

  return data;
}

export async function updateRevenueGoal(
  id: string,
  updates: Partial<RevenueGoal>
): Promise<RevenueGoal | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot update goal');
    return null;
  }

  const { data, error } = await supabase
    .from('revenue_goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to update revenue goal:', error);
    return null;
  }

  return data;
}

// Statistics
export async function getRevenueStats(): Promise<{
  totalMonthlyActual: number;
  totalMonthlyProjected: number;
  totalStreams: number;
  activeStreams: number;
  avgGrowthRate: number;
  runRate: number;
  ytdRevenue: number;
}> {
  const streams = await getRevenueStreams();
  const activeStreams = streams.filter(s => s.is_active);
  
  const totalMonthlyActual = activeStreams.reduce((sum, s) => sum + s.monthly_actual, 0);
  const totalMonthlyProjected = activeStreams.reduce((sum, s) => sum + s.monthly_projected, 0);
  
  const avgGrowthRate = activeStreams.length > 0
    ? activeStreams.reduce((sum, s) => sum + s.growth_rate, 0) / activeStreams.length
    : 0;
  
  const runRate = totalMonthlyActual * 12;
  const ytdRevenue = totalMonthlyActual * (new Date().getMonth() + 1);
  
  return {
    totalMonthlyActual,
    totalMonthlyProjected,
    totalStreams: streams.length,
    activeStreams: activeStreams.length,
    avgGrowthRate: Math.round(avgGrowthRate * 100) / 100,
    runRate: Math.round(runRate),
    ytdRevenue: Math.round(ytdRevenue)
  };
}

// Default streams for demo
function getDefaultStreams(): RevenueStream[] {
  return [
    {
      id: '1',
      name: 'Trading Profits',
      type: 'trading',
      description: 'Automated trading system profits',
      monthly_actual: 800,
      monthly_projected: 1200,
      growth_rate: 15,
      seasonality: [1, 1, 1.1, 1, 1, 0.9, 0.9, 1, 1.1, 1, 1.2, 0.8],
      confidence: 70,
      notes: 'Currently running 3 strategies',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'SaaS Product',
      type: 'product',
      description: 'Monthly subscription revenue',
      monthly_actual: 0,
      monthly_projected: 1500,
      growth_rate: 25,
      seasonality: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      confidence: 60,
      notes: 'Launch planned for Q2',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Content Revenue',
      type: 'content',
      description: 'YouTube, sponsorships, affiliates',
      monthly_actual: 200,
      monthly_projected: 500,
      growth_rate: 20,
      seasonality: [0.9, 0.9, 1, 1, 1.1, 1, 1, 1, 1.2, 1.1, 1.3, 1.2],
      confidence: 65,
      notes: 'Growing YouTube channel',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Consulting',
      type: 'service',
      description: 'One-off consulting projects',
      monthly_actual: 500,
      monthly_projected: 800,
      growth_rate: 5,
      seasonality: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      confidence: 80,
      notes: 'Steady client base',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}

function createDefaultGoal(): RevenueGoal {
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 12);
  
  return {
    id: '1',
    name: DEFAULT_REVENUE_GOAL.name,
    target_amount: DEFAULT_REVENUE_GOAL.target_amount,
    deadline: deadline.toISOString().split('T')[0],
    current_amount: 1500,
    description: DEFAULT_REVENUE_GOAL.description,
    is_achieved: false,
    achieved_at: null,
    milestones: [
      { percent: 25, amount: 1250, achieved: true, achieved_at: new Date().toISOString() },
      { percent: 50, amount: 2500, achieved: false, achieved_at: null },
      { percent: 75, amount: 3750, achieved: false, achieved_at: null },
      { percent: 100, amount: 5000, achieved: false, achieved_at: null }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function subscribeToRevenueStreams(
  callback: (payload: { new: RevenueStream; old: RevenueStream | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }

  return supabase
    .channel('revenue_streams_channel')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'revenue_streams'
      },
      (payload: { new: RevenueStream; old: RevenueStream | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Revenue streams subscription status: ${status}`);
    });
}