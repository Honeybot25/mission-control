'use client';

import React from 'react';
import { useTerminalStore } from '../store';

export const Ticker: React.FC = () => {
  const { tickerData, updateQuotes } = useTerminalStore();

  // Auto-update every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      updateQuotes();
    }, 5000);

    return () => clearInterval(interval);
  }, [updateQuotes]);

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-[#00FF00]' : 'text-[#FF3333]';
    const sign = isPositive ? '+' : '';
    
    return (
      <span className={color}>
        {sign}{change.toFixed(2)} ({sign}{changePercent.toFixed(2)}%)
      </span>
    );
  };

  // Duplicate data for seamless scroll
  const duplicatedData = [...tickerData, ...tickerData, ...tickerData];

  return (
    <div className="bg-black border-b border-[#333] overflow-hidden h-8 flex items-center">
      <div className="animate-scroll-x flex whitespace-nowrap">
        {duplicatedData.map((item, index) => (
          <div 
            key={`${item.symbol}-${index}`}
            className="inline-flex items-center gap-3 px-4 border-r border-[#333]"
          >
            <span className="text-[#FF9900] font-mono text-xs font-bold">
              {item.symbol}
            </span>
            <span className="text-white font-mono text-xs">
              {item.price.toFixed(2)}
            </span>
            {formatChange(item.change, item.changePercent)}
          </div>
        ))}
      </div>
    </div>
  );
};
