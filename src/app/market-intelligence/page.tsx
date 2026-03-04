"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  YouTubeAnalysis, 
  getYouTubeAnalyses, 
  subscribeToYouTubeAnalyses,
  markAsAddedToKnowledge 
} from "@/lib/youtube-analytics";
import { 
  Play, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Eye, 
  ThumbsUp,
  RefreshCw,
  Plus,
  Check,
  Loader2,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface VideoCardProps {
  analysis: YouTubeAnalysis;
  onAddToKnowledge: (videoId: string) => Promise<void>;
  isAdding: boolean;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const config = {
    bullish: { icon: TrendingUp, color: "bg-green-500", text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    bearish: { icon: TrendingDown, color: "bg-red-500", text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    neutral: { icon: Minus, color: "bg-slate-500", text: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  };
  
  const { icon: Icon, text, bg, border } = config[sentiment as keyof typeof config] || config.neutral;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${border} border`}>
      <Icon size={14} className={text} />
      <span className={`text-xs font-medium capitalize ${text}`}>{sentiment}</span>
    </div>
  );
}

function VideoCard({ analysis, onAddToKnowledge, isAdding }: VideoCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const handleAddToKnowledge = async () => {
    await onAddToKnowledge(analysis.video_id);
  };

  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-900 hover:border-slate-700 transition-all">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-800 group">
        <img 
          src={analysis.thumbnail_url} 
          alt={analysis.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a 
            href={analysis.video_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <Play size={18} />
            Watch Video
          </a>
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
          {Math.floor(analysis.duration_seconds / 60)}:{String(analysis.duration_seconds % 60).padStart(2, '0')}
        </div>
        
        {/* Sentiment badge */}
        <div className="absolute top-2 left-2">
          <SentimentBadge sentiment={analysis.sentiment} />
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-slate-100 mb-2 line-clamp-2 hover:text-blue-400 transition-colors">
          <a href={analysis.video_url} target="_blank" rel="noopener noreferrer">
            {analysis.title}
          </a>
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDistanceToNow(new Date(analysis.published_at), { addSuffix: true })}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {analysis.view_count.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} />
            {analysis.like_count.toLocaleString()}
          </span>
        </div>

        {/* AI Summary */}
        <div className="mb-3">
          <p className="text-sm text-slate-300 line-clamp-2">{analysis.summary}</p>
        </div>

        {/* Key Points */}
        <div className="space-y-1 mb-4">
          {analysis.key_points.slice(0, expanded ? undefined : 3).map((point, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <span className="text-blue-400 mt-1">•</span>
              <span className="text-slate-400">{point}</span>
            </div>
          ))}
        </div>

        {/* Trading Insights Preview */}
        {analysis.trading_insights && (
          <div className="border-t border-slate-800 pt-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Trading Insights</span>
            </div>
            
            {/* Assets */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {analysis.assets.slice(0, 4).map((asset) => (
                <Badge key={asset} variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                  {asset}
                </Badge>
              ))}
            </div>

            {/* Key Levels */}
            {(analysis.trading_insights.key_levels?.support?.length > 0 || 
              analysis.trading_insights.key_levels?.resistance?.length > 0) && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {analysis.trading_insights.key_levels.support.slice(0, 2).map((level, idx) => (
                  <div key={`s-${idx}`} className="flex items-center gap-1 text-green-400">
                    <ArrowDownRight size={10} />
                    <span>Support: {level}</span>
                  </div>
                ))}
                {analysis.trading_insights.key_levels.resistance.slice(0, 2).map((level, idx) => (
                  <div key={`r-${idx}`} className="flex items-center gap-1 text-red-400">
                    <ArrowUpRight size={10} />
                    <span>Resistance: {level}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Trade Setups */}
            {analysis.trading_insights.setups && analysis.trading_insights.setups.length > 0 && (
              <div className="mt-2 space-y-1">
                {analysis.trading_insights.setups.slice(0, 2).map((setup, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <Target size={10} className={setup.direction === 'long' ? 'text-green-400' : setup.direction === 'short' ? 'text-red-400' : 'text-slate-400'} />
                    <span className="text-slate-300">{setup.pair}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${setup.direction === 'long' ? 'border-green-500/30 text-green-400' : setup.direction === 'short' ? 'border-red-500/30 text-red-400' : 'border-slate-600 text-slate-400'}`}
                    >
                      {setup.direction.toUpperCase()}
                    </Badge>
                    {setup.entry && <span className="text-slate-500">@ {setup.entry}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show Less' : 'Show More'}
          </Button>
          
          <Button
            variant={analysis.added_to_knowledge ? "ghost" : "outline"}
            size="sm"
            className={`flex-1 ${analysis.added_to_knowledge ? 'text-green-400' : 'border-blue-600/30 text-blue-400 hover:bg-blue-600/10'}`}
            onClick={handleAddToKnowledge}
            disabled={isAdding || analysis.added_to_knowledge}
          >
            {isAdding ? (
              <Loader2 size={14} className="animate-spin mr-1" />
            ) : analysis.added_to_knowledge ? (
              <Check size={14} className="mr-1" />
            ) : (
              <Plus size={14} className="mr-1" />
            )}
            {analysis.added_to_knowledge ? 'Added' : 'Add to Knowledge'}
          </Button>

          <a 
            href={analysis.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketIntelligencePage() {
  const [analyses, setAnalyses] = useState<YouTubeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const [addingToKnowledge, setAddingToKnowledge] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');

  // Fetch analyses
  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getYouTubeAnalyses(20);
      setAnalyses(data);
    } catch (err) {
      console.error('[Market Intelligence] Fetch error:', err);
      setError('Failed to load analyses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Subscribe to realtime updates
  useEffect(() => {
    const subscription = subscribeToYouTubeAnalyses((payload) => {
      setIsRealtime(true);
      setAnalyses(prev => [payload.new, ...prev.filter(a => a.video_id !== payload.new.video_id)]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Trigger monitor check
    try {
      const response = await fetch('/api/youtube/monitor?limit=5');
      const data = await response.json();
      
      if (data.success && data.newVideos > 0) {
        // Re-fetch to get new data
        await fetchAnalyses();
      }
    } catch (err) {
      console.error('[Market Intelligence] Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Add to knowledge handler
  const handleAddToKnowledge = async (videoId: string) => {
    setAddingToKnowledge(prev => new Set(prev).add(videoId));
    
    try {
      const success = await markAsAddedToKnowledge(videoId);
      
      if (success) {
        setAnalyses(prev => prev.map(a => 
          a.video_id === videoId ? { ...a, added_to_knowledge: true } : a
        ));
      }
    } catch (err) {
      console.error('[Market Intelligence] Add to knowledge error:', err);
    } finally {
      setAddingToKnowledge(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }
  };

  // Filter analyses
  const filteredAnalyses = analyses.filter(a => 
    filter === 'all' || a.sentiment === filter
  );

  // Stats
  const stats = {
    total: analyses.length,
    bullish: analyses.filter(a => a.sentiment === 'bullish').length,
    bearish: analyses.filter(a => a.sentiment === 'bearish').length,
    neutral: analyses.filter(a => a.sentiment === 'neutral').length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-100">Market Intelligence</h1>
                {isRealtime && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-slate-400">
                AI-analyzed trading insights from FX Evolution
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Checking...' : 'Check for New'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
              <p className="text-sm text-slate-400">Total Analyses</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-400">{stats.bullish}</p>
              <p className="text-sm text-slate-400">Bullish</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-red-400">{stats.bearish}</p>
              <p className="text-sm text-slate-400">Bearish</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-400">{stats.neutral}</p>
              <p className="text-sm text-slate-400">Neutral</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-800">All</TabsTrigger>
            <TabsTrigger value="bullish" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">Bullish</TabsTrigger>
            <TabsTrigger value="bearish" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">Bearish</TabsTrigger>
            <TabsTrigger value="neutral" className="data-[state=active]:bg-slate-700">Neutral</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-8 text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <Button onClick={fetchAnalyses} variant="outline" className="border-slate-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredAnalyses.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="p-8 text-center">
              <BarChart3 size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 mb-2">No analyses found</p>
              <p className="text-slate-500 text-sm mb-4">
                {filter === 'all' 
                  ? 'Videos will appear here once they are analyzed. Click "Check for New" to scan for updates.' 
                  : `No ${filter} analyses found. Try a different filter.`}
              </p>
              {filter === 'all' && (
                <Button onClick={handleRefresh} variant="outline" className="border-slate-700">
                  <RefreshCw size={16} className="mr-2" />
                  Check Now
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis) => (
              <VideoCard
                key={analysis.video_id}
                analysis={analysis}
                onAddToKnowledge={handleAddToKnowledge}
                isAdding={addingToKnowledge.has(analysis.video_id)}
              />
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 size={16} className="text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-200">About Market Intelligence</h4>
              <p className="text-sm text-slate-400 mt-1">
                This page automatically monitors FX Evolution&apos;s YouTube channel for new trading analysis videos. 
                Each video is processed by AI to extract key insights, support/resistance levels, and trade setups. 
                New videos are checked every 6 hours and posted to #trading-alerts.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
