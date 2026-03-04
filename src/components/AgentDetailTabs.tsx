"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface AgentDetailTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function AgentDetailTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: AgentDetailTabsProps) {
  return (
    <div className={cn("border-b border-slate-800", className)}>
      <div className="flex items-center gap-1 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-blue-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                activeTab === tab.id
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-slate-700 text-slate-400"
              )}>
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ children, className }: TabPanelProps) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

interface TabContentProps {
  tabs: { id: string; content: React.ReactNode }[];
  activeTab: string;
  className?: string;
}

export function TabContent({ tabs, activeTab, className }: TabContentProps) {
  const activeTabData = tabs.find((t) => t.id === activeTab);
  
  if (!activeTabData) return null;

  return (
    <div className={cn("animate-in fade-in duration-200", className)}>
      {activeTabData.content}
    </div>
  );
}
