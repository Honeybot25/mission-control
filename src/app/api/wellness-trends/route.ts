import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    let trends: any[] = []

    // Fetch from Supabase if available
    if (supabase) {
      let query = supabase
        .from('wellness_trends')
        .select('*')
        .order('trending_score', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (!error && data) {
        trends = data
      }
    }

    // Use fallback if no data
    if (trends.length === 0) {
      trends = getFallbackTrends()
    }

    return NextResponse.json({
      trends: trends,
      count: trends.length,
    })

  } catch (error) {
    console.error('Error fetching wellness trends:', error)
    return NextResponse.json({
      trends: getFallbackTrends(),
      count: 6,
      error: (error as Error).message
    })
  }
}

function getFallbackTrends() {
  return [
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
}