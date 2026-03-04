"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  [key: string]: string | number | Date;
}

interface MiniChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xKey?: string;
  type?: "line" | "area" | "bar";
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showAxes?: boolean;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  strokeWidth?: number;
}

export function MiniChart({
  data,
  dataKey,
  xKey = "name",
  type = "line",
  color = "#3b82f6",
  height = 60,
  showGrid = false,
  showTooltip = false,
  showAxes = false,
  className,
  gradientFrom = "#3b82f6",
  gradientTo = "#3b82f6",
  strokeWidth = 2,
}: MiniChartProps) {
  const chartId = useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 shadow-lg">
          <p className="text-xs font-medium text-slate-100">{label}</p>
          <p className="text-xs text-blue-400">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = {
    line: LineChart,
    area: AreaChart,
    bar: BarChart,
  }[type];

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
          )}
          {showAxes && (
            <>
              <XAxis dataKey={xKey} stroke="hsl(215 20% 65%)" fontSize={10} tickLine={false} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={10} tickLine={false} />
            </>
          )}
          {showTooltip && <Tooltip content={customTooltip} />}
          
          <defs>
            <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.3} />
              <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
            </linearGradient>
          </defs>

          {type === "bar" ? (
            <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} />
          ) : type === "area" ? (
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={strokeWidth}
              fill={`url(#${chartId})`}
            />
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function Sparkline({ data, color = "#3b82f6", height = 30, className }: SparklineProps) {
  const chartData = useMemo(() => 
    data.map((value, index) => ({ value, index })),
    [data]
  );

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
