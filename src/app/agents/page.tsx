"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { KPICards } from "@/components/KPICards";
import { FleetHealthTable, AgentHealth } from "@/components/FleetHealthTable";
import { StatusBadge } from "@/components/StatusBadge";
import { MiniChart } from "@/components/MiniChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  Search,
  Filter,
  Grid3X3,
  List,
  ArrowUpRight,
  Settings,
  Plus,
  Cpu,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Mock agent data
const mockAgents: AgentHealth[] = [
  {
    id: "traderbot",
    name: "TraderBot",
    status: "busy",
    version: "2.1.4",
    lastHeartbeat: new Date(Date.now() - 2 * 60000).toISOString(),
    runs24h: 147,
    errorRate: 0.02,
    avgLatency: 245,
    tokens24h: 2840000,
    latencyHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: 200 + Math.random() * 100
    })),
    throughputHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Math.floor(Math.random() * 20)
    })),
    description: "Trading systems and execution",
    environment: "production"
  },
  {
    id: "productbuilder",
    name: "ProductBuilder",
    status: "online",
    version: "1.8.2",
    lastHeartbeat: new Date(Date.now() - 5 * 60000).toISOString(),
    runs24h: 23,
    errorRate: 0,
    avgLatency: 890,
    tokens24h: 456000,
    latencyHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: 800 + Math.random() * 200
    })),
    throughputHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Math.floor(Math.random() * 5)
    })),
    description: "Building revenue-generating products",
    environment: "production"
  },
  {
    id: "ios-app-builder",
    name: "iOSAppBuilder",
    status: "busy",
    version: "1.3.0",
    lastHeartbeat: new Date(Date.now() - 25 * 60000).toISOString(),
    runs24h: 8,
    errorRate: 0.125,
    avgLatency: 45000,
    tokens24h: 890000,
    latencyHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: 40000 + Math.random() * 10000
    })),
    throughputHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Math.floor(Math.random() * 2)
    })),
    description: "iOS app development and TestFlight",
    environment: "production"
  },
  {
    id: "distribution",
    name: "DistributionAgent",
    status: "busy",
    version: "2.0.1",
    lastHeartbeat: new Date(Date.now() - 60 * 60000).toISOString(),
    runs24h: 45,
    errorRate: 0.02,
    avgLatency: 1200,
    tokens24h: 234000,
    latencyHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: 1000 + Math.random() * 400
    })),
    throughputHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Math.floor(Math.random() * 8)
    })),
    description: "Content and X/Twitter distribution",
    environment: "production"
  },
  {
    id: "memorymanager",
    name: "MemoryManager",
    status: "offline",
    version: "1.1.0",
    lastHeartbeat: new Date(Date.now() - 4 * 3600000).toISOString(),
    runs24h: 1,
    errorRate: 0,
    avgLatency: 15000,
    tokens24h: 12000,
    latencyHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: 10000 + Math.random() * 5000
    })),
    throughputHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Math.floor(Math.random() * 1)
    })),
    description: "Nightly consolidation and knowledge management",
    environment: "production"
  },
  {
    id: "research",
    name: "ResearchAgent",
    status: "online",
    version: "0.9.0",
    lastHeartbeat: new Date(Date.now() - 30 * 60000).toISOString(),
    runs24h: 12,
    errorRate: 0,
    avgLatency: 3500,
    tokens24h: 567000,
    latencyHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: 3000 + Math.random() * 1000
    })),
    throughputHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Math.floor(Math.random() * 3)
    })),
    description: "Deep research and analysis",
    environment: "staging"
  }
];

