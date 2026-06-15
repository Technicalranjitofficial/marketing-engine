"use client";

import { RefreshCw } from "lucide-react";

interface LiveBadgeProps {
  loading: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
}

export function LiveBadge({ loading, lastUpdate, onRefresh }: LiveBadgeProps) {
  const fmt = lastUpdate
    ? lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
      {fmt && <span className="opacity-60">Updated {fmt}</span>}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 rounded px-2 py-1 transition-colors hover:bg-[hsl(var(--muted))] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Refresh stats"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        <span>{loading ? "Refreshing…" : "Refresh"}</span>
      </button>
    </div>
  );
}

