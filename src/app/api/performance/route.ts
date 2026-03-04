import { NextRequest, NextResponse } from 'next/server'

// Mock performance data - will be replaced with real calculations from DB
const MOCK_PERFORMANCE = {
  totalPnL: 12580.50,
  winRate: 68.5,
  totalTrades: 127,
  winningTrades: 87,
  losingTrades: 40,
  sharpeRatio: 1.84,
  maxDrawdown: -8.2,
  avgReturn: 2.3,
  currentEquity: 112580.50,
  startingEquity: 100000.00,
  dailyMetrics: [
    { date: '2026-02-25', pnl: 450.00, trades: 3 },
    { date: '2026-02-26', pnl: -120.50, trades: 2 },
    { date: '2026-02-27', pnl: 890.00, trades: 5 },
    { date: '2026-02-28', pnl: 320.00, trades: 2 },
    { date: '2026-03-01', pnl: 550.00, trades: 4 },
    { date: '2026-03-02', pnl: 1250.00, trades: 6 }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // In real implementation, this would query the database
    // and calculate metrics from actual trade data
    
    return NextResponse.json({
      ...MOCK_PERFORMANCE,
      period: `${days}d`,
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}
