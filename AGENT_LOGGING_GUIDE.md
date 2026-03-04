# Agent Logging Guide

## Overview

**ALL AGENTS MUST LOG THEIR ACTIVITY TO MISSION CONTROL.**

This is non-negotiable. The Mission Control dashboard provides real-time visibility into what every agent is doing. Without logging, we have no visibility, no accountability, and no ability to coordinate.

## Quick Start

### 1. Import the Logger

```typescript
import { log } from '@/lib/agent-logger'
```

### 2. Log Your Activity

Use the appropriate helper for each stage of work:

```typescript
// When you create/plan a task
await log.created('TraderBot', 'honeyalgo', 'Plan momentum backtest for Q1')

// When you start working
await log.started('TraderBot', 'honeyalgo', 'Backtest initiated', { strategy: 'momentum' })

// Progress updates for long-running tasks
await log.progress('TraderBot', 'honeyalgo', 'Processing 10,000 candles...')

// When you complete successfully
await log.completed('TraderBot', 'honeyalgo', 'Backtest complete', {
  deployment: 'https://honeyalgo.vercel.app/results'
}, { 
  totalReturn: '23.5%',
  sharpeRatio: 1.8 
})

// When something fails
await log.failed('TraderBot', 'honeyalgo', 'Backtest failed', 'Out of memory', {
  candlesProcessed: 5432
})
```

## Logging Requirements by Agent

### TraderBot
**Must log:**
- Every trade execution (entry, exit, stop-loss)
- Strategy backtests started/completed
- Alerts triggered
- Risk warnings (position size, margin calls)
- API errors or connection issues

**Example:**
```typescript
await log.completed('TraderBot', 'honeyalgo', 'Trade executed', {
  deployment: 'https://tradingview.com/...'
}, {
  ticker: 'AAPL',
  side: 'buy',
  shares: 100,
  price: 187.50,
  pnl: '+$234.50'
})
```

### ProductBuilder
**Must log:**
- New projects created
- Deployments (staging, production)
- Build successes/failures
- PRs opened/merged
- Infrastructure changes

**Example:**
```typescript
await log.completed('ProductBuilder', 'mission-control', 'Dashboard v2 deployed', {
  deployment: 'https://mission-control.vercel.app',
  repo: 'https://github.com/honey/mission-control'
}, {
  features: ['real-time', 'agent-status', 'search'],
  buildTime: '2m 34s'
})
```

### iOSAppBuilder
**Must log:**
- New app projects created
- TestFlight submissions
- App Store submissions
- Build successes/failures
- Code signing issues

**Example:**
```typescript
await log.completed('iOSAppBuilder', 'habit-tracker', 'TestFlight build 45 submitted', {
  deployment: 'https://testflight.apple.com/...'
}, {
  version: '1.2.0',
  buildNumber: 45,
  testers: 12
})
```

### Distribution
**Must log:**
- Content drafted
- Posts published
- Scheduled content
- Engagement metrics
- Failed posts (with error)

**Example:**
```typescript
await log.completed('Distribution', 'twitter-content', 'Thread posted', {
  deployment: 'https://twitter.com/ro9232/status/...'
}, {
  impressions: 12500,
  engagement: '4.2%'
})
```

### MemoryManager
**Must log:**
- Knowledge base updates
- Consolidation jobs
- Archive operations
- Index rebuilds
- New documents indexed

**Example:**
```typescript
await log.completed('MemoryManager', 'knowledge-base', 'Nightly consolidation complete', {}, {
  documentsIndexed: 47,
  projectsArchived: 2,
  storageUsed: '2.3GB'
})
```

## Log Structure

Each log entry includes:

| Field | Required | Description |
|-------|----------|-------------|
| `agent` | Yes | Your agent name (TraderBot, ProductBuilder, etc.) |
| `project` | Yes | Project slug (lowercase, no spaces) |
| `status` | Yes | `created`, `started`, `in-progress`, `paused`, `completed`, `failed` |
| `description` | Yes | Human-readable summary |
| `details` | No | JSON object with structured data |
| `links` | No | URLs (repo, deployment, docs) |
| `estimated_impact` | No | `low`, `medium`, `high`, `critical` |
| `error` | No | Error message if status is `failed` |

## Impact Levels

Use these to indicate importance:

- **critical**: System down, money at risk, security issue
- **high**: Major feature shipped, significant revenue impact
- **medium**: Normal work, routine tasks
- **low**: Minor updates, documentation, cosmetic changes

## Links

Always include relevant links:

```typescript
await log.completed('ProductBuilder', 'project', 'Description', {
  repo: 'https://github.com/honey/project',
  deployment: 'https://project.vercel.app',
  doc: 'https://notion.so/...',
  supabase: 'https://supabase.com/dashboard/project/...'
})
```

## Error Handling

The logger handles failures gracefully. If Supabase is unavailable, logs go to console. **Always** await log calls to catch any issues:

```typescript
try {
  await log.started('TraderBot', 'project', 'Task starting')
  // ... do work ...
  await log.completed('TraderBot', 'project', 'Task done')
} catch (err) {
  // Log the failure
  await log.failed('TraderBot', 'project', 'Task failed', err.message)
}
```

## Real-time Dashboard

All logs appear instantly at:
- **Main Dashboard**: https://mission-control-lovat-rho.vercel.app
- **Activity Feed**: https://mission-control-lovat-rho.vercel.app/activity
- **Agent Status**: https://mission-control-lovat-rho.vercel.app/agents

## Verification

To verify your logs are working:

1. Log a test entry
2. Check the Activity Feed
3. Look for the "Live" indicator (green pulse)
4. Confirm your entry appears

## Questions?

If logging isn't working:
1. Check Supabase env vars are set
2. Verify agent name matches exactly
3. Check browser console for errors
4. Ask Honey for help

---

**Remember: If it's not logged, it didn't happen.**
