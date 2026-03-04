import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const knowledgeSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Artifact types
export type ArtifactType = 
  | 'note' 
  | 'insight' 
  | 'decision' 
  | 'summary' 
  | 'todo' 
  | 'hypothesis' 
  | 'plan' 
  | 'state_snapshot';

export interface KnowledgeArtifact {
  id: string;
  title: string;
  content: string;
  type: ArtifactType;
  tags: string[];
  agent?: string;
  run_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  related_artifacts?: string[];
  metadata?: Record<string, unknown>;
}

export interface ArtifactFilter {
  agent?: string;
  type?: ArtifactType;
  tags?: string[];
  created_by?: string;
  searchQuery?: string;
  timeRange?: 'today' | 'week' | 'month' | 'all';
  isPinned?: boolean;
}

// Artifact type configs for UI
export const artifactTypeConfig: Record<ArtifactType, { 
  label: string; 
  icon: string; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  note: {
    label: 'Note',
    icon: 'StickyNote',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'General notes and thoughts',
  },
  insight: {
    label: 'Insight',
    icon: 'Lightbulb',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Key discoveries and realizations',
  },
  decision: {
    label: 'Decision',
    icon: 'GitBranch',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Important decisions and rationale',
  },
  summary: {
    label: 'Summary',
    icon: 'FileText',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    description: 'Condensed information from sessions',
  },
  todo: {
    label: 'Todo',
    icon: 'CheckSquare',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    description: 'Action items and tasks',
  },
  hypothesis: {
    label: 'Hypothesis',
    icon: 'FlaskConical',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    description: 'Testable assumptions and theories',
  },
  plan: {
    label: 'Plan',
    icon: 'Map',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    description: 'Strategic plans and roadmaps',
  },
  state_snapshot: {
    label: 'State Snapshot',
    icon: 'Camera',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    description: 'System or project state captures',
  },
};

// Get all artifacts with optional filters
export async function getArtifacts(filters?: ArtifactFilter): Promise<KnowledgeArtifact[]> {
  try {
    let query = knowledgeSupabase
      .from('knowledge_artifacts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.agent) {
      query = query.eq('agent', filters.agent);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters?.isPinned !== undefined) {
      query = query.eq('is_pinned', filters.isPinned);
    }

    if (filters?.timeRange && filters.timeRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Knowledge] Fetch error:', error);
      return [];
    }

    let artifacts = data || [];

    // Filter by tags (array overlap)
    if (filters?.tags && filters.tags.length > 0) {
      artifacts = artifacts.filter(artifact => 
        filters.tags!.some(tag => artifact.tags?.includes(tag))
      );
    }

    // Filter by search query
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      artifacts = artifacts.filter(artifact =>
        artifact.title.toLowerCase().includes(query) ||
        artifact.content.toLowerCase().includes(query) ||
        artifact.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    return artifacts;
  } catch (error) {
    console.error('[Knowledge] Get artifacts error:', error);
    return [];
  }
}

// Get a single artifact by ID
export async function getArtifactById(id: string): Promise<KnowledgeArtifact | null> {
  try {
    const { data, error } = await knowledgeSupabase
      .from('knowledge_artifacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Knowledge] Fetch artifact error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Knowledge] Get artifact error:', error);
    return null;
  }
}

// Create a new artifact
export async function createArtifact(
  artifact: Omit<KnowledgeArtifact, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: KnowledgeArtifact; error?: unknown }> {
  try {
    const { data, error } = await knowledgeSupabase
      .from('knowledge_artifacts')
      .insert([artifact])
      .select()
      .single();

    if (error) {
      console.error('[Knowledge] Create artifact error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Knowledge] Create artifact error:', error);
    return { success: false, error };
  }
}

// Update an artifact
export async function updateArtifact(
  id: string,
  updates: Partial<KnowledgeArtifact>
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const { error } = await knowledgeSupabase
      .from('knowledge_artifacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[Knowledge] Update artifact error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Knowledge] Update artifact error:', error);
    return { success: false, error };
  }
}

// Delete an artifact
export async function deleteArtifact(id: string): Promise<{ success: boolean; error?: unknown }> {
  try {
    const { error } = await knowledgeSupabase
      .from('knowledge_artifacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Knowledge] Delete artifact error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Knowledge] Delete artifact error:', error);
    return { success: false, error };
  }
}

// Toggle pin status
export async function togglePinArtifact(
  id: string, 
  isPinned: boolean
): Promise<{ success: boolean; error?: unknown }> {
  return updateArtifact(id, { is_pinned: isPinned });
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  try {
    const { data, error } = await knowledgeSupabase
      .from('knowledge_artifacts')
      .select('tags');

    if (error) {
      console.error('[Knowledge] Fetch tags error:', error);
      return [];
    }

    const allTags = new Set<string>();
    data?.forEach(artifact => {
      artifact.tags?.forEach((tag: string) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  } catch (error) {
    console.error('[Knowledge] Get tags error:', error);
    return [];
  }
}

// Get all agents that have created artifacts
export async function getAllAgents(): Promise<string[]> {
  try {
    const { data, error } = await knowledgeSupabase
      .from('knowledge_artifacts')
      .select('agent');

    if (error) {
      console.error('[Knowledge] Fetch agents error:', error);
      return [];
    }

    const agents = new Set<string>();
    data?.forEach(artifact => {
      if (artifact.agent) agents.add(artifact.agent);
    });

    return Array.from(agents).sort();
  } catch (error) {
    console.error('[Knowledge] Get agents error:', error);
    return [];
  }
}

// Subscribe to realtime updates
export function subscribeToArtifacts(callback: (payload: KnowledgeArtifact) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePayload = (payload: { new: KnowledgeArtifact }) => {
    callback(payload.new);
  };

  return knowledgeSupabase
    .channel('knowledge_artifacts_channel')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'knowledge_artifacts' }, handlePayload as any)
    .subscribe();
}
