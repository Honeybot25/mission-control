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

    let aesthetics: any[] = []

    // Fetch from Supabase if available
    if (supabase) {
      let query = supabase
        .from('aesthetic_categories')
        .select('*')
        .order('trending_level', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('parent_category', category)
      }

      const { data, error } = await query
      if (!error && data) {
        aesthetics = data
      }
    }

    // Use fallback if no data
    if (aesthetics.length === 0) {
      aesthetics = getFallbackAesthetics()
    }

    // Calculate trending direction
    const trending = aesthetics.map((aesthetic: any) => ({
      ...aesthetic,
      trending_direction: aesthetic.trending_level > 80 ? 'hot' : 
                         aesthetic.trending_level > 60 ? 'rising' : 'stable'
    }))

    return NextResponse.json({
      aesthetics: trending,
      count: trending.length,
    })

  } catch (error) {
    console.error('Error fetching trending aesthetics:', error)
    const fallback = getFallbackAesthetics().map(a => ({
      ...a,
      trending_direction: a.trending_level > 80 ? 'hot' : 
                         a.trending_level > 60 ? 'rising' : 'stable'
    }))
    return NextResponse.json({
      aesthetics: fallback,
      count: fallback.length,
      error: (error as Error).message
    })
  }
}

function getFallbackAesthetics() {
  return [
    {
      id: '1',
      name: 'Quiet Luxury',
      slug: 'quiet-luxury',
      description: 'Old money meets modern minimalism. Quality over quantity, investment pieces, understated elegance.',
      key_elements: ['minimal branding', 'natural fabrics', 'neutral palette', 'timeless silhouettes'],
      color_palette: ['#F5F1E8', '#D4C4B0', '#8B7355', '#4A4A4A'],
      image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
      trending_level: 95,
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
    }
  ]
}