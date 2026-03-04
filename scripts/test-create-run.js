#!/usr/bin/env node
/**
 * Direct test of createAgentRun
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testCreateAgentRun() {
  console.log('[Test] Testing createAgentRun directly...\n');
  
  // First get an agent
  const { data: agents, error: agentError } = await supabase
    .from('agents')
    .select('id, name, slug')
    .limit(1);
  
  if (agentError || !agents || agents.length === 0) {
    console.log('[Test] ❌ No agents found:', agentError?.message);
    return;
  }
  
  const agent = agents[0];
  console.log(`[Test] Using agent: ${agent.name} (${agent.id})`);
  
  // Try to create a run
  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .insert([{
      agent_id: agent.id,
      status: 'pending',
      trigger: 'test',
      input_payload: { task: 'Test task', source: 'direct-test' },
    }])
    .select('*, agent:agents(*)')
    .single();
  
  if (runError) {
    console.log('[Test] ❌ Failed to create agent run:', runError.message);
    console.log('[Test] Error details:', JSON.stringify(runError, null, 2));
  } else {
    console.log('[Test] ✅ Successfully created agent run:', run.id);
    console.log('[Test] Run:', JSON.stringify(run, null, 2));
  }
}

testCreateAgentRun().then(() => process.exit(0)).catch(e => {
  console.error('[Test] Fatal error:', e);
  process.exit(1);
});
