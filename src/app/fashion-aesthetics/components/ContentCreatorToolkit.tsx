'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Video, 
  Music,
  Camera,
  Hash,
  Copy,
  Check,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ContentIdea {
  id: string
  title: string
  description: string
  category: string
  content_type: string
  platform: string
  hooks: string[]
  trending_audio?: string
  visual_style?: string
  suggested_hashtags?: string[]
  is_ai_generated?: boolean
  confidence_score?: number
}

const fallbackIdeas: ContentIdea[] = [
  {
    id: '1',
    title: 'Quiet Luxury Haul',
    description: 'Showcasing investment pieces and where to find them',
    category: 'fashion',
    content_type: 'video',
    platform: 'tiktok',
    hooks: [
      'POV: you only buy pieces that last 10+ years',
      'Investment pieces that are actually worth the $$$',
      'Quiet luxury doesn\'t mean boring'
    ],
    trending_audio: 'original sound - makeba',
    visual_style: 'slow pans, natural lighting, quality close-ups',
    suggested_hashtags: ['quietluxury', 'oldmoney', 'investmentpieces', 'fashionhaul']
  },
  {
    id: '2',
    title: 'Get Ready With Me: Coffee Run',
    description: 'Relatable morning routine with clean girl aesthetic',
    category: 'lifestyle',
    content_type: 'video',
    platform: 'tiktok',
    hooks: [
      'GRWM: 6am edition',
      'Clean girl morning routine ☕✨',
      'How I get ready in 20 min'
    ],
    trending_audio: 'What Was I Made For? - Billie Eilish',
    visual_style: 'bright natural light, mirror shots, product close-ups',
    suggested_hashtags: ['grwm', 'cleangirl', 'morningroutine', 'aesthetic']
  },
  {
    id: '3',
    title: 'Bella Hadid Style Breakdown',
    description: 'Analyzing her latest looks and how to recreate',
    category: 'fashion',
    content_type: 'carousel',
    platform: 'instagram',
    hooks: [
      'Steal her style: Bella Hadid edition',
      'Bella Hadid aesthetic decoded 🖤'
    ],
    visual_style: 'high quality photos, side-by-side comparisons, text overlays',
    suggested_hashtags: ['bellahadid', 'streetstyle', 'celebrityfashion', 'styleinspo']
  },
  {
    id: '4',
    title: 'Pilates Princess Outfit Ideas',
    description: 'Cute gym-to-brunch looks',
    category: 'fitness',
    content_type: 'reel',
    platform: 'instagram',
    hooks: [
      'Gym outfits that actually motivate me',
      'Pilates princess starter pack',
      'From workout to brunch ✨'
    ],
    trending_audio: 'Sexy Back - Justin Timberlake',
    visual_style: 'bright airy gym setting, movement shots, outfit details',
    suggested_hashtags: ['pilatesprincess', 'athleisure', 'fitnessaesthetic', 'gymoutfit']
  }
]

const trendingHooks = [
  'POV: you finally found your aesthetic',
  'This changed everything for me',
  'Stop scrolling if you love [aesthetic]',
  'The [aesthetic] starter pack',
  'How to get the [aesthetic] look on a budget',
  'Things that just make sense [edition]',
  'I\'m convinced this is the secret to [result]',
  'The category is [vibe]',
  'Tell me you\'re [aesthetic] without telling me',
  'This audio was made for [content type]'
]

const trendingPoses = [
  { name: 'The Candid Walk', platform: 'instagram', engagement: 'High' },
  { name: 'Mirror Selfie (Full Body)', platform: 'both', engagement: 'Very High' },
  { name: 'The "Oops" Looking Away', platform: 'instagram', engagement: 'High' },
  { name: 'Coffee Cup Detail Shot', platform: 'both', engagement: 'Medium' },
  { name: 'Car Selfie Golden Hour', platform: 'instagram', engagement: 'High' },
  { name: 'Flat Lay Aesthetic', platform: 'instagram', engagement: 'Medium' },
  { name: 'Outfit Transition Dance', platform: 'tiktok', engagement: 'Very High' },
  { name: 'The "Get Ready" Pan', platform: 'tiktok', engagement: 'High' }
]

