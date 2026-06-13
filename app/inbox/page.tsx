"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Table";
import {
  Inbox,
  RefreshCw,
  MailOpen,
  Trash2,
  Search,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  PenSquare,
  Send,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EmailSummary {
  id        : string;
  subject   : string;
  fromEmail : string;
  fromName  : string | null;
  toEmail   : string | null;
  textBody  : string | null;
  isRead    : boolean;
  receivedAt: string;
}

interface EmailFull extends EmailSummary {
  htmlBody: string | null;
}

interface InboxResponse {
  emails     : EmailSummary[];
  total      : number;
  unreadCount: number;
  page       : number;
  pages      : number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function relativeTime(iso: string) {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); }
  catch { return ""; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inbox page
// ─────────────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [data, setData]         = useState<InboxResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<EmailFull | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeForm, setComposeForm] = useState({
    to: "",
    subject: "",
    body: "",
  });

  // ── Fetch list ────────────────────────────────────────────────────────────

  const fetchInbox = useCallback(async (pg = page, q = search, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg.toString(), limit: "20" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/inbox?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch { /* ignore */ }
    finally { if (!silent) setLoading(false); }
  }, [page, search]);

  // Initial fetch
  useEffect(() => { fetchInbox(); }, [page, search]);
  
  // ── SSE for real-time updates ─────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (data?.emails?.[0]?.id) params.set("lastId", data.emails[0].id);
    if (data?.total) params.set("lastCount", data.total.toString());
    
    const eventSource = new EventSource(`/api/inbox/stream?${params}`);
    
    eventSource.addEventListener("new-email", (e) => {
      const { email } = JSON.parse(e.data);
      toast.success(`New email from ${email.fromName || email.fromEmail}`, {
        description: email.subject,
        icon: <Mail className="h-4 w-4" />,
        duration: 5000,
      });
      // Refresh the list to show the new email
      fetchInbox(page, search, true);
    });
    
    eventSource.addEventListener("update", () => {
      // Counts changed, refresh silently
      fetchInbox(page, search, true);
    });
    
    eventSource.onerror = () => {
      // Reconnect handled automatically by EventSource
    };
    
    return () => eventSource.close();
  }, [data?.emails, data?.total, page, search, fetchInbox]);

  // ── Open email ────────────────────────────────────────────────────────────

  const openEmail = async (id: string) => {
    setLoadingEmail(true);
    try {
      const res = await fetch(`/api/inbox/${id}`);
      if (!res.ok) { toast.error("Failed to load email"); return; }
      const full: EmailFull = await res.json();
      setSelected(full);
      // Mark as read locally without refetch
      setData((prev) =>
        prev
          ? {
              ...prev,
              emails: prev.emails.map((e) =>
                e.id === id ? { ...e, isRead: true } : e
              ),
              unreadCount: full.isRead ? prev.unreadCount : Math.max(0, prev.unreadCount - 1),
            }
          : prev
      );
    } catch { toast.error("Network error"); }
    finally { setLoadingEmail(false); }
  };

  // ── Mark all read ─────────────────────────────────────────────────────────

  const markAllRead = async () => {
    const res = await fetch("/api/inbox", {
      method : "PATCH",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ markAllRead: true }),
    });
    if (res.ok) {
      toast.success("All emails marked as read");
      setData((prev) =>
        prev
          ? { ...prev, emails: prev.emails.map((e) => ({ ...e, isRead: true })), unreadCount: 0 }
          : prev
      );
      if (selected) setSelected({ ...selected, isRead: true });
    }
  };

  // ── Delete email ──────────────────────────────────────────────────────────

  const deleteEmail = async (id: string) => {
    const res = await fetch(`/api/inbox/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Email deleted");
      if (selected?.id === id) setSelected(null);
      setData((prev) =>
        prev
          ? {
              ...prev,
              emails     : prev.emails.filter((e) => e.id !== id),
              total      : prev.total - 1,
              unreadCount: prev.emails.find((e) => e.id === id && !e.isRead)
                ? prev.unreadCount - 1
                : prev.unreadCount,
            }
          : prev
      );
    }
  };

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  // ── Send composed email ───────────────────────────────────────────────────

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.to || !composeForm.subject || !composeForm.body) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    try {
      // Create a simple HTML email from the body text
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:32px;border-radius:8px;">
    <div style="white-space:pre-wrap;color:#333;font-size:15px;line-height:1.6;">${composeForm.body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#888;font-size:12px;">Sent from MarketEngine</p>
  </div>
</body>
</html>`;

      const res = await fetch("/api/send-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: null,
          toEmail: composeForm.to,
          subject: composeForm.subject,
          htmlContent,
          fromEmail: "support@kiitconnect.com",
          fromName: "KIIT Connect",
        }),
      });

      if (res.ok) {
        toast.success(`Email sent to ${composeForm.to}`);
        setShowCompose(false);
        setComposeForm({ to: "", subject: "", body: "" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send email");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────

  const goPage = (pg: number) => {
    setPage(pg);
    fetchInbox(pg, search);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64 flex flex-col">
        {/* Top bar */}
        <div className="border-b border-[hsl(var(--border))] px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Inbox className="h-5 w-5 text-[hsl(var(--primary))]" />
            <h1 className="text-xl font-semibold">Inbox</h1>
            {(data?.unreadCount ?? 0) > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--primary))] px-1.5 text-[10px] font-bold text-white">
                {data!.unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PenSquare className="h-3.5 w-3.5" />}
              onClick={() => setShowCompose(true)}
            >
              Compose
            </Button>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search emails…"
                  className="h-8 w-56 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
              </div>
            </form>
            {(data?.unreadCount ?? 0) > 0 && (
              <Button variant="outline" size="sm" leftIcon={<CheckCheck className="h-3.5 w-3.5" />} onClick={markAllRead}>
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}
              onClick={() => fetchInbox()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Split view */}
        <div className="flex flex-1 overflow-hidden">
          {/* Email list */}
          <div className="w-96 flex-shrink-0 border-r border-[hsl(var(--border))] flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {loading && !data ? (
                <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  Loading…
                </div>
              ) : !data?.emails.length ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-[hsl(var(--muted-foreground))]">
                  <Mail className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No emails{search ? " matching your search" : " yet"}</p>
                  {search && (
                    <button
                      className="text-xs text-[hsl(var(--primary))] hover:underline"
                      onClick={() => { setSearchInput(""); setSearch(""); }}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                data.emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => openEmail(email.id)}
                    className={`w-full text-left px-4 py-3 border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--accent)/0.5)] ${
                      selected?.id === email.id ? "bg-[hsl(var(--primary)/0.08)]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                        {initials(email.fromName, email.fromEmail)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${!email.isRead ? "font-semibold text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"}`}>
                            {email.fromName || email.fromEmail}
                          </span>
                          <span className="flex-shrink-0 text-[10px] text-[hsl(var(--muted-foreground))]">
                            {relativeTime(email.receivedAt)}
                          </span>
                        </div>
                        <div className={`text-xs truncate mt-0.5 ${!email.isRead ? "font-medium text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"}`}>
                          {email.subject}
                        </div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                          {email.textBody?.slice(0, 80) || "(no preview)"}
                        </div>
                      </div>
                      {!email.isRead && (
                        <div className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex-shrink-0 flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-2">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Page {page} of {data.pages}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => goPage(page - 1)}
                    className="p-1 rounded hover:bg-[hsl(var(--accent))] disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page === data.pages}
                    onClick={() => goPage(page + 1)}
                    className="p-1 rounded hover:bg-[hsl(var(--accent))] disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {loadingEmail ? (
              <div className="flex h-full items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                Loading email…
              </div>
            ) : selected ? (
              <>
                {/* Email header */}
                <div className="flex-shrink-0 border-b border-[hsl(var(--border))] px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold truncate">{selected.subject}</h2>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>
                          <span className="font-medium text-[hsl(var(--foreground))]">From</span>{" "}
                          {selected.fromName
                            ? `${selected.fromName} <${selected.fromEmail}>`
                            : selected.fromEmail}
                        </span>
                        {selected.toEmail && (
                          <span>
                            <span className="font-medium text-[hsl(var(--foreground))]">To</span>{" "}
                            {selected.toEmail}
                          </span>
                        )}
                        <span>{new Date(selected.receivedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<MailOpen className="h-3.5 w-3.5" />}
                        onClick={async () => {
                          await fetch(`/api/inbox/${selected.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isRead: !selected.isRead }),
                          });
                          const nextRead = !selected.isRead;
                          setSelected({ ...selected, isRead: nextRead });
                          setData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  emails: prev.emails.map((e) =>
                                    e.id === selected.id ? { ...e, isRead: nextRead } : e
                                  ),
                                  unreadCount: nextRead
                                    ? Math.max(0, prev.unreadCount - 1)
                                    : prev.unreadCount + 1,
                                }
                              : prev
                          );
                        }}
                      >
                        {selected.isRead ? "Mark unread" : "Mark read"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteEmail(selected.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Email body */}
                <div className="flex-1 overflow-auto bg-white">
                  {selected.htmlBody ? (
                    <iframe
                      ref={iframeRef}
                      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#fff;color:#222;font-family:Arial,sans-serif;}</style></head><body>${selected.htmlBody}</body></html>`}
                      sandbox="allow-same-origin"
                      className="w-full h-full border-0 min-h-[400px]"
                      style={{ background: "#fff" }}
                      title="Email content"
                    />
                  ) : (
                    <div className="p-6 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed bg-white min-h-[400px]">
                      {selected.textBody || "(empty email)"}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-[hsl(var(--muted-foreground))]">
                <Inbox className="h-12 w-12 opacity-20" />
                <p className="text-sm">Select an email to read</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-2xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4">
              <div className="flex items-center gap-2">
                <PenSquare className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h2 className="font-semibold">New Message</h2>
              </div>
              <button
                onClick={() => setShowCompose(false)}
                className="rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                  To *
                </label>
                <input
                  type="email"
                  value={composeForm.to}
                  onChange={(e) => setComposeForm((f) => ({ ...f, to: e.target.value }))}
                  placeholder="recipient@example.com"
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Email subject"
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                  Message *
                </label>
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Write your message..."
                  rows={10}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Sending from support@kiitconnect.com
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCompose(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={sending}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
