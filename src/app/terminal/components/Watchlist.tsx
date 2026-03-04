'use client';

import React, { useState } from 'react';
import { useTerminalStore } from '../store';

export const WatchlistPanel: React.FC = () => {
  const { watchlist, activeSymbol, setActiveSymbol, removeFromWatchlist, addToWatchlist, quotes } = useTerminalStore();
  const [showAddInput, setShowAddInput] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-[#00FF00]' : 'text-[#FF3333]';
    const sign = isPositive ? '+' : '';
    
    return (
      <span className={`${color} text-xs`}>
        {sign}{formatNumber(change)} ({sign}{formatNumber(changePercent)}%)
      </span>
    );
  };

  const handleAddSymbol = () => {
    if (newSymbol.trim()) {
      const symbol = newSymbol.toUpperCase();
      const quote = quotes[symbol] || {
        symbol,
        name: `${symbol} Corp.`,
        price: 100 + Math.random() * 200,
        change: (Math.random() - 0.5) * 5,
        changePercent: (Math.random() - 0.5) * 3,
      };
      
      addToWatchlist({
        symbol,
        name: quote.name,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
      });
      
      setNewSymbol('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-xs">
      {/* Watchlist Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#333]">
        <span className="text-[#666]">SYMBOL</span>
        <div className="flex gap-6">
          <span className="text-[#666]">PRICE</span>
          <span className="text-[#666]">CHANGE</span>
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="flex-1 overflow-y-auto">
        {watchlist.map((item) => {
          const isActive = item.symbol === activeSymbol;
          
          return (
            <div 
              key={item.symbol}
              onClick={() => setActiveSymbol(item.symbol)}
              className={`
                flex items-center justify-between py-2 px-2 cursor-pointer
                border-b border-[#222] last:border-b-0
                ${isActive ? 'bg-[#1a1a00]' : 'hover:bg-[#111]'}
                transition-colors
              `}
            >
              <div className="flex items-center gap-2">
                <div className={`w-1 h-4 ${isActive ? 'bg-[#FF9900]' : 'bg-transparent'}`} />
                <div>
                  <div className={`font-bold text-sm ${isActive ? 'text-[#FF9900]' : 'text-white'}`}>
                    {item.symbol}
                  </div>
                  <div className="text-[#666] text-[10px] truncate max-w-[80px]">
                    {item.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-white text-sm w-16 text-right">
                  {formatNumber(item.price)}
                </span>
                <div className="w-24 text-right">
                  {formatChange(item.change, item.changePercent)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Watchlist Footer */}
      <div className="mt-2 pt-2 border-t border-[#333]">
        <div className="flex items-center justify-between text-[10px] text-[#666]">
          <span>{watchlist.length} SYMBOLS</span>
          <div className="flex gap-2">
            <span className="text-[#00FF00]">
              {watchlist.filter(w => w.change >= 0).length} UP
            </span>
            <span className="text-[#FF3333]">
              {watchlist.filter(w => w.change < 0).length} DOWN
            </span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-2 flex gap-2">
          {showAddInput ? (
            <div className="flex gap-2 flex-1">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSymbol();
                  if (e.key === 'Escape') {
                    setShowAddInput(false);
                    setNewSymbol('');
                  }
                }}
                placeholder="SYMBOL"
                className="flex-1 px-2 py-1 bg-[#111] border border-[#333] text-[#00FF00] font-mono text-xs outline-none focus:border-[#FF9900]"
                autoFocus
              />
              <button 
                onClick={handleAddSymbol}
                className="px-3 py-1 bg-[#003300] text-[#00FF00] hover:bg-[#004400] transition-colors text-xs"
              >
                ADD
              </button>
              <button 
                onClick={() => {
                  setShowAddInput(false);
                  setNewSymbol('');
                }}
                className="px-3 py-1 bg-[#330000] text-[#FF3333] hover:bg-[#440000] transition-colors text-xs"
              >
                X
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowAddInput(true)}
                className="px-2 py-1 bg-[#222] text-[#888] hover:bg-[#333] hover:text-[#FF9900] transition-colors text-[10px]"
              >
                + ADD
              </button>
              <button 
                onClick={() => {
                  if (activeSymbol) {
                    removeFromWatchlist(activeSymbol);
                  }
                }}
                className="px-2 py-1 bg-[#222] text-[#888] hover:bg-[#330000] hover:text-[#FF3333] transition-colors text-[10px]"
              >
                - REMOVE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
