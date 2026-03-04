"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface TooltipWrapperProps {
  children: ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

export function TooltipWrapper({
  children,
  content,
  side = "top",
  delayDuration = 200,
}: TooltipWrapperProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="bg-slate-800 border-slate-700">
          <p className="text-sm text-slate-200">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
