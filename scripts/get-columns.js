#!/usr/bin/env node
/**
 * Get actual column names from information_schema
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getColumns() {
  console.log('[Schema] Fetching column information...\n');
  
  // Query information_schema to get column names
  const { data, error } = await supabase
    .rpc('get_columns', { table_name: 'agent_runs' });
  
  if (error) {
    console.log('[Schema] RPC error:', error.message);
    
    // Try direct query
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'agent_runs')
      .eq('table_schema', 'public');
    
    if (colError) {
      console.log('[Schema] Direct query error:', colError.message);
    } else {
      console.log('[Schema] agent_runs columns:');
      columns?.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
  } else {
    console.log('[Schema] Columns:', data);
  }
}

getColumns().then(() => process.exit(0)).catch(e => {
  console.error('[Schema] Fatal error:', e);
  process.exit(1);
});
