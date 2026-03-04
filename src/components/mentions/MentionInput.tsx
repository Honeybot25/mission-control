'use client';

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { MentionDropdown } from './MentionDropdown';
import { MentionSuggestion, parseMentions, TEAM_MENTIONS } from '@/types/mentions';
import { Agent } from '@/lib/supabase-client';

interface MentionInputProps {
  agents: Agent[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  onSubmit?: () => void;
}

export function MentionInput({
  agents,
  value,
  onChange,
  placeholder = "Type @ to mention agents...",
  className = "",
  rows = 3,
  disabled = false,
  onSubmit,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(0);

  // Get all mention suggestions (agents + teams)
  const allSuggestions: MentionSuggestion[] = [
    ...TEAM_MENTIONS,
    ...agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      type: 'agent' as const,
    })),
  ];

  // Filter suggestions based on search query
  const filteredSuggestions = searchQuery
    ? allSuggestions.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allSuggestions;

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.slice(0, newCursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
    
    if (mentionMatch) {
      setSearchQuery(mentionMatch[1]);
      setMentionStart(newCursorPos - mentionMatch[0].length);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setSearchQuery("");
    }
  };

  // Handle mention selection
  const handleSelectMention = useCallback((suggestion: MentionSuggestion) => {
    if (!textareaRef.current) return;

    const beforeMention = value.slice(0, mentionStart);
    const afterCursor = value.slice(cursorPosition);
    const mentionText = suggestion.type === 'agent' 
      ? `@${suggestion.slug} `
      : `@${suggestion.slug} `;
    
    const newValue = beforeMention + mentionText + afterCursor;
    onChange(newValue);
    
    setShowDropdown(false);
    setSearchQuery("");
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionStart + mentionText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [value, mentionStart, cursorPosition, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 resize-none ${className}`}
      />
      
      {showDropdown && (
        <MentionDropdown
          suggestions={filteredSuggestions}
          onSelect={handleSelectMention}
          searchQuery={searchQuery}
        />
      )}
      
      <div className="mt-2 text-xs text-zinc-500">
        Type <span className="text-indigo-400">@</span> to mention agents or teams
        {parseMentions(value).length > 0 && (
          <span className="ml-2 text-indigo-400">
            Will notify: {parseMentions(value).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}