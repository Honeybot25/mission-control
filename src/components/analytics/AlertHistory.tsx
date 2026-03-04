"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Alert, AlertStatus, AlertSeverity, AlertType } from "@/types/analytics";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Check,
  X,
  History,
  Filter,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlertHistoryProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  loading?: boolean;
  className?: string;
}

const severityConfig: Record<AlertSeverity, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
};

const statusConfig: Record<AlertStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-red-500" },
  acknowledged: { label: "Acknowledged", color: "bg-amber-500" },
  resolved: { label: "Resolved", color: "bg-emerald-500" },
};

const typeLabels: Record<AlertType, string> = {
  cost_threshold: "Cost",
  task_failure: "Task Failure",
  system_health: "System",
  budget_exceeded: "Budget",
};

export function AlertHistory({
  alerts,
  onAcknowledge,
  onResolve,
  loading = false,
  className,
}: AlertHistoryProps) {
  const [filter, setFilter] = useState<"all" | AlertStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | AlertSeverity>("all");

  const filteredAlerts = alerts.filter((alert) => {
    const statusMatch = filter === "all" || alert.status === filter;
    const severityMatch = severityFilter === "all" || alert.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const activeCount = alerts.filter((a) => a.status === "active").length;

  if (loading) {
    return (
      <Card className={cn("border-slate-800 bg-slate-900", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <History className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-slate-200">
                Alert History
              </CardTitle>
              <p className="text-xs text-slate-500">
                {activeCount > 0 ? (
                  <span className="text-red-400">{activeCount} active alerts</span>
                ) : (
                  "No active alerts"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="bg-slate-800 h-8">
                <TabsTrigger value="all" className="text-xs data-[state=active]:bg-blue-600">
                  All
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs data-[state=active]:bg-red-600">
                  Active
                </TabsTrigger>
                <TabsTrigger value="acknowledged" className="text-xs data-[state=active]:bg-amber-600">
                  Ack
                </TabsTrigger>
                <TabsTrigger value="resolved" className="text-xs data-[state=active]:bg-emerald-600">
                  Resolved
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No alerts found</p>
            <p className="text-sm">
              {filter !== "all" ? "Try changing the filter" : "Alerts will appear here when triggered"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredAlerts.map((alert) => {
              const severity = severityConfig[alert.severity];
              const StatusIcon = severity.icon;
              const status = statusConfig[alert.status];

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    alert.status === "active"
                      ? severity.bg
                      : alert.status === "acknowledged"
                      ? "bg-amber-500/5 border-amber-500/10"
                      : "bg-slate-800/50 border-slate-700 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5", severity.color)}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-200">{alert.title}</p>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", status.color.replace("bg-", "bg-").replace("500", "500/20"), "text-white")}
                        >
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {typeLabels[alert.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
                      {alert.agentName && (
                        <p className="text-xs text-slate-500 mt-1">
                          Agent: {alert.agentName}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                        {alert.acknowledgedAt && (
                          <span className="text-amber-400">
                            Acknowledged {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}
                          </span>
                        )}
                        {alert.resolvedAt && (
                          <span className="text-emerald-400">
                            Resolved {formatDistanceToNow(new Date(alert.resolvedAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {alert.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAcknowledge(alert.id)}
                          className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          title="Acknowledge"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {(alert.status === "active" || alert.status === "acknowledged") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResolve(alert.id)}
                          className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          title="Resolve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
