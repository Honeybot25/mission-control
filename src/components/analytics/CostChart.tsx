"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CostData, TimeRange } from "@/types/analytics";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CostChartProps {
  data: CostData[];
  loading?: boolean;
  timeRange?: TimeRange;
  className?: string;
  showAgents?: boolean;
  showModels?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function CostChart({
  data,
  loading = false,
  timeRange = "24h",
  className,
  showAgents = false,
  showModels = false,
}: CostChartProps) {
  const [chartType, setChartType] = useState<"area" | "line">("area");

  // Calculate totals
  const totalCost = data.reduce((sum, d) => sum + d.totalCost, 0);
  const avgCost = data.length > 0 ? totalCost / data.length : 0;
  
  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstHalfCost = firstHalf.reduce((sum, d) => sum + d.totalCost, 0);
  const secondHalfCost = secondHalf.reduce((sum, d) => sum + d.totalCost, 0);
  const trend = firstHalfCost > 0 ? ((secondHalfCost - firstHalfCost) / firstHalfCost) * 100 : 0;

  // Format data for chart
  const chartData = data.map(d => ({
    ...d,
    displayDate: timeRange === "7d" || timeRange === "30d" 
      ? format(parseISO(d.date), "MMM dd")
      : format(parseISO(d.date), "HH:mm"),
  }));

  // Get agent names for stacked lines
  const agentNames = showAgents && data.length > 0 
    ? Object.keys(data[0].agentCosts)
    : [];
  
  const modelNames = showModels && data.length > 0
    ? Object.keys(data[0].modelCosts)
    : [];

  if (loading) {
    return (
      <Card className={cn("border-slate-800 bg-slate-900", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-slate-200">
                Cost Over Time
              </CardTitle>
              <p className="text-xs text-slate-500">
                {timeRange === "1h" && "Last hour"}
                {timeRange === "24h" && "Last 24 hours"}
                {timeRange === "7d" && "Last 7 days"}
                {timeRange === "30d" && "Last 30 days"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-100">
                ${totalCost.toFixed(2)}
              </p>
              <div className="flex items-center justify-end gap-1">
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-red-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-emerald-400" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  trend > 0 ? "text-red-400" : "text-emerald-400"
                )}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setChartType("area")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  chartType === "area" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("line")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-colors",
                  chartType === "line" 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                Line
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value) => typeof value === 'number' ? [`$${value.toFixed(3)}`, "Cost"] : ["", ""]}
                />
                <Area
                  type="monotone"
                  dataKey="totalCost"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCost)"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value) => typeof value === 'number' ? [`$${value.toFixed(3)}`, "Cost"] : ["", ""]}
                />
                <Line
                  type="monotone"
                  dataKey="totalCost"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div>
            <p className="text-xs text-slate-500">Total Cost</p>
            <p className="text-lg font-semibold text-slate-200">${totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Average / Period</p>
            <p className="text-lg font-semibold text-slate-200">${avgCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Peak Cost</p>
            <p className="text-lg font-semibold text-slate-200">
              ${Math.max(...data.map(d => d.totalCost), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
