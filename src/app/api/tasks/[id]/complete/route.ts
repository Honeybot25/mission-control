import { NextRequest, NextResponse } from 'next/server';
import { updateScheduledTask, getAgentRuns, updateAgentRun, createAgentEvent } from '@/lib/supabase-client';

// POST /api/tasks/[id]/complete - Complete a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const {
      status = 'completed',
      result = {},
      errorMessage = null,
    } = body;

    // Validate status
    if (!['completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "completed" or "failed"' },
        { status: 400 }
      );
    }

    // Update task
    const now = new Date().toISOString();
    const updateData: Partial<{
      status: 'completed' | 'failed';
      completed_at: string;
      result: Record<string, unknown>;
      error_message: string | null;
    }> = {
      status,
      completed_at: now,
    };

    if (Object.keys(result).length > 0) {
      updateData.result = result;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const task = await updateScheduledTask(id, updateData);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or failed to complete' },
        { status: 404 }
      );
    }

    // Find and update associated agent run if exists
    const runs = await getAgentRuns(10);
    const associatedRun = runs.find(
      run => {
        // Check metadata for task_id or scheduled_task_id
        const metadata = run.metadata || {};
        return metadata.task_id === id || metadata.scheduled_task_id === id;
      }
    );

    if (associatedRun) {
      // Calculate duration if we have start_time
      const durationMs = task.started_at
        ? new Date(now).getTime() - new Date(task.started_at).getTime()
        : null;

      await updateAgentRun(associatedRun.id, {
        status: status === 'completed' ? 'completed' : 'failed',
        end_time: now,
        duration_ms: durationMs,
        output_summary: errorMessage || `Task ${status}`,
      });

      // Create completion event
      await createAgentEvent(
        associatedRun.id,
        'end',
        status === 'completed' ? 'info' : 'error',
        status === 'completed'
          ? `Task completed: ${task.description}`
          : `Task failed: ${task.description}`,
        {
          task_id: task.id,
          duration_ms: durationMs,
          result,
          error: errorMessage,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: status === 'completed' ? 'Task completed successfully' : 'Task marked as failed',
      task: {
        ...task,
        status,
        completed_at: now,
      },
    });
  } catch (error) {
    console.error(`[API Tasks] Complete error for task ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to complete task', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
