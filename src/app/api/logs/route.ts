import { NextResponse } from 'next/server';
import {
  getAgentRuns,
  getActiveAgentRuns,
  getAgents,
  createAgentRun,
  updateAgentRun,
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  AgentRun,
  Agent,
  ScheduledTask
} from '@/lib/supabase-client';
import { readFallbackLogs } from '@/lib/fallback-logger';
import { supabase } from '@/lib/supabase-client';

// Map agent slugs to their display info
const AGENT_INFO: Record<string, { name: string; description: string; channel: string }> = {
  traderbot: {
    name: 'TraderBot',
    description: 'Trading systems and execution',
    channel: '1473473950267740313',
  },
  productbuilder: {
    name: 'ProductBuilder',
    description: 'Building revenue-generating products',
    channel: '1473474027971547186',
  },
  distribution: {
    name: 'DistributionAgent',
    description: 'Content and X/Twitter distribution',
    channel: '1473473978658980046',
  },
  memorymanager: {
    name: 'MemoryManager',
    description: 'Nightly consolidation and knowledge management',
    channel: '1473474056341688575',
  },
  'ios-app-builder': {
    name: 'iOSAppBuilder',
    description: 'iOS app development and TestFlight',
    channel: '1473474027971547186',
  },
  securityagent: {
    name: 'SecurityAgent',
    description: 'Security scanning and monitoring',
    channel: '1473474006916006073',
  },
};

// Convert AgentRun to legacy log format for compatibility
function runToLogEntry(run: AgentRun & { agent?: Agent }) {
  const statusMap: Record<string, string> = {
    pending: 'created',
    running: 'in-progress',
    completed: 'completed',
    failed: 'failed',
    cancelled: 'failed',
    timeout: 'failed',
  };

  // Parse input_summary to extract task if possible
  let description = run.input_summary || 'Agent execution';
  try {
    const parsed = JSON.parse(description);
    if (parsed.task) description = parsed.task;
  } catch {
    // Use input_summary as-is if not valid JSON
  }

  return {
    id: run.id,
    timestamp: run.created_at,
    agent: run.agent?.name || run.agent_id,
    project: 'general',
    status: statusMap[run.status] || 'created',
    description,
    details: {
      duration: run.duration_ms,
      tokens: run.tokens_total,
      cost: run.cost_usd,
      trigger: run.trigger_type,
    },
    links: {},
    estimated_impact: 'medium',
    created_at: run.created_at,
  };
}

