"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Users,
  RefreshCw,
  Search,
  Mail,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Crown,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KIITUser {
  id        : string;
  name      : string;
  email     : string;
  isPremium : boolean;
  profileImage: string | null;
}

interface UsersResponse {
  users : KIITUser[];
  total : number;
  page  : number;
  pages : number;
  group : string;
}

interface TemplateItem {
  id         : string;
  name       : string;
  category   : string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUPS = [
  { value: "all",     label: "All Users",     icon: Users,     color: "text-blue-400"   },
  { value: "premium", label: "Premium",       icon: Crown,     color: "text-yellow-400" },
  { value: "free",    label: "Free Users",    icon: UserX,     color: "text-slate-400"  },
] as const;

const BATCHES = [
  { value: "",   label: "All Batches" },
  { value: "21", label: "2021" },
  { value: "22", label: "2022" },
  { value: "23", label: "2023" },
  { value: "24", label: "2024" },
  { value: "25", label: "2025" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function KIITUsersPage() {
  const [data, setData]             = useState<UsersResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [group, setGroup]           = useState<"all" | "premium" | "free">("all");
  const [batch, setBatch]           = useState(""); // "21", "22", "23", "24", "25" or "" for all
  const [page, setPage]             = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [pageSize, setPageSize]       = useState(50);

  // Send modal state
  const [showModal, setShowModal]   = useState(false);
  const [templates, setTemplates]   = useState<TemplateItem[]>([]);
  const [sending, setSending]       = useState(false);
  const [form, setForm]             = useState({
    templateId  : "",
    subject     : "",
    fromName    : "KIIT Connect",
    fromEmail   : "support@kiitconnect.com",
    ctaUrl      : "https://kiitconnect.com",
    ctaText     : "Visit KIITConnect",
    previewText : "",
  });

  // ── Fetch users ─────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (pg = page, g = group, q = search, b = batch, size = pageSize) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ group: g, page: pg.toString(), limit: size.toString() });
      if (q) params.set("search", q);
      if (b) params.set("batch", b);
      const res = await fetch(`/api/kiitusers?${params}`);
      if (res.ok) setData(await res.json());
      else toast.error("Failed to load users");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }, [page, group, search, batch]);

  useEffect(() => { fetchUsers(1, group, search, batch, pageSize); }, [pageSize]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Fetch templates for modal ─────────────────────────────────────────────

  const openModal = async () => {
    if (selected.size === 0) { toast.error("Select at least one user"); return; }
    try {
      const [tr, cr] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/templates/custom")
      ]);
      const allTemplates: TemplateItem[] = [];
      if (tr.ok) {
        const data = await tr.json();
        allTemplates.push(...(Array.isArray(data) ? data : (data.templates ?? [])));
      }
      if (cr.ok) {
        const customTemplates = await cr.json();
        const mapped = (Array.isArray(customTemplates) ? customTemplates : []).map((t: { id: string; name: string; description?: string }) => ({
          id: t.id,
          name: t.name,
          category: "Custom",
          description: t.description || "Custom template",
        }));
        allTemplates.push(...mapped);
      }
      setTemplates(allTemplates);
    } catch { /* ignore */ }
    setShowModal(true);
  };

  // ── Selection helpers ─────────────────────────────────────────────────────

