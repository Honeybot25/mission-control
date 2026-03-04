#!/usr/bin/env tsx
/**
 * Comprehensive database seed script for Mission Control
 * Seeds agents and sample agent_runs to populate the Activity Feed
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://avpizuhhirbhjudplihy.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG'

const supabase = createClient(supabaseUrl, supabaseKey)

// Agent definitions
const AGENTS = [
  {
    name: 'TraderBot',
    slug: 'traderbot',
    description: 'Trading systems and execution',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['trading', 'backtesting', 'market-analysis'],
    tags: ['trading', 'finance'],
    config: {},
    metadata: { color: 'green', channel: '1473473950267740313' },
  },
  {
    name: 'ProductBuilder',
    slug: 'productbuilder',
    description: 'Building revenue-generating products and apps',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['full-stack-dev', 'nextjs', 'react'],
    tags: ['development', 'products'],
    config: {},
    metadata: { color: 'blue', channel: '1473474027971547186' },
  },
  {
    name: 'iOSAppBuilder',
    slug: 'iosappbuilder',
    description: 'iOS app development and TestFlight deployment',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['ios-dev', 'swift', 'swiftui'],
    tags: ['ios', 'mobile'],
    config: {},
    metadata: { color: 'indigo', channel: '1473474027971547186' },
  },
  {
    name: 'DistributionAgent',
    slug: 'distribution',
    description: 'Content and X/Twitter distribution',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['content-creation', 'twitter', 'social-media'],
    tags: ['content', 'distribution'],
    config: {},
    metadata: { color: 'purple', channel: '1473473978658980046' },
  },
  {
    name: 'MemoryManager',
    slug: 'memorymanager',
    description: 'Nightly consolidation and knowledge management',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['knowledge-management', 'file-organization'],
    tags: ['memory', 'knowledge'],
    config: {},
    metadata: { color: 'teal', channel: '1473474056341688575' },
  },
  {
    name: 'SecurityAgent',
    slug: 'securityagent',
    description: 'Security scanning and monitoring',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['security-scanning', 'monitoring'],
    tags: ['security', 'monitoring'],
    config: {},
    metadata: { color: 'red', channel: '1473474006916006073' },
  },
]

// Sample agent runs for activity feed
const SAMPLE_RUNS = [
  {
    agent_slug: 'traderbot',
    status: 'completed',
    trigger_type: 'scheduled',
    input_summary: 'Market scan for momentum breakouts',
    output_summary: 'Found 0 signals in pre-market - waiting for volatility',
    duration_ms: 45000,
    tokens_total: 1250,
    cost_usd: 0.008,
  },
  {
    agent_slug: 'traderbot',
    status: 'completed',
    trigger_type: 'manual',
    input_summary: 'Analyze NVDA options flow',
    output_summary: 'Detected unusual call volume - 250% above average',
    duration_ms: 78000,
    tokens_total: 2100,
    cost_usd: 0.012,
  },
  {
    agent_slug: 'productbuilder',
    status: 'completed',
    trigger_type: 'manual',
    input_summary: 'Deploy Mission Control dashboard to Vercel',
    output_summary: 'Successfully deployed to https://mission-control-lovat-rho.vercel.app',
    duration_ms: 124000,
    tokens_total: 3400,
    cost_usd: 0.018,
  },
  {
    agent_slug: 'productbuilder',
    status: 'running',
    trigger_type: 'manual',
    input_summary: 'Build landing page for new SaaS product',
    output_summary: 'In progress - component library initialized',
    duration_ms: null,
    tokens_total: 560,
    cost_usd: 0.004,
  },
  {
    agent_slug: 'memorymanager',
    status: 'completed',
    trigger_type: 'scheduled',
    input_summary: 'Nightly knowledge consolidation',
    output_summary: 'Indexed 47 documents, archived 2 completed projects',
    duration_ms: 245000,
    tokens_total: 8900,
    cost_usd: 0.045,
  },
  {
    agent_slug: 'distribution',
    status: 'completed',
    trigger_type: 'manual',
    input_summary: 'Draft tweet thread about AI trading insights',
    output_summary: 'Thread drafted with 5 tweets - scheduled for 9am PST',
    duration_ms: 32000,
    tokens_total: 1800,
    cost_usd: 0.009,
  },
  {
    agent_slug: 'iosappbuilder',
    status: 'completed',
    trigger_type: 'manual',
    input_summary: 'Build TestFlight release for habit tracker app',
    output_summary: 'Build v1.2.3 submitted to TestFlight - awaiting review',
    duration_ms: 189000,
    tokens_total: 4200,
    cost_usd: 0.022,
  },
  {
    agent_slug: 'securityagent',
    status: 'completed',
    trigger_type: 'scheduled',
    input_summary: 'Weekly security scan of all repositories',
    output_summary: 'All clear - no vulnerabilities detected',
    duration_ms: 67000,
    tokens_total: 1500,
    cost_usd: 0.007,
  },
  {
    agent_slug: 'traderbot',
    status: 'failed',
    trigger_type: 'scheduled',
    input_summary: 'Execute bracket orders for breakout strategy',
    output_summary: 'Connection timeout to Alpaca API - retry queued',
    duration_ms: 5000,
    tokens_total: 120,
    cost_usd: 0.001,
  },
]

async function seedAgents(): Promise<Map<string, string>> {
  console.log('[Seed] Creating agents...\n')
  const agentMap = new Map<string, string>()

  for (const agent of AGENTS) {
    try {
      // Check if agent exists
      const { data: existing } = await supabase
        .from('agents')
        .select('id, slug')
        .eq('slug', agent.slug)
        .single()

      if (existing) {
        console.log(`[Seed] ✅ Agent exists: ${agent.name} (${existing.id})`)
        agentMap.set(agent.slug, existing.id)
      } else {
        // Create new agent - only use minimal fields that definitely exist
        const { data, error } = await supabase
          .from('agents')
          .insert([{
            name: agent.name,
            slug: agent.slug,
            description: agent.description,
            status: agent.status,
          }])
          .select('id')
          .single()

        if (error) {
          console.error(`[Seed] ❌ Error creating ${agent.name}:`, error.message)
        } else if (data) {
          console.log(`[Seed] ✅ Created: ${agent.name} (${data.id})`)
          agentMap.set(agent.slug, data.id)
        }
      }
    } catch (error) {
      console.error(`[Seed] ❌ Error for ${agent.name}:`, error)
    }
  }

  return agentMap
}

async function seedAgentRuns(agentMap: Map<string, string>) {
  console.log('\n[Seed] Creating sample agent runs...\n')

  for (const run of SAMPLE_RUNS) {
    const agentId = agentMap.get(run.agent_slug)
    if (!agentId) {
      console.error(`[Seed] ❌ Agent ${run.agent_slug} not found`)
      continue
    }

    try {
      // Calculate timestamps
      const now = Date.now()
      const hoursAgo = Math.floor(Math.random() * 48) // Random time in last 48 hours
      const startTime = new Date(now - hoursAgo * 60 * 60 * 1000)
      const endTime = run.duration_ms 
        ? new Date(startTime.getTime() + run.duration_ms)
        : null

      const { data, error } = await supabase
        .from('agent_runs')
        .insert([{
          agent_id: agentId,
          status: run.status,
          trigger_type: run.trigger_type,
          input_summary: run.input_summary,
          output_summary: run.output_summary,
          start_time: startTime.toISOString(),
          end_time: endTime?.toISOString() || null,
          duration_ms: run.duration_ms,
          tokens_total: run.tokens_total,
          cost_usd: run.cost_usd,
        }])
        .select('id')
        .single()

      if (error) {
        console.error(`[Seed] ❌ Error creating run for ${run.agent_slug}:`, error.message)
      } else if (data) {
        console.log(`[Seed] ✅ Created run: ${run.agent_slug} - ${run.input_summary.slice(0, 40)}...`)
      }
    } catch (error) {
      console.error(`[Seed] ❌ Error creating run:`, error)
    }
  }
}

async function main() {
  console.log('=========================================')
  console.log('🚀 Mission Control Database Seeder')
  console.log('=========================================\n')

  // Test connection
  console.log('[Seed] Testing Supabase connection...')
  const { error: connError } = await supabase.from('agents').select('count').limit(1).single()
  
  if (connError && connError.code !== 'PGRST116') {
    console.error('[Seed] ❌ Connection failed:', connError.message)
    console.log('[Seed] ⚠️  Continuing anyway - may be empty table...')
  } else {
    console.log('[Seed] ✅ Supabase connected\n')
  }

  // Seed agents
  const agentMap = await seedAgents()
  console.log(`\n[Seed] ${agentMap.size} agents ready`)

  if (agentMap.size === 0) {
    console.error('[Seed] ❌ No agents created - cannot continue')
    process.exit(1)
  }

  // Seed agent runs
  await seedAgentRuns(agentMap)
  
  console.log('\n=========================================')
  console.log('✅ Seeding complete!')
  console.log('=========================================')
  console.log('\nActivity Feed should now show data at:')
  console.log('https://mission-control-lovat-rho.vercel.app/activity')
  
  process.exit(0)
}

main().catch((error) => {
  console.error('[Seed] Fatal error:', error)
  process.exit(1)
})