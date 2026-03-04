'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  X,
  Calendar,
  User,
  Tag,
  Bot,
  Lightbulb,
  CheckSquare,
  FileText,
  GitBranch,
  FlaskConical,
  Map,
  Camera,
  StickyNote,
  Pin
} from 'lucide-react'
import { ArtifactFilter, ArtifactType, artifactTypeConfig, getAllTags, getAllAgents } from '@/lib/knowledge'
import { cn } from '@/lib/utils'

interface KnowledgeFiltersProps {
  filters: ArtifactFilter;
  onFilterChange: (filters: ArtifactFilter) => void;
  availableAgents?: string[];
}

const typeIcons: Record<ArtifactType, React.ReactNode> = {
  note: <StickyNote size={14} />,
  insight: <Lightbulb size={14} />,
  decision: <GitBranch size={14} />,
  summary: <FileText size={14} />,
  todo: <CheckSquare size={14} />,
  hypothesis: <FlaskConical size={14} />,
  plan: <Map size={14} />,
  state_snapshot: <Camera size={14} />,
}

const timeRanges = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
] as const

export default function KnowledgeFilters({ 
  filters, 
  onFilterChange,
  availableAgents = []
}: KnowledgeFiltersProps) {
  const [allTags, setAllTags] = useState<string[]>([])
  const [agents, setAgents] = useState<string[]>(availableAgents)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '')

  useEffect(() => {
    // Load tags and agents on mount
    getAllTags().then(setAllTags)
    if (availableAgents.length === 0) {
      getAllAgents().then(setAgents)
    }
  }, [availableAgents])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange({ ...filters, searchQuery: searchInput })
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const handleTypeToggle = (type: ArtifactType) => {
    onFilterChange({
      ...filters,
      type: filters.type === type ? undefined : type
    })
  }

  const handleAgentToggle = (agent: string) => {
    onFilterChange({
      ...filters,
      agent: filters.agent === agent ? undefined : agent
    })
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    
    onFilterChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    })
  }

  const handleTimeRangeChange = (range: typeof timeRanges[number]['id']) => {
    onFilterChange({
      ...filters,
      timeRange: range as ArtifactFilter['timeRange']
    })
  }

  const handlePinToggle = () => {
    onFilterChange({
      ...filters,
      isPinned: filters.isPinned === true ? undefined : true
    })
  }

  const clearFilters = () => {
    setSearchInput('')
    onFilterChange({})
  }

  const hasActiveFilters = 
    filters.type || 
    filters.agent || 
    (filters.tags && filters.tags.length > 0) ||
    filters.timeRange !== 'all' && filters.timeRange !== undefined ||
    filters.isPinned ||
    filters.searchQuery

  const artifactTypes: ArtifactType[] = [
    'note', 'insight', 'decision', 'summary', 
    'todo', 'hypothesis', 'plan', 'state_snapshot'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Search and Clear */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search artifacts, content, tags..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 text-sm"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <Filter size={14} className="text-zinc-500 ml-2" />
          {artifactTypes.map((type) => {
            const config = artifactTypeConfig[type]
            const isActive = filters.type === type
            
            return (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all",
                  isActive
                    ? `${config.bgColor} ${config.color}`
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
                title={config.description}
              >
                {typeIcons[type]}
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            )
          })}
        </div>

        {/* Agent Filter */}
        {agents.length > 0 && (
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <Bot size={14} className="text-zinc-500 ml-2" />
            <select
              value={filters.agent || ''}
              onChange={(e) => handleAgentToggle(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900">All Agents</option>
              {agents.map(agent => (
                <option key={agent} value={agent} className="bg-zinc-900">{agent}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border",
                (filters.tags && filters.tags.length > 0)
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
              )}
            >
              <Tag size={14} />
              Tags
              {(filters.tags && filters.tags.length > 0) && (
                <span className="ml-1 px-1.5 py-0.5 bg-indigo-500/30 rounded-full text-xs">
                  {filters.tags.length}
                </span>
              )}
            </button>

            {showTagDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-2 w-48 max-h-64 overflow-y-auto bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 p-2"
              >
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors text-left",
                      filters.tags?.includes(tag)
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className={cn(
                      "w-3 h-3 rounded-sm border flex items-center justify-center",
                      filters.tags?.includes(tag) ? "bg-indigo-500 border-indigo-500" : "border-zinc-600"
                    )}>
                      {filters.tags?.includes(tag) && <CheckSquare size={10} className="text-white" />}
                    </span>
                    #{tag}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Time Range Filter */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <Calendar size={14} className="text-zinc-500 ml-2" />
          {timeRanges.map(range => (
            <button
              key={range.id}
              onClick={() => handleTimeRangeChange(range.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs transition-colors",
                filters.timeRange === range.id || (range.id === 'all' && !filters.timeRange)
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Pin Filter */}
        <button
          onClick={handlePinToggle}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border",
            filters.isPinned
              ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
          )}
        >
          <Pin size={14} className={filters.isPinned ? "fill-current" : ""} />
          Pinned
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5"
        >
          <span className="text-xs text-zinc-500">Active filters:</span>
          
          {filters.type && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-zinc-300">
              {artifactTypeConfig[filters.type].label}
              <button onClick={() => handleTypeToggle(filters.type!)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          )}
          
          {filters.agent && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-xs text-zinc-300">
              <Bot size={12} />
              {filters.agent}
              <button onClick={() => handleAgentToggle(filters.agent!)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          )}
          
          {filters.tags?.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 text-xs text-indigo-400">
              #{tag}
              <button onClick={() => handleTagToggle(tag)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
          
          {filters.isPinned && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-xs text-amber-400">
              <Pin size={12} className="fill-current" />
              Pinned only
              <button onClick={handlePinToggle} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
