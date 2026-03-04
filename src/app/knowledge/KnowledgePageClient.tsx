'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Brain,
  Plus,
  Sparkles,
  Search
} from 'lucide-react'
import KnowledgeFeed from '@/components/knowledge/KnowledgeFeed'
import CreateArtifactModal from '@/components/knowledge/CreateArtifactModal'
import { KnowledgeArtifact } from '@/lib/knowledge'

export default function KnowledgePageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleArtifactCreated = (artifact: KnowledgeArtifact) => {
    // Trigger refresh of the feed
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
                Mission Control
              </Link>
              <span className="text-zinc-600">/</span>
              <div className="flex items-center gap-2">
                <Brain className="text-indigo-400" size={20} />
                <span className="text-zinc-400">Knowledge</span>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/activity" className="text-sm text-zinc-400 hover:text-white transition-colors">Activity</Link>
              <Link href="/agents" className="text-sm text-zinc-400 hover:text-white transition-colors">Agents</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Brain size={24} />
                </div>
                <h1 className="text-3xl font-bold">Knowledge Base</h1>
              </div>
              <p className="text-zinc-400 max-w-2xl">
                Second brain for capturing agent insights, decisions, and knowledge. 
                Pin important artifacts for quick access.
              </p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              New Artifact
            </button>
          </div>
        </motion.div>

        {/* Quick Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Link href="/knowledge?view=insights">
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl hover:bg-amber-500/10 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Sparkles size={18} />
                </div>
                <span className="font-medium text-amber-400">Insights</span>
              </div>
              <p className="text-sm text-zinc-500">Key discoveries and realizations</p>
            </div>
          </Link>
          
          <Link href="/knowledge?view=todos">
            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <Plus size={18} />
                </div>
                <span className="font-medium text-rose-400">Todos</span>
              </div>
              <p className="text-sm text-zinc-500">Action items and tasks</p>
            </div>
          </Link>
          
          <Link href="/knowledge?view=snapshots">
            <div className="p-4 bg-pink-500/5 border border-pink-500/20 rounded-xl hover:bg-pink-500/10 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                  <Search size={18} />
                </div>
                <span className="font-medium text-pink-400">Snapshots</span>
              </div>
              <p className="text-sm text-zinc-500">State captures and records</p>
            </div>
          </Link>
          
          <div 
            onClick={() => setIsModalOpen(true)}
            className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Plus size={18} />
              </div>
              <span className="font-medium text-white">Create New</span>
            </div>
            <p className="text-sm text-zinc-500">Add a new artifact</p>
          </div>
        </motion.div>

        {/* Knowledge Feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          key={refreshTrigger}
        >
          <KnowledgeFeed 
            onCreateArtifact={() => setIsModalOpen(true)} 
          />
        </motion.div>
      </main>

      {/* Create Modal */}
      <CreateArtifactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleArtifactCreated}
      />
    </div>
  )
}
