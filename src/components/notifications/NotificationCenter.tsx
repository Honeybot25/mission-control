'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Notification } from '@/types/mentions';
import { 
  Bell, 
  AtSign, 
  MessageCircle, 
  CheckCircle2, 
  Clock,
  Filter,
  CheckCheck,
  Trash2,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  agentMap: Map<string, { name: string; slug: string }>;
}

export function NotificationCenter({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  agentMap,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'mentions') return n.type === 'mention';
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign size={20} className="text-indigo-400" />;
      case 'reply':
        return <MessageCircle size={20} className="text-green-400" />;
      case 'task_assigned':
        return <CheckCircle2 size={20} className="text-blue-400" />;
      case 'task_completed':
        return <CheckCircle2 size={20} className="text-green-400" />;
      default:
        return <Bell size={20} className="text-zinc-400" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatFullDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
                Mission Control
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">Notifications</span>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="border-white/10 hover:bg-white/5"
                >
                  <CheckCheck size={16} className="mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Bell size={20} className="text-indigo-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{notifications.length}</div>
                <div className="text-sm text-zinc-500">Total notifications</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AtSign size={20} className="text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unreadCount}</div>
                <div className="text-sm text-zinc-500">Unread</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MessageCircle size={20} className="text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'mention').length}
                </div>
                <div className="text-sm text-zinc-500">Mentions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-indigo-600">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-indigo-600">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="mentions" className="data-[state=active]:bg-indigo-600">
              Mentions
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notification List */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Bell size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">No notifications</p>
              <p className="text-sm mt-1">
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : filter === 'mentions'
                  ? "No mentions yet"
                  : "No notifications to show"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const sender = notification.sender_agent_id 
                ? agentMap.get(notification.sender_agent_id)
                : null;

              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    !notification.is_read 
                      ? 'bg-indigo-500/5 border-indigo-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {sender && (
                            <Link
                              href={`/agents/${sender.slug}`}
                              className="font-semibold text-white hover:text-indigo-400 transition-colors"
                            >
                              {sender.name}
                            </Link>
                          )}
                          <span className="text-zinc-400">{notification.title}</span>
                          {!notification.is_read && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-400 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        
                        {notification.message && (
                          <p className="text-sm text-zinc-400 mt-1">
                            {notification.message}
                          </p>
                        )}

                        {notification.related_task && (
                          <Link
                            href={`/tasks/${notification.related_task.id}`}
                            className="inline-block mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                          >
                            View task →
                          </Link>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          <span>•</span>
                          <span>{formatFullDate(notification.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsRead(notification.id)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <CheckCheck size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}