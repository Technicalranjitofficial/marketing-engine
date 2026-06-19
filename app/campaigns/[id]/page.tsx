"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Table";
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  Send,
  Users,
  Eye,
  MousePointer,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  previewText: string | null;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplaints: number;
  totalUnsubscribed: number;
  createdAt: string;
  scheduledAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  list: { id: string; name: string } | null;
}

interface EmailItem {
  id: string;
  trackingId: string;
  status: string;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  errorMessage: string | null;
  contact: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

const STATUS_COLORS: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  DRAFT: "default",
  SCHEDULED: "info",
  SENDING: "warning",
  SENT: "success",
  PAUSED: "warning",
  CANCELLED: "danger",
};

const EMAIL_STATUS_ICONS: Record<string, React.ReactNode> = {
  QUEUED: <Clock className="h-4 w-4 text-slate-400" />,
  SENT: <Send className="h-4 w-4 text-blue-400" />,
  DELIVERED: <CheckCircle className="h-4 w-4 text-green-400" />,
  OPENED: <Eye className="h-4 w-4 text-cyan-400" />,
  CLICKED: <MousePointer className="h-4 w-4 text-purple-400" />,
  BOUNCED: <XCircle className="h-4 w-4 text-red-400" />,
  FAILED: <AlertTriangle className="h-4 w-4 text-red-400" />,
  COMPLAINED: <AlertTriangle className="h-4 w-4 text-orange-400" />,
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [pageSize, setPageSize] = useState(50);

  // Fetch campaign details
  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      } else {
        toast.error("Campaign not found");
        router.push("/campaigns");
      }
    } catch {
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  // Fetch emails
  const fetchEmails = useCallback(async (pg = page, status = statusFilter, search = searchQuery, size = pageSize) => {
    setLoadingEmails(true);
    try {
      const params = new URLSearchParams({ page: pg.toString(), limit: size.toString() });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      
      const res = await fetch(`/api/campaigns/${id}/emails?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setTotalPages(data.pages);
        setTotalEmails(data.total);
        setStatusCounts(data.statusCounts || {});
      }
    } catch {
      toast.error("Failed to load emails");
    } finally {
      setLoadingEmails(false);
    }
  }, [id, page, statusFilter, searchQuery]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);
  useEffect(() => { fetchEmails(1, statusFilter, searchQuery, pageSize); }, [pageSize]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const handleSend = async () => {
    if (!confirm("Send this campaign now? This will queue all emails for delivery.")) return;
    setSending(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
      if (res.ok) {
        toast.success("Campaign queued for sending!");
        fetchCampaign();
        fetchEmails();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send campaign");
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this campaign? This action cannot be undone.")) return;
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campaign deleted");
      router.push("/campaigns");
    } else {
      toast.error("Failed to delete campaign");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
    fetchEmails(1, statusFilter, searchInput);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    fetchEmails(1, status, searchQuery);
  };

  const goPage = (pg: number) => {
    setPage(pg);
    fetchEmails(pg, statusFilter, searchQuery);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const openRate = campaign && campaign.totalSent > 0
    ? ((campaign.totalOpened / campaign.totalSent) * 100).toFixed(1)
    : "0";
  const clickRate = campaign && campaign.totalOpened > 0
    ? ((campaign.totalClicked / campaign.totalOpened) * 100).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pl-64">
          <div className="container-wide py-8">
            <div className="flex h-48 items-center justify-center text-[hsl(var(--muted-foreground))]">
              Loading campaign...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <button
                onClick={() => router.push("/campaigns")}
                className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Campaigns
              </button>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-3">
                {campaign.name}
                <Badge variant={STATUS_COLORS[campaign.status] || "default"}>
                  {campaign.status}
                </Badge>
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {campaign.subject}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {campaign.status === "DRAFT" && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={handleSend}
                    isLoading={sending}
                  >
                    Send Now
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Eye className="h-4 w-4" />}
                onClick={() => setShowPreview(true)}
              >
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
                onClick={() => { fetchCampaign(); fetchEmails(); }}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <Users className="h-3.5 w-3.5" /> Recipients
                </div>
                <div className="text-xl font-bold">{campaign.totalRecipients.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <Send className="h-3.5 w-3.5" /> Sent
                </div>
                <div className="text-xl font-bold">{campaign.totalSent.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" /> Delivered
                </div>
                <div className="text-xl font-bold">{campaign.totalDelivered.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <Eye className="h-3.5 w-3.5 text-cyan-400" /> Opened
                </div>
                <div className="text-xl font-bold">{campaign.totalOpened.toLocaleString()}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{openRate}%</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <MousePointer className="h-3.5 w-3.5 text-purple-400" /> Clicked
                </div>
                <div className="text-xl font-bold">{campaign.totalClicked.toLocaleString()}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">{clickRate}%</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <XCircle className="h-3.5 w-3.5 text-red-400" /> Bounced
                </div>
                <div className="text-xl font-bold">{campaign.totalBounced.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-400" /> Complaints
                </div>
                <div className="text-xl font-bold">{campaign.totalComplaints.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] text-xs mb-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Unsubs
                </div>
                <div className="text-xl font-bold">{campaign.totalUnsubscribed.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))] text-xs mb-1">From</div>
                    <div className="font-medium">{campaign.fromName} &lt;{campaign.fromEmail}&gt;</div>
                  </div>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))] text-xs mb-1">Reply To</div>
                    <div className="font-medium">{campaign.replyTo || campaign.fromEmail}</div>
                  </div>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))] text-xs mb-1">List</div>
                    <div className="font-medium">{campaign.list?.name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))] text-xs mb-1">Preview Text</div>
                    <div className="font-medium truncate">{campaign.previewText || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))] text-xs mb-1">Created</div>
                    <div className="font-medium">{formatDate(campaign.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-[hsl(var(--muted-foreground))] text-xs mb-1">Sent At</div>
                    <div className="font-medium">{formatDate(campaign.sentAt)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  leftIcon={<Eye className="h-4 w-4" />}
                  onClick={() => setShowPreview(true)}
                >
                  Preview Email
                </Button>
                {campaign.status === "DRAFT" && (
                  <Button
                    className="w-full justify-start"
                    leftIcon={<Send className="h-4 w-4" />}
                    onClick={handleSend}
                    isLoading={sending}
                  >
                    Send Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Emails Table */}
          <Card>
            <CardHeader className="border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Emails ({totalEmails.toLocaleString()})
                </CardTitle>
                
                <div className="flex items-center gap-4">
                  {/* Status filter buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusFilter("")}
                      className={`px-2 py-1 text-xs rounded ${
                        statusFilter === ""
                          ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                          : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                      }`}
                    >
                      All
                    </button>
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilter(status)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          statusFilter === status
                            ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                            : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {EMAIL_STATUS_ICONS[status]}
                        {status} ({count})
                      </button>
                    ))}
                  </div>

                  {/* Per-page selector */}
                  <select
                    value={pageSize}
                    onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                    className="h-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] px-2 text-xs outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  >
                    {[25, 50, 100, 250, 500].map(n => (
                      <option key={n} value={n}>{n} / page</option>
                    ))}
                  </select>

                  {/* Search */}
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by email..."
                        className="h-8 w-48 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                      />
                    </div>
                    <Button type="submit" variant="outline" size="sm">Search</Button>
                  </form>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingEmails ? (
                <div className="flex h-32 items-center justify-center text-[hsl(var(--muted-foreground))]">
                  Loading emails...
                </div>
              ) : emails.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-[hsl(var(--muted-foreground))]">
                  No emails found
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--border))]">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-[hsl(var(--accent)/0.3)]"
                    >
                      <div className="flex-shrink-0">
                        {EMAIL_STATUS_ICONS[email.status] || <Mail className="h-4 w-4 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {email.contact.firstName || email.contact.lastName
                            ? `${email.contact.firstName || ""} ${email.contact.lastName || ""}`.trim()
                            : email.contact.email}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                          {email.contact.email}
                        </div>
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] text-right">
                        <div className="font-medium">{email.status}</div>
                        <div>{formatDate(email.sentAt || email.queuedAt)}</div>
                      </div>
                      {email.openedAt && (
                        <div className="text-xs text-cyan-400 flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {formatDate(email.openedAt)}
                        </div>
                      )}
                      {email.clickedAt && (
                        <div className="text-xs text-purple-400 flex items-center gap-1">
                          <MousePointer className="h-3 w-3" /> {formatDate(email.clickedAt)}
                        </div>
                      )}
                      {email.errorMessage && (
                        <div className="text-xs text-red-400 truncate max-w-[200px]" title={email.errorMessage}>
                          {email.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-3">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Page {page} of {totalPages} • {totalEmails.toLocaleString()} emails
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goPage(page - 1)}
                      disabled={page === 1}
                      className="p-1 rounded hover:bg-[hsl(var(--accent))] disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => goPage(page + 1)}
                      disabled={page >= totalPages}
                      className="p-1 rounded hover:bg-[hsl(var(--accent))] disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="relative w-full max-w-4xl max-h-[90vh] bg-[hsl(var(--card))] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                  <h2 className="text-lg font-semibold">Email Preview</h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-1 rounded hover:bg-[hsl(var(--accent))]"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                  <div className="bg-white rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={campaign.htmlContent}
                      className="w-full h-[600px] border-0"
                      title="Email Preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
