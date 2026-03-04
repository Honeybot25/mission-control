"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        online: "bg-green-500/10 text-green-400 border border-green-500/20",
        busy: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        offline: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
        error: "bg-red-500/10 text-red-400 border border-red-500/20",
        warning: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        default: "text-xs px-2 py-0.5",
        lg: "text-sm px-2.5 py-1",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "default",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  size = "default", 
  label, 
  pulse = false,
  className 
}: StatusBadgeProps) {
  const statusLabels = {
    online: "Online",
    busy: "Busy",
    offline: "Offline",
    error: "Error",
    warning: "Warning",
    success: "Success",
    info: "Info",
  };

  const dotColors = {
    online: "bg-green-400",
    busy: "bg-amber-400",
    offline: "bg-slate-400",
    error: "bg-red-400",
    warning: "bg-orange-400",
    success: "bg-emerald-400",
    info: "bg-blue-400",
  };

  return (
    <span className={cn(statusVariants({ status, size }), className)}>
      <span 
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          dotColors[status || "offline"],
          pulse && "animate-pulse"
        )} 
      />
      {label || statusLabels[status || "offline"]}
    </span>
  );
}

export function LogStatusBadge({ 
  status, 
  className 
}: { 
  status: string; 
  className?: string;
}) {
  const statusMap: Record<string, { variant: VariantProps<typeof statusVariants>["status"]; label: string }> = {
    completed: { variant: "success", label: "Completed" },
    failed: { variant: "error", label: "Failed" },
    "in-progress": { variant: "info", label: "In Progress" },
    started: { variant: "busy", label: "Started" },
    paused: { variant: "warning", label: "Paused" },
    created: { variant: "offline", label: "Created" },
  };

  const { variant, label } = statusMap[status.toLowerCase()] || { variant: "offline", label: status };

  return <StatusBadge status={variant} label={label} className={className} />;
}
