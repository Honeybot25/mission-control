import { Metadata } from 'next'
import ActivityPageClient from './ActivityPageClient'

export const metadata: Metadata = {
  title: 'Activity | Mission Control',
  description: 'Full activity feed and logs from all agents',
}

async function getInitialLogs() {
  try {
    const res = await fetch('http://localhost:3000/api/logs', { cache: 'no-store' })
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
