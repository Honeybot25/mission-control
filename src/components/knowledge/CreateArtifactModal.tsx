'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  Plus,
  Lightbulb,
  CheckSquare,
  FileText,
  GitBranch,
  FlaskConical,
  Map,
  Camera,
  StickyNote,
  Tag,
  Bot,
  Loader2,
  Sparkles
} from 'lucide-react'
import { 
  ArtifactType, 
  artifactTypeConfig, 
  createArtifact,
  KnowledgeArtifact,
  getAllTags
} from '@/lib/knowledge'
import { cn } from '@/lib/utils'

interface CreateArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (artifact: KnowledgeArtifact) => void;
  initialData?: {
    title?: string;
    content?: string;
    type?: ArtifactType;
    agent?: string;
    runId?: string;
    tags?: string[];
  };
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

export default function CreateArtifactModal({ 
  isOpen, 
  onClose, 
  onCreated,
  initialData 
}: CreateArtifactModalProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [type, setType] = useState<ArtifactType>(initialData?.type || 'note')
  const [agent, setAgent] = useState(initialData?.agent || '')
  const [runId, setRunId] = useState(initialData?.runId || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      getAllTags().then(setExistingTags)
    }
  }, [isOpen])

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setContent(initialData.content || '')
      setType(initialData.type || 'note')
      setAgent(initialData.agent || '')
      setRunId(initialData.runId || '')
      setTags(initialData.tags || [])
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!title.trim()) {
      setError('Title is required')
      setLoading(false)
      return
    }

    if (!content.trim()) {
      setError('Content is required')
      setLoading(false)
      return
    }

    const result = await createArtifact({
      title: title.trim(),
      content: content.trim(),
      type,
      tags,
      agent: agent || undefined,
      run_id: runId || undefined,
      created_by: agent || 'Honey', // Default to Honey if no agent specified
      is_pinned: false,
    })

    setLoading(false)

    if (result.success && result.data) {
      onCreated?.(result.data)
      resetForm()
      onClose()
    } else {
      setError('Failed to create artifact. Please try again.')
    }
  }

  const resetForm = () => {
    if (!initialData) {
      setTitle('')
      setContent('')
      setType('note')
      setAgent('')
      setRunId('')
      setTags([])
    }
    setTagInput('')
    setError('')
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
    setShowTagSuggestions(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
    if (e.key === 'Escape') {
      setShowTagSuggestions(false)
    }
  }

  const filteredExistingTags = existingTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !tags.includes(tag)
  )

  const artifactTypes: ArtifactType[] = [
    'note', 'insight', 'decision', 'summary', 
    'todo', 'hypothesis', 'plan', 'state_snapshot'
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Create Artifact</h2>
                <p className="text-sm text-zinc-500">Capture knowledge from agent runs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Artifact Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {artifactTypes.map((t) => {
                    const config = artifactTypeConfig[t]
                    const Icon = typeIcons[t]
                    
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                          type === t
                            ? `${config.bgColor} ${config.color} border-current`
                            : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
                        )}
                      >
                        {Icon}
                        <span className="text-xs">{config.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your content here... Supports markdown formatting"
                  rows={8}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none font-mono text-sm"
                />
                <p className="mt-1 text-xs text-zinc-600">
                  Tip: Use markdown for formatting (## headings, **bold**, *italic*, - lists)
                </p>
              </div>

              {/* Agent & Run */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Bot size={14} />
                      Agent
                    </span>
                  </label>
                  <input
                    type="text"
                    value={agent}
                    onChange={(e) => setAgent(e.target.value)}
                    placeholder="e.g., TraderBot"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Run ID (optional)
                  </label>
                  <input
                    type="text"
                    value={runId}
                    onChange={(e) => setRunId(e.target.value)}
                    placeholder="Link to agent run..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Tag size={14} />
                    Tags
                  </span>
                </label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-500/20 text-indigo-400 text-sm rounded-full"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value)
                        setShowTagSuggestions(true)
                      }}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowTagSuggestions(true)}
                      placeholder="Add tags..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    />
                    {showTagSuggestions && filteredExistingTags.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-10 max-h-32 overflow-y-auto">
                        {filteredExistingTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setTags([...tags, tag])
                              setTagInput('')
                              setShowTagSuggestions(false)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Artifact
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
