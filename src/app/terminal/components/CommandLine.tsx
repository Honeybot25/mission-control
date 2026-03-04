'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTerminalStore } from '../store';

interface Suggestion {
  text: string;
  type: 'command' | 'symbol' | 'timeframe';
  description?: string;
}

// Available commands with descriptions
const AVAILABLE_COMMANDS: Suggestion[] = [
  { text: 'SPY', type: 'symbol', description: 'S&P 500 ETF' },
  { text: 'SPX', type: 'symbol', description: 'S&P 500 Index' },
  { text: 'QQQ', type: 'symbol', description: 'NASDAQ-100 ETF' },
  { text: 'IWM', type: 'symbol', description: 'Russell 2000 ETF' },
  { text: 'AAPL', type: 'symbol', description: 'Apple Inc.' },
  { text: 'MSFT', type: 'symbol', description: 'Microsoft Corp.' },
  { text: 'TSLA', type: 'symbol', description: 'Tesla Inc.' },
  { text: 'NVDA', type: 'symbol', description: 'NVIDIA Corp.' },
  { text: 'GOOGL', type: 'symbol', description: 'Alphabet Inc.' },
  { text: 'AMZN', type: 'symbol', description: 'Amazon.com Inc.' },
  { text: 'META', type: 'symbol', description: 'Meta Platforms Inc.' },
  { text: 'BTC', type: 'symbol', description: 'Bitcoin USD' },
  { text: 'ETH', type: 'symbol', description: 'Ethereum USD' },
  { text: 'SQ', type: 'symbol', description: 'Block Inc.' },
  { text: 'HELP', type: 'command', description: 'Show available commands' },
  { text: 'TICKER', type: 'command', description: 'Load ticker symbol' },
  { text: 'ADD', type: 'command', description: 'Add symbol to watchlist' },
  { text: 'REMOVE', type: 'command', description: 'Remove from watchlist' },
  { text: 'EXPORT', type: 'command', description: 'Export data' },
  { text: 'CLEAR', type: 'command', description: 'Clear terminal' },
  { text: 'TIME', type: 'command', description: 'Change timeframe' },
  { text: 'UPDATE', type: 'command', description: 'Refresh quotes' },
  { text: '1D', type: 'timeframe', description: '1 Day view' },
  { text: '1W', type: 'timeframe', description: '1 Week view' },
  { text: '1M', type: 'timeframe', description: '1 Month view' },
  { text: '3M', type: 'timeframe', description: '3 Month view' },
  { text: '1Y', type: 'timeframe', description: '1 Year view' },
];

// Keyboard shortcuts help
const KEYBOARD_SHORTCUTS = [
  { key: 'Tab', action: 'Cycle panels' },
  { key: 'Enter', action: 'Execute command' },
  { key: 'Esc', action: 'Clear input' },
  { key: '↑↓', action: 'History' },
];

// Quick hint categories
const HINT_CATEGORIES = [
  { label: 'F1', text: 'HELP', hint: ':symbols | :signals | :export' },
];

