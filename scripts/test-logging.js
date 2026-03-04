#!/usr/bin/env node
/**
 * Test script to verify Mission Control logging works
 * Run with: node scripts/test-logging.js
 */

const { log } = require('../src/lib/agent-logger')

async function testLogging() {
  console.log('Testing Mission Control logging...\n')

  // Test 1: Log a created task
  console.log('1. Testing log.created()...')
  await log.created('ProductBuilder', 'mission-control', 'Test task created', 
    { test: true, version: '2.0.0' })

  // Test 2: Log started work
  console.log('2. Testing log.started()...')
  await log.started('TraderBot', 'honeyalgo', 'Backtest started',
    { strategy: 'momentum', timeframe: '1h' })

  // Test 3: Log progress
  console.log('3. Testing log.progress()...')
  await log.progress('Distribution', 'content', 'Drafting thread...',
    { topic: 'trading', tweets: 5 })

  // Test 4: Log completion with links
  console.log('4. Testing log.completed()...')
  await log.completed('MemoryManager', 'knowledge-base', 'Nightly consolidation complete',
    { deployment: 'https://mission-control-lovat-rho.vercel.app' },
    { documentsIndexed: 47, projectsArchived: 2 })

  // Test 5: Log a failure
  console.log('5. Testing log.failed()...')
  await log.failed('iOSAppBuilder', 'testflight', 'Build failed', 
    'Code signing error: Provisioning profile expired',
    { buildNumber: 46 })

  console.log('\n✅ All logging tests completed!')
  console.log('Check the dashboard at: https://mission-control-lovat-rho.vercel.app')
}

testLogging().catch(console.error)
