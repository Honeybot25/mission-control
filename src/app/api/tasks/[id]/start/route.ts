import { NextRequest, NextResponse } from 'next/server';
import { updateScheduledTask, getAgentById, createAgentRun, createAgentEvent } from '@/lib/supabase-client';

// POST /api/tasks/[id]/start - Start a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { triggerSource = 'manual' } = body;

    // Update task status to running
    const task = await updateScheduledTask(id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or failed to start' },
        { status: 404 }
      );
    }

    // Get agent info for the task
    const agent = await getAgentById(task.agent_id);

    // Create an agent run record for tracking
    const run = await createAgentRun(
      task.agent_id,
      triggerSource,
      {
        task: task.description,
        task_id: task.id,
        task_type: task.task_type,
        scheduled_task_id: task.id,
      },
      {
        priority: task.priority,
        source: 'task_queue',
        agent_name: agent?.name,
      }
    );

    // Create a start event
    if (run) {
      await createAgentEvent(
        run.id,
        'start',
        'info',
        `Task started: ${task.description}`,
        {
          task_id: task.id,
          task_type: task.task_type,
          priority: task.priority,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task started successfully',
      task: {
        ...task,
        status: 'running',
        started_at: new Date().toISOString(),
      },
      run: run || null,
    });
  } catch (error) {
    console.error(`[API Tasks] Start error for task ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to start task', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}