"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { KPICards, type KPIData } from "@/components/KPICards";
import { FleetHealthTable, AgentHealth } from "@/components/FleetHealthTable";
import { RunTable } from "@/components/RunTable";
import { LogEntry } from "@/lib/agent-logger";
import { MiniChart } from "@/components/MiniChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
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
  DollarSign,
  Users,
  BarChart3,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { format, subDays, eachHourOfInterval, isSameHour } from "date-fns";
import { 
  getAgents, 
  getAgentRuns, 
  subscribeToAgents, 
  subscribeToAgentRuns,
  Agent,
  AgentRun,
  AgentStats,
  getAgentStats,
} from "@/lib/supabase-real";
import { DailySummaryWidget } from "@/components/analytics";
import { useAnalyticsData, useAlerts } from "@/hooks/useAnalyticsData";

// Map agent status from DB to UI
function mapAgentStatus(status: string): AgentHealth['status'] {
  switch (status) {
    case 'active': return 'busy'
    case 'idle': return 'online'
    case 'error': return 'error'
    case 'offline': return 'offline'
    case 'paused': return 'offline'
    default: return 'offline'
  }
}

// Generate mock latency history (will be replaced with real metrics later)
function generateLatencyHistory(): { timestamp: string; value: number }[] {
  return Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    value: 200 + Math.random() * 100
  }))
}

