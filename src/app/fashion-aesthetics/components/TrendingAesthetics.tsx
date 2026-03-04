'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Palette, 
  TrendingUp,
  ArrowUpRight,
  Bookmark,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface AestheticCategory {
  id: string
  name: string
  slug: string
  description: string
  key_elements: string[]
  color_palette: string[]
  image_url?: string
  trending_level: number
  trending_direction: 'hot' | 'rising' | 'stable'
}

// Fallback aesthetics with Unsplash images
const fallbackAesthetics: AestheticCategory[] = [
  {
    id: '1',
    name: 'Quiet Luxury',
    slug: 'quiet-luxury',
    description: 'Old money meets modern minimalism. Quality over quantity, investment pieces, understated elegance.',
    key_elements: ['minimal branding', 'natural fabrics', 'neutral palette', 'timeless silhouettes'],
    color_palette: ['#F5F1E8', '#D4C4B0', '#8B7355', '#4A4A4A'],
    image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
    trending_level: 95,
    trending_direction: 'hot'
  },
  {
    id: '2',
    name: 'Clean Girl',
    slug: 'clean-girl',
    description: 'Effortlessly polished aesthetic. Sleek hair, minimal makeup, put-together basics.',
    key_elements: ['slicked back hair', 'gold hoops', 'minimal makeup', 'fitted basics'],
    color_palette: ['#F8F4F0', '#E8DDD4', '#C9B8A8', '#D4AF37'],
    image_url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=800&fit=crop',
    trending_level: 88,
    trending_direction: 'hot'
  },
  {
    id: '3',
    name: 'Coastal Cowgirl',
    slug: 'coastal-cowgirl',
    description: 'Beach meets western. Cowboy boots with flowy dresses, breezy linens with denim.',
    key_elements: ['cowboy boots', 'flowy dresses', 'straw hats', 'denim', 'linen'],
    color_palette: ['#E8DCC4', '#8FA8B8', '#C17F59', '#6B7B8C'],
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop',
    trending_level: 72,
    trending_direction: 'rising'
  },
  {
    id: '4',
    name: 'Mob Wife',
    slug: 'mob-wife',
    description: 'Dramatic, unapologetic glamour. Fur (faux), animal prints, bold jewelry, smoky eyes.',
    key_elements: ['faux fur', 'leopard print', 'gold jewelry', 'smoky eyes', 'red lipstick'],
    color_palette: ['#1A1A1A', '#D4AF37', '#8B0000', '#F5F5F5'],
    image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&h=800&fit=crop',
    trending_level: 65,
    trending_direction: 'stable'
  },
  {
    id: '5',
    name: 'Corporate Baddie',
    slug: 'corporate-baddie',
    description: 'Power dressing for the modern era. Sharp suits, elevated workwear, boardroom to bar.',
    key_elements: ['structured blazers', 'wide leg trousers', 'power suits', 'minimalist heels'],
    color_palette: ['#1E3A5F', '#000000', '#F5F1E8', '#C9A227'],
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
    trending_level: 78,
    trending_direction: 'rising'
  },
  {
    id: '6',
    name: 'Vintage Revival',
    slug: 'vintage-revival',
    description: '90s and 00s nostalgia. Thrifted designer, unique finds, sustainable fashion.',
    key_elements: ['vintage designer', 'thrift finds', 'unique pieces', 'retro silhouettes'],
    color_palette: ['#D4A574', '#8B4513', '#CD853F', '#DEB887'],
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&fit=crop',
    trending_level: 82,
    trending_direction: 'rising'
  }
]

export default function TrendingAesthetics() {
  const [aesthetics, setAesthetics] = useState<AestheticCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [savedAesthetics, setSavedAesthetics] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAesthetics()
  }, [])

  const fetchAesthetics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trending-aesthetics?limit=10')
      const data = await res.json()
      
      if (data.aesthetics && data.aesthetics.length > 0) {
        // Add fallback images if missing
        const withImages = data.aesthetics.map((a: AestheticCategory, i: number) => ({
          ...a,
          image_url: a.image_url || fallbackAesthetics[i % fallbackAesthetics.length].image_url
        }))
        setAesthetics(withImages)
      } else {
        setAesthetics(fallbackAesthetics)
      }
    } catch (error) {
      console.error('Error fetching aesthetics:', error)
      setAesthetics(fallbackAesthetics)
    }
    setLoading(false)
  }

  const toggleSave = (id: string) => {
    setSavedAesthetics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getTrendingBadge = (direction: string, level: number) => {
    switch (direction) {
      case 'hot':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <TrendingUp className="w-3 h-3 mr-1" />
            Hot 🔥
          </Badge>
        )
      case 'rising':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Rising
          </Badge>
        )
      default:
        return (
          <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">
            Stable
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
            <Palette className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Trending Aesthetics</h2>
            <p className="text-sm text-zinc-500">What&apos;s in right now</p>
          </div>
        </div>
      </div>

      {/* Aesthetics Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {aesthetics.map((aesthetic, index) => (
            <motion.div
              key={aesthetic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden group hover:border-rose-500/30 transition-all h-full">
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={aesthetic.image_url}
                    alt={aesthetic.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Trending badge */}
                  <div className="absolute top-2 left-2">
                    {getTrendingBadge(aesthetic.trending_direction, aesthetic.trending_level)}
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => toggleSave(aesthetic.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/80"
                  >
                    <Bookmark className={`w-4 h-4 ${savedAesthetics.has(aesthetic.id) ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
                  </button>

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-semibold text-white">{aesthetic.name}</h3>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs text-zinc-400 line-clamp-2">{aesthetic.description}</p>
                  
                  {/* Color palette */}
                  <div className="flex gap-1">
                    {aesthetic.color_palette.slice(0, 4).map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* Key elements */}
                  <div className="flex flex-wrap gap-1">
                    {aesthetic.key_elements.slice(0, 3).map((element, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                      >
                        {element}
                      </span>
                    ))}
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