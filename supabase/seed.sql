-- Mission Control Seed Data
-- Sample data for testing and development
-- Run this after applying the schema migration

-- ============================================================================
-- SEED: Agents (Fleet Registry)
-- ============================================================================

INSERT INTO agents (id, name, slug, description, status, version, capabilities, tags, config, metadata, last_heartbeat, heartbeat_interval_seconds, max_concurrent_runs, daily_run_limit) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'TraderBot', 'traderbot', 'Autonomous trading system for algorithmic trading strategies', 'active', '2.1.0', 
  ARRAY['trading', 'backtesting', 'risk_management', 'market_analysis'], 
  ARRAY['production', 'trading', 'critical'],
  '{"default_exchange": "binance", "paper_trading": false, "risk_per_trade": 0.02}',
  '{"owner": "honey", "team": "alpha", "cost_center": "trading"}',
  NOW() - INTERVAL '2 minutes', 60, 3, 500
),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'ProductBuilder', 'productbuilder', 'Full-stack product development agent', 'active', '1.8.3',
  ARRAY['web_development', 'mobile_apps', 'deployment', 'ci_cd'],
  ARRAY['production', 'development', 'sprint_active'],
  '{"default_stack": "nextjs", "deployment_target": "vercel", "enable_preview_deploys": true}',
  '{"owner": "honey", "team": "product", "sprint": "sprint_42"}',
  NOW() - INTERVAL '5 minutes', 60, 5, 200
),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'DistributionAgent', 'distribution', 'Content creation and social media distribution', 'idle', '1.5.0',
  ARRAY['content_creation', 'social_media', 'analytics', 'scheduling'],
  ARRAY['production', 'content', 'twitter_primary'],
  '{"primary_platform": "twitter", "auto_reply": true, "content_calendar": true}',
  '{"owner": "honey", "team": "growth", "brand_voice": "professional"}',
  NOW() - INTERVAL '1 hour', 300, 2, 50
),
('d4e5f6a7-b8c9-0123-defa-456789012345', 'MemoryManager', 'memory', 'Nightly knowledge consolidation and organization', 'active', '1.2.1',
  ARRAY['knowledge_management', 'indexing', 'archiving', 'search'],
  ARRAY['production', 'infrastructure', 'scheduled'],
  '{"consolidation_time": "02:00", "archive_after_days": 90, "index_engine": "fts"}',
  '{"owner": "honey", "team": "platform", "schedule": "nightly"}',
  NOW() - INTERVAL '30 minutes', 600, 1, 10
),
('e5f6a7b8-c9d0-1234-efab-567890123456', 'iOSAppBuilder', 'iosbuilder', 'iOS app development and TestFlight deployment', 'paused', '1.0.0',
  ARRAY['ios_development', 'swift', 'testflight', 'app_store'],
  ARRAY['development', 'mobile', 'paused_project'],
  '{"xcode_version": "15.0", "swift_version": "5.9", "min_ios_version": "16.0"}',
  '{"owner": "honey", "team": "mobile", "project": "app_v2"}',
  NOW() - INTERVAL '2 days', 120, 2, 100
),
('f6a7b8c9-d0e1-2345-fabc-678901234567', 'ResearchBot', 'research', 'Deep research and analysis agent', 'active', '1.3.0',
  ARRAY['research', 'analysis', 'summarization', 'web_scraping'],
  ARRAY['production', 'research', 'ad_hoc'],
  '{"sources": ["arxiv", "reddit", "twitter", "news"], "depth": "comprehensive"}',
  '{"owner": "honey", "team": "intelligence"}',
  NOW() - INTERVAL '15 minutes', 180, 4, 100
);

-- ============================================================================
-- SEED: Agent Runs
-- ============================================================================

