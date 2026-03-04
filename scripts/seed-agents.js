#!/usr/bin/env node
/**
 * Seed script for Mission Control database
 * Creates the required agents in the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p2BE1oNHqgmEVYuOKLFTog_6zCKZ-VG';

const supabase = createClient(supabaseUrl, supabaseKey);

// Agent definitions matching AGENTS.md
const AGENTS = [
  {
    name: 'TraderBot',
    slug: 'traderbot',
    description: 'Trading systems and execution',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['trading', 'backtesting', 'market-analysis', 'risk-management'],
    tags: ['trading', 'finance', 'automation'],
    config: {
      max_position_size: 1000,
      risk_per_trade: 0.02,
      paper_trading: true
    },
    metadata: {
      channel: '1473473950267740313',
      color: '#22c55e'
    },
    heartbeat_interval_seconds: 60,
    max_concurrent_runs: 3,
    daily_run_limit: 100
  },
  {
    name: 'ProductBuilder',
    slug: 'productbuilder',
    description: 'Building revenue-generating products and apps',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['full-stack-dev', 'nextjs', 'react', 'nodejs', 'deployment'],
    tags: ['development', 'products', 'saas'],
    config: {
      preferred_stack: ['nextjs', 'typescript', 'tailwind', 'supabase'],
      deployment_platform: 'vercel'
    },
    metadata: {
      channel: '1473474027971547186',
      color: '#3b82f6'
    },
    heartbeat_interval_seconds: 60,
    max_concurrent_runs: 2,
    daily_run_limit: 50
  },
  {
    name: 'iOSAppBuilder',
    slug: 'iosappbuilder',
    description: 'iOS app development and TestFlight deployment',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['ios-dev', 'swift', 'swiftui', 'testflight', 'app-store'],
    tags: ['ios', 'mobile', 'app-store'],
    config: {
      preferred_stack: ['swift', 'swiftui', 'uikit'],
      deployment_platform: 'testflight'
    },
    metadata: {
      channel: '1473474027971547186',
      color: '#6366f1'
    },
    heartbeat_interval_seconds: 60,
    max_concurrent_runs: 1,
    daily_run_limit: 30
  },
  {
    name: 'DistributionAgent',
    slug: 'distribution',
    description: 'Content and X/Twitter distribution',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['content-creation', 'twitter', 'social-media', 'audience-building'],
    tags: ['content', 'distribution', 'social'],
    config: {
      platforms: ['twitter', 'discord'],
      content_types: ['threads', 'tweets', 'replies']
    },
    metadata: {
      channel: '1473473978658980046',
      color: '#a855f7'
    },
    heartbeat_interval_seconds: 60,
    max_concurrent_runs: 2,
    daily_run_limit: 50
  },
  {
    name: 'MemoryManager',
    slug: 'memorymanager',
    description: 'Nightly consolidation and knowledge management',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['knowledge-management', 'file-organization', 'search-indexing', 'archive'],
    tags: ['memory', 'knowledge', 'organization'],
    config: {
      para_folders: ['Projects', 'Areas', 'Resources', 'Archive'],
      schedule: '0 2 * * *' // 2 AM daily
    },
    metadata: {
      channel: '1473474056341688575',
      color: '#14b8a6'
    },
    heartbeat_interval_seconds: 300,
    max_concurrent_runs: 1,
    daily_run_limit: 10
  },
  {
    name: 'SecurityAgent',
    slug: 'securityagent',
    description: 'Security scanning and monitoring',
    status: 'idle',
    version: '1.0.0',
    capabilities: ['security-scanning', 'monitoring', 'auditing', 'alerts'],
    tags: ['security', 'monitoring', 'auditing'],
    config: {
      scan_types: ['dependency-check', 'secret-scan', 'vulnerability-scan'],
      alert_threshold: 'high'
    },
    metadata: {
      channel: '1473474006916006073',
      color: '#ef4444'
    },
    heartbeat_interval_seconds: 300,
    max_concurrent_runs: 2,
    daily_run_limit: 20
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
        // Update existing agent
        const { error: updateError } = await supabase
          .from('agents')
          .update({
            ...agent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`[Seed] Error updating ${agent.name}:`, updateError.message);
        } else {
          console.log(`[Seed] ✅ Updated: ${agent.name} (${agent.slug})`);
        }
      } else {
        // Create new agent
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
