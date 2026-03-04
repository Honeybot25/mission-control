'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Activity, Clock } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  project: string;
  status: 'created' | 'started' | 'in-progress' | 'paused' | 'completed' | 'failed';
  description: string;
  estimated_impact: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  error?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle size={18} />,
  failed: <XCircle size={18} />,
  'in-progress': <Activity size={18} />,
  started: <Activity size={18} />,
  created: <Activity size={18} />,
  paused: <Activity size={18} />,
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-600 border-green-200',
  failed: 'bg-red-100 text-red-600 border-red-200',
  'in-progress': 'bg-blue-100 text-blue-600 border-blue-200',
  started: 'bg-amber-100 text-amber-600 border-amber-200',
  paused: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function LiveActivityFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=20');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="lg:col-span-2 border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Live Activity</CardTitle>
          <p className="text-sm text-slate-500">Real-time agent logging</p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className="text-slate-600" />
        </button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600">No activity yet. Agents will log here.</p>
            <p className="text-sm text-slate-400 mt-2">
              POST to /api/logs to add activity
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${statusColors[log.status] || 'bg-slate-100 text-slate-600'}`}
                >
                  {statusIcons[log.status] || <Activity size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900 capitalize">
                      {log.agent}
                    </span>
                    <Badge className={`text-xs ${{
                      low: 'bg-slate-100 text-slate-600',
                      medium: 'bg-blue-100 text-blue-600',
                      high: 'bg-amber-100 text-amber-600',
                      critical: 'bg-red-100 text-red-600',
                    }[log.estimated_impact]}`}>
                      {log.estimated_impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{log.description}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400">{log.project}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock size={14} />
                      {formatTime(log.timestamp)}
                    </span>
                    {log.duration && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">
                          {Math.floor(log.duration / 60)}m {log.duration % 60}s
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
