import { NextRequest, NextResponse } from 'next/server'

/**
 * Discord webhook for trading alerts
 * POST /api/webhook/alerts
 * Body: { type: 'SIGNAL' | 'TRADE' | 'ERROR', message: string, data?: any }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, message, data } = body
    
    // Discord webhook URL from environment
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
    
    if (!DISCORD_WEBHOOK_URL) {
      console.warn('Discord webhook URL not configured')
      return NextResponse.json({ 
        success: false, 
        error: 'Discord webhook not configured' 
      }, { status: 200 }) // Return 200 so caller doesn't fail
    }
    
    // Format embed based on alert type
    const embed = formatDiscordEmbed(type, message, data)
    
    // Send to Discord
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed]
      })
    })
    
    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Discord webhook error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send alert' 
    }, { status: 500 })
  }
}

function formatDiscordEmbed(type: string, message: string, data?: any) {
  const colors = {
    SIGNAL: 0x00FF00,    // Green
    TRADE: 0x0099FF,     // Blue
    ERROR: 0xFF0000,     // Red
    INFO: 0xFFFF00       // Yellow
  }
  
  const titles = {
    SIGNAL: '🚀 Trading Signal',
    TRADE: '💰 Trade Executed',
    ERROR: '⚠️ System Alert',
    INFO: 'ℹ️ System Update'
  }
  
  const embed: any = {
    title: titles[type as keyof typeof titles] || 'Alert',
    description: message,
    color: colors[type as keyof typeof colors] || colors.INFO,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'GEX Terminal Trading System'
    }
  }
  
  // Add fields if data provided
  if (data) {
    embed.fields = []
    
    if (data.ticker) {
      embed.fields.push({
        name: 'Ticker',
        value: data.ticker,
        inline: true
      })
    }
    
    if (data.signal) {
      embed.fields.push({
        name: 'Signal',
        value: data.signal,
        inline: true
      })
    }
    
    if (data.price) {
      embed.fields.push({
        name: 'Price',
        value: `$${data.price}`,
        inline: true
      })
    }
    
    if (data.confidence) {
      embed.fields.push({
        name: 'Confidence',
        value: `${(data.confidence * 100).toFixed(0)}%`,
        inline: true
      })
    }
    
    if (data.pnl) {
      const pnlEmoji = data.pnl >= 0 ? '✅' : '❌'
      embed.fields.push({
        name: 'P&L',
        value: `${pnlEmoji} $${data.pnl.toFixed(2)}`,
        inline: true
      })
    }
    
    if (data.strategy) {
      embed.fields.push({
        name: 'Strategy',
        value: data.strategy,
        inline: false
      })
    }
  }
  
  return embed
}