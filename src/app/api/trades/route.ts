import { NextRequest, NextResponse } from 'next/server'

// Mock trades data - will be replaced with real DB queries
const MOCK_TRADES = [
  {
    id: 't1',
    ticker: 'SPY',
    entry_price: 595.00,
    exit_price: 602.50,
    position_type: 'LONG',
    quantity: 100,
    pnl: 750.00,
    status: 'CLOSED',
    entry_time: new Date(Date.now() - 86400000).toISOString(),
    exit_time: new Date(Date.now() - 43200000).toISOString(),
    signal_id: '1',
    strategy: 'momentum_breakout'
  },
  {
    id: 't2',
    ticker: 'QQQ',
    entry_price: 510.00,
    exit_price: 508.50,
    position_type: 'SHORT',
    quantity: 50,
    pnl: 75.00,
    status: 'CLOSED',
    entry_time: new Date(Date.now() - 172800000).toISOString(),
    exit_time: new Date(Date.now() - 129600000).toISOString(),
    signal_id: '2',
    strategy: 'mean_reversion'
  },
  {
    id: 't3',
    ticker: 'NVDA',
    entry_price: 135.00,
    exit_price: 142.00,
    position_type: 'LONG',
    quantity: 200,
    pnl: 1400.00,
    status: 'CLOSED',
    entry_time: new Date(Date.now() - 259200000).toISOString(),
    exit_time: new Date(Date.now() - 216000000).toISOString(),
    signal_id: '3',
    strategy: 'gamma_flip'
  },
  {
    id: 't4',
    ticker: 'TSLA',
    entry_price: 252.00,
    exit_price: 245.00,
    position_type: 'SHORT',
    quantity: 75,
    pnl: 525.00,
    status: 'CLOSED',
    entry_time: new Date(Date.now() - 345600000).toISOString(),
    exit_time: new Date(Date.now() - 302400000).toISOString(),
    signal_id: '4',
    strategy: 'max_pain_reversion'
  },
  {
    id: 't5',
    ticker: 'AAPL',
    entry_price: 183.00,
    exit_price: 187.50,
    position_type: 'LONG',
    quantity: 150,
    pnl: 675.00,
    status: 'CLOSED',
    entry_time: new Date(Date.now() - 432000000).toISOString(),
    exit_time: new Date(Date.now() - 388800000).toISOString(),
    signal_id: '5',
    strategy: 'momentum_20d'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'OPEN', 'CLOSED', or null for all
    const limit = parseInt(searchParams.get('limit') || '100')
    
    // Filter by status if provided
    let trades = status
      ? MOCK_TRADES.filter(t => t.status === status)
      : MOCK_TRADES
    
    // Sort by entry time (newest first) and limit
    trades = trades
      .sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime())
      .slice(0, limit)
    
    return NextResponse.json(trades)
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}
