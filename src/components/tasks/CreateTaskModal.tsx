"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Bot,
  Calendar,
  Flag,
  Loader2,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "./TaskQueue";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Agent {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low", color: "text-slate-400", bgColor: "bg-slate-500/20" },
  medium: { label: "Medium", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  high: { label: "High", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  urgent: { label: "Urgent", color: "text-red-400", bgColor: "bg-red-500/20" },
};

export default function CreateTaskModal({ open, onClose, onSuccess }: CreateTaskModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAgents, setFetchingAgents] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [agentId, setAgentId] = useState("");
  const [taskType, setTaskType] = useState("general");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [scheduledFor, setScheduledFor] = useState("");

  // Fetch agents on mount
  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setFetchingAgents(true);
    try {
      const response = await fetch("/api/logs?type=agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setFetchingAgents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!agentId) {
      setError("Please select an agent");
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setError("Task description is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          taskType,
          description: description.trim(),
          priority,
          scheduledFor: scheduledFor || undefined,
          inputPayload: {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      onSuccess?.();
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAgentId("");
    setTaskType("general");
    setDescription("");
    setPriority("medium");
    setScheduledFor("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <CheckSquare size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create New Task</h2>
                <p className="text-sm text-slate-500">Schedule a task for an agent</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Agent Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Bot size={14} />
                    Agent
                  </span>
                </label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={fetchingAgents}
                >
                  <option value="">Select an agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                {fetchingAgents && (
                  <p className="text-xs text-slate-400 mt-1">Loading agents...</p>
                )}
              </div>

              {/* Task Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Task Type
                </label>
                <input
                  type="text"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  placeholder="e.g., research, build, analyze"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what needs to be done..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Flag size={14} />
                    Priority
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {priorities.map((p) => {
                    const config = priorityConfig[p];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={cn(
                          "flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                          priority === p
                            ? `${config.bgColor} ${config.color} border-current`
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scheduled For */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Schedule For (optional)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Leave empty to schedule immediately
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