INSERT INTO agent_runs (id, agent_id, status, trigger, started_at, completed_at, duration_ms, input_payload, output_payload, tokens_input, tokens_output, cost_usd, parent_run_id, session_id, metadata) VALUES
-- TraderBot runs
('r1a2b3c4-d5e6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'completed', 'scheduled', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '9 minutes 30 seconds', 30000,
 '{"strategy": "momentum", "symbols": ["BTC", "ETH"], "timeframe": "1h"}',
 '{"signals": 3, "executed": 2, "pnl": 0.015}', 2500, 1200, 0.003500, NULL, 'sess-001',
 '{"market_regime": "trending", "volatility": "medium"}'
),
('r2b3c4d5-e6f7-8901-bcde-f23456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'completed', 'webhook', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes', 60000,
 '{"alert": "price_breakout", "symbol": "SOL", "direction": "long"}',
 '{"position_opened": true, "size": 0.5, "entry": 98.50}', 1800, 800, 0.002100, NULL, 'sess-002',
 '{"manual_override": false}'
),
('r3c4d5e6-f7a8-9012-cdef-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'failed', 'scheduled', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 55 minutes', 300000,
 '{"strategy": "arbitrage", "exchanges": ["binance", "coinbase"]}',
 NULL, 500, 0, 0.000500, NULL, 'sess-003',
 '{"error_context": "rate_limit_exceeded"}'
),

-- ProductBuilder runs
('r4d5e6f7-a8b9-0123-defa-456789012345', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'completed', 'manual', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 45 minutes', 900000,
 '{"task": "deploy_landing_page", "branch": "main", "env": "production"}',
 '{"deployed_url": "https://mission-control.vercel.app", "build_time": 120}', 4200, 2100, 0.006300, NULL, 'sess-004',
 '{"preview_deploy": true, "tests_passed": true}'
),
('r5e6f7a8-b9c0-1234-efab-567890123456', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'running', 'api', NOW() - INTERVAL '5 minutes', NULL, NULL,
 '{"task": "generate_component", "framework": "react", "component_type": "dashboard"}',
 NULL, 850, 0, 0.001275, NULL, 'sess-005',
 '{"stream": true}'
),
('r6f7a8b9-c0d1-2345-fabc-678901234567', 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'completed', 'scheduled', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 50 minutes', 600000,
 '{"task": "dependency_update", "packages": ["next", "react", "typescript"]}',
 '{"updated": 15, "breaking_changes": 0, "tests_passed": true}', 1200, 600, 0.001800, NULL, 'sess-006',
 '{"auto_merge": true}'
),

-- DistributionAgent runs
('r7a8b9c0-d1e2-3456-abcd-789012345678', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'completed', 'scheduled', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '29 minutes', 60000,
 '{"content_type": "thread", "topic": "ai_automation", "tone": "professional"}',
 '{"tweet_count": 5, "engagement_prediction": 0.72, "posted": true}', 3200, 1500, 0.004700, NULL, 'sess-007',
 '{"auto_post": true, "best_time_posting": true}'
),
('r8b9c0d1-e2f3-4567-bcde-890123456789', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'cancelled', 'manual', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 59 minutes', 60000,
 '{"content_type": "reply", "target_tweet_id": "1234567890"}',
 NULL, 400, 0, 0.000600, NULL, 'sess-008',
 '{"cancellation_reason": "target_deleted"}'
),

-- MemoryManager runs
('r9c0d1e2-f3a4-5678-cdef-901234567890', 'd4e5f6a7-b8c9-0123-defa-456789012345', 'completed', 'scheduled', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '9 hours 55 minutes', 300000,
 '{"operation": "nightly_consolidation", "date": "2026-02-24"}',
 '{"processed_sessions": 24, "artifacts_created": 8, "archived": 3}', 2000, 900, 0.002900, NULL, 'sess-009',
 '{"consolidation_type": "full"}'
),

-- ResearchBot runs
('r0d1e2f3-a4b5-6789-defa-012345678901', 'f6a7b8c9-d0e1-2345-fabc-678901234567', 'completed', 'api', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '35 minutes', 600000,
 '{"query": "latest ai agent frameworks 2026", "sources": ["arxiv", "github", "twitter"], "depth": "comprehensive"}',
 '{"sources_analyzed": 47, "key_findings": 12, "report_generated": true}', 5800, 3200, 0.009000, NULL, 'sess-010',
 '{"report_format": "markdown", "include_citations": true}'
);

-- ============================================================================
-- SEED: Agent Events
-- ============================================================================

