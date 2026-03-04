#!/usr/bin/env node
/**
 * Test script to verify Mission Control logging works
 * This creates sample log entries directly via Supabase
 * 
 * Run with: node scripts/test-logging.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env vars from .env.local
try {
  const envPath = join(__dirname, '..', '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  const envVars = dotenv.parse(envContent)
  Object.assign(process.env, envVars)
} catch (e) {
  console.log('No .env.local found, using environment vars')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const testLogs = [
  {
    agent: 'ProductBuilder',
    project: 'mission-control',
    status: 'completed',
    description: 'Dashboard v2.0 deployed with real-time logging',
    details: { version: '2.0.0', features: ['live-updates', 'agent-status', 'search'] },
    links: { deployment: 'https://mission-control-lovat-rho.vercel.app' },
    estimated_impact: 'high',
  },
  {
    agent: 'TraderBot',
    project: 'honeyalgo',
    status: 'in-progress',
    description: 'Running momentum backtest on NVDA',
    details: { strategy: 'momentum', ticker: 'NVDA', candles: 10000 },
    estimated_impact: 'medium',
  },
  {
    agent: 'Distribution',
    project: 'twitter-content',
    status: 'completed',
    description: 'Posted thread about AI trading strategies',
    details: { impressions: 12500, engagement: '4.2%' },
    links: { deployment: 'https://twitter.com/ro9232/status/123' },
    estimated_impact: 'medium',
  },
  {
    agent: 'MemoryManager',
    project: 'knowledge-base',
    status: 'completed',
    description: 'Nightly consolidation finished',
    details: { documentsIndexed: 47, projectsArchived: 2, storageUsed: '2.3GB' },
    estimated_impact: 'low',
  },
  {
    agent: 'iOSAppBuilder',
    project: 'habit-tracker',
    status: 'started',
    description: 'Building TestFlight version 1.2.0',
    details: { version: '1.2.0', buildNumber: 47, testers: 12 },
    estimated_impact: 'medium',
  },
  {
    agent: 'TraderBot',
    project: 'honeyalgo',
    status: 'failed',
    description: 'API connection timeout',
    error: 'Connection to Alpaca API timed out after 30s',
    details: { retryAttempt: 3 },
    estimated_impact: 'critical',
  },
]

async function testLogging() {
  console.log('🚀 Testing Mission Control logging...\n')
  console.log(`Supabase URL: ${supabaseUrl.slice(0, 30)}...\n`)

  for (const log of testLogs) {
    process.stdout.write(`Creating log: ${log.agent} - ${log.description.slice(0, 40)}... `)
    
    const { data, error } = await supabase
      .from('log_entries')
      .insert([{ ...log, timestamp: new Date().toISOString() }])
      .select()
      .single()

    if (error) {
      console.error('❌', error.message)
    } else {
      console.log('✅')
    }
  }

  console.log('\n✅ All test logs created!')
  console.log('\n📊 View them at: https://mission-control-lovat-rho.vercel.app/activity')
}

testLogging().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
