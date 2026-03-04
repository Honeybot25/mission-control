'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  RefreshCw,
  Plus,
  ExternalLink,
  Tag,
  Search,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface NotionItem {
  id: string
  notion_id: string
  title: string
  category: string
  tags: string[]
  url: string
  image_url?: string
  notes?: string
  last_synced: string
}

export default function NotionMoodboard() {
  const [items, setItems] = useState<NotionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  // Add to Notion modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'general',
    tags: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notion/sync')
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
        // Use cached items if available
        if (data.items) {
          setItems(data.items)
          setLastSynced(data.items[0]?.last_synced || null)
        }
      } else {
        setItems(data.items || [])
        setLastSynced(data.last_synced)
      }
    } catch (error) {
      console.error('Error fetching Notion items:', error)
      setError('Failed to connect to Notion')
    }
    setLoading(false)
  }

  const syncWithNotion = async () => {
    setSyncing(true)
    await fetchItems()
    setSyncing(false)
  }

  const saveToNotion = async () => {
    if (!newItem.title.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/notion/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.title,
          category: newItem.category,
          tags: newItem.tags.split(',').map(t => t.trim()).filter(Boolean),
          notes: newItem.notes
        })
      })

      if (res.ok) {
        setNewItem({ title: '', category: 'general', tags: '', notes: '' })
        setIsAddModalOpen(false)
        await fetchItems()
      } else {
        const error = await res.json()
        setError(error.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Error saving to Notion:', error)
      setError('Failed to save to Notion')
    }
    setSaving(false)
  }

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))]

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group items by category for grid view
  const groupedByCategory = filteredItems.reduce((acc: Record<string, NotionItem[]>, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'outfit': 'bg-blue-500/20 text-blue-400',
      'inspo': 'bg-purple-500/20 text-purple-400',
      'shopping': 'bg-green-500/20 text-green-400',
      'content': 'bg-pink-500/20 text-pink-400',
      'general': 'bg-zinc-500/20 text-zinc-400'
    }
    return colors[category] || colors['general']
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">My Fashion Moodboard</h2>
            <p className="text-sm text-zinc-500">
              {lastSynced ? `Synced ${new Date(lastSynced).toLocaleTimeString()}` : 'Notion Sync'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={syncWithNotion}
            disabled={syncing}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Add to Notion Moodboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Title</label>
                  <Input
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="e.g., Bella Hadid Street Style Inspo"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100"
                  >
                    <option value="general">General</option>
                    <option value="outfit">Outfit</option>
                    <option value="inspo">Inspiration</option>
                    <option value="shopping">Shopping List</option>
                    <option value="content">Content Idea</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Tags (comma separated)</label>
                  <Input
                    value={newItem.tags}
                    onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                    placeholder="quiet luxury, bella hadid, street style"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Notes</label>
                  <textarea
                    value={newItem.notes}
                    onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    placeholder="Add any notes..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 resize-none"
                  />
                </div>
                <Button 
                  onClick={saveToNotion} 
                  disabled={saving || !newItem.title.trim()}
                  className="w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                >
                  {saving ? 'Saving...' : 'Save to Notion'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm text-amber-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your moodboard..."
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 text-sm"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Moodboard Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No items in your moodboard yet</p>
          <p className="text-zinc-500 text-sm mt-1">Click &quot;Add&quot; to save your first inspiration</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {category.charAt(0).toUpperCase() + category.slice(1)}
                <Badge className={getCategoryColor(category)}>{categoryItems.length}</Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <Card className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/30 transition-all overflow-hidden">
                        {item.image_url ? (
                          <div className="h-32 overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-zinc-600" />
                          </div>
                        )}
                        <CardContent className="p-3">
                          <h4 className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                            {item.title}
                          </h4>
                          {item.notes && (
                            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.notes}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[10px] text-zinc-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notion link */}
      <div className="pt-4 border-t border-zinc-800">
        <a
          href="https://www.notion.so/309cf0ef753881919011d4c9a12683fe?v=309cf0ef75388170971d000ccd891ee3"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open in Notion
        </a>
      </div>
    </div>
  )
}