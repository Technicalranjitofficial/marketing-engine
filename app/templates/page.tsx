"use client";

import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Plus } from "lucide-react";

const EXAMPLE_TEMPLATES = [
  { name: "Welcome Email", desc: "Greet new subscribers", tag: "Onboarding" },
  { name: "Newsletter", desc: "Regular updates", tag: "Engagement" },
  { name: "Promotional", desc: "Sales and offers", tag: "Marketing" },
  { name: "Transactional", desc: "Order confirmations", tag: "Transactional" },
  { name: "Re-engagement", desc: "Win-back inactive contacts", tag: "Retention" },
  { name: "Event Invite", desc: "Webinar / event announcements", tag: "Events" },
];

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header title="Templates" description="Reusable HTML email templates for your campaigns" />
            <Button leftIcon={<Plus className="h-4 w-4" />} disabled className="mt-1">New Template</Button>
          </div>

          <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
            <p className="font-medium mb-1">💡 Pro tip: Use HTML directly in campaigns</p>
            <p className="text-xs text-blue-200/80">You can paste full HTML content when creating a campaign. Template management UI is coming soon — for now paste HTML with {"{{"}<span>firstName</span>{"}}"} personalisation tags.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLE_TEMPLATES.map(t => (
              <div key={t.name} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 opacity-60">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)]">
                  <FileText className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.desc}</p>
                <span className="mt-2 inline-block rounded-full bg-[hsl(var(--accent))] px-2.5 py-0.5 text-xs">{t.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
