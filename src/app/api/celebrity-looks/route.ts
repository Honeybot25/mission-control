import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const celebrity = searchParams.get('celebrity')
    const limit = parseInt(searchParams.get('limit') || '20')
    const aesthetic = searchParams.get('aesthetic')

    // Return fallback data if Supabase is not configured
    if (!supabase) {
      return NextResponse.json({
        looks: getFallbackLooks(),
        grouped: groupByCelebrity(getFallbackLooks()),
        count: 4,
        source: 'fallback'
      })
    }

    let query = supabase
      .from('celebrity_looks')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(limit)

    if (celebrity) {
      query = query.eq('celebrity', celebrity)
    }

    if (aesthetic) {
      query = query.contains('tags', [aesthetic])
    }

    const { data: looks, error } = await query

    if (error) throw error

    // Use fallback if no data
    const finalLooks = looks && looks.length > 0 ? looks : getFallbackLooks()

    // Group by celebrity for easier consumption
    const groupedByCelebrity = (finalLooks || []).reduce((acc: any, look: any) => {
      if (!acc[look.celebrity]) {
        acc[look.celebrity] = []
      }
      acc[look.celebrity].push(look)
      return acc
    }, {})

    return NextResponse.json({
      looks: finalLooks,
      grouped: groupedByCelebrity,
      count: finalLooks?.length || 0,
    })

  } catch (error) {
    console.error('Error fetching celebrity looks:', error)
    const fallback = getFallbackLooks()
    return NextResponse.json({
      looks: fallback,
      grouped: groupByCelebrity(fallback),
      count: fallback.length,
      error: (error as Error).message
    })
  }
}

function getFallbackLooks() {
  return [
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
}

function groupByCelebrity(looks: any[]) {
  return looks.reduce((acc: any, look: any) => {
    if (!acc[look.celebrity]) {
      acc[look.celebrity] = []
    }
    acc[look.celebrity].push(look)
    return acc
  }, {})
}