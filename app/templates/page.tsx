"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Table";
import { X, Eye, Copy, Mail, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  previewText: string;
  thumbnail: string;
}

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

const CATEGORY_COLORS: Record<string, "default" | "info" | "success" | "warning"> = {
  Onboarding: "info",
  Marketing: "success",
  Newsletter: "default",
  Promotional: "warning",
  Retention: "warning",
  Events: "info",
  Transactional: "default",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showSend, setShowSend] = useState<Template | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [sendForm, setSendForm] = useState({
    contactId: "",
    subject: "",
    fromEmail: "support@kiitconnect.com",
    fromName: "KIIT Connect",
    ctaUrl: "",
    ctaText: "",
    headline: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then(r => r.json()),
      fetch("/api/contacts?limit=200").then(r => r.json()),
    ]).then(([td, cd]) => {
      setTemplates(td.templates || []);
      setContacts(cd.contacts || []);
      setLoading(false);
    });
  }, []);

  const loadPreview = async (id: string) => {
    setPreviewId(id);
    setPreviewLoading(true);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, vars: { firstName: "Ranjit", ctaUrl: "#", ctaText: "Get Started →" } }),
    });
    const d = await res.json();
    setPreviewHtml(d.html || "");
    setPreviewLoading(false);
  };

  const copyHtml = async (id: string) => {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, vars: {} }),
    });
    const d = await res.json();
    await navigator.clipboard.writeText(d.html || "");
    setCopied(id);
    toast.success("HTML copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.contactId) { toast.error("Select a contact"); return; }
    if (!sendForm.subject) { toast.error("Subject is required"); return; }
    const selectedContact = contacts.find(c => c.id === sendForm.contactId);
    setSending(true);
    try {
      const res = await fetch("/api/send-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: sendForm.contactId,
          subject: sendForm.subject,
          fromEmail: sendForm.fromEmail,
          fromName: sendForm.fromName,
          templateId: showSend!.id,
          templateVars: {
            firstName: selectedContact?.firstName || "",
            lastName: selectedContact?.lastName || "",
            ctaUrl: sendForm.ctaUrl || "#",
            ctaText: sendForm.ctaText || "Learn More →",
            headline: sendForm.headline,
          },
        }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`Email queued for ${selectedContact?.email}!`);
        setShowSend(null);
        setSendForm({ contactId: "", subject: "", fromEmail: "support@kiitconnect.com", fromName: "KIIT Connect", ctaUrl: "", ctaText: "", headline: "" });
      } else {
        toast.error(d.error || "Failed to send");
      }
    } finally {
      setSending(false);
    }
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <Header title="Email Templates" description="8 beautiful, ready-to-send email templates" />

          {loading ? (
            <div className="flex items-center justify-center py-24 text-[hsl(var(--muted-foreground))]">Loading templates…</div>
          ) : (
            <>
              {categories.map(cat => (
                <div key={cat} className="mb-10">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                    <span className="h-px flex-1 bg-[hsl(var(--border))]"></span>
                    {cat}
                    <span className="h-px flex-1 bg-[hsl(var(--border))]"></span>
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {templates.filter(t => t.category === cat).map(t => (
                      <div key={t.id} className="group relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:border-[hsl(var(--primary)/0.5)] transition-all hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.05)]">
                        {/* Thumbnail */}
                        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
                          <span className="text-6xl">{t.thumbnail}</span>
                        </div>
                        {/* Info */}
                        <div className="p-4">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm text-[hsl(var(--foreground))]">{t.name}</h3>
                            <Badge variant={CATEGORY_COLORS[t.category] ?? "default"}>{t.category}</Badge>
                          </div>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">{t.description}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => loadPreview(t.id)} className="flex-1">Preview</Button>
                            <Button size="sm" variant="ghost" onClick={() => copyHtml(t.id)}>
                              {copied === t.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <Button size="sm" leftIcon={<Mail className="h-3.5 w-3.5" />} onClick={() => { setShowSend(t); setSendForm(f => ({ ...f, subject: t.previewText.replace(/[👑⚡🎉🔐🚀]/g,"").trim() })); }}>Send</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      {/* Preview Modal */}
      {previewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-full max-w-2xl h-[85vh] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-4 flex-shrink-0">
              <h2 className="font-semibold">{templates.find(t => t.id === previewId)?.name} — Preview</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => copyHtml(previewId)}>Copy HTML</Button>
                <Button size="sm" leftIcon={<Mail className="h-3.5 w-3.5" />} onClick={() => { const t = templates.find(x => x.id === previewId)!; setShowSend(t); setPreviewId(null); }}>Send</Button>
                <button onClick={() => setPreviewId(null)} className="rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-xl">
              {previewLoading ? (
                <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">Loading preview…</div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full bg-white rounded-b-xl"
                  sandbox="allow-same-origin"
                  title="Email Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="w-full max-w-lg rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{showSend.thumbnail}</span>
                <div>
                  <h2 className="font-semibold">Send: {showSend.name}</h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{showSend.description}</p>
                </div>
              </div>
              <button onClick={() => setShowSend(null)} className="rounded-lg p-1.5 hover:bg-[hsl(var(--accent))]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSend} className="p-5 space-y-4">
              <Select
                label="Send to Contact *"
                value={sendForm.contactId}
                onChange={e => setSendForm(f => ({ ...f, contactId: (e.target as HTMLSelectElement).value }))}
                options={[
                  { value: "", label: "Select a contact…" },
                  ...contacts.map(c => ({
                    value: c.id,
                    label: `${c.firstName || ""} ${c.lastName || ""} <${c.email}>`.trim()
                  }))
                ]}
              />
              <Input label="Subject Line *" value={sendForm.subject} onChange={e => setSendForm(f => ({ ...f, subject: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="From Name" value={sendForm.fromName} onChange={e => setSendForm(f => ({ ...f, fromName: e.target.value }))} />
                <Input label="From Email" value={sendForm.fromEmail} onChange={e => setSendForm(f => ({ ...f, fromEmail: e.target.value }))} />
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">Template Variables (optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="CTA URL" placeholder="https://..." value={sendForm.ctaUrl} onChange={e => setSendForm(f => ({ ...f, ctaUrl: e.target.value }))} />
                  <Input label="CTA Button Text" placeholder="Get Started →" value={sendForm.ctaText} onChange={e => setSendForm(f => ({ ...f, ctaText: e.target.value }))} />
                  <div className="col-span-2">
                    <Input label="Headline / Custom Text" placeholder="Custom headline or offer text" value={sendForm.headline} onChange={e => setSendForm(f => ({ ...f, headline: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--accent)/0.5)] p-3 text-xs text-[hsl(var(--muted-foreground))]">
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                DKIM-signed via mail.kiitconnect.com · Open & click tracking included
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowSend(null)}>Cancel</Button>
                <Button type="submit" isLoading={sending} leftIcon={<Mail className="h-4 w-4" />}>Send Email</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
