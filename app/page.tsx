"use client";

import { Sidebar, Header } from "@/components/layout/Sidebar";
import { StatCard, MetricCard, ProgressBar } from "@/components/ui/Stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { useRealtimeStats } from "@/hooks/useRealtimeStats";
import { Users, Mail, Zap, Plus, ArrowRight, MailOpen, MousePointerClick, Activity } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: stats, loading, lastUpdate, refresh } = useRealtimeStats();

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
            <div className="mt-2 flex items-center gap-3">
              {stats?.activeEmailJobs ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  {stats.activeEmailJobs} sending
                </div>
              ) : null}
              <LiveBadge loading={loading} lastUpdate={lastUpdate} onRefresh={refresh} />
            </div>
          </div>

          <div className="mb-8 flex gap-3">
            <Link href="/campaigns"><Button leftIcon={<Plus className="h-4 w-4" />}>New Campaign</Button></Link>
            <Link href="/contacts"><Button variant="outline" leftIcon={<Users className="h-4 w-4" />}>Add Contacts</Button></Link>
          </div>

          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Contacts" value={loading ? "—" : (stats.overview.contacts.total).toLocaleString()} subtitle={`${(stats?.overview.contacts.active ?? 0).toLocaleString()} active`} icon={Users} iconColor="text-blue-400" />
            <StatCard title="Campaigns Sent" value={loading ? "—" : (stats.overview.campaigns.sent).toString()} subtitle={`${stats?.overview.campaigns.total ?? 0} total`} icon={Mail} iconColor="text-emerald-400" />
            <StatCard title="Avg. Open Rate" value={loading ? "—" : `${openRate}%`} icon={MailOpen} iconColor="text-purple-400" />
            <StatCard title="Active Automations" value={"0"} subtitle="0 total" icon={Zap} iconColor="text-amber-400" />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <MetricCard label="Emails Sent" value={loading ? "—" : (stats.emailStats.totalSent).toLocaleString()} color="blue" />
            <MetricCard label="Emails Opened" value={loading ? "—" : (stats.emailStats.totalOpened).toLocaleString()} percentage={`${openRate}%`} color="green" />
            <MetricCard label="Links Clicked" value={loading ? "—" : (stats.emailStats.totalClicked).toLocaleString()} percentage={`${clickRate}%`} color="purple" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Campaigns</CardTitle>
                <Link href="/campaigns"><Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>View All</Button></Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">Loading…</div>
                ) : !stats.recentCampaigns?.length ? (
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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Sent</TableHead>
                        <TableHead className="text-right">Opens</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentCampaigns.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={c.status === "SENT" ? "success" : c.status === "SENDING" ? "warning" : "default"}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.totalSent.toLocaleString()}</TableCell>
                          <TableCell className="text-right"><Badge variant="info">{c.openRate}%</Badge></TableCell>
                          <TableCell className="text-right"><Badge variant="success">{c.clickRate}%</Badge></TableCell>
                        </TableRow>
                      ))}
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
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-teal-400" />
                    <span className="text-sm font-medium">Delivery Rate</span>
                    <span className="ml-auto text-sm text-[hsl(var(--muted-foreground))]">{stats?.emailStats.deliveryRate ?? "0"}%</span>
                  </div>
                  <ProgressBar value={parseFloat(stats?.emailStats.deliveryRate ?? "0")} color="green" size="md" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

