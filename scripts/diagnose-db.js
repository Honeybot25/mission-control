#!/usr/bin/env node
/**
 * Diagnostic script to check Supabase connection and schema
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

console.log('[Diagnose] Supabase URL:', supabaseUrl);
console.log('[Diagnose] Key starts with:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
  console.log('[Diagnose] Testing connection...\n');
  
  // Test 1: Basic connection
  try {
    const { data: testData, error: testError } = await supabase
      .from('log_entries')
      .select('count')
      .limit(1)
      .single();
    
    if (testError) {
      console.log('[Diagnose] ❌ log_entries table error:', testError.message);
    } else {
      console.log('[Diagnose] ✅ log_entries table exists');
    }
  } catch (e) {
    console.log('[Diagnose] ❌ Connection failed:', e.message);
  }
  
  // Test 2: Check agents table
  try {
    const { data: agents, error } = await supabase.from('agents').select('*').limit(5);
    if (error) {
      console.log('[Diagnose] ❌ agents table error:', error.message);
    } else {
      console.log('[Diagnose] ✅ agents table exists, rows:', agents.length);
      if (agents.length > 0) {
        console.log('[Diagnose]    First agent:', agents[0].name, `(${agents[0].slug})`);
      }
    }
  } catch (e) {
    console.log('[Diagnose] ❌ agents table error:', e.message);
  }
  
  // Test 3: Check agent_runs table
  try {
    const { data: runs, error } = await supabase.from('agent_runs').select('*').limit(5);
    if (error) {
      console.log('[Diagnose] ❌ agent_runs table error:', error.message);
    } else {
      console.log('[Diagnose] ✅ agent_runs table exists, rows:', runs.length);
    }
  } catch (e) {
    console.log('[Diagnose] ❌ agent_runs table error:', e.message);
  }
  
  // Test 4: Check agent_events table
  try {
    const { data: events, error } = await supabase.from('agent_events').select('*').limit(5);
    if (error) {
      console.log('[Diagnose] ❌ agent_events table error:', error.message);
    } else {
      console.log('[Diagnose] ✅ agent_events table exists, rows:', events.length);
    }
  } catch (e) {
    console.log('[Diagnose] ❌ agent_events table error:', e.message);
  }
  
  console.log('\n[Diagnose] Complete.');
  process.exit(0);
}

diagnose().catch(e => {
  console.error('[Diagnose] Fatal error:', e);
  process.exit(1);
});
