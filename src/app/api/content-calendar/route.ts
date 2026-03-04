import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('week_start')
    const limit = parseInt(searchParams.get('limit') || '50')

    let calendar: any[] = []

    // Fetch from Supabase if available
    if (supabase) {
      let query = supabase
        .from('content_calendar')
        .select(`
          *,
          content_ideas (
            title,
            description,
            trending_audio,
            hooks
          )
        `)
        .order('week_start', { ascending: false })
        .order('day_of_week', { ascending: true })
        .limit(limit)

      if (weekStart) {
        query = query.eq('week_start', weekStart)
      }

      const { data, error } = await query
      if (!error && data) {
        calendar = data
      }
    }

    // Use fallback if no data
    if (calendar.length === 0) {
      calendar = getFallbackCalendar()
    }

    // Group by day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const groupedByDay = days.map((day, index) => ({
      day,
      dayOfWeek: index,
      items: calendar.filter((item: any) => item.day_of_week === index)
    }))

    return NextResponse.json({
      calendar: calendar,
      groupedByDay,
      weekStart: weekStart || new Date().toISOString().split('T')[0],
    })

  } catch (error) {
    console.error('Error fetching content calendar:', error)
    const fallback = getFallbackCalendar()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return NextResponse.json({
      calendar: fallback,
      groupedByDay: days.map((day, index) => ({
        day,
        dayOfWeek: index,
        items: fallback.filter((item: any) => item.day_of_week === index)
      })),
      weekStart: new Date().toISOString().split('T')[0],
      error: (error as Error).message
    })
  }
}

function getFallbackCalendar() {
  return [
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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