INSERT INTO agent_events (id, run_id, type, level, message, data, span_id, parent_span_id, trace_id, source_file, source_line, source_function, duration_ms) VALUES
-- Events for run r5e6f7a8-b9c0-1234-efab-567890123456 (currently running)
(gen_random_uuid(), 'r5e6f7a8-b9c0-1234-efab-567890123456', 'start', 'info', 'Run initiated via API', '{"endpoint": "/api/v1/generate", "method": "POST"}', 'span-001', NULL, 'trace-001', 'api/routes.ts', 42, 'handleGenerateRequest', 0),
(gen_random_uuid(), 'r5e6f7a8-b9c0-1234-efab-567890123456', 'tool_call', 'info', 'Invoking LLM for component generation', '{"model": "gpt-4", "temperature": 0.7}', 'span-002', 'span-001', 'trace-001', 'llm/client.ts', 88, 'generateComponent', 2500),
(gen_random_uuid(), 'r5e6f7a8-b9c0-1234-efab-567890123456', 'llm_call', 'debug', 'Sending prompt to LLM', '{"prompt_tokens": 850, "max_tokens": 4000}', 'span-003', 'span-002', 'trace-001', 'llm/openai.ts', 156, 'createChatCompletion', 1200),

-- Events for completed run r1a2b3c4-d5e6-7890-abcd-ef1234567890
(gen_random_uuid(), 'r1a2b3c4-d5e6-7890-abcd-ef1234567890', 'start', 'info', 'Scheduled check initiated', '{"schedule": "*/10 * * * *", "strategy": "momentum"}', 'span-101', NULL, 'trace-101', 'scheduler/cron.ts', 23, 'executeScheduledTask', 0),
(gen_random_uuid(), 'r1a2b3c4-d5e6-7890-abcd-ef1234567890', 'tool_call', 'info', 'Fetching market data from exchange', '{"exchange": "binance", "symbols": 2}', 'span-102', 'span-101', 'trace-101', 'exchanges/binance.ts', 67, 'fetchMarketData', 800),
(gen_random_uuid(), 'r1a2b3c4-d5e6-7890-abcd-ef1234567890', 'decision', 'info', 'Generated 3 trading signals', '{"signals": [{"symbol": "BTC", "action": "buy"}, {"symbol": "ETH", "action": "hold"}, {"symbol": "SOL", "action": "sell"}]}', 'span-103', 'span-101', 'trace-101', 'strategies/momentum.ts', 145, 'generateSignals', 500),
(gen_random_uuid(), 'r1a2b3c4-d5e6-7890-abcd-ef1234567890', 'tool_call', 'info', 'Executing buy order for BTC', '{"symbol": "BTCUSDT", "side": "buy", "quantity": 0.1}', 'span-104', 'span-103', 'trace-101', 'execution/engine.ts', 234, 'executeOrder', 1200),
(gen_random_uuid(), 'r1a2b3c4-d5e6-7890-abcd-ef1234567890', 'tool_result', 'info', 'Order filled successfully', '{"order_id": "123456789", "fill_price": 43250.50, "fill_qty": 0.1}', 'span-105', 'span-104', 'trace-101', 'execution/engine.ts', 245, 'executeOrder', 0),
(gen_random_uuid(), 'r1a2b3c4-d5e6-7890-abcd-ef1234567890', 'end', 'info', 'Run completed successfully', '{"duration_ms": 30000, "pnl": 0.015}', 'span-106', 'span-101', 'trace-101', 'scheduler/cron.ts', 45, 'executeScheduledTask', 30000),

-- Events for failed run r3c4d5e6-f7a8-9012-cdef-345678901234
(gen_random_uuid(), 'r3c4d5e6-f7a8-9012-cdef-345678901234', 'start', 'info', 'Arbitrage strategy started', '{"exchanges": ["binance", "coinbase"]}', 'span-201', NULL, 'trace-201', 'scheduler/cron.ts', 23, 'executeScheduledTask', 0),
(gen_random_uuid(), 'r3c4d5e6-f7a8-9012-cdef-345678901234', 'tool_call', 'info', 'Fetching prices from multiple exchanges', '{"exchanges": 2}', 'span-202', 'span-201', 'trace-201', 'exchanges/multi.ts', 56, 'fetchAllPrices', 2000),
(gen_random_uuid(), 'r3c4d5e6-f7a8-9012-cdef-345678901234', 'error', 'error', 'Rate limit exceeded on Coinbase API', '{"retry_after": 60, "limit": 100}', 'span-203', 'span-202', 'trace-201', 'exchanges/coinbase.ts', 89, 'makeRequest', 0),
(gen_random_uuid(), 'r3c4d5e6-f7a8-9012-cdef-345678901234', 'warning', 'warning', 'Retrying with exponential backoff', '{"attempt": 1, "delay_ms": 1000}', 'span-204', 'span-202', 'trace-201', 'utils/retry.ts', 34, 'retryWithBackoff', 1000),
(gen_random_uuid(), 'r3c4d5e6-f7a8-9012-cdef-345678901234', 'error', 'error', 'Max retries exceeded', '{"max_retries": 3, "final_error": "rate_limit_exceeded"}', 'span-205', 'span-202', 'trace-201', 'utils/retry.ts', 45, 'retryWithBackoff', 0),
(gen_random_uuid(), 'r3c4d5e6-f7a8-9012-cdef-345678901234', 'error', 'critical', 'Run failed - could not fetch required data', '{"error": "rate_limit_exceeded", "fatal": true}', 'span-206', 'span-201', 'trace-201', 'strategies/arbitrage.ts', 112, 'executeStrategy', 300000);

