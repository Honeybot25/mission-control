'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Crown, 
  TrendingUp,
  ExternalLink,
  Heart,
  Share2,
  Bookmark,
  Camera
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface CelebrityLook {
  id: string
  celebrity: string
  look_title: string
  description: string
  image_url: string
  event: string
  tags: string[]
  key_pieces: string[]
  aesthetic_vibe: string
  captured_at: string
}

const celebrityConfig: Record<string, { color: string; emoji: string; bio: string }> = {
  'Bella Hadid': {
    color: 'from-amber-500/20 to-orange-500/20',
    emoji: '👑',
    bio: 'Old money meets streetwear. Vintage designer, quiet luxury, runway icon.'
  },
  'Alix Earle': {
    color: 'from-pink-500/20 to-rose-500/20',
    emoji: '✨',
    bio: 'Get Ready With Me queen. Relatable luxury, clean girl aesthetic, lifestyle content.'
  },
  'Hailey Bieber': {
    color: 'from-violet-500/20 to-purple-500/20',
    emoji: '💜',
    bio: 'Glazed donut skin, minimal chic, street style staple.'
  },
  'Kendall Jenner': {
    color: 'from-emerald-500/20 to-teal-500/20',
    emoji: '🌿',
    bio: 'Model off-duty vibes. Equestrian aesthetic, quiet luxury ambassador.'
  }
}

export default function CelebrityStyleTracker() {
  const [looks, setLooks] = useState<CelebrityLook[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCelebrity, setSelectedCelebrity] = useState<string>('all')
  const [savedLooks, setSavedLooks] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchLooks()
  }, [selectedCelebrity])

  const fetchLooks = async () => {
    setLoading(true)
    try {
      const url = selectedCelebrity === 'all' 
        ? '/api/celebrity-looks?limit=20'
        : `/api/celebrity-looks?celebrity=${encodeURIComponent(selectedCelebrity)}&limit=10`
      
      const res = await fetch(url)
      const data = await res.json()
      setLooks(data.looks || [])
    } catch (error) {
      console.error('Error fetching looks:', error)
      // Use fallback data
      setLooks(getFallbackLooks())
    }
    setLoading(false)
  }

  const getFallbackLooks = (): CelebrityLook[] => [
    {
      id: '1',
      celebrity: 'Bella Hadid',
      look_title: 'Streetwear Queen',
      description: 'Bella elevates streetwear with vintage designer pieces and quiet luxury accessories',
      image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
      event: 'NYC Street Style',
      tags: ['streetwear', 'vintage', 'elevated', 'old money'],
      key_pieces: ['vintage racing jacket', 'baggy jeans', 'small designer bag', 'sunglasses'],
      aesthetic_vibe: 'old-money-streetwear',
      captured_at: new Date().toISOString()
    },
    {
      id: '2',
      celebrity: 'Alix Earle',
      look_title: 'GRWM Morning Routine',
      description: 'Clean girl aesthetic with relatable luxury touches',
      image_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&h=800&fit=crop',
      event: 'Instagram/TikTok Content',
      tags: ['grwm', 'clean girl', 'relatable luxury', 'morning routine'],
      key_pieces: ['matching pajama set', 'gold jewelry', 'skincare bottles', 'coffee'],
      aesthetic_vibe: 'clean-girl-luxury',
      captured_at: new Date().toISOString()
    },
    {
      id: '3',
      celebrity: 'Bella Hadid',
      look_title: 'Red Carpet Old Money',
      description: 'Timeless Hollywood glamour with modern edge',
      image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
      event: 'Cannes Film Festival',
      tags: ['red carpet', 'glamour', 'vintage-inspired'],
      key_pieces: ['vintage Schiaparelli', 'diamond choker', 'slicked back hair'],
      aesthetic_vibe: 'hollywood-glamour',
      captured_at: new Date().toISOString()
    },
    {
      id: '4',
      celebrity: 'Alix Earle',
      look_title: 'Night Out Look',
      description: 'Effortless party girl vibes that feel achievable',
      image_url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&h=800&fit=crop',
      event: 'Weekend Content',
      tags: ['night out', 'party girl', 'elevated casual'],
      key_pieces: ['mini dress', 'strappy heels', 'clutch', 'statement earrings'],
      aesthetic_vibe: 'relatable-glam',
      captured_at: new Date().toISOString()
    }
  ]

  const toggleSave = (id: string) => {
    setSavedLooks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const celebrities = ['all', ...Array.from(new Set(looks.map(l => l.celebrity)))]

  const filteredLooks = selectedCelebrity === 'all' 
    ? looks 
    : looks.filter(l => l.celebrity === selectedCelebrity)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Celebrity Style Tracker</h2>
            <p className="text-sm text-zinc-500">Bella Hadid • Alix Earle • More</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {celebrities.map(celeb => (
            <button
              key={celeb}
              onClick={() => setSelectedCelebrity(celeb)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                selectedCelebrity === celeb
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              {celeb === 'all' ? 'All Stars' : celeb}
            </button>
          ))}
        </div>
      </div>

      {/* Celebrity Bio Cards */}
      {selectedCelebrity !== 'all' && celebrityConfig[selectedCelebrity] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl bg-gradient-to-r ${celebrityConfig[selectedCelebrity].color} border border-white/5`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{celebrityConfig[selectedCelebrity].emoji}</span>
            <div>
              <h3 className="font-medium text-zinc-200">{selectedCelebrity}</h3>
              <p className="text-sm text-zinc-400">{celebrityConfig[selectedCelebrity].bio}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Looks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-80 rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLooks.map((look, index) => (
            <motion.div
              key={look.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden group hover:border-amber-500/30 transition-all">
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={look.image_url}
                    alt={look.look_title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Overlay badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-black/50 backdrop-blur-sm text-white border-0">
                      {look.celebrity}
                    </Badge>
                    <Badge className="bg-amber-500/80 text-white border-0">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleSave(look.id)}
                      className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-amber-500/80 transition-colors"
                    >
                      <Bookmark className={`w-4 h-4 ${savedLooks.has(look.id) ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
                    </button>
                    <button className="p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-white/20 transition-colors">
                      <Share2 className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white mb-1">{look.look_title}</h3>
                    <p className="text-sm text-zinc-300 line-clamp-2">{look.description}</p>
                  </div>
                </div>

                {/* Details */}
                <CardContent className="p-4 space-y-3">
                  {/* Key Pieces */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Key Pieces
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {look.key_pieces.map((piece, i) => (
                        <span 
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300"
                        >
                          {piece}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800">
                    {look.tags.map((tag, i) => (
                      <Badge 
                        key={i}
                        variant="outline" 
                        className="text-xs border-zinc-700 text-zinc-400"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Event & Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {look.event}
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:text-amber-300">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Shop Similar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}