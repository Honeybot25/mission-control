"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  CostChart, 
  AgentCostBreakdownChart, 
  BudgetAlertSettings 
} from "@/components/analytics";
import { useAnalyticsData, useBudgetSettings } from "@/hooks/useAnalyticsData";
import { TimeRange } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function CostsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const { 
    loading, 
    costData, 
    agentCostBreakdown, 
    modelCostBreakdown, 
    dailySummary,
    refresh 
  } = useAnalyticsData(timeRange);
  const { settings, updateSettings } = useBudgetSettings();

  // Calculate current spend for budget periods
  const currentSpend = {
    daily: dailySummary.totalCost,
    weekly: costData.slice(-7).reduce((sum, d) => sum + d.totalCost, 0),
    monthly: costData.reduce((sum, d) => sum + d.totalCost, 0),
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100">Cost Analytics</h1>
              </div>
              <p className="text-slate-400">
                Track and manage your AI agent spending
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Cost</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    ${costData.reduce((sum, d) => sum + d.totalCost, 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Avg / Period</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    ${costData.length > 0 
                      ? (costData.reduce((sum, d) => sum + d.totalCost, 0) / costData.length).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Agents</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {agentCostBreakdown.length}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                  <Calendar className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <CostChart 
              data={costData} 
              loading={loading} 
              timeRange={timeRange}
            />
          </div>
          <div>
            <AgentCostBreakdownChart
              agentData={agentCostBreakdown}
              modelData={modelCostBreakdown}
              loading={loading}
            />
          </div>
        </div>

        {/* Budget Settings */}
        <BudgetAlertSettings
          settings={settings}
          currentSpend={currentSpend}
          onUpdate={updateSettings}
        />
      </main>
    </div>
  );
}
