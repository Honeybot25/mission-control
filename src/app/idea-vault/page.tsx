"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Lightbulb, 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  Zap,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  BarChart3,
  Tag
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { 
  Idea, 
  IdeaFilters,
  getIdeas, 
  createIdea,
  updateIdea,
  deleteIdea,
  getIdeaStats,
  subscribeToIdeas,
  detectCategory,
  calculatePriorityScore
} from "@/lib/ideas";

const CATEGORY_COLORS: Record<Idea['category'], string> = {
  trading: '#10b981',
  product: '#3b82f6',
  content: '#8b5cf6',
  automation: '#f59e0b',
  research: '#ec4899',
  other: '#6b7280'
};

const STATUS_COLORS: Record<Idea['status'], string> = {
  ideation: 'bg-slate-100 text-slate-700',
  validated: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  implemented: 'bg-green-100 text-green-700',
  abandoned: 'bg-red-100 text-red-700'
};

const EFFORT_ICONS = {
  low: <Zap size={14} className="text-green-500" />,
  medium: <Clock size={14} className="text-amber-500" />,
  high: <TrendingUp size={14} className="text-red-500" />
};

interface StatsData {
  total: number;
  byCategory: Record<Idea['category'], number>;
  byStatus: Record<Idea['status'], number>;
  highPriority: number;
  potentialRevenue: number;
}

function PriorityBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700' :
                score >= 60 ? 'bg-blue-100 text-blue-700' :
                score >= 40 ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600';
  
  return (
    <Badge className={color}>
      {score}/100
    </Badge>
  );
}

