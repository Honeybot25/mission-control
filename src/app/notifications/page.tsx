'use client';

import { useEffect, useState } from 'react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Notification } from '@/types/mentions';
import { Agent } from '@/lib/supabase-client';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentAgentId, setCurrentAgentId] = useState<string>('');

  // Fetch agents on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/logs?type=agents');
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      }
    };
    fetchAgents();
  }, []);

  // For now, use a default agent or let user select
  useEffect(() => {
    if (agents.length > 0 && !currentAgentId) {
      setCurrentAgentId(agents[0].id);
    }
  }, [agents, currentAgentId]);

  // Fetch notifications
  useEffect(() => {
    if (!currentAgentId) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/notifications?agentId=${currentAgentId}&limit=100`);
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentAgentId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentAgentId) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: currentAgentId, markAll: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Create agent map
  const agentMap = new Map(agents.map(a => [a.id, { name: a.name, slug: a.slug }]));

  return (
    <NotificationCenter
      notifications={notifications}
      unreadCount={unreadCount}
      loading={loading}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      agentMap={agentMap}
    />
  );
}