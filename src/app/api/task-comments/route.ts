import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

// GET /api/task-comments - Get comments for a task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const parentCommentId = searchParams.get('parentCommentId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    let query = supabase
      .from('task_comments')
      .select(`
        *,
        author:author_agent_id(id, name, slug),
        reply_count:task_comments!parent_comment_id(count)
      `)
      .eq('task_id', taskId);

    if (parentCommentId) {
      // Get replies to a specific comment
      query = query.eq('parent_comment_id', parentCommentId);
    } else {
      // Get top-level comments
      query = query.is('parent_comment_id', null);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('[API TaskComments] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: data || [] });
  } catch (error) {
    console.error('[API TaskComments] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/task-comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      taskId,
      content,
      parentCommentId,
      authorAgentId,
    } = body;

    if (!taskId || !content) {
      return NextResponse.json(
        { error: 'taskId and content are required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    // Extract mentions from content
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from('task_comments')
      .insert([{
        task_id: taskId,
        content,
        author_agent_id: authorAgentId || null,
        parent_comment_id: parentCommentId || null,
        mentions: Array.from(new Set(mentions)), // Remove duplicates
      }])
      .select(`
        *,
        author:author_agent_id(id, name, slug)
      `)
      .single();

    if (commentError) {
      console.error('[API TaskComments] Create error:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment', details: commentError.message },
        { status: 500 }
      );
    }

    // Create notifications for mentioned agents
    if (mentions.length > 0) {
      // Get agent IDs from slugs
      const { data: mentionedAgents } = await supabase
        .from('agents')
        .select('id, slug')
        .in('slug', mentions);

      if (mentionedAgents && mentionedAgents.length > 0) {
        // Get task info for the notification
        const { data: task } = await supabase
          .from('agent_runs')
          .select('input_summary')
          .eq('id', taskId)
          .single();

        const notifications = mentionedAgents.map(agent => ({
          recipient_agent_id: agent.id,
          sender_agent_id: authorAgentId || null,
          type: 'mention',
          title: 'mentioned you in a comment',
          message: content.slice(0, 200),
          link_to: `/tasks/${taskId}`,
          related_task_id: taskId,
          related_comment_id: comment.id,
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }

    // Notify parent comment author of reply
    if (parentCommentId) {
      const { data: parentComment } = await supabase
        .from('task_comments')
        .select('author_agent_id')
        .eq('id', parentCommentId)
        .single();

      if (parentComment?.author_agent_id && parentComment.author_agent_id !== authorAgentId) {
        await supabase.from('notifications').insert([{
          recipient_agent_id: parentComment.author_agent_id,
          sender_agent_id: authorAgentId || null,
          type: 'reply',
          title: 'replied to your comment',
          message: content.slice(0, 200),
          link_to: `/tasks/${taskId}`,
          related_task_id: taskId,
          related_comment_id: comment.id,
        }]);
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('[API TaskComments] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/task-comments - Update a comment
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'commentId and content are required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    // Extract mentions from updated content
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    const { data, error } = await supabase
      .from('task_comments')
      .update({
        content,
        mentions: Array.from(new Set(mentions)),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select(`
        *,
        author:author_agent_id(id, name, slug)
      `)
      .single();

    if (error) {
      console.error('[API TaskComments] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update comment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: data });
  } catch (error) {
    console.error('[API TaskComments] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/task-comments - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('[API TaskComments] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('[API TaskComments] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}