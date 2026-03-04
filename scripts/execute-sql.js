const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  try {
    const sql = fs.readFileSync('./create_tables.sql', 'utf8');
    
    // Execute SQL using Supabase's SQL endpoint
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error:', error);
      // Try alternative: create tables via REST API
      await createTablesViaAPI();
    } else {
      console.log('✅ Tables created successfully');
    }
  } catch (err) {
    console.error('❌ Script error:', err);
    await createTablesViaAPI();
  }
}

async function createTablesViaAPI() {
  console.log('🔄 Trying alternative method...');
  
  // Create agents via REST
  const agents = [
    { name: 'TraderBot', slug: 'traderbot', description: 'Autonomous trading', status: 'idle', capabilities: ['trading'], tags: ['finance'] },
    { name: 'ProductBuilder', slug: 'productbuilder', description: 'Build products', status: 'idle', capabilities: ['building'], tags: ['dev'] },
    { name: 'Distribution', slug: 'distribution', description: 'Content creation', status: 'idle', capabilities: ['content'], tags: ['social'] },
    { name: 'MemoryManager', slug: 'memorymanager', description: 'Knowledge management', status: 'idle', capabilities: ['research'], tags: ['knowledge'] },
    { name: 'iOSAppBuilder', slug: 'iosappbuilder', description: 'iOS development', status: 'idle', capabilities: ['ios'], tags: ['mobile'] },
    { name: 'SecurityAgent', slug: 'securityagent', description: 'Security scanning', status: 'idle', capabilities: ['security'], tags: ['audit'] }
  ];
  
  for (const agent of agents) {
    const { error } = await supabase.from('agents').upsert(agent, { onConflict: 'slug' });
    if (error) {
      console.error(`❌ Failed to create ${agent.name}:`, error);
    } else {
      console.log(`✅ Created/updated ${agent.name}`);
    }
  }
}

executeSQL();