const trendingSounds = [
  { name: 'Makeba - original sound', platform: 'tiktok', growth: '+45%', bestFor: 'Outfit transitions' },
  { name: 'What Was I Made For?', platform: 'tiktok', growth: '+38%', bestFor: 'GRWM, aesthetic' },
  { name: 'Rich Girl - Hall & Oates', platform: 'tiktok', growth: '+52%', bestFor: 'Luxury lifestyle' },
  { name: 'Sexy Back - JT', platform: 'instagram', growth: '+42%', bestFor: 'Reel intros' },
  { name: 'Pink + White - Frank Ocean', platform: 'tiktok', growth: '+36%', bestFor: 'Clean girl' }
]

export default function ContentCreatorToolkit() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/content-suggestions?generate=true&limit=10')
      const data = await res.json()
      
      const combinedIdeas = [...(data.ideas || []), ...(data.suggestions || [])]
      setIdeas(combinedIdeas.length > 0 ? combinedIdeas : fallbackIdeas)
    } catch (error) {
      console.error('Error fetching content ideas:', error)
      setIdeas(fallbackIdeas)
    }
    setLoading(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
            <Video className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Content Creator Toolkit</h2>
            <p className="text-sm text-zinc-500">Hooks, poses & trending sounds</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ideas" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger value="ideas" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            Content Ideas
          </TabsTrigger>
          <TabsTrigger value="hooks" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            Viral Hooks
          </TabsTrigger>
          <TabsTrigger value="poses" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            Posing Guide
          </TabsTrigger>
          <TabsTrigger value="sounds" className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
            Sounds
          </TabsTrigger>
        </TabsList>

        {/* Content Ideas Tab */}
        <TabsContent value="ideas" className="space-y-4 mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl bg-zinc-800/50" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.slice(0, 6).map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-zinc-900/50 border-zinc-800 hover:border-violet-500/30 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={idea.platform === 'tiktok' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-pink-500/20 text-pink-400'}>
                            {idea.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                          </Badge>
                          <Badge variant="outline" className="text-zinc-400 border-zinc-700 capitalize">
                            {idea.content_type}
                          </Badge>
                          {idea.is_ai_generated && (
                            <Badge className="bg-violet-500/20 text-violet-400">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Suggested
                            </Badge>
                          )}
                        </div>
                      </div>

                      <h3 className="font-medium text-zinc-200 mb-1">{idea.title}</h3>
                      <p className="text-sm text-zinc-500 mb-3">{idea.description}</p>

                      {/* Hooks */}
                      <div className="space-y-2 mb-3">
                        {idea.hooks?.slice(0, 2).map((hook, i) => (
                          <div key={i} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2">
                            <span className="text-sm text-zinc-300 italic">&quot;{hook}&quot;</span>
                            <button
                              onClick={() => copyToClipboard(hook, `${idea.id}-${i}`)}
                              className="text-zinc-500 hover:text-violet-400 transition-colors"
                            >
                              {copiedId === `${idea.id}-${i}` ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Tags & Audio */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
                        {idea.trending_audio && (
                          <span className="text-xs text-violet-400 flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            {idea.trending_audio}
                          </span>
                        )}
                        {idea.suggested_hashtags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs text-zinc-500">#{tag}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Hooks Tab */}
        <TabsContent value="hooks" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-3">
            {trendingHooks.map((hook, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 hover:border-violet-500/30 transition-all"
              >
                <span className="text-sm text-zinc-300">{hook}</span>
                <button
                  onClick={() => copyToClipboard(hook, `hook-${index}`)}
                  className="text-zinc-500 hover:text-violet-400 transition-colors"
                >
                  {copiedId === `hook-${index}` ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Poses Tab */}
        <TabsContent value="poses" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trendingPoses.map((pose, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-zinc-900/50 border-zinc-800 hover:border-violet-500/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                          <Camera className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200">{pose.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                              {pose.platform === 'both' ? 'IG + TikTok' : pose.platform}
                            </Badge>
                            <Badge className={`text-[10px] ${
                              pose.engagement === 'Very High' ? 'bg-green-500/20 text-green-400' :
                              pose.engagement === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-zinc-500/20 text-zinc-400'
                            }`}>
                              {pose.engagement} engagement
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Sounds Tab */}
        <TabsContent value="sounds" className="space-y-4 mt-4">
          <div className="space-y-3">
            {trendingSounds.map((sound, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Music className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">{sound.name}</h4>
                    <p className="text-xs text-zinc-500">Best for: {sound.bestFor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {sound.growth}
                  </Badge>
                  <Badge variant="outline" className={sound.platform === 'tiktok' ? 'text-cyan-400 border-cyan-500/30' : 'text-pink-400 border-pink-500/30'}>
                    {sound.platform}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}