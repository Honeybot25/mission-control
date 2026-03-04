import { NextRequest, NextResponse } from 'next/server'

// Signal interface matching TraderBot's format
interface Signal {
  timestamp: string
  ticker: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  price: number
  gex_level?: number
  strike?: number
  expiration?: string
  strategy: string
  metadata?: {
    sma_fast?: number
    sma_slow?: number
    volume_spike?: number
    gamma_exposure?: number
    put_call_ratio?: number
  }
}

// Mock signals for development - will be replaced with TraderBot data
const MOCK_SIGNALS: Signal[] = [
  {
    timestamp: new Date().toISOString(),
    ticker: 'SPY',
    signal: 'BUY',
    confidence: 0.85,
    price: 598.42,
    gex_level: 2500000,
    strike: 600,
    expiration: '2026-03-07',
    strategy: 'gamma_squeeze',
    metadata: {
      sma_fast: 595,
      sma_slow: 590,
      volume_spike: 1.3,
      gamma_exposure: 2500000,
      put_call_ratio: 0.8
    }
  },
  {
    timestamp: new Date(Date.now() - 300000).toISOString(),
    ticker: 'QQQ',
    signal: 'HOLD',
    confidence: 0.62,
    price: 512.18,
    gex_level: 1800000,
    strike: 510,
    expiration: '2026-03-07',
    strategy: 'mean_reversion',
    metadata: {
      sma_fast: 514,
      sma_slow: 508,
      rsi: 45,
      macd: 0.02
    }
  },
  {
    timestamp: new Date(Date.now() - 600000).toISOString(),
    ticker: 'NVDA',
    signal: 'BUY',
    confidence: 0.78,
    price: 138.25,
    gex_level: 1500000,
    strike: 140,
    expiration: '2026-03-14',
    strategy: 'momentum_breakout',
    metadata: {
      sma_fast: 136,
      sma_slow: 132,
      volume_spike: 1.5
    }
  }
]

/**
 * GET /api/signals
 * 
 * Query params:
 * - ticker: Filter by specific ticker (optional)
 * - limit: Number of signals to return (default: 50, max: 100)
 * - strategy: Filter by strategy type (optional)
 * 
 * Returns array of trading signals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker')?.toUpperCase()
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const strategy = searchParams.get('strategy')
    
    // TODO: Replace with actual database query when TraderBot backend is ready
    // For now, return mock data
    let signals = [...MOCK_SIGNALS]
    
    // Apply filters
    if (ticker) {
      signals = signals.filter(s => s.ticker === ticker)
    }
    
    if (strategy) {
      signals = signals.filter(s => s.strategy === strategy)
    }
    
    // Sort by timestamp (newest first) and limit
    signals = signals
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
    
    return NextResponse.json({
      signals,
      count: signals.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch signals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/signals
 * 
 * Body: Signal object
 * 
 * Used by TraderBot to push new signals to the system
 * (For future webhook integration)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['timestamp', 'ticker', 'signal', 'confidence', 'price', 'strategy']
    const missingFields = requiredFields.filter(field => !(field in body))
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate signal type
    if (!['BUY', 'SELL', 'HOLD'].includes(body.signal)) {
      return NextResponse.json(
        { error: 'Signal must be BUY, SELL, or HOLD' },
        { status: 400 }
      )
    }
    
    // TODO: Save to database when TraderBot backend is ready
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: 'Signal received',
      signal: body
    })
    
  } catch (error) {
    console.error('Error processing signal:', error)
    return NextResponse.json(
      { error: 'Failed to process signal' },
      { status: 500 }
    )
  }
}