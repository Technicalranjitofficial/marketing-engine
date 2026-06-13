"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";

type ConnectionState = "connecting" | "live" | "reconnecting" | "error";

interface LiveBadgeProps {
  state: ConnectionState;
  lastUpdate: Date | null;
}

export function LiveBadge({ state, lastUpdate }: LiveBadgeProps) {
  const fmt = lastUpdate
    ? lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  if (state === "live") {
    return (
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-400 font-medium">Live</span>
        {fmt && <span className="opacity-60">· {fmt}</span>}
      </div>
    );
  }

  if (state === "connecting" || state === "reconnecting") {
    return (
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
        <span className="text-amber-400">{state === "connecting" ? "Connecting…" : "Reconnecting…"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
      <WifiOff className="h-3 w-3 text-red-400" />
      <span className="text-red-400">Disconnected</span>
    </div>
  );
}
