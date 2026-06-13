"use client";

import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Workflow, Plus } from "lucide-react";

export default function AutomationsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <div className="flex items-start justify-between">
            <Header title="Automations" description="Set up automated email workflows triggered by contact actions" />
            <Button leftIcon={<Plus className="h-4 w-4" />} disabled className="mt-1">New Automation</Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24">
              <Workflow className="h-16 w-16 mb-6 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">Automations Coming Soon</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center max-w-sm">
                Build powerful automated email sequences triggered by welcome events, behavior, time delays, and more.
                The automation engine is ready in the worker — the UI builder is in progress.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
                {["Welcome Series", "Drip Campaigns", "Re-engagement", "Abandoned Cart", "Birthday Emails", "Post-Purchase"].map(t => (
                  <div key={t} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] p-3">{t}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
