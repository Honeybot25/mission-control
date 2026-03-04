"use client";

import { cn } from "@/lib/utils";
import { Bell, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlertBadgeProps {
  count: number;
  size?: "sm" | "md" | "lg";
  showZero?: boolean;
  pulse?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AlertBadge({
  count,
  size = "md",
  showZero = false,
  pulse = true,
  className,
  onClick,
}: AlertBadgeProps) {
  if (count === 0 && !showZero) return null;

  const sizeClasses = {
    sm: "h-4 min-w-[16px] text-[10px]",
    md: "h-5 min-w-[20px] text-xs",
    lg: "h-6 min-w-[24px] text-sm",
  };

  const getSeverityColor = () => {
    if (count === 0) return "bg-slate-600";
    if (count >= 10) return "bg-red-500";
    if (count >= 5) return "bg-amber-500";
    return "bg-blue-500";
  };

  const getIcon = () => {
    if (count >= 10) return <AlertCircle className="h-3 w-3" />;
    if (count >= 5) return <AlertTriangle className="h-3 w-3" />;
    return <Bell className="h-3 w-3" />;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full font-semibold text-white transition-all",
        sizeClasses[size],
        getSeverityColor(),
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      {count > 99 ? "99+" : count}
      {pulse && count > 0 && (
        <span className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-75",
          getSeverityColor()
        )} />
      )}
    </button>
  );
}

// Version for sidebar navigation
interface SidebarAlertBadgeProps {
  count: number;
  isActive?: boolean;
  className?: string;
}

export function SidebarAlertBadge({ count, isActive, className }: SidebarAlertBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full",
        isActive
          ? "bg-white text-red-600"
          : "bg-red-500 text-white"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