// GET handler - fetch logs, runs, agents, and tasks
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');
  const agentId = searchParams.get('agentId') || undefined;

  try {
    switch (type) {
      case 'runs': {
        const runs = await getAgentRuns(limit, agentId);
        return NextResponse.json({
          runs: runs.map(run => runToLogEntry(run)),
          lastUpdated: new Date().toISOString()
        });
      }

      case 'active': {
        const activeRuns = await getActiveAgentRuns();
        return NextResponse.json({
          runs: activeRuns.map(run => runToLogEntry(run)),
          lastUpdated: new Date().toISOString()
        });
      }

      case 'agents': {
        const agents = await getAgents();
        return NextResponse.json({
          agents,
          lastUpdated: new Date().toISOString()
        });
      }

      case 'tasks': {
        const status = searchParams.get('status') || undefined;
        const tasks = await getScheduledTasks(status, limit);
        return NextResponse.json({
          tasks,
          lastUpdated: new Date().toISOString()
        });
      }

      default: {
        // Return all data - merge Supabase with fallback logs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let logs: any[] = [];
        let agents: Agent[] = [];
        let tasks: ScheduledTask[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let activeRuns: any[] = [];

        try {
          // Fetch from log_entries table (activity logs)
          if (supabase) {
            const { data: logEntries, error: logError } = await supabase
              .from('log_entries')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(limit);
              
            if (!logError && logEntries) {
              logs = logEntries.map(entry => ({
                id: entry.id,
                timestamp: entry.timestamp,
                agent: entry.agent,
                project: entry.project,
                status: entry.status,
                description: entry.description,
                details: entry.details || {},
                links: entry.links || {},
                estimated_impact: entry.estimated_impact,
                error: entry.error,
                created_at: entry.timestamp,
              }));
            }
          }
          
          // Also fetch from agent_runs for run data
          const [runsResult, agentsResult, tasksResult, activeResult] = await Promise.all([
            getAgentRuns(limit, agentId),
            getAgents(),
            getScheduledTasks('pending', 20),
            getActiveAgentRuns(),
          ]);

          // Merge agent runs with log entries
          const runLogs = runsResult.map(run => runToLogEntry(run));
          logs = [...logs, ...runLogs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
            
          agents = agentsResult;
          tasks = tasksResult;
          activeRuns = activeResult.map(run => runToLogEntry(run));
        } catch (err) {
          console.warn('[API Logs] Supabase fetch failed, using fallback logs:', err);
        }

        // Always read fallback logs and merge
        try {
          const fallbackLogs = await readFallbackLogs(limit);
          const convertedFallback = fallbackLogs.map(fb => ({
            id: fb.id,
            timestamp: fb.timestamp,
            agent: fb.agent,
            project: fb.project,
            status: fb.status,
            description: fb.description,
            details: fb.details || {},
            links: fb.links || {},
            estimated_impact: fb.estimated_impact as 'low' | 'medium' | 'high' | 'critical',
            error: fb.error,
            created_at: fb.timestamp,
          }));

          // Merge and sort by timestamp (newest first)
          logs = [...logs, ...convertedFallback]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
        } catch (err) {
          console.warn('[API Logs] Fallback read failed:', err);
        }

        return NextResponse.json({
          logs,
          runs: logs,
          agents: agents.length > 0 ? agents : [
            { id: '1', name: 'TraderBot', slug: 'traderbot', status: 'idle', description: 'Trading systems' },
            { id: '2', name: 'ProductBuilder', slug: 'productbuilder', status: 'idle', description: 'Building products' },
            { id: '3', name: 'iOSAppBuilder', slug: 'ios-app-builder', status: 'idle', description: 'iOS development' },
            { id: '4', name: 'Distribution', slug: 'distribution', status: 'idle', description: 'Content distribution' },
            { id: '5', name: 'MemoryManager', slug: 'memorymanager', status: 'idle', description: 'Knowledge management' },
          ],
          tasks,
          activeRuns: activeRuns.length > 0 ? activeRuns : logs.filter(l => l.status === 'in-progress' || l.status === 'started'),
          agentStatuses: agents.reduce((acc, agent) => {
            acc[agent.name] = {
              status: agent.status === 'active' ? 'busy' : agent.status === 'idle' ? 'online' : agent.status,
              currentTask: agent.metadata?.current_task as string || 'Idle',
              startedAt: agent.last_heartbeat,
              lastActivity: agent.last_heartbeat ? new Date(agent.last_heartbeat).toISOString() : null,
            };
            return acc;
          }, {} as Record<string, unknown>),
          lastUpdated: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('[API Logs] Error:', error);
    // Return fallback data instead of 500 to keep dashboard functional
    return NextResponse.json({
      logs: [],
      runs: [],
      agents: [
        { id: '1', name: 'TraderBot', slug: 'traderbot', status: 'idle', description: 'Trading systems' },
        { id: '2', name: 'ProductBuilder', slug: 'productbuilder', status: 'idle', description: 'Building products' },
        { id: '3', name: 'iOSAppBuilder', slug: 'ios-app-builder', status: 'idle', description: 'iOS development' },
        { id: '4', name: 'Distribution', slug: 'distribution', status: 'idle', description: 'Content distribution' },
        { id: '5', name: 'MemoryManager', slug: 'memorymanager', status: 'idle', description: 'Knowledge management' },
      ],
      tasks: [],
      activeRuns: [],
      agentStatuses: {},
      lastUpdated: new Date().toISOString(),
      _error: error instanceof Error ? error.message : 'Database connection failed',
      _fallback: true
    });
  }
}

// POST handler - create new runs, tasks, or spawn agents
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'spawn': {
        const { agentId, task, project = 'general', priority = 'medium' } = body;

        if (!agentId || !task) {
          return NextResponse.json(
            { error: 'Missing required fields: agentId and task' },
            { status: 400 }
          );
        }

        // Get agent info
        const agentInfo = AGENT_INFO[agentId];
        if (!agentInfo) {
          return NextResponse.json(
            { error: `Unknown agent: ${agentId}` },
            { status: 400 }
          );
        }

        // Create a scheduled task for the agent
        const scheduledTask = await createScheduledTask(
          agentId,
          'spawn',
          task,
          priority,
          new Date().toISOString(),
          { project, task, source: 'dashboard' }
        );

        if (!scheduledTask) {
          return NextResponse.json(
            { error: 'Failed to create scheduled task' },
            { status: 500 }
          );
        }

        // Also create an agent run record
        const agentRun = await createAgentRun(
          agentId,
          'dashboard_spawn',
          {
            task,
            project,
            scheduled_task_id: scheduledTask.id,
            source: 'command_center'
          },
          { priority, agent_name: agentInfo.name }
        );

        return NextResponse.json({
          success: true,
          message: `Spawned ${agentInfo.name} for task: ${task}`,
          task: scheduledTask,
          run: agentRun,
          agent: {
            id: agentId,
            name: agentInfo.name,
            channel: agentInfo.channel,
          }
        });
      }

      case 'kill': {
        const { runId, taskId } = body;

        if (!runId && !taskId) {
          return NextResponse.json(
            { error: 'Missing required field: runId or taskId' },
            { status: 400 }
          );
        }

        // Update run status if runId provided
        if (runId) {
          const updated = await updateAgentRun(runId, { status: 'cancelled' });
          if (!updated) {
            return NextResponse.json(
              { error: 'Failed to cancel run' },
              { status: 500 }
            );
          }
        }

        // Update task status if taskId provided
        if (taskId) {
          const updated = await updateScheduledTask(taskId, { status: 'cancelled' });
          if (!updated) {
            return NextResponse.json(
              { error: 'Failed to cancel task' },
              { status: 500 }
            );
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Agent run/task cancelled successfully',
        });
      }

      case 'createTask': {
        const { agentId, taskType, description, priority, scheduledFor, inputPayload } = body;

        if (!agentId || !description) {
          return NextResponse.json(
            { error: 'Missing required fields: agentId and description' },
            { status: 400 }
          );
        }

        const task = await createScheduledTask(
          agentId,
          taskType || 'general',
          description,
          priority || 'medium',
          scheduledFor,
          inputPayload || {}
        );

        if (!task) {
          return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          task,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API Logs] POST error:', error);
    // Return graceful error instead of 500
    return NextResponse.json({
      success: false,
      error: 'Service temporarily unavailable',
      message: error instanceof Error ? error.message : 'Database connection failed',
      _fallback: true
    }, { status: 503 });
  }
}
