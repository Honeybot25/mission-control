#!/usr/bin/env node
/**
 * Check actual table schema
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSchema() {
  console.log('[Schema] Checking agent_runs table schema...\n');
  
  // Try to get one row to see what columns exist
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('[Schema] Error:', error.message);
  } else {
    console.log('[Schema] agent_runs columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No rows');
  }
  
  // Try to get agents
  const { data: agents, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .limit(1);
  
  if (agentError) {
    console.log('[Schema] agents error:', agentError.message);
  } else {
    console.log('[Schema] agents columns:', agents && agents.length > 0 ? Object.keys(agents[0]) : 'No rows');
  }
  
  // Try to insert a minimal run
  const { data: agents2 } = await supabase.from('agents').select('id').limit(1);
  if (agents2 && agents2.length > 0) {
    const agentId = agents2[0].id;
    
    // Try minimal insert
    const { error: insertError } = await supabase
      .from('agent_runs')
      .insert([{ agent_id: agentId, status: 'pending' }]);
    
    if (insertError) {
      console.log('[Schema] Minimal insert failed:', insertError.message);
    } else {
      console.log('[Schema] ✅ Minimal insert succeeded');
    }
  }
}

checkSchema().then(() => process.exit(0)).catch(e => {
  console.error('[Schema] Fatal error:', e);
  process.exit(1);
});