-- ============================================================================
-- SEED: Agent Metrics Daily
-- ============================================================================

INSERT INTO agent_metrics_daily (id, agent_id, date, total_runs, successful_runs, failed_runs, cancelled_runs, avg_duration_ms, min_duration_ms, max_duration_ms, p95_duration_ms, p99_duration_ms, total_tokens_input, total_tokens_output, total_cost_usd, total_errors, unique_error_types, metadata) VALUES
-- TraderBot metrics for last 7 days
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '0 days', 142, 135, 5, 2, 45000, 15000, 180000, 120000, 165000, 285000, 142000, 0.427000, 7, 3, '{"market_volatility": "high", "strategy_performance": "+2.3%"}'),
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '1 days', 138, 132, 4, 2, 42000, 12000, 165000, 110000, 155000, 276000, 138000, 0.414000, 5, 2, '{"market_volatility": "medium"}'),
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', CURRENT_DATE - INTERVAL '2 days', 156, 148, 6, 2, 48000, 14000, 195000, 135000, 180000, 312000, 156000, 0.468000, 8, 3, '{"market_volatility": "high", "major_event": "fed_announcement"}'),

-- ProductBuilder metrics
(gen_random_uuid(), 'b2c3d4e5-f6a7-8901-bcde-f23456789012', CURRENT_DATE - INTERVAL '0 days', 24, 22, 1, 1, 480000, 60000, 1200000, 900000, 1150000, 85000, 42000, 0.127500, 2, 1, '{"deployments": 3, "builds": 18}'),
(gen_random_uuid(), 'b2c3d4e5-f6a7-8901-bcde-f23456789012', CURRENT_DATE - INTERVAL '1 days', 28, 26, 2, 0, 520000, 90000, 1500000, 1100000, 1400000, 98000, 49000, 0.147000, 3, 2, '{"deployments": 4}'),

-- DistributionAgent metrics
(gen_random_uuid(), 'c3d4e5f6-a7b8-9012-cdef-345678901234', CURRENT_DATE - INTERVAL '0 days', 8, 7, 0, 1, 65000, 30000, 120000, 110000, 120000, 28500, 13200, 0.042300, 0, 0, '{"posts_published": 7, "engagement_rate": 0.045}'),
(gen_random_uuid(), 'c3d4e5f6-a7b8-9012-cdef-345678901234', CURRENT_DATE - INTERVAL '1 days', 6, 6, 0, 0, 55000, 25000, 105000, 95000, 105000, 22000, 9800, 0.032400, 0, 0, '{"posts_published": 5, "engagement_rate": 0.051}'),

