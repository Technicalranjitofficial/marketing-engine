"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface StreamStats {
  ts: number;
  overview: {
    contacts: { total: number; active: number };
    campaigns: { total: number; sent: number };
    lists: number;
  };
  emailStats: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalComplaints: number;
    totalUnsubscribed: number;
    openRate: string;
    clickRate: string;
    deliveryRate: string;
    bounceRate: string;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    sentAt: string | null;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    openRate: string;
    clickRate: string;
  }>;
  activeEmailJobs: number;
  inboxUnread: number;
}

export function useRealtimeStats() {
  const [data, setData] = useState<StreamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch("/api/stream", { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StreamStats = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("[useRealtimeStats] fetch error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => { abortRef.current?.abort(); };
  }, [refresh]);

  return { data, loading, lastUpdate, refresh };
}

