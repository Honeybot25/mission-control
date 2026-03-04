import { Metadata } from 'next'
import OptionsSignalsClient from './OptionsSignalsClient'

export const metadata: Metadata = {
  title: 'Options Signals | Mission Control',
  description: 'Options trading signals from TraderBot - real-time analysis and recommendations',
}

async function getInitialSignals() {
  try {
    // Try to fetch from the API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/options-signals?limit=50`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (!res.ok) {
      console.error('Failed to fetch initial signals:', await res.text())
      return []
    }
    
    const data = await res.json()
    return data.signals || []
  } catch (err) {
    console.error('Failed to fetch initial signals:', err)
    return []
  }
}

async function getInitialSymbols() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/options-signals?symbols=true`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (!res.ok) {
      return []
    }
    
    const data = await res.json()
    return data.symbols || []
  } catch (err) {
    return []
  }
}

async function getInitialStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/options-signals?stats=true`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (!res.ok) {
      return null
    }
    
    const data = await res.json()
    return data.stats
  } catch (err) {
    return null
  }
}

export default async function OptionsSignalsPage() {
  const [initialSignals, symbols, stats] = await Promise.all([
    getInitialSignals(),
    getInitialSymbols(),
    getInitialStats(),
  ])

  return (
    <OptionsSignalsClient 
      initialSignals={initialSignals}
      initialSymbols={symbols}
      initialStats={stats}
    />
  )
}