-- MemoryManager metrics
(gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-456789012345', CURRENT_DATE - INTERVAL '0 days', 1, 1, 0, 0, 300000, 300000, 300000, 300000, 300000, 2000, 900, 0.002900, 0, 0, '{"sessions_processed": 24, "artifacts_created": 8}'),
(gen_random_uuid(), 'd4e5f6a7-b8c9-0123-defa-456789012345', CURRENT_DATE - INTERVAL '1 days', 1, 1, 0, 0, 280000, 280000, 280000, 280000, 280000, 1800, 800, 0.002600, 0, 0, '{"sessions_processed": 18, "artifacts_created": 6}');

-- ============================================================================
-- SEED: Agent Errors
-- ============================================================================

INSERT INTO agent_errors (id, run_id, agent_id, error_type, error_code, message, stacktrace, context, metadata, is_resolved, resolved_at, resolution_notes, fingerprint, occurrence_count, first_seen_at) VALUES
-- Unresolved error from TraderBot
(gen_random_uuid(), 'r3c4d5e6-f7a8-9012-cdef-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'rate_limit_exceeded', '429', 
 'API rate limit exceeded on Coinbase exchange',
 'RateLimitError: 429 Too Many Requests
    at CoinbaseClient.makeRequest (/src/exchanges/coinbase.ts:89:15)
    at processTicksAndRejections (internal/process/task_queues.js:97:5)
    at async fetchAllPrices (/src/exchanges/multi.ts:56:22)',
 '{"endpoint": "/api/v3/ticker/price", "symbols_requested": 50, "retry_after": 60}',
 '{"severity": "high", "affected_strategy": "arbitrage"}',
 FALSE, NULL, NULL, 'a1b2c3d4e5f6429coinbase', 12, NOW() - INTERVAL '3 days'
),

-- Resolved error from ProductBuilder
(gen_random_uuid(), NULL, 'b2c3d4e5-f6a7-8901-bcde-f23456789012', 'build_failure', 'BUILD_ERROR',
 'Next.js build failed due to type error in Dashboard component',
 'TypeError: Property "metrics" does not exist on type "DashboardProps"
    at /src/components/Dashboard.tsx:45:23
    at processTicksAndRejections (internal/process/task_queues.js:97:5)',
 '{"build_id": "build-2847", "vercel_project": "mission-control", "commit": "abc1234"}',
 '{"severity": "medium", "component": "Dashboard"}',
 TRUE, NOW() - INTERVAL '2 hours', 'Fixed type definition in DashboardProps interface',
 'b2c3d4e5f6a7BUILDdashboard', 1, NOW() - INTERVAL '6 hours'
),

-- Unresolved error from DistributionAgent
(gen_random_uuid(), NULL, 'c3d4e5f6-a7b8-9012-cdef-345678901234', 'api_error', '403',
 'Twitter API authentication failed - token expired',
 'ApiError: 403 Forbidden
    at TwitterClient.post (/src/social/twitter.ts:134:12)
    at async DistributionAgent.publish (/src/agents/distribution.ts:89:7)',
 '{"endpoint": "POST /2/tweets", "user_id": "12345678"}',
 '{"severity": "critical", "platform": "twitter"}',
 FALSE, NULL, NULL, 'c3d4e5f6a7b8403twitter', 3, NOW() - INTERVAL '1 day'
),

-- Recurring error pattern from MemoryManager
(gen_random_uuid(), NULL, 'd4e5f6a7-b8c9-0123-defa-456789012345', 'timeout', 'ETIMEDOUT',
 'Database connection timeout during consolidation',
 'Error: connect ETIMEDOUT 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)',
 '{"operation": "batch_insert", "records": 2500}',
 '{"severity": "medium", "connection_pool": "exhausted"}',
 FALSE, NULL, NULL, 'd4e5f6a7b8c9ETIMEDOUT', 8, NOW() - INTERVAL '5 days'
);

-- ============================================================================
-- SEED: Knowledge Artifacts
-- ============================================================================

INSERT INTO knowledge_artifacts (id, type, title, content, tags, category, related_entities, related_artifact_ids, parent_artifact_id, source_url, source_agent_id, source_run_id, metadata) VALUES
-- Research artifact from ResearchBot
(gen_random_uuid(), 'research', 'Top 10 AI Agent Frameworks in 2026',
 '# Top 10 AI Agent Frameworks in 2026

## 1. OpenClaw
An autonomous execution framework with real-time coordination...

## 2. LangGraph
Advanced state management for complex agent workflows...

## 3. CrewAI
Multi-agent orchestration system...

[Full analysis with benchmarks and comparisons]',
 ARRAY['ai', 'agents', 'frameworks', 'research', '2026'],
 'technology',
 '[{"type": "agent", "id": "f6a7b8c9-d0e1-2345-fabc-678901234567", "name": "ResearchBot"}]'::jsonb,
 '{}', NULL, NULL, 'f6a7b8c9-d0e1-2345-fabc-678901234567', 'r0d1e2f3-a4b5-6789-defa-012345678901',
 '{"confidence": 0.95, "sources_verified": true}'
),

-- Decision artifact from TraderBot
(gen_random_uuid(), 'decision', 'Strategy Pivot: From Momentum to Mean Reversion',
 'After analyzing 3 months of backtesting data, we identified that mean reversion strategies are outperforming momentum in current market conditions.

**Decision:** Allocate 60% of trading capital to mean reversion, 40% to momentum.

**Rationale:**
- Volatility regime has shifted to range-bound
- Mean reversion win rate: 68%
- Momentum win rate (recent): 42%

**Risk Management:**
- Maintain 2% max risk per trade
- Stop loss at 1.5 ATR',
 ARRAY['trading', 'strategy', 'decision', 'risk_management'],
 'trading',
 '[{"type": "agent", "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "name": "TraderBot"}]'::jsonb,
 '{}', NULL, NULL, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL,
 '{"decision_authority": "autonomous", "review_required": false}'
),

-- Insight artifact from MemoryManager
(gen_random_uuid(), 'insight', 'Agent Coordination Pattern: The "Hub and Spoke" Model',
 'Analysis of 1000+ inter-agent interactions reveals optimal coordination patterns.

**Key Insight:**
Hub-and-spoke topology with Honey as central orchestrator reduces latency by 40% compared to mesh networks.

**Recommendations:**
1. Maintain clear orchestration hierarchy
2. Use async message passing for non-critical updates
3. Implement circuit breakers for agent failures

**Impact:**
- Reduced coordination overhead
- Faster task completion
- Better error isolation',
 ARRAY['architecture', 'patterns', 'coordination', 'multi-agent'],
 'system_design',
 '[{"type": "agent", "id": "d4e5f6a7-b8c9-0123-defa-456789012345", "name": "MemoryManager"}]'::jsonb,
 '{}', NULL, NULL, 'd4e5f6a7-b8c9-0123-defa-456789012345', NULL,
 '{"derived_from": 1247, "confidence": 0.89}'
),

-- Note artifact from ProductBuilder
(gen_random_uuid(), 'note', 'Mission Control Dashboard Feature Spec V1',
 '# Mission Control Dashboard V1

## Core Features
- Real-time agent status monitoring
- Execution history and traces
- Cost tracking and optimization suggestions
- Error alerting and resolution workflows

## Technical Stack
- Next.js 14 with App Router
- Tailwind CSS for styling
- Recharts for visualizations
- Supabase for backend

## UI/UX Priorities
1. Speed over aesthetics
2. Mobile-responsive is a must
3. Dark mode default',
 ARRAY['spec', 'product', 'dashboard', 'v1'],
 'product',
 '[{"type": "agent", "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012", "name": "ProductBuilder"}]'::jsonb,
 '{}', NULL, NULL, 'b2c3d4e5-f6a7-8901-bcde-f23456789012', NULL,
 '{"priority": "high", "sprint": "sprint_42"}'
),

-- Code snippet artifact
(gen_random_uuid(), 'code_snippet', 'Rate Limiter Implementation Pattern',
 '```typescript
class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  async acquire(key: string, tokens: number = 1): Promise<boolean> {
    const bucket = this.getOrCreateBucket(key);
    return bucket.consume(tokens);
  }
  
  private getOrCreateBucket(key: string): TokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new TokenBucket(this.config));
    }
    return this.buckets.get(key)!;
  }
}
```',
 ARRAY['code', 'typescript', 'rate-limiting', 'pattern'],
 'engineering',
 '[]'::jsonb,
 '{}', NULL, 'https://github.com/openclaw/core/blob/main/src/utils/rate-limiter.ts', NULL, NULL,
 '{"language": "typescript", "lines": 18}'
);

-- ============================================================================
-- SEED: Integrations
-- ============================================================================

INSERT INTO integrations (id, name, type, description, config, secrets_encrypted, status, rate_limit_per_minute, webhook_url, webhook_secret, webhook_events, agent_ids, metadata) VALUES
-- Discord webhook integration
(gen_random_uuid(), 'Discord - Mission Control', 'discord', 'Primary Discord channel for agent notifications and alerts',
 '{"channel_id": "1473436108703531051", "guild_id": "1234567890", "mention_roles": ["admin"]}',
 'encrypted_discord_token_xyz123',
 'active',
 30,
 'https://discord.com/api/webhooks/123456789/token',
 'wh_secret_abc123',
 ARRAY['run.completed', 'run.failed', 'error.critical', 'agent.offline'],
 ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid],
 '{"alert_threshold": "warning", "include_stacktraces": true}'
),

-- Slack integration
(gen_random_uuid(), 'Slack - Trading Alerts', 'slack', 'Trading-specific alerts for high-value signals',
 '{"channel": "#trading-alerts", "workspace": "mycompany"}',
 'encrypted_slack_token_abc456',
 'active',
 60,
 NULL,
 NULL,
 '{}',
 ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid],
 '{"alert_only_above": {"trade_value": 1000}}'
),

-- Email integration
(gen_random_uuid(), 'Email - Daily Reports', 'email', 'Daily summary emails for stakeholders',
 '{"smtp_host": "smtp.gmail.com", "smtp_port": 587, "from": "agents@mycompany.com", "to": ["admin@mycompany.com"]}',
 'encrypted_email_password_def789',
 'active',
 10,
 NULL,
 NULL,
 '{}',
 ARRAY['d4e5f6a7-b8c9-0123-defa-456789012345'::uuid],
 '{"schedule": "0 9 * * *", "report_type": "daily_summary"}'
),

-- GitHub integration
(gen_random_uuid(), 'GitHub - Auto-PRs', 'github', 'Automatic PR creation for code changes',
 '{"owner": "mycompany", "repo": "mission-control", "default_branch": "main", "auto_merge": false}',
 'encrypted_github_token_ghi012',
 'active',
 20,
 'https://api.github.com/repos/mycompany/mission-control/hooks',
 'gh_webhook_secret_xyz789',
 ARRAY['deployment.success', 'build.failure'],
 ARRAY['b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid],
 '{"require_approval": true, "reviewers": ["lead-dev"]}'
),

-- Notion integration (pending setup)
(gen_random_uuid(), 'Notion - Knowledge Base', 'notion', 'Sync knowledge artifacts to Notion workspace',
 '{"database_id": "abc123def456", "sync_frequency": "realtime"}',
 NULL,
 'pending_setup',
 30,
 NULL,
 NULL,
 '{}',
 ARRAY['d4e5f6a7-b8c9-0123-defa-456789012345'::uuid],
 '{"two_way_sync": false}'
),

-- Custom webhook for external system
(gen_random_uuid(), 'Zapier - Business Metrics', 'webhook', 'Send key metrics to Zapier for business intelligence',
 '{"zap_id": "12345", "timeout": 30000}',
 NULL,
 'active',
 120,
 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
 NULL,
 ARRAY['metrics.daily', 'run.completed'],
 ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid, 'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid],
 '{"payload_format": "compact", "include_metadata": true}'
),

-- Inactive integration example
(gen_random_uuid(), 'SMS - Critical Alerts', 'sms', 'SMS notifications for critical failures only',
 '{"provider": "twilio", "from_number": "+1234567890"}',
 'encrypted_twilio_secret_jkl345',
 'inactive',
 5,
 NULL,
 NULL,
 '{}',
 ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid],
 '{"only_for": ["liquidation", "security_breach"], "quiet_hours": {"start": 22, "end": 8}}'
);

-- ============================================================================
-- UPDATE ANALYZE STATISTICS
-- ============================================================================

ANALYZE agents;
ANALYZE agent_runs;
ANALYZE agent_events;
ANALYZE agent_metrics_daily;
ANALYZE agent_errors;
ANALYZE knowledge_artifacts;
ANALYZE integrations;

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================

-- Verification query (uncomment to check data)
/*
SELECT 
  'agents' as table_name, COUNT(*) as count FROM agents
UNION ALL SELECT 'agent_runs', COUNT(*) FROM agent_runs
UNION ALL SELECT 'agent_events', COUNT(*) FROM agent_events
UNION ALL SELECT 'agent_metrics_daily', COUNT(*) FROM agent_metrics_daily
UNION ALL SELECT 'agent_errors', COUNT(*) FROM agent_errors
UNION ALL SELECT 'knowledge_artifacts', COUNT(*) FROM knowledge_artifacts
UNION ALL SELECT 'integrations', COUNT(*) FROM integrations;
*/