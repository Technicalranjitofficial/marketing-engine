"use client";

import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/Table";
import { ProgressBar } from "@/components/ui/Stats";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { useRealtimeStats } from "@/hooks/useRealtimeStats";
import { MailOpen, MousePointerClick, Mail, Users, AlertCircle, TrendingUp } from "lucide-react";

function StatBlock({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color ?? ""}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, loading, lastUpdate, refresh } = useRealtimeStats();

  const e = data?.emailStats;
  const openRate = parseFloat(e?.openRate ?? "0");
  const clickRate = parseFloat(e?.clickRate ?? "0");
  const bounceRate = parseFloat(e?.bounceRate ?? "0");
  const deliveryRate = parseFloat(e?.deliveryRate ?? "0");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header title="Analytics" description="Detailed performance metrics for your email campaigns" />
            <div className="mt-2"><LiveBadge loading={loading} lastUpdate={lastUpdate} onRefresh={refresh} /></div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">
              Connecting to live data…
            </div>
          ) : (
            <>
              {/* Top KPIs */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatBlock label="Total Sent" value={(e?.totalSent ?? 0).toLocaleString()} sub="All time" />
                <StatBlock label="Delivered" value={(e?.totalDelivered ?? 0).toLocaleString()} sub={`${deliveryRate}% delivery rate`} color="text-emerald-400" />
                <StatBlock label="Opened" value={(e?.totalOpened ?? 0).toLocaleString()} sub={`${openRate}% open rate`} color="text-blue-400" />
                <StatBlock label="Clicked" value={(e?.totalClicked ?? 0).toLocaleString()} sub={`${clickRate}% click rate`} color="text-purple-400" />
              </div>

              {/* Funnel */}
              <Card className="mb-8">
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Email Funnel</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-sm font-medium">Sent</span>
                      </div>
                      <span className="text-sm tabular-nums">{(e?.totalSent ?? 0).toLocaleString()}</span>
                    </div>
                    <ProgressBar value={100} color="blue" size="md" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">Delivered</span>
                      </div>
                      <span className="text-sm tabular-nums">{deliveryRate}%</span>
                    </div>
                    <ProgressBar value={deliveryRate} color="green" size="md" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MailOpen className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium">Opened</span>
                      </div>
                      <span className="text-sm tabular-nums">{openRate}%</span>
                    </div>
                    <ProgressBar value={openRate} color="blue" size="md" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium">Clicked</span>
                      </div>
                      <span className="text-sm tabular-nums">{clickRate}%</span>
                    </div>
                    <ProgressBar value={clickRate} color="blue" size="md" />
                  </div>
                </CardContent>
              </Card>

              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                {/* Negative metrics */}
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-400" /> Negative Signals</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-3">
                      <div>
                        <p className="text-sm font-medium">Bounced</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Hard + soft bounces</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-400">{(e?.totalBounced ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{bounceRate}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-3">
                      <div>
                        <p className="text-sm font-medium">Spam Complaints</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Marked as spam</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-400">{(e?.totalComplaints ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-3">
                      <div>
                        <p className="text-sm font-medium">Unsubscribed</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Opted out</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-400">{(e?.totalUnsubscribed ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audience health */}
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-400" /> Audience Health</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-3">
                      <p className="text-sm font-medium">Active Contacts</p>
                      <p className="text-2xl font-bold text-emerald-400">{(data?.overview.contacts.active ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-3">
                      <p className="text-sm font-medium">Total Contacts</p>
                      <p className="text-2xl font-bold">{(data?.overview.contacts.total ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-3">
                      <p className="text-sm font-medium">Lists</p>
                      <p className="text-2xl font-bold">{data?.overview.lists ?? 0}</p>
                    </div>
                    {data?.overview.contacts.total ? (
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-[hsl(var(--muted-foreground))]">Active rate</span>
                          <span>{((data.overview.contacts.active / data.overview.contacts.total) * 100).toFixed(1)}%</span>
                        </div>
                        <ProgressBar value={(data.overview.contacts.active / data.overview.contacts.total) * 100} color="green" size="md" />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              {/* Campaign breakdown */}
              <Card>
                <CardHeader><CardTitle>Campaign Performance Breakdown</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {!data?.recentCampaigns?.length ? (
                    <div className="flex items-center justify-center py-12 text-sm text-[hsl(var(--muted-foreground))]">No campaigns sent yet</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead className="text-right">Sent</TableHead>
                          <TableHead className="text-right">Delivered</TableHead>
                          <TableHead className="text-right">Open Rate</TableHead>
                          <TableHead className="text-right">Click Rate</TableHead>
                          <TableHead className="text-right">Bounces</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentCampaigns.map((c) => {
                          const dr = c.totalSent > 0 ? ((c.totalDelivered / c.totalSent) * 100).toFixed(1) : "0.0";
                          const br = c.totalSent > 0 ? ((c.totalBounced / c.totalSent) * 100).toFixed(1) : "0.0";
                          return (
                            <TableRow key={c.id}>
                              <TableCell>
                                <p className="font-medium">{c.name}</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}</p>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{c.totalSent.toLocaleString()}</TableCell>
                              <TableCell className="text-right"><Badge variant="success">{dr}%</Badge></TableCell>
                              <TableCell className="text-right"><Badge variant="info">{c.openRate}%</Badge></TableCell>
                              <TableCell className="text-right"><Badge variant="success">{c.clickRate}%</Badge></TableCell>
                              <TableCell className="text-right"><Badge variant={parseFloat(br) > 2 ? "danger" : "default"}>{br}%</Badge></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
