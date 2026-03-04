"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Rocket,
  Megaphone,
  Brain,
  Smartphone,
  Shield,
  Play,
  Square,
  Clock,
  Activity,
  Terminal,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AgentConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

interface ActiveAgent {
  id: string;
  agentId: string;
  task: string;
  status: "running" | "completed" | "error";
  startedAt: Date;
}

const agents: AgentConfig[] = [
  {
    id: "traderbot",
    name: "TraderBot",
    icon: Bot,
    color: "#22c55e",
    description: "Trading systems and execution",
  },
  {
    id: "productbuilder",
    name: "ProductBuilder",
    icon: Rocket,
    color: "#3b82f6",
    description: "Build and deploy products",
  },
  {
    id: "distribution",
    name: "Distribution",
    icon: Megaphone,
    color: "#a855f7",
    description: "Content creation and social media",
  },
  {
    id: "memorymanager",
    name: "MemoryManager",
    icon: Brain,
    color: "#14b8a6",
    description: "Research and knowledge management",
  },
  {
    id: "iosappbuilder",
    name: "iOSAppBuilder",
    icon: Smartphone,
    color: "#6366f1",
    description: "iOS app development",
  },
  {
    id: "securityagent",
    name: "SecurityAgent",
    icon: Shield,
    color: "#ef4444",
    description: "Security scanning and auditing",
  },
];

export default function CommandCenter() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState("");
  const [isSpawning, setIsSpawning] = useState(false);
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSpawn = async (agentId: string) => {
    if (!taskInput.trim()) return;

    setIsSpawning(true);
    setError(null);

    const newAgent: ActiveAgent = {
      id: `${agentId}-${Date.now()}`,
      agentId,
      task: taskInput,
      status: "running",
      startedAt: new Date(),
    };

    setActiveAgents((prev) => [...prev, newAgent]);

    try {
      const response = await fetch("/api/spawn-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          task: taskInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to spawn agent: ${response.statusText}`);
      }

      const data = await response.json();

      setActiveAgents((prev) =>
        prev.map((agent) =>
          agent.id === newAgent.id
            ? { ...agent, status: data.success ? "completed" : "error" }
            : agent
        )
      );

      setTaskInput("");
      setSelectedAgent(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setActiveAgents((prev) =>
        prev.map((agent) =>
          agent.id === newAgent.id ? { ...agent, status: "error" } : agent
        )
      );
    } finally {
      setIsSpawning(false);
    }
  };

  const handleStop = (agentInstanceId: string) => {
    setActiveAgents((prev) => prev.filter((agent) => agent.id !== agentInstanceId));
  };

  const getAgentById = (id: string) => agents.find((a) => a.id === id);

  const getStatusIcon = (status: ActiveAgent["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: ActiveAgent["status"]) => {
    switch (status) {
      case "running":
        return "Running";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Command Center</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Spawn agents and manage tasks from the dashboard
          </p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Card className="border-red-500/50 bg-red-500/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Agents Panel */}
        <AnimatePresence>
          {activeAgents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-400">
                    <Activity className="w-5 h-5 animate-pulse" />
                    Active Agents ({activeAgents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex flex-wrap gap-3">
                      {activeAgents.map((activeAgent) => {
                        const agentConfig = getAgentById(activeAgent.agentId);
                        return (
                          <motion.div
                            key={activeAgent.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                          >
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/20 text-yellow-400 px-3 py-2 flex items-center gap-2 hover:bg-yellow-500/30 transition-colors"
                            >
                              {getStatusIcon(activeAgent.status)}
                              <span className="font-medium">
                                {agentConfig?.name}
                              </span>
                              <Separator
                                orientation="vertical"
                                className="h-3 bg-yellow-400/30"
                              />
                              <span className="max-w-[150px] truncate text-xs opacity-80">
                                {activeAgent.task}
                              </span>
                              <Separator
                                orientation="vertical"
                                className="h-3 bg-yellow-400/30"
                              />
                              <span className="text-xs opacity-60">
                                {getStatusText(activeAgent.status)}
                              </span>
                              <button
                                onClick={() => handleStop(activeAgent.id)}
                                className="ml-1 p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                title="Stop Agent"
                              >
                                <Square className="w-3 h-3 fill-current" />
                              </button>
                            </Badge>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {agents.map((agent, index) => {
            const Icon = agent.icon;
            const isSelected = selectedAgent === agent.id;
            const hasRunningInstance = activeAgents.some(
              (a) => a.agentId === agent.id && a.status === "running"
            );

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setSelectedAgent(isSelected ? null : agent.id)
                }
                className="cursor-pointer"
              >
                <Card
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? "ring-2 ring-primary border-primary"
                      : "border-border/50 hover:border-border"
                  } ${hasRunningInstance ? "border-yellow-500/50" : ""}`}
                >
                  {/* Status Indicator */}
                  {hasRunningInstance && (
                    <div className="absolute top-3 right-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                      </span>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${agent.color}20` }}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: agent.color }}
                        />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">
                            {agent.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {agent.description}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Input Section */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="mt-4 pt-4 border-t border-border/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                Task Description
                              </label>
                              <Input
                                placeholder={`What should ${agent.name} do?`}
                                value={taskInput}
                                onChange={(e) => setTaskInput(e.target.value)}
                                className="bg-secondary/50 border-border/50 focus:border-primary"
                                disabled={isSpawning}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && taskInput.trim()) {
                                    handleSpawn(agent.id);
                                  }
                                }}
                              />
                            </div>
                            <Button
                              onClick={() => handleSpawn(agent.id)}
                              disabled={!taskInput.trim() || isSpawning}
                              className="w-full bg-primary hover:bg-primary/90"
                            >
                              {isSpawning ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Spawning...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Spawn Agent
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Instructions Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="w-5 h-5 text-primary" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium shrink-0">
                    1
                  </span>
                  <span>Click on an agent card to select it</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium shrink-0">
                    2
                  </span>
                  <span>Type a task description in the input field</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium shrink-0">
                    3
                  </span>
                  <span>Click Spawn Agent to start the task</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium shrink-0">
                    4
                  </span>
                  <span>Monitor progress in the Active Agents section</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium shrink-0">
                    5
                  </span>
                  <span>Results will be posted to the agent Discord channel</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
