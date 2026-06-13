import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getQueueStats, isRedisConnected } from "@/lib/queue";

// GET /api/stats - Dashboard statistics
export async function GET() {
  try {
    // Get counts in parallel
    const [
      totalContacts,
      activeContacts,
      totalCampaigns,
      sentCampaigns,
      totalLists,
      totalAutomations,
      activeAutomations,
      recentCampaigns,
      queueStats,
      redisConnected,
    ] = await Promise.all([
      prisma.contact.count(),
      prisma.contact.count({ where: { status: "ACTIVE" } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: "SENT" } }),
      prisma.contactList.count(),
      prisma.automation.count(),
      prisma.automation.count({ where: { status: "ACTIVE" } }),
      prisma.campaign.findMany({
        where: { status: "SENT" },
        orderBy: { sentAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          sentAt: true,
          totalSent: true,
          totalOpened: true,
          totalClicked: true,
        },
      }),
      getQueueStats().catch(() => []),
      isRedisConnected(),
    ]);

    // Calculate overall stats from sent campaigns
    const campaignStats = await prisma.campaign.aggregate({
      where: { status: "SENT" },
      _sum: {
        totalSent: true,
        totalDelivered: true,
        totalOpened: true,
        totalClicked: true,
        totalBounced: true,
        totalUnsubscribed: true,
      },
    });

    const sum = campaignStats._sum;
    const totalSent = sum.totalSent || 0;
    const totalOpened = sum.totalOpened || 0;
    const totalClicked = sum.totalClicked || 0;
    const totalBounced = sum.totalBounced || 0;

    return NextResponse.json({
      overview: {
        contacts: { total: totalContacts, active: activeContacts },
        campaigns: { total: totalCampaigns, sent: sentCampaigns },
        lists: totalLists,
        automations: { total: totalAutomations, active: activeAutomations },
      },
      emailStats: {
        totalSent,
        totalOpened,
        totalClicked,
        totalBounced,
        openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : "0",
        clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : "0",
        bounceRate: totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : "0",
      },
      recentCampaigns: recentCampaigns.map((c) => ({
        ...c,
        openRate: c.totalSent > 0 ? ((c.totalOpened / c.totalSent) * 100).toFixed(1) : "0",
        clickRate: c.totalSent > 0 ? ((c.totalClicked / c.totalSent) * 100).toFixed(1) : "0",
      })),
      system: {
        redisConnected,
        queues: queueStats,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
