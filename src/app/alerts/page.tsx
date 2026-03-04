"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { AlertConfig, AlertHistory } from "@/components/analytics";
import { useAlerts, useBudgetSettings } from "@/hooks/useAnalyticsData";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

// Mock agents for alert configuration
const mockAgents = [
  { id: "traderbot", name: "TraderBot" },
  { id: "productbuilder", name: "ProductBuilder" },
  { id: "ios-app-builder", name: "iOSAppBuilder" },
  { id: "distribution", name: "DistributionAgent" },
  { id: "memorymanager", name: "MemoryManager" },
];

import { AlertRule } from "@/types/analytics";

// Mock initial rules
const mockRules: AlertRule[] = [
  {
    id: "rule-1",
    name: "Daily Cost Alert",
    type: "cost_threshold",
    enabled: true,
    threshold: 10,
    timeframe: "24h",
    agents: [],
    channels: ["email"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rule-2",
    name: "Task Failure Alert",
    type: "task_failure",
    enabled: true,
    threshold: 3,
    timeframe: "1h",
    agents: [],
    channels: ["email", "slack"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function AlertsPage() {
  const { alerts, loading: alertsLoading, activeAlertCount, acknowledgeAlert, resolveAlert } = useAlerts();
  const { agents } = useAnalyticsData("24h");
  const [rules, setRules] = useState(mockRules);

  const criticalCount = alerts.filter(a => a.severity === "critical" && a.status === "active").length;
  const warningCount = alerts.filter(a => a.severity === "warning" && a.status === "active").length;
  const infoCount = alerts.filter(a => a.severity === "info" && a.status === "active").length;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Alerts</h1>
            {activeAlertCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-sm font-medium">
                {activeAlertCount} active
              </span>
            )}
          </div>
          <p className="text-slate-400">
            Monitor and manage system alerts and notifications
          </p>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Critical</p>
                  <p className="text-xl font-bold text-red-400">{criticalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Warnings</p>
                  <p className="text-xl font-bold text-amber-400">{warningCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Info</p>
                  <p className="text-xl font-bold text-blue-400">{infoCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Active</p>
                  <p className="text-xl font-bold text-slate-100">{activeAlertCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertHistory
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onResolve={resolveAlert}
            loading={alertsLoading}
          />
          <AlertConfig
            rules={rules}
            agents={agents.map(a => ({ id: a.id, name: a.name }))}
            onUpdate={setRules}
          />
        </div>
      </main>
    </div>
  );
}
