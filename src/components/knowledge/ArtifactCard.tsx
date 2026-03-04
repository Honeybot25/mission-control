'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Pin,
  Clock,
  Bot,
  ExternalLink,
  Lightbulb,
  CheckSquare,
  FileText,
  GitBranch,
  FlaskConical,
  Map,
  Camera,
  StickyNote,
  MoreHorizontal,
  Trash2,
  Edit3
} from 'lucide-react'
import { KnowledgeArtifact, artifactTypeConfig, ArtifactType } from '@/lib/knowledge'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ArtifactCardProps {
  artifact: KnowledgeArtifact;
  onPinToggle?: (id: string, pinned: boolean) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
  showActions?: boolean;
}

const typeIcons: Record<ArtifactType, React.ReactNode> = {
  note: <StickyNote size={18} />,
  insight: <Lightbulb size={18} />,
  decision: <GitBranch size={18} />,
  summary: <FileText size={18} />,
  todo: <CheckSquare size={18} />,
  hypothesis: <FlaskConical size={18} />,
  plan: <Map size={18} />,
  state_snapshot: <Camera size={18} />,
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function truncateContent(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength).trim() + '...'
}

export default function ArtifactCard({ 
  artifact, 
  onPinToggle,
  onDelete,
  compact = false,
  showActions = true
}: ArtifactCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const config = artifactTypeConfig[artifact.type]
  const TypeIcon = typeIcons[artifact.type]

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPinToggle?.(artifact.id, !artifact.is_pinned)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this artifact?')) {
      onDelete?.(artifact.id)
    }
    setShowMenu(false)
  }

  if (compact) {
    return (
      <Link href={`/knowledge/${artifact.id}`}>
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "group flex items-center gap-3 p-3 rounded-lg border transition-all",
            "bg-white/5 border-white/10 hover:border-white/20",
            artifact.is_pinned && "border-amber-500/30 bg-amber-500/5"
          )}
        >
          <div className={cn("p-2 rounded-lg", config.bgColor, config.color)}>
            {TypeIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white text-sm truncate">{artifact.title}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className={config.color}>{config.label}</span>
              <span>•</span>
              <span>{formatTimeAgo(artifact.created_at)}</span>
              {artifact.agent && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Bot size={10} />
                    {artifact.agent}
                  </span>
                </>
              )}
            </div>
          </div>

          {artifact.is_pinned && (
            <Pin size={14} className="text-amber-400 fill-current flex-shrink-0" />
          )}
        </motion.div>
      </Link>
    )
  }

  return (
    <Link href={`/knowledge/${artifact.id}`}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group relative bg-white/5 border rounded-xl p-5 transition-all hover:bg-white/[0.07]",
          artifact.is_pinned 
            ? "border-amber-500/30 hover:border-amber-500/50" 
            : "border-white/10 hover:border-white/20"
        )}
      >
        {/* Pin indicator */}
        {artifact.is_pinned && (
          <div className="absolute top-4 right-4">
            <Pin size={16} className="text-amber-400 fill-current" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor, config.color)}>
            {TypeIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
              </span>
              {artifact.agent && (
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Bot size={10} />
                  {artifact.agent}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2">
              {artifact.title}
            </h3>
          </div>
        </div>

        {/* Content Preview */}
        <p className="text-zinc-400 text-sm mb-4 line-clamp-3 leading-relaxed">
          {truncateContent(artifact.content)}
        </p>

        {/* Tags */}
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {artifact.tags.slice(0, 4).map(tag => (
              <span 
                key={tag} 
                className="px-2 py-0.5 bg-white/5 text-zinc-400 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {artifact.tags.length > 4 && (
              <span className="px-2 py-0.5 bg-white/5 text-zinc-500 text-xs rounded-full">
                +{artifact.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatTimeAgo(artifact.created_at)}
            </span>
            <span>by {artifact.created_by}</span>
            
            {artifact.run_id && (
              <Link 
                href={`/activity?run=${artifact.run_id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink size={10} />
                Run
              </Link>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handlePinClick}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  artifact.is_pinned 
                    ? "text-amber-400 hover:bg-amber-500/10" 
                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                )}
                title={artifact.is_pinned ? "Unpin" : "Pin"}
              >
                <Pin size={14} className={artifact.is_pinned ? "fill-current" : ""} />
              </button>
              
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-20 py-1">
                    <button
                      onClick={handleDeleteClick}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Click outside to close menu */}
        {showMenu && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
        )}
      </motion.div>
    </Link>
  )
}
