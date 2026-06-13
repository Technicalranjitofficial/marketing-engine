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

type ConnectionState = "connecting" | "live" | "reconnecting" | "error";

export function useRealtimeStats() {
  const [data, setData] = useState<StreamStats | null>(null);
  const [state, setState] = useState<ConnectionState>("connecting");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    setState(retryCount.current > 0 ? "reconnecting" : "connecting");
    const es = new EventSource("/api/stream");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        setData(JSON.parse(e.data));
        setLastUpdate(new Date());
        setState("live");
        retryCount.current = 0;
      } catch { /* ignore bad frames */ }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setState(retryCount.current >= 3 ? "error" : "reconnecting");
      // Exponential backoff: 2s, 4s, 8s, then cap at 15s
      const delay = Math.min(2000 * Math.pow(2, retryCount.current), 15000);
      retryCount.current++;
      retryRef.current = setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  return { data, state, lastUpdate };
}
