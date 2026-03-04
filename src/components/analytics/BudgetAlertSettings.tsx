"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BudgetSettings } from "@/types/analytics";
import { DollarSign, AlertTriangle, Bell, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface BudgetAlertSettingsProps {
  settings: BudgetSettings;
  currentSpend: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  onUpdate: (settings: BudgetSettings) => void;
  className?: string;
}

export function BudgetAlertSettings({
  settings,
  currentSpend,
  onUpdate,
  className,
}: BudgetAlertSettingsProps) {
  const [localSettings, setLocalSettings] = useState<BudgetSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof BudgetSettings, value: number | { daily: number; weekly: number; monthly: number }) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localSettings);
    setHasChanges(false);
  };

  const getProgressColor = (current: number, budget: number) => {
    const percentage = (current / budget) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= settings.alertThresholds.daily) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const BudgetRow = ({
    label,
    budget,
    spent,
    threshold,
    onBudgetChange,
    onThresholdChange,
  }: {
    label: string;
    budget: number;
    spent: number;
    threshold: number;
    onBudgetChange: (value: number) => void;
    onThresholdChange: (value: number) => void;
  }) => {
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = spent >= budget;
    const isNearLimit = percentage >= threshold;

    return (
      <div className="space-y-3 p-4 rounded-lg bg-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">{label}</span>
          {isOverBudget && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-400">
              <AlertTriangle className="h-3 w-3" />
              Over Budget
            </span>
          )}
          {!isOverBudget && isNearLimit && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
              <Bell className="h-3 w-3" />
              Near Limit
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", getProgressColor(spent, budget))}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              isOverBudget ? "text-red-400" : "text-slate-400"
            )}>
              ${spent.toFixed(2)} spent
            </span>
            <span className="text-slate-500">
              {percentage.toFixed(1)}% of ${budget.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Budget ($)</label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => onBudgetChange(parseFloat(e.target.value) || 0)}
              min={0}
              step={1}
              className="h-8 bg-slate-800 border-slate-700 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Alert at (%)</label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value) || 0)}
              min={1}
              max={100}
              step={5}
              className="h-8 bg-slate-800 border-slate-700 text-slate-200 text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Bell className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base font-medium text-slate-200">
              Budget & Alerts
            </CardTitle>
            <p className="text-xs text-slate-500">
              Configure spending limits and notifications
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <BudgetRow
          label="Daily Budget"
          budget={localSettings.dailyBudget}
          spent={currentSpend.daily}
          threshold={localSettings.alertThresholds.daily}
          onBudgetChange={(value) => handleChange("dailyBudget", value)}
          onThresholdChange={(value) => handleChange("alertThresholds", { ...localSettings.alertThresholds, daily: value })}
        />

        <BudgetRow
          label="Weekly Budget"
          budget={localSettings.weeklyBudget}
          spent={currentSpend.weekly}
          threshold={localSettings.alertThresholds.weekly}
          onBudgetChange={(value) => handleChange("weeklyBudget", value)}
          onThresholdChange={(value) => handleChange("alertThresholds", { ...localSettings.alertThresholds, weekly: value })}
        />

        <BudgetRow
          label="Monthly Budget"
          budget={localSettings.monthlyBudget}
          spent={currentSpend.monthly}
          threshold={localSettings.alertThresholds.monthly}
          onBudgetChange={(value) => handleChange("monthlyBudget", value)}
          onThresholdChange={(value) => handleChange("alertThresholds", { ...localSettings.alertThresholds, monthly: value })}
        />

        {hasChanges && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">Unsaved changes</span>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
