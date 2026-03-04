"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Activity,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  Zap,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { getRecentActivity, LogEntry, subscribeToActivity } from "@/lib/agent-logger";
import AgentRadar from "@/components/dashboard/AgentRadar";
import StreakCounter from "@/components/dashboard/StreakCounter";
import BlockerSpotlight from "@/components/dashboard/BlockerSpotlight";
import AutoStandup from "@/components/dashboard/AutoStandup";
import CrossAgentSuggestions from "@/components/dashboard/CrossAgentSuggestions";

interface Stats {
  label: string;
  value: string;
  change: string;
  icon: typeof Bot;
  color: string;
  trend: "up" | "down";
}

const quickActions = [
  { icon: Zap, label: "Spawn Agent", color: "bg-amber-500", href: "/agents" },
  { icon: TrendingUp, label: "Market Intel", color: "bg-indigo-500", href: "/market-intelligence" },
  { icon: Clock, label: "Schedule Task", color: "bg-green-500", href: "/activity" },
];

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed": return "bg-green-100 text-green-600";
    case "failed": return "bg-red-100 text-red-600";
    case "in-progress": return "bg-amber-100 text-amber-600";
    default: return "bg-blue-100 text-blue-600";
  }
}

function getImpactBadge(impact: string): string {
  switch (impact) {
    case "critical": return "High";
    case "high": return "High";
    default: return "Medium";
  }
}

export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(false);
  const [stats, setStats] = useState<Stats[]>([
    { label: "Active Agents", value: "5", change: "+0", icon: Bot, color: "bg-blue-500", trend: "up" },
    { label: "Tasks Today", value: "0", change: "+0", icon: CheckCircle, color: "bg-green-500", trend: "up" },
    { label: "Pending Tasks", value: "0", change: "+0", icon: AlertCircle, color: "bg-amber-500", trend: "down" },
    { label: "Activity", value: "0%", change: "+0%", icon: Activity, color: "bg-purple-500", trend: "up" },
  ]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const logs = await getRecentActivity(10);
      setRecentActivity(logs);

      // Calculate stats
      const today = new Date().toDateString();
      const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);
      const completedToday = todayLogs.filter(log => log.status === "completed").length;
      const inProgress = logs.filter(log => log.status === "in-progress" || log.status === "started").length;
      const uniqueAgents = new Set(logs.map(log => log.agent)).size;
      
      // Calculate activity rate (logs in last hour / 10 as percentage)
      const oneHourAgo = new Date(Date.now() - 3600000);
      const recentCount = logs.filter(log => new Date(log.timestamp) > oneHourAgo).length;
      const activityRate = Math.min(recentCount * 10, 100);

      setStats([
        { label: "Active Agents", value: String(uniqueAgents || 5), change: "+0", icon: Bot, color: "bg-blue-500", trend: "up" },
        { label: "Tasks Today", value: String(completedToday), change: "+0", icon: CheckCircle, color: "bg-green-500", trend: "up" },
        { label: "In Progress", value: String(inProgress), change: "+0", icon: AlertCircle, color: "bg-amber-500", trend: "down" },
        { label: "Activity", value: `${activityRate}%`, change: "+0%", icon: Activity, color: "bg-purple-500", trend: "up" },
      ]);

      setLoading(false);
    }

    fetchData();

    // Subscribe to real-time updates
    const subscription = subscribeToActivity((payload) => {
      setIsRealtime(true);
      if (payload.event === "INSERT" && payload.new) {
        setRecentActivity(prev => [payload.new, ...prev].slice(0, 10));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <main className="lg:ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            {isRealtime && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-slate-600">
            Welcome back. Here&apos;s what&apos;s happening with your agents.
          </p>
        </div>

        {/* Phase 1 Features */}
        {/* Blocker Spotlight - Shows when agents are blocked */}
        <div className="mb-6">
          <BlockerSpotlight />
        </div>

        {/* Agent Radar & Streaks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AgentRadar />
          <StreakCounter />
        </div>

        {/* Phase 2 Features */}
        {/* Auto-Standup & Cross-Agent Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AutoStandup />
          <CrossAgentSuggestions />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white`}>
                    <stat.icon size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {stat.trend === "up" ? (
                      <ArrowUpRight size={16} className="text-green-600" />
                    ) : (
                      <ArrowUpRight size={16} className="text-amber-600 rotate-90" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-600" : "text-amber-600"}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Link href="/activity">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>No activity yet. Agents will appear here when they log their work.</p>
                  <p className="text-sm mt-2">Check the <Link href="/agents" className="text-blue-600 hover:underline">Agents</Link> page to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(item.status)}`}>
                        <CheckCircle size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">{item.agent}</span>
                          <Badge
                            variant={item.estimated_impact === "high" || item.estimated_impact === "critical" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {getImpactBadge(item.estimated_impact)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                      <span className="text-sm text-slate-400">{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4 px-4 border-slate-200 hover:bg-slate-50"
                    >
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white`}>
                        <action.icon size={20} />
                      </div>
                      <span className="font-medium">{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-slate-900 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium">System Online</span>
                </div>
                <p className="text-2xl font-bold">v2.0.0</p>
                <p className="text-slate-400 text-sm">All systems operational</p>
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <Link href="/agents" className="text-sm text-blue-400 hover:text-blue-300">
                    View Agent Status →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Logging Guide */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Agent Logging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  All agents must log their activity to Mission Control for real-time visibility.
                </p>
                <a 
                  href="https://github.com/honey/mission-control/blob/main/AGENT_LOGGING_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    View Logging Guide
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
