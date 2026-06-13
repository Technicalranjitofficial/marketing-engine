"use client";

import { useState } from "react";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Settings, Mail, Shield, Bell, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [smtp, setSmtp] = useState({
    host: "mail.kiitconnect.com",
    port: "587",
    user: "",
    pass: "",
    fromName: "Marketing Team",
    fromEmail: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Settings are managed via environment variables in Docker
    // This page shows the current config and guides users
    await new Promise(r => setTimeout(r, 500));
    toast.success("Settings noted — update your .env and redeploy to apply changes");
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pl-64">
        <div className="container-wide py-8 max-w-3xl">
          <Header title="Settings" description="Configure your marketing engine" />

          <div className="space-y-6">
            {/* SMTP Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-400" /> SMTP Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="SMTP Host" value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} hint="e.g. mail.yourdomain.com" />
                    <Input label="SMTP Port" value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))} hint="587 (STARTTLS) or 465 (SSL)" />
                    <Input label="SMTP Username" value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))} placeholder="smtp_user@domain.com" />
                    <Input label="SMTP Password" type="password" value={smtp.pass} onChange={e => setSmtp(s => ({ ...s, pass: e.target.value }))} placeholder="••••••••" />
                    <Input label="Default From Name" value={smtp.fromName} onChange={e => setSmtp(s => ({ ...s, fromName: e.target.value }))} />
                    <Input label="Default From Email" value={smtp.fromEmail} onChange={e => setSmtp(s => ({ ...s, fromEmail: e.target.value }))} placeholder="hello@yourdomain.com" />
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                    <p className="font-medium mb-1">ℹ️ Configuration via Environment Variables</p>
                    <p className="text-xs text-amber-200/80">SMTP settings are configured through environment variables in your Docker deployment. Update <code className="bg-black/30 rounded px-1">SMTP_HOST</code>, <code className="bg-black/30 rounded px-1">SMTP_USER</code>, <code className="bg-black/30 rounded px-1">SMTP_PASS</code> in your <code className="bg-black/30 rounded px-1">.env</code> file and restart the containers.</p>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>Save Settings</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Sending Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" /> Sending Limits & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] p-4">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Daily Send Limit</p>
                    <p className="text-2xl font-bold">100,000</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">emails per day</p>
                  </div>
                  <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)] p-4">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Rate Limit</p>
                    <p className="text-2xl font-bold">50</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">emails per second</p>
                  </div>
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Configure via <code className="bg-[hsl(var(--accent))] rounded px-1 py-0.5">SMTP_DAILY_LIMIT</code> and <code className="bg-[hsl(var(--accent))] rounded px-1 py-0.5">SMTP_RATE_LIMIT</code> environment variables.
                </div>
              </CardContent>
            </Card>

            {/* Unsubscribe Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-400" /> Unsubscribe & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-4">
                  <div>
                    <p className="text-sm font-medium">Auto-append unsubscribe link</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Automatically adds {"{{unsubscribeUrl}}"} to all emails</p>
                  </div>
                  <div className="flex h-5 w-9 items-center rounded-full bg-emerald-500 px-0.5">
                    <div className="ml-auto h-4 w-4 rounded-full bg-white shadow" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-4">
                  <div>
                    <p className="text-sm font-medium">Process bounces automatically</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Mark contacts as BOUNCED after hard bounce</p>
                  </div>
                  <div className="flex h-5 w-9 items-center rounded-full bg-emerald-500 px-0.5">
                    <div className="ml-auto h-4 w-4 rounded-full bg-white shadow" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--accent)/0.5)] p-4">
                  <div>
                    <p className="text-sm font-medium">Track email opens & clicks</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Uses pixel tracking and link wrapping</p>
                  </div>
                  <div className="flex h-5 w-9 items-center rounded-full bg-emerald-500 px-0.5">
                    <div className="ml-auto h-4 w-4 rounded-full bg-white shadow" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[hsl(var(--muted-foreground))]" /> System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  {[
                    ["App", "Next.js 15 (standalone)"],
                    ["Database", "PostgreSQL 16"],
                    ["Queue", "BullMQ + Redis 7"],
                    ["Worker", "Node.js 22 (tsx)"],
                    ["SMTP", "mail.kiitconnect.com:587"],
                    ["Deployment", "Docker Compose (VM)"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between rounded-lg bg-[hsl(var(--accent)/0.3)] px-4 py-2">
                      <span className="text-[hsl(var(--muted-foreground))]">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
