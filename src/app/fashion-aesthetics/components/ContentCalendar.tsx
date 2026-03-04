'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock,
  Instagram,
  Video,
  Check,
  AlertCircle,
  Sparkles,
  Hash
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface CalendarItem {
  id: string
  day_of_week: number
  platform: string
  content_type: string
  title: string
  description: string
  suggested_hook: string
  suggested_hashtags: string[]
  suggested_time: string
  status: string
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  tiktok: <Video className="w-4 h-4" />
}

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/20 text-pink-400',
  tiktok: 'bg-cyan-500/20 text-cyan-400'
}

const fallbackCalendar: Record<number, CalendarItem[]> = {
  0: [ // Sunday
    {
      id: 'sun1',
      day_of_week: 0,
      platform: 'instagram',
      content_type: 'carousel',
      title: 'Week Preview / Goals',
      description: 'Share your week ahead aesthetic',
      suggested_hook: 'This week I\'m manifesting...',
      suggested_hashtags: ['sundayreset', 'weekahead', 'goalsetting'],
      suggested_time: '10:00 AM',
      status: 'suggested'
    }
  ],
  1: [ // Monday
    {
      id: 'mon1',
      day_of_week: 1,
      platform: 'tiktok',
      content_type: 'video',
      title: 'Motivation Monday',
      description: 'Get ready with me / morning routine',
      suggested_hook: 'POV: you\'re starting the week strong',
      suggested_hashtags: ['mondaymotivation', 'grwm', 'morningroutine'],
      suggested_time: '7:00 AM',
      status: 'suggested'
    }
  ],
  2: [ // Tuesday
    {
      id: 'tue1',
      day_of_week: 2,
      platform: 'instagram',
      content_type: 'reel',
      title: 'Outfit of the Day',
      description: 'Show your Tuesday look',
      suggested_hook: 'Quiet luxury for a Tuesday',
      suggested_hashtags: ['ootd', 'quietluxury', 'outfitinspo'],
      suggested_time: '12:00 PM',
      status: 'suggested'
    }
  ],
  3: [ // Wednesday
    {
      id: 'wed1',
      day_of_week: 3,
      platform: 'tiktok',
      content_type: 'video',
      title: 'Mid-week Reset',
      description: 'Wellness / self-care content',
      suggested_hook: 'Resetting for the second half of the week',
      suggested_hashtags: ['selfcare', 'wellness', 'midweek'],
      suggested_time: '6:00 PM',
      status: 'suggested'
    }
  ],
  4: [ // Thursday
    {
      id: 'thu1',
      day_of_week: 4,
      platform: 'instagram',
      content_type: 'story',
      title: 'Throwback / Style Evolution',
      description: 'Share your style journey',
      suggested_hook: 'How my style has evolved',
      suggested_hashtags: ['tbt', 'styleevolution', 'fashion'],
      suggested_time: '3:00 PM',
      status: 'suggested'
    }
  ],
  5: [ // Friday
    {
      id: 'fri1',
      day_of_week: 5,
      platform: 'tiktok',
      content_type: 'video',
      title: 'Friday Night Out Prep',
      description: 'Get ready with me - night edition',
      suggested_hook: 'Friday night transformation',
      suggested_hashtags: ['fridaynight', 'grwm', 'nightout'],
      suggested_time: '5:00 PM',
      status: 'suggested'
    }
  ],
  6: [ // Saturday
    {
      id: 'sat1',
      day_of_week: 6,
      platform: 'instagram',
      content_type: 'carousel',
      title: 'Weekend Photo Dump',
      description: 'Casual weekend content',
      suggested_hook: 'Weekend recap ✨',
      suggested_hashtags: ['weekendvibes', 'photodump', 'lifestyle'],
      suggested_time: '2:00 PM',
      status: 'suggested'
    }
  ]
}

