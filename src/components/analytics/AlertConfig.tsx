"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertRule, AlertType, TimeRange } from "@/types/analytics";
import { 
  Bell, 
  DollarSign, 
  AlertTriangle, 
  Activity, 
  ShieldAlert,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AlertConfigProps {
  rules: AlertRule[];
  agents: { id: string; name: string }[];
  onUpdate: (rules: AlertRule[]) => void;
  className?: string;
}

const alertTypeConfig: Record<AlertType, { icon: typeof Bell; label: string; description: string }> = {
  cost_threshold: {
    icon: DollarSign,
    label: "Cost Threshold",
    description: "Alert when spending exceeds threshold",
  },
  task_failure: {
    icon: AlertTriangle,
    label: "Task Failure",
    description: "Alert when tasks fail repeatedly",
  },
  system_health: {
    icon: ShieldAlert,
    label: "System Health",
    description: "Alert on system-level issues",
  },
  budget_exceeded: {
    icon: DollarSign,
    label: "Budget Exceeded",
    description: "Alert when budget is exceeded",
  },
};

export function AlertConfig({
  rules,
  agents,
  onUpdate,
  className,
}: AlertConfigProps) {
  const [localRules, setLocalRules] = useState<AlertRule[]>(rules);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const handleAddRule = () => {
    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: "New Alert Rule",
      type: "cost_threshold",
      enabled: true,
      threshold: 100,
      timeframe: "24h",
      agents: [],
      channels: ["email"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalRules([...localRules, newRule]);
    setEditingRule(newRule.id);
    setHasChanges(true);
  };

  const handleUpdateRule = (id: string, updates: Partial<AlertRule>) => {
    setLocalRules(prev =>
      prev.map(rule => (rule.id === id ? { ...rule, ...updates } : rule))
    );
    setHasChanges(true);
  };

  const handleDeleteRule = (id: string) => {
    setLocalRules(prev => prev.filter(rule => rule.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localRules);
    setHasChanges(false);
  };

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-slate-200">
                Alert Rules
              </CardTitle>
              <p className="text-xs text-slate-500">
                Configure when and how to be notified
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleAddRule} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {localRules.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No alert rules configured</p>
            <p className="text-sm">Add a rule to get notified about important events</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {localRules.map((rule) => {
              const config = alertTypeConfig[rule.type];
              const Icon = config.icon;
              const isEditing = editingRule === rule.id;

              return (
                <div
                  key={rule.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    rule.enabled
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-slate-800/30 border-slate-800 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700">
                        <Icon className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        {isEditing ? (
                          <Input
                            value={rule.name}
                            onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                            className="h-7 w-48 bg-slate-700 border-slate-600 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-200">{rule.name}</p>
                        )}
                        <p className="text-xs text-slate-500">{config.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) =>
                          handleUpdateRule(rule.id, { enabled: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Rule Configuration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Alert Type</label>
                      <Select
                        value={rule.type}
                        onValueChange={(value: AlertType) =>
                          handleUpdateRule(rule.id, { type: value })
                        }
                      >
                        <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {Object.entries(alertTypeConfig).map(([type, config]) => (
                            <SelectItem key={type} value={type} className="text-xs">
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {rule.type === "cost_threshold" && (
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Threshold ($)</label>
                        <Input
                          type="number"
                          value={rule.threshold}
                          onChange={(e) =>
                            handleUpdateRule(rule.id, { threshold: parseFloat(e.target.value) })
                          }
                          className="h-8 bg-slate-700 border-slate-600 text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Timeframe</label>
                      <Select
                        value={rule.timeframe}
                        onValueChange={(value: TimeRange) =>
                          handleUpdateRule(rule.id, { timeframe: value })
                        }
                      >
                        <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="1h" className="text-xs">Last Hour</SelectItem>
                          <SelectItem value="24h" className="text-xs">Last 24h</SelectItem>
                          <SelectItem value="7d" className="text-xs">Last 7 Days</SelectItem>
                          <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Agents</label>
                      <Select
                        value={rule.agents?.length === 0 ? "all" : rule.agents?.[0]}
                        onValueChange={(value) =>
                          handleUpdateRule(rule.id, { agents: value === "all" ? [] : [value] })
                        }
                      >
                        <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-xs">
                          <SelectValue placeholder="All agents" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="all" className="text-xs">All agents</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id} className="text-xs">
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasChanges && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">Unsaved changes</span>
            <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-1" />
              Save Rules
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
