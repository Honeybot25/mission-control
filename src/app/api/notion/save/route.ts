import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const notionToken = process.env.NOTION_TOKEN

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const NOTION_DATABASE_ID = '309cf0ef753881919011d4c9a12683fe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, tags, notes, image_url } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!notionToken) {
      return NextResponse.json(
        { error: 'Notion not configured' },
        { status: 503 }
      )
    }

    // Create page in Notion
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: {
            title: [{ text: { content: title } }]
          },
          Category: {
            select: { name: category || 'general' }
          },
          Tags: {
            multi_select: (tags || []).map((tag: string) => ({ name: tag }))
          },
          Notes: {
            rich_text: [{ text: { content: notes || '' } }]
          },
        },
      }),
    })

    if (!notionResponse.ok) {
      const error = await notionResponse.json()
      console.error('Notion API error:', error)
      return NextResponse.json(
        { error: 'Failed to create Notion page', details: error },
        { status: 500 }
      )
    }

    const notionData = await notionResponse.json()

    // Also save to Supabase for quick access (if available)
    if (supabase) {
      await supabase
        .from('notion_items')
        .upsert({
          notion_id: notionData.id,
          title,
          category: category || 'general',
          tags: tags || [],
          url: notionData.url,
          image_url,
          notes,
          last_synced: new Date().toISOString(),
        })
    }

    return NextResponse.json({
      success: true,
      notion_id: notionData.id,
      url: notionData.url,
    })

  } catch (error) {
    console.error('Error saving to Notion:', error)
    return NextResponse.json(
      { error: 'Failed to save to Notion', details: (error as Error).message },
      { status: 500 }
    )
  }
}