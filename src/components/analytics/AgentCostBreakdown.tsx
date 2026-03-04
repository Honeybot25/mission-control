"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AgentCostBreakdown, ModelCostBreakdown } from "@/types/analytics";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { PieChartIcon, Bot, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface AgentCostBreakdownProps {
  agentData: AgentCostBreakdown[];
  modelData?: ModelCostBreakdown[];
  loading?: boolean;
  className?: string;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export function AgentCostBreakdownChart({
  agentData,
  modelData,
  loading = false,
  className,
}: AgentCostBreakdownProps) {
  const [viewMode, setViewMode] = useState<"agents" | "models">("agents");

  const data = viewMode === "agents" ? agentData : (modelData || []);
  const totalCost = data.reduce((sum, d) => sum + ("totalCost" in d ? d.totalCost : 0), 0);

  // Prepare pie chart data
  const pieData = data.map((d, index) => ({
    name: "agentName" in d ? d.agentName : d.model,
    value: "totalCost" in d ? d.totalCost : 0,
    color: COLORS[index % COLORS.length],
    percentage: totalCost > 0 
      ? (("totalCost" in d ? d.totalCost : 0) / totalCost) * 100 
      : 0,
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

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <PieChartIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-slate-200">
                Cost Breakdown
              </CardTitle>
              <p className="text-xs text-slate-500">
                By {viewMode === "agents" ? "agent" : "model"}
              </p>
            </div>
          </div>
          {modelData && modelData.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("agents")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
                  viewMode === "agents" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <Bot className="h-3 w-3" />
                Agents
              </button>
              <button
                onClick={() => setViewMode("models")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
                  viewMode === "models" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <Coins className="h-3 w-3" />
                Models
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
            No cost data available
          </div>
        ) : (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value, name, props) => {
                      if (typeof value !== 'number') return ["", ""];
                      const percentage = (props as { payload?: { percentage?: number } })?.payload?.percentage ?? 0;
                      return [`$${value.toFixed(2)} (${percentage.toFixed(1)}%)`, String(name)];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend/List */}
            <div className="mt-4 space-y-2 max-h-[180px] overflow-y-auto">
              {data.map((item, index) => {
                const name = "agentName" in item ? item.agentName : item.model;
                const cost = "totalCost" in item ? item.totalCost : 0;
                const percentage = "percentageOfTotal" in item ? item.percentageOfTotal : 0;
                const detail = "agentName" in item 
                  ? `${item.runCount} runs · $${item.avgCostPerRun.toFixed(3)}/run`
                  : `${(item.tokenCount / 1000).toFixed(1)}K tokens`;

                return (
                  <div key={name} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{name}</p>
                      <p className="text-xs text-slate-500">{detail}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-200">
                        ${cost.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
