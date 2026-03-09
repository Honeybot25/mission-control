import { Metadata } from 'next'
import { headers } from 'next/headers'
import ActivityPageClient from './ActivityPageClient'

export const metadata: Metadata = {
  title: 'Activity | Mission Control',
  description: 'Full activity feed and logs from all agents',
}

async function getInitialLogs() {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
    const proto = h.get('x-forwarded-proto') || 'https'
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`

    const res = await fetch(`${origin}/api/logs`, { cache: 'no-store' })
    const data = await res.json()
    return data.logs || []
  } catch (err) {
    console.error('Failed to fetch initial logs:', err)
    return []
  }
}

export default async function ActivityPage() {
  const initialLogs = await getInitialLogs()
  return <ActivityPageClient initialLogs={initialLogs} />
}