  const toggleUser = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    const allIds = new Set(data.users.map((u) => u.id));
    if ([...allIds].every((id) => selected.has(id))) {
      // deselect all on current page
      setSelected((prev) => {
        const next = new Set(prev);
        allIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...allIds]));
    }
  };

  const clearSelection = () => setSelected(new Set());

  // ── Send ────────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!form.templateId || !form.subject) {
      toast.error("Template and subject are required");
      return;
    }
    if (selected.size === 0) { toast.error("No users selected"); return; }

    // Build the list of selected user objects
    const allPageUsers = data?.users || [];
    // Users may span pages — we store IDs in `selected` but only have current page data
    // For simplicity we send from the currently loaded page; if user selected across pages
    // they can batch by group instead.
    const usersToSend = allPageUsers.filter((u) => selected.has(u.id));
    if (usersToSend.length === 0) {
      toast.error("Selected users are not on the current page — change page or re-select");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/kiitusers/send-bulk", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          users      : usersToSend,
          subject    : form.subject,
          templateId : form.templateId,
          templateVars: {
            ctaUrl     : form.ctaUrl,
            ctaText    : form.ctaText,
            previewText: form.previewText,
          },
          fromName : form.fromName,
          fromEmail: form.fromEmail,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(`Queued ${json.queued} email(s). Campaign ID: ${json.campaignId}`);
        if (json.errors?.length) toast.warning(`${json.errors.length} skipped: ${json.errors[0]}`);
        setShowModal(false);
        clearSelection();
      } else {
        toast.error(json.error || "Send failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSending(false); }
  };

  // ── Group / search handlers ─────────────────────────────────────────────────

  const handleGroupChange = (g: typeof group) => {
    setGroup(g);
    setPage(1);
    setSearch("");
    setSearchInput("");
    fetchUsers(1, g, "", batch);
  };

  const handleBatchChange = (b: string) => {
    setBatch(b);
    setPage(1);
    fetchUsers(1, group, search, b);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
    fetchUsers(1, group, searchInput, batch);
  };

  const goPage = (pg: number) => {
    setPage(pg);
    fetchUsers(pg, group, search, batch);
  };

  const currentPageAllSelected =
    data?.users.length ? data.users.every((u) => selected.has(u.id)) : false;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header
              title="KIITConnect Users"
              description={`${(data?.total ?? 0).toLocaleString()} users — select and send bulk email`}
            />
            <div className="flex items-center gap-2 mt-1">
              {selected.size > 0 && (
                <>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {selected.size} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />} onClick={openModal}>
                    Send Email ({selected.size})
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />}
                onClick={() => fetchUsers()}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Group tabs */}
          <div className="mb-4 flex gap-2">
            {GROUPS.map((g) => (
              <button
                key={g.value}
                onClick={() => handleGroupChange(g.value)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  group === g.value
                    ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary)/0.4)]"
                    : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                <g.icon className={`h-4 w-4 ${g.color}`} />
                {g.label}
              </button>
            ))}
          </div>

          {/* Batch filter */}
          <div className="mb-6 flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))] mr-1">Batch:</span>
            {BATCHES.map((b) => (
              <button
                key={b.value}
                onClick={() => handleBatchChange(b.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  batch === b.value
                    ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] ring-1 ring-[hsl(var(--secondary)/0.5)]"
                    : "bg-[hsl(var(--accent)/0.5)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                {b.label}
              </button>
            ))}
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
                      placeholder="Search by name or email…"
                      className="h-8 w-72 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm">Search</Button>
                  {search && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(""); setSearch(""); fetchUsers(1, group, ""); }}
                      className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      Clear
                    </button>
                  )}
                </form>
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    {currentPageAllSelected
                      ? <CheckSquare className="h-4 w-4 text-[hsl(var(--primary))]" />
                      : <Square className="h-4 w-4" />}
                    {currentPageAllSelected ? "Deselect page" : "Select page"}
                  </button>
                  {data && (
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {data.total.toLocaleString()} total
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading && !data ? (
                <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  Loading…
                </div>
              ) : !data?.users.length ? (
                <div className="flex h-48 items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                  No users found
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--border))]">
                  {data.users.map((user) => {
                    const isSelected = selected.has(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[hsl(var(--accent)/0.4)] ${
                          isSelected ? "bg-[hsl(var(--primary)/0.06)]" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          {isSelected
                            ? <CheckSquare className="h-4 w-4 text-[hsl(var(--primary))]" />
                            : <Square className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />}
                        </div>

                        {/* Avatar */}
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gradient-primary text-white text-xs font-bold">
                            {(user.name || user.email).slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name || "(no name)"}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                        </div>

                        {/* Badge */}
                        {user.isPremium ? (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
                            <Crown className="h-3 w-3" /> Premium
                          </span>
                        ) : (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            <UserCheck className="h-3 w-3" /> Free
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Page {page} of {data.pages} · {data.total.toLocaleString()} users
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                      className="h-7 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] px-2 text-xs outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                    >
                      {[25, 50, 100, 250, 500].map(n => (
                        <option key={n} value={n}>{n} / page</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => goPage(page - 1)} disabled={page <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => goPage(page + 1)} disabled={page >= data.pages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ── Send Modal ─────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-[hsl(var(--primary))]" />
                Send Email to {selected.size} user{selected.size > 1 ? "s" : ""}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Template */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Template *</label>
                <select
                  value={form.templateId}
                  onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                >
                  <option value="">Select a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.category}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Your email subject…"
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                />
              </div>

              {/* From */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">From Name</label>
                  <input
                    value={form.fromName}
                    onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">From Email</label>
                  <input
                    value={form.fromEmail}
                    onChange={(e) => setForm((f) => ({ ...f, fromEmail: e.target.value }))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
              </div>

              {/* CTA vars */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">CTA URL</label>
                  <input
                    value={form.ctaUrl}
                    onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[hsl(var(--muted-foreground))]">CTA Text</label>
                  <input
                    value={form.ctaText}
                    onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
                  />
                </div>
              </div>

              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Emails are sent via BullMQ queue with DKIM + SPF. Each recipient gets a personalised
                email with their first name and a unique unsubscribe link to avoid spam flags.
              </p>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                leftIcon={<Send className="h-3.5 w-3.5" />}
                onClick={handleSend}
                disabled={sending || !form.templateId || !form.subject}
              >
                {sending ? "Queuing…" : `Queue ${selected.size} Email${selected.size > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
