'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Target,
  AlertTriangle,
  BarChart3,
  Zap,
  Clock,
  RefreshCw,
  DollarSign,
  Percent,
  Award,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react'

interface GEXLevel {
  strike: number
  callGEX: number
  putGEX: number
  netGEX: number
  isMaxPain: boolean
  isZeroGamma: boolean
}

interface GEXData {
  ticker: string
  spotPrice: number
  levels: GEXLevel[]
  maxPainStrike: number
  zeroGammaStrike: number | null
  totalCallGEX: number
  totalPutGEX: number
  netGEX: number
  timestamp: string
}

interface PerformanceMetrics {
  totalPnL: number
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  sharpeRatio: number
  maxDrawdown: number
}

interface Signal {
  id: string
  ticker: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  price: number
  timestamp: string
  strategy: string
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || false // Use real API routes by default

const MOCK_GEX_DATA: Record<string, GEXData> = {
  SPY: {
    ticker: 'SPY',
    spotPrice: 598.42,
    levels: [
      { strike: 590, callGEX: 450, putGEX: 1200, netGEX: -750, isMaxPain: false, isZeroGamma: false },
      { strike: 595, callGEX: 800, putGEX: 950, netGEX: -150, isMaxPain: false, isZeroGamma: false },
      { strike: 598, callGEX: 1200, putGEX: 800, netGEX: 400, isMaxPain: false, isZeroGamma: true },
      { strike: 600, callGEX: 1500, putGEX: 600, netGEX: 900, isMaxPain: true, isZeroGamma: false },
      { strike: 605, callGEX: 900, putGEX: 400, netGEX: 500, isMaxPain: false, isZeroGamma: false },
      { strike: 610, callGEX: 600, putGEX: 200, netGEX: 400, isMaxPain: false, isZeroGamma: false },
    ],
    maxPainStrike: 600,
    zeroGammaStrike: 598,
    totalCallGEX: 5450,
    totalPutGEX: 4150,
    netGEX: 1300,
    timestamp: new Date().toISOString()
  },
  QQQ: {
    ticker: 'QQQ',
    spotPrice: 512.18,
    levels: [
      { strike: 505, callGEX: 320, putGEX: 890, netGEX: -570, isMaxPain: false, isZeroGamma: false },
      { strike: 510, callGEX: 670, putGEX: 720, netGEX: -50, isMaxPain: false, isZeroGamma: true },
      { strike: 512, callGEX: 980, putGEX: 540, netGEX: 440, isMaxPain: true, isZeroGamma: false },
      { strike: 515, callGEX: 750, putGEX: 380, netGEX: 370, isMaxPain: false, isZeroGamma: false },
      { strike: 520, callGEX: 430, putGEX: 210, netGEX: 220, isMaxPain: false, isZeroGamma: false },
    ],
    maxPainStrike: 512,
    zeroGammaStrike: 510,
    totalCallGEX: 3150,
    totalPutGEX: 2740,
    netGEX: 410,
    timestamp: new Date().toISOString()
  },
  NVDA: {
    ticker: 'NVDA',
    spotPrice: 138.25,
    levels: [
      { strike: 130, callGEX: 520, putGEX: 1100, netGEX: -580, isMaxPain: false, isZeroGamma: false },
      { strike: 135, callGEX: 890, putGEX: 820, netGEX: 70, isMaxPain: false, isZeroGamma: true },
      { strike: 138, callGEX: 1200, putGEX: 600, netGEX: 600, isMaxPain: true, isZeroGamma: false },
      { strike: 140, callGEX: 950, putGEX: 450, netGEX: 500, isMaxPain: false, isZeroGamma: false },
      { strike: 145, callGEX: 680, putGEX: 280, netGEX: 400, isMaxPain: false, isZeroGamma: false },
    ],
    maxPainStrike: 138,
    zeroGammaStrike: 135,
    totalCallGEX: 4240,
    totalPutGEX: 3250,
    netGEX: 990,
    timestamp: new Date().toISOString()
  },
  TSLA: {
    ticker: 'TSLA',
    spotPrice: 248.50,
    levels: [
      { strike: 240, callGEX: 480, putGEX: 950, netGEX: -470, isMaxPain: false, isZeroGamma: false },
      { strike: 245, callGEX: 750, putGEX: 680, netGEX: 70, isMaxPain: false, isZeroGamma: true },
      { strike: 248, callGEX: 1100, putGEX: 520, netGEX: 580, isMaxPain: true, isZeroGamma: false },
      { strike: 250, callGEX: 920, putGEX: 380, netGEX: 540, isMaxPain: false, isZeroGamma: false },
      { strike: 255, callGEX: 650, putGEX: 220, netGEX: 430, isMaxPain: false, isZeroGamma: false },
    ],
    maxPainStrike: 248,
    zeroGammaStrike: 245,
    totalCallGEX: 3900,
    totalPutGEX: 2750,
    netGEX: 1150,
    timestamp: new Date().toISOString()
  }
}

const MOCK_PERFORMANCE: PerformanceMetrics = {
  totalPnL: 12580.50,
  winRate: 68.5,
  totalTrades: 127,
  winningTrades: 87,
  losingTrades: 40,
  sharpeRatio: 1.84,
  maxDrawdown: -8.2
}

const MOCK_SIGNALS: Signal[] = [
  { id: '1', ticker: 'SPY', signal: 'BUY', confidence: 0.85, price: 598.42, timestamp: new Date().toISOString(), strategy: 'momentum_breakout' },
  { id: '2', ticker: 'QQQ', signal: 'HOLD', confidence: 0.62, price: 512.18, timestamp: new Date(Date.now() - 300000).toISOString(), strategy: 'mean_reversion' },
  { id: '3', ticker: 'NVDA', signal: 'BUY', confidence: 0.78, price: 138.25, timestamp: new Date(Date.now() - 600000).toISOString(), strategy: 'gamma_flip' },
  { id: '4', ticker: 'TSLA', signal: 'SELL', confidence: 0.71, price: 248.50, timestamp: new Date(Date.now() - 900000).toISOString(), strategy: 'max_pain_reversion' },
]

const TICKERS = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AMD', 'AAPL', 'MSFT', 'META']

export default function GEXTerminal() {
  const [selectedTicker, setSelectedTicker] = useState('SPY')
  const [data, setData] = useState<GEXData | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    fetchAllData(selectedTicker)
  }, [selectedTicker])

  // Auto-refresh every 30 seconds when live
  useEffect(() => {
    if (!isLive) return
    
    const interval = setInterval(() => {
      fetchAllData(selectedTicker)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isLive, selectedTicker])

  const fetchAllData = async (ticker: string) => {
    setLoading(true)
    setError(null)
    
    try {
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockData = MOCK_GEX_DATA[ticker] || generateMockData(ticker)
        setData(mockData)
        setPerformance(MOCK_PERFORMANCE)
        setSignals(MOCK_SIGNALS.filter(s => s.ticker === ticker))
        setLastUpdated(new Date().toLocaleTimeString())
      } else {
        // Real API calls
        const [gexRes, perfRes, signalsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/gex?ticker=${ticker}`),
          fetch(`${API_BASE_URL}/performance`),
          fetch(`${API_BASE_URL}/signals?ticker=${ticker}&limit=10`)
        ])

        if (!gexRes.ok) throw new Error('Failed to fetch GEX data')
        if (!perfRes.ok) throw new Error('Failed to fetch performance')
        if (!signalsRes.ok) throw new Error('Failed to fetch signals')

        const [gexData, perfData, signalsData] = await Promise.all([
          gexRes.json(),
          perfRes.json(),
          signalsRes.json()
        ])

        setData(gexData)
        setPerformance(perfData)
        setSignals(signalsData)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (ticker: string): GEXData => {
    const basePrice = 100 + Math.random() * 400
    const levels: GEXLevel[] = []
    
    for (let i = -3; i <= 3; i++) {
      const strike = Math.round(basePrice + i * 5)
      levels.push({
        strike,
        callGEX: Math.round(300 + Math.random() * 1000),
        putGEX: Math.round(300 + Math.random() * 1000),
        netGEX: Math.round((Math.random() - 0.5) * 1000),
        isMaxPain: i === 0,
        isZeroGamma: i === -1
      })
    }

    return {
      ticker,
      spotPrice: basePrice,
      levels,
      maxPainStrike: Math.round(basePrice),
      zeroGammaStrike: Math.round(basePrice - 5),
      totalCallGEX: levels.reduce((sum, l) => sum + l.callGEX, 0),
      totalPutGEX: levels.reduce((sum, l) => sum + l.putGEX, 0),
      netGEX: levels.reduce((sum, l) => sum + l.netGEX, 0),
      timestamp: new Date().toISOString()
    }
  }

  const getSignal = (data: GEXData) => {
    const spot = data.spotPrice
    const maxPain = data.maxPainStrike
    const zeroGamma = data.zeroGammaStrike
    
    if (spot > maxPain + 2) return { text: 'Bearish Reversion', color: 'text-red-400', icon: TrendingDown, bg: 'bg-red-500/10' }
    if (spot < maxPain - 2) return { text: 'Bullish Reversion', color: 'text-green-400', icon: TrendingUp, bg: 'bg-green-500/10' }
    if (Math.abs(spot - maxPain) < 1) return { text: 'At Max Pain', color: 'text-yellow-400', icon: Target, bg: 'bg-yellow-500/10' }
    return { text: 'Neutral', color: 'text-zinc-400', icon: Activity, bg: 'bg-zinc-500/10' }
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'SELL': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    }
  }

  const currentData = data || MOCK_GEX_DATA['SPY']
  const signal = getSignal(currentData)
  const SignalIcon = signal.icon

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <Activity size={28} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 flex-wrap">
                GEX Terminal
                <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Gamma Exposure</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">AI-Powered</span>
              </h1>
              <p className="text-zinc-400 text-sm">Options market gamma positioning & dealer hedging levels</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Live Toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isLive ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {isLive ? <Wifi size={16} /> : <WifiOff size={16} />}
              <span className="text-sm">{isLive ? 'Live' : 'Static'}</span>
            </button>
            
            <div className="text-right">
              <p className="text-xs text-zinc-500">Last Updated</p>
              <p className="text-sm text-zinc-300">{lastUpdated || '--:--:--'}</p>
            </div>
            <button
              onClick={() => fetchAllData(selectedTicker)}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="text-red-400" size={20} />
              <div className="flex-1">
                <p className="text-red-400 font-medium">Error fetching data</p>
                <p className="text-red-400/70 text-sm">{error}</p>
              </div>
              <button
                onClick={() => fetchAllData(selectedTicker)}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticker Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
          {TICKERS.map(ticker => (
            <button
              key={ticker}
              onClick={() => setSelectedTicker(ticker)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap disabled:opacity-50 ${
                selectedTicker === ticker
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw size={32} className="animate-spin text-red-400" />
              <p className="text-zinc-400">Loading market data...</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {data && (
          <>
            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4"
              >
                <p className="text-xs text-zinc-500 mb-1">Spot Price</p>
                <p className="text-xl md:text-2xl font-bold">${currentData.spotPrice.toFixed(2)}</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4"
              >
                <p className="text-xs text-zinc-500 mb-1">Max Pain</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-400">${currentData.maxPainStrike}</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4"
              >
                <p className="text-xs text-zinc-500 mb-1">Zero Gamma</p>
                <p className="text-xl md:text-2xl font-bold text-blue-400">
                  {currentData.zeroGammaStrike ? `$${currentData.zeroGammaStrike}` : 'N/A'}
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`border rounded-xl p-4 ${signal.bg} border-white/10`}
              >
                <p className="text-xs text-zinc-500 mb-1">AI Signal</p>
                <div className={`flex items-center gap-2 ${signal.color}`}>
                  <SignalIcon size={20} />
                  <span className="font-bold text-sm md:text-base">{signal.text}</span>
                </div>
              </motion.div>
            </div>

            {/* Performance Metrics (New) */}
            {performance && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Award className="text-yellow-400" size={20} />
                  <h2 className="text-lg font-bold">Performance Metrics</h2>
                  <span className="text-xs text-zinc-500">(Paper Trading)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-green-400" />
                      <p className="text-xs text-zinc-500">Total P&L</p>
                    </div>
                    <p className={`text-xl font-bold ${performance.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {performance.totalPnL >= 0 ? '+' : ''}${performance.totalPnL.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent size={16} className="text-blue-400" />
                      <p className="text-xs text-zinc-500">Win Rate</p>
                    </div>
                    <p className="text-xl font-bold text-blue-400">{performance.winRate}%</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 size={16} className="text-purple-400" />
                      <p className="text-xs text-zinc-500">Total Trades</p>
                    </div>
                    <p className="text-xl font-bold">{performance.totalTrades}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-green-400" />
                      <p className="text-xs text-zinc-500">Winners</p>
                    </div>
                    <p className="text-xl font-bold text-green-400">{performance.winningTrades}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-yellow-400" />
                      <p className="text-xs text-zinc-500">Sharpe Ratio</p>
                    </div>
                    <p className="text-xl font-bold text-yellow-400">{performance.sharpeRatio}</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown size={16} className="text-red-400" />
                      <p className="text-xs text-zinc-500">Max Drawdown</p>
                    </div>
                    <p className="text-xl font-bold text-red-400">{performance.maxDrawdown}%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recent Signals (New) */}
            {signals.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="text-blue-400" size={20} />
                  <h2 className="text-lg font-bold">Recent AI Signals</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Time</th>
                          <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Ticker</th>
                          <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Signal</th>
                          <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Price</th>
                          <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Confidence</th>
                          <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Strategy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signals.map((sig, idx) => (
                          <tr key={sig.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-sm text-zinc-400">
                              {new Date(sig.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">{sig.ticker}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getSignalColor(sig.signal)}`}>
                                {sig.signal}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">${sig.price.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-400 rounded-full"
                                    style={{ width: `${sig.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-zinc-400">{(sig.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-400">{sig.strategy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="text-zinc-500" size={20} />
                  <h2 className="text-lg font-bold text-zinc-400">Recent AI Signals</h2>
                </div>
                <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-8 text-center">
                  <p className="text-zinc-500 text-lg">NO ACTIVE SIGNALS</p>
                  <p className="text-zinc-600 text-sm mt-2">Check back soon for new trading opportunities</p>
                </div>
              </motion.div>
            )}

            {/* GEX Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 md:p-6 mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-zinc-400" />
                  Gamma Exposure by Strike
                </h3>
                <div className="flex gap-4 text-xs flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span className="text-zinc-400">Call GEX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-zinc-400">Put GEX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-400" />
                    <span className="text-zinc-400">Max Pain</span>
                  </div>
                </div>
              </div>

              {/* Chart Bars */}
              <div className="space-y-3">
                {currentData.levels.map((level) => (
                  <div key={level.strike} className="relative">
                    <div className="flex items-center gap-2 md:gap-4">
                      <span className="w-10 md:w-12 text-xs md:text-sm font-mono text-zinc-400">${level.strike}</span>
                      <div className="flex-1 h-6 md:h-8 bg-zinc-800 rounded-lg overflow-hidden relative">
                        {/* Call GEX (green, left side) */}
                        <div 
                          className="absolute left-1/2 top-0 bottom-0 bg-green-500/60"
                          style={{ 
                            width: `${Math.min((level.callGEX / 2000) * 50, 50)}%`,
                          }}
                        />
                        {/* Put GEX (red, right side) */}
                        <div 
                          className="absolute right-1/2 top-0 bottom-0 bg-red-500/60"
                          style={{ 
                            width: `${Math.min((level.putGEX / 2000) * 50, 50)}%`,
                          }}
                        />
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20" />
                        {/* Spot price indicator */}
                        {Math.abs(level.strike - currentData.spotPrice) < 1 && (
                          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-blue-400 -translate-x-1/2">
                            <span className="absolute -top-4 md:-top-5 left-1/2 -translate-x-1/2 text-xs text-blue-400 whitespace-nowrap">SPOT</span>
                          </div>
                        )}
                        {/* Max Pain indicator */}
                        {level.isMaxPain && (
                          <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg" />
                        )}
                      </div>
                      <span className={`w-12 md:w-16 text-xs text-right font-mono ${
                        level.netGEX > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {level.netGEX > 0 ? '+' : ''}{level.netGEX}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 md:p-6"
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-yellow-400" />
                  Key Levels
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span className="text-zinc-300 text-sm">Max Pain (Pinning)</span>
                    <span className="font-bold text-yellow-400">${currentData.maxPainStrike}</span>
                  </div>
                  {currentData.zeroGammaStrike && (
                    <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <span className="text-zinc-300 text-sm">Zero Gamma (Flip)</span>
                      <span className="font-bold text-blue-400">${currentData.zeroGammaStrike}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="text-zinc-300 text-sm">Call Wall (Resistance)</span>
                    <span className="font-bold text-green-400">
                      ${Math.max(...currentData.levels.map(l => l.callGEX > 1000 ? l.strike : 0)) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <span className="text-zinc-300 text-sm">Put Wall (Support)</span>
                    <span className="font-bold text-red-400">
                      ${Math.max(...currentData.levels.map(l => l.putGEX > 800 ? l.strike : 0)) || 'N/A'}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 md:p-6"
              >
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-orange-400" />
                  Trading Implications
                </h3>
                <div className="space-y-3 text-sm text-zinc-300">
                  <p className="flex gap-2">
                    <span className="text-green-400">→</span>
                    <span>Price above Max Pain suggests dealers are short gamma, increasing volatility</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400">→</span>
                    <span>Zero Gamma level is where dealer hedging flips direction - key pivot</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400">→</span>
                    <span>High call GEX acts as resistance (dealers selling into rallies)</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="text-green-400">→</span>
                    <span>High put GEX acts as support (dealers buying dips)</span>
                  </p>
                  <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <p className="text-orange-400 font-medium mb-1">Current Setup</p>
                    <p className="text-zinc-400 text-sm">
                      Spot ${currentData.spotPrice.toFixed(2)} vs Max Pain ${currentData.maxPainStrike}. 
                      {currentData.spotPrice > currentData.maxPainStrike 
                        ? 'Market above max pain - watch for reversion or momentum continuation.'
                        : 'Market below max pain - potential for bounce toward pinning level.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
