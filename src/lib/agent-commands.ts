/**
 * Agent Command Parser
 * 
 * Detects !agent commands and spawns appropriate agents
 * Usage: !agent <agent-name> <task>
 */

export interface AgentCommand {
  agent: string;
  task: string;
  channel: string;
  user: string;
}

const AGENT_ALIASES: Record<string, string> = {
  // TraderBot aliases
  'traderbot': 'traderbot',
  'trader': 'traderbot',
  'trading': 'traderbot',
  'tbt': 'traderbot',
  
  // ProductBuilder aliases
  'productbuilder': 'productbuilder',
  'product': 'productbuilder',
  'builder': 'productbuilder',
  'pbd': 'productbuilder',
  'appdev': 'productbuilder',
  
  // Distribution aliases
  'distribution': 'distribution',
  'content': 'distribution',
  'contentagent': 'distribution',
  'dst': 'distribution',
  'social': 'distribution',
  
  // MemoryManager aliases
  'memorymanager': 'memorymanager',
  'memory': 'memorymanager',
  'research': 'memorymanager',
  'researchagent': 'memorymanager',
  'mmr': 'memorymanager',
  
  // iOSAppBuilder aliases
  'iosappbuilder': 'iosappbuilder',
  'ios': 'iosappbuilder',
  'appbuilder': 'iosappbuilder',
  'ios-dev': 'iosappbuilder',
  
  // SecurityAgent aliases
  'securityagent': 'securityagent',
  'security': 'securityagent',
  'sec': 'securityagent',
};

const AGENT_DISCORD_CHANNELS: Record<string, string> = {
  'traderbot': '1473473950267740313',
  'productbuilder': '1473474027971547186',
  'distribution': '1473473978658980046',
  'memorymanager': '1473474056341688575',
  'iosappbuilder': '1473474027971547186',
  'securityagent': '1473474006916006073',
};

/**
 * Parse agent command from message
 * Returns null if not a valid command
 */
export function parseAgentCommand(message: string, channelId: string, userId: string): AgentCommand | null {
  // Check if message starts with !agent
  if (!message.trim().toLowerCase().startsWith('!agent')) {
    return null;
  }
  
  // Remove !agent prefix and trim
  const content = message.trim().slice(6).trim();
  
  // Split into parts
  const parts = content.split(/\s+/);
  
  if (parts.length < 2) {
    return null; // Need at least agent name and task
  }
  
  const agentInput = parts[0].toLowerCase();
  const task = parts.slice(1).join(' ');
  
  // Look up agent ID from alias
  const agentId = AGENT_ALIASES[agentInput];
  
  if (!agentId) {
    return null; // Unknown agent
  }
  
  return {
    agent: agentId,
    task,
    channel: channelId,
    user: userId,
  };
}

/**
 * Get the Discord channel ID for an agent's response
 */
export function getAgentResponseChannel(agentId: string): string {
  return AGENT_DISCORD_CHANNELS[agentId] || '1473473925253038242'; // Default to agent-status
}

/**
 * Get agent display name
 */
export function getAgentDisplayName(agentId: string): string {
  const names: Record<string, string> = {
    'traderbot': 'TraderBot',
    'productbuilder': 'ProductBuilder',
    'distribution': 'Distribution',
    'memorymanager': 'MemoryManager',
    'iosappbuilder': 'iOSAppBuilder',
    'securityagent': 'SecurityAgent',
  };
  return names[agentId] || agentId;
}

/**
 * Validate if agent exists
 */
export function isValidAgent(agentId: string): boolean {
  return Object.values(AGENT_ALIASES).includes(agentId);
}

/**
 * Get help text for command usage
 */
export function getAgentCommandHelp(): string {
  return `**Agent Command System**

Usage: \`!agent <name> <task>\`

**Available Agents:**
• \`!agent traderbot <task>\` - Trading & analysis
• \`!agent productbuilder <task>\` - Building & deployment  
• \`!agent distribution <task>\` - Content creation
• \`!agent memorymanager <task>\` - Research & knowledge
• \`!agent iosappbuilder <task>\` - iOS development
• \`!agent securityagent <task>\` - Security scanning

**Examples:**
\`!agent traderbot analyze AAPL\`
\`!agent productbuilder deploy dashboard\`
\`!agent distribution draft tweet about AI\``;
}
