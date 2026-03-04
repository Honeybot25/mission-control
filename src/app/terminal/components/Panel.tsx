'use client';

import React, { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ 
  children, 
  title, 
  subtitle,
  className = '' 
}) => {
  return (
    <div className={`bg-black flex flex-col ${className}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#111] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <span className="text-[#FF9900] font-mono text-xs font-bold tracking-wider">
            {title}
          </span>
          {subtitle && (
            <span className="text-[#666] font-mono text-xs">
              | {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[#00FF00]" />
          <div className="w-2 h-2 bg-[#FF9900]" />
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-auto p-2">
        {children}
      </div>
    </div>
  );
};
