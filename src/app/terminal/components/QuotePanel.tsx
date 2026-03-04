'use client';

import React from 'react';
import { useTerminalStore } from '../store';

export const QuotePanel: React.FC = () => {
  const { quotes, activeSymbol, updateQuotes } = useTerminalStore();
  
  const quote = quotes[activeSymbol] || Object.values(quotes)[0];
  
  if (!quote) {
    return (
      <div className="flex items-center justify-center h-full text-[#666] font-mono text-sm">
        No quote data available
      </div>
    );
  }

  const isPositive = quote.change >= 0;
  const changeColor = isPositive ? 'text-[#00FF00]' : 'text-[#FF3333]';
  const changeBg = isPositive ? 'bg-[#003300]' : 'bg-[#330000]';

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="h-full flex flex-col font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-2">
        <div>
          <div className="text-[#FF9900] text-lg font-bold">{quote.symbol}</div>
          <div className="text-[#888] text-xs">{quote.name}</div>
        </div>
        <div className="text-right">
          <div className="text-white text-2xl font-bold">{formatNumber(quote.price)}</div>
          <div className={`${changeColor} text-sm`}>
            {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Price Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex justify-between border-b border-[#222] py-1">
          <span className="text-[#666]">OPEN</span>
          <span className="text-white">{formatNumber(quote.open)}</span>
        </div>
        <div className="flex justify-between border-b border-[#222] py-1">
          <span className="text-[#666]">HIGH</span>
          <span className="text-[#00FF00]">{formatNumber(quote.high)}</span>
        </div>
        <div className="flex justify-between border-b border-[#222] py-1">
          <span className="text-[#666]">LOW</span>
          <span className="text-[#FF3333]">{formatNumber(quote.low)}</span>
        </div>
        <div className="flex justify-between border-b border-[#222] py-1">
          <span className="text-[#666]">PREV CLOSE</span>
          <span className="text-white">{formatNumber(quote.previousClose)}</span>
        </div>
      </div>

      {/* Bid/Ask */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`${changeBg} p-2`}>
          <div className="text-[#666] text-xs mb-1">BID</div>
          <div className="flex justify-between items-baseline">
            <span className="text-[#00FF00] text-lg font-bold">{formatNumber(quote.bid)}</span>
            <span className="text-[#888] text-xs">x {quote.bidSize}</span>
          </div>
        </div>
        <div className={`${changeBg} p-2`}>
          <div className="text-[#666] text-xs mb-1">ASK</div>
          <div className="flex justify-between items-baseline">
            <span className="text-[#FF3333] text-lg font-bold">{formatNumber(quote.ask)}</span>
            <span className="text-[#888] text-xs">x {quote.askSize}</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between border-b border-[#222] py-1">
          <span className="text-[#666]">VOLUME</span>
          <span className="text-white">{formatVolume(quote.volume)}</span>
        </div>
        <div className="flex justify-between border-b border-[#222] py-1">
          <span className="text-[#666]">MARKET CAP</span>
          <span className="text-white">{quote.marketCap || 'N/A'}</span>
        </div>
        <div className="flex justify-between border-b border-[#222] py-1">
          <span className="text-[#666]">P/E RATIO</span>
          <span className="text-white">{quote.peRatio?.toFixed(2) || 'N/A'}</span>
        </div>
      </div>

      {/* Timestamp */}
      <div className="mt-auto pt-2 text-[10px] text-[#444]">
        LAST UPDATE: {new Date(quote.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};
