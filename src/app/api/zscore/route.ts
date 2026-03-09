import { NextRequest, NextResponse } from 'next/server'

interface ZScoreData {
  ticker: string
  currentPrice: number
  zScore: number
  mean: number
  stdDev: number
  lookback: number
  signal: 'LONG' | 'SHORT' | 'NEUTRAL'
  entryThreshold: number
  exitThreshold: number
  position: 'FLAT' | 'LONG' | 'SHORT'
  timestamp: string
}

// Simulated historical data for z-score calculation
const generateHistoricalData = (ticker: string, basePrice: number): number[] => {
  const prices: number[] = []
  let currentPrice = basePrice
  
  for (let i = 0; i < 20; i++) {
    // Random walk with mean reversion tendency
    const change = (Math.random() - 0.5) * basePrice * 0.02
    currentPrice += change
    prices.push(currentPrice)
  }
  
  return prices
}

const calculateZScore = (prices: number[]): { zScore: number; mean: number; stdDev: number } => {
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length
  const stdDev = Math.sqrt(variance)
  const currentPrice = prices[prices.length - 1]
  const zScore = stdDev > 0 ? (currentPrice - mean) / stdDev : 0
  
  return { zScore, mean, stdDev }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticker = searchParams.get('ticker') || 'SPY'
    
    // Base prices for simulation
    const basePrices: Record<string, number> = {
      SPY: 598.42,
      QQQ: 512.18,
      IWM: 225.30,
      NVDA: 138.25,
      TSLA: 248.50,
      AAPL: 245.80,
      MSFT: 425.60,
      META: 595.20,
      AMD: 165.40,
      AMZN: 198.50,
      GOOGL: 185.30,
      NFLX: 875.40
    }
    
    const basePrice = basePrices[ticker] || 100
    const historicalPrices = generateHistoricalData(ticker, basePrice)
    const { zScore, mean, stdDev } = calculateZScore(historicalPrices)
    const currentPrice = historicalPrices[historicalPrices.length - 1]
    
    // Determine signal
    const entryThreshold = 2.0
    const exitThreshold = 0.5
    
    let signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL'
    let position: 'FLAT' | 'LONG' | 'SHORT' = 'FLAT'
    
    if (zScore <= -entryThreshold) {
      signal = 'LONG'
      position = 'FLAT' // Would trigger entry
    } else if (zScore >= entryThreshold) {
      signal = 'SHORT'
      position = 'FLAT' // Would trigger entry
    } else if (Math.abs(zScore) < exitThreshold) {
      signal = 'NEUTRAL'
      position = 'FLAT'
    }
    
    const data: ZScoreData = {
      ticker,
      currentPrice: Number(currentPrice.toFixed(2)),
      zScore: Number(zScore.toFixed(2)),
      mean: Number(mean.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      lookback: 20,
      signal,
      entryThreshold,
      exitThreshold,
      position,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
    
  } catch (error) {
    console.error('Error calculating z-score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate z-score' },
      { status: 500 }
    )
  }
}
