"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  Calendar,
  PieChart,
  BarChart3,
  Plus,
  Edit3,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  ComposedChart,
  Line
} from "recharts";
import { 
  RevenueStream, 
  RevenueGoal,
  MonthlyProjection,
  getRevenueStreams,
  getRevenueGoals,
  calculateProjections,
  calculateGoalProgress,
  getRevenueStats,
  subscribeToRevenueStreams,
  DEFAULT_REVENUE_GOAL
} from "@/lib/revenue";

const TYPE_COLORS: Record<RevenueStream['type'], string> = {
  trading: '#10b981',
  product: '#3b82f6',
  content: '#8b5cf6',
  service: '#f59e0b',
  other: '#6b7280'
};

interface StatsData {
  totalMonthlyActual: number;
  totalMonthlyProjected: number;
  totalStreams: number;
  activeStreams: number;
  avgGrowthRate: number;
  runRate: number;
  ytdRevenue: number;
}

function ProgressBar({ current, target, label }: { current: number; target: number; label: string }) {
  const percent = Math.min((current / target) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{percent.toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>${current.toLocaleString()}</span>
        <span>${target.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function RevenueForecastPage() {
  const [streams, setStreams] = useState<RevenueStream[]>([]);
  const [goals, setGoals] = useState<RevenueGoal[]>([]);
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<'conservative' | 'realistic' | 'optimistic'>('realistic');
  const [isAddingStream, setIsAddingStream] = useState(false);
  
  // Form state
  const [newStream, setNewStream] = useState({
    name: '',
    type: 'product' as RevenueStream['type'],
    monthly_projected: '',
    growth_rate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const subscription = subscribeToRevenueStreams((payload) => {
      if (payload.event === "INSERT") {
        setStreams(prev => [payload.new, ...prev]);
      } else if (payload.event === "UPDATE") {
        setStreams(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
      } else if (payload.event === "DELETE") {
        setStreams(prev => prev.filter(s => s.id !== payload.old?.id));
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (streams.length > 0) {
      setProjections(calculateProjections(streams, 12));
    }
  }, [streams]);

  async function fetchData() {
    setLoading(true);
    try {
      const [streamsRes, goalsRes, statsRes] = await Promise.all([
        fetch('/api/revenue'),
        fetch('/api/revenue?stats=true'),
        getRevenueStats()
      ]);

      if (streamsRes.ok) {
        const data = await streamsRes.json();
        setStreams(data.streams || []);
        setGoals(data.goals || []);
        if (data.projections) {
          setProjections(data.projections);
        }
      }

      setStats(statsRes);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    }
    setLoading(false);
  }

  async function handleAddStream() {
    if (!newStream.name || !newStream.monthly_projected) return;

    const response = await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'stream',
        name: newStream.name,
        type_stream: newStream.type,
        monthly_actual: 0,
        monthly_projected: parseFloat(newStream.monthly_projected),
        growth_rate: parseFloat(newStream.growth_rate) || 10,
        seasonality: Array(12).fill(1),
        confidence: 70,
        is_active: true
      })
    });

    if (response.ok) {
      const data = await response.json();
      setStreams(prev => [...prev, data.stream]);
      setNewStream({ name: '', type: 'product', monthly_projected: '', growth_rate: '' });
      setIsAddingStream(false);
    }
  }

  const currentGoal = goals[0];
  const goalProgress = currentGoal ? calculateGoalProgress(currentGoal, streams) : null;
  
  const totalCurrent = streams
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + s.monthly_actual, 0);
  
  const totalProjected = streams
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + s.monthly_projected, 0);

  const chartData = projections.map(p => ({
    ...p,
    target: currentGoal?.target_amount || 5000
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <main className="lg:ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Revenue Forecast</h1>
                <p className="text-slate-600">
                  Track revenue streams, run scenarios, and hit your $5K MRR goal
                </p>
              </div>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsAddingStream(true)}
            >
              <Plus size={18} className="mr-2" />
              Add Stream
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-sm text-slate-500">Current MRR</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${totalCurrent.toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {stats?.activeStreams || 0} active streams
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-blue-600" />
                <span className="text-sm text-slate-500">Target</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${currentGoal?.target_amount.toLocaleString() || '5,000'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {goalProgress?.percentComplete || 0}% complete
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-purple-600" />
                <span className="text-sm text-slate-500">Projected (12mo)</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${projections[projections.length - 1]?.[activeScenario]?.toLocaleString() || '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {activeScenario} scenario
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-amber-600" />
                <span className="text-sm text-slate-500">Annual Run Rate</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${(totalCurrent * 12).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Based on current MRR
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-600" />
                    Revenue Projections
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={activeScenario === 'conservative' ? 'default' : 'outline'}
                      onClick={() => setActiveScenario('conservative')}
                    >
                      Conservative
                    </Button>
                    <Button 
                      size="sm" 
                      variant={activeScenario === 'realistic' ? 'default' : 'outline'}
                      onClick={() => setActiveScenario('realistic')}
                    >
                      Realistic
                    </Button>
                    <Button 
                      size="sm" 
                      variant={activeScenario === 'optimistic' ? 'default' : 'outline'}
                      onClick={() => setActiveScenario('optimistic')}
                    >
                      Optimistic
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="monthLabel" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        formatter={(value, name) => [
                          `$${Number(value).toLocaleString()}`,
                          name === 'target' ? 'Target' : 'Projected Revenue'
                        ]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                      <ReferenceLine 
                        y={currentGoal?.target_amount || 5000} 
                        stroke="#ef4444" 
                        strokeDasharray="5 5"
                        label={{ value: '$5K Goal', fill: '#ef4444' }}
                      />
                      <Area
                        type="monotone"
                        dataKey={activeScenario}
                        fill="url(#revenueGradient)"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Streams */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart size={20} className="text-purple-600" />
                  Revenue Streams
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-green-600" />
                  </div>
                ) : streams.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
                    <p>No revenue streams yet. Add your first stream to start forecasting.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {streams.filter(s => s.is_active).map((stream) => (
                      <div 
                        key={stream.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: TYPE_COLORS[stream.type] }}
                          />
                          <div>
                            <div className="font-medium">{stream.name}</div>
                            <div className="text-sm text-slate-500 capitalize">{stream.type}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${stream.monthly_actual.toLocaleString()}</div>
                          <div className="text-sm text-slate-500">
                            → ${stream.monthly_projected.toLocaleString()}/mo
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goal Progress */}
            {currentGoal && goalProgress && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target size={20} className="text-red-600" />
                    Goal Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProgressBar 
                    current={totalCurrent}
                    target={currentGoal.target_amount}
                    label="Progress to $5K MRR"
                  />
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">
                        {goalProgress.monthsRemaining}
                      </div>
                      <div className="text-xs text-slate-500">Months Left</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">
                        ${goalProgress.monthlyNeeded.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Needed/Month</div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 p-3 rounded-lg ${goalProgress.onTrack ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {goalProgress.onTrack ? (
                      <>
                        <TrendingUp size={16} />
                        <span className="text-sm font-medium">On track to hit goal!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">Need to accelerate growth</span>
                      </>
                    )}
                  </div>

                  {goalProgress.projectedAchievement && (
                    <div className="text-sm text-slate-500 text-center">
                      Projected achievement: {' '}
                      <span className="font-medium text-slate-700">
                        {new Date(goalProgress.projectedAchievement).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            {currentGoal?.milestones && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentGoal.milestones.map((milestone) => (
                      <div 
                        key={milestone.percent}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          milestone.achieved ? 'bg-green-50' : 'bg-slate-50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          milestone.achieved ? 'bg-green-500 text-white' : 'bg-slate-200'
                        }`}>
                          {milestone.achieved ? (
                            <TrendingUp size={14} />
                          ) : (
                            <span className="text-xs">{milestone.percent}%</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            ${milestone.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {milestone.achieved 
                              ? `Achieved ${new Date(milestone.achieved_at!).toLocaleDateString()}`
                              : `${milestone.percent}% of goal`
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Stream Dialog */}
            {isAddingStream && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Add Revenue Stream</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Name</label>
                    <Input
                      placeholder="e.g., SaaS Subscriptions"
                      value={newStream.name}
                      onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Type</label>
                    <Select 
                      value={newStream.type} 
                      onValueChange={(v: RevenueStream['type']) => setNewStream({ ...newStream, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trading">Trading</SelectItem>
                        <SelectItem value="product">Product/SaaS</SelectItem>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Monthly Projection ($)</label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={newStream.monthly_projected}
                      onChange={(e) => setNewStream({ ...newStream, monthly_projected: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Monthly Growth Rate (%)</label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={newStream.growth_rate}
                      onChange={(e) => setNewStream({ ...newStream, growth_rate: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleAddStream}
                      disabled={!newStream.name || !newStream.monthly_projected}
                    >
                      Add Stream
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setIsAddingStream(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}