'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TaskThread } from '@/components/activity/TaskThread';
import { MentionHighlighter } from '@/components/activity/MentionHighlighter';
import { Agent, AgentRun } from '@/lib/supabase-client';
import { TaskComment } from '@/types/mentions';
import { 
  ArrowLeft, 
  Bot, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  MessageCircle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<AgentRun | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentMap, setAgentMap] = useState<Map<string, { name: string; slug: string }>>(new Map());

  // Fetch task and comments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch task details
        const taskResponse = await fetch(`/api/logs?type=runs&limit=1`);
        const taskData = await taskResponse.json();
        const foundTask = taskData.runs?.find((r: AgentRun) => r.id === taskId);
        if (foundTask) {
          setTask(foundTask);
        }

        // Fetch agents
        const agentsResponse = await fetch('/api/logs?type=agents');
        const agentsData = await agentsResponse.json();
        const agentsList = agentsData.agents || [];
        setAgents(agentsList);
        
        // Build agent map
        const map = new Map<string, { name: string; slug: string }>();
        agentsList.forEach((agent: Agent) => {
          map.set(agent.slug, { name: agent.name, slug: agent.slug });
        });
        setAgentMap(map);

        // Fetch comments
        const commentsResponse = await fetch(`/api/task-comments?taskId=${taskId}`);
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments || []);
      } catch (err) {
        console.error('Failed to fetch task data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchData();
    }
  }, [taskId]);

  const handleAddComment = async (content: string, parentCommentId?: string) => {
    try {
      const response = await fetch('/api/task-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          content,
          parentCommentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!parentCommentId) {
          setComments(prev => [...prev, data.comment]);
        }
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'failed':
        return <XCircle size={20} className="text-red-400" />;
      case 'in-progress':
      case 'started':
        return <Loader2 size={20} className="text-yellow-400 animate-spin" />;
      default:
        return <Clock size={20} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'in-progress':
      case 'started':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link href="/tasks" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
            <ArrowLeft size={16} />
            Back to Tasks
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Task Not Found</h1>
            <p className="text-zinc-400">The task you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
              Mission Control
            </Link>
            <span className="text-zinc-600">/</span>
            <Link href="/tasks" className="text-zinc-400 hover:text-white transition-colors">Tasks</Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 truncate max-w-[200px]">Task Details</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link href="/tasks" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} />
          Back to Tasks
        </Link>

        {/* Task Header */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  Task #{task.id.slice(0, 8)}
                </h1>
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </div>
              
              <p className="text-zinc-300 mb-4">
                <MentionHighlighter text={task.input_summary || 'No description'} agentMap={agentMap} />
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Bot size={14} />
                  {task.agent?.name || task.agent_id}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  Created {formatTimeAgo(task.created_at)}
                </span>
                {task.duration_ms && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    Duration: {(task.duration_ms / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              {task.output_summary && (
                <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg">
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Output</h3>
                  <p className="text-sm text-zinc-300">{task.output_summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageCircle size={20} className="text-indigo-400" />
            Discussion
          </h2>
          
          <TaskThread
            taskId={taskId}
            comments={comments}
            agents={agents}
            onAddComment={handleAddComment}
            loading={false}
          />
        </div>
      </main>
    </div>
  );
}