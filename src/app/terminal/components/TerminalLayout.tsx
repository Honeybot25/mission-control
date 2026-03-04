'use client';

import React from 'react';
import { Panel } from './Panel';
import { QuotePanel } from './QuotePanel';
import { ChartPanel } from './ChartPanel';
import { NewsPanel } from './NewsPanel';
import { WatchlistPanel } from './Watchlist';

export const TerminalLayout: React.FC = () => {
  const renderPanel = (type: string) => {
    switch (type) {
      case 'quotes':
        return <QuotePanel />;
      case 'chart':
        return <ChartPanel />;
      case 'news':
        return <NewsPanel />;
      case 'watchlist':
        return <WatchlistPanel />;
      default:
        return <QuotePanel />;
    }
  };

  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-[1px] bg-black p-[1px]">
      {/* Top Left - Quotes */}
      <Panel title="EQUITY" subtitle="AAPL" className="border-r border-b border-[#333]">
        <QuotePanel />
      </Panel>

      {/* Top Right - Chart */}
      <Panel title="CHART" subtitle="1D" className="border-b border-[#333]">
        <ChartPanel />
      </Panel>

      {/* Bottom Left - Watchlist */}
      <Panel title="WATCHLIST" className="border-r border-[#333]">
        <WatchlistPanel />
      </Panel>

      {/* Bottom Right - News */}
      <Panel title="NEWS">
        <NewsPanel />
      </Panel>
    </div>
  );
};
