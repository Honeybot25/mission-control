const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'',
  'process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY''
)

async function seedActivity() {
  // Get agent IDs
  const { data: agents } = await supabase.from('agents').select('id, name')
  
  if (!agents || agents.length === 0) {
    console.log('No agents found — run seed-agents.js first')
    return
  }
  
  const agentMap = {}
  agents.forEach(a => agentMap[a.name] = a.id)
  
  // Sample runs
  const runs = [
    {
      agent_id: agentMap['TraderBot'],
      status: 'completed',
      trigger_type: 'scheduled',
      input_summary: 'Market scan for momentum breakouts',
      output_summary: 'Found 0 signals in pre-market',
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date(Date.now() - 3540000).toISOString()
    },
    {
      agent_id: agentMap['ProductBuilder'],
      status: 'completed',
      trigger_type: 'manual',
      input_summary: 'Deploy Mission Control dashboard',
      output_summary: 'Successfully deployed to Vercel',
      start_time: new Date(Date.now() - 7200000).toISOString(),
      end_time: new Date(Date.now() - 7000000).toISOString()
    },
    {
      agent_id: agentMap['MemoryManager'],
      status: 'completed',
      trigger_type: 'scheduled',
      input_summary: 'Nightly knowledge consolidation',
      output_summary: 'Indexed 47 documents, archived 2 projects',
      start_time: new Date(Date.now() - 32400000).toISOString(),
      end_time: new Date(Date.now() - 32280000).toISOString()
    }
  ]
  
  for (const run of runs) {
    if (!run.agent_id) continue
    
    const { data, error } = await supabase
      .from('agent_runs')
      .insert([run])
      .select()
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Created run:', data[0].id)
    }
  }
  
  console.log('Seeding complete!')
}

seedActivity().catch(console.error)