function AgentCard({ agent }: { agent: AgentHealth }) {
  const isDegraded = agent.errorRate > 0.05 || agent.avgLatency > 10000;
  
  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className={cn(
        "group border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-all cursor-pointer hover:border-slate-700",
        agent.status === "error" && "border-red-500/30 hover:border-red-500/50",
        isDegraded && "border-amber-500/30 hover:border-amber-500/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                agent.status === "online" && "bg-emerald-500/10 text-emerald-400",
                agent.status === "busy" && "bg-amber-500/10 text-amber-400",
                agent.status === "offline" && "bg-slate-500/10 text-slate-400",
                agent.status === "error" && "bg-red-500/10 text-red-400",
              )}>
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">v{agent.version}</p>
              </div>
            </div>
            <StatusBadge status={agent.status} size="sm" pulse={agent.status === "busy"} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400 line-clamp-2">{agent.description}</p>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-xs text-slate-500">Runs 24h</p>
              <p className="text-sm font-medium text-slate-200">{agent.runs24h}</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-xs text-slate-500">Latency</p>
              <p className={cn(
                "text-sm font-medium",
                agent.avgLatency > 1000 ? "text-amber-400" : "text-emerald-400"
              )}>
                {agent.avgLatency < 1000 ? `${Math.round(agent.avgLatency)}ms` : `${(agent.avgLatency / 1000).toFixed(1)}s`}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-xs text-slate-500">Success Rate</p>
              <p className={cn(
                "text-sm font-medium",
                agent.errorRate > 0.05 ? "text-red-400" : "text-emerald-400"
              )}>
                {((1 - agent.errorRate) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-xs text-slate-500">Tokens</p>
              <p className="text-sm font-medium text-slate-200">
                {(agent.tokens24h / 1000).toFixed(0)}k
              </p>
            </div>
          </div>

          {/* Sparkline */}
          {agent.latencyHistory.length > 0 && (
            <div className="h-10">
              <MiniChart
                data={agent.latencyHistory.map((m, i) => ({ name: i, value: m.value }))}
                dataKey="value"
                type="line"
                color={agent.errorRate > 0.05 ? "#ef4444" : "#10b981"}
                height={40}
                showGrid={false}
                showTooltip={false}
                showAxes={false}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(agent.lastHeartbeat), { addSuffix: true })}
              </span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "busy" | "offline" | "error">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Calculate stats
  const totalAgents = mockAgents.length;
  const onlineAgents = mockAgents.filter(a => a.status === "online").length;
  const busyAgents = mockAgents.filter(a => a.status === "busy").length;
  const offlineAgents = mockAgents.filter(a => a.status === "offline").length;
  const errorAgents = mockAgents.filter(a => a.status === "error").length;
  const degradedAgents = mockAgents.filter(a => a.errorRate > 0.05 || a.avgLatency > 10000).length;

  const totalRuns = mockAgents.reduce((acc, a) => acc + a.runs24h, 0);
  const avgSuccessRate = mockAgents.reduce((acc, a) => acc + (1 - a.errorRate), 0) / mockAgents.length * 100;
  const totalTokens = mockAgents.reduce((acc, a) => acc + a.tokens24h, 0);

  const kpis = [
    {
      label: "Total Agents",
      value: totalAgents,
      change: `${onlineAgents} online`,
      trend: "neutral",
      icon: Bot,
      color: "blue",
      description: `${busyAgents} busy · ${offlineAgents} offline`,
    },
    {
      label: "Degraded Agents",
      value: degradedAgents,
      change: degradedAgents > 0 ? "Attention needed" : "Healthy",
      trend: degradedAgents > 0 ? "down" : "up",
      icon: AlertCircle,
      color: degradedAgents > 0 ? "red" : "green",
      description: "Performance issues",
    },
    {
      label: "Total Runs 24h",
      value: totalRuns,
      change: "+12%",
      trend: "up",
      icon: TrendingUp,
      color: "green",
      description: "Across all agents",
    },
    {
      label: "Tokens 24h",
      value: `${(totalTokens / 1000000).toFixed(1)}M`,
      change: "~$12.40",
      trend: "neutral",
      icon: Zap,
      color: "amber",
      description: "Estimated cost",
    },
  ] as const;

  // Filter agents
  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">Agents</h1>
              <p className="text-slate-400">
                Manage and monitor your AI agent fleet
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <KPICards kpis={kpis} columns={4} className="mb-6" />

        {/* Filters & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-slate-700 rounded-md p-1 bg-slate-900">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "list" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  viewMode === "grid" ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-slate-500 mb-4">
          Showing {filteredAgents.length} of {mockAgents.length} agents
        </p>

        {/* Content */}
        {viewMode === "list" ? (
          <FleetHealthTable agents={filteredAgents} showLatencyChart={true} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
