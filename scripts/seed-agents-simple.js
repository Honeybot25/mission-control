#!/usr/bin/env node
/**
 * Simple seed script for Mission Control database
 * Creates the required agents in the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

const supabase = createClient(supabaseUrl, supabaseKey);

// Minimal agent definitions
const AGENTS = [
  {
    name: 'TraderBot',
    slug: 'traderbot',
    description: 'Trading systems and execution',
    status: 'idle',
    version: '1.0.0',
  },
  {
    name: 'ProductBuilder',
    slug: 'productbuilder',
    description: 'Building revenue-generating products and apps',
    status: 'idle',
    version: '1.0.0',
  },
  {
    name: 'iOSAppBuilder',
    slug: 'iosappbuilder',
    description: 'iOS app development and TestFlight deployment',
    status: 'idle',
    version: '1.0.0',
  },
  {
    name: 'DistributionAgent',
    slug: 'distribution',
    description: 'Content and X/Twitter distribution',
    status: 'idle',
    version: '1.0.0',
  },
  {
    name: 'MemoryManager',
    slug: 'memorymanager',
    description: 'Nightly consolidation and knowledge management',
    status: 'idle',
    version: '1.0.0',
  },
  {
    name: 'SecurityAgent',
    slug: 'securityagent',
    description: 'Security scanning and monitoring',
    status: 'idle',
    version: '1.0.0',
  }
];

async function seedAgents() {
  console.log('[Seed] Starting database seed...\n');

  for (const agent of AGENTS) {
    try {
      // Check if agent already exists
      const { data: existing, error: checkError } = await supabase
        .from('agents')
        .select('id, slug')
        .eq('slug', agent.slug)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`[Seed] Error checking ${agent.name}:`, checkError.message);
        continue;
      }

      if (existing) {
        console.log(`[Seed] ✅ Already exists: ${agent.name} (${agent.slug})`);
      } else {
        // Create new agent with minimal fields
        const { error: insertError } = await supabase
          .from('agents')
          .insert([{
            ...agent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error(`[Seed] Error creating ${agent.name}:`, insertError.message);
        } else {
          console.log(`[Seed] ✅ Created: ${agent.name} (${agent.slug})`);
        }
      }
    } catch (error) {
      console.error(`[Seed] Unexpected error for ${agent.name}:`, error);
    }
  }

  console.log('\n[Seed] Database seed complete!');
  process.exit(0);
}

// Run the seed
seedAgents().catch(error => {
  console.error('[Seed] Fatal error:', error);
  process.exit(1);
});
