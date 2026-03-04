'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Sparkles,
  Crown,
  Palette,
  Video,
  BookOpen,
  Heart,
  Calendar,
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Import our new components
import CelebrityStyleTracker from './components/CelebrityStyleTracker'
import TrendingAesthetics from './components/TrendingAesthetics'
import ContentCreatorToolkit from './components/ContentCreatorToolkit'
import NotionMoodboard from './components/NotionMoodboard'
import FitnessAesthetic from './components/FitnessAesthetic'
import ContentCalendar from './components/ContentCalendar'

// Types for snapshot data
interface TrendingSnapshot {
  title: string
  trend: string
  change: string
  isPositive: boolean
}

const trendingSnapshots: TrendingSnapshot[] = [
  { title: 'Quiet Luxury', trend: '+34%', change: 'this week', isPositive: true },
  { title: 'Clean Girl Aesthetic', trend: '+28%', change: 'this week', isPositive: true },
  { title: 'Bella Hadid Style', trend: '+45%', change: 'this week', isPositive: true },
  { title: 'Pilates Princess', trend: '+22%', change: 'this week', isPositive: true },
]

export default function FashionAestheticsClient() {
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    }))
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-amber-400 transition-colors">
                Mission Control
              </Link>
              <span className="text-zinc-600">/</span>
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400" size={20} />
                <span className="text-zinc-400">Fashion & Aesthetics</span>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/activity" className="text-sm text-zinc-400 hover:text-white transition-colors">Activity</Link>
              <Link href="/knowledge" className="text-sm text-zinc-400 hover:text-white transition-colors">Knowledge</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  <Sparkles size={24} className="text-amber-400" />
                </div>
                <h1 className="text-3xl font-bold">Fashion & Aesthetics Radar</h1>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                  BELLA HADID • ALIX EARLE EDITION
                </Badge>
              </div>
              <p className="text-zinc-400 max-w-2xl">
                Old money meets streetwear. Get ready with me vibes. Celebrity style breakdowns, 
                trending aesthetics, content creator toolkit, and your synced Notion moodboard.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Clock size={14} />
                  Last updated: {lastUpdated}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 hover:bg-zinc-800"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={14} className="mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Trending Snapshot Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingSnapshots.map((item, index) => (
              <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-amber-500/30 transition-all">
                <CardContent className="p-4">
                  <p className="text-xs text-zinc-500 mb-1">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-amber-400">{item.trend}</span>
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-xs text-zinc-600">{item.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 mb-6 flex flex-wrap h-auto gap-2 p-2">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Sparkles className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="celebrity" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Crown className="w-4 h-4 mr-2" />
              Celebrity Style
            </TabsTrigger>
            <TabsTrigger value="aesthetics" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Palette className="w-4 h-4 mr-2" />
              Aesthetics
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Video className="w-4 h-4 mr-2" />
              Creator Toolkit
            </TabsTrigger>
            <TabsTrigger value="moodboard" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <BookOpen className="w-4 h-4 mr-2" />
              My Moodboard
            </TabsTrigger>
            <TabsTrigger value="wellness" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Heart className="w-4 h-4 mr-2" />
              Fitness & Wellness
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Calendar className="w-4 h-4 mr-2" />
              Content Calendar
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Shows All Sections */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CelebrityStyleTracker />
              <TrendingAesthetics />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ContentCreatorToolkit />
              <FitnessAesthetic />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <NotionMoodboard />
              <ContentCalendar />
            </div>
          </TabsContent>

          {/* Individual Tabs */}
          <TabsContent value="celebrity">
            <CelebrityStyleTracker />
          </TabsContent>

          <TabsContent value="aesthetics">
            <TrendingAesthetics />
          </TabsContent>

          <TabsContent value="content">
            <ContentCreatorToolkit />
          </TabsContent>

          <TabsContent value="moodboard">
            <NotionMoodboard />
          </TabsContent>

          <TabsContent value="wellness">
            <FitnessAesthetic />
          </TabsContent>

          <TabsContent value="calendar">
            <ContentCalendar />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
          <p>Fashion & Aesthetics Radar • Bella Hadid • Alix Earle • Mission Control</p>
          <p className="mt-1">Synced with Notion • Auto-updates daily</p>
        </footer>
      </main>
    </div>
  )
}