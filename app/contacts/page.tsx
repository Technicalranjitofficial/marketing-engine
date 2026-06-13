"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Plus, Search, Trash2, RefreshCw, X, Users, Upload } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  engagementScore: number;
  createdAt: string;
  lists: Array<{ list: { id: string; name: string } }>;
}

interface ContactList {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, "default" | "success" | "danger" | "warning"> = {
  ACTIVE: "success",
  UNSUBSCRIBED: "default",
  BOUNCED: "danger",
  COMPLAINED: "danger",
  CLEANED: "warning",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkListId, setBulkListId] = useState("");

  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", phone: "", company: "", listIds: [] as string[],
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/contacts?${params}`);
      if (res.ok) {
        const d = await res.json();
        setContacts(d.contacts || []);
        setTotal(d.pagination?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchLists = async () => {
    const res = await fetch("/api/lists");
    if (res.ok) {
      const d = await res.json();
      setLists(d.lists || []);
    }
  };

  useEffect(() => { fetchLists(); }, []);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) { toast.error("Email is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Contact added!");
        setShowCreate(false);
        setForm({ email: "", firstName: "", lastName: "", phone: "", company: "", listIds: [] });
        fetchContacts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add contact");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = bulkText.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes("@"));
    if (!emails.length) { toast.error("No valid emails found"); return; }
    setSaving(true);
    let success = 0, failed = 0;
    for (const email of emails) {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, listIds: bulkListId ? [bulkListId] : [] }),
      });
      if (res.ok) success++; else failed++;
    }
    toast.success(`Imported ${success} contacts${failed > 0 ? `, ${failed} failed/duplicates` : ""}`);
    setShowBulk(false);
    setBulkText("");
    setSaving(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Contact deleted"); fetchContacts(); }
    else toast.error("Failed to delete contact");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header title="Contacts" description={`${total.toLocaleString()} total contacts`} />
            <div className="flex gap-2 mt-1">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />} onClick={fetchContacts}>Refresh</Button>
              <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setShowBulk(true)}>Bulk Import</Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Add Contact</Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <input
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] pl-10 pr-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UNSUBSCRIBED">Unsubscribed</option>
              <option value="BOUNCED">Bounced</option>
              <option value="COMPLAINED">Complained</option>
            </select>
          </div>

          {/* Add Contact Modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5">
                  <h2 className="text-lg font-semibold">Add Contact</h2>
                  <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  <Input label="Email *" type="email" placeholder="contact@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="First Name" placeholder="John" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                    <Input label="Last Name" placeholder="Doe" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                    <Input label="Phone" placeholder="+1 555 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    <Input label="Company" placeholder="Acme Inc." value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                  </div>
                  <Select
                    label="Add to List"
                    value={form.listIds[0] || ""}
                    onChange={e => setForm(f => ({ ...f, listIds: (e.target as HTMLSelectElement).value ? [(e.target as HTMLSelectElement).value] : [] }))}
                    options={[{ value: "", label: "No list" }, ...lists.map(l => ({ value: l.id, label: l.name }))]}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button type="submit" isLoading={saving}>Add Contact</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Bulk Import Modal */}
          {showBulk && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5">
                  <h2 className="text-lg font-semibold">Bulk Import Contacts</h2>
                  <button onClick={() => setShowBulk(false)} className="rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleBulkImport} className="p-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email Addresses</label>
                    <textarea
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] h-40 resize-none font-mono"
                      placeholder={"user1@example.com\nuser2@example.com\nuser3@example.com"}
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">One email per line, or comma/semicolon separated</p>
                  </div>
                  <Select
                    label="Add to List (optional)"
                    value={bulkListId}
                    onChange={e => setBulkListId((e.target as HTMLSelectElement).value)}
                    options={[{ value: "", label: "No list" }, ...lists.map(l => ({ value: l.id, label: l.name }))]}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
                    <Button type="submit" isLoading={saving}>Import Contacts</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Contacts Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading contacts…
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <Users className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium mb-1">{search || statusFilter ? "No contacts match your filters" : "No contacts yet"}</p>
                  {!search && !statusFilter && (
                    <Button leftIcon={<Plus className="h-4 w-4" />} className="mt-3" onClick={() => setShowCreate(true)}>Add First Contact</Button>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Lists</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Engagement</TableHead>
                        <TableHead className="text-right">Emails</TableHead>
                        <TableHead className="text-right">Added</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <p className="font-medium">{c.firstName || c.lastName ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : c.email}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.email}</p>
                            {c.company && <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.company}</p>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.lists.length === 0 ? (
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                              ) : c.lists.slice(0, 2).map(m => (
                                <Badge key={m.list.id} variant="default">{m.list.name}</Badge>
                              ))}
                              {c.lists.length > 2 && <Badge variant="default">+{c.lists.length - 2}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={STATUS_COLORS[c.status] ?? "default"}>{c.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs text-emerald-400">{c.emailsSent > 0 ? `${((c.emailsOpened / c.emailsSent) * 100).toFixed(0)}% open` : "—"}</span>
                              <span className="text-xs text-blue-400">{c.emailsSent > 0 ? `${((c.emailsClicked / c.emailsSent) * 100).toFixed(0)}% click` : ""}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{c.emailsSent}</TableCell>
                          <TableCell className="text-right text-xs text-[hsl(var(--muted-foreground))]">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {c.status === "ACTIVE" && (
                              <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Pagination */}
                  {total > 50 && (
                    <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-5 py-3">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                        <Button size="sm" variant="outline" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
