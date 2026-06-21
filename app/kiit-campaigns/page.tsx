"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { RefreshCw, Search, Mail, BarChart3, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: string;
  segmentQuery: {
    source: string;
    batch: string;
    topic: string;
    templateName: string;
  };
}

export default function KIITCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kiit-campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.segmentQuery?.topic?.toLowerCase().includes(search.toLowerCase()) ||
    c.segmentQuery?.templateName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header
              title="KIIT Campaigns Tracking"
              description="Track batch-wise email campaigns sent to KIIT users"
            />
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}
              onClick={fetchCampaigns}
            >
              Refresh
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total KIIT Campaigns</p>
                  <p className="text-xl font-bold">{campaigns.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Recipients</p>
                  <p className="text-xl font-bold">
                    {campaigns.reduce((acc, c) => acc + (c.totalRecipients || 0), 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Delivered</p>
                  <p className="text-xl font-bold">
                    {campaigns.reduce((acc, c) => acc + (c.totalDelivered || 0), 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Active Sending</p>
                  <p className="text-xl font-bold">
                    {campaigns.filter(c => c.status === "SENDING").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search + table */}
          <Card>
            <CardHeader className="border-b border-[hsl(var(--border))] pb-3">
              <div className="flex items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search campaigns, topics, or templates…"
                      className="h-8 w-72 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm">Search</Button>
                  {search && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(""); setSearch(""); }}
                      className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      Clear
                    </button>
                  )}
                </form>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  Loading…
                </div>
              ) : !filteredCampaigns.length ? (
                <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  No KIIT campaigns found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.2)]">
                        <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Topic / Campaign</th>
                        <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Batch</th>
                        <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Template Used</th>
                        <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Subject</th>
                        <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))] text-right">Recipients</th>
                        <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Status</th>
                        <th className="px-4 py-3 font-medium text-[hsl(var(--muted-foreground))]">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[hsl(var(--border))]">
                      {filteredCampaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-[hsl(var(--accent)/0.3)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold">{c.segmentQuery?.topic || c.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
                              {c.segmentQuery?.batch || "All"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                            {c.segmentQuery?.templateName || "Unknown"}
                          </td>
                          <td className="px-4 py-3 truncate max-w-[200px]" title={c.subject}>
                            {c.subject}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {c.totalRecipients?.toLocaleString() || 0}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              c.status === "SENDING" ? "bg-amber-500/15 text-amber-400" :
                              c.status === "SENT" || c.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" :
                              c.status === "CANCELLED" ? "bg-red-500/15 text-red-400" :
                              "bg-slate-500/15 text-slate-400"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
