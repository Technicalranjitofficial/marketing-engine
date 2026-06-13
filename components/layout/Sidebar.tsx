"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mail,
  Users,
  ListTree,
  Workflow,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Inbox,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { href: "/",            icon: LayoutDashboard, label: "Dashboard"       },
  { href: "/inbox",       icon: Inbox,           label: "Inbox",   badge: "inbox" as const },
  { href: "/campaigns",   icon: Mail,            label: "Campaigns"       },
  { href: "/contacts",    icon: Users,           label: "Contacts"        },
  { href: "/kiitusers",   icon: GraduationCap,   label: "KIIT Users"      },
  { href: "/lists",       icon: ListTree,        label: "Lists"           },
  { href: "/automations", icon: Workflow,        label: "Automations"     },
  { href: "/templates",   icon: FileText,        label: "Templates"       },
  { href: "/analytics",   icon: BarChart3,       label: "Analytics"       },
  { href: "/settings",    icon: Settings,        label: "Settings"        },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);

  // Fetch unread count on mount + every 30 s
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/inbox?limit=1");
        if (res.ok) {
          const d = await res.json();
          setInboxUnread(d.unreadCount ?? 0);
        }
      } catch { /* ignore */ }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-[hsl(var(--border))]",
        "bg-[hsl(var(--card))] transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[hsl(var(--border))] px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gradient">MarketEngine</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const unread   = item.badge === "inbox" ? inboxUnread : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] glow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-[hsl(var(--primary))]")} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && unread > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1 text-[9px] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
              {collapsed && unread > 0 && (
                <span className="absolute left-7 top-1 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Worker Status */}
      {!collapsed && (
        <div className="absolute bottom-4 left-3 right-3">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] p-3">
            <div className="flex items-center gap-2">
              <span className="status-dot active" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Worker Active</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export function Header({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
      )}
    </header>
  );
}
