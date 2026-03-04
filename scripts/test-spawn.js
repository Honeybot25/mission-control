#!/usr/bin/env node
/**
 * Test script for spawn-agent API
 */

const API_URL = process.env.API_URL || 'https://mission-control-lovat-rho.vercel.app';

async function testSpawnAgent() {
  console.log('[Test] Testing spawn-agent API...\n');
  console.log('[Test] URL:', API_URL);
  
  try {
    const response = await fetch(`${API_URL}/api/spawn-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: 'traderbot',
        task: 'Test audit task - verify logging is working',
        project: 'mission-control-audit',
        priority: 'high'
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('[Test] ✅ Spawn successful!');
      console.log('[Test] Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('[Test] ❌ Spawn failed:');
      console.log('[Test] Status:', response.status);
      console.log('[Test] Error:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('[Test] ❌ Request failed:', error.message);
  }
}

async function testGetAgents() {
  console.log('\n[Test] Testing GET /api/spawn-agent (list agents)...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/spawn-agent`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('[Test] ✅ Agents list retrieved!');
      console.log('[Test] Found', data.agents?.length || 0, 'agents');
      data.agents?.forEach(agent => {
        console.log(`  - ${agent.name} (${agent.slug}): ${agent.status}`);
      });
    } else {
      console.log('[Test] ❌ Failed to get agents:', data);
    }
  } catch (error) {
    console.log('[Test] ❌ Request failed:', error.message);
  }
}

async function testActivityFeed() {
  console.log('\n[Test] Testing /api/logs (activity feed)...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/logs`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('[Test] ✅ Activity feed retrieved!');
      console.log('[Test] Found', data.logs?.length || 0, 'log entries');
      console.log('[Test] Found', data.runs?.length || 0, 'agent runs');
      console.log('[Test] Found', data.agents?.length || 0, 'agents');
      console.log('[Test] Found', data.tasks?.length || 0, 'scheduled tasks');
      
      if (data.logs?.length > 0) {
        console.log('\n[Test] Latest activity:');
        data.logs.slice(0, 3).forEach((log, i) => {
          console.log(`  ${i + 1}. [${log.agent}] ${log.status}: ${log.description?.substring(0, 60)}...`);
        });
      }
    } else {
      console.log('[Test] ❌ Failed to get activity feed:', data);
    }
  } catch (error) {
    console.log('[Test] ❌ Request failed:', error.message);
  }
}

async function runTests() {
  await testGetAgents();
  await testSpawnAgent();
  
  // Wait a moment for data to be written
  console.log('\n[Test] Waiting 2 seconds for data to propagate...');
  await new Promise(r => setTimeout(r, 2000));
  
  await testActivityFeed();
  console.log('\n[Test] Complete!');
  process.exit(0);
}

runTests();
