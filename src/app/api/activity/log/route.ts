import { NextResponse } from 'next/server';
import { 
  spawnAndLog,
  logAgentCompleted,
  logAgentFailed,
  logAgentProgress
} from '@/lib/agent-logger-supabase';

/**
 * POST /api/activity/log
 * Log agent activity from anywhere (external systems, hooks, etc.)
 * 
 * Body: {
 *   agent: string - Agent name (TraderBot, ProductBuilder, etc.)
 *   task: string - Description of the task
 *   action: 'start' | 'complete' | 'fail' | 'progress'
 *   runId?: string - Required for complete/fail/progress
 *   output?: string - Output summary for complete/fail
 *   details?: Record<string, unknown> - Additional data
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent, task, action = 'start', runId, output, details = {} } = body;

    if (!agent || !task) {
      return NextResponse.json(
        { error: 'Missing required fields: agent and task' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'start': {
        const newRunId = await spawnAndLog(agent, task, 'api');
        if (!newRunId) {
          return NextResponse.json(
            { error: 'Failed to log activity. Agent may not exist in database.' },
            { status: 500 }
          );
        }
        result = { runId: newRunId, agent, task, status: 'started' };
        break;
      }

      case 'complete': {
        if (!runId) {
          return NextResponse.json(
            { error: 'Missing required field: runId for complete action' },
            { status: 400 }
          );
        }
        const completed = await logAgentCompleted(
          runId,
          output || task,
          details?.durationMs as number | undefined,
          details?.tokensTotal as number | undefined,
          details?.costUsd as number | undefined
        );
        if (!completed) {
          return NextResponse.json(
            { error: 'Failed to log completion' },
            { status: 500 }
          );
        }
        result = { runId, agent, status: 'completed' };
        break;
      }

      case 'fail': {
        if (!runId) {
          return NextResponse.json(
            { error: 'Missing required field: runId for fail action' },
            { status: 400 }
          );
        }
        const failed = await logAgentFailed(
          runId,
          output || 'Task failed',
          details
        );
        if (!failed) {
          return NextResponse.json(
            { error: 'Failed to log failure' },
            { status: 500 }
          );
        }
        result = { runId, agent, status: 'failed' };
        break;
      }

      case 'progress': {
        if (!runId) {
          return NextResponse.json(
            { error: 'Missing required field: runId for progress action' },
            { status: 400 }
          );
        }
        await logAgentProgress(
          runId,
          task,
          details?.progress as number | undefined,
          details
        );
        result = { runId, agent, status: 'progress', message: task };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API Activity Log] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
