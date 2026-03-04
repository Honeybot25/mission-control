"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "./TaskQueue";

interface TaskCardProps {
  task: Task;
  onStart?: (taskId: string) => Promise<void>;
  onComplete?: (taskId: string, status: "completed" | "failed") => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-400", label: "Pending" },
  running: { icon: Loader2, color: "text-blue-400", label: "Running" },
  completed: { icon: CheckCircle, color: "text-green-400", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  cancelled: { icon: AlertCircle, color: "text-gray-400", label: "Cancelled" },
};

export default function TaskCard({ task, onStart, onComplete, onDelete }: TaskCardProps) {
  const StatusIcon = statusConfig[task.status].icon;

  const handleStart = async () => {
    if (onStart) await onStart(task.id);
  };

  const handleComplete = async (status: "completed" | "failed") => {
    if (onComplete) await onComplete(task.id, status);
  };

  const handleDelete = async () => {
    if (onDelete) await onDelete(task.id);
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      task.status === "running" && "border-blue-500/50 bg-blue-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className={cn(
                "w-4 h-4",
                statusConfig[task.status].color,
                task.status === "running" && "animate-spin"
              )} />
              <h4 className="font-medium truncate">{task.description}</h4>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Agent: {task.agent?.name || task.agent_id}</span>
              <span>•</span>
              <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"} className="text-xs">
                {task.priority}
              </Badge>
              {task.scheduled_for && (
                <>
                  <span>•</span>
                  <span>{new Date(task.scheduled_for).toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {task.status === "pending" && onStart && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStart}
                className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            {task.status === "running" && onComplete && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleComplete("completed")}
                  className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleComplete("failed")}
                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
