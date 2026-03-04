"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  ListTodo
} from "lucide-react";
import { cn } from "@/lib/utils";
import TaskCard from "./TaskCard";
import CreateTaskModal from "./CreateTaskModal";

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  agent_id: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: string;
  description: string;
  input_payload: Record<string, unknown>;
  scheduled_for: string;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface TaskCounts {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
}

interface TaskQueueProps {
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
}

export default function TaskQueue({ 
  className, 
  showHeader = true,
  maxHeight = "600px"
}: TaskQueueProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<TaskCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TaskStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/tasks?counts=true&limit=100");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data.tasks || []);
      setCounts(data.counts || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to start task");
      await fetchTasks();
    } catch (err) {
      console.error("Error starting task:", err);
    }
  };

  const handleCompleteTask = async (taskId: string, status: "completed" | "failed") => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to complete task");
      await fetchTasks();
    } catch (err) {
      console.error("Error completing task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      await fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesTab = activeTab === "all" || task.status === activeTab;
    const matchesSearch = 
      searchQuery === "" ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.agent?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "running": return <Loader2 className="w-4 h-4 animate-spin" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "failed": return <XCircle className="w-4 h-4" />;
      case "cancelled": return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "running": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "completed": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "failed": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "cancelled": return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600">Loading tasks...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="mt-2 text-red-600">{error}</p>
          <Button onClick={fetchTasks} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("w-full", className)}>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ListTodo className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Task Queue</CardTitle>
                  <CardDescription>
                    Manage and monitor agent tasks
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchTasks}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </div>
            </div>
          </CardHeader>
        )}

        <CardContent className="space-y-4">
          {counts && (
            <div className="grid grid-cols-5 gap-2">
              {[
                { status: "pending", label: "Pending", count: counts.pending },
                { status: "running", label: "Running", count: counts.running },
                { status: "completed", label: "Completed", count: counts.completed },
                { status: "failed", label: "Failed", count: counts.failed },
                { status: "cancelled", label: "Cancelled", count: counts.cancelled },
              ].map(({ status, label, count }) => (
                <button
                  key={status}
                  onClick={() => setActiveTab(status as TaskStatus)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border transition-all",
                    activeTab === status
                      ? getStatusColor(status as TaskStatus)
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {getStatusIcon(status as TaskStatus)}
                  <span className="text-xs font-medium mt-1">{label}</span>
                  <Badge variant={activeTab === status ? "default" : "secondary"} className="mt-1">
                    {count}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TaskStatus | "all")}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({counts?.total || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className={cn("h-[400px]", maxHeight && `h-[${maxHeight}]`)}>
                {filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <ListTodo className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm">No tasks found</p>
                    <p className="text-xs mt-1">
                      {searchQuery
                        ? "Try adjusting your search"
                        : activeTab === "all"
                        ? "Create your first task to get started"
                        : `No ${activeTab} tasks`}
                    </p>
                    {activeTab === "all" && !searchQuery && (
                      <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Task
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStart={handleStartTask}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateTaskModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTasks}
      />
    </>
  );
}