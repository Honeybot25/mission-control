"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DailySummary } from "@/types/analytics";
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Bell,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface DailySummaryWidgetProps {
  data: DailySummary;
  loading?: boolean;
  className?: string;
}

export function DailySummaryWidget({
  data,
  loading = false,
  className,
}: DailySummaryWidgetProps) {
  const TrendIcon = data.costChange > 0 ? TrendingUp : data.costChange < 0 ? TrendingDown : Minus;
  const trendColor = data.costChange > 5 ? "text-red-400" : data.costChange < -5 ? "text-emerald-400" : "text-slate-400";
  const trendBg = data.costChange > 5 ? "bg-red-500/10" : data.costChange < -5 ? "bg-emerald-500/10" : "bg-slate-800";

  if (loading) {
    return (
      <Card className={cn("border-slate-800 bg-slate-900", className)}>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
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
              <Zap className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-slate-200">
                Today&apos;s Summary
              </CardTitle>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
          <Link 
            href="/analytics/costs"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View Analytics
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Cost */}
          <div className="p-4 rounded-lg bg-slate-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <DollarSign className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-500">Cost</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                ${data.totalCost.toFixed(2)}
              </span>
              {data.costChange !== 0 && (
                <span className={cn("text-xs flex items-center gap-0.5", trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(data.costChange).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">vs yesterday</p>
          </div>

          {/* Tasks Completed */}
          <div className="p-4 rounded-lg bg-slate-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-xs text-slate-500">Completed</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {data.tasksCompleted}
              </span>
              {data.tasksFailed > 0 && (
                <span className="text-xs text-slate-500">
                  / {data.tasksFailed} failed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">tasks today</p>
          </div>

          {/* Alerts */}
          <Link href="/alerts" className="block">
            <div className={cn(
              "p-4 rounded-lg space-y-2 transition-colors",
              data.activeAlerts > 0 ? "bg-red-500/10" : "bg-slate-800/50"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  data.activeAlerts > 0 ? "bg-red-500/20" : "bg-amber-500/10"
                )}>
                  <Bell className={cn(
                    "h-4 w-4",
                    data.activeAlerts > 0 ? "text-red-400" : "text-amber-400"
                  )} />
                </div>
                <span className="text-xs text-slate-500">Alerts</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-2xl font-bold",
                  data.activeAlerts > 0 ? "text-red-400" : "text-slate-100"
                )}>
                  {data.activeAlerts}
                </span>
                <span className="text-xs text-slate-500">
                  active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {data.activeAlerts > 0 ? "Requires attention" : "All clear"}
              </p>
            </div>
          </Link>

          {/* Tokens & Response Time */}
          <div className="p-4 rounded-lg bg-slate-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                <Zap className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-xs text-slate-500">Usage</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-100">
                  {(data.totalTokens / 1000).toFixed(1)}K
                </span>
                <span className="text-xs text-slate-500">tokens</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {(data.avgResponseTime / 1000).toFixed(1)}s avg response
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
