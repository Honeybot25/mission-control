"use client";

import { useState, memo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Download,
  Clock,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Activity,
  Loader2,
  Search
} from "lucide-react";
import { LogEntry } from "@/lib/agent-logger";
import Link from "next/link";

interface RunTableProps {
  runs: LogEntry[];
  loading?: boolean;
  className?: string;
  showPagination?: boolean;
  pageSize?: number;
  showFilters?: boolean;
  onRowClick?: (run: LogEntry) => void;
  agentName?: string;
}

type SortField = "timestamp" | "agent" | "status" | "duration" | "estimated_impact";
type FilterStatus = "all" | "completed" | "failed" | "in-progress" | "started";

export const RunTable = memo(function RunTable({
  runs,
  loading = false,
  className,
  showPagination = true,
  pageSize = 10,
  showFilters = true,
  onRowClick,
  agentName,
}: RunTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDesc, setSortDesc] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRuns = runs.filter((run) => {
    if (filterStatus !== "all" && run.status !== filterStatus) return false;
    if (filterAgent && !run.agent.toLowerCase().includes(filterAgent.toLowerCase())) return false;
    if (searchQuery && !run.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedRuns = [...filteredRuns].sort((a, b) => {
    let aValue: string | number = a[sortField] || "";
    let bValue: string | number = b[sortField] || "";
    if (sortField === "timestamp") {
      aValue = new Date(a.timestamp).getTime();
      bValue = new Date(b.timestamp).getTime();
    }
    if (sortDesc) return aValue > bValue ? -1 : 1;
    return aValue > bValue ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedRuns.length / pageSize);
  const paginatedRuns = sortedRuns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const completedCount = runs.filter(r => r.status === "completed").length;
  const failedCount = runs.filter(r => r.status === "failed").length;
  const inProgressCount = runs.filter(r => r.status === "in-progress" || r.status === "started").length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  if (loading) {
    return (
      <Card className={cn("border-slate-800 bg-slate-900", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-slate-800 bg-slate-900", className)}>
      <CardHeader className="border-b border-slate-800 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-slate-100">
              {agentName ? `${agentName} Runs` : "Recent Runs"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {completedCount}
              </Badge>
              <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                <AlertCircle className="h-3 w-3 mr-1" />
                {failedCount}
              </Badge>
              {inProgressCount > 0 && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  {inProgressCount}
                </Badge>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search runs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-48 rounded-md border border-slate-700 bg-slate-800 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="h-9 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="in-progress">In Progress</option>
                <option value="started">Started</option>
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th 
                  className="text-left px-4 py-3 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("timestamp")}
                >
                  Time {sortField === "timestamp" && (sortDesc ? "↓" : "↑")}
                </th>
                {!agentName && (
                  <th 
                    className="text-left px-4 py-3 text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200"
                    onClick={() => handleSort("agent")}
                  >
                    Agent {sortField === "agent" && (sortDesc ? "↓" : "↑")}
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Project</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-8 w-8 text-slate-600" />
                      <p className="text-slate-500">No runs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRuns.map((run) => (
                  <tr
                    key={run.id}
                    className={cn(
                      "group transition-colors hover:bg-slate-800/50",
                      run.status === "failed" && "bg-red-500/5",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(run)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-slate-300">
                          {format(new Date(run.timestamp), "MMM d, HH:mm")}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(run.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    {!agentName && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-slate-500" />
                          <Link href={`/agents/${run.agent}`} className="text-sm text-slate-300 hover:text-blue-400 transition-colors">
                            {run.agent}
                          </Link>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <LogStatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-300 truncate max-w-xs" title={run.description}>
                        {run.description}
                      </p>
                      {run.error && (
                        <p className="text-xs text-red-400 mt-0.5 truncate max-w-xs">{run.error}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                        {run.project}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          run.estimated_impact === "critical" && "border-red-500/30 text-red-400",
                          run.estimated_impact === "high" && "border-amber-500/30 text-amber-400",
                          run.estimated_impact === "medium" && "border-blue-500/30 text-blue-400",
                          run.estimated_impact === "low" && "border-slate-500/30 text-slate-400",
                        )}
                      >
                        {run.estimated_impact}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRuns.length)} of {filteredRuns.length} runs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
