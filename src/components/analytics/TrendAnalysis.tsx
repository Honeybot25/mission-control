"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AgentPerformance } from "@/types/analytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendAnalysisProps {
  data: AgentPerformance[];
  loading?: boolean;
  className?: string;
}

export function TrendAnalysis({
  data,
  loading = false,
  className,
}: TrendAnalysisProps) {
  // Calculate trend metrics
  const totalRuns = data.reduce((sum, a) => sum + a.totalRuns, 0);
  const avgSuccessRate = data.length > 0
    ? data.reduce((sum, a) => sum + a.successRate, 0) / data.length
    : 0;
  const avgErrorRate = data.length > 0
    ? data.reduce((sum, a) => sum + a.errorRate, 0) / data.length
    : 0;

  // Count trends
  const improving = data.filter(a => a.trend === "up").length;
  const declining = data.filter(a => a.trend === "down").length;
  const stable = data.filter(a => a.trend === "neutral").length;

  // Generate mock trend data for visualization (in real app, this would be historical data)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1;
    const baseSuccess = avgSuccessRate;
    const variation = Math.sin(i * 0.5) * 5;
    return {
      day: `Day ${day}`,
      successRate: Math.min(100, Math.max(0, baseSuccess + variation)),
      errorRate: Math.max(0, avgErrorRate + Math.random() * 2),
      avgLatency: 1000 + Math.random() * 500,
    };
  });

  // Find insights
  const insights: { type: "positive" | "negative" | "neutral"; message: string }[] = [];
  
  if (improving > declining) {
    insights.push({
      type: "positive",
      message: `${improving} agents showing improving performance trends`,
    });
  }
  if (declining > 0) {
    insights.push({
      type: "negative",
      message: `${declining} agents need attention - declining success rates`,
    });
  }
  if (avgSuccessRate > 95) {
    insights.push({
      type: "positive",
      message: "Excellent overall success rate above 95%",
    });
  }
  if (avgErrorRate > 10) {
    insights.push({
      type: "negative",
      message: `High error rate (${avgErrorRate.toFixed(1)}%) - review error handling`,
    });
  }

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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
            <BrainCircuit className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-base font-medium text-slate-200">
              Trend Analysis
            </CardTitle>
            <p className="text-xs text-slate-500">
              Performance patterns and insights
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Chart */}
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="errorRate"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
            <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-400">{improving}</p>
            <p className="text-xs text-slate-500">Improving</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 text-center">
            <div className="h-5 w-5 mx-auto mb-1 rounded-full bg-slate-600" />
            <p className="text-lg font-bold text-slate-300">{stable}</p>
            <p className="text-xs text-slate-500">Stable</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <TrendingDown className="h-5 w-5 text-red-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-400">{declining}</p>
            <p className="text-xs text-slate-500">Declining</p>
          </div>
        </div>

        {/* Insights */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Insights
          </p>
          {insights.length === 0 ? (
            <p className="text-sm text-slate-500">No significant trends detected</p>
          ) : (
            insights.map((insight, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 p-2 rounded text-sm",
                  insight.type === "positive" && "bg-emerald-500/10 text-emerald-400",
                  insight.type === "negative" && "bg-red-500/10 text-red-400",
                  insight.type === "neutral" && "bg-slate-800 text-slate-400"
                )}
              >
                {insight.type === "positive" && <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {insight.type === "negative" && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {insight.type === "neutral" && <div className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {insight.message}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
