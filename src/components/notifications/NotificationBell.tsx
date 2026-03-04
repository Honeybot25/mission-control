'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Notification } from '@/types/mentions';
import { 
  Bell, 
  AtSign, 
  MessageCircle, 
  CheckCircle2, 
  Clock,
  X,
  Loader2,
  User
} from 'lucide-react';

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  agentMap: Map<string, { name: string; slug: string }>;
}

export function NotificationBell({
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  agentMap,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign size={16} className="text-indigo-400" />;
      case 'reply':
        return <MessageCircle size={16} className="text-green-400" />;
      case 'task_assigned':
        return <CheckCircle2 size={16} className="text-blue-400" />;
      case 'task_completed':
        return <CheckCircle2 size={16} className="text-green-400" />;
      default:
        return <Bell size={16} className="text-zinc-400" />;
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold bg-red-500 text-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    onMarkAllAsRead();
                  }}
                  className="px-2 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <Bell size={32} className="mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  agentMap={agentMap}
                  onMarkAsRead={onMarkAsRead}
                  getIcon={getNotificationIcon}
                  formatTime={formatTimeAgo}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-zinc-900/50">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-zinc-400 hover:text-white transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  agentMap: Map<string, { name: string; slug: string }>;
  onMarkAsRead: (id: string) => void;
  getIcon: (type: string) => React.ReactNode;
  formatTime: (timestamp: string) => string;
}

function NotificationItem({ notification, agentMap, onMarkAsRead, getIcon, formatTime }: NotificationItemProps) {
  const sender = notification.sender_agent_id 
    ? agentMap.get(notification.sender_agent_id)
    : null;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-indigo-500/5' : ''
      }`}
      onClick={() => {
        if (!notification.is_read) {
          onMarkAsRead(notification.id);
        }
        if (notification.link_to) {
          window.location.href = notification.link_to;
        }
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
        {getIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-white leading-tight">
            {sender && (
              <span className="font-medium">{sender.name} </span>
            )}
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
          )}
        </div>
        
        {notification.message && (
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}

        {notification.related_task && (
          <p className="text-xs text-zinc-500 mt-1">
            Task: {notification.related_task.input_summary?.slice(0, 50)}...
          </p>
        )}

        <div className="flex items-center gap-1 mt-1.5 text-xs text-zinc-500">
          <Clock size={12} />
          {formatTime(notification.created_at)}
        </div>
      </div>
    </div>
  );
}