export default function ContentCalendar() {
  const [calendar, setCalendar] = useState<Record<number, CalendarItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  useEffect(() => {
    fetchCalendar()
  }, [currentWeek])

  const fetchCalendar = async () => {
    setLoading(true)
    try {
      const weekStart = new Date(currentWeek)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      
      const res = await fetch(`/api/content-calendar?week_start=${weekStart.toISOString().split('T')[0]}`)
      const data = await res.json()
      
      if (data.groupedByDay) {
        const grouped: Record<number, CalendarItem[]> = {}
        data.groupedByDay.forEach((day: any) => {
          grouped[day.dayOfWeek] = day.items
        })
        setCalendar(grouped)
      } else {
        setCalendar(fallbackCalendar)
      }
    } catch (error) {
      console.error('Error fetching calendar:', error)
      setCalendar(fallbackCalendar)
    }
    setLoading(false)
  }

  const getDayItems = (dayIndex: number): CalendarItem[] => {
    return calendar[dayIndex] || []
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <Check className="w-4 h-4 text-green-400" />
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-400" />
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />
    }
  }

  const getTodayIndex = () => {
    return new Date().getDay()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Weekly Content Calendar</h2>
            <p className="text-sm text-zinc-500">Auto-suggested content based on trends</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const prev = new Date(currentWeek)
              prev.setDate(prev.getDate() - 7)
              setCurrentWeek(prev)
            }}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            ←
          </Button>
          <span className="text-sm text-zinc-400 min-w-[120px] text-center">
            {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = new Date(currentWeek)
              next.setDate(next.getDate() + 7)
              setCurrentWeek(next)
            }}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            →
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl bg-zinc-800/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {days.map((day, index) => {
            const items = getDayItems(index)
            const isToday = index === getTodayIndex()
            const isExpanded = expandedDay === index

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`${isExpanded ? 'md:col-span-7' : ''}`}
              >
                <Card 
                  className={`bg-zinc-900/50 border-zinc-800 cursor-pointer transition-all hover:border-blue-500/30 ${
                    isToday ? 'ring-1 ring-blue-500/50' : ''
                  }`}
                  onClick={() => setExpandedDay(isExpanded ? null : index)}
                >
                  <CardHeader className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-sm ${isToday ? 'text-blue-400' : 'text-zinc-400'}`}>
                        {day.slice(0, 3)}
                      </CardTitle>
                      {items.length > 0 && (
                        <Badge className="text-xs bg-blue-500/20 text-blue-400">
                          {items.length}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {items.length === 0 ? (
                      <p className="text-xs text-zinc-600 text-center py-4">No suggestions</p>
                    ) : (
                      <div className="space-y-2">
                        {items.slice(0, isExpanded ? undefined : 2).map((item) => (
                          <div
                            key={item.id}
                            className="p-2 rounded-lg bg-zinc-800/50 space-y-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className={platformColors[item.platform]}>
                                {platformIcons[item.platform]}
                              </span>
                              <span className="text-xs text-zinc-400 capitalize">{item.content_type}</span>
                              {getStatusIcon(item.status)}
                            </div>
                            <p className="text-xs font-medium text-zinc-200 line-clamp-1">{item.title}</p>
                            {isExpanded && (
                              <>
                                <p className="text-xs text-zinc-500">{item.description}</p>
                                <div className="p-2 rounded bg-zinc-900/50 mt-2">
                                  <p className="text-xs text-zinc-400 italic">&quot;{item.suggested_hook}&quot;</p>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Hash className="w-3 h-3 text-zinc-600" />
                                  <span className="text-[10px] text-zinc-500">
                                    {item.suggested_hashtags?.slice(0, 3).join(' ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3 text-zinc-600" />
                                  <span className="text-[10px] text-zinc-500">{item.suggested_time}</span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Suggested
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-blue-400" />
          Scheduled
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-3 h-3 text-green-400" />
          Posted
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500/50" />
          Today
        </div>
      </div>
    </div>
  )
}