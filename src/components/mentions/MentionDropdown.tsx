'use client';

import { useState, useEffect, useRef } from 'react';
import { MentionSuggestion } from '@/types/mentions';
import { Bot, Users, Globe, Hash } from 'lucide-react';

interface MentionDropdownProps {
  suggestions: MentionSuggestion[];
  onSelect: (suggestion: MentionSuggestion) => void;
  searchQuery: string;
}

export function MentionDropdown({ suggestions, onSelect, searchQuery }: MentionDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length, searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // Parent should handle closing
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, onSelect]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem && dropdownRef.current) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Group suggestions by type
  const grouped = suggestions.reduce((acc, suggestion) => {
    const key = suggestion.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(suggestion);
    return acc;
  }, {} as Record<string, MentionSuggestion[]>);

  const typeOrder = ['all', 'team', 'agent'];
  const typeLabels: Record<string, string> = {
    all: 'Everyone',
    team: 'Teams',
    agent: 'Agents',
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'all':
        return <Globe size={16} className="text-indigo-400" />;
      case 'team':
        return <Users size={16} className="text-purple-400" />;
      default:
        return <Bot size={16} className="text-blue-400" />;
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className="absolute z-50 mt-1 w-64 bg-zinc-800 border border-white/10 rounded-lg shadow-xl py-2">
        <div className="px-3 py-2 text-sm text-zinc-500 text-center">
          No matches found
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-72 bg-zinc-800 border border-white/10 rounded-lg shadow-xl max-h-64 overflow-y-auto"
    >
      {typeOrder.map((type) => {
        const groupItems = grouped[type];
        if (!groupItems || groupItems.length === 0) return null;

        return (
          <div key={type}>
            <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider bg-zinc-900/50">
              {typeLabels[type]}
            </div>
            {groupItems.map((suggestion, idx) => {
              const globalIndex = suggestions.findIndex(s => s.id === suggestion.id);
              const isSelected = globalIndex === selectedIndex;

              return (
                <button
                  key={suggestion.id}
                  ref={el => { itemRefs.current[globalIndex] = el; }}
                  onClick={() => onSelect(suggestion)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {getIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{suggestion.name}</div>
                    <div className={`text-xs truncate ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>
                      @{suggestion.slug}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-indigo-200">↵</span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}