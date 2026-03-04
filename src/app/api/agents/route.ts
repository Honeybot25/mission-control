import { NextRequest, NextResponse } from 'next/server'
import {
  getAgents,
  getAgentById,
  getAgentBySlug,
  createAgent,
  updateAgent,
  getAgentRuns,
  getActiveAgentRuns,
  createAgentRun,
  updateAgentRun,
  getAgentEvents,
  createAgentEvent,
  getAgentStats,
} from '@/lib/supabase-real'

// Map agent slugs to their display info for spawning
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
  'ios-app-builder': {
    name: 'iOSAppBuilder',
    description: 'iOS app development and TestFlight',
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
  research: {
    name: 'ResearchAgent',
    description: 'Deep research and analysis',
    channel: '1473474027971547186',
  },
}

// GET /api/agents - Get all agents or specific agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')
    const includeStats = searchParams.get('stats') === 'true'

    // Get specific agent by ID
    if (id) {
      const agent = await getAgentById(id)
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        )
      }

      if (includeStats) {
        const stats = await getAgentStats(id)
        return NextResponse.json({ agent: { ...agent, stats } })
      }

      return NextResponse.json({ agent })
    }

    // Get specific agent by slug
    if (slug) {
      const agent = await getAgentBySlug(slug)
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        )
      }

      if (includeStats) {
        const stats = await getAgentStats(agent.id)
        return NextResponse.json({ agent: { ...agent, stats } })
      }

      return NextResponse.json({ agent })
    }

    // Get all agents
    const agents = await getAgents()

    if (includeStats) {
      const agentsWithStats = await Promise.all(
        agents.map(async (agent) => {
          const stats = await getAgentStats(agent.id)
          return { ...agent, stats }
        })
      )
      return NextResponse.json({ agents: agentsWithStats })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('[API Agents] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// POST /api/agents - Create new agent or spawn agent run
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'create' } = body

    switch (action) {
      case 'create': {
        // Create a new agent
        const { name, slug, description, status = 'idle', version } = body

        if (!name || !slug) {
          return NextResponse.json(
            { error: 'Missing required fields: name and slug' },
            { status: 400 }
          )
        }

        const agent = await createAgent({
          name,
          slug,
          description,
          status,
          version: version || '1.0.0',
        })

        if (!agent) {
          return NextResponse.json(
            { error: 'Failed to create agent' },
            { status: 500 }
          )
        }

        return NextResponse.json({ agent }, { status: 201 })
      }

      case 'spawn': {
        // Spawn an agent run
        const { agentId, agentSlug, task, triggerType = 'dashboard', priority = 'medium', inputPayload } = body

        const targetId = agentId || agentSlug
        if (!targetId) {
          return NextResponse.json(
            { error: 'Missing required field: agentId or agentSlug' },
            { status: 400 }
          )
        }

        // Find the agent
        let agent = agentId 
          ? await getAgentById(agentId)
          : await getAgentBySlug(agentSlug!)

        if (!agent) {
          return NextResponse.json(
            { error: `Agent not found: ${targetId}` },
            { status: 404 }
          )
        }

        // Create the run
        const run = await createAgentRun(
          agent.id,
          triggerType,
          task,
          {
            priority,
            source: 'api',
            ...inputPayload,
          }
        )

        if (!run) {
          return NextResponse.json(
            { error: 'Failed to create agent run' },
            { status: 500 }
          )
        }

        // Get agent info
        const agentInfo = AGENT_INFO[agent.slug] || {
          name: agent.name,
          description: agent.description || '',
          channel: '',
        }

        // Create an event for the run start
        await createAgentEvent(
          run.id,
          agent.id,
          'start',
          'info',
          `Agent run started via ${triggerType}: ${task}`,
          { task, priority }
        )

        return NextResponse.json({
          success: true,
          message: `Spawned ${agentInfo.name} for task: ${task}`,
          run,
          agent: {
            id: agent.id,
            name: agentInfo.name,
            slug: agent.slug,
            channel: agentInfo.channel,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[API Agents] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/agents - Update an agent
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }

    const agent = await updateAgent(id, updates)

    if (!agent) {
      return NextResponse.json(
        { error: 'Failed to update agent or agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error('[API Agents] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}
