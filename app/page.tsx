import { Sidebar, Header } from "@/components/layout/Sidebar";
import { StatCard, MetricCard, ProgressBar } from "@/components/ui/Stats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Mail,
  TrendingUp,
  Zap,
  Plus,
  ArrowRight,
  Send,
  MousePointerClick,
  MailOpen,
} from "lucide-react";
import Link from "next/link";

// This would come from API in real app
const mockStats = {
  overview: {
    contacts: { total: 12543, active: 11892 },
    campaigns: { total: 47, sent: 42 },
    lists: 8,
    automations: { total: 12, active: 7 },
  },
  emailStats: {
    totalSent: 156789,
    totalOpened: 58234,
    totalClicked: 12456,
    openRate: "37.1",
    clickRate: "7.9",
    bounceRate: "1.2",
  },
  recentCampaigns: [
    { id: "1", name: "Welcome Series - Day 1", sentAt: "2024-01-15", totalSent: 1250, openRate: "42.3", clickRate: "8.2" },
    { id: "2", name: "Product Launch Announcement", sentAt: "2024-01-12", totalSent: 8934, openRate: "38.7", clickRate: "11.4" },
    { id: "3", name: "Newsletter #47", sentAt: "2024-01-10", totalSent: 12543, openRate: "35.2", clickRate: "6.8" },
    { id: "4", name: "Flash Sale Alert", sentAt: "2024-01-08", totalSent: 11892, openRate: "45.6", clickRate: "15.2" },
  ],
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 pl-64">
        <div className="container-wide py-8">
          <Header 
            title="Dashboard" 
            description="Overview of your email marketing performance"
          />

          {/* Quick Actions */}
          <div className="mb-8 flex gap-3">
            <Link href="/campaigns/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                New Campaign
              </Button>
            </Link>
            <Link href="/contacts/import">
              <Button variant="outline" leftIcon={<Users className="h-4 w-4" />}>
                Import Contacts
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Contacts"
              value={mockStats.overview.contacts.total.toLocaleString()}
              subtitle={`${mockStats.overview.contacts.active.toLocaleString()} active`}
              icon={Users}
              iconColor="text-blue-400"
              change="+12.5% from last month"
              changeType="positive"
            />
            <StatCard
              title="Campaigns Sent"
              value={mockStats.overview.campaigns.sent}
              subtitle={`${mockStats.overview.campaigns.total} total`}
              icon={Mail}
              iconColor="text-emerald-400"
              change="+3 this week"
              changeType="positive"
            />
            <StatCard
              title="Avg. Open Rate"
              value={`${mockStats.emailStats.openRate}%`}
              icon={MailOpen}
              iconColor="text-purple-400"
              change="+2.3% from last month"
              changeType="positive"
            />
            <StatCard
              title="Active Automations"
              value={mockStats.overview.automations.active}
              subtitle={`${mockStats.overview.automations.total} total`}
              icon={Zap}
              iconColor="text-amber-400"
            />
          </div>

          {/* Email Performance Metrics */}
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <MetricCard
              label="Emails Sent"
              value={mockStats.emailStats.totalSent.toLocaleString()}
              color="blue"
            />
            <MetricCard
              label="Emails Opened"
              value={mockStats.emailStats.totalOpened.toLocaleString()}
              percentage={`${mockStats.emailStats.openRate}%`}
              color="green"
            />
            <MetricCard
              label="Links Clicked"
              value={mockStats.emailStats.totalClicked.toLocaleString()}
              percentage={`${mockStats.emailStats.clickRate}%`}
              color="purple"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Campaigns */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Campaigns</CardTitle>
                <Link href="/campaigns">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Opens</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockStats.recentCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                              {campaign.sentAt}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {campaign.totalSent.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="info">{campaign.openRate}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="success">{campaign.clickRate}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <MailOpen className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium">Open Rate</span>
                  </div>
                  <ProgressBar
                    value={parseFloat(mockStats.emailStats.openRate)}
                    color="green"
                    size="md"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">Click Rate</span>
                  </div>
                  <ProgressBar
                    value={parseFloat(mockStats.emailStats.clickRate)}
                    color="blue"
                    size="md"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium">Bounce Rate</span>
                  </div>
                  <ProgressBar
                    value={parseFloat(mockStats.emailStats.bounceRate)}
                    max={10}
                    color="amber"
                    size="md"
                  />
                </div>

                <div className="pt-4 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">Delivery Rate</span>
                    <span className="font-medium text-emerald-400">98.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
