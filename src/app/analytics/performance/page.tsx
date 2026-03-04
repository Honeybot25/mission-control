"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  PerformanceCharts, 
  AgentComparison, 
  TrendAnalysis 
} from "@/components/analytics";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { TimeRange } from "@/types/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, RefreshCw, TrendingUp, Clock, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const { 
    loading, 
    performanceMetrics, 
    agentPerformance, 
    refresh 
  } = useAnalyticsData(timeRange);

  // Calculate summary stats
  const totalRuns = performanceMetrics.reduce((sum, d) => sum + d.totalRuns, 0);
  const totalSuccessful = performanceMetrics.reduce((sum, d) => sum + d.successfulRuns, 0);
  const successRate = totalRuns > 0 ? (totalSuccessful / totalRuns) * 100 : 0;
  const avgDuration = performanceMetrics.length > 0
    ? performanceMetrics.reduce((sum, d) => sum + d.avgDuration, 0) / performanceMetrics.length
    : 0;
  const avgThroughput = performanceMetrics.length > 0
    ? performanceMetrics.reduce((sum, d) => sum + d.throughput, 0) / performanceMetrics.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100">Performance Analytics</h1>
              </div>
              <p className="text-slate-400">
                Monitor agent performance and execution metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={loading}
                className="border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Runs</p>
                  <p className="text-xl font-bold text-slate-100">{totalRuns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Target className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Success Rate</p>
                  <p className="text-xl font-bold text-slate-100">{successRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Duration</p>
                  <p className="text-xl font-bold text-slate-100">{(avgDuration / 1000).toFixed(1)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Zap className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Throughput</p>
                  <p className="text-xl font-bold text-slate-100">{avgThroughput.toFixed(1)}/hr</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PerformanceCharts
            data={performanceMetrics}
            loading={loading}
            timeRange={timeRange}
          />
          <AgentComparison
            data={agentPerformance}
            loading={loading}
          />
        </div>

        {/* Trend Analysis */}
        <TrendAnalysis
          data={agentPerformance}
          loading={loading}
        />
      </main>
    </div>
  );
}
