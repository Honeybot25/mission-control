#!/bin/bash
# Agent Activity Logger
# Usage: ./agent-log.sh <agent> <project> <status> <description> [links]
#
# Examples:
#   ./agent-log.sh TraderBot honeyalgo started "Backtest initiated"
#   ./agent-log.sh ProductBuilder mission-control completed "Dashboard deployed" "deployment:https://..."
#   ./agent-log.sh Distribution content failed "Tweet failed" "error:Rate limited"

AGENT=$1
PROJECT=$2
STATUS=$3
DESCRIPTION=$4
LINKS=$5

if [ -z "$AGENT" ] || [ -z "$PROJECT" ] || [ -z "$STATUS" ] || [ -z "$DESCRIPTION" ]; then
    echo "Usage: ./agent-log.sh <agent> <project> <status> <description> [links]"
    echo ""
    echo "Agents: TraderBot, ProductBuilder, iOSAppBuilder, Distribution, MemoryManager"
    echo "Statuses: created, started, in-progress, paused, completed, failed"
    echo ""
    echo "Example:"
    echo '  ./agent-log.sh TraderBot honeyalgo completed "Backtest finished" "deployment:https://..."'
    exit 1
fi

# Generate ID and timestamp
ID="fb-$(date +%s%3N)-$(openssl rand -hex 4)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Parse links into JSON if provided
LINKS_JSON="{}"
if [ -n "$LINKS" ]; then
    LINKS_JSON="{"
    IFS=',' read -ra LINK_ARRAY <<< "$LINKS"
    for link in "${LINK_ARRAY[@]}"; do
        KEY=$(echo "$link" | cut -d: -f1)
        VALUE=$(echo "$link" | cut -d: -f2-)
        LINKS_JSON="$LINKS_JSON\"$KEY\":\"$VALUE\","
    done
    # Remove trailing comma
    LINKS_JSON="${LINKS_JSON%,}"
    LINKS_JSON="$LINKS_JSON}"
fi

# Create log entry
LOG_ENTRY="{\"id\":\"$ID\",\"timestamp\":\"$TIMESTAMP\",\"agent\":\"$AGENT\",\"project\":\"$PROJECT\",\"status\":\"$STATUS\",\"description\":\"$DESCRIPTION\",\"links\":$LINKS_JSON,\"estimated_impact\":\"medium\",\"source\":\"fallback\"}"

# Write to log file
LOG_FILE="/Users/Honeybot/.openclaw/workspace/logs/agent-activity.log"
echo "$LOG_ENTRY" >> "$LOG_FILE"

echo "✅ Logged: [$AGENT] $STATUS - $DESCRIPTION"
