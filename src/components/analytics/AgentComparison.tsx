"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AgentPerformance } from "@/types/analytics";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Users, Clock, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface AgentComparisonProps {
  data: AgentPerformance[];
  loading?: boolean;
  className?: string;
}

const COLORS = {
  up: "#10b981",
  down: "#ef4444",
  neutral: "#64748b",
};

export function AgentComparison({
  data,
  loading = false,
  className,
}: AgentComparisonProps) {
  const [metric, setMetric] = useState<"successRate" | "avgDuration" | "totalRuns">("successRate");

  // Sort data based on selected metric
  const sortedData = [...data].sort((a, b) => {
    if (metric === "successRate") return b.successRate - a.successRate;
    if (metric === "avgDuration") return b.avgDuration - a.avgDuration;
    return b.totalRuns - a.totalRuns;
  });

  const chartData = sortedData.map(d => ({
    ...d,
    avgDurationSec: d.avgDuration / 1000,
  }));

  if (loading) {
    return (
      <Card className={cn("border-slate-800 bg-slate-900", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-slate-200">
                Agent Comparison
              </CardTitle>
              <p className="text-xs text-slate-500">
                Performance metrics by agent
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {(["successRate", "avgDuration", "totalRuns"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  metric === m
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                {m === "successRate" && "Success %"}
                {m === "avgDuration" && "Duration"}
                {m === "totalRuns" && "Runs"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
            No agent data available
          </div>
        ) : (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (metric === "successRate") return `${value.toFixed(0)}%`;
                      if (metric === "avgDuration") return `${value.toFixed(1)}s`;
                      return value.toString();
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="agentName"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value) => {
                      if (typeof value !== 'number') return ["", ""];
                      if (metric === "successRate") return [`${value.toFixed(1)}%`, "Success Rate"];
                      if (metric === "avgDuration") return [`${value.toFixed(2)}s`, "Avg Duration"];
                      return [value.toString(), "Total Runs"];
                    }}
                  />
                  <Bar dataKey={metric === "avgDuration" ? "avgDurationSec" : metric} radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={metric === "successRate" ? "#10b981" : metric === "avgDuration" ? "#8b5cf6" : "#3b82f6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Agent List */}
            <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
              {data.map((agent) => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTrendIcon(agent.trend)}
                    <div>
                      <p className="text-sm font-medium text-slate-200">{agent.agentName}</p>
                      <p className="text-xs text-slate-500">
                        {agent.totalRuns} runs · {agent.errorRate.toFixed(1)}% error rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-200">
                      {agent.successRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {(agent.avgDuration / 1000).toFixed(1)}s avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