export const CommandLine: React.FC = () => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { executeCommand, commandHistory, layout, setPanel } = useTerminalStore();

  const panels: Array<keyof typeof layout> = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  const panelNames = ['EQUITY', 'CHART', 'WATCHLIST', 'NEWS'];

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep focus on input
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Don't steal focus if clicking on a suggestion or hint
      if (containerRef.current?.contains(e.target as Node)) {
        return;
      }
      inputRef.current?.focus();
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Generate suggestions based on input
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const upperInput = input.toUpperCase();
    const matches = AVAILABLE_COMMANDS.filter(
      (cmd) =>
        cmd.text.startsWith(upperInput) ||
        cmd.description?.toUpperCase().includes(upperInput)
    ).slice(0, 8);

    setSuggestions(matches);
    setSelectedSuggestion(0);
    setShowSuggestions(matches.length > 0);
  }, [input]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        executeCommand(input);
        setInput('');
        setHistoryIndex(-1);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [input, executeCommand]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape: Clear input
      if (e.key === 'Escape') {
        e.preventDefault();
        setInput('');
        setHistoryIndex(-1);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Tab: Cycle panels or accept suggestion
      if (e.key === 'Tab') {
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          // Accept selected suggestion
          const suggestion = suggestions[selectedSuggestion];
          if (suggestion.type === 'command') {
            setInput(suggestion.text + ' ');
          } else {
            setInput(suggestion.text);
          }
          setShowSuggestions(false);
        } else {
          // Cycle panels
          const nextIndex = (activePanelIndex + 1) % panels.length;
          setActivePanelIndex(nextIndex);

          // Visual feedback - could highlight the panel
          const panelEl = document.querySelector(`[data-panel="${panels[nextIndex]}"]`) as HTMLElement;
          panelEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Arrow Up: History or suggestions
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          setSelectedSuggestion((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        } else if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
        }
        return;
      }

      // Arrow Down: History or suggestions
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (showSuggestions && suggestions.length > 0) {
          setSelectedSuggestion((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        } else if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
        } else {
          setHistoryIndex(-1);
          setInput('');
        }
        return;
      }

      // Enter: If suggestions showing, select highlighted
      if (e.key === 'Enter' && showSuggestions && suggestions.length > 0) {
        const suggestion = suggestions[selectedSuggestion];
        if (suggestion) {
          e.preventDefault();
          if (suggestion.type === 'command') {
            setInput(suggestion.text + ' ');
          } else {
            executeCommand(suggestion.text);
            setInput('');
            setShowSuggestions(false);
          }
        }
      }

      // F1: Show help
      if (e.key === 'F1') {
        e.preventDefault();
        executeCommand('HELP');
        setInput('');
      }
    },
    [
      activePanelIndex,
      commandHistory,
      executeCommand,
      historyIndex,
      panels,
      selectedSuggestion,
      showSuggestions,
      suggestions,
    ]
  );

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'command') {
      if (suggestion.text === 'HELP') {
        executeCommand('HELP');
        setInput('');
      } else {
        setInput(suggestion.text + ' ');
        inputRef.current?.focus();
      }
    } else {
      executeCommand(suggestion.text);
      setInput('');
    }
    setShowSuggestions(false);
  };

  const handleHintClick = (hint: string) => {
    if (hint.startsWith(':')) {
      // Special hints
      switch (hint) {
        case ':symbols':
          executeCommand('SYMBOLS');
          break;
        case ':signals':
          executeCommand('SIGNALS');
          break;
        case ':export':
          executeCommand('EXPORT');
          break;
        default:
          setInput(hint.replace(':', ''));
      }
    } else {
      executeCommand(hint);
    }
    setInput('');
    inputRef.current?.focus();
  };

  // Get recent commands for display
  const recentCommands = commandHistory.slice(-3);

  return (
    <div
      ref={containerRef}
      className="bg-black border-t border-[#333] font-mono text-sm relative"
    >
      {/* Keyboard Shortcuts Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a0a] border-b border-[#222]">
        <div className="flex items-center gap-4">
          {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
            <div key={shortcut.key} className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#222] text-[#FF9900] text-[10px] rounded border border-[#333] min-w-[20px] text-center">
                {shortcut.key}
              </kbd>
              <span className="text-[#666] text-[10px]">{shortcut.action}</span>
              {idx < KEYBOARD_SHORTCUTS.length - 1 && (
                <span className="text-[#333] ml-2">|</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-[#444] text-[10px]">
          PANEL: <span className="text-[#FF9900]">{panelNames[activePanelIndex]}</span>
        </div>
      </div>

      {/* Command History Display */}
      {recentCommands.length > 0 && (
        <div className="px-3 py-1.5 space-y-0.5 bg-[#0a0a0a] border-b border-[#222]">
          {recentCommands.map((cmd, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              <span className="text-[#333]">
                {commandHistory.length - recentCommands.length + idx + 1}
              </span>
              <span className="text-[#FF9900]">›</span>
              <span className="text-[#666]">{cmd}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Area */}
      <div className="p-3">
        <form onSubmit={handleSubmit} className="relative">
          {/* Bloomberg-style amber glow container */}
          <div
            className={`
              relative flex items-center
              bg-[#111] border rounded transition-all duration-200
              ${
                isFocused
                  ? 'border-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.3),inset_0_0_10px_rgba(255,153,0,0.05)]'
                  : 'border-[#333] hover:border-[#444]'
              }
            `}
          >
            {/* Prompt character */}
            <span
              className={`
                pl-3 pr-2 font-bold text-lg transition-colors duration-200
                ${isFocused ? 'text-[#FF9900]' : 'text-[#666]'}
              `}
            >
              ›
            </span>

            {/* Main input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="
                flex-1 bg-transparent border-none outline-none
                text-[#00FF00] font-mono text-sm uppercase
                placeholder-[#444] py-2.5
              "
              placeholder="Type: SPY, SPY GEX, HELP, EXPORT..."
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoFocus
            />

            {/* Blinking cursor indicator */}
            <span
              className={`
                pr-3 text-lg transition-all duration-200
                ${isFocused ? 'text-[#FF9900] animate-pulse' : 'text-[#333]'}
              `}
            >
              ▊
            </span>
          </div>

          {/* Auto-complete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50">
              <div className="bg-[#111] border border-[#333] rounded shadow-2xl overflow-hidden">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2
                      text-left transition-all duration-150
                      ${
                        idx === selectedSuggestion
                          ? 'bg-[#FF9900]/20 border-l-2 border-l-[#FF9900]'
                          : 'hover:bg-[#222] border-l-2 border-l-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`
                          text-xs font-bold px-1.5 py-0.5 rounded
                          ${
                            suggestion.type === 'symbol'
                              ? 'bg-[#00FF00]/20 text-[#00FF00]'
                              : suggestion.type === 'command'
                              ? 'bg-[#FF9900]/20 text-[#FF9900]'
                              : 'bg-[#00FFFF]/20 text-[#00FFFF]'
                          }
                        `}
                      >
                        {suggestion.type === 'symbol'
                          ? 'SYM'
                          : suggestion.type === 'command'
                          ? 'CMD'
                          : 'TF'}
                      </span>
                      <span
                        className={`
                          font-mono text-sm
                          ${
                            idx === selectedSuggestion
                              ? 'text-[#FF9900]'
                              : 'text-white'
                          }
                        `}
                      >
                        {suggestion.text}
                      </span>
                    </div>
                    {suggestion.description && (
                      <span className="text-[#666] text-xs">
                        {suggestion.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="text-[#444] text-[10px] mt-1 px-1">
                ↑↓ to navigate • Enter to select • Tab to accept
              </div>
            </div>
          )}
        </form>

        {/* Command Hints Bar */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {HINT_CATEGORIES.map((cat) => (
              <React.Fragment key={cat.label}>
                <button
                  onClick={() => handleHintClick(cat.text)}
                  className="
                    flex items-center gap-1.5 px-2 py-1
                    bg-[#1a1a1a] hover:bg-[#222]
                    border border-[#333] hover:border-[#FF9900]/50
                    rounded transition-all duration-150
                    group
                  "
                >
                  <kbd className="text-[9px] px-1 py-0.5 bg-[#222] text-[#FF9900] rounded">
                    {cat.label}
                  </kbd>
                  <span className="text-[#888] group-hover:text-[#FF9900] text-[11px] transition-colors">
                    {cat.text}
                  </span>
                </button>
                <span className="text-[#333]">|</span>
                {cat.hint.split(' | ').map((h) => (
                  <button
                    key={h}
                    onClick={() => handleHintClick(h.trim())}
                    className="
                      text-[11px] text-[#666] hover:text-[#FF9900]
                      transition-colors cursor-pointer
                    "
                  >
                    {h.trim()}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Quick command chips */}
          <div className="flex items-center gap-2">
            {['SPY', 'QQQ', 'BTC'].map((sym) => (
              <button
                key={sym}
                onClick={() => {
                  executeCommand(sym);
                  setInput('');
                }}
                className="
                  px-2 py-0.5 bg-[#222] hover:bg-[#FF9900]/20
                  border border-[#333] hover:border-[#FF9900]/50
                  rounded text-[10px] text-[#888] hover:text-[#FF9900]
                  transition-all duration-150
                "
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Context-Aware Hints */}
      {input.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 text-[10px] text-[#444]">
            <span>Try:</span>
            {input.length < 3 ? (
              <>
                <span className="text-[#666]">SPY</span>
                <span className="text-[#666]">SPX</span>
                <span className="text-[#666]">SQ</span>
              </>
            ) : input.toUpperCase().startsWith('HE') ? (
              <>
                <span className="text-[#FF9900]">HELP</span>
                <span className="text-[#666]">for all commands</span>
              </>
            ) : input.toUpperCase().startsWith('SP') ? (
              <>
                <span className="text-[#FF9900]">SPY</span>
                <span className="text-[#FF9900]">SPX</span>
                <span className="text-[#666]">SPY GEX</span>
              </>
            ) : (
              <>
                <span className="text-[#666]">Press Enter to execute</span>
                <span className="text-[#666]">Tab for suggestions</span>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
