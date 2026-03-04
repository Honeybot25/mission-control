'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  LayoutGrid, 
  List, 
  Sparkles,
  CheckSquare,
  Camera,
  Loader2
} from 'lucide-react'
import { 
  KnowledgeArtifact, 
  ArtifactFilter, 
  getArtifacts, 
  togglePinArtifact,
  deleteArtifact,
  subscribeToArtifacts,
  ArtifactType
} from '@/lib/knowledge'
import ArtifactCard from './ArtifactCard'
import KnowledgeFilters from './KnowledgeFilters'
import { cn } from '@/lib/utils'

interface KnowledgeFeedProps {
  initialView?: 'all' | 'insights' | 'todos' | 'snapshots';
  agentFilter?: string;
  runId?: string;
  onCreateArtifact?: () => void;
}

const viewConfigs: Record<string, { label: string; icon: typeof LayoutGrid; type?: ArtifactType }> = {
  all: { label: 'All', icon: LayoutGrid },
  insights: { label: 'Insights', icon: Sparkles, type: 'insight' },
  todos: { label: 'Todos', icon: CheckSquare, type: 'todo' },
  snapshots: { label: 'State Snapshots', icon: Camera, type: 'state_snapshot' },
}

export default function KnowledgeFeed({
  initialView = 'all',
  agentFilter,
  runId,
  onCreateArtifact
}: KnowledgeFeedProps) {
  const [artifacts, setArtifacts] = useState<KnowledgeArtifact[]>([])
  const [filteredArtifacts, setFilteredArtifacts] = useState<KnowledgeArtifact[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<typeof initialView>(initialView)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<ArtifactFilter>({
    agent: agentFilter,
    type: viewConfigs[initialView].type
  })

  // Fetch artifacts
  const fetchArtifacts = useCallback(async () => {
    setLoading(true)
    const data = await getArtifacts()
    setArtifacts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchArtifacts()
    
    // Subscribe to realtime updates
    const subscription = subscribeToArtifacts((newArtifact) => {
      setArtifacts(prev => {
        const exists = prev.find(a => a.id === newArtifact.id)
        if (exists) {
          return prev.map(a => a.id === newArtifact.id ? newArtifact : a)
        }
        return [newArtifact, ...prev]
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchArtifacts])

  // Apply filters
  useEffect(() => {
    let filtered = artifacts

    // Apply view filter
    if (view !== 'all') {
      filtered = filtered.filter(a => a.type === viewConfigs[view].type)
    }

    // Apply other filters
    if (filters.agent) {
      filtered = filtered.filter(a => a.agent === filters.agent)
    }

    if (filters.type && view === 'all') {
      filtered = filtered.filter(a => a.type === filters.type)
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(a => 
        filters.tags!.some(tag => a.tags?.includes(tag))
      )
    }

    if (filters.created_by) {
      filtered = filtered.filter(a => a.created_by === filters.created_by)
    }

    if (filters.isPinned !== undefined) {
      filtered = filtered.filter(a => a.is_pinned === filters.isPinned)
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Sort: pinned first, then by date
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredArtifacts(filtered)
  }, [artifacts, filters, view])

  // Handle view change
  const handleViewChange = (newView: typeof view) => {
    setView(newView)
    setFilters(prev => ({
      ...prev,
      type: viewConfigs[newView].type
    }))
  }

  // Handle pin toggle
  const handlePinToggle = async (id: string, pinned: boolean) => {
    const result = await togglePinArtifact(id, pinned)
    if (result.success) {
      setArtifacts(prev => 
        prev.map(a => a.id === id ? { ...a, is_pinned: pinned } : a)
      )
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    const result = await deleteArtifact(id)
    if (result.success) {
      setArtifacts(prev => prev.filter(a => a.id !== id))
    }
  }

  // Stats
  const stats = {
    total: artifacts.length,
    pinned: artifacts.filter(a => a.is_pinned).length,
    byType: {
      insight: artifacts.filter(a => a.type === 'insight').length,
      todo: artifacts.filter(a => a.type === 'todo').length,
      state_snapshot: artifacts.filter(a => a.type === 'state_snapshot').length,
    }
  }

  return (
    <div className="space-y-6">
      {/* View Tabs & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {(Object.keys(viewConfigs) as Array<keyof typeof viewConfigs>).map((viewKey) => {
            const config = viewConfigs[viewKey]
            const Icon = config.icon
            const isActive = view === viewKey
            
            return (
              <button
                key={viewKey}
                onClick={() => handleViewChange(viewKey as typeof view)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{config.label}</span>
                {viewKey !== 'all' && stats.byType[viewKey as keyof typeof stats.byType] > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-full text-xs">
                    {stats.byType[viewKey as keyof typeof stats.byType]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Layout Toggle */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setLayout('grid')}
              className={cn(
                "p-2 rounded-md transition-colors",
                layout === 'grid' ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={cn(
                "p-2 rounded-md transition-colors",
                layout === 'list' ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
              )}
            >
              <List size={16} />
            </button>
          </div>

          {/* Create Button */}
          {onCreateArtifact && (
            <button
              onClick={onCreateArtifact}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              New Artifact
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <KnowledgeFilters 
        filters={filters} 
        onFilterChange={setFilters}
      />

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          Showing {filteredArtifacts.length} of {stats.total} artifacts
          {stats.pinned > 0 && (
            <span className="ml-2 text-amber-400">
              ({stats.pinned} pinned)
            </span>
          )}
        </span>
      </div>

      {/* Artifacts Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : filteredArtifacts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Sparkles size={24} className="text-zinc-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No artifacts found
          </h3>
          <p className="text-zinc-500 max-w-md mx-auto">
            {filters.searchQuery || filters.agent || filters.tags?.length
              ? "Try adjusting your filters to see more results."
              : "Start capturing knowledge by creating your first artifact."}
          </p>
          {onCreateArtifact && (
            <button
              onClick={onCreateArtifact}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Create Artifact
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className={cn(
            layout === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredArtifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onPinToggle={handlePinToggle}
                onDelete={handleDelete}
                compact={layout === 'list'}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
