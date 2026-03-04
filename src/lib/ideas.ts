import { supabase } from './supabase-client';

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  category: 'trading' | 'product' | 'content' | 'automation' | 'research' | 'other';
  priority_score: number; // 0-100
  status: 'ideation' | 'validated' | 'in-progress' | 'implemented' | 'abandoned';
  estimated_revenue: number | null; // Monthly revenue estimate
  effort_level: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  tags: string[];
  ai_analysis: {
    market_opportunity: string;
    competitive_landscape: string;
    risks: string[];
    next_steps: string[];
    similar_products: string[];
  } | null;
  related_ideas: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaFilters {
  category?: Idea['category'];
  status?: Idea['status'];
  effort?: Idea['effort_level'];
  minPriority?: number;
  search?: string;
}

// AI-powered category detection
export function detectCategory(input: string): Idea['category'] {
  const lower = input.toLowerCase();
  
  const categoryKeywords: Record<Idea['category'], string[]> = {
    trading: ['trade', 'strategy', 'backtest', 'indicator', 'crypto', 'forex', 'stock', 'chart', 'signal', 'position', 'profit', 'loss'],
    product: ['app', 'website', 'tool', 'platform', 'saas', 'dashboard', 'api', 'service', 'integration'],
    content: ['video', 'blog', 'tweet', 'content', 'channel', 'audience', 'viral', 'tutorial', 'course'],
    automation: ['bot', 'cron', 'schedule', 'automate', 'workflow', 'pipeline', 'script', 'agent'],
    research: ['study', 'analysis', 'research', 'report', 'data', 'survey', 'experiment'],
    other: []
  };
  
  let maxScore = 0;
  let detectedCategory: Idea['category'] = 'other';
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category as Idea['category'];
    }
  }
  
  return detectedCategory;
}

// AI-powered priority scoring
export function calculatePriorityScore(
  description: string,
  estimatedRevenue: number | null,
  effort: Idea['effort_level']
): number {
  let score = 50; // Base score
  
  // Revenue impact (0-30 points)
  if (estimatedRevenue) {
    if (estimatedRevenue > 10000) score += 30;
    else if (estimatedRevenue > 5000) score += 25;
    else if (estimatedRevenue > 1000) score += 20;
    else if (estimatedRevenue > 500) score += 15;
    else score += 10;
  }
  
  // Effort adjustment (easier = higher score)
  const effortMultiplier: Record<Idea['effort_level'], number> = {
    low: 1.2,
    medium: 1.0,
    high: 0.8
  };
  score *= effortMultiplier[effort];
  
  // Strategic keywords boost (0-20 points)
  const strategicKeywords = [
    'automated', 'passive', 'scalable', 'recurring', 'high-margin',
    'compound', 'viral', 'evergreen', 'api', 'saas'
  ];
  const keywordMatches = strategicKeywords.filter(kw => 
    description.toLowerCase().includes(kw)
  ).length;
  score += Math.min(keywordMatches * 3, 20);
  
  return Math.min(Math.round(score), 100);
}

