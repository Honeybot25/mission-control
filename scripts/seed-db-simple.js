#!/usr/bin/env node
/**
 * Simple database seed script using minimal fields
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'',
  'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG'
)

const AGENTS = [
  { name: 'TraderBot', slug: 'traderbot', description: 'Trading systems' },
  { name: 'ProductBuilder', slug: 'productbuilder', description: 'Build products' },
  { name: 'DistributionAgent', slug: 'distribution', description: 'Content distribution' },
  { name: 'MemoryManager', slug: 'memorymanager', description: 'Knowledge management' },
  { name: 'iOSAppBuilder', slug: 'iosappbuilder', description: 'iOS development' },
  { name: 'SecurityAgent', slug: 'securityagent', description: 'Security scanning' },
]

const SAMPLE_RUNS = [
  { agent: 'traderbot', status: 'completed', task: 'Market scan for momentum breakouts' },
  { agent: 'productbuilder', status: 'completed', task: 'Deploy Mission Control dashboard' },
  { agent: 'memorymanager', status: 'completed', task: 'Nightly knowledge consolidation' },
  { agent: 'distribution', status: 'completed', task: 'Draft tweet thread about AI insights' },
  { agent: 'traderbot', status: 'running', task: 'Analyze NVDA options flow' },
  { agent: 'iosappbuilder', status: 'completed', task: 'Build TestFlight release' },
]

async function seed() {
  console.log('=========================================')
  console.log('🚀 Mission Control Database Seeder')
  console.log('=========================================\n')

  // Seed agents
  console.log('[Seed] Creating agents...')
  const agentMap = {}

  for (const agent of AGENTS) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('agents')
        .select('id')
        .eq('slug', agent.slug)
        .single()

      if (existing) {
        console.log(`  ✅ ${agent.name} already exists`)
        agentMap[agent.slug] = existing.id
      } else {
        const { data, error } = await supabase
          .from('agents')
          .insert([{ name: agent.name, slug: agent.slug, description: agent.description, status: 'idle' }])
          .select('id')
          .single()

        if (error) {
          console.error(`  ❌ ${agent.name}: ${error.message}`)
        } else {
          console.log(`  ✅ Created ${agent.name}`)
          agentMap[agent.slug] = data.id
        }
      }
    } catch (e) {
      console.error(`  ❌ ${agent.name}: ${e.message}`)
    }
  }

  // Seed runs
  console.log('\n[Seed] Creating sample runs...')
  
  for (const run of SAMPLE_RUNS) {
    const agentId = agentMap[run.agent]
    if (!agentId) {
      console.log(`  ⚠️  Skipping ${run.agent} - not found`)
      continue
    }

    try {
      const { error } = await supabase.from('agent_runs').insert([{
        agent_id: agentId,
        status: run.status,
        input_summary: run.task,
      }])

      if (error) {
        console.error(`  ❌ ${run.agent}: ${error.message}`)
      } else {
        console.log(`  ✅ ${run.agent}: ${run.task.slice(0, 40)}...`)
      }
    } catch (e) {
      console.error(`  ❌ ${run.agent}: ${e.message}`)
    }
  }

  console.log('\n=========================================')
  console.log('✅ Seeding complete!')
  console.log('=========================================')
}

seed().catch(console.error)