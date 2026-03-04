export interface AgentNode {
  id: string;
  name: string;
  emoji: string;
  type: 'orchestrator' | 'trader' | 'product' | 'ios' | 'distribution' | 'memory';
  status: 'active' | 'idle' | 'paused' | 'completed' | 'failed';
  currentTask?: string;
  activityLevel: number; // 0-100
  color: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // collaboration frequency
  types: CollaborationType[];
  recentWeight: number; // time-decayed weight
  lastInteraction: Date;
  interactions: number;
  dependencies?: TaskDependency[];
}

export type CollaborationType = 'mention' | 'handoff' | 'dependency' | 'block' | 'unblock' | 'collab_request';

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  blocking: boolean;
}

export interface CollaborationMetric {
  agent1: string;
  agent2: string;
  totalInteractions: number;
  interactions7d: number;
  interactions30d: number;
  lastInteraction: Date;
  interactionTypes: Record<CollaborationType, number>;
}

export interface AgentStats {
  agent: string;
  totalCollaborations: number;
  uniquePartners: number;
  collaborationScore: number; // weighted score
  isolationLevel: 'high' | 'medium' | 'low';
  topPartners: string[];
}

export interface GraphFilter {
  timeRange: '7d' | '30d' | 'all';
  minWeight: number;
  showDependencies: boolean;
  showBlocking: boolean;
  agentTypes: string[];
}

export interface GraphPhysics {
  repelStrength: number;
  attractStrength: number;
  linkDistance: number;
  nodeCharge: number;
  gravity: number;
}
