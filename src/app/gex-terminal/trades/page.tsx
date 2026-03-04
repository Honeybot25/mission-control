'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Trade {
  id: string
  ticker: string
  entry_price: number
  exit_price: number
  position_type: 'LONG' | 'SHORT'
  quantity: number
  pnl: number
  status: 'OPEN' | 'CLOSED'
  entry_time: string
  exit_time?: string
  signal_id: string
  strategy: string
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL')

  useEffect(() => {
    fetchTrades()
  }, [filter])

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const url = filter === 'ALL' 
        ? '/api/trades'
        : `/api/trades?status=${filter}`
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch trades')
      
      const data = await res.json()
      setTrades(data)
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const winRate = trades.filter(t => t.pnl > 0).length / trades.filter(t => t.status === 'CLOSED').length * 100 || 0

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/gex-terminal"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Trade History</h1>
              <p className="text-zinc-400 text-sm">Paper trading performance log</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTrades}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Download size={16} />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Total Trades</p>
            <p className="text-2xl font-bold">{trades.length}</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString()}
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-blue-400">{winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-1">Open Trades</p>
            <p className="text-2xl font-bold text-yellow-400">
              {trades.filter(t => t.status === 'OPEN').length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['ALL', 'OPEN', 'CLOSED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Trades Table */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Ticker</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Entry</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Exit</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">P&L</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Strategy</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                      Loading trades...
                    </td>
                  </tr>
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  trades.map((trade, idx) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {new Date(trade.entry_time).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-medium">{trade.ticker}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          trade.position_type === 'LONG' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {trade.position_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">${trade.entry_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {trade.pnl !== undefined ? (
                          <span className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          trade.status === 'CLOSED'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{trade.strategy}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
