import { NextRequest, NextResponse } from 'next/server';
import {
  getScheduledTasks,
  createScheduledTask,
  updateScheduledTask,
  deleteScheduledTask,
  getAgents,
} from '@/lib/supabase-client';

// GET /api/tasks - Get all tasks with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeCounts = searchParams.get('counts') === 'true';

    // Get tasks
    let tasks = await getScheduledTasks(status, limit);

    // Filter by agent if specified
    if (agentId) {
      tasks = tasks.filter(task => task.agent_id === agentId);
    }

    // Get counts per status if requested
    let counts = null;
    if (includeCounts) {
      const allTasks = await getScheduledTasks(undefined, 1000);
      counts = {
        pending: allTasks.filter(t => t.status === 'pending').length,
        running: allTasks.filter(t => t.status === 'running').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
        cancelled: allTasks.filter(t => t.status === 'cancelled').length,
        total: allTasks.length,
      };
    }

    return NextResponse.json({
      tasks,
      counts,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API Tasks] GET error:', error);
    // Return empty tasks instead of 500
    return NextResponse.json({
      tasks: [],
      counts: { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0, total: 0 },
      lastUpdated: new Date().toISOString(),
      _error: error instanceof Error ? error.message : 'Database connection failed',
      _fallback: true
    });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agentId,
      taskType = 'general',
      description,
      priority = 'medium',
      scheduledFor,
      inputPayload = {},
    } = body;

    // Validate required fields
    if (!agentId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId and description are required' },
        { status: 400 }
      );
    }

    // Validate agent exists
    const agents = await getAgents();
    const agentExists = agents.some(a => a.id === agentId || a.slug === agentId);
    if (!agentExists) {
      // Try to find the agent by slug
      const agentBySlug = agents.find(a => a.slug === agentId);
      if (agentBySlug) {
        body.agentId = agentBySlug.id;
      } else {
        return NextResponse.json(
          { error: `Agent not found: ${agentId}` },
          { status: 404 }
        );
      }
    }

    const task = await createScheduledTask(
      typeof agentId === 'string' && agentId.startsWith('agent-') ? agentId : agents.find(a => a.slug === agentId)?.id || agentId,
      taskType,
      description,
      priority,
      scheduledFor,
      inputPayload
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, task },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Tasks] POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Service temporarily unavailable',
      message: error instanceof Error ? error.message : 'Database connection failed',
      _fallback: true
    }, { status: 503 });
  }
}

// PATCH /api/tasks - Update a task
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const task = await updateScheduledTask(id, updates);

    if (!task) {
      return NextResponse.json(
        { error: 'Failed to update task or task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('[API Tasks] PATCH error:', error);
    return NextResponse.json({
      success: false,
      error: 'Service temporarily unavailable',
      message: error instanceof Error ? error.message : 'Database connection failed',
      _fallback: true
    }, { status: 503 });
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const success = await deleteScheduledTask(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('[API Tasks] DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Service temporarily unavailable',
      message: error instanceof Error ? error.message : 'Database connection failed',
      _fallback: true
    }, { status: 503 });
  }
}