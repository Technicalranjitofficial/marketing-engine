"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { StatCard, MetricCard, ProgressBar } from "@/components/ui/Stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Users, Mail, Zap, Plus, ArrowRight, MailOpen, MousePointerClick, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  overview: {
    contacts: { total: number; active: number };
    campaigns: { total: number; sent: number };
    lists: number;
    automations: { total: number; active: number };
  };
  emailStats: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: string;
    clickRate: string;
    bounceRate: string;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    sentAt: string | null;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
  }>;
  queueStats: Array<{ name: string; waiting: number; active: number }>;
  redisConnected: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const openRate = stats?.emailStats.openRate ?? "0";
  const clickRate = stats?.emailStats.clickRate ?? "0";
  const bounceRate = stats?.emailStats.bounceRate ?? "0";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header title="Dashboard" description="Overview of your email marketing performance" />
            <Button variant="ghost" size="sm" leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />} onClick={fetchStats} className="mt-1">
              Refresh
            </Button>
          </div>

          <div className="mb-8 flex gap-3">
            <Link href="/campaigns"><Button leftIcon={<Plus className="h-4 w-4" />}>New Campaign</Button></Link>
            <Link href="/contacts"><Button variant="outline" leftIcon={<Users className="h-4 w-4" />}>Add Contacts</Button></Link>
          </div>

          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Contacts" value={loading ? "—" : (stats?.overview.contacts.total ?? 0).toLocaleString()} subtitle={`${(stats?.overview.contacts.active ?? 0).toLocaleString()} active`} icon={Users} iconColor="text-blue-400" />
            <StatCard title="Campaigns Sent" value={loading ? "—" : (stats?.overview.campaigns.sent ?? 0).toString()} subtitle={`${stats?.overview.campaigns.total ?? 0} total`} icon={Mail} iconColor="text-emerald-400" />
            <StatCard title="Avg. Open Rate" value={loading ? "—" : `${openRate}%`} icon={MailOpen} iconColor="text-purple-400" />
            <StatCard title="Active Automations" value={loading ? "—" : (stats?.overview.automations.active ?? 0).toString()} subtitle={`${stats?.overview.automations.total ?? 0} total`} icon={Zap} iconColor="text-amber-400" />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <MetricCard label="Emails Sent" value={loading ? "—" : (stats?.emailStats.totalSent ?? 0).toLocaleString()} color="blue" />
            <MetricCard label="Emails Opened" value={loading ? "—" : (stats?.emailStats.totalOpened ?? 0).toLocaleString()} percentage={`${openRate}%`} color="green" />
            <MetricCard label="Links Clicked" value={loading ? "—" : (stats?.emailStats.totalClicked ?? 0).toLocaleString()} percentage={`${clickRate}%`} color="purple" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Campaigns</CardTitle>
                <Link href="/campaigns"><Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>View All</Button></Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-[hsl(var(--muted-foreground))]"><RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
                ) : !stats?.recentCampaigns?.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
                    <Mail className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No campaigns sent yet</p>
                    <Link href="/campaigns" className="mt-3"><Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Create Campaign</Button></Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead className="text-right">Sent</TableHead>
                        <TableHead className="text-right">Opens</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentCampaigns.map((c) => {
                        const or = c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : "0.0";
                        const cr = c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) : "0.0";
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "Draft"}</p>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{c.totalSent.toLocaleString()}</TableCell>
                            <TableCell className="text-right"><Badge variant="info">{or}%</Badge></TableCell>
                            <TableCell className="text-right"><Badge variant="success">{cr}%</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <MailOpen className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium">Open Rate</span>
                    <span className="ml-auto text-sm text-[hsl(var(--muted-foreground))]">{openRate}%</span>
                  </div>
                  <ProgressBar value={parseFloat(openRate)} color="green" size="md" />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">Click Rate</span>
                    <span className="ml-auto text-sm text-[hsl(var(--muted-foreground))]">{clickRate}%</span>
                  </div>
                  <ProgressBar value={parseFloat(clickRate)} color="blue" size="md" />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium">Bounce Rate</span>
                    <span className="ml-auto text-sm text-[hsl(var(--muted-foreground))]">{bounceRate}%</span>
                  </div>
                  <ProgressBar value={parseFloat(bounceRate)} color="red" size="md" />
                </div>
                {stats?.queueStats && stats.queueStats.length > 0 && (
                  <div className="border-t border-[hsl(var(--border))] pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Queue Status</p>
                    {stats.queueStats.map((q) => (
                      <div key={q.name} className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-[hsl(var(--muted-foreground))]">{q.name.replace("-queue", "")}</span>
                        <div className="flex gap-2">
                          <span className="text-amber-400">{q.waiting} waiting</span>
                          <span className="text-emerald-400">{q.active} active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
