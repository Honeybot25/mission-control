// Types for notifications, mentions, and task threads

export interface Notification {
  id: string;
  recipient_agent_id: string;
  sender_agent_id: string | null;
  type: 'mention' | 'reply' | 'task_assigned' | 'task_completed' | 'system';
  title: string;
  message: string;
  link_to: string | null;
  related_task_id: string | null;
  related_comment_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  sender?: {
    id: string;
    name: string;
    slug: string;
  };
  related_task?: {
    id: string;
    input_summary: string;
    status: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_agent_id: string | null;
  parent_comment_id: string | null;
  content: string;
  mentions: string[]; // Array of agent_ids mentioned
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  author?: {
    id: string;
    name: string;
    slug: string;
  };
  replies?: TaskComment[];
  reply_count?: number;
}

export interface MentionSuggestion {
  id: string;
  name: string;
  slug: string;
  type: 'agent' | 'team' | 'all';
  avatar?: string;
}

export const TEAM_MENTIONS: MentionSuggestion[] = [
  { id: '@all', name: 'All Agents', slug: 'all', type: 'all' },
  { id: '@trading-team', name: 'Trading Team', slug: 'trading-team', type: 'team' },
  { id: '@product-team', name: 'Product Team', slug: 'product-team', type: 'team' },
  { id: '@content-team', name: 'Content Team', slug: 'content-team', type: 'team' },
];

// Parse @mentions from text
export function parseMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return Array.from(new Set(mentions)); // Remove duplicates
}

// Replace mentions with styled spans (for display)
export function highlightMentions(text: string, agentMap: Map<string, string>): string {
  return text.replace(/@([a-zA-Z0-9_-]+)/g, (match, slug) => {
    const agentName = agentMap.get(slug);
    if (agentName) {
      return `<span class="mention-highlight" data-agent="${slug}">@${agentName}</span>`;
    }
    return match;
  });
}

// Check if text has mentions
export function hasMentions(text: string): boolean {
  return /@([a-zA-Z0-9_-]+)/.test(text);
}

// Extract mentions from comment content and return array of agent slugs
export function extractMentionSlugs(content: string): string[] {
  return parseMentions(content).filter(slug => !TEAM_MENTIONS.some(t => t.slug === slug));
}