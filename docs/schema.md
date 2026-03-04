# Mission Control Database Schema

Complete documentation for the Mission Control Supabase database schema.

**Version:** 1.0.0  
**Last Updated:** 2026-02-25  
**Database:** PostgreSQL 15+ (Supabase)

---

## Table of Contents

1. [Overview](#overview)
2. [Enums](#enums)
3. [Tables](#tables)
   - [agents](#agents)
   - [agent_runs](#agent_runs)
   - [agent_events](#agent_events)
   - [agent_metrics_daily](#agent_metrics_daily)
   - [agent_errors](#agent_errors)
   - [knowledge_artifacts](#knowledge_artifacts)
   - [integrations](#integrations)
4. [Views](#views)
5. [Functions & Triggers](#functions--triggers)
6. [Indexes](#indexes)
7. [RLS Policies](#rls-policies)
8. [Relationships](#relationships)

---

## Overview

The Mission Control database schema provides a complete data foundation for managing an autonomous agent fleet. It tracks:

- **Agent Registry**: Fleet management and health monitoring
- **Execution Tracking**: Detailed run history and performance metrics
- **Event Logging**: Comprehensive audit trails with distributed tracing
- **Error Management**: Structured error tracking and resolution workflows
- **Knowledge Management**: Second brain for insights and tacit knowledge
- **Integrations**: External service connections and webhooks

### Design Principles

- **JSONB Flexibility**: Metadata fields use JSONB for schema evolution
- **Time-Series Optimized**: Efficient querying of time-ordered data
- **Full-Text Search**: PostgreSQL FTS for knowledge artifacts
- **Distributed Tracing**: OpenTelemetry-style span/trace IDs
- **Soft References**: Nullable foreign keys preserve history on deletion

---

## Enums

### agent_status
Agent operational states.

| Value | Description |
|-------|-------------|
| `idle` | Agent ready but not currently working |
| `active` | Agent is processing work |
| `paused` | Agent temporarily suspended |
| `error` | Agent in error state |
| `offline` | Agent not responding to heartbeats |
| `deprecated` | Agent being phased out |

### run_status
Execution lifecycle states.

| Value | Description |
|-------|-------------|
| `pending` | Run queued but not started |
| `running` | Run currently executing |
| `completed` | Run finished successfully |
| `failed` | Run ended with error |
| `cancelled` | Run was cancelled before completion |
| `timeout` | Run exceeded time limit |

### event_type
Classification of agent events.

| Value | Description |
|-------|-------------|
| `start` | Run/thread started |
| `end` | Run/thread ended |
| `checkpoint` | Progress milestone |
| `decision` | Agent made a decision |
| `tool_call` | External tool invoked |
| `tool_result` | Tool response received |
| `llm_call` | LLM API called |
| `llm_response` | LLM response received |
| `error` | Error occurred |
| `warning` | Warning condition |
| `info` | Informational message |

### event_level
Severity levels for events.

| Value | Description |
|-------|-------------|
| `debug` | Detailed debugging info |
| `info` | Normal operation info |
| `warning` | Potential issue |
| `error` | Error condition |
| `critical` | System-critical error |

### artifact_type
Knowledge artifact categories.

| Value | Description |
|-------|-------------|
| `note` | General note or thought |
| `research` | Research findings |
| `decision` | Decision log |
| `insight` | Derived insight |
| `code_snippet` | Code example |
| `link` | Curated link |
| `document` | Structured document |
| `image` | Image asset |
| `video` | Video asset |

### integration_type
External service types.

| Value | Description |
|-------|-------------|
| `webhook` | Generic HTTP webhook |
| `slack` | Slack integration |
| `discord` | Discord integration |
| `email` | Email/SMTP |
| `sms` | SMS messaging |
| `github` | GitHub API |
| `notion` | Notion API |
| `telegram` | Telegram bot |
| `custom` | Custom integration |

### integration_status
Integration connection states.

| Value | Description |
|-------|-------------|
| `active` | Integration operational |
| `inactive` | Integration disabled |
| `error` | Integration in error state |
| `pending_setup` | Configuration incomplete |

---

## Tables

### agents

Fleet registry for all agent instances.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(255) | - | Human-readable agent name |
| `slug` | VARCHAR(100) | - | URL-friendly unique identifier |
| `description` | TEXT | NULL | Agent description |
| `status` | agent_status | `'idle'` | Current operational status |
| `version` | VARCHAR(50) | `'1.0.0'` | Agent software version |
| `capabilities` | TEXT[] | `{}` | Array of capability strings |
| `tags` | TEXT[] | `{}` | Categorization tags |
| `config` | JSONB | `{}` | Agent-specific configuration |
| `metadata` | JSONB | `{}` | Flexible metadata storage |
| `last_heartbeat` | TIMESTAMPTZ | NULL | Last health check timestamp |
| `heartbeat_interval_seconds` | INTEGER | `60` | Expected heartbeat frequency |
| `max_concurrent_runs` | INTEGER | `1` | Parallel execution limit |
| `daily_run_limit` | INTEGER | `100` | Daily run quota |
| `created_at` | TIMESTAMPTZ | `NOW()` | Record creation time |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update time |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE (slug)`
- `idx_agents_status` - For status filtering
- `idx_agents_slug` - Slug lookups
- `idx_agents_tags GIN(tags)` - Tag filtering
- `idx_agents_capabilities GIN(capabilities)` - Capability filtering
- `idx_agents_heartbeat` - For health monitoring (partial)

**Constraints:**
- `slug` must be unique

---

### agent_runs

Execution tracking for agent runs.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `agent_id` | UUID | - | **FK** → `agents.id` |
| `status` | run_status | `'pending'` | Current execution status |
| `trigger` | VARCHAR(100) | - | Initiator: 'manual', 'scheduled', 'webhook', 'api' |
| `started_at` | TIMESTAMPTZ | NULL | Execution start time |
| `completed_at` | TIMESTAMPTZ | NULL | Execution end time |
| `duration_ms` | INTEGER | NULL | **Auto-calculated** execution time |
| `input_payload` | JSONB | `{}` | Input parameters |
| `output_payload` | JSONB | `{}` | Output results |
| `tokens_input` | INTEGER | `0` | Input tokens consumed |
| `tokens_output` | INTEGER | `0` | Output tokens consumed |
| `tokens_total` | INTEGER | `generated` | **Auto-calculated** total tokens |
| `cost_usd` | DECIMAL(10,6) | `0.000000` | Estimated cost in USD |
| `parent_run_id` | UUID | NULL | **FK** → `agent_runs.id` (for sub-runs) |
| `session_id` | UUID | NULL | Groups related runs |
| `metadata` | JSONB | `{}` | Additional metadata |
| `created_at` | TIMESTAMPTZ | `NOW()` | Record creation time |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update time |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_agent_runs_agent_id` - Agent run lookups
- `idx_agent_runs_status` - Status filtering
- `idx_agent_runs_created_at DESC` - Recent runs
- `idx_agent_runs_session_id` - Session grouping (partial)
- `idx_agent_runs_parent_id` - Parent-child relationships (partial)
- `idx_agent_runs_trigger` - Trigger type filtering
- `idx_agent_runs_active` - Partial index for active runs

**Constraints:**
- `agent_id` → `agents(id)` ON DELETE CASCADE
- `parent_run_id` → `agent_runs(id)` ON DELETE SET NULL

**Triggers:**
- `trigger_calculate_run_duration` - Calculates `duration_ms` on completion

---

### agent_events

Detailed event traces for debugging and auditing.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `run_id` | UUID | - | **FK** → `agent_runs.id` |
| `type` | event_type | - | Event classification |
| `level` | event_level | `'info'` | Severity level |
| `message` | TEXT | - | Human-readable message |
| `data` | JSONB | `{}` | Event-specific data |
| `span_id` | VARCHAR(32) | NULL | Distributed tracing span ID |
| `parent_span_id` | VARCHAR(32) | NULL | Parent span for nesting |
| `trace_id` | VARCHAR(32) | NULL | End-to-end trace ID |
| `source_file` | VARCHAR(500) | NULL | Source code file |
| `source_line` | INTEGER | NULL | Line number in source |
| `source_function` | VARCHAR(255) | NULL | Function/method name |
| `duration_ms` | INTEGER | NULL | Event duration if applicable |
| `created_at` | TIMESTAMPTZ | `NOW()` | Event timestamp |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_agent_events_run_id` - Run event lookups
- `idx_agent_events_type` - Event type filtering
- `idx_agent_events_level` - Level filtering
- `idx_agent_events_created_at DESC` - Recent events
- `idx_agent_events_span` - Span lookups (partial)
- `idx_agent_events_trace` - Trace lookups (partial)
- `idx_agent_events_run_type` - Composite for filtering

**Constraints:**
- `run_id` → `agent_runs(id)` ON DELETE CASCADE

---

### agent_metrics_daily

Aggregated daily statistics for performance tracking.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `agent_id` | UUID | NULL | **FK** → `agents.id` |
| `date` | DATE | - | Metric date |
| `total_runs` | INTEGER | `0` | Total runs executed |
| `successful_runs` | INTEGER | `0` | Successful completions |
| `failed_runs` | INTEGER | `0` | Failed executions |
| `cancelled_runs` | INTEGER | `0` | Cancelled executions |
| `success_rate` | DECIMAL(5,2) | `generated` | **Auto-calculated** percentage |
| `avg_duration_ms` | INTEGER | NULL | Average latency |
| `min_duration_ms` | INTEGER | NULL | Minimum latency |
| `max_duration_ms` | INTEGER | NULL | Maximum latency |
| `p95_duration_ms` | INTEGER | NULL | 95th percentile latency |
| `p99_duration_ms` | INTEGER | NULL | 99th percentile latency |
| `total_tokens_input` | INTEGER | `0` | Total input tokens |
| `total_tokens_output` | INTEGER | `0` | Total output tokens |
| `total_tokens` | INTEGER | `generated` | **Auto-calculated** total |
| `total_cost_usd` | DECIMAL(12,6) | `0.000000` | Total cost |
| `total_errors` | INTEGER | `0` | Error count |
| `unique_error_types` | INTEGER | `0` | Distinct error types |
| `metadata` | JSONB | `{}` | Additional metrics |
| `created_at` | TIMESTAMPTZ | `NOW()` | Record creation |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE (agent_id, date)`
- `idx_agent_metrics_agent_id` - Agent metrics
- `idx_agent_metrics_date DESC` - Recent dates
- `idx_agent_metrics_agent_date` - Composite lookup

**Constraints:**
- `agent_id` → `agents(id)` ON DELETE CASCADE
- `UNIQUE (agent_id, date)` - One record per agent per day

---

### agent_errors

Structured error tracking and analysis.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `run_id` | UUID | NULL | **FK** → `agent_runs.id` |
| `agent_id` | UUID | NULL | **FK** → `agents.id` |
| `error_type` | VARCHAR(100) | - | High-level category |
| `error_code` | VARCHAR(50) | NULL | Provider-specific code |
| `message` | TEXT | - | Error message |
| `stacktrace` | TEXT | NULL | Full stack trace |
| `context` | JSONB | `{}` | Request params, state, etc |
| `metadata` | JSONB | `{}` | Additional metadata |
| `is_resolved` | BOOLEAN | `FALSE` | Resolution status |
| `resolved_at` | TIMESTAMPTZ | NULL | When resolved |
| `resolution_notes` | TEXT | NULL | How it was fixed |
| `fingerprint` | VARCHAR(64) | NULL | Hash for grouping similar errors |
| `occurrence_count` | INTEGER | `1` | Times this error occurred |
| `first_seen_at` | TIMESTAMPTZ | `NOW()` | First occurrence |
| `created_at` | TIMESTAMPTZ | `NOW()` | This occurrence |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_agent_errors_run_id` - Run error lookups (partial)
- `idx_agent_errors_agent_id` - Agent error lookups (partial)
- `idx_agent_errors_type` - Error type filtering
- `idx_agent_errors_fingerprint` - Fingerprint grouping
- `idx_agent_errors_created_at DESC` - Recent errors
- `idx_agent_errors_unresolved` - Open errors (partial)
- `idx_agent_errors_first_seen` - Error timeline

**Constraints:**
- `run_id` → `agent_runs(id)` ON DELETE SET NULL
- `agent_id` → `agents(id)` ON DELETE SET NULL

---

### knowledge_artifacts

Second brain storage for insights and tacit knowledge.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `type` | artifact_type | `'note'` | Content category |
| `title` | VARCHAR(500) | - | Artifact title |
| `content` | TEXT | - | Full content |
| `search_vector` | TSVECTOR | NULL | **Auto-generated** FTS index |
| `tags` | TEXT[] | `{}` | Categorization tags |
| `category` | VARCHAR(100) | NULL | Organization category |
| `related_entities` | JSONB | `[]` | Linked entities [{type, id, name}] |
| `related_artifact_ids` | UUID[] | `{}` | Related knowledge items |
| `parent_artifact_id` | UUID | NULL | **FK** → `knowledge_artifacts.id` |
| `source_url` | TEXT | NULL | External source URL |
| `source_agent_id` | UUID | NULL | **FK** → `agents.id` |
| `source_run_id` | UUID | NULL | **FK** → `agent_runs.id` |
| `metadata` | JSONB | `{}` | Additional metadata |
| `created_at` | TIMESTAMPTZ | `NOW()` | Creation time |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_knowledge_artifacts_type` - Type filtering
- `idx_knowledge_artifacts_tags GIN(tags)` - Tag search
- `idx_knowledge_artifacts_category` - Category lookup
- `idx_knowledge_artifacts_created_at DESC` - Recent items
- `idx_knowledge_artifacts_parent` - Parent-child (partial)
- `idx_knowledge_artifacts_search GIN(search_vector)` - Full-text search
- `idx_knowledge_artifacts_title_trgm GIN(title gin_trgm_ops)` - Fuzzy title search
- `idx_knowledge_artifacts_content_trgm GIN(content gin_trgm_ops)` - Fuzzy content search

**Constraints:**
- `parent_artifact_id` → `knowledge_artifacts(id)` ON DELETE SET NULL
- `source_agent_id` → `agents(id)` ON DELETE SET NULL
- `source_run_id` → `agent_runs(id)` ON DELETE SET NULL

**Triggers:**
- `trigger_update_knowledge_artifacts_search_vector` - Updates FTS index on changes

---

### integrations

External service connections and webhooks.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | UUID | `gen_random_uuid()` | Primary key |
| `name` | VARCHAR(255) | - | Integration name |
| `type` | integration_type | - | Service type |
| `description` | TEXT | NULL | Description |
| `config` | JSONB | `{}` | Non-sensitive configuration |
| `secrets_encrypted` | TEXT | NULL | Encrypted credentials |
| `status` | integration_status | `'pending_setup'` | Connection status |
| `last_used_at` | TIMESTAMPTZ | NULL | Last successful use |
| `last_error_at` | TIMESTAMPTZ | NULL | Last error timestamp |
| `last_error_message` | TEXT | NULL | Last error details |
| `rate_limit_per_minute` | INTEGER | `60` | Rate limit quota |
| `webhook_url` | TEXT | NULL | Webhook endpoint URL |
| `webhook_secret` | TEXT | NULL | Webhook verification secret |
| `webhook_events` | TEXT[] | `{}` | Events triggering webhook |
| `agent_ids` | UUID[] | `{}` | Authorized agents |
| `metadata` | JSONB | `{}` | Additional configuration |
| `created_at` | TIMESTAMPTZ | `NOW()` | Creation time |
| `updated_at` | TIMESTAMPTZ | `NOW()` | Last update |

**Indexes:**
- `PRIMARY KEY (id)`
- `idx_integrations_type` - Type filtering
- `idx_integrations_status` - Status filtering
- `idx_integrations_agent_ids GIN(agent_ids)` - Agent authorization
- `idx_integrations_webhook_events GIN(webhook_events)` - Event filtering
- `idx_integrations_created_at DESC` - Recent integrations

---

## Views

### v_active_agents
Active agents with recent run statistics.

```sql
SELECT 
  a.*,
  COALESCE(r.recent_runs, 0) as recent_runs,
  COALESCE(r.success_rate, 0) as recent_success_rate
FROM agents a
LEFT JOIN LATERAL (...) r ON true
WHERE a.status IN ('idle', 'active');
```

### v_recent_errors
Unresolved errors with agent information.

```sql
SELECT 
  e.*,
  a.name as agent_name,
  a.slug as agent_slug
FROM agent_errors e
LEFT JOIN agents a ON e.agent_id = a.id
WHERE e.is_resolved = FALSE
ORDER BY e.created_at DESC;
```

### v_knowledge_summary
Knowledge artifacts preview with truncated content.

```sql
SELECT 
  id, type, title, tags, category,
  created_at, updated_at,
  LEFT(content, 200) as content_preview
FROM knowledge_artifacts
ORDER BY updated_at DESC;
```

---

## Functions & Triggers

### update_updated_at_column()
Updates the `updated_at` timestamp on row modification.

**Applied to:**
- `agents`
- `agent_runs`
- `agent_metrics_daily`
- `agent_errors`
- `knowledge_artifacts`
- `integrations`

### update_knowledge_artifacts_search_vector()
Generates PostgreSQL full-text search vector from title, content, and tags.

**Weights:**
- Title: A (highest)
- Content: B
- Tags: C

### calculate_run_duration()
Auto-calculates `duration_ms` when `completed_at` is set.

---

## Indexes

### Performance-Critical Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `agents` | `idx_agents_status` | Filter by status |
| `agents` | `idx_agents_heartbeat` | Health monitoring |
| `agent_runs` | `idx_agent_runs_active` | Active run queries |
| `agent_runs` | `idx_agent_runs_created_at DESC` | Recent runs |
| `agent_events` | `idx_agent_events_created_at DESC` | Event streaming |
| `agent_errors` | `idx_agent_errors_unresolved` | Alert dashboard |
| `agent_metrics_daily` | `idx_agent_metrics_agent_date` | Time-series queries |

### GIN Indexes (JSONB/Arrays)

| Table | Index | Field |
|-------|-------|-------|
| `agents` | `idx_agents_tags` | `tags` |
| `agents` | `idx_agents_capabilities` | `capabilities` |
| `knowledge_artifacts` | `idx_knowledge_artifacts_tags` | `tags` |
| `knowledge_artifacts` | `idx_knowledge_artifacts_search` | `search_vector` |
| `integrations` | `idx_integrations_agent_ids` | `agent_ids` |
| `integrations` | `idx_integrations_webhook_events` | `webhook_events` |

---

## RLS Policies

All tables have **Row Level Security** enabled with the following default policy:

```sql
CREATE POLICY "Allow full access to authenticated users" 
ON [table] FOR ALL USING (true) WITH CHECK (true);
```

**Note:** This is a permissive default. Customize based on your authentication strategy.

---

## Relationships

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   agents    │◄──────┤   agent_runs    │◄──────┤  agent_events   │
└──────┬──────┘       └────────┬────────┘       └─────────────────┘
       │                       │
       │              ┌────────┴────────┐
       │              │                 │
       │       ┌──────┴──────┐   ┌──────┴──────┐
       │       │ agent_errors│   │   agent_    │
       │       │             │   │ metrics_daily│
       │       └─────────────┘   └─────────────┘
       │
       ├──────────────────────────────────────────┐
       │                                          │
┌──────┴──────────┐                    ┌──────────┴──────┐
│   integrations  │                    │knowledge_artifacts│
└─────────────────┘                    └─────────────────┘
```

**Key Relationships:**
- `agent_runs.agent_id` → `agents.id` (CASCADE delete)
- `agent_events.run_id` → `agent_runs.id` (CASCADE delete)
- `agent_runs.parent_run_id` → `agent_runs.id` (self-reference)
- `knowledge_artifacts.parent_artifact_id` → `knowledge_artifacts.id` (self-reference)

---

## Usage Examples

### Get agent fleet status
```sql
SELECT 
  name, 
  status, 
  last_heartbeat,
  EXTRACT(EPOCH FROM (NOW() - last_heartbeat))/60 as minutes_since_heartbeat
FROM agents
ORDER BY status, last_heartbeat DESC;
```

### Find runs by error rate
```sql
SELECT 
  a.name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN r.status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
  ROUND(AVG(CASE WHEN r.status = 'failed' THEN 1 ELSE 0 END) * 100, 2) as failure_rate
FROM agents a
JOIN agent_runs r ON a.id = r.agent_id
WHERE r.created_at > NOW() - INTERVAL '24 hours'
GROUP BY a.id, a.name
ORDER BY failure_rate DESC;
```

### Search knowledge base
```sql
SELECT title, type, updated_at
FROM knowledge_artifacts
WHERE search_vector @@ plainto_tsquery('english', 'distributed systems')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'distributed systems')) DESC
LIMIT 10;
```

### Get daily cost breakdown
```sql
SELECT 
  date,
  SUM(total_cost_usd) as total_cost,
  SUM(total_tokens) as total_tokens,
  SUM(total_runs) as total_runs
FROM agent_metrics_daily
WHERE date > CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

---

## Migration History

| Version | Description | Date |
|---------|-------------|------|
| `001_initial_schema` | Initial schema with all 7 tables, enums, indexes, and RLS | 2026-02-25 |

---

## Notes

1. **pg_trgm Extension**: Required for fuzzy text search on knowledge artifacts
2. **UUID Generation**: Uses `uuid-ossp` extension, but `gen_random_uuid()` is preferred
3. **JSONB Performance**: Consider adding expression indexes for frequently accessed JSONB paths
4. **Partitioning**: For high-volume installations, consider partitioning `agent_events` and `agent_runs` by date
5. **Encryption**: Handle sensitive data encryption at the application layer; `secrets_encrypted` stores ciphertext