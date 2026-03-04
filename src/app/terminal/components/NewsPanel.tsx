'use client';

import React from 'react';
import { useTerminalStore } from '../store';

export const NewsPanel: React.FC = () => {
  const { news, activeSymbol } = useTerminalStore();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-[#00FF00]';
      case 'negative':
        return 'bg-[#FF3333]';
      default:
        return 'bg-[#888]';
    }
  };

  // Filter news by related symbols if active symbol is set
  const filteredNews = activeSymbol 
    ? news.filter(item => item.relatedSymbols.includes(activeSymbol))
    : news;

  const displayNews = filteredNews.length > 0 ? filteredNews : news;

  return (
    <div className="h-full flex flex-col font-mono text-xs">
      {/* News Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#333]">
        <span className="text-[#666]">HEADLINES</span>
        <span className="text-[#FF9900]">{displayNews.length} ITEMS</span>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {displayNews.map((item) => (
          <div 
            key={item.id}
            className="p-2 border-l-2 border-[#333] hover:border-[#FF9900] hover:bg-[#111] transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-2">
              {/* Sentiment indicator */}
              <div className={`w-1 h-full min-h-[30px] ${getSentimentColor(item.sentiment)}`} />
              
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#FF9900] font-bold">{item.source}</span>
                  <span className="text-[#666]">{formatTime(item.timestamp)}</span>
                  <span className={`text-[8px] px-1 ${item.sentiment === 'positive' ? 'text-[#00FF00]' : item.sentiment === 'negative' ? 'text-[#FF3333]' : 'text-[#888]'}`}>
                    {item.sentiment.toUpperCase()}
                  </span>
                </div>
                
                {/* Headline */}
                <div className="text-white text-xs leading-tight group-hover:text-[#FF9900] transition-colors">
                  {item.headline}
                </div>

                {/* Related symbols */}
                {item.relatedSymbols.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {item.relatedSymbols.map(sym => (
                      <span key={sym} className="text-[#00FFFF] text-[10px]">
                        {sym}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* News Footer */}
      <div className="mt-2 pt-1 border-t border-[#333] text-[10px] text-[#444]">
        PRESS ENTER TO READ FULL ARTICLE
      </div>
    </div>
  );
};
