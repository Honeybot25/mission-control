import { NextRequest, NextResponse } from 'next/server'
import {
  getOptionsSignals,
  getActiveOptionsSignals,
  getOptionsSignalById,
  createOptionsSignal,
  updateOptionsSignal,
  getRecentOptionsSignals,
  getOptionsSignalStats,
  getSignalSymbols,
} from '@/lib/options-signals-db'
import type { SignalFilters, OptionsSignal } from '@/types/options-signals'

/**
 * GET /api/options-signals
 * 
 * Query params:
 * - id: Get specific signal by ID
 * - active: Get only active signals (true/false)
 * - recent: Get signals from last N hours (e.g., recent=24)
 * - stats: Get signal statistics (true/false)
 * - symbols: Get unique symbols list (true/false)
 * - symbol: Filter by symbol
 * - direction: Filter by direction (BULLISH/BEARISH/NEUTRAL)
 * - type: Filter by signal type
 * - status: Filter by status
 * - minConfidence: Minimum confidence (0-1)
 * - limit: Limit results (default 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check for specific query types
    const id = searchParams.get('id')
    const active = searchParams.get('active') === 'true'
    const recent = searchParams.get('recent')
    const stats = searchParams.get('stats') === 'true'
    const symbols = searchParams.get('symbols') === 'true'
    
    // Get specific signal by ID
    if (id) {
      const signal = await getOptionsSignalById(id)
      if (!signal) {
        return NextResponse.json(
          { error: 'Signal not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ signal })
    }
    
    // Get active signals only
    if (active) {
      const limit = parseInt(searchParams.get('limit') || '50')
      const signals = await getActiveOptionsSignals(limit)
      return NextResponse.json({ signals, count: signals.length })
    }
    
    // Get recent signals
    if (recent) {
      const hours = parseInt(recent) || 24
      const signals = await getRecentOptionsSignals(hours)
      return NextResponse.json({ signals, count: signals.length, hours })
    }
    
    // Get statistics
    if (stats) {
      const statistics = await getOptionsSignalStats()
      return NextResponse.json({ stats: statistics })
    }
    
    // Get unique symbols
    if (symbols) {
      const symbolList = await getSignalSymbols()
      return NextResponse.json({ symbols: symbolList })
    }
    
    // Build filters from query params
    const filters: SignalFilters = {}
    
    const symbol = searchParams.get('symbol')
    if (symbol) filters.symbol = symbol
    
    const direction = searchParams.get('direction')
    if (direction) filters.direction = direction as SignalFilters['direction']
    
    const type = searchParams.get('type')
    if (type) filters.signalType = type as SignalFilters['signalType']
    
    const status = searchParams.get('status')
    if (status) filters.status = status as SignalFilters['status']
    
    const minConfidence = searchParams.get('minConfidence')
    if (minConfidence) filters.minConfidence = parseFloat(minConfidence)
    
    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) filters.dateFrom = dateFrom
    
    const dateTo = searchParams.get('dateTo')
    if (dateTo) filters.dateTo = dateTo
    
    const limit = parseInt(searchParams.get('limit') || '100')
    
    // Get signals with filters
    const signals = await getOptionsSignals(Object.keys(filters).length > 0 ? filters : undefined, limit)
    
    return NextResponse.json({ 
      signals, 
      count: signals.length,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    })
    
  } catch (error) {
    console.error('[API Options Signals] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch options signals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/options-signals
 * 
 * Create a new options signal from TraderBot
 * 
 * Body:
 * - All fields from OptionsSignal except id, created_at, updated_at
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['symbol', 'signal_type', 'direction', 'confidence']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate confidence range
    if (body.confidence < 0 || body.confidence > 1) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 1' },
        { status: 400 }
      )
    }
    
    // Validate direction
    const validDirections = ['BULLISH', 'BEARISH', 'NEUTRAL']
    if (!validDirections.includes(body.direction)) {
      return NextResponse.json(
        { error: `Invalid direction. Must be one of: ${validDirections.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate signal type
    const validTypes = ['CALL', 'PUT', 'STRADDLE', 'STRANGLE', 'IRON_CONDOR', 
                       'BUTTERFLY', 'CALENDAR_SPREAD', 'DIAGONAL', 'VERTICAL_SPREAD', 'HOLD']
    if (!validTypes.includes(body.signal_type)) {
      return NextResponse.json(
        { error: `Invalid signal_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Create the signal
    const signal = await createOptionsSignal(body)
    
    if (!signal) {
      return NextResponse.json(
        { error: 'Failed to create options signal' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: true, signal },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('[API Options Signals] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create options signal' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/options-signals
 * 
 * Update an existing options signal
 * 
 * Body:
 * - id: Signal ID (required)
 * - ...fields to update
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      )
    }
    
    // Validate confidence if provided
    if (updates.confidence !== undefined && (updates.confidence < 0 || updates.confidence > 1)) {
      return NextResponse.json(
        { error: 'Confidence must be between 0 and 1' },
        { status: 400 }
      )
    }
    
    const signal = await updateOptionsSignal(id, updates)
    
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found or failed to update' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, signal })
    
  } catch (error) {
    console.error('[API Options Signals] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update options signal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/options-signals
 * 
 * Cancel/delete an options signal (sets status to CANCELLED)
 * 
 * Query params:
 * - id: Signal ID to cancel
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing required query param: id' },
        { status: 400 }
      )
    }
    
    const signal = await updateOptionsSignal(id, { status: 'CANCELLED' })
    
    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Signal cancelled',
      signal 
    })
    
  } catch (error) {
    console.error('[API Options Signals] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel options signal' },
      { status: 500 }
    )
  }
}