// Convert Agent + stats to AgentHealth
function convertToAgentHealth(agent: Agent & { stats?: AgentStats }): AgentHealth {
  const stats = agent.stats || {
    runs24h: 0,
    successRate: 100,
    avgLatency: 0,
    totalTokens: 0,
    errorRate: 0,
  }

  return {
    id: agent.slug,
    name: agent.name,
    status: mapAgentStatus(agent.status),
    version: agent.version || '1.0.0',
    lastHeartbeat: agent.last_heartbeat || agent.created_at,
    runs24h: stats.runs24h,
    errorRate: stats.errorRate,
    avgLatency: stats.avgLatency,
    tokens24h: stats.totalTokens,
    latencyHistory: generateLatencyHistory(),
    throughputHistory: generateLatencyHistory(),
    description: agent.description || undefined,
    environment: 'production',
  }
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({})
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRealtime, setIsRealtime] = useState(false)
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h")
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  // Analytics data for daily summary
  const { dailySummary, loading: analyticsLoading } = useAnalyticsData("24h")
  const { activeAlertCount } = useAlerts()

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch agents and runs in parallel
      const [agentsData, runsData] = await Promise.all([
        getAgents(),
        getAgentRuns(50),
      ])

      if (agentsData.length === 0 && runsData.length === 0) {
        // Don't treat empty data as error - just means no data yet
        console.log('[Dashboard] No data returned from Supabase')
      }

      setAgents(agentsData)
      setAgentRuns(runsData)

      // Fetch stats for each agent
      const statsMap: Record<string, AgentStats> = {}
      await Promise.all(
        agentsData.map(async (agent) => {
          const stats = await getAgentStats(agent.id)
          statsMap[agent.id] = stats
        })
      )
      setAgentStats(statsMap)

      setLastUpdated(new Date())
    } catch (err) {
      console.error('[Dashboard] Failed to fetch data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Setup realtime subscriptions
  useEffect(() => {
    // Subscribe to agent changes
    const agentsSubscription = subscribeToAgents((payload) => {
      setIsRealtime(true)
      
      if (payload.event === 'INSERT' && payload.new) {
        setAgents(prev => [...prev, payload.new!])
      } else if (payload.event === 'UPDATE' && payload.new) {
        setAgents(prev => 
          prev.map(a => a.id === payload.new!.id ? payload.new! : a)
        )
      } else if (payload.event === 'DELETE' && payload.old) {
        setAgents(prev => 
          prev.filter(a => a.id !== payload.old!.id)
        )
      }
    })

    // Subscribe to run changes
    const runsSubscription = subscribeToAgentRuns((payload) => {
      setIsRealtime(true)
      
      if (payload.event === 'INSERT' && payload.new) {
        setAgentRuns(prev => [payload.new!, ...prev].slice(0, 50))
      } else if (payload.event === 'UPDATE' && payload.new) {
        setAgentRuns(prev => 
          prev.map(r => r.id === payload.new!.id ? payload.new! : r)
        )
      }
    })

    return () => {
      agentsSubscription.unsubscribe()
      runsSubscription.unsubscribe()
    }
  }, [])

  // Transform agents with stats for FleetHealthTable
  const agentHealthData = useMemo((): AgentHealth[] => {
    return agents.map(agent => 
      convertToAgentHealth({ ...agent, stats: agentStats[agent.id] })
    )
  }, [agents, agentStats])

  // Transform runs for RunTable
  const logEntries = useMemo((): LogEntry[] => {
    return agentRuns.map(run => ({
      id: run.id,
      timestamp: run.created_at,
      agent: run.agent?.name || run.agent_id,
      project: 'general',
      status: (run.status === 'completed' ? 'completed' :
              run.status === 'failed' ? 'failed' :
              run.status === 'running' ? 'in-progress' : 'created') as LogEntry['status'],
      description: run.input_summary || `${run.trigger_type} execution`,
      details: {
        duration: run.duration_ms,
        tokens: run.tokens_total,
        cost: run.cost_usd,
        trigger: run.trigger_type,
      },
      links: {},
      estimated_impact: 'medium' as LogEntry['estimated_impact'],
      created_at: run.created_at,
    }))
  }, [agentRuns])

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const totalAgents = agents.length
    const onlineAgents = agents.filter(a => a.status === 'idle').length
    const busyAgents = agents.filter(a => a.status === 'active').length
    const offlineAgents = agents.filter(a => a.status === 'offline' || a.status === 'error').length
    
    const today = new Date().toDateString()
    const runsToday = agentRuns.filter(run => 
      new Date(run.created_at).toDateString() === today
    ).length
    
    const runs7d = agentRuns.length
    
    const completed = agentRuns.filter(r => r.status === 'completed').length
    const totalRuns = agentRuns.length
    const successRate = totalRuns > 0 
      ? Math.round((completed / totalRuns) * 100)
      : 0
    
    const avgLatency = Object.values(agentStats).reduce((acc, s) => acc + s.avgLatency, 0) / 
      (Object.keys(agentStats).length || 1)
    
    const totalTokens = Object.values(agentStats).reduce((acc, s) => acc + s.totalTokens, 0)
    const estimatedCost = (totalTokens / 1000) * 0.002 // Rough estimate

    return [
      {
        label: "Total Agents",
        value: totalAgents || 0,
        change: `${onlineAgents} online`,
        trend: "neutral" as const,
        icon: Bot,
        color: "blue" as const,
        description: `${busyAgents} busy · ${offlineAgents} offline`,
      },
      {
        label: "Runs Today / 7d",
        value: `${runsToday} / ${runs7d}`,
        change: runsToday > 0 ? `+${runsToday}` : "0",
        trend: runsToday > 0 ? "up" : "neutral" as const,
        icon: Activity,
        color: "green" as const,
        description: "Total executions",
      },
      {
        label: "Success Rate",
        value: `${successRate}%`,
        change: "7d avg",
        trend: (successRate > 95 ? "up" : successRate > 80 ? "neutral" : "down") as KPIData["trend"],
        icon: CheckCircle,
        color: (successRate > 95 ? "green" : successRate > 80 ? "amber" : "red") as KPIData["color"],
        description: "Task completion rate",
      },
      {
        label: "Avg / P95 Latency",
        value: avgLatency ? `${Math.round(avgLatency)}ms` : 'N/A',
        change: avgLatency ? `${Math.round(avgLatency * 1.5)}ms` : '',
        trend: (avgLatency < 1000 ? "up" : "down") as KPIData["trend"],
        icon: Clock,
        color: (avgLatency < 500 ? "green" : avgLatency < 1000 ? "amber" : "red") as KPIData["color"],
        description: "Response time",
      },
      {
        label: "Tokens / Est. Cost",
        value: totalTokens ? `${(totalTokens / 1000000).toFixed(1)}M` : '0',
        change: totalTokens ? `$${estimatedCost.toFixed(2)}` : '$0.00',
        trend: "neutral" as const,
        icon: DollarSign,
        color: "purple" as const,
        description: "24h consumption",
      },
      {
        label: "Active Users",
        value: "1",
        change: "R",
        trend: "neutral" as const,
        icon: Users,
        color: "cyan" as const,
        description: "Human operators",
      },
    ]
  }, [agents, agentRuns, agentStats])

  // Generate chart data
  const runsOverTimeData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: format(subDays(new Date(), 0).setHours(i), "HH:mm"),
      runs: Math.floor(Math.random() * 50), // Will be replaced with real data
      errors: Math.floor(Math.random() * 5),
    }))
  }, [timeRange])

  const tokenUsageData = useMemo(() => {
    return agents.map(agent => {
      const stats = agentStats[agent.id]
      const status = mapAgentStatus(agent.status)
      return {
        name: agent.name,
        tokens: stats?.totalTokens || 0,
        color: status === "online" ? "#10b981" : status === "busy" ? "#f59e0b" : "#64748b",
      }
    })
  }, [agents, agentStats])

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-100">Mission Control</h1>
                {isRealtime && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-slate-400">
                Real-time observability for your AI agent fleet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: {format(lastUpdated, 'HH:mm:ss')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
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
                onClick={fetchData}
                disabled={loading}
                className="border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Connection Error</p>
                <p className="text-red-400/80 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <KPICards kpis={kpis} columns={6} className="mb-6" />

        {/* Daily Summary Widget */}
        <DailySummaryWidget 
          data={{ ...dailySummary, activeAlerts: activeAlertCount }} 
          loading={analyticsLoading}
          className="mb-6"
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Fleet Health - Takes 2 columns */}
          <div className="xl:col-span-2">
            <FleetHealthTable 
              agents={agentHealthData} 
              loading={loading}
              showLatencyChart={true}
            />
            {agents.length === 0 && !loading && (
              <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
                <p className="text-slate-400">No agents found in database.</p>
                <p className="text-slate-500 text-sm mt-1">
                  Add agents to Supabase to see them here.
                </p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Charts */}
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  Runs Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiniChart
                  data={runsOverTimeData}
                  dataKey="runs"
                  xKey="hour"
                  type="area"
                  color="#3b82f6"
                  height={120}
                  showGrid={true}
                  showTooltip={true}
                  gradientFrom="#3b82f6"
                  gradientTo="#3b82f6"
                />
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Error Rate Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MiniChart
                  data={runsOverTimeData}
                  dataKey="errors"
                  xKey="hour"
                  type="line"
                  color="#ef4444"
                  height={100}
                  showGrid={false}
                  showTooltip={true}
                />
              </CardContent>
            </Card>

            {/* Token Usage by Agent */}
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Token Usage by Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tokenUsageData.length > 0 ? (
                  tokenUsageData.map((agent) => (
                    <div key={agent.name} className="flex items-center gap-3">
                      <div 
                        className="h-2 w-2 rounded-full" 
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="flex-1 text-sm text-slate-300">{agent.name}</span>
                      <span className="text-sm font-medium text-slate-100">
                        {agent.tokens > 0 ? `${(agent.tokens / 1000000).toFixed(1)}M` : '0'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">
                    No token usage data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="mt-6">
          <RunTable 
            runs={logEntries} 
            loading={loading}
            showPagination={true}
            pageSize={5}
            showFilters={false}
          />
          {agentRuns.length === 0 && !loading && (
            <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 text-center">
              <p className="text-slate-400">No agent runs found.</p>
              <p className="text-slate-500 text-sm mt-1">
                Run history will appear here once agents start executing tasks.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
