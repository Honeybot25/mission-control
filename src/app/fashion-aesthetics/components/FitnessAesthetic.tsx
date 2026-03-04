'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  Dumbbell,
  Sparkles,
  Sunrise,
  Moon,
  Coffee,
  TrendingUp,
  Bookmark
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WellnessTrend {
  id: string
  category: string
  title: string
  description: string
  image_url: string
  tags: string[]
  trending_score: number
}

const fallbackWellness: WellnessTrend[] = [
  {
    id: '1',
    category: 'pilates',
    title: 'Pilates Princess Aesthetic',
    description: 'Matching workout sets, ballet flats, headbands - the full pilates lifestyle',
    image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop',
    tags: ['pilates', 'matching sets', 'ballet flats', 'wellness'],
    trending_score: 92
  },
  {
    id: '2',
    category: 'gym',
    title: 'Clean Girl Gym Look',
    description: 'Minimal makeup, slicked back ponytail, coordinated activewear',
    image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=800&fit=crop',
    tags: ['gym', 'clean girl', 'minimal', 'activewear'],
    trending_score: 85
  },
  {
    id: '3',
    category: 'routine',
    title: '5am Morning Routine',
    description: 'The disciplined morning routine aesthetic - lemon water, journaling, movement',
    image_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&h=800&fit=crop',
    tags: ['morning routine', 'discipline', 'wellness', '5am'],
    trending_score: 78
  },
  {
    id: '4',
    category: 'wellness',
    title: 'Gym to Street Style',
    description: 'Athleisure that works for brunch - seamless transitions',
    image_url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&h=800&fit=crop',
    tags: ['athleisure', 'street style', 'versatile', 'casual'],
    trending_score: 88
  },
  {
    id: '5',
    category: 'pilates',
    title: 'Reformer Pilates at Home',
    description: 'Setting up a home pilates space - the new status symbol',
    image_url: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=600&h=800&fit=crop',
    tags: ['home workout', 'reformer', 'luxury wellness', 'investment'],
    trending_score: 72
  },
  {
    id: '6',
    category: 'routine',
    title: 'Night Routine Wind Down',
    description: 'Evening rituals for better sleep - skincare, tea, reading',
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=800&fit=crop',
    tags: ['night routine', 'self care', 'sleep', 'relaxation'],
    trending_score: 68
  }
]

const routineIdeas = [
  {
    time: '5:00 AM',
    title: 'The Disciplined Start',
    icon: Sunrise,
    items: ['Lemon water', '10 min stretch', 'Journaling', 'Cold shower'],
    aesthetic: 'That girl morning'
  },
  {
    time: '12:00 PM',
    title: 'Pilates Princess Hour',
    icon: Dumbbell,
    items: ['Reformer class', 'Protein smoothie', 'Cute gym fit pic', 'Matcha'],
    aesthetic: 'Wellness lifestyle'
  },
  {
    time: '6:00 PM',
    title: 'Wind Down Ritual',
    icon: Moon,
    items: ['Skincare routine', 'Herbal tea', 'Reading', 'Meditation'],
    aesthetic: 'Clean girl night'
  }
]

const wellnessTips = [
  { title: 'The TikTok Water Bottle', desc: 'Gallon bottle with time markers - hydration aesthetic', trending: true },
  { title: 'Sauna & Cold Plunge', desc: 'The biohacking wellness combo everyone wants', trending: true },
  { title: 'Supplement Stack', desc: 'Beautifully organized morning vitamins', trending: false },
  { title: 'Walking Pad', desc: 'Work from home + movement combined', trending: true },
  { title: 'LED Mask', desc: 'The red light therapy skincare device', trending: false }
]

export default function FitnessAesthetic() {
  const [trends, setTrends] = useState<WellnessTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTrends()
  }, [])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wellness-trends?limit=10')
      const data = await res.json()
      setTrends(data.trends?.length > 0 ? data.trends : fallbackWellness)
    } catch (error) {
      console.error('Error fetching wellness trends:', error)
      setTrends(fallbackWellness)
    }
    setLoading(false)
  }

  const toggleSave = (id: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Fitness & Wellness Aesthetic</h2>
            <p className="text-sm text-zinc-500">Pilates princess • Clean girl • Lifestyle</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger value="trends" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
            Trends
          </TabsTrigger>
          <TabsTrigger value="routines" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
            Routine Ideas
          </TabsTrigger>
          <TabsTrigger value="tips" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
            Wellness Tips
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64 rounded-xl bg-zinc-800/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {trends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden group hover:border-rose-500/30 transition-all">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={trend.image_url}
                        alt={trend.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-rose-500/80 text-white border-0">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {trend.trending_score}%
                        </Badge>
                      </div>

                      <button
                        onClick={() => toggleSave(trend.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/80"
                      >
                        <Bookmark className={`w-4 h-4 ${savedItems.has(trend.id) ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-sm font-semibold text-white">{trend.title}</h3>
                        <p className="text-xs text-zinc-300 line-clamp-1">{trend.description}</p>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {trend.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Routines Tab */}
        <TabsContent value="routines" className="space-y-4 mt-4">
          {routineIdeas.map((routine, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-rose-500/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                      <routine.icon className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-zinc-200">{routine.title}</h3>
                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                          {routine.time}
                        </Badge>
                      </div>
                      <p className="text-xs text-rose-400 mb-2">{routine.aesthetic}</p>
                      <div className="flex flex-wrap gap-2">
                        {routine.items.map((item, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-3 mt-4">
          {wellnessTips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-rose-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                    {tip.title}
                    {tip.trending && (
                      <Badge className="bg-rose-500/20 text-rose-400 text-[10px]">Trending</Badge>
                    )}
                  </h4>
                  <p className="text-xs text-zinc-500">{tip.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}