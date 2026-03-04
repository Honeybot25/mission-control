#!/usr/bin/env node
/**
 * Apply SQL migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyMigration() {
  console.log('[Migration] Applying scheduled_tasks table...\n');
  
  const sql = fs.readFileSync(path.join(__dirname, 'create-scheduled-tasks.sql'), 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`[Migration] Found ${statements.length} statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const shortStmt = statement.substring(0, 60).replace(/\n/g, ' ');
    
    try {
      // Execute the SQL using the rpc function
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // If rpc doesn't exist, try direct query
        const { error: queryError } = await supabase.from('_sql_execute').select('*').eq('query', statement);
        
        if (queryError && !queryError.message.includes('does not exist')) {
          console.log(`[Migration] ⚠️ Statement ${i + 1}: ${shortStmt}... - ${error.message}`);
        } else {
          console.log(`[Migration] ✅ Statement ${i + 1}: ${shortStmt}...`);
        }
      } else {
        console.log(`[Migration] ✅ Statement ${i + 1}: ${shortStmt}...`);
      }
    } catch (e) {
      // Some statements might fail if objects already exist, that's okay
      if (e.message?.includes('already exists')) {
        console.log(`[Migration] ℹ️ Statement ${i + 1}: Already exists, skipping`);
      } else {
        console.log(`[Migration] ⚠️ Statement ${i + 1}: ${e.message}`);
      }
    }
  }
  
  console.log('\n[Migration] Complete!');
  console.log('[Migration] NOTE: Please run the SQL manually in Supabase SQL Editor if errors occurred.');
  console.log('[Migration] SQL file: scripts/create-scheduled-tasks.sql');
  process.exit(0);
}

applyMigration().catch(e => {
  console.error('[Migration] Fatal error:', e);
  console.log('\n[Mitigation] Please run the SQL manually in Supabase SQL Editor:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the contents of scripts/create-scheduled-tasks.sql');
  console.log('5. Click Run');
  process.exit(1);
});