export default function IdeaVaultPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<IdeaFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEstimatedRevenue, setNewEstimatedRevenue] = useState("");
  const [newEffort, setNewEffort] = useState<Idea['effort_level']>("medium");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const subscription = subscribeToIdeas((payload) => {
      if (payload.event === "INSERT") {
        setIdeas(prev => [payload.new, ...prev]);
      } else if (payload.event === "UPDATE") {
        setIdeas(prev => prev.map(i => i.id === payload.new.id ? payload.new : i));
        if (selectedIdea?.id === payload.new.id) {
          setSelectedIdea(payload.new);
        }
      } else if (payload.event === "DELETE") {
        setIdeas(prev => prev.filter(i => i.id !== payload.old?.id));
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [selectedIdea?.id]);

  async function fetchData() {
    setLoading(true);
    const [ideasData, statsData] = await Promise.all([
      getIdeas(filters),
      getIdeaStats()
    ]);
    setIdeas(ideasData);
    setStats(statsData);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newDescription.trim()) return;
    
    setCreating(true);
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDescription,
        estimatedRevenue: newEstimatedRevenue ? parseFloat(newEstimatedRevenue) : undefined,
        effortLevel: newEffort
      })
    });

    if (response.ok) {
      const data = await response.json();
      setIdeas(prev => [data.idea, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewEstimatedRevenue("");
      setNewEffort("medium");
      setIsCreateDialogOpen(false);
    }
    setCreating(false);
  }

  async function handleUpdateStatus(id: string, status: Idea['status']) {
    const response = await fetch("/api/ideas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });

    if (response.ok) {
      const data = await response.json();
      setIdeas(prev => prev.map(i => i.id === id ? data.idea : i));
      if (selectedIdea?.id === id) {
        setSelectedIdea(data.idea);
      }
    }
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/ideas?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      setIdeas(prev => prev.filter(i => i.id !== id));
      setIsDetailDialogOpen(false);
    }
  }

  const categoryData = stats ? Object.entries(stats.byCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: CATEGORY_COLORS[name as Idea['category']]
  })).filter(d => d.value > 0) : [];

  const statusData = stats ? Object.entries(stats.byStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
    value
  })) : [];

  const filteredIdeas = ideas.filter(idea => 
    searchQuery === "" || 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <main className="lg:ml-64 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Lightbulb className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Idea Vault</h1>
                <p className="text-slate-600">
                  Store, categorize, and prioritize business ideas with AI analysis
                </p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600">
                  <Plus size={18} className="mr-2" />
                  Add Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles size={20} className="text-amber-500" />
                    Add New Idea
                  </DialogTitle>
                  <DialogDescription>
                    AI will auto-categorize and score your idea based on potential impact.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
                    <Input
                      placeholder="e.g., Automated Trading Newsletter"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                    <Textarea
                      placeholder="Describe your idea in detail..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Est. Monthly Revenue ($)
                      </label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={newEstimatedRevenue}
                        onChange={(e) => setNewEstimatedRevenue(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Effort Level</label>
                      <Select value={newEffort} onValueChange={(v: Idea['effort_level']) => setNewEffort(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Effort</SelectItem>
                          <SelectItem value="medium">Medium Effort</SelectItem>
                          <SelectItem value="high">High Effort</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newDescription && (
                    <div className="bg-slate-50 p-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={16} className="text-purple-600" />
                        <span className="font-medium">AI Preview</span>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <div>Category: <Badge variant="outline">{detectCategory(newDescription)}</Badge></div>
                        <div>Priority Score: <PriorityBadge score={calculatePriorityScore(newDescription, newEstimatedRevenue ? parseFloat(newEstimatedRevenue) : null, newEffort)} /></div>
                      </div>
                    </div>
                  )}
                  <Button 
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={handleCreate}
                    disabled={creating || !newTitle.trim() || !newDescription.trim()}
                  >
                    {creating ? (
                      <><Loader2 size={18} className="animate-spin mr-2" />Creating...</>
                    ) : (
                      <><Sparkles size={18} className="mr-2" />Create Idea</>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-sm text-slate-500">Total Ideas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.highPriority}</div>
                <div className="text-sm text-slate-500">High Priority</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.byStatus['in-progress'] || 0}</div>
                <div className="text-sm text-slate-500">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  ${stats.potentialRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">Est. Potential Revenue</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters and Search */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter size={18} />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search ideas..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                  <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                  <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      <SelectItem value="ideation">Ideation</SelectItem>
                      <SelectItem value="validated">Validated</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="implemented">Implemented</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full" onClick={() => {
                  setFilters({});
                  setSearchQuery("");
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ideas List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-amber-500" />
              </div>
            ) : filteredIdeas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 mb-2">No ideas found</p>
                  <p className="text-sm text-slate-400">
                    Add your first idea to get AI-powered analysis
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredIdeas.map((idea) => (
                  <Card 
                    key={idea.id}
                    className="border-slate-200 hover:border-amber-300 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedIdea(idea);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{idea.title}</h3>
                            <Badge 
                              className={STATUS_COLORS[idea.status]}
                            >
                              {idea.status.replace('-', ' ')}
                            </Badge>
                            <Badge 
                              variant="outline"
                              style={{ borderColor: CATEGORY_COLORS[idea.category], color: CATEGORY_COLORS[idea.category] }}
                            >
                              {idea.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {idea.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <PriorityBadge score={idea.priority_score} />
                            {idea.estimated_revenue && (
                              <span className="text-green-600 font-medium">
                                ${idea.estimated_revenue.toLocaleString()}/mo
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-500">
                              {EFFORT_ICONS[idea.effort_level]}
                              {idea.effort_level} effort
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-300" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Idea Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedIdea && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={STATUS_COLORS[selectedIdea.status]}>
                      {selectedIdea.status.replace('-', ' ')}
                    </Badge>
                    <Badge 
                      variant="outline"
                      style={{ borderColor: CATEGORY_COLORS[selectedIdea.category], color: CATEGORY_COLORS[selectedIdea.category] }}
                    >
                      {selectedIdea.category}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl">{selectedIdea.title}</DialogTitle>
                  <DialogDescription>{selectedIdea.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-slate-900">{selectedIdea.priority_score}</div>
                      <div className="text-xs text-slate-500">Priority Score</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedIdea.estimated_revenue ? `$${selectedIdea.estimated_revenue.toLocaleString()}` : '-'}
                      </div>
                      <div className="text-xs text-slate-500">Est. Monthly</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-slate-900">{selectedIdea.confidence}%</div>
                      <div className="text-xs text-slate-500">Confidence</div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {selectedIdea.ai_analysis && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain size={18} className="text-purple-600" />
                        <h4 className="font-semibold text-purple-900">AI Analysis</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-purple-800">Market Opportunity:</span>
                          <p className="text-purple-700 mt-1">{selectedIdea.ai_analysis.market_opportunity}</p>
                        </div>
                        <div>
                          <span className="font-medium text-purple-800">Competitive Landscape:</span>
                          <p className="text-purple-700 mt-1">{selectedIdea.ai_analysis.competitive_landscape}</p>
                        </div>
                        {selectedIdea.ai_analysis.risks.length > 0 && (
                          <div>
                            <span className="font-medium text-purple-800">Key Risks:</span>
                            <ul className="list-disc list-inside text-purple-700 mt-1">
                              {selectedIdea.ai_analysis.risks.map((risk, i) => (
                                <li key={i}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedIdea.ai_analysis.next_steps.length > 0 && (
                          <div>
                            <span className="font-medium text-purple-800">Recommended Next Steps:</span>
                            <ol className="list-decimal list-inside text-purple-700 mt-1">
                              {selectedIdea.ai_analysis.next_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedIdea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          <Tag size={12} className="mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Select 
                      value={selectedIdea.status} 
                      onValueChange={(v: Idea['status']) => handleUpdateStatus(selectedIdea.id, v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ideation">Ideation</SelectItem>
                        <SelectItem value="validated">Validated</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="implemented">Implemented</SelectItem>
                        <SelectItem value="abandoned">Abandoned</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="destructive" 
                      className="ml-auto"
                      onClick={() => handleDelete(selectedIdea.id)}
                    >
                      <XCircle size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}