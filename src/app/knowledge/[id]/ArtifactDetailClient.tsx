'use client'

import Link from 'next/link'
import { Brain, ArrowLeft } from 'lucide-react'
import ArtifactDetail from '@/components/knowledge/ArtifactDetail'

interface ArtifactDetailClientProps {
  artifactId: string;
}

export default function ArtifactDetailClient({ artifactId }: ArtifactDetailClientProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
                Mission Control
              </Link>
              <span className="text-zinc-600">/</span>
              <Link href="/knowledge" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                <Brain size={18} />
                <span>Knowledge</span>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/activity" className="text-sm text-zinc-400 hover:text-white transition-colors">Activity</Link>
              <Link href="/agents" className="text-sm text-zinc-400 hover:text-white transition-colors">Agents</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <ArtifactDetail artifactId={artifactId} />
      </main>
    </div>
  )
}
