"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, RefreshCw, X, ListTree, Users } from "lucide-react";
import { toast } from "sonner";

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  type: string;
  memberCount: number;
  createdAt: string;
  _count: { members: number; campaigns: number };
}

export default function ListsPage() {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lists");
      if (res.ok) {
        const d = await res.json();
        setLists(d.lists || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("List name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("List created!");
        setShowCreate(false);
        setForm({ name: "", description: "" });
        fetchLists();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create list");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this list? Contacts will not be deleted.")) return;
    const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("List deleted"); fetchLists(); }
    else toast.error("Failed to delete list");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header title="Lists" description="Organize your contacts into targeted lists" />
            <div className="flex gap-2 mt-1">
              <Button variant="ghost" size="sm" leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />} onClick={fetchLists}>Refresh</Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>New List</Button>
            </div>
          </div>

          {/* Create Modal */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5">
                  <h2 className="text-lg font-semibold">Create List</h2>
                  <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleCreate} className="p-5 space-y-4">
                  <Input label="List Name *" placeholder="e.g. Newsletter Subscribers" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Description</label>
                    <textarea
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none h-20 resize-none"
                      placeholder="Describe this list…"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button type="submit" isLoading={saving}>Create List</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Lists</p>
              <p className="mt-1 text-3xl font-bold">{lists.length}</p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Contacts</p>
              <p className="mt-1 text-3xl font-bold">{lists.reduce((s, l) => s + l._count.members, 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Campaigns</p>
              <p className="mt-1 text-3xl font-bold">{lists.reduce((s, l) => s + l._count.campaigns, 0)}</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading lists…
                </div>
              ) : lists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                  <ListTree className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium mb-1">No lists yet</p>
                  <p className="text-xs mb-4">Create lists to organize and target your contacts</p>
                  <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>Create First List</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>List Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Contacts</TableHead>
                      <TableHead className="text-right">Campaigns</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                      <TableHead> </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lists.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)]">
                              <ListTree className="h-4 w-4 text-[hsl(var(--primary))]" />
                            </div>
                            <div>
                              <p className="font-medium">{l.name}</p>
                              {l.description && <p className="text-xs text-[hsl(var(--muted-foreground))]">{l.description}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="default">{l.type}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Users className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                            <span className="tabular-nums">{l._count.members.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{l._count.campaigns}</TableCell>
                        <TableCell className="text-right text-xs text-[hsl(var(--muted-foreground))]">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(l.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
