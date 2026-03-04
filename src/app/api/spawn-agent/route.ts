import { NextResponse } from 'next/server';
import { 
  getAgents, 
  createAgentRun,
  createAgentEvent,
  getAgentBySlug
} from '@/lib/supabase-client';

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
  iosappbuilder: {
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

/**
 * POST /api/spawn-agent
 * Spawn a new agent and log to database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, task, project = 'general', priority = 'medium' } = body;

    // Validate required fields
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

    // First, get or create the agent in the database
    const agents = await getAgents();
    let agent = agents.find(a => a.slug === agentId);

    // If agent doesn't exist in DB, we need to create it
    if (!agent) {
      console.warn(`[Spawn Agent] Agent ${agentId} not found in database. Will use placeholder.`);
      return NextResponse.json(
        { error: `Agent ${agentId} not found in database. Please run migrations first.` },
        { status: 400 }
      );
    }

    // Create an agent run record
    const agentRun = await createAgentRun(
      agent.id,
      'dashboard_spawn',
      { 
        task, 
        project, 
        source: 'command_center'
      },
      { priority, agent_name: agentInfo.name }
    );

    if (!agentRun) {
      return NextResponse.json(
        { error: 'Failed to create agent run in database' },
        { status: 500 }
      );
    }

    // Create start event for visibility
    await createAgentEvent(
      agentRun.id,
      'start',
      'info',
      `Agent ${agentInfo.name} spawned from Command Center: ${task}`,
      { project, priority, source: 'command_center' }
    );

    console.log(`[Spawn Agent] ✅ Spawned ${agentInfo.name} (Run: ${agentRun.id})`);

    return NextResponse.json({
      success: true,
      message: `Spawned ${agentInfo.name} for task: ${task}`,
      run: agentRun,
      agent: {
        id: agentId,
        name: agentInfo.name,
        channel: agentInfo.channel,
      }
    });

  } catch (error) {
    console.error('[Spawn Agent] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/spawn-agent
 * Get list of available agents
 */
export async function GET() {
  try {
    const agents = await getAgents();
    
    return NextResponse.json({
      agents: agents.map(agent => ({
        id: agent.slug,
        name: agent.name,
        description: agent.description,
        status: agent.status,
        info: AGENT_INFO[agent.slug]
      })),
      availableAgents: Object.keys(AGENT_INFO)
    });
  } catch (error) {
    console.error('[Spawn Agent] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}
