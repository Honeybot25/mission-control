import { NextResponse } from 'next/server';
import { getIdeas, createIdea, updateIdea, deleteIdea, getIdeaStats } from '@/lib/ideas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as any;
    const status = searchParams.get('status') as any;
    const effort = searchParams.get('effort') as any;
    const minPriority = searchParams.get('minPriority') ? parseInt(searchParams.get('minPriority')!) : undefined;
    const search = searchParams.get('search') || undefined;
    const stats = searchParams.get('stats');

    if (stats) {
      const ideaStats = await getIdeaStats();
      return NextResponse.json({ stats: ideaStats });
    }

    const filters = {
      ...(category && { category }),
      ...(status && { status }),
      ...(effort && { effort }),
      ...(minPriority && { minPriority }),
      ...(search && { search })
    };

    const ideas = await getIdeas(Object.keys(filters).length > 0 ? filters : undefined);
    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('Failed to fetch ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, estimatedRevenue, effortLevel, tags } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const idea = await createIdea(title, description, {
      estimatedRevenue,
      effortLevel,
      tags
    });

    if (!idea) {
      return NextResponse.json(
        { error: 'Failed to create idea' },
        { status: 500 }
      );
    }

    return NextResponse.json({ idea });
  } catch (error) {
    console.error('Failed to create idea:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const idea = await updateIdea(id, updates);

    if (!idea) {
      return NextResponse.json(
        { error: 'Failed to update idea' },
        { status: 500 }
      );
    }

    return NextResponse.json({ idea });
  } catch (error) {
    console.error('Failed to update idea:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
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

    const success = await deleteIdea(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete idea' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete idea:', error);
    return NextResponse.json(
      { error: 'Failed to delete idea' },
      { status: 500 }
    );
  }
}