#!/usr/bin/env node
/**
 * Add more diverse sample runs to populate the Activity Feed
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'',
  'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG'
)

const MORE_RUNS = [
  // TraderBot runs
  { agent: 'traderbot', status: 'completed', task: 'Backtest momentum strategy on SPY', output: 'Sharpe ratio: 1.34, Max drawdown: 12%', duration: 120000, tokens: 3200, cost: 0.015 },
  { agent: 'traderbot', status: 'completed', task: 'Monitor options flow for TSLA', output: 'High put/call ratio detected - bearish sentiment', duration: 45000, tokens: 1800, cost: 0.009 },
  { agent: 'traderbot', status: 'failed', task: 'Execute stop-loss orders', output: 'Rate limit exceeded on Alpaca API', duration: 3000, tokens: 200, cost: 0.001 },
  { agent: 'traderbot', status: 'completed', task: 'Risk management check', output: 'Position sizes within limits, no action needed', duration: 15000, tokens: 800, cost: 0.004 },
  
  // ProductBuilder runs
  { agent: 'productbuilder', status: 'completed', task: 'Create Next.js project structure', output: 'Repository initialized with TypeScript, Tailwind, and Supabase', duration: 30000, tokens: 2400, cost: 0.012 },
  { agent: 'productbuilder', status: 'completed', task: 'Configure CI/CD pipeline', output: 'GitHub Actions workflow set up for Vercel deployment', duration: 45000, tokens: 1500, cost: 0.008 },
  { agent: 'productbuilder', status: 'running', task: 'Implement Stripe payment integration', output: 'Webhook handlers configured, testing pending', duration: null, tokens: 1200, cost: 0.006 },
  { agent: 'productbuilder', status: 'completed', task: 'Optimize build performance', output: 'Bundle size reduced by 34%, Lighthouse score: 94', duration: 89000, tokens: 2800, cost: 0.014 },
  
  // DistributionAgent runs
  { agent: 'distribution', status: 'completed', task: 'Schedule Twitter thread for 9am', output: '3 tweets scheduled with optimal engagement times', duration: 12000, tokens: 900, cost: 0.005 },
  { agent: 'distribution', status: 'completed', task: 'Reply to mentions and DMs', output: 'Responded to 12 mentions, flagged 2 for human review', duration: 34000, tokens: 2100, cost: 0.011 },
  { agent: 'distribution', status: 'completed', task: 'Analyze bookmark performance', output: 'Top performing content: AI trading threads (+45% engagement)', duration: 28000, tokens: 1600, cost: 0.008 },
  
  // MemoryManager runs
  { agent: 'memorymanager', status: 'completed', task: 'Extract tacit knowledge from TradingBot logs', output: 'Created 3 decision frameworks from trade analysis', duration: 156000, tokens: 5400, cost: 0.027 },
  { agent: 'memorymanager', status: 'completed', task: 'Re-index knowledge base', output: '127 documents indexed, search performance improved', duration: 89000, tokens: 3200, cost: 0.016 },
  { agent: 'memorymanager', status: 'completed', task: 'Archive completed project files', output: '23 files archived, PARA structure maintained', duration: 34000, tokens: 1200, cost: 0.006 },
  
  // iOSAppBuilder runs
  { agent: 'iosappbuilder', status: 'completed', task: 'Create SwiftUI component library', output: '15 reusable components created with documentation', duration: 234000, tokens: 4800, cost: 0.024 },
  { agent: 'iosappbuilder', status: 'completed', task: 'Implement Core Data persistence', output: 'Data model configured with CloudKit sync', duration: 178000, tokens: 3600, cost: 0.018 },
  { agent: 'iosappbuilder', status: 'failed', task: 'Submit to App Store', output: 'Missing privacy manifest, need to add required fields', duration: 12000, tokens: 400, cost: 0.002 },
  
  // SecurityAgent runs
  { agent: 'securityagent', status: 'completed', task: 'Dependency vulnerability scan', output: '1 moderate issue found in lodash (<4.17.21)', duration: 56000, tokens: 800, cost: 0.004 },
  { agent: 'securityagent', status: 'completed', task: 'Secret scanning in repositories', output: 'No exposed secrets or API keys detected', duration: 34000, tokens: 600, cost: 0.003 },
  { agent: 'securityagent', status: 'completed', task: 'SSL certificate check', output: 'All domains have valid certificates, expiry: 89 days', duration: 12000, tokens: 300, cost: 0.002 },
]

async function addSamples() {
  console.log('=========================================')
  console.log('📝 Adding More Sample Runs')
  console.log('=========================================\n')

  // Get agent IDs
  const { data: agents, error: agentError } = await supabase.from('agents').select('id, slug')
  if (agentError) {
    console.error('Failed to fetch agents:', agentError.message)
    return
  }

  const agentMap = {}
  for (const a of agents) agentMap[a.slug] = a.id

  let added = 0

  for (const run of MORE_RUNS) {
    const agentId = agentMap[run.agent]
    if (!agentId) {
      console.log(`⚠️  Skipping ${run.agent} - not found`)
      continue
    }

    try {
      // Calculate random timestamps over past 72 hours for variety
      const hoursAgo = Math.random() * 72
      const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
      const endTime = run.duration 
        ? new Date(startTime.getTime() + run.duration)
        : null

      // Only use fields that definitely exist in schema
      const { error } = await supabase.from('agent_runs').insert([{
        agent_id: agentId,
        status: run.status,
        input_summary: run.task,
      }])

      if (error) {
        console.error(`❌ ${run.agent}: ${error.message}`)
      } else {
        console.log(`✅ ${run.agent}: ${run.task.slice(0, 35)}...`)
        added++
      }
    } catch (e) {
      console.error(`❌ ${run.agent}: ${e.message}`)
    }
  }

  console.log(`\n=========================================`)
  console.log(`✅ Added ${added} sample runs!`)
  console.log('=========================================')
}

addSamples().catch(console.error)