import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20')
    const generate = searchParams.get('generate') === 'true'

    let ideas: any[] = []

    // Fetch from Supabase if available
    if (supabase) {
      let query = supabase
        .from('content_ideas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      if (platform) {
        query = query.eq('platform', platform)
      }

      const { data, error } = await query
      if (!error && data) {
        ideas = data
      }
    }

    // Generate AI suggestions if requested
    let suggestions: any[] = []

    if (generate) {
      suggestions = generateAISuggestions()
    }

    return NextResponse.json({
      ideas: ideas,
      suggestions,
      count: ideas.length + suggestions.length,
    })

  } catch (error) {
    console.error('Error fetching content suggestions:', error)
    return NextResponse.json({
      ideas: [],
      suggestions: generateAISuggestions(),
      count: 5,
      error: (error as Error).message
    })
  }
}

function generateAISuggestions() {
  const hooks = [
    'POV: you finally found your aesthetic',
    'This changed everything for me',
    'Stop scrolling if you love [aesthetic]',
    'The aesthetic I wish I knew about sooner',
    'How to get the [aesthetic] look on a budget',
  ]

  const contentTypes = [
    { type: 'GRWM', duration: '45-90s', best_for: 'morning routine, skincare' },
    { type: 'OOTD', duration: '15-30s', best_for: 'outfit showcase' },
    { type: 'Aesthetic Haul', duration: '60-120s', best_for: 'product showcase' },
    { type: 'Transition', duration: '10-20s', best_for: 'outfit change' },
  ]

  const aesthetics = ['Quiet Luxury', 'Clean Girl', 'Pilates Princess', 'Old Money']
  const sounds = ['Makeba', 'What Was I Made For?', 'Rich Girl', 'Sexy Back', 'Pink + White']

  const suggestions = []
  
  for (let i = 0; i < 5; i++) {
    const aesthetic = aesthetics[i % aesthetics.length]
    const sound = sounds[i % sounds.length]
    const content = contentTypes[i % contentTypes.length]
    
    suggestions.push({
      id: `suggested-${i}`,
      title: `${aesthetic} ${content.type}`,
      description: `Create a ${content.type} showcasing ${aesthetic} aesthetic`,
      category: 'fashion',
      content_type: content.type.toLowerCase(),
      platform: 'tiktok',
      hooks: hooks.slice(i, i + 2),
      suggested_audio: sound,
      visual_style: `Natural lighting, ${content.best_for}`,
      is_ai_generated: true,
      confidence_score: Math.floor(Math.random() * 30) + 70,
    })
  }

  return suggestions
}