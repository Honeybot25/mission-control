import { NextResponse } from 'next/server';
import { getStrategies, createStrategy, generateStrategyCode } from '@/lib/ai-strategies';

export async function GET() {
  try {
    const strategies = await getStrategies();
    return NextResponse.json({ strategies });
  } catch (error) {
    console.error('Failed to fetch strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const generatedCode = generateStrategyCode(description, name);
    const strategy = await createStrategy(name, description, generatedCode);

    if (!strategy) {
      return NextResponse.json(
        { error: 'Failed to create strategy' },
        { status: 500 }
      );
    }

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error('Failed to create strategy:', error);
    return NextResponse.json(
      { error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}