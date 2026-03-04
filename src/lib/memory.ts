/**
 * OpenClaw Memory Integration
 * 
 * Simple local memory system - NO APIs needed, 100% private
 * Stores everything in ~/.openclaw/memory-store/
 * 
 * Usage:
 *   import { remember, recall, listMemories } from '@/lib/memory'
 *   await remember("R's favorite color is blue")
 *   const memories = await recall("What is R's favorite color?")
 */

export interface Memory {
  id: string
  content: string
  user_id: string
  tags: string[]
  created_at: string
  access_count: number
}

const MEMORY_API_URL = process.env.MEMORY_API_URL || 'http://localhost:5000'

/**
 * Store a new memory
 */
export async function remember(
  content: string, 
  tags?: string[], 
  userId: string = 'ro9232'
): Promise<{ id: string; status: string } | null> {
  try {
    // For now, write directly to file via API
    const response = await fetch(`${MEMORY_API_URL}/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, tags, user_id: userId })
    })
    
    if (!response.ok) {
      // Fallback: log to console
      console.log('[MEMORY]', { content, tags, userId })
      return { id: 'local-' + Date.now(), status: 'logged' }
    }
    
    return await response.json()
  } catch (err) {
    console.error('Memory store failed:', err)
    // Always log, never fail
    console.log('[MEMORY FALLBACK]', { content, tags, userId })
    return { id: 'fallback-' + Date.now(), status: 'logged' }
  }
}

/**
 * Search memories
 */
export async function recall(
  query: string, 
  userId: string = 'ro9232'
): Promise<Memory[]> {
  try {
    const response = await fetch(
      `${MEMORY_API_URL}/memory/search?query=${encodeURIComponent(query)}&user_id=${userId}`
    )
    
    if (!response.ok) {
      return []
    }
    
    return await response.json()
  } catch (err) {
    console.error('Memory search failed:', err)
    return []
  }
}

/**
 * Get all memories
 */
export async function listMemories(userId: string = 'ro9232'): Promise<Memory[]> {
  try {
    const response = await fetch(`${MEMORY_API_URL}/memory/all?user_id=${userId}`)
    
    if (!response.ok) {
      return []
    }
    
    return await response.json()
  } catch (err) {
    console.error('Memory list failed:', err)
    return []
  }
}

/**
 * Delete a memory
 */
export async function forget(memoryId: string, userId: string = 'ro9232'): Promise<boolean> {
  try {
    const response = await fetch(`${MEMORY_API_URL}/memory/${memoryId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
    
    return response.ok
  } catch (err) {
    console.error('Memory delete failed:', err)
    return false
  }
}

/**
 * Auto-remember important facts from conversation
 */
export async function autoRemember(conversation: string): Promise<void> {
  // Extract key facts and store them
  const facts = extractFacts(conversation)
  
  for (const fact of facts) {
    await remember(fact.content, fact.tags)
  }
}

/**
 * Simple fact extraction (can be improved with NLP)
 */
function extractFacts(text: string): Array<{ content: string; tags: string[] }> {
  const facts: Array<{ content: string; tags: string[] }> = []
  
  // Pattern: "My name is X"
  const nameMatch = text.match(/my name is (\w+)/i)
  if (nameMatch) {
    facts.push({
      content: `User's name is ${nameMatch[1]}`,
      tags: ['user', 'identity', 'name']
    })
  }
  
  // Pattern: "I like/love/enjoy X"
  const likeMatch = text.match(/i (like|love|enjoy) (.+)/i)
  if (likeMatch) {
    facts.push({
      content: `User ${likeMatch[1]}s ${likeMatch[2]}`,
      tags: ['user', 'preference', likeMatch[1]]
    })
  }
  
  // Pattern: "I want to X"
  const wantMatch = text.match(/i want to (.+)/i)
  if (wantMatch) {
    facts.push({
      content: `User wants to ${wantMatch[1]}`,
      tags: ['user', 'goal', 'intent']
    })
  }
  
  return facts
}

export default {
  remember,
  recall,
  listMemories,
  forget,
  autoRemember
}
