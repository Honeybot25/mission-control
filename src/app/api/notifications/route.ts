import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// GET /api/notifications - Get notifications for an agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread') === 'true';

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    // Simplified query without joins to prevent 500 errors
    // Foreign key relationships may not be properly set up
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API Notifications] Fetch error:', error);
      // Return empty data if table doesn't exist (graceful degradation)
      if (error.message?.includes('Could not find the table') || 
          error.message?.includes('does not exist') ||
          error.code === '42P01') {
        return NextResponse.json({
          notifications: [],
          unreadCount: 0,
          _warning: 'Notifications table not set up yet'
        });
      }
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      );
    }

    // Get unread count (handle missing table gracefully)
    let unreadCount = 0;
    if (data) {
      unreadCount = data.filter(n => !n.is_read).length;
    }

    return NextResponse.json({
      notifications: data || [],
      unreadCount: unreadCount,
    });
  } catch (error) {
    console.error('[API Notifications] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recipient_agent_id,
      sender_agent_id,
      type,
      title,
      message,
      link_to,
      related_task_id,
      related_comment_id,
    } = body;

    if (!recipient_agent_id || !type || !title) {
      return NextResponse.json(
        { error: 'recipient_agent_id, type, and title are required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        recipient_agent_id,
        sender_agent_id: sender_agent_id || null,
        type,
        title,
        message: message || '',
        link_to: link_to || null,
        related_task_id: related_task_id || null,
        related_comment_id: related_comment_id || null,
        is_read: false,
      }])
      .select()
      .single();

    if (error) {
      console.error('[API Notifications] Create error:', error);
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error('[API Notifications] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, agentId, markAll } = body;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    if (markAll && agentId) {
      // Mark all as read for an agent
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('recipient_agent_id', agentId)
        .eq('is_read', false);

      if (error) {
        console.error('[API Notifications] Mark all error:', error);
        return NextResponse.json(
          { error: 'Failed to mark notifications as read', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      // Mark single notification as read
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        console.error('[API Notifications] Update error:', error);
        return NextResponse.json(
          { error: 'Failed to update notification', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ notification: data });
    }

    return NextResponse.json(
      { error: 'Either notificationId or markAll with agentId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API Notifications] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}