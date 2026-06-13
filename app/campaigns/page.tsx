"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Plus, Send, Trash2, Eye, RefreshCw, X, Mail } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  createdAt: string;
  sentAt: string | null;
  list?: { id: string; name: string } | null;
}

interface ContactList {
  id: string;
  name: string;
  memberCount: number;
}

const STATUS_COLORS: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  DRAFT: "default",
  SCHEDULED: "info",
  SENDING: "warning",
  SENT: "success",
  PAUSED: "warning",
  CANCELLED: "danger",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    subject: "",
    previewText: "",
    htmlContent: "",
    fromName: "Marketing Team",
    fromEmail: "",
    replyTo: "",
    listId: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([fetch("/api/campaigns"), fetch("/api/lists")]);
      if (cRes.ok) {
        const d = await cRes.json();
        setCampaigns(d.campaigns || []);
      }
      if (lRes.ok) {
        const d = await lRes.json();
        setLists(d.lists || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.htmlContent || !form.fromEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Campaign created!");
        setShowCreate(false);
        setForm({ name: "", subject: "", previewText: "", htmlContent: "", fromName: "Marketing Team", fromEmail: "", replyTo: "", listId: "" });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create campaign");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm("Send this campaign now? This will queue it for delivery.")) return;
    setSendingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
      if (res.ok) {
        toast.success("Campaign queued for sending!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to send campaign");
      }
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Campaign deleted");
      fetchData();
    } else {
      toast.error("Failed to delete campaign");
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header title="Campaigns" description="Create and manage your email campaigns" />
            <div className="flex gap-2 mt-1">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />} onClick={fetchData}>Refresh</Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>New Campaign</Button>
            </div>
          </div>

          {/* Create Modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="w-full max-w-2xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5">
                  <h2 className="text-lg font-semibold">Create Campaign</h2>
                  <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Input label="Campaign Name *" placeholder="e.g. July Newsletter" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <Input label="Subject Line *" placeholder="Your email subject..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                    </div>
                    <Input label="Preview Text" placeholder="Short preview shown in inbox..." value={form.previewText} onChange={e => setForm(f => ({ ...f, previewText: e.target.value }))} />
                    <Input label="Reply-To Email" placeholder="reply@example.com" value={form.replyTo} onChange={e => setForm(f => ({ ...f, replyTo: e.target.value }))} />
                    <Input label="From Name *" placeholder="Marketing Team" value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} />
                    <Input label="From Email *" placeholder="hello@yourdomain.com" value={form.fromEmail} onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))} />
                  </div>
                  <Select
                    label="Target List"
                    value={form.listId}
                    onChange={e => setForm(f => ({ ...f, listId: (e.target as HTMLSelectElement).value }))}
                    options={[
                      { value: "", label: "Select a list…" },
                      ...lists.map(l => ({ value: l.id, label: `${l.name} (${l.memberCount} contacts)` }))
                    ]}
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">HTML Content *</label>
                    <textarea
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] font-mono h-48 resize-none"
                      placeholder="<html><body><h1>Hello {{firstName}}!</h1><p>Your email content here...</p></body></html>"
                      value={form.htmlContent}
                      onChange={e => setForm(f => ({ ...f, htmlContent: e.target.value }))}
                    />
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Use {"{{firstName}}"}, {"{{lastName}}"}, {"{{email}}"} for personalization. {"{{unsubscribeUrl}}"} is automatically appended.</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button type="submit" isLoading={saving}>Create Campaign</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Campaigns Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading campaigns…
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <Mail className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium mb-1">No campaigns yet</p>
                  <p className="text-xs mb-4">Create your first email campaign to get started</p>
                  <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Create Campaign</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>List</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Open Rate</TableHead>
                      <TableHead className="text-right">Click Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c) => {
                      const or = c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : "0.0";
                      const cr = c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) : "0.0";
                      return (
                        <TableRow key={c.id}>
                          <TableCell>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.subject}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.fromName} &lt;{c.fromEmail}&gt;</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">{c.list?.name ?? "—"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_COLORS[c.status] ?? "default"}>{c.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.totalSent.toLocaleString()}</TableCell>
                          <TableCell className="text-right"><Badge variant="info">{or}%</Badge></TableCell>
                          <TableCell className="text-right"><Badge variant="success">{cr}%</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/campaigns/${c.id}`}>
                                <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />}>
                                  View
                                </Button>
                              </Link>
                              {(c.status === "DRAFT" || c.status === "SCHEDULED") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  leftIcon={<Send className="h-3.5 w-3.5" />}
                                  isLoading={sendingId === c.id}
                                  onClick={() => handleSend(c.id)}
                                >
                                  Send
                                </Button>
                              )}
                              {c.status === "DRAFT" && (
                                <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