// Generate AI analysis for an idea
export function generateAIAnalysis(title: string, description: string): Idea['ai_analysis'] {
  const category = detectCategory(description);
  
  const analyses: Record<Idea['category'], Partial<Idea['ai_analysis']>> = {
    trading: {
      market_opportunity: 'Trading strategies can generate immediate revenue but require capital and carry risk.',
      competitive_landscape: 'Many trading tools exist, but custom strategies can provide edge.',
      risks: ['Market volatility', 'Overfitting to historical data', 'Capital requirements'],
      next_steps: ['Backtest on historical data', 'Paper trade for 30 days', 'Define risk management rules'],
      similar_products: ['TradingView strategies', 'QuantConnect algorithms', 'Custom Trading Bots']
    },
    product: {
      market_opportunity: 'Digital products can scale to $10K+ MRR with strong unit economics.',
      competitive_landscape: 'Competitive but differentiation through niche focus is possible.',
      risks: ['Development time', 'Market fit uncertainty', 'Customer acquisition costs'],
      next_steps: ['Validate with 10 potential users', 'Build MVP', 'Set up landing page'],
      similar_products: ['SaaS tools in adjacent markets', 'Open source alternatives', 'Manual solutions']
    },
    content: {
      market_opportunity: 'Content compounds over time and can drive product awareness.',
      competitive_landscape: 'Saturated but authenticity and consistency win.',
      risks: ['Slow initial growth', 'Algorithm changes', 'Time investment'],
      next_steps: ['Define target audience', 'Create content calendar', 'Set up distribution channels'],
      similar_products: ['YouTube channels', 'Newsletters', 'Twitter accounts in niche']
    },
    automation: {
      market_opportunity: 'Automation saves time and reduces errors, compounding value over time.',
      competitive_landscape: 'Many general tools exist; custom solutions have higher value.',
      risks: ['Maintenance overhead', 'Edge cases', 'Dependency on external APIs'],
      next_steps: ['Map current manual process', 'Identify automation opportunities', 'Build MVP script'],
      similar_products: ['Zapier integrations', 'n8n workflows', 'Custom scripts']
    },
    research: {
      market_opportunity: 'Research can inform better decisions and uncover hidden opportunities.',
      competitive_landscape: 'Academic and industry research exists; synthesis is valuable.',
      risks: ['Time intensive', 'May not yield actionable insights', 'Rapidly changing landscape'],
      next_steps: ['Define research questions', 'Identify data sources', 'Set timeline'],
      similar_products: ['Industry reports', 'Academic papers', 'Market analysis tools']
    },
    other: {
      market_opportunity: 'Opportunity depends on specific implementation details.',
      competitive_landscape: 'Needs further analysis.',
      risks: ['Unknown variables', 'Execution risk'],
      next_steps: ['Define scope more clearly', 'Research similar implementations'],
      similar_products: []
    }
  };
  
  const baseAnalysis = analyses[category];
  
  return {
    market_opportunity: baseAnalysis?.market_opportunity || '',
    competitive_landscape: baseAnalysis?.competitive_landscape || '',
    risks: baseAnalysis?.risks || [],
    next_steps: baseAnalysis?.next_steps || [],
    similar_products: baseAnalysis?.similar_products || []
  };
}

// Database operations
export async function getIdeas(filters?: IdeaFilters, limit: number = 50): Promise<Idea[]> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, returning empty ideas list');
    return [];
  }

  let query = supabase
    .from('ideas')
    .select('*')
    .order('priority_score', { ascending: false })
    .limit(limit);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.effort) {
    query = query.eq('effort_level', filters.effort);
  }
  if (filters?.minPriority) {
    query = query.gte('priority_score', filters.minPriority);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Failed to fetch ideas:', error);
    return [];
  }

  return data || [];
}

export async function getIdeaById(id: string): Promise<Idea | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot fetch idea');
    return null;
  }

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Supabase] Failed to fetch idea:', error);
    return null;
  }

  return data;
}

export async function createIdea(
  title: string,
  description: string,
  options: {
    estimatedRevenue?: number;
    effortLevel?: Idea['effort_level'];
    tags?: string[];
  } = {}
): Promise<Idea | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot create idea');
    return null;
  }

  const category = detectCategory(description);
  const effort = options.effortLevel || 'medium';
  const priorityScore = calculatePriorityScore(description, options.estimatedRevenue || null, effort);
  const aiAnalysis = generateAIAnalysis(title, description);

  const { data, error } = await supabase
    .from('ideas')
    .insert([{
      title,
      description,
      category,
      priority_score: priorityScore,
      status: 'ideation',
      estimated_revenue: options.estimatedRevenue || null,
      effort_level: effort,
      confidence: 50,
      tags: options.tags || extractTags(description),
      ai_analysis: aiAnalysis,
      related_ideas: [],
      notes: null
    }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to create idea:', error);
    return null;
  }

  return data;
}

