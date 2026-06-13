import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateTrackingId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateOpenRate(opened: number, delivered: number): number {
  if (delivered === 0) return 0;
  return (opened / delivered) * 100;
}

export function calculateClickRate(clicked: number, delivered: number): number {
  if (delivered === 0) return 0;
  return (clicked / delivered) * 100;
}

export function calculateBounceRate(bounced: number, sent: number): number {
  if (sent === 0) return 0;
  return (bounced / sent) * 100;
}

export function calculateEngagementScore(
  opened: number,
  clicked: number,
  sent: number
): number {
  if (sent === 0) return 0;
  const openRate = opened / sent;
  const clickRate = clicked / sent;
  // Weighted score: opens are worth 1 point, clicks are worth 3 points
  return Math.min(100, (openRate * 30 + clickRate * 70) * 100);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "text-emerald-400",
    completed: "text-emerald-400",
    sent: "text-emerald-400",
    delivered: "text-emerald-400",
    pending: "text-amber-400",
    scheduled: "text-amber-400",
    sending: "text-blue-400",
    draft: "text-slate-400",
    paused: "text-slate-400",
    failed: "text-red-400",
    bounced: "text-red-400",
    error: "text-red-400",
    cancelled: "text-slate-500",
    unsubscribed: "text-slate-500",
  };
  return colors[status.toLowerCase()] || "text-slate-400";
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-400/10",
    completed: "bg-emerald-400/10",
    sent: "bg-emerald-400/10",
    delivered: "bg-emerald-400/10",
    pending: "bg-amber-400/10",
    scheduled: "bg-amber-400/10",
    sending: "bg-blue-400/10",
    draft: "bg-slate-400/10",
    paused: "bg-slate-400/10",
    failed: "bg-red-400/10",
    bounced: "bg-red-400/10",
    error: "bg-red-400/10",
    cancelled: "bg-slate-500/10",
    unsubscribed: "bg-slate-500/10",
  };
  return colors[status.toLowerCase()] || "bg-slate-400/10";
}
