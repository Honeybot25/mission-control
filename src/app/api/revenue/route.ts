import { NextResponse } from 'next/server';
import { 
  getRevenueStreams, 
  createRevenueStream, 
  updateRevenueStream,
  deleteRevenueStream,
  getRevenueGoals,
  createRevenueGoal,
  calculateProjections,
  getRevenueStats
} from '@/lib/revenue';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projections = searchParams.get('projections');
    const stats = searchParams.get('stats');

    if (stats) {
      const revenueStats = await getRevenueStats();
      return NextResponse.json({ stats: revenueStats });
    }

    const streams = await getRevenueStreams();
    const goals = await getRevenueGoals();

    let monthlyProjections;
    if (projections) {
      const months = parseInt(projections) || 12;
      monthlyProjections = calculateProjections(streams, months);
    }

    return NextResponse.json({ 
      streams, 
      goals,
      projections: monthlyProjections 
    });
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'stream') {
      const stream = await createRevenueStream(data);
      if (!stream) {
        return NextResponse.json(
          { error: 'Failed to create revenue stream' },
          { status: 500 }
        );
      }
      return NextResponse.json({ stream });
    }

    if (type === 'goal') {
      const goal = await createRevenueGoal(data);
      if (!goal) {
        return NextResponse.json(
          { error: 'Failed to create revenue goal' },
          { status: 500 }
        );
      }
      return NextResponse.json({ goal });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "stream" or "goal"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to create revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to create revenue data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, type, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (type === 'stream') {
      const stream = await updateRevenueStream(id, updates);
      if (!stream) {
        return NextResponse.json(
          { error: 'Failed to update revenue stream' },
          { status: 500 }
        );
      }
      return NextResponse.json({ stream });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "stream"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to update revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to update revenue data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteRevenueStream(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete revenue stream' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete revenue stream:', error);
    return NextResponse.json(
      { error: 'Failed to delete revenue stream' },
      { status: 500 }
    );
  }
}