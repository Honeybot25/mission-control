"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  Activity,
  CheckSquare,
  Settings,
  Shield,
  Zap,
  Brain,
  ListTodo,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  LineChart,
  Sparkles,
  Menu,
  X,
  Lightbulb,
  DollarSign,
  Cpu,
  Radio,
  Mic,
} from "lucide-react";
import { useAlerts } from "@/hooks/useAnalyticsData";
import { SidebarAlertBadge } from "@/components/analytics/AlertBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TooltipWrapper } from "@/components/TooltipWrapper";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Agent } from "@/lib/supabase-client";
import { Notification } from "@/types/mentions";

interface TaskCounts {
  pending: number;
  running: number;
  total: number;
}

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  showTaskBadge?: boolean;
  showAlertBadge?: boolean;
  children?: { label: string; href: string }[];
}

const sidebarItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Bot, label: "Agents", href: "/agents" },
  { icon: Activity, label: "Activity", href: "/activity" },
  { icon: TrendingUp, label: "Market Intelligence", href: "/market-intelligence" },
  { icon: LineChart, label: "Trading Terminal", href: "/terminal" },
  { icon: Zap, label: "GEX Terminal", href: "/gex-terminal" },
  { icon: Radio, label: "Options Signals", href: "/options-signals" },
  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
    children: [
      { label: "Costs", href: "/analytics/costs" },
      { label: "Performance", href: "/analytics/performance" },
    ],
  },
  { icon: Cpu, label: "AI Strategies", href: "/ai-strategies" },
  { icon: Lightbulb, label: "Idea Vault", href: "/idea-vault" },
  { icon: DollarSign, label: "Revenue Forecast", href: "/revenue-forecast" },
  { icon: Bell, label: "Alerts", href: "/alerts", showAlertBadge: true },
  { icon: Bot, label: "Notifications", href: "/notifications" },
  { icon: Mic, label: "Voice Control", href: "/voice" },
  { icon: Brain, label: "Knowledge", href: "/knowledge" },
  { icon: CheckSquare, label: "Approvals", href: "/approvals" },
  { icon: ListTodo, label: "Task Queue", href: "/tasks", showTaskBadge: true },
  { icon: Shield, label: "Security", href: "/security" },
  { icon: Zap, label: "Skills", href: "/skills" },
  { icon: Sparkles, label: "Fashion & Aesthetics", href: "/fashion-aesthetics" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["/analytics"]);
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({ pending: 0, running: 0, total: 0 });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentAgentId, setCurrentAgentId] = useState<string>('');
  const { activeAlertCount } = useAlerts();

  // Fetch task counts
  useEffect(() => {
    const fetchTaskCounts = async () => {
      try {
        const response = await fetch("/api/tasks?counts=true&limit=1");
        if (response.ok) {
          const data = await response.json();
          if (data.counts) {
            setTaskCounts({
              pending: data.counts.pending || 0,
              running: data.counts.running || 0,
              total: data.counts.total || 0,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch task counts:", err);
      }
    };

    fetchTaskCounts();
    const interval = setInterval(fetchTaskCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch agents and notifications
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/logs?type=agents');
        const data = await response.json();
        const agentsList = data.agents || [];
        setAgents(agentsList);
        if (agentsList.length > 0 && !currentAgentId) {
          setCurrentAgentId(agentsList[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      }
    };
    fetchAgents();
  }, [currentAgentId]);

  // Fetch notifications
  useEffect(() => {
    if (!currentAgentId) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?agentId=${currentAgentId}&limit=20`);
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentAgentId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentAgentId) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: currentAgentId, markAll: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTaskBadgeCount = () => {
    return taskCounts.pending + taskCounts.running;
  };

  // Create agent map for notifications
  const agentMap = new Map(agents.map(a => [a.id, { name: a.name, slug: a.slug }]));

  const toggleSection = (href: string) => {
    setExpandedSections(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-md transition-colors",
          isOpen 
            ? "bg-blue-600 text-white" 
            : "bg-slate-800 text-slate-200 hover:bg-slate-700"
        )}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-card text-foreground flex flex-col z-40 transition-transform duration-300 border-r border-border",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Main navigation"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
                M
              </div>
              <div>
                <h1 className="font-bold text-foreground">Mission Control</h1>
                <p className="text-xs text-muted-foreground">OpenClaw</p>
              </div>
            </div>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              loading={false}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              agentMap={agentMap}
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const taskBadgeCount = item.showTaskBadge ? getTaskBadgeCount() : 0;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedSections.includes(item.href);

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleSection(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                        active
                          ? "bg-blue-600 text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon size={20} />
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {isExpanded && item.children && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm",
                              pathname === child.href
                                ? "bg-blue-600/50 text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon size={20} />
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.showAlertBadge && (
                      <SidebarAlertBadge count={activeAlertCount} isActive={active} />
                    )}
                    {taskBadgeCount > 0 && item.showTaskBadge && (
                      <span className={cn(
                        "flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full",
                        active
                          ? "bg-white text-blue-600"
                          : "bg-red-500 text-white"
                      )}>
                        {taskBadgeCount > 99 ? "99+" : taskBadgeCount}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className={cn(
                "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                pathname === "/settings"
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </Link>
            <TooltipWrapper content="Toggle theme">
              <div className="flex-shrink-0">
                <ThemeToggle />
              </div>
            </TooltipWrapper>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