export async function updateIdea(
  id: string,
  updates: Partial<Idea>
): Promise<Idea | null> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot update idea');
    return null;
  }

  // Recalculate priority if relevant fields change
  if (updates.description || updates.estimated_revenue !== undefined || updates.effort_level) {
    const { data: current } = await supabase.from('ideas').select('*').eq('id', id).single();
    if (current) {
      updates.priority_score = calculatePriorityScore(
        updates.description || current.description || '',
        updates.estimated_revenue !== undefined ? updates.estimated_revenue : current.estimated_revenue,
        updates.effort_level || current.effort_level
      );
    }
  }

  const { data, error } = await supabase
    .from('ideas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Failed to update idea:', error);
    return null;
  }

  return data;
}

export async function deleteIdea(id: string): Promise<boolean> {
  if (!supabase) {
    console.warn('[Supabase] Not configured, cannot delete idea');
    return false;
  }

  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Failed to delete idea:', error);
    return false;
  }

  return true;
}

export function subscribeToIdeas(
  callback: (payload: { new: Idea; old: Idea | null; event: string }) => void
) {
  if (!supabase) {
    console.warn('[Supabase] Not configured, realtime disabled');
    return { unsubscribe: () => {} };
  }

  return supabase
    .channel('ideas_channel')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'ideas'
      },
      (payload: { new: Idea; old: Idea | null; event: string }) => {
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Ideas subscription status: ${status}`);
    });
}

// Statistics
export async function getIdeaStats(): Promise<{
  total: number;
  byCategory: Record<Idea['category'], number>;
  byStatus: Record<Idea['status'], number>;
  highPriority: number;
  potentialRevenue: number;
}> {
  if (!supabase) {
    return {
      total: 0,
      byCategory: { trading: 0, product: 0, content: 0, automation: 0, research: 0, other: 0 },
      byStatus: { ideation: 0, validated: 0, 'in-progress': 0, implemented: 0, abandoned: 0 },
      highPriority: 0,
      potentialRevenue: 0
    };
  }

  const { data, error } = await supabase
    .from('ideas')
    .select('category, status, priority_score, estimated_revenue');

  if (error || !data) {
    console.error('[Supabase] Failed to fetch idea stats:', error);
    return {
      total: 0,
      byCategory: { trading: 0, product: 0, content: 0, automation: 0, research: 0, other: 0 },
      byStatus: { ideation: 0, validated: 0, 'in-progress': 0, implemented: 0, abandoned: 0 },
      highPriority: 0,
      potentialRevenue: 0
    };
  }

  const stats = {
    total: data.length,
    byCategory: { trading: 0, product: 0, content: 0, automation: 0, research: 0, other: 0 },
    byStatus: { ideation: 0, validated: 0, 'in-progress': 0, implemented: 0, abandoned: 0 },
    highPriority: 0,
    potentialRevenue: 0
  };

  for (const idea of data) {
    stats.byCategory[idea.category as Idea['category']]++;
    stats.byStatus[idea.status as Idea['status']]++;
    if (idea.priority_score >= 70) stats.highPriority++;
    if (idea.estimated_revenue) stats.potentialRevenue += idea.estimated_revenue;
  }

  return stats;
}

function extractTags(description: string): string[] {
  const tags: string[] = [];
  const lower = description.toLowerCase();
  
  const tagKeywords: Record<string, string[]> = {
    'ai': ['ai', 'artificial intelligence', 'ml', 'machine learning', 'llm', 'gpt'],
    'automation': ['automate', 'bot', 'script', 'cron'],
    'crypto': ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft'],
    'saas': ['saas', 'subscription', 'recurring'],
    'api': ['api', 'integration', 'webhook'],
    'mobile': ['app', 'ios', 'android', 'mobile'],
    'content': ['video', 'youtube', 'blog', 'twitter', 'content'],
    'analytics': ['analytics', 'data', 'tracking', 'metrics']
  };
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      tags.push(tag);
    }
  }
  
  return tags;
}