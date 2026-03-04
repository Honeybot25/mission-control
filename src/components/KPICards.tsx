"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  type LucideIcon 
} from "lucide-react";

export interface KPIData {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color: "blue" | "green" | "amber" | "purple" | "red" | "cyan";
  description?: string;
  loading?: boolean;
  href?: string;
}

const colorMap = {
  blue: "from-blue-500 to-blue-600",
  green: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  purple: "from-purple-500 to-purple-600",
  red: "from-red-500 to-red-600",
  cyan: "from-cyan-500 to-cyan-600",
};

const bgColorMap = {
  blue: "bg-blue-500/10 text-blue-400",
  green: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
  purple: "bg-purple-500/10 text-purple-400",
  red: "bg-red-500/10 text-red-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
};

interface KPICardsProps {
  kpis: readonly KPIData[] | KPIData[];
  className?: string;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function KPICards({ kpis, className, columns = 4 }: KPICardsProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  const CardWrapper = ({ children, href }: { children: React.ReactNode; href?: string }) => {
    if (href) {
      return (
        <a href={href} className="block transition-transform hover:scale-[1.02]">
          {children}
        </a>
      );
    }
    return <>{children}</>;
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {kpis.map((kpi, index) => (
        <CardWrapper key={index} href={kpi.href}>
          <Card className={cn(
            "border-slate-800 bg-slate-900/50 backdrop-blur-sm",
            kpi.href && "cursor-pointer hover:border-slate-700 hover:shadow-lg hover:shadow-blue-500/5"
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-400">{kpi.label}</p>
                  {kpi.loading ? (
                    <div className="mt-2 h-8 w-20 animate-pulse rounded bg-slate-800" />
                  ) : (
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-100">{kpi.value}</span>
                      {kpi.change && (
                        <span className={cn(
                          "text-xs font-medium flex items-center gap-0.5",
                          kpi.trend === "up" && "text-emerald-400",
                          kpi.trend === "down" && "text-red-400",
                          kpi.trend === "neutral" && "text-slate-400"
                        )}>
                          {kpi.trend === "up" && <TrendingUp className="w-3 h-3" />}
                          {kpi.trend === "down" && <TrendingDown className="w-3 h-3" />}
                          {!kpi.trend && <Minus className="w-3 h-3" />}
                          {kpi.change}
                        </span>
                      )}
                    </div>
                  )}
                  {kpi.description && (
                    <p className="mt-1 text-xs text-slate-500">{kpi.description}</p>
                  )}
                </div>
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  bgColorMap[kpi.color]
                )}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </CardWrapper>
      ))}
    </div>
  );
}
