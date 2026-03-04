"use client";

import { useState, memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { MiniChart } from "@/components/MiniChart";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  ChevronRight, 
  Activity,
  Clock,
  Zap,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface AgentMetric {
  timestamp: string;
  value: number;
}

export interface AgentHealth {
  id: string;
  name: string;
  status: "online" | "busy" | "offline" | "error";
  version: string;
  lastHeartbeat: string;
  runs24h: number;
  errorRate: number;
  avgLatency: number;
  tokens24h: number;
  latencyHistory: AgentMetric[];
  throughputHistory: AgentMetric[];
  description?: string;
  environment?: string;
}

interface FleetHealthTableProps {
  agents: AgentHealth[];
  loading?: boolean;
  className?: string;
  onAgentClick?: (agent: AgentHealth) => void;
  showLatencyChart?: boolean;
}

function getDegradeReason(agent: AgentHealth): string | null {
  if (agent.status === "error") return "Agent error";
  if (agent.errorRate > 0.1) return `High error rate (${(agent.errorRate * 100).toFixed(1)}%)`;
  if (agent.avgLatency > 5000) return `High latency (${(agent.avgLatency / 1000).toFixed(1)}s)`;
  if (agent.status === "offline") return "Offline";
  if (agent.status === "busy" && new Date(agent.lastHeartbeat).getTime() < Date.now() - 300000) {
    return "Stuck";
  }
  return null;
}

function isDegraded(agent: AgentHealth): boolean {
  return !!getDegradeReason(agent);
}

export const FleetHealthTable = memo(function FleetHealthTable({
  agents,
  loading = false,
  className,
  onAgentClick,
  showLatencyChart = true,
}: FleetHealthTableProps) {
  const [sortBy, setSortBy] = useState<keyof AgentHealth>("lastHeartbeat");
  const [sortDesc, setSortDesc] = useState(true);

  const sortedAgents = [...agents].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (aValue === undefined || bValue === undefined) return 0;
    if (sortDesc) {
      return aValue > bValue ? -1 : 1;
    }
    return aValue > bValue ? 1 : -1;
  });

  const onlineCount = agents.filter(a => a.status === "online").length;
  const busyCount = agents.filter(a => a.status === "busy").length;
  const offlineCount = agents.filter(a => a.status === "offline").length;
  const errorCount = agents.filter(a => a.status === "error").length;
  const degradedCount = agents.filter(isDegraded).length;

  if (loading) {
    return (
      <Card className={cn("border-slate-800 bg-slate-900", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-slate-100">Fleet Health</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {agents.length} agents · {onlineCount} online
              </span>
              {degradedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  {degradedCount} degraded
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status="online" size="sm" label={onlineCount.toString()} />
            <StatusBadge status="busy" size="sm" label={busyCount.toString()} />
            <StatusBadge status="offline" size="sm" label={offlineCount.toString()} />
            {errorCount > 0 && <StatusBadge status="error" size="sm" label={errorCount.toString()} />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Agent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Version</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Last Heartbeat</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">Runs 24h</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">Error Rate</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">Latency</th>
                {showLatencyChart && <th className="px-4 py-3 text-xs font-medium text-slate-400 w-24">Trend</th>}
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedAgents.map((agent) => {
                const degraded = isDegraded(agent);
                const degradeReason = getDegradeReason(agent);

                return (
                  <tr
                    key={agent.id}
                    className={cn(
                      "group transition-colors hover:bg-slate-800/50",
                      degraded && "bg-red-500/5"
                    )}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/agents/${agent.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                            agent.status === "online" && "bg-emerald-500/10 text-emerald-400",
                            agent.status === "busy" && "bg-amber-500/10 text-amber-400",
                            agent.status === "offline" && "bg-slate-500/10 text-slate-400",
                            agent.status === "error" && "bg-red-500/10 text-red-400",
                          )}>
                            <Zap className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                              {agent.name}
                            </p>
                            {agent.description && (
                              <p className="text-xs text-slate-500 truncate">{agent.description}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={agent.status} pulse={agent.status === "busy"} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-400">v{agent.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span className={cn(
                          "text-sm",
                          degraded && agent.status === "offline" ? "text-red-400" : "text-slate-400"
                        )}>
                          {formatDistanceToNow(new Date(agent.lastHeartbeat), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-slate-300">
                        {agent.runs24h.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-sm font-medium",
                        agent.errorRate > 0.05 ? "text-red-400" : "text-emerald-400"
                      )}>
                        {(agent.errorRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-slate-300">
                        {agent.avgLatency < 1000 
                          ? `${Math.round(agent.avgLatency)}ms` 
                          : `${(agent.avgLatency / 1000).toFixed(1)}s`}
                      </span>
                    </td>
                    {showLatencyChart && (
                      <td className="px-4 py-3">
                        {agent.latencyHistory.length > 0 && (
                          <MiniChart
                            data={agent.latencyHistory.map((m, i) => ({ 
                              name: i, 
                              value: m.value 
                            }))}
                            dataKey="value"
                            type="line"
                            color={agent.errorRate > 0.05 ? "#ef4444" : "#10b981"}
                            height={30}
                            showGrid={false}
                            showTooltip={false}
                            showAxes={false}
                          />
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link href={`/agents/${agent.id}`}>
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
