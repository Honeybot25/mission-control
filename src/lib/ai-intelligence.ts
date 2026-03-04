/**
 * AI Intelligence System
 * Auto-generates insights, standups, and recommendations
 */

import { supabase } from './supabase-client';
import { AgentRun, AgentEvent } from '@/types/agent';

// Types
export interface StandupReport {
  id: string;
  date: string;
  summary: string;
  completed: number;
  inProgress: number;
  failed: number;
  blockers: Blocker[];
  suggestions: string[];
}

export interface Blocker {
  id: string;
  blockedAgent: string;
  blockingAgent: string;
  task: string;
  duration: number; // minutes
}

export interface Anomaly {
  id: string;
  type: 'failure_spike' | 'agent_idle' | 'error_rate' | 'dependency_chain';
  severity: 'low' | 'medium' | 'high' | 'critical';
  agent?: string;
  message: string;
  detectedAt: string;
  acknowledged: boolean;
}

export interface PatternSuggestion {
  id: string;
  message: string;
  action: string;
  confidence: number;
}

/**
 * Generate daily standup report from agent activity
 */
export async function generateDailyStandup(date: string = new Date().toISOString().split('T')[0]): Promise<StandupReport> {
  if (!supabase) {
    return {
      id: `standup-${date}`,
      date,
      summary: 'Supabase not configured',
      completed: 0,
      inProgress: 0,
      failed: 0,
      blockers: [],
      suggestions: [],
    };
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all runs from yesterday
  const { data: runs } = await supabase
    .from('agent_runs')
    .select('*')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  const completed = runs?.filter(r => r.status === 'completed').length || 0;
  const inProgress = runs?.filter(r => r.status === 'in-progress').length || 0;
  const failed = runs?.filter(r => r.status === 'failed').length || 0;

  // Get active blockers
  const blockers = await detectBlockers();

  // Generate suggestions
  const suggestions = await generateSuggestions(runs || []);

  return {
    id: `standup-${date}`,
    date,
    summary: `${completed} completed, ${inProgress} in-progress, ${failed} failed`,
    completed,
    inProgress,
    failed,
    blockers,
    suggestions,
  };
}

/**
 * Save standup report
 */
export async function saveStandupReport(report: StandupReport): Promise<void> {
  if (!supabase) return;
  await supabase.from('standup_reports').upsert(report);
}

/**
 * Get standup report for date
 */
export async function getStandupReport(date: string): Promise<StandupReport | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('standup_reports')
    .select('*')
    .eq('date', date)
    .single();
  return data;
}

/**
 * Detect blockers between agents
 */
export async function detectBlockers(): Promise<Blocker[]> {
  if (!supabase) return [];
  const { data: dependencies } = await supabase
    .from('task_dependencies')
    .select('*')
    .eq('status', 'blocked');

  return dependencies?.map(d => ({
    id: d.id,
    blockedAgent: d.blocked_agent,
    blockingAgent: d.blocking_agent,
    task: d.task_description,
    duration: Math.floor((Date.now() - new Date(d.blocked_at).getTime()) / 60000),
  })) || [];
}

/**
 * Create task dependency
 */
export async function createTaskDependency(
  blockedAgent: string,
  blockingAgent: string,
  task: string
): Promise<void> {
  if (!supabase) return;
  await supabase.from('task_dependencies').insert({
    blocked_agent: blockedAgent,
    blocking_agent: blockingAgent,
    task_description: task,
    status: 'blocked',
    blocked_at: new Date().toISOString(),
  });
}

/**
 * Resolve blocker
 */
export async function resolveBlocker(blockerId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('task_dependencies')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', blockerId);
}

/**
 * Detect anomalies in agent activity
 */
export async function detectAnomalies(): Promise<Anomaly[]> {
  if (!supabase) return [];
  const anomalies: Anomaly[] = [];

  // Check for failure spikes
  const { data: recentFailures } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('status', 'failed')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

  if (recentFailures && recentFailures.length >= 3) {
    anomalies.push({
      id: `failure-spike-${Date.now()}`,
      type: 'failure_spike',
      severity: 'high',
      message: `${recentFailures.length} failures in the last hour`,
      detectedAt: new Date().toISOString(),
      acknowledged: false,
    });
  }

  // Check for idle agents
  const { data: agents } = await supabase.from('agents').select('*');
  for (const agent of agents || []) {
    const { data: lastRun } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastRun) {
      const hoursSince = (Date.now() - new Date(lastRun.created_at).getTime()) / 3600000;
      if (hoursSince > 6) {
        anomalies.push({
          id: `idle-${agent.id}-${Date.now()}`,
          type: 'agent_idle',
          severity: 'medium',
          agent: agent.name,
          message: `${agent.name} has been idle for ${Math.floor(hoursSince)} hours`,
          detectedAt: new Date().toISOString(),
          acknowledged: false,
        });
      }
    }
  }

  return anomalies;
}

/**
 * Get active (unacknowledged) anomalies
 */
export async function getActiveAnomalies(): Promise<Anomaly[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('anomalies')
    .select('*')
    .eq('acknowledged', false)
    .order('detected_at', { ascending: false });
  return data || [];
}

/**
 * Acknowledge anomaly
 */
export async function acknowledgeAnomaly(anomalyId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('anomalies')
    .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq('id', anomalyId);
}

/**
 * Get activity patterns for suggestions
 */
export async function getActivityPatterns(agentId: string): Promise<any> {
  if (!supabase) return {};
  const { data: runs } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('agent_id', agentId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 3600000).toISOString()); // Last 7 days

  const hourCounts: Record<number, number> = {};
  runs?.forEach(run => {
    const hour = new Date(run.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  return hourCounts;
}

/**
 * Generate smart suggestions based on patterns
 */
export async function generateSuggestions(runs: AgentRun[]): Promise<string[]> {
  const suggestions: string[] = [];

  // Pattern-based suggestions
  const agentActivity: Record<string, number> = {};
  runs.forEach(run => {
    agentActivity[run.agent_id] = (agentActivity[run.agent_id] || 0) + 1;
  });

  // Suggest for inactive agents
  Object.entries(agentActivity)
    .filter(([, count]) => count === 0)
    .forEach(([agent]) => {
      suggestions.push(`Consider assigning tasks to ${agent} — no activity today`);
    });

  return suggestions;
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'text-blue-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };
  return colors[severity] || 'text-gray-400';
}

/**
 * Get severity label
 */
export function getSeverityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

/**
 * Get anomaly icon
 */
export function getAnomalyIcon(type: string): string {
  const icons: Record<string, string> = {
    failure_spike: '⚠️',
    agent_idle: '💤',
    error_rate: '📈',
    dependency_chain: '🔗',
  };
  return icons[type] || '⚡';
}

/**
 * Play alert sound
 */
export function playAlertSound(severity: string): void {
  if (typeof window === 'undefined') return;
  
  const audio = new Audio();
  const frequencies: Record<string, number> = {
    low: 400,
    medium: 600,
    high: 800,
    critical: 1000,
  };
  
  // Simple beep using Web Audio API
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.value = frequencies[severity] || 600;
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

export default {
  generateDailyStandup,
  saveStandupReport,
  getStandupReport,
  detectBlockers,
  createTaskDependency,
  resolveBlocker,
  detectAnomalies,
  getActiveAnomalies,
  acknowledgeAnomaly,
  getActivityPatterns,
  generateSuggestions,
  formatRelativeTime,
  getSeverityColor,
  getSeverityLabel,
  getAnomalyIcon,
  playAlertSound,
};