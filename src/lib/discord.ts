/**
 * Discord webhook integration for trading alerts
 */

interface AlertData {
  ticker?: string
  signal?: 'BUY' | 'SELL' | 'HOLD'
  price?: number
  confidence?: number
  pnl?: number
  strategy?: string
}

/**
 * Send alert to Discord webhook
 */
export async function sendDiscordAlert(
  type: 'SIGNAL' | 'TRADE' | 'ERROR' | 'INFO',
  message: string,
  data?: AlertData
): Promise<boolean> {
  try {
    const response = await fetch('/api/webhook/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message, data })
    })
    
    if (!response.ok) {
      console.error('Failed to send Discord alert:', await response.text())
      return false
    }
    
    return true
  } catch (error) {
    console.error('Discord alert error:', error)
    return false
  }
}

/**
 * Send trading signal alert
 */
export async function alertSignal(
  ticker: string,
  signal: 'BUY' | 'SELL' | 'HOLD',
  price: number,
  confidence: number,
  strategy: string
): Promise<boolean> {
  const emoji = signal === 'BUY' ? '🟢' : signal === 'SELL' ? '🔴' : '🟡'
  const message = `${emoji} ${signal} signal generated for ${ticker} at $${price.toFixed(2)}`
  
  return sendDiscordAlert('SIGNAL', message, {
    ticker,
    signal,
    price,
    confidence,
    strategy
  })
}

/**
 * Send trade execution alert
 */
export async function alertTrade(
  ticker: string,
  signal: 'BUY' | 'SELL',
  price: number,
  pnl: number
): Promise<boolean> {
  const profitEmoji = pnl >= 0 ? '✅' : '❌'
  const message = `${profitEmoji} Trade executed: ${signal} ${ticker} at $${price.toFixed(2)}`
  
  return sendDiscordAlert('TRADE', message, {
    ticker,
    signal,
    price,
    pnl
  })
}

/**
 * Send error alert
 */
export async function alertError(error: string): Promise<boolean> {
  return sendDiscordAlert('ERROR', `⚠️ System Alert: ${error}`)
}

/**
 * Send daily summary
 */
export async function alertDailySummary(
  totalPnL: number,
  winRate: number,
  totalTrades: number
): Promise<boolean> {
  const emoji = totalPnL >= 0 ? '📈' : '📉'
  const message = `${emoji} Daily Trading Summary`
  
  return sendDiscordAlert('INFO', message, {
    pnl: totalPnL,
    confidence: winRate / 100
  })
}