'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TaskComment } from '@/types/mentions';
import { MentionHighlighter } from './MentionHighlighter';
import { MentionInput } from '@/components/mentions/MentionInput';
import { Agent } from '@/lib/supabase-client';
import { 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  CornerDownRight,
  Clock,
  Send,
  Loader2,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskThreadProps {
  taskId: string;
  comments: TaskComment[];
  agents: Agent[];
  currentAgentId?: string;
  onAddComment: (content: string, parentCommentId?: string) => Promise<void>;
  loading?: boolean;
  maxDepth?: number;
}

export function TaskThread({
  taskId,
  comments,
  agents,
  currentAgentId,
  onAddComment,
  loading = false,
  maxDepth = 3,
}: TaskThreadProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create agent map for mention highlighting
  const agentMap = new Map(agents.map(a => [a.slug, { name: a.name, slug: a.slug }]));

  // Toggle comment expansion
  const toggleExpand = (commentId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Handle main comment submit
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply submit
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAddComment(replyContent, parentId);
      setReplyContent('');
      setReplyingTo(null);
    } finally {
      setIsSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment count */}
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <MessageCircle size={16} />
        <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            agents={agents}
            agentMap={agentMap}
            depth={0}
            maxDepth={maxDepth}
            isExpanded={expandedComments.has(comment.id)}
            isReplying={replyingTo === comment.id}
            onToggleExpand={() => toggleExpand(comment.id)}
            onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            replyContent={replyContent}
            onReplyChange={setReplyContent}
            onSubmitReply={() => handleSubmitReply(comment.id)}
            isSubmitting={isSubmitting}
            formatTime={formatTimeAgo}
          />
        ))}
      </div>

      {/* Add comment */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <User size={16} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <MentionInput
              agents={agents}
              value={newComment}
              onChange={setNewComment}
              placeholder="Add a comment... Type @ to mention agents"
              rows={3}
              disabled={isSubmitting}
              onSubmit={handleSubmitComment}
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: TaskComment;
  agents: Agent[];
  agentMap: Map<string, { name: string; slug: string }>;
  depth: number;
  maxDepth: number;
  isExpanded: boolean;
  isReplying: boolean;
  onToggleExpand: () => void;
  onReply: () => void;
  replyContent: string;
  onReplyChange: (value: string) => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  formatTime: (timestamp: string) => string;
}

function CommentItem({
  comment,
  agents,
  agentMap,
  depth,
  maxDepth,
  isExpanded,
  isReplying,
  onToggleExpand,
  onReply,
  replyContent,
  onReplyChange,
  onSubmitReply,
  isSubmitting,
  formatTime,
}: CommentItemProps) {
  const author = comment.author;
  const hasReplies = comment.reply_count && comment.reply_count > 0;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-white/10 pl-4' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
          {author ? (
            <span className="text-xs font-bold text-zinc-400">
              {author.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User size={14} className="text-zinc-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-lg p-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              {author ? (
                <Link
                  href={`/agents/${author.slug}`}
                  className="font-medium text-white hover:text-indigo-400 transition-colors"
                >
                  {author.name}
                </Link>
              ) : (
                <span className="font-medium text-zinc-400">Unknown</span>
              )}
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock size={12} />
                {formatTime(comment.created_at)}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-zinc-600">(edited)</span>
              )}
            </div>

            {/* Message */}
            <div className="text-sm text-zinc-300 leading-relaxed">
              <MentionHighlighter text={comment.content} agentMap={agentMap} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1.5">
            <button
              onClick={onReply}
              className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
            >
              Reply
            </button>
            {hasReplies && (
              <button
                onClick={onToggleExpand}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={12} />
                    Hide {comment.reply_count} replies
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} />
                    Show {comment.reply_count} replies
                  </>
                )}
              </button>
            )}
          </div>

          {/* Reply input */}
          {isReplying && (
            <div className="mt-3 flex items-start gap-3">
              <CornerDownRight size={16} className="text-zinc-600 mt-3" />
              <div className="flex-1">
                <MentionInput
                  agents={agents}
                  value={replyContent}
                  onChange={onReplyChange}
                  placeholder="Write a reply..."
                  rows={2}
                  disabled={isSubmitting}
                  onSubmit={onSubmitReply}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReplyChange('')}
                    className="text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSubmitReply}
                    disabled={!replyContent.trim() || isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin mr-2" />
                    ) : (
                      <Send size={14} className="mr-2" />
                    )}
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {hasReplies && isExpanded && comment.replies && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              agents={agents}
              agentMap={agentMap}
              depth={depth + 1}
              maxDepth={maxDepth}
              isExpanded={false}
              isReplying={false}
              onToggleExpand={() => {}}
              onReply={() => {}}
              replyContent=""
              onReplyChange={() => {}}
              onSubmitReply={() => {}}
              isSubmitting={isSubmitting}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}