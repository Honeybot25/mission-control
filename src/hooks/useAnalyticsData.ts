import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  CostData, 
  AgentCostBreakdown, 
  ModelCostBreakdown, 
  PerformanceMetrics, 
  AgentPerformance,
  Alert,
  AlertRule,
  DailySummary,
  BudgetSettings,
  TimeRange 
} from "@/types/analytics";
import { AgentRun, Agent, getAgentRuns, getAgents } from "@/lib/supabase-real";

// Cost per 1K tokens for different models (approximate)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-3-opus": { input: 0.015, output: 0.075 },
  "claude-3-sonnet": { input: 0.003, output: 0.015 },
  "claude-3-haiku": { input: 0.00025, output: 0.00125 },
  "gpt-4": { input: 0.03, output: 0.06 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "default": { input: 0.003, output: 0.015 },
};

export function useAnalyticsData(timeRange: TimeRange = "24h") {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStartDate = useCallback(() => {
    const now = new Date();
    switch (timeRange) {
      case "1h": return new Date(now.getTime() - 60 * 60 * 1000);
      case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }, [timeRange]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [agentsData, runsData] = await Promise.all([
        getAgents(),
        getAgentRuns(1000), // Get more runs for analytics
      ]);
      
      setAgents(agentsData);
      
      // Filter runs by time range
      const startDate = getStartDate();
      const filteredRuns = runsData.filter(run => 
        new Date(run.created_at) >= startDate
      );
      setRuns(filteredRuns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  }, [getStartDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate cost data over time
  const costData = useMemo((): CostData[] => {
    const startDate = getStartDate();
    const dataMap = new Map<string, CostData>();
    
    // Generate time buckets based on range
    const bucketCount = timeRange === "1h" ? 12 : timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
    const bucketSize = (Date.now() - startDate.getTime()) / bucketCount;
    
    for (let i = 0; i < bucketCount; i++) {
      const bucketTime = new Date(startDate.getTime() + i * bucketSize);
      const key = timeRange === "7d" || timeRange === "30d" 
        ? bucketTime.toISOString().split("T")[0]
        : bucketTime.toISOString().slice(0, 13) + ":00";
      
      dataMap.set(key, {
        date: key,
        totalCost: 0,
        agentCosts: {},
        modelCosts: {},
      });
    }

    // Aggregate runs into buckets
    runs.forEach(run => {
      const runDate = new Date(run.created_at);
      const key = timeRange === "7d" || timeRange === "30d"
        ? runDate.toISOString().split("T")[0]
        : runDate.toISOString().slice(0, 13) + ":00";
      
      const bucket = dataMap.get(key);
      if (bucket) {
        const cost = run.cost_usd || estimateCost(run);
        bucket.totalCost += cost;
        
        // Agent costs
        const agentName = run.agent?.name || run.agent_id.slice(0, 8);
        bucket.agentCosts[agentName] = (bucket.agentCosts[agentName] || 0) + cost;
        
        // Model costs (simplified - use tokens as proxy)
        const model = run.tokens_total && run.tokens_total > 100000 ? "gpt-4" : "gpt-3.5-turbo";
        bucket.modelCosts[model] = (bucket.modelCosts[model] || 0) + cost;
      }
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [runs, timeRange, getStartDate]);

  // Agent cost breakdown
  const agentCostBreakdown = useMemo((): AgentCostBreakdown[] => {
    const agentMap = new Map<string, AgentCostBreakdown>();
    let totalCost = 0;

    runs.forEach(run => {
      const agentId = run.agent_id;
      const agentName = run.agent?.name || run.agent_id.slice(0, 8);
      const cost = run.cost_usd || estimateCost(run);
      
      totalCost += cost;
      
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agentId,
          agentName,
          totalCost: 0,
          runCount: 0,
          avgCostPerRun: 0,
          percentageOfTotal: 0,
        });
      }
      
      const breakdown = agentMap.get(agentId)!;
      breakdown.totalCost += cost;
      breakdown.runCount += 1;
    });

    // Calculate averages and percentages
    const result = Array.from(agentMap.values());
    result.forEach(breakdown => {
      breakdown.avgCostPerRun = breakdown.totalCost / breakdown.runCount;
      breakdown.percentageOfTotal = totalCost > 0 ? (breakdown.totalCost / totalCost) * 100 : 0;
    });

    return result.sort((a, b) => b.totalCost - a.totalCost);
  }, [runs]);

  // Model cost breakdown
  const modelCostBreakdown = useMemo((): ModelCostBreakdown[] => {
    const modelMap = new Map<string, ModelCostBreakdown>();
    let totalCost = 0;

    runs.forEach(run => {
      const model = run.tokens_total && run.tokens_total > 100000 ? "gpt-4" : "gpt-3.5-turbo";
      const cost = run.cost_usd || estimateCost(run);
      const tokens = run.tokens_total || 0;
      
      totalCost += cost;
      
      if (!modelMap.has(model)) {
        modelMap.set(model, {
          model,
          totalCost: 0,
          tokenCount: 0,
          percentageOfTotal: 0,
        });
      }
      
      const breakdown = modelMap.get(model)!;
      breakdown.totalCost += cost;
      breakdown.tokenCount += tokens;
    });

    const result = Array.from(modelMap.values());
    result.forEach(breakdown => {
      breakdown.percentageOfTotal = totalCost > 0 ? (breakdown.totalCost / totalCost) * 100 : 0;
    });

    return result.sort((a, b) => b.totalCost - a.totalCost);
  }, [runs]);

  // Performance metrics
  const performanceMetrics = useMemo((): PerformanceMetrics[] => {
    const startDate = getStartDate();
    const dataMap = new Map<string, PerformanceMetrics>();
    
    const bucketCount = timeRange === "1h" ? 12 : timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
    const bucketSize = (Date.now() - startDate.getTime()) / bucketCount;
    
    for (let i = 0; i < bucketCount; i++) {
      const bucketTime = new Date(startDate.getTime() + i * bucketSize);
      const key = timeRange === "7d" || timeRange === "30d"
        ? bucketTime.toISOString().split("T")[0]
        : bucketTime.toISOString().slice(0, 13) + ":00";
      
      dataMap.set(key, {
        date: key,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        avgDuration: 0,
        p95Duration: 0,
        throughput: 0,
      });
    }

    const durationsByBucket: Record<string, number[]> = {};

    runs.forEach(run => {
      const runDate = new Date(run.created_at);
      const key = timeRange === "7d" || timeRange === "30d"
        ? runDate.toISOString().split("T")[0]
        : runDate.toISOString().slice(0, 13) + ":00";
      
      const bucket = dataMap.get(key);
      if (bucket) {
        bucket.totalRuns += 1;
        if (run.status === "completed") bucket.successfulRuns += 1;
        if (run.status === "failed") bucket.failedRuns += 1;
        
        if (run.duration_ms) {
          if (!durationsByBucket[key]) durationsByBucket[key] = [];
          durationsByBucket[key].push(run.duration_ms);
        }
      }
    });

    // Calculate averages and percentiles
    const result = Array.from(dataMap.values());
    result.forEach(bucket => {
      const durations = durationsByBucket[bucket.date] || [];
      if (durations.length > 0) {
        bucket.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const sorted = durations.sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        bucket.p95Duration = sorted[p95Index] || sorted[sorted.length - 1] || 0;
      }
      bucket.throughput = bucket.totalRuns / (timeRange === "1h" ? 1 : timeRange === "24h" ? 1 : 24);
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [runs, timeRange, getStartDate]);

  // Agent performance
  const agentPerformance = useMemo((): AgentPerformance[] => {
    const agentMap = new Map<string, AgentPerformance>();

    runs.forEach(run => {
      const agentId = run.agent_id;
      const agentName = run.agent?.name || run.agent_id.slice(0, 8);
      
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, {
          agentId,
          agentName,
          totalRuns: 0,
          successRate: 0,
          avgDuration: 0,
          p95Duration: 0,
          errorRate: 0,
          trend: "neutral",
        });
      }
      
      const perf = agentMap.get(agentId)!;
      perf.totalRuns += 1;
    });

    // Calculate metrics for each agent
    const result = Array.from(agentMap.values());
    result.forEach(perf => {
      const agentRuns = runs.filter(r => r.agent_id === perf.agentId);
      const completed = agentRuns.filter(r => r.status === "completed").length;
      const failed = agentRuns.filter(r => r.status === "failed").length;
      const durations = agentRuns.map(r => r.duration_ms).filter(Boolean) as number[];
      
      perf.successRate = agentRuns.length > 0 ? (completed / agentRuns.length) * 100 : 0;
      perf.errorRate = agentRuns.length > 0 ? (failed / agentRuns.length) * 100 : 0;
      
      if (durations.length > 0) {
        perf.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const sorted = durations.sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        perf.p95Duration = sorted[p95Index] || sorted[sorted.length - 1] || 0;
      }
      
      // Determine trend (compare first half vs second half)
      const midPoint = Math.floor(agentRuns.length / 2);
      const firstHalfSuccess = agentRuns.slice(0, midPoint).filter(r => r.status === "completed").length;
      const secondHalfSuccess = agentRuns.slice(midPoint).filter(r => r.status === "completed").length;
      const firstHalfRate = midPoint > 0 ? firstHalfSuccess / midPoint : 0;
      const secondHalfRate = agentRuns.length - midPoint > 0 ? secondHalfSuccess / (agentRuns.length - midPoint) : 0;
      
      if (secondHalfRate > firstHalfRate * 1.1) perf.trend = "up";
      else if (secondHalfRate < firstHalfRate * 0.9) perf.trend = "down";
      else perf.trend = "neutral";
    });

    return result.sort((a, b) => b.totalRuns - a.totalRuns);
  }, [runs]);

  // Calculate daily summary
  const dailySummary = useMemo((): DailySummary => {
    const today = new Date().toISOString().split("T")[0];
    const todayRuns = runs.filter(run => run.created_at.startsWith(today));
    
    const totalCost = todayRuns.reduce((sum, run) => sum + (run.cost_usd || estimateCost(run)), 0);
    const totalTokens = todayRuns.reduce((sum, run) => sum + (run.tokens_total || 0), 0);
    const completed = todayRuns.filter(r => r.status === "completed").length;
    const failed = todayRuns.filter(r => r.status === "failed").length;
    const durations = todayRuns.map(r => r.duration_ms).filter(Boolean) as number[];
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Calculate cost change (compare to previous day)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const yesterdayRuns = runs.filter(run => run.created_at.startsWith(yesterday));
    const yesterdayCost = yesterdayRuns.reduce((sum, run) => sum + (run.cost_usd || estimateCost(run)), 0);
    const costChange = yesterdayCost > 0 ? ((totalCost - yesterdayCost) / yesterdayCost) * 100 : 0;

    return {
      date: today,
      totalCost,
      costChange,
      tasksCompleted: completed,
      tasksFailed: failed,
      activeAlerts: 0, // Will be populated separately
      totalTokens,
      avgResponseTime: avgDuration,
    };
  }, [runs]);

  return {
    loading,
    error,
    costData,
    agentCostBreakdown,
    modelCostBreakdown,
    performanceMetrics,
    agentPerformance,
    dailySummary,
    runs,
    agents,
    refresh: fetchData,
  };
}

// Generate mock alerts for demo purposes
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate some sample alerts
    const sampleAlerts: Alert[] = [
      {
        id: "1",
        type: "cost_threshold",
        severity: "warning",
        status: "active",
        title: "Daily Cost Threshold Exceeded",
        message: "Daily cost has exceeded 80% of the budget ($8.50 / $10.00)",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: { current: 8.50, threshold: 10.00, percentage: 85 },
      },
      {
        id: "2",
        type: "task_failure",
        severity: "critical",
        status: "active",
        title: "Multiple Task Failures Detected",
        message: "Agent 'TraderBot' has failed 5 tasks in the last hour",
        agentId: "traderbot",
        agentName: "TraderBot",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        metadata: { failureCount: 5, timeframe: "1h" },
      },
      {
        id: "3",
        type: "system_health",
        severity: "info",
        status: "resolved",
        title: "System Maintenance Completed",
        message: "Scheduled maintenance window completed successfully",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "4",
        type: "budget_exceeded",
        severity: "critical",
        status: "acknowledged",
        title: "Monthly Budget Exceeded",
        message: "Monthly cost budget has been exceeded ($152.30 / $150.00)",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        acknowledgedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { current: 152.30, budget: 150.00 },
      },
    ];
    
    setAlerts(sampleAlerts);
    setLoading(false);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: "acknowledged", acknowledgedAt: new Date().toISOString() }
        : alert
    ));
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: "resolved", resolvedAt: new Date().toISOString() }
        : alert
    ));
  }, []);

  const activeAlertCount = alerts.filter(a => a.status === "active").length;

  return {
    alerts,
    loading,
    activeAlertCount,
    acknowledgeAlert,
    resolveAlert,
  };
}

// Mock budget settings
export function useBudgetSettings(): {
  settings: BudgetSettings;
  updateSettings: (settings: Partial<BudgetSettings>) => void;
} {
  const [settings, setSettings] = useState<BudgetSettings>({
    dailyBudget: 10,
    weeklyBudget: 50,
    monthlyBudget: 200,
    alertThresholds: {
      daily: 80,
      weekly: 80,
      monthly: 80,
    },
  });

  const updateSettings = useCallback((newSettings: Partial<BudgetSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return { settings, updateSettings };
}

// Helper function to estimate cost if not provided
function estimateCost(run: AgentRun): number {
  if (run.cost_usd) return run.cost_usd;
  if (run.tokens_total) {
    // Rough estimate: assume 70% input, 30% output
    const inputTokens = run.tokens_total * 0.7;
    const outputTokens = run.tokens_total * 0.3;
    const model = run.tokens_total > 100000 ? MODEL_COSTS["gpt-4"] : MODEL_COSTS["gpt-3.5-turbo"];
    return (inputTokens / 1000) * model.input + (outputTokens / 1000) * model.output;
  }
  // Default estimate based on duration
  const durationMinutes = (run.duration_ms || 0) / 60000;
  return durationMinutes * 0.01; // $0.01 per minute
}
