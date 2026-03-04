'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { parseMentions } from '@/types/mentions';

interface MentionHighlighterProps {
  text: string;
  agentMap: Map<string, { name: string; slug: string }>;
  className?: string;
  onMentionClick?: (slug: string) => void;
}

export function MentionHighlighter({
  text,
  agentMap,
  className = "",
  onMentionClick,
}: MentionHighlighterProps) {
  const segments = useMemo(() => {
    const parts: Array<{ type: 'text' | 'mention'; content: string; slug?: string; name?: string }> = [];
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }

      // Add mention
      const slug = match[1];
      const agent = agentMap.get(slug);
      parts.push({
        type: 'mention',
        content: match[0],
        slug,
        name: agent?.name || slug,
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return parts;
  }, [text, agentMap]);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'mention') {
          const isKnown = agentMap.has(segment.slug!);
          
          if (isKnown && onMentionClick) {
            return (
              <button
                key={index}
                onClick={() => onMentionClick(segment.slug!)}
                className="inline-flex items-center gap-0.5 font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
              >
                @{segment.name}
              </button>
            );
          }

          if (isKnown) {
            return (
              <Link
                key={index}
                href={`/agents/${segment.slug}`}
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
              >
                @{segment.name}
              </Link>
            );
          }

          // Unknown mention
          return (
            <span key={index} className="text-zinc-500">
              @{segment.slug}
            </span>
          );
        }

        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
}

// Compact version for activity feed
export function MentionBadge({ text, agentMap }: { text: string; agentMap: Map<string, { name: string; slug: string }> }) {
  const mentions = parseMentions(text);
  
  if (mentions.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-2">
      {mentions.slice(0, 3).map((slug, idx) => {
        const agent = agentMap.get(slug);
        return (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400"
          >
            @{agent?.name || slug}
          </span>
        );
      })}
      {mentions.length > 3 && (
        <span className="text-xs text-zinc-500">+{mentions.length - 3}</span>
      )}
    </span>
  );
}