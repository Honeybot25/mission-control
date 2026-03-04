"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Lightbulb, 
  TrendingUp, 
  Code, 
  Play, 
  Save, 
  Trash2, 
  ChevronRight,
  Sparkles,
  BarChart3,
  Target,
  Activity,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { 
  AIStrategy, 
  STRATEGY_TEMPLATES, 
  getStrategies, 
  createStrategy,
  deleteStrategy,
  subscribeToStrategies 
} from "@/lib/ai-strategies";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
}

function MetricCard({ label, value, unit, trend = "neutral", icon: Icon }: MetricCardProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-slate-600"
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${trendColors[trend]}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

export default function AIStrategiesPage() {
  const [strategies, setStrategies] = useState<AIStrategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<AIStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("generate");

  useEffect(() => {
    fetchStrategies();
  }, []);

  useEffect(() => {
    const subscription = subscribeToStrategies((payload) => {
      if (payload.event === "INSERT") {
        setStrategies(prev => [payload.new, ...prev]);
      } else if (payload.event === "DELETE") {
        setStrategies(prev => prev.filter(s => s.id !== payload.old?.id));
        if (selectedStrategy?.id === payload.old?.id) {
          setSelectedStrategy(null);
        }
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [selectedStrategy?.id]);

  async function fetchStrategies() {
    setLoading(true);
    const data = await getStrategies();
    setStrategies(data);
    setLoading(false);
  }

  async function handleGenerate() {
    if (!name.trim() || !description.trim()) return;
    
    setGenerating(true);
    try {
      const response = await fetch("/api/ai-strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStrategies(prev => [data.strategy, ...prev]);
        setSelectedStrategy(data.strategy);
        setActiveTab("results");
        setName("");
        setDescription("");
      }
    } catch (error) {
      console.error("Failed to generate strategy:", error);
    }
    setGenerating(false);
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/ai-strategies?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      setStrategies(prev => prev.filter(s => s.id !== id));
      if (selectedStrategy?.id === id) {
        setSelectedStrategy(null);
      }
    }
  }

  function getStatusColor(status: AIStrategy['status']) {
    switch (status) {
      case 'deployed': return 'bg-green-100 text-green-700';
      case 'backtested': return 'bg-blue-100 text-blue-700';
      case 'archived': return 'bg-slate-100 text-slate-600';
      default: return 'bg-amber-100 text-amber-700';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <main className="lg:ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Strategy Generator</h1>
              <p className="text-slate-600">
                Describe your trading idea in natural language, get backtested Python code
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  Generate Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Strategy Name
                  </label>
                  <Input
                    placeholder="e.g., RSI Mean Reversion"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Describe Your Strategy
                  </label>
                  <Textarea
                    placeholder="e.g., Buy when RSI is below 30 and price crosses above 20-day SMA. Sell when RSI above 70."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleGenerate}
                  disabled={generating || !name.trim() || !description.trim()}
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain size={18} className="mr-2" />
                      Generate Strategy
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb size={20} className="text-amber-500" />
                  Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {STRATEGY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                    onClick={() => {
                      setName(template.name);
                      setDescription(template.example);
                    }}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{template.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="generate">Your Strategies ({strategies.length})</TabsTrigger>
                <TabsTrigger value="results" disabled={!selectedStrategy}>
                  Strategy Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-purple-600" />
                  </div>
                ) : strategies.length === 0 ? (
                  <Card className="border-slate-200">
                    <CardContent className="py-12 text-center">
                      <Brain size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 mb-2">No strategies yet</p>
                      <p className="text-sm text-slate-400">
                        Generate your first trading strategy using natural language
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {strategies.map((strategy) => (
                      <Card 
                        key={strategy.id} 
                        className="border-slate-200 hover:border-purple-300 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedStrategy(strategy);
                          setActiveTab("results");
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-slate-900">{strategy.name}</h3>
                                <Badge className={getStatusColor(strategy.status)}>
                                  {strategy.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                {strategy.natural_language_input}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-green-600 font-medium">
                                  +{strategy.performance_metrics.total_return}%
                                </span>
                                <span className="text-slate-400">
                                  {strategy.performance_metrics.total_trades} trades
                                </span>
                                <span className="text-slate-400">
                                  {strategy.performance_metrics.win_rate}% win rate
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(strategy.id);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="results">
                {selectedStrategy && (
                  <div className="space-y-4">
                    {/* Performance Metrics */}
                    <Card className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 size={20} className="text-blue-600" />
                          Backtest Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <MetricCard
                            label="Total Return"
                            value={`+${selectedStrategy.performance_metrics.total_return}`}
                            unit="%"
                            trend="up"
                            icon={TrendingUp}
                          />
                          <MetricCard
                            label="Win Rate"
                            value={selectedStrategy.performance_metrics.win_rate}
                            unit="%"
                            trend={selectedStrategy.performance_metrics.win_rate > 50 ? "up" : "neutral"}
                            icon={Target}
                          />
                          <MetricCard
                            label="Profit Factor"
                            value={selectedStrategy.performance_metrics.profit_factor}
                            trend={selectedStrategy.performance_metrics.profit_factor > 1 ? "up" : "down"}
                            icon={Activity}
                          />
                          <MetricCard
                            label="Sharpe Ratio"
                            value={selectedStrategy.performance_metrics.sharpe_ratio}
                            trend={selectedStrategy.performance_metrics.sharpe_ratio > 1 ? "up" : "neutral"}
                            icon={BarChart3}
                          />
                        </div>

                        {/* Equity Curve */}
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedStrategy.backtest_results.equity_curve}>
                              <defs>
                                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                                stroke="#94a3b8"
                              />
                              <YAxis stroke="#94a3b8" />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Equity']}
                              />
                              <Area
                                type="monotone"
                                dataKey="equity"
                                stroke="#7c3aed"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#equityGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Generated Code */}
                    <Card className="border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Code size={20} className="text-slate-600" />
                          Generated Python Code
                        </CardTitle>
                        <Button variant="outline" size="sm">
                          <Save size={16} className="mr-2" />
                          Copy
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{selectedStrategy.generated_code}</code>
                        </pre>
                      </CardContent>
                    </Card>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {selectedStrategy.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}