'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Pin,
  Clock,
  Bot,
  Tag,
  ExternalLink,
  Edit3,
  Trash2,
  MoreHorizontal,
  Lightbulb,
  CheckSquare,
  FileText,
  GitBranch,
  FlaskConical,
  Map,
  Camera,
  StickyNote,
  Copy,
  Check,
  Link2
} from 'lucide-react'
import { 
  KnowledgeArtifact, 
  artifactTypeConfig, 
  ArtifactType,
  getArtifactById,
  togglePinArtifact,
  deleteArtifact,
  getArtifacts
} from '@/lib/knowledge'
import { cn } from '@/lib/utils'


interface ArtifactDetailProps {
  artifactId: string;
}

const typeIcons: Record<ArtifactType, React.ReactNode> = {
  note: <StickyNote size={20} />,
  insight: <Lightbulb size={20} />,
  decision: <GitBranch size={20} />,
  summary: <FileText size={20} />,
  todo: <CheckSquare size={20} />,
  hypothesis: <FlaskConical size={20} />,
  plan: <Map size={20} />,
  state_snapshot: <Camera size={20} />,
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return formatDate(timestamp)
}

export default function ArtifactDetail({ artifactId }: ArtifactDetailProps) {
  const router = useRouter()
  const [artifact, setArtifact] = useState<KnowledgeArtifact | null>(null)
  const [relatedArtifacts, setRelatedArtifacts] = useState<KnowledgeArtifact[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  useEffect(() => {
    loadArtifact()
  }, [artifactId])

  const loadArtifact = async () => {
    setLoading(true)
    const data = await getArtifactById(artifactId)
    if (data) {
      setArtifact(data)
      setEditedContent(data.content)
      
      // Load related artifacts by tags or same agent
      const allArtifacts = await getArtifacts()
      const related = allArtifacts
        .filter(a => 
          a.id !== artifactId && (
            a.agent === data.agent ||
            a.tags?.some(tag => data.tags?.includes(tag))
          )
        )
        .slice(0, 4)
      setRelatedArtifacts(related)
    }
    setLoading(false)
  }

  const handlePinToggle = async () => {
    if (!artifact) return
    const result = await togglePinArtifact(artifact.id, !artifact.is_pinned)
    if (result.success) {
      setArtifact({ ...artifact, is_pinned: !artifact.is_pinned })
    }
  }

  const handleDelete = async () => {
    if (!artifact) return
    if (!confirm('Are you sure you want to delete this artifact? This action cannot be undone.')) {
      return
    }
    const result = await deleteArtifact(artifact.id)
    if (result.success) {
      router.push('/knowledge')
    }
  }

  const handleCopyContent = () => {
    if (!artifact) return
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!artifact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
          <FileText size={24} className="text-zinc-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Artifact not found</h3>
        <p className="text-zinc-500 mb-6">The artifact you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Knowledge
        </Link>
      </motion.div>
    )
  }

  const config = artifactTypeConfig[artifact.type]
  const TypeIcon = typeIcons[artifact.type]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Knowledge</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Link2 size={16} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={handlePinToggle}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
              artifact.is_pinned
                ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Pin size={16} className={artifact.is_pinned ? "fill-current" : ""} />
            {artifact.is_pinned ? 'Pinned' : 'Pin'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-20 py-1">
                <button
                  onClick={() => {
                    setIsEditing(!isEditing)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <Edit3 size={14} />
                  {isEditing ? 'Done Editing' : 'Edit'}
                </button>
                <button
                  onClick={handleCopyContent}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  Copy Content
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "bg-white/5 border rounded-2xl overflow-hidden",
          artifact.is_pinned ? "border-amber-500/30" : "border-white/10"
        )}
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-xl flex-shrink-0", config.bgColor, config.color)}>
              {TypeIcon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={cn("text-sm font-medium", config.color)}>
                  {config.label}
                </span>
                {artifact.is_pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                    <Pin size={10} className="fill-current" />
                    Pinned
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {artifact.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {formatRelativeTime(artifact.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  by {artifact.created_by}
                </span>
                {artifact.agent && (
                  <Link 
                    href={`/knowledge?agent=${artifact.agent}`}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Bot size={14} />
                    {artifact.agent}
                  </Link>
                )}
                {artifact.run_id && (
                  <Link 
                    href={`/activity?run=${artifact.run_id}`}
                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink size={14} />
                    View Run
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {artifact.tags && artifact.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pl-[72px]">
              {artifact.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/knowledge?tag=${tag}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-sm rounded-full transition-colors"
                >
                  <Tag size={12} />
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-96 bg-white/5 border border-white/10 rounded-lg p-4 text-zinc-300 focus:outline-none focus:border-indigo-500/50 resize-none font-mono text-sm"
            />
          ) : (
            <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-base">
              {artifact.content}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-4 bg-white/[0.02] border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>Created {formatDate(artifact.created_at)}</span>
            {artifact.updated_at !== artifact.created_at && (
              <span>Updated {formatRelativeTime(artifact.updated_at)}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Related Artifacts */}
      {relatedArtifacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Related Artifacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedArtifacts.map(related => {
              const relatedConfig = artifactTypeConfig[related.type]
              const RelatedIcon = typeIcons[related.type]
              
              return (
                <Link
                  key={related.id}
                  href={`/knowledge/${related.id}`}
                  className="group flex items-start gap-3 p-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                >
                  <div className={cn("p-2 rounded-lg flex-shrink-0", relatedConfig.bgColor, relatedConfig.color)}>
                    {RelatedIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-xs", relatedConfig.color)}>
                      {relatedConfig.label}
                    </span>
                    <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-zinc-500 text-xs line-clamp-1 mt-1">
                      {related.content.slice(0, 100)}...
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
