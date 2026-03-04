#!/usr/bin/env node
/**
 * YouTube Monitor Cron Job
 * 
 * Runs every 6 hours to check for new FX Evolution videos
 * and analyze them with AI.
 * 
 * Usage: node scripts/youtube-monitor-cron.js
 * Or: npx ts-node scripts/youtube-monitor-cron.ts
 */

const MISSION_CONTROL_URL = process.env.MISSION_CONTROL_URL || 'http://localhost:3000';

async function checkForNewVideos() {
  console.log('[Cron] Starting YouTube monitor check...');
  console.log(`[Cron] Timestamp: ${new Date().toISOString()}`);
  
  try {
    const response = await fetch(`${MISSION_CONTROL_URL}/api/youtube/monitor?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('[Cron] Check completed:');
    console.log(`  - Videos checked: ${data.videosChecked}`);
    console.log(`  - New videos found: ${data.newVideos}`);
    
    if (data.newVideos > 0) {
      console.log('[Cron] New analyses:');
      data.analyses.forEach((a: any) => {
        console.log(`  - ${a.title} (${a.sentiment})`);
      });
    }

    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('[Cron] Error checking for new videos:', error);
    process.exit(1);
  }
}

// Run the check
checkForNewVideos();
