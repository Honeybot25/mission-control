'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Notification } from '@/types/mentions';

export function useNotifications(agentId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!agentId || !supabase) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_agent_id(id, name, slug),
          related_task:related_task_id(id, input_summary, status)
        `)
        .eq('recipient_agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!agentId || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_agent_id', agentId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [agentId]);

  // Create notification
  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to create notification:', err);
      return null;
    }
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!agentId || !supabase) return;

    fetchNotifications();

    const subscription = supabase
      .channel(`notifications:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_agent_id=eq.${agentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            if (!(payload.new as Notification).is_read) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [agentId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
  };
}

// Hook for task comments
export function useTaskComments(taskId?: string) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    
    try {
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          author:author_agent_id(id, name, slug),
          reply_count:task_comments!parent_comment_id(count)
        `)
        .eq('task_id', taskId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Add comment
  const addComment = useCallback(async (content: string, parentCommentId?: string) => {
    if (!taskId || !supabase) return null;
    
    try {
      const mentions = parseMentions(content);
      
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          content,
          mentions,
          parent_comment_id: parentCommentId || null,
        }])
        .select(`
          *,
          author:author_agent_id(id, name, slug)
        `)
        .single();

      if (error) throw error;
      
      if (!parentCommentId) {
        setComments(prev => [...prev, data]);
      }
      
      return data;
    } catch (err) {
      console.error('Failed to add comment:', err);
      return null;
    }
  }, [taskId]);

  // Subscribe to real-time comments
  useEffect(() => {
    if (!taskId || !supabase) return;

    fetchComments();

    const subscription = supabase
      .channel(`task_comments:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
  };
}

// Helper function to parse mentions (shared)
function parseMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  // Deduplicate
  const unique: string[] = [];
  for (const m of mentions) {
    if (!unique.includes(m)) unique.push(m);
  }
  return unique;
}

interface TaskComment {
  id: string;
  task_id: string;
  author_agent_id: string | null;
  parent_comment_id: string | null;
  content: string;
  mentions: string[];
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    slug: string;
  };
  reply_count?: number;
}