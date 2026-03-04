'use client';

import React, { useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { TerminalLayout } from './components/TerminalLayout';
import { CommandLine } from './components/CommandLine';
import { Ticker } from './components/Ticker';
import { useTerminalStore } from './store';

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function TerminalPage() {
  const { updateQuotes, lastUpdate } = useTerminalStore();

  // Auto-update quotes every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      updateQuotes();
    }, 3000);

    return () => clearInterval(interval);
  }, [updateQuotes]);

  return (
    <div className={`h-screen flex flex-col bg-black overflow-hidden ${jetbrainsMono.variable} font-mono`}>
      {/* Terminal Header */}
      <header className="bg-black border-b border-[#333] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FF9900]" />
            <h1 className="text-[#FF9900] font-mono text-lg font-bold tracking-wider">
              BLOOMBERG
            </h1>
          </div>
          <span className="text-[#666] font-mono text-xs">
            TERMINAL v26.2
          </span>
        </div>
        
        <div className="flex items-center gap-6 font-mono text-xs">
          <div className="text-[#888]">
            USER: <span className="text-[#00FF00]">TRADER_01</span>
          </div>
          <div className="text-[#888]">
            STATUS: <span className="text-[#00FF00]">CONNECTED</span>
          </div>
          <div className="text-[#666]">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
      </header>

      {/* Scrolling Ticker */}
      <Ticker />

      {/* Main Terminal Layout */}
      <TerminalLayout />

      {/* Command Line */}
      <CommandLine />
    </div>
  );
}
