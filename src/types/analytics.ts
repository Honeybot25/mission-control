export type TimeRange = "1h" | "24h" | "7d" | "30d";

export interface CostData {
  date: string;
  totalCost: number;
  agentCosts: Record<string, number>;
  modelCosts: Record<string, number>;
}

export interface AgentCostBreakdown {
  agentId: string;
  agentName: string;
  totalCost: number;
  runCount: number;
  avgCostPerRun: number;
  percentageOfTotal: number;
}

export interface ModelCostBreakdown {
  model: string;
  totalCost: number;
  tokenCount: number;
  percentageOfTotal: number;
}

export interface PerformanceMetrics {
  date: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDuration: number;
  p95Duration: number;
  throughput: number; // runs per hour
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  errorRate: number;
  trend: "up" | "down" | "neutral";
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type AlertType = "cost_threshold" | "task_failure" | "system_health" | "budget_exceeded";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  agentId?: string;
  agentName?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  enabled: boolean;
  threshold?: number;
  timeframe?: TimeRange;
  agents?: string[]; // empty = all agents
  channels: string[]; // notification channels
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string;
  totalCost: number;
  costChange: number; // percentage change from previous day
  tasksCompleted: number;
  tasksFailed: number;
  activeAlerts: number;
  totalTokens: number;
  avgResponseTime: number;
}

export interface BudgetSettings {
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  alertThresholds: {
    daily: number; // percentage (e.g., 80 = alert at 80% of budget)
    weekly: number;
    monthly: number;
  };
}
