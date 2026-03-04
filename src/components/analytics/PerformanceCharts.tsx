"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PerformanceMetrics, TimeRange } from "@/types/analytics";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
  ComposedChart,
} from "recharts";
import { Activity, CheckCircle, XCircle, Clock, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PerformanceChartsProps {
  data: PerformanceMetrics[];
  loading?: boolean;
  timeRange?: TimeRange;
  className?: string;
}

export function PerformanceCharts({
  data,
  loading = false,
  timeRange = "24h",
  className,
}: PerformanceChartsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "success" | "duration" | "throughput">("overview");

  // Calculate summary stats
  const totalRuns = data.reduce((sum, d) => sum + d.totalRuns, 0);
  const totalSuccessful = data.reduce((sum, d) => sum + d.successfulRuns, 0);
  const totalFailed = data.reduce((sum, d) => sum + d.failedRuns, 0);
  const successRate = totalRuns > 0 ? (totalSuccessful / totalRuns) * 100 : 0;
  const avgDuration = data.length > 0 
    ? data.reduce((sum, d) => sum + d.avgDuration, 0) / data.length 
    : 0;
  const avgThroughput = data.length > 0
    ? data.reduce((sum, d) => sum + d.throughput, 0) / data.length
    : 0;

  // Format data for charts
  const chartData = data.map(d => ({
    ...d,
    displayDate: timeRange === "7d" || timeRange === "30d"
      ? format(parseISO(d.date), "MMM dd")
      : format(parseISO(d.date), "HH:mm"),
    successRate: d.totalRuns > 0 ? (d.successfulRuns / d.totalRuns) * 100 : 0,
    errorRate: d.totalRuns > 0 ? (d.failedRuns / d.totalRuns) * 100 : 0,
    avgDurationSec: d.avgDuration / 1000,
    p95DurationSec: d.p95Duration / 1000,
  }));

  if (loading) {
    return (
      <Card className={cn("border-slate-800 bg-slate-900", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (activeTab) {
      case "overview":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                yAxisId="left"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={10}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Bar yAxisId="left" dataKey="totalRuns" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      case "success":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Bar dataKey="successfulRuns" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="failedRuns" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "duration":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                dx={-10}
                tickFormatter={(value) => `${value.toFixed(0)}s`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  typeof value === 'number' ? `${value.toFixed(2)}s` : '',
                  name === "avgDurationSec" ? "Avg Duration" : "P95 Duration",
                ]}
              />
              <Bar dataKey="avgDurationSec" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="p95DurationSec"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      case "throughput":
        return (
          <ResponsiveContainer width="100%" height="100%">
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
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [typeof value === 'number' ? `${value.toFixed(1)} runs/hr` : '', "Throughput"]}
              />
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: "#06b6d4", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Activity className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-slate-200">
                Performance Metrics
              </CardTitle>
              <p className="text-xs text-slate-500">
                Task execution analysis over time
              </p>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="bg-slate-800">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-blue-600">
                Overview
              </TabsTrigger>
              <TabsTrigger value="success" className="text-xs data-[state=active]:bg-blue-600">
                Success
              </TabsTrigger>
              <TabsTrigger value="duration" className="text-xs data-[state=active]:bg-blue-600">
                Duration
              </TabsTrigger>
              <TabsTrigger value="throughput" className="text-xs data-[state=active]:bg-blue-600">
                Throughput
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">{renderChart()}</div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs text-slate-500">Total Runs</p>
              <p className="text-lg font-semibold text-slate-200">{totalRuns}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-xs text-slate-500">Success Rate</p>
              <p className="text-lg font-semibold text-slate-200">{successRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <div>
              <p className="text-xs text-slate-500">Avg Duration</p>
              <p className="text-lg font-semibold text-slate-200">{(avgDuration / 1000).toFixed(1)}s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <div>
              <p className="text-xs text-slate-500">Throughput</p>
              <p className="text-lg font-semibold text-slate-200">{avgThroughput.toFixed(1)}/hr</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
