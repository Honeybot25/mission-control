#!/usr/bin/env node
/**
 * Test what columns actually exist
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testColumns() {
  console.log('[Test] Testing which columns exist in agent_runs...\n');
  
  const { data: agents } = await supabase.from('agents').select('id').limit(1);
  if (!agents || agents.length === 0) {
    console.log('[Test] No agents found');
    return;
  }
  
  const agentId = agents[0].id;
  
  // Test different column combinations
  const tests = [
    { name: 'Minimal', data: { agent_id: agentId, status: 'pending' } },
    { name: 'With trigger', data: { agent_id: agentId, status: 'pending', trigger: 'test' } },
    { name: 'With trigger_type', data: { agent_id: agentId, status: 'pending', trigger_type: 'test' } },
    { name: 'With input_payload', data: { agent_id: agentId, status: 'pending', input_payload: { test: true } } },
    { name: 'With input_summary', data: { agent_id: agentId, status: 'pending', input_summary: 'test task' } },
    { name: 'With metadata', data: { agent_id: agentId, status: 'pending', metadata: { test: true } } },
  ];
  
  for (const test of tests) {
    const { error } = await supabase.from('agent_runs').insert([test.data]);
    if (error) {
      console.log(`[Test] ❌ ${test.name}: ${error.message}`);
    } else {
      console.log(`[Test] ✅ ${test.name}: OK`);
    }
  }
}

testColumns().then(() => process.exit(0)).catch(e => {
  console.error('[Test] Fatal error:', e);
  process.exit(1);
});
