import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const notionToken = process.env.NOTION_TOKEN

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Notion database ID from the URL provided
const NOTION_DATABASE_ID = '309cf0ef753881919011d4c9a12683fe'

export async function GET(request: NextRequest) {
  try {
    // Check for required env vars
    if (!notionToken) {
      return NextResponse.json({ 
        items: [],
        error: 'Notion token not configured',
        source: 'error'
      })
    }

    // Fetch from Notion API
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 100,
      }),
    })

    if (!notionResponse.ok) {
      const error = await notionResponse.json()
      console.error('Notion API error:', error)
      // Return cached data from Supabase if Notion API fails (and supabase is available)
      if (supabase) {
        const { data: cachedItems, error: cacheError } = await supabase
          .from('notion_items')
          .select('*')
          .order('last_synced', { ascending: false })
          .limit(50)
        
        if (!cacheError) {
          return NextResponse.json({ 
            items: cachedItems || [],
            source: 'cache',
            error: 'Failed to fetch from Notion API'
          })
        }
      }
      return NextResponse.json({ 
        items: [],
        source: 'error',
        error: 'Failed to fetch from Notion API'
      })
    }

    const notionData = await notionResponse.json()
    
    // Transform Notion data to our format
    const items = notionData.results.map((page: any) => {
      const properties = page.properties
      return {
        notion_id: page.id,
        title: properties.Name?.title?.[0]?.plain_text || 'Untitled',
        category: properties.Category?.select?.name || 'general',
        tags: properties.Tags?.multi_select?.map((t: any) => t.name) || [],
        url: page.url,
        image_url: properties.Image?.files?.[0]?.file?.url || properties.Image?.url || null,
        notes: properties.Notes?.rich_text?.[0]?.plain_text || '',
        properties: properties,
        last_edited: page.last_edited_time,
      }
    })

    // Upsert to Supabase for caching (if available)
    if (supabase) {
      const { error: upsertError } = await supabase
        .from('notion_items')
        .upsert(items.map((item: any) => ({
          ...item,
          last_synced: new Date().toISOString(),
        })), {
          onConflict: 'notion_id',
        })

      if (upsertError) {
        console.error('Supabase upsert error:', upsertError)
      }
    }

    return NextResponse.json({ 
      items,
      source: 'notion',
      count: items.length,
      last_synced: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error syncing Notion:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Notion', details: (error as Error).message },
      { status: 500 }
    )
  }